import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startHarness, type Harness } from './testing/pglite-harness.js';

let h: Harness;
beforeAll(async () => {
  h = await startHarness();
}, 120_000);
afterAll(async () => {
  await h?.close();
});
let seq = 0;
async function pair() {
  const a = await h.createUser(`results-a-${++seq}@example.test`);
  const b = await h.createUser(`results-b-${seq}@example.test`);
  await h.db.query(
    `insert into public.friendships (requester_id, addressee_id, status, responded_at) values ($1, $2, 'accepted', now())`,
    [a, b],
  );
  return { a, b };
}
async function call<T>(user: string, query: string, params: unknown[] = []): Promise<T> {
  return h.actAs(
    user,
    async () =>
      (await h.db.query<{ result: T }>(`select ${query} as result`, params)).rows[0]!.result,
  );
}
async function challenge(a: string, b: string, days = 7.5, stat = 'workouts', ranking = 'most') {
  const { rows } = await h.db.query<{ id: string }>(
    `insert into public.friend_challenges
    (challenger_id, opponent_id, stat, ranking, status, starts_at)
    values ($1, $2, $3, $4, 'active', now() - $5 * interval '24 hours') returning id`,
    [a, b, stat, ranking, days],
  );
  return rows[0]!.id;
}
async function workout(user: string, days: number, weight = 60) {
  const { rows: sessions } = await h.db.query<{ id: string }>(
    `insert into public.workout_sessions
    (user_id, started_at, ended_at) values ($1, now() - $2 * interval '24 hours', now()) returning id`,
    [user, days],
  );
  const session = sessions[0]!.id;
  const { rows: exercises } = await h.db.query<{ id: string }>(
    `insert into public.session_exercises
    (user_id, session_id, exercise_id, order_key)
    values ($1, $2, (select id from public.exercises where slug = 'barbell-bench-press'), 'a') returning id`,
    [user, session],
  );
  const { rows: sets } = await h.db.query<{ id: string }>(
    `insert into public.session_sets
    (user_id, session_exercise_id, order_key, set_type, load_type, weight_kg, reps, is_completed, completed_at)
    values ($1, $2, 'a', 'working', 'external', $3, 5, true, now()) returning id`,
    [user, exercises[0]!.id, weight],
  );
  return { session, set: sets[0]!.id };
}
interface Reply {
  challenges: {
    id: string;
    result: null | {
      outcome: string;
      mine: { score: number; amount: number };
      theirs: { score: number };
    };
  }[];
  wins: number;
  losses: number;
  draws: number;
  has_more: boolean;
}
const list = (as: string) => call<Reply>(as, 'public.my_challenges()');
const history = (as: string, filter = 'all', offset = 0) =>
  call<Reply>(as, 'public.challenge_history($1, $2)', [filter, offset]);
const finish = (id: string) =>
  h.db.query(
    `update public.friend_challenges set starts_at = now() - interval '193 hours' where id = $1`,
    [id],
  );

describe('durable challenge results', () => {
  it('starts finalizing at seven elapsed days and locks at eight', async () => {
    const { a, b } = await pair();
    const id = await challenge(a, b, 7);
    expect((await list(a)).challenges[0]!.result).toBeNull();
    await expect(call(a, 'public.acknowledge_challenge($1)', [id])).rejects.toThrow();
    expect((await call<Reply>(a, 'public.claim_challenge_results()')).challenges).toHaveLength(0);
    await h.db.query(
      `update public.friend_challenges set starts_at = now() - interval '192 hours' where id = $1`,
      [id],
    );
    expect((await list(a)).challenges[0]!.result!.outcome).toBe('draw');
    expect((await call<Reply>(a, 'public.claim_challenge_results()')).challenges).toHaveLength(1);
  });
  it('allows 24 hours for uploads, freezes scores before a delayed read, and preserves both perspectives', async () => {
    const { a, b } = await pair();
    const id = await challenge(a, b);
    const mine = await workout(a, 2);
    expect((await list(a)).challenges[0]!.result).toBeNull();
    await workout(a, 3); // late upload, inside the grace window
    await workout(b, 2);
    await finish(id);
    await workout(b, 2); // uploaded after cutoff, must never change the saved result
    await h.db.query(`delete from public.workout_sessions where id = $1`, [mine.session]);
    const result = (await list(a)).challenges[0]!.result;
    expect(result).toMatchObject({ outcome: 'win', mine: { score: 2 }, theirs: { score: 1 } });
    expect((await list(b)).challenges[0]!.result).toMatchObject({
      outcome: 'loss',
      mine: { score: 1 },
      theirs: { score: 2 },
    });
  });

  it('captures set updates, exercise deletion and session completion during the window', async () => {
    const { a, b } = await pair();
    const id = await challenge(a, b, 7.5, 'lifted');
    const w = await workout(a, 2);
    await h.db.query(`update public.session_sets set weight_kg = 80 where id = $1`, [w.set]);
    expect(
      (
        await h.db.query<{ score: { amount: number } }>(
          'select challenger_score as score from public.friend_challenges where id = $1',
          [id],
        )
      ).rows[0]!.score.amount,
    ).toBe(400);
    await finish(id);
    expect((await history(a)).challenges[0]!.result).toMatchObject({
      mine: { amount: 400, score: 400 },
    });
    const second = await challenge(a, b, 7.5, 'sets');
    await h.db.query(`delete from public.session_exercises where session_id = $1`, [w.session]);
    expect(
      (
        await h.db.query<{ score: { score: number } }>(
          'select challenger_score as score from public.friend_challenges where id = $1',
          [second],
        )
      ).rows[0]!.score.score,
    ).toBe(0);
    await finish(second);
    expect((await history(a)).challenges.find((c) => c.id === second)!.result!.mine.score).toBe(0);
  });

  it('keeps acknowledgment separate from an atomic popup claim, and private to each participant', async () => {
    const { a, b } = await pair();
    const outsider = await h.createUser(`outsider-${++seq}@example.test`);
    const id = await challenge(a, b, 9);
    expect((await call<Reply>(a, 'public.claim_challenge_results()')).challenges).toHaveLength(1);
    expect((await call<Reply>(a, 'public.claim_challenge_results()')).challenges).toHaveLength(0);
    expect((await list(a)).challenges).toHaveLength(1);
    expect((await call<Reply>(b, 'public.claim_challenge_results()')).challenges).toHaveLength(1);
    await expect(call(outsider, 'public.acknowledge_challenge($1)', [id])).rejects.toThrow();
    expect((await history(outsider)).challenges).toHaveLength(0);
    await call(a, 'public.acknowledge_challenge($1)', [id]);
    await call(a, 'public.acknowledge_challenge($1)', [id]); // idempotent
    expect((await list(a)).challenges).toHaveLength(0);
    expect((await list(b)).challenges).toHaveLength(1);
    expect((await history(a)).draws).toBe(1);
  });

  it('retains finals after friendship removal, cancels unfinished challenges, and cleans up account deletion', async () => {
    const { a, b } = await pair();
    const final = await challenge(a, b, 30);
    await challenge(a, b, 1);
    await h.db.query(
      `delete from public.friendships where requester_id = $1 and addressee_id = $2`,
      [a, b],
    );
    expect((await list(a)).challenges.map((c) => c.id)).toEqual([final]);
    expect((await history(a)).challenges.map((c) => c.id)).toEqual([final]);
    await h.db.query(`delete from auth.users where id = $1`, [b]);
    expect((await history(a)).challenges).toHaveLength(0);
  });

  it('counts improvement against four elapsed weeks and supports legacy metrics', async () => {
    const { a, b } = await pair();
    await workout(a, 10);
    await workout(b, 10);
    await workout(a, 2);
    await workout(a, 3);
    await workout(b, 2);
    const id = await challenge(a, b, 7.5, 'workouts', 'improved');
    await finish(id);
    expect((await history(a)).challenges[0]!.result).toMatchObject({
      outcome: 'win',
      mine: { score: 800 },
      theirs: { score: 400 },
    });
    const sets = await challenge(a, b, 9, 'sets');
    expect((await history(a)).challenges.find((c) => c.id === sets)!.result!.mine.score).toBe(2);
    const time = await challenge(a, b, 9, 'minutes');
    expect((await history(a)).challenges.find((c) => c.id === time)!.result!.mine.score).toBe(0);
  });

  it('excludes unavailable results from totals and preserves sharing state at cutoff', async () => {
    const { a, b } = await pair();
    const id = await challenge(a, b);
    await h.db.query(
      `update public.friend_profiles set share_training = false where user_id = $1`,
      [b],
    );
    await workout(b, 2);
    const privateScores = await h.actAs(a, () =>
      h.db.query<{ score: { score: number } }>(
        'select opponent_score as score from public.friend_challenges where id = $1',
        [id],
      ),
    );
    expect(privateScores.rows[0]!.score.score).toBe(0);
    await finish(id);
    await h.db.query(`update public.friend_profiles set share_training = true where user_id = $1`, [
      b,
    ]);
    const record = await history(a);
    expect(record.challenges[0]!.result!.outcome).toBe('unavailable');
    expect(record.wins + record.losses + record.draws).toBe(0);
  });

  it('paginates and filters while keeping overall totals', async () => {
    const { a, b } = await pair();
    for (let n = 0; n < 21; n++) await challenge(a, b, 9 + n);
    const first = await history(a);
    expect(first.challenges).toHaveLength(20);
    expect(first.has_more).toBe(true);
    expect(first.draws).toBe(21);
    const second = await history(a, 'draw', 20);
    expect(second.challenges).toHaveLength(1);
    expect(second.has_more).toBe(false);
    expect((await history(a, 'win')).challenges).toHaveLength(0);
    await expect(history(a, 'invalid')).rejects.toThrow();
    await expect(history(a, 'all', -1)).rejects.toThrow();
  });
});
