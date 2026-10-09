import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  FRIEND_CODE_ALPHABET,
  bestLiftsByExercise,
  tallyWorkouts,
  trainingMinutes,
} from '@g7m/core';
import { startHarness, type Harness } from './testing/pglite-harness.js';

/**
 * Friends, against a real Postgres: the codes, the requests, and above all who
 * can see whose training (ADR-0105).
 *
 * The functions are the access control. No policy on the training tables lets
 * one user read another's rows, so everything a friend sees passes through a
 * `security definer` function — and each of those must give a stranger, a
 * pending request and a friend who stopped sharing nothing at all. That is what
 * most of this file checks, function by function.
 */

let h: Harness;

beforeAll(async () => {
  h = await startHarness();
}, 120_000);

afterAll(async () => {
  await h?.close();
});

let sequence = 0;

/** A signed-up user with a name, as the welcome questions leave one. */
async function person(name: string | null): Promise<string> {
  sequence += 1;
  const id = await h.createUser(`friend-${String(sequence)}@example.test`);
  if (name !== null) {
    await h.db.query(`update public.profiles set display_name = $1 where user_id = $2`, [name, id]);
  }
  return id;
}

async function codeOf(user: string): Promise<string> {
  const { rows } = await h.db.query<{ friend_code: string }>(
    `select friend_code from public.friend_profiles where user_id = $1`,
    [user],
  );
  const code = rows[0]?.friend_code;
  if (code === undefined) throw new Error(`No friend code for ${user}`);
  return code;
}

/** Call one of the app's functions as a signed-in user, and return what it returned. */
async function call<T = Record<string, unknown> | null>(
  user: string,
  sql: string,
  params: unknown[] = [],
): Promise<T> {
  return h.actAs(user, async () => {
    const { rows } = await h.db.query<{ result: T }>(`select ${sql} as result`, params);
    return rows[0]?.result as T;
  });
}

const send = (from: string, code: string) =>
  call<{ outcome: string; name?: string | null }>(from, 'public.send_friend_request($1)', [code]);

async function requestId(from: string, to: string): Promise<string> {
  const { rows } = await h.db.query<{ id: string }>(
    `select id from public.friendships where requester_id = $1 and addressee_id = $2`,
    [from, to],
  );
  const id = rows[0]?.id;
  if (id === undefined) throw new Error('No such request');
  return id;
}

const respond = (as: string, id: string, accept: boolean) =>
  call<{ outcome: string }>(as, 'public.respond_to_friend_request($1, $2)', [id, accept]);

/** Two people who are friends, by the front door. */
async function friends(a: string, b: string): Promise<void> {
  expect((await send(a, await codeOf(b))).outcome).toBe('sent');
  expect((await respond(b, await requestId(a, b), true)).outcome).toBe('done');
}

interface LoggedSet {
  readonly slug: string;
  readonly weightKg: number;
  readonly reps?: number;
  readonly setType?: string;
  readonly loadType?: string;
  readonly completed?: boolean;
  readonly durationSeconds?: number;
}

/** A finished workout, written as the superuser: arranging the test, not testing it. */
async function logWorkout(
  user: string,
  startedAt: string,
  sets: readonly LoggedSet[],
  options: { readonly finished?: boolean; readonly name?: string; readonly source?: string } = {},
): Promise<string> {
  const { rows } = await h.db.query<{ id: string }>(
    `insert into public.workout_sessions
       (user_id, name, started_at, ended_at, notes, bodyweight_kg, source)
     values ($1, $2, $3::timestamptz, case when $4 then $3::timestamptz + interval '1 hour' end,
             'private note', 81.5, $5)
     returning id`,
    [user, options.name ?? null, startedAt, options.finished ?? true, options.source ?? 'manual'],
  );
  const session = rows[0]?.id ?? '';
  const slots = new Map<string, string>();
  for (const [index, set] of sets.entries()) {
    let slot = slots.get(set.slug);
    if (slot === undefined) {
      const inserted = await h.db.query<{ id: string }>(
        `insert into public.session_exercises (user_id, session_id, exercise_id, order_key)
         values ($1, $2, (select id from public.exercises where slug = $3), $4) returning id`,
        [user, session, set.slug, `a${String(slots.size)}`],
      );
      slot = inserted.rows[0]?.id ?? '';
      slots.set(set.slug, slot);
    }
    const completed = set.completed ?? true;
    await h.db.query(
      `insert into public.session_sets
         (user_id, session_exercise_id, order_key, set_type, load_type, weight_kg, reps,
          is_completed, completed_at, duration_seconds)
       values ($1, $2, $3, $4, $5, $6, $7, $8,
               case when $8 then $9::timestamptz + make_interval(mins => $10) end, $11)`,
      [
        user,
        slot,
        `a${String(index)}`,
        set.setType ?? 'working',
        set.loadType ?? 'external',
        set.weightKg,
        set.reps ?? 5,
        completed,
        startedAt,
        index * 3,
        set.durationSeconds ?? null,
      ],
    );
  }
  return session;
}

describe('friend codes', () => {
  it('gives every account one at signup, in the agreed alphabet', async () => {
    const id = await person('Ana');
    const code = await codeOf(id);
    expect(code).toHaveLength(6);
    for (const character of code) expect(FRIEND_CODE_ALPHABET).toContain(character);
  });

  it('never gives two accounts the same code', async () => {
    for (let index = 0; index < 20; index += 1) await person(null);
    const { rows } = await h.db.query<{ total: number; distinct: number }>(
      `select count(*)::int as total, count(distinct friend_code)::int as distinct
         from public.friend_profiles`,
    );
    expect(rows[0]?.distinct).toBe(rows[0]?.total);
  });

  it('backfills every account, and running it again changes nothing', async () => {
    // Every account in the harness was created after the migrations ran, so
    // the backfill statement is checked directly: it covers every user, and
    // it never replaces a code somebody already has.
    const before = await h.db.query(
      `select user_id, friend_code from public.friend_profiles order by user_id`,
    );
    await h.db.query(`select public.create_friend_profile(id) from auth.users`);
    const after = await h.db.query(
      `select user_id, friend_code from public.friend_profiles order by user_id`,
    );
    expect(after.rows).toEqual(before.rows);
    const { rows } = await h.db.query(
      `select 1 from auth.users u
        where not exists (select 1 from public.friend_profiles p where p.user_id = u.id)`,
    );
    expect(rows).toHaveLength(0);
  });

  it('refuses a code with a look-alike character in it', async () => {
    const id = await person(null);
    await expect(
      h.db.query(`update public.friend_profiles set friend_code = 'ABC10O' where user_id = $1`, [
        id,
      ]),
    ).rejects.toThrow(/friend_code_check/);
  });
});

describe('the tables themselves', () => {
  it('let you read your own friend profile and nobody else’s', async () => {
    const me = await person('Me');
    await person('Other');
    const rows = await h.actAs(me, async () => {
      const result = await h.db.query<{ user_id: string }>(
        `select user_id from public.friend_profiles`,
      );
      return result.rows.map((row) => row.user_id);
    });
    expect(rows).toEqual([me]);
  });

  it('do not let you change your own code or switch directly', async () => {
    const me = await person('Me');
    const code = await codeOf(me);
    await h.actAs(me, () =>
      h.db.query(
        `update public.friend_profiles set friend_code = 'ZZZZZZ', share_training = false`,
      ),
    );
    const { rows } = await h.db.query<{ friend_code: string; share_training: boolean }>(
      `select friend_code, share_training from public.friend_profiles where user_id = $1`,
      [me],
    );
    expect(rows[0]).toEqual({ friend_code: code, share_training: true });
  });

  it('do not let anybody write a friendship directly', async () => {
    const me = await person('Me');
    const other = await person('Other');
    await expect(
      h.actAs(me, () =>
        h.db.query(
          `insert into public.friendships (requester_id, addressee_id, status, responded_at)
           values ($1, $2, 'accepted', now())`,
          [me, other],
        ),
      ),
    ).rejects.toThrow(/row-level security/i);
  });

  it('do not let a requester accept their own request by updating it', async () => {
    const me = await person('Me');
    const other = await person('Other');
    await send(me, await codeOf(other));
    await h.actAs(me, () =>
      h.db.query(`update public.friendships set status = 'accepted', responded_at = now()`),
    );
    const { rows } = await h.db.query<{ status: string }>(
      `select status from public.friendships where requester_id = $1`,
      [me],
    );
    expect(rows[0]?.status).toBe('pending');
  });

  it('refuse a friendship with yourself, and a pair twice in either direction', async () => {
    const a = await person('A');
    const b = await person('B');
    await expect(
      h.db.query(`insert into public.friendships (requester_id, addressee_id) values ($1, $1)`, [
        a,
      ]),
    ).rejects.toThrow(/friendships_not_yourself/);
    await h.db.query(
      `insert into public.friendships (requester_id, addressee_id) values ($1, $2)`,
      [a, b],
    );
    await expect(
      h.db.query(`insert into public.friendships (requester_id, addressee_id) values ($1, $2)`, [
        a,
        b,
      ]),
    ).rejects.toThrow(/friendships_one_per_pair/);
    await expect(
      h.db.query(`insert into public.friendships (requester_id, addressee_id) values ($1, $2)`, [
        b,
        a,
      ]),
    ).rejects.toThrow(/friendships_one_per_pair/);
  });

  it('are kept out of the PowerSync publication', async () => {
    const { rows } = await h.db.query(
      `select 1 from pg_publication_tables
        where pubname = 'powersync'
          and tablename in ('friend_challenges', 'friend_profiles', 'friendships')`,
    );
    expect(rows).toHaveLength(0);
  });
});

describe('sending a request', () => {
  it('finds the person by code, however it was typed, and says who it went to', async () => {
    const me = await person('Me');
    const alex = await person('Alex');
    const code = await codeOf(alex);
    const typed = `${code.slice(0, 3).toLowerCase()} - ${code.slice(3)}`;
    expect(await send(me, typed)).toEqual({ outcome: 'sent', name: 'Alex' });
  });

  it('says plainly when the code is yours, unknown or malformed', async () => {
    const me = await person('Me');
    expect((await send(me, await codeOf(me))).outcome).toBe('own_code');
    expect((await send(me, '222222')).outcome).toBe('unknown');
    expect((await send(me, 'nope')).outcome).toBe('invalid');
  });

  it('does not send the same request twice', async () => {
    const me = await person('Me');
    const alex = await person('Alex');
    await send(me, await codeOf(alex));
    expect(await send(me, await codeOf(alex))).toEqual({
      outcome: 'already_requested',
      name: 'Alex',
    });
    const { rows } = await h.db.query(`select 1 from public.friendships where requester_id = $1`, [
      me,
    ]);
    expect(rows).toHaveLength(1);
  });

  it('turns a request back into a friendship rather than a second request', async () => {
    const me = await person('Me');
    const alex = await person('Alex');
    await send(alex, await codeOf(me));
    expect(await send(me, await codeOf(alex))).toEqual({ outcome: 'now_friends', name: 'Alex' });
    expect((await send(me, await codeOf(alex))).outcome).toBe('already_friends');
    const { rows } = await h.db.query<{ status: string }>(
      `select status from public.friendships where $1 in (requester_id, addressee_id)`,
      [me],
    );
    expect(rows).toEqual([{ status: 'accepted' }]);
  });

  it('never tells somebody they were declined', async () => {
    const me = await person('Me');
    const alex = await person('Alex');
    await send(me, await codeOf(alex));
    await respond(alex, await requestId(me, alex), false);
    expect((await send(me, await codeOf(alex))).outcome).toBe('already_requested');
  });

  it('lets the person who declined change their mind and ask', async () => {
    const me = await person('Me');
    const alex = await person('Alex');
    await send(me, await codeOf(alex));
    await respond(alex, await requestId(me, alex), false);
    expect((await send(alex, await codeOf(me))).outcome).toBe('sent');
    expect((await respond(me, await requestId(alex, me), true)).outcome).toBe('done');
  });

  it('stops at twenty an hour', async () => {
    const me = await person('Me');
    for (let index = 0; index < 20; index += 1) {
      const other = await person(`Other ${String(index)}`);
      expect((await send(me, await codeOf(other))).outcome).toBe('sent');
    }
    const one = await person('One too many');
    expect((await send(me, await codeOf(one))).outcome).toBe('too_many');
    // The trigger holds the line even for a write that skips the function.
    await expect(
      h.db.query(`insert into public.friendships (requester_id, addressee_id) values ($1, $2)`, [
        me,
        one,
      ]),
    ).rejects.toThrow(/Too many friend requests/);
  });

  it('cannot be called signed out', async () => {
    await h.db.exec(`set role anon`);
    try {
      await expect(h.db.query(`select public.send_friend_request('ABCDEF')`)).rejects.toThrow(
        /permission denied/i,
      );
    } finally {
      await h.db.exec(`reset role`);
    }
  });
});

describe('answering a request', () => {
  it('can only be done by the person it was sent to, and only once', async () => {
    const me = await person('Me');
    const alex = await person('Alex');
    const stranger = await person('Stranger');
    await send(me, await codeOf(alex));
    const id = await requestId(me, alex);

    expect((await respond(stranger, id, true)).outcome).toBe('not_found');
    expect((await respond(me, id, true)).outcome).toBe('not_found');
    const { rows } = await h.db.query<{ status: string }>(
      `select status from public.friendships where id = $1`,
      [id],
    );
    expect(rows[0]?.status).toBe('pending');

    expect((await respond(alex, id, true)).outcome).toBe('done');
    expect((await respond(alex, id, false)).outcome).toBe('not_found');
  });
});

describe('what a friend can see', () => {
  /** Somebody with training worth hiding: a workout, a goal, a weigh-in. */
  async function lifter(name: string): Promise<{ id: string; session: string }> {
    const id = await person(name);
    await h.db.query(
      `insert into public.training_goals (user_id, goal, days_per_week)
       values ($1, 'get_stronger', 4)`,
      [id],
    );
    await h.db.query(`insert into public.body_metrics (user_id, weight_kg) values ($1, 81.5)`, [
      id,
    ]);
    const session = await logWorkout(
      id,
      new Date(Date.now() - 2 * 3600_000).toISOString(),
      [
        { slug: 'barbell-bench-press', weightKg: 60, setType: 'warmup' },
        { slug: 'barbell-bench-press', weightKg: 100 },
        { slug: 'barbell-bench-press', weightKg: 102.5, reps: 3 },
        { slug: 'barbell-back-squat', weightKg: 140 },
      ],
      { name: 'Heavy day' },
    );
    return { id, session };
  }

  const NOTHING = { inOverview: null, onBoard: null, detail: null, session: null };

  /** Every friend function, as `viewer`, about `other`. */
  async function everything(viewer: string, other: string, session: string) {
    const overview = await call<{ friends: { user_id: string }[] }>(
      viewer,
      'public.friends_overview()',
    );
    const board = await call<{ friends: { user_id: string }[] }>(
      viewer,
      'public.friends_leaderboard($1)',
      [new Date(Date.now() - 7 * 86_400_000).toISOString()],
    );
    return {
      inOverview: overview.friends.find((friend) => friend.user_id === other) ?? null,
      onBoard: board.friends.find((friend) => friend.user_id === other) ?? null,
      detail: await call(viewer, 'public.friend_detail($1)', [other]),
      session: await call(viewer, 'public.friend_session($1, $2)', [other, session]),
    };
  }

  it('gives a stranger nothing from any function', async () => {
    const alex = await lifter('Alex');
    const stranger = await person('Stranger');
    expect(await everything(stranger, alex.id, alex.session)).toEqual(NOTHING);
  });

  it('gives somebody with only a pending request nothing, in either direction', async () => {
    const alex = await lifter('Alex');
    const asker = await person('Asker');
    await send(asker, await codeOf(alex.id));
    expect(await everything(asker, alex.id, alex.session)).toEqual(NOTHING);
    expect(await everything(alex.id, asker, alex.session)).toEqual(NOTHING);

    const back = await lifter('Back');
    await send(back.id, await codeOf(asker));
    expect(await everything(asker, back.id, back.session)).toEqual(NOTHING);
  });

  it('gives a declined requester nothing', async () => {
    const alex = await lifter('Alex');
    const asker = await person('Asker');
    await send(asker, await codeOf(alex.id));
    await respond(alex.id, await requestId(asker, alex.id), false);
    expect(await everything(asker, alex.id, alex.session)).toEqual(NOTHING);
  });

  it('gives a friend who stopped sharing their name and nothing else', async () => {
    const alex = await lifter('Alex');
    const me = await person('Me');
    await friends(me, alex.id);
    expect(await call(alex.id, 'public.set_training_sharing(false)')).toEqual({ sharing: false });

    const seen = await everything(me, alex.id, alex.session);
    expect(seen.detail).toBeNull();
    expect(seen.session).toBeNull();
    expect(seen.inOverview).toEqual({
      user_id: alex.id,
      name: 'Alex',
      since: expect.any(String) as unknown,
      sharing: false,
    });
    expect(seen.onBoard).toEqual({ user_id: alex.id, name: 'Alex', sharing: false });

    // Turning it back on is all it takes.
    await call(alex.id, 'public.set_training_sharing(true)');
    expect(await call(me, 'public.friend_detail($1)', [alex.id])).not.toBeNull();
  });

  it('gives a friend who shares, and only the fields the screens need', async () => {
    const alex = await lifter('Alex');
    const me = await person('Me');
    await friends(me, alex.id);
    await call(alex.id, 'public.touch_last_active()');

    const seen = await everything(me, alex.id, alex.session);
    const card = seen.inOverview as unknown as {
      training: Record<string, unknown> & { big_three: { slug: string; best_kg: number }[] };
    };
    expect(Object.keys(card).sort()).toEqual(['name', 'sharing', 'since', 'training', 'user_id']);
    expect(Object.keys(card.training).sort()).toEqual([
      'big_three',
      'days_per_week',
      'last_active_at',
      'last_workout',
      'trained_at',
    ]);
    expect(card.training['days_per_week']).toBe(4);
    expect(card.training['last_active_at']).not.toBeNull();
    expect(card.training.big_three).toEqual(
      expect.arrayContaining([
        { slug: 'barbell-bench-press', best_kg: 102.5 },
        { slug: 'barbell-back-squat', best_kg: 140 },
      ]),
    );

    // Nothing anywhere in the replies about a body, an email, a goal or a note.
    const everythingSaid = JSON.stringify(seen);
    for (const secret of [
      '81.5',
      'example.test',
      'private note',
      'bodyweight',
      'email',
      'get_stronger',
    ]) {
      expect(everythingSaid).not.toContain(secret);
    }

    const session = seen.session as { name: string; exercises: { sets: unknown[] }[] };
    expect(session.name).toBe('Heavy day');
    expect(session.exercises.map((exercise) => exercise.sets.length)).toEqual([3, 1]);
  });

  it('shows the friendship from both sides', async () => {
    const alex = await lifter('Alex');
    const me = await lifter('Me');
    await friends(me.id, alex.id);
    expect(await call(alex.id, 'public.friend_detail($1)', [me.id])).not.toBeNull();
    expect(await call(me.id, 'public.friend_detail($1)', [alex.id])).not.toBeNull();
  });

  it('never returns a workout still in progress, or one that is not theirs', async () => {
    const alex = await lifter('Alex');
    const me = await lifter('Me');
    await friends(me.id, alex.id);
    const open = await logWorkout(
      alex.id,
      new Date().toISOString(),
      [{ slug: 'barbell-bench-press', weightKg: 100 }],
      { finished: false },
    );
    expect(await call(me.id, 'public.friend_session($1, $2)', [alex.id, open])).toBeNull();
    // My own session, asked for as if it were Alex's.
    expect(await call(me.id, 'public.friend_session($1, $2)', [alex.id, me.session])).toBeNull();
  });

  it('ends for both when either removes the other', async () => {
    const alex = await lifter('Alex');
    const me = await person('Me');
    await friends(me, alex.id);
    expect(await call(alex.id, 'public.remove_friend($1)', [me])).toEqual({ outcome: 'done' });
    expect(await everything(me, alex.id, alex.session)).toEqual(NOTHING);
    // And either can start again.
    expect((await send(me, await codeOf(alex.id))).outcome).toBe('sent');
  });

  it('lists the requests waiting for you, and not the ones you sent', async () => {
    const me = await person('Me');
    const jordan = await person('Jordan');
    const sam = await person('Sam');
    await send(jordan, await codeOf(me));
    await send(me, await codeOf(sam));
    const overview = await call<{ requests: { user_id: string; name: string }[] }>(
      me,
      'public.friends_overview()',
    );
    expect(overview.requests.map((request) => request.name)).toEqual(['Jordan']);
  });

  it('keeps the helper functions out of reach', async () => {
    const me = await person('Me');
    const alex = await lifter('Alex');
    for (const sql of [
      `public.training_summary('${alex.id}')`,
      `public.best_lifts('${alex.id}')`,
      `public.board_workouts('${alex.id}', now() - interval '1 year')`,
      `public.shares_training_with('${me}', '${alex.id}')`,
      `public.create_friend_profile('${me}')`,
    ]) {
      await expect(call(me, sql), sql).rejects.toThrow(/permission denied/i);
    }
  });
});

describe('presence', () => {
  it('records the app being open, at most every two minutes', async () => {
    const me = await person('Me');
    const read = async () =>
      (
        await h.db.query<{ last_active_at: Date | null }>(
          `select last_active_at from public.friend_profiles where user_id = $1`,
          [me],
        )
      ).rows[0]?.last_active_at ?? null;

    expect(await read()).toBeNull();
    await call(me, 'public.touch_last_active()');
    const first = await read();
    expect(first).not.toBeNull();

    await call(me, 'public.touch_last_active()');
    expect(await read()).toEqual(first);
  });
});

describe('best lifts', () => {
  it('match the rule the phone uses for its own history', async () => {
    const me = await person('Me');
    await logWorkout(me, '2026-10-01T10:00:00Z', [
      { slug: 'barbell-bench-press', weightKg: 100 },
      { slug: 'barbell-bench-press', weightKg: 140, setType: 'warmup' },
      { slug: 'barbell-bench-press', weightKg: 150, completed: false },
      { slug: 'barbell-bench-press', weightKg: 105, setType: 'amrap' },
      { slug: 'barbell-back-squat', weightKg: 120 },
      { slug: 'pull-up', weightKg: 20, loadType: 'bodyweight_plus' },
      { slug: 'push-up', weightKg: 0, loadType: 'bodyweight' },
    ]);
    await logWorkout(me, '2026-10-03T10:00:00Z', [{ slug: 'barbell-back-squat', weightKg: 125 }]);
    // An unfinished workout does not count on either side.
    await logWorkout(me, '2026-10-05T10:00:00Z', [{ slug: 'barbell-back-squat', weightKg: 200 }], {
      finished: false,
    });

    const server = await h.db.query<{ slug: string; best_kg: string }>(
      `select e.slug, b.best_kg from public.best_lifts($1) b
         join public.exercises e on e.id = b.exercise_id order by e.slug`,
      [me],
    );

    const { rows: history } = await h.db.query<{
      slug: string;
      set_type: 'working';
      load_type: 'external';
      weight_kg: string;
      is_completed: boolean;
      started_at: Date;
    }>(
      `select e.slug, ss.set_type, ss.load_type, ss.weight_kg, ss.is_completed, ws.started_at
         from public.session_sets ss
         join public.session_exercises se on se.id = ss.session_exercise_id
         join public.workout_sessions ws on ws.id = se.session_id
         join public.exercises e on e.id = se.exercise_id
        where ss.user_id = $1 and ws.ended_at is not null`,
      [me],
    );
    const device = bestLiftsByExercise(
      history.map((row) => ({
        exerciseId: row.slug,
        setType: row.set_type,
        loadType: row.load_type,
        weightKg: Number(row.weight_kg),
        isCompleted: row.is_completed,
        performedAt: new Date(row.started_at),
      })),
    );

    const fromServer = Object.fromEntries(
      server.rows.map((row) => [row.slug, Number(row.best_kg)]),
    );
    const fromDevice = Object.fromEntries(
      [...device.entries()].map(([slug, best]) => [slug, best.bestKg]),
    );
    expect(fromServer).toEqual(fromDevice);
    expect(fromServer).toEqual({ 'barbell-back-squat': 125, 'barbell-bench-press': 105 });
  });
});

describe('the leaderboard', () => {
  interface Tally {
    started_at: string;
    source: string;
    first_set_at: string | null;
    last_set_at: string | null;
    sets: number;
    lifted_kg: number;
  }
  interface Board {
    friends: { user_id: string; name: string; sharing: boolean; workouts?: Tally[] }[];
  }

  const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

  it('sends a friend’s superset, and counts their drops as part of a set', async () => {
    const me = await person('Me');
    const alex = await person('Alex');
    await friends(me, alex);
    const session = await logWorkout(alex, daysAgo(1), [
      { slug: 'barbell-bench-press', weightKg: 100 },
      { slug: 'barbell-bench-press', weightKg: 80, reps: 8, setType: 'dropset' },
      { slug: 'pull-up', weightKg: 0, reps: 8, loadType: 'bodyweight' },
    ]);
    const group = '6f1c2b8e-7d3a-4c5b-9e1f-0a2b3c4d5e6f';
    await h.db.query('update public.session_exercises set superset_id = $1 where session_id = $2', [
      group,
      session,
    ]);

    const detail = await call<{
      work: { exercise_id: string; sets: number }[];
      exercises: { superset_id: string | null; sets: { set_type: string }[] }[];
    }>(me, 'public.friend_session($1, $2)', [alex, session]);
    expect(detail.exercises.map((exercise) => exercise.superset_id)).toEqual([group, group]);
    // The drop is sent, as a drop, and the title's count is one bench set.
    expect(detail.exercises[0]?.sets.map((set) => set.set_type)).toEqual(['working', 'dropset']);
    expect(detail.work.map((exercise) => exercise.sets)).toEqual([1, 1]);
  });

  it('counts a friend’s workouts by the rule the phone uses for its own', async () => {
    const me = await person('Me');
    const alex = await person('Alex');
    await friends(me, alex);

    await logWorkout(alex, daysAgo(2), [
      { slug: 'barbell-bench-press', weightKg: 100 },
      // A drop off the bench: its 640 kg is lifted, but it is not another set.
      { slug: 'barbell-bench-press', weightKg: 80, reps: 8, setType: 'dropset' },
      { slug: 'barbell-bench-press', weightKg: 60, reps: 8, setType: 'warmup' },
      { slug: 'barbell-bench-press', weightKg: 150, reps: 1, completed: false },
      { slug: 'barbell-back-squat', weightKg: 120, setType: 'amrap' },
      { slug: 'pull-up', weightKg: 20, loadType: 'bodyweight_plus' },
      { slug: 'pull-up', weightKg: 0, reps: 8, loadType: 'bodyweight' },
      { slug: 'pull-up', weightKg: 30, reps: 6, loadType: 'assisted' },
      { slug: 'treadmill', weightKg: 0, reps: 0, durationSeconds: 600 },
    ]);
    // A single half-hour bout: no sets, no weight, and thirty minutes of training.
    await logWorkout(alex, daysAgo(3), [
      { slug: 'treadmill', weightKg: 0, reps: 0, durationSeconds: 1800 },
    ]);
    await logWorkout(alex, daysAgo(4), [{ slug: 'barbell-back-squat', weightKg: 100 }], {
      source: 'past',
    });
    // None of these is a workout on the board.
    await logWorkout(alex, daysAgo(1), [{ slug: 'barbell-back-squat', weightKg: 200 }], {
      finished: false,
    });
    await logWorkout(alex, daysAgo(1), [
      { slug: 'barbell-back-squat', weightKg: 60, setType: 'warmup' },
    ]);

    const board = await call<Board>(me, 'public.friends_leaderboard($1)', [daysAgo(30)]);
    const workouts = board.friends[0]?.workouts ?? [];
    expect(workouts.map((tally) => [tally.source, tally.sets, tally.lifted_kg])).toEqual([
      ['past', 1, 500],
      ['manual', 0, 0],
      ['manual', 5, 1840],
    ]);
    const minutes = (tally: Tally | undefined) =>
      trainingMinutes([
        tally?.first_set_at == null ? null : new Date(tally.first_set_at),
        tally?.last_set_at == null ? null : new Date(tally.last_set_at),
      ]);
    expect(minutes(workouts[1])).toBe(30);

    // And every row of Alex's through the phone's rule, as the phone reads its own.
    const { rows } = await h.db.query<{
      session_id: string;
      started_at: Date;
      source: string;
      set_type: 'working';
      load_type: 'external';
      weight_kg: string;
      reps: number;
      is_completed: boolean;
      completed_at: Date | null;
      duration_seconds: number | null;
      cardio_kind: string | null;
    }>(
      `select ws.id as session_id, ws.started_at, ws.source, ss.set_type, ss.load_type,
              ss.weight_kg, ss.reps, ss.is_completed, ss.completed_at, ss.duration_seconds,
              e.cardio_kind
         from public.session_sets ss
         join public.session_exercises se on se.id = ss.session_exercise_id
         join public.workout_sessions ws on ws.id = se.session_id
         join public.exercises e on e.id = se.exercise_id
        where ss.user_id = $1 and ws.ended_at is not null
        order by ws.started_at`,
      [alex],
    );
    const device = tallyWorkouts(
      rows.map((row) => ({
        sessionId: row.session_id,
        startedAt: new Date(row.started_at),
        clockKnown: row.source !== 'past',
        setType: row.set_type,
        loadType: row.load_type,
        weightKg: Number(row.weight_kg),
        reps: row.reps,
        isCompleted: row.is_completed,
        completedAt: row.completed_at === null ? null : new Date(row.completed_at),
        durationSeconds: row.duration_seconds,
        cardio: row.cardio_kind !== null,
      })),
    );
    expect(
      workouts.map((tally) => ({
        startedAt: new Date(tally.started_at),
        clockKnown: tally.source !== 'past',
        firstSetAt: tally.first_set_at === null ? null : new Date(tally.first_set_at),
        lastSetAt: tally.last_set_at === null ? null : new Date(tally.last_set_at),
        sets: tally.sets,
        liftedKg: tally.lifted_kg,
      })),
    ).toEqual(device);
  });

  it('sends nothing older than the month before last, whatever is asked for', async () => {
    const me = await person('Me');
    const alex = await person('Alex');
    await friends(me, alex);
    await logWorkout(alex, daysAgo(100), [{ slug: 'barbell-back-squat', weightKg: 100 }]);
    // Always inside the month before last or later: Most improved's four weeks reach this far.
    await logWorkout(alex, daysAgo(50), [{ slug: 'barbell-back-squat', weightKg: 100 }]);
    await logWorkout(alex, daysAgo(2), [{ slug: 'barbell-back-squat', weightKg: 100 }]);

    const board = await call<Board>(me, 'public.friends_leaderboard($1)', [daysAgo(365)]);
    expect(board.friends[0]?.workouts).toHaveLength(2);
  });

  it('lists every friend, sharing or not, and never you', async () => {
    const me = await person('Me');
    const alex = await person('Alex');
    const sam = await person('Sam');
    await friends(me, alex);
    await friends(sam, me);
    await call(sam, 'public.set_training_sharing(false)');
    await logWorkout(me, daysAgo(1), [{ slug: 'barbell-back-squat', weightKg: 100 }]);

    const board = await call<Board>(me, 'public.friends_leaderboard($1)', [daysAgo(30)]);
    expect(board.friends).toEqual([
      { user_id: alex, name: 'Alex', sharing: true, workouts: [] },
      { user_id: sam, name: 'Sam', sharing: false },
    ]);
  });
});

describe('challenges', () => {
  interface Challenge {
    id: string;
    friend_id: string;
    name: string;
    sent_by_me: boolean;
    stat: string;
    ranking: string;
    status: string;
    sent_at: string;
    starts_at: string | null;
    sharing: boolean;
    workouts?: { started_at: string }[];
  }

  const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();
  const challenge = (from: string, to: string, stat = 'sets', ranking = 'most') =>
    call<{ outcome: string; name?: string }>(from, 'public.send_challenge($1, $2, $3)', [
      to,
      stat,
      ranking,
    ]);
  const answer = (as: string, id: string, accept: boolean) =>
    call<{ outcome: string }>(as, 'public.respond_to_challenge($1, $2)', [id, accept]);
  const challengesOf = async (user: string) =>
    (await call<{ challenges: Challenge[] }>(user, 'public.my_challenges()')).challenges;
  const onlyId = async (user: string) => {
    const [first] = await challengesOf(user);
    if (first === undefined) throw new Error('No challenge');
    return first.id;
  };

  it('waits for an answer, then runs from the moment it is accepted', async () => {
    const me = await person('Me');
    const alex = await person('Alex');
    await friends(me, alex);
    expect(await challenge(me, alex)).toEqual({ outcome: 'sent', name: 'Alex' });

    const [mine] = await challengesOf(me);
    expect(mine).toMatchObject({
      friend_id: alex,
      name: 'Alex',
      sent_by_me: true,
      stat: 'sets',
      ranking: 'most',
      status: 'pending',
      starts_at: null,
      sharing: true,
    });
    expect(mine?.workouts).toBeUndefined();
    const [theirs] = await challengesOf(alex);
    expect(theirs).toMatchObject({ friend_id: me, name: 'Me', sent_by_me: false });

    expect((await answer(alex, await onlyId(alex), true)).outcome).toBe('started');
    const [running] = await challengesOf(me);
    expect(running?.status).toBe('active');
    expect(Math.abs(new Date(running?.starts_at ?? 0).getTime() - Date.now())).toBeLessThan(60_000);
  });

  it('sends the friend’s workouts from four weeks before it began to its end', async () => {
    const me = await person('Me');
    const alex = await person('Alex');
    await friends(me, alex);
    await logWorkout(alex, daysAgo(40), [{ slug: 'barbell-back-squat', weightKg: 100 }]);
    await logWorkout(alex, daysAgo(20), [{ slug: 'barbell-back-squat', weightKg: 100 }]);
    await logWorkout(me, daysAgo(10), [{ slug: 'barbell-back-squat', weightKg: 100 }]);
    await challenge(me, alex, 'workouts', 'improved');
    expect((await answer(alex, await onlyId(alex), true)).outcome).toBe('started');
    await logWorkout(alex, new Date(Date.now() + 60_000).toISOString(), [
      { slug: 'barbell-back-squat', weightKg: 100 },
    ]);
    await logWorkout(alex, new Date(Date.now() + 8 * 86_400_000).toISOString(), [
      { slug: 'barbell-back-squat', weightKg: 100 },
    ]);

    // Twenty days ago and just now: not forty days ago, and not after it ended.
    const [running] = await challengesOf(me);
    expect(running?.workouts).toHaveLength(2);
  });

  it('is one at a time between two people, whichever of them sends it', async () => {
    const me = await person('Me');
    const alex = await person('Alex');
    const sam = await person('Sam');
    await friends(me, alex);
    await friends(me, sam);
    expect((await challenge(me, alex)).outcome).toBe('sent');
    expect((await challenge(me, alex, 'workouts')).outcome).toBe('already_live');
    expect((await challenge(alex, me)).outcome).toBe('already_live');
    // Another friend is another pair.
    expect((await challenge(me, sam)).outcome).toBe('sent');

    await answer(alex, await onlyId(alex), true);
    expect((await challenge(alex, me)).outcome).toBe('already_live');

    // Seven days on, it is over and another can start.
    await h.db.query(
      `update public.friend_challenges set starts_at = now() - interval '7 days 1 minute'
        where challenger_id = $1 and opponent_id = $2`,
      [me, alex],
    );
    expect((await challenge(alex, me)).outcome).toBe('sent');
  });

  it('can be taken back by the challenger while it waits, and by nobody else', async () => {
    const me = await person('Me');
    const alex = await person('Alex');
    await friends(me, alex);
    await challenge(me, alex);
    const id = await onlyId(me);
    const withdraw = (as: string) =>
      call<{ outcome: string }>(as, 'public.withdraw_challenge($1)', [id]);

    expect((await withdraw(alex)).outcome).toBe('not_found');
    expect((await withdraw(me)).outcome).toBe('done');
    expect(await challengesOf(me)).toEqual([]);
    expect(await challengesOf(alex)).toEqual([]);
    expect((await challenge(me, alex)).outcome).toBe('sent');
  });

  it('can only be answered by the person challenged, and a no removes it', async () => {
    const me = await person('Me');
    const alex = await person('Alex');
    const stranger = await person('Stranger');
    await friends(me, alex);
    await challenge(me, alex);
    const id = await onlyId(me);

    expect((await answer(me, id, true)).outcome).toBe('not_found');
    expect((await answer(stranger, id, true)).outcome).toBe('not_found');
    expect((await answer(alex, id, false)).outcome).toBe('declined');
    expect(await challengesOf(me)).toEqual([]);
    expect((await answer(alex, id, true)).outcome).toBe('not_found');
  });

  it('lapses when nobody answers it for seven days', async () => {
    const me = await person('Me');
    const alex = await person('Alex');
    await friends(me, alex);
    await challenge(me, alex);
    const id = await onlyId(me);
    await h.db.query(
      `update public.friend_challenges set sent_at = now() - interval '8 days' where id = $1`,
      [id],
    );

    expect(await challengesOf(alex)).toEqual([]);
    expect((await answer(alex, id, true)).outcome).toBe('not_found');
    expect((await challenge(me, alex)).outcome).toBe('sent');
  });

  it('is between friends who both share their training', async () => {
    const me = await person('Me');
    const alex = await person('Alex');
    const stranger = await person('Stranger');
    await friends(me, alex);

    expect((await challenge(me, stranger)).outcome).toBe('not_friends');
    expect((await challenge(me, me)).outcome).toBe('not_friends');

    await call(alex, 'public.set_training_sharing(false)');
    expect(await challenge(me, alex)).toEqual({ outcome: 'not_sharing', name: 'Alex' });
    await call(alex, 'public.set_training_sharing(true)');
    await call(me, 'public.set_training_sharing(false)');
    expect((await challenge(me, alex)).outcome).toBe('you_not_sharing');

    // Accepting checks again: sharing can change while a challenge waits.
    await call(me, 'public.set_training_sharing(true)');
    await challenge(me, alex);
    await call(alex, 'public.set_training_sharing(false)');
    expect((await answer(alex, await onlyId(alex), true)).outcome).toBe('you_not_sharing');
  });

  it('needs four weeks of training on both sides to be won on improvement', async () => {
    const me = await person('Me');
    const alex = await person('Alex');
    await friends(me, alex);
    expect((await challenge(me, alex, 'sets', 'improved')).outcome).toBe('you_no_usual');
    await logWorkout(me, daysAgo(10), [{ slug: 'barbell-back-squat', weightKg: 100 }]);
    expect((await challenge(me, alex, 'sets', 'improved')).outcome).toBe('no_usual');
    // A workout older than four weeks is no usual.
    await logWorkout(alex, daysAgo(30), [{ slug: 'barbell-back-squat', weightKg: 100 }]);
    expect((await challenge(me, alex, 'sets', 'improved')).outcome).toBe('no_usual');
    await logWorkout(alex, daysAgo(3), [{ slug: 'barbell-back-squat', weightKg: 100 }]);
    expect((await challenge(me, alex, 'sets', 'improved')).outcome).toBe('sent');
  });

  it('refuses a stat or a ranking it does not know', async () => {
    const me = await person('Me');
    const alex = await person('Alex');
    await friends(me, alex);
    expect((await challenge(me, alex, 'reps')).outcome).toBe('invalid');
    expect((await challenge(me, alex, 'sets', 'loudest')).outcome).toBe('invalid');
  });

  it('stops sending a friend’s workouts once they stop sharing', async () => {
    const me = await person('Me');
    const alex = await person('Alex');
    await friends(me, alex);
    await challenge(me, alex);
    await answer(alex, await onlyId(alex), true);
    await call(alex, 'public.set_training_sharing(false)');

    const [running] = await challengesOf(me);
    expect(running).toMatchObject({ status: 'active', sharing: false });
    expect(running?.workouts).toBeUndefined();
  });

  it('ends when the friendship does', async () => {
    const me = await person('Me');
    const alex = await person('Alex');
    await friends(me, alex);
    await challenge(me, alex);
    await call(alex, 'public.remove_friend($1)', [me]);

    const { rows } = await h.db.query(
      `select 1 from public.friend_challenges where $1 in (challenger_id, opponent_id)`,
      [me],
    );
    expect(rows).toHaveLength(0);
  });

  it('cannot be written directly, or accepted by the challenger', async () => {
    const me = await person('Me');
    const alex = await person('Alex');
    await friends(me, alex);
    await expect(
      h.actAs(me, () =>
        h.db.query(
          `insert into public.friend_challenges (challenger_id, opponent_id, stat, ranking)
           values ($1, $2, 'sets', 'most')`,
          [me, alex],
        ),
      ),
    ).rejects.toThrow(/row-level security/i);

    await challenge(me, alex);
    await h.actAs(me, () =>
      h.db.query(`update public.friend_challenges set status = 'active', starts_at = now()`),
    );
    const [waiting] = await challengesOf(me);
    expect(waiting?.status).toBe('pending');
  });

  it('keeps its helpers out of reach', async () => {
    const me = await person('Me');
    const alex = await person('Alex');
    for (const sql of [
      `public.has_usual('${alex}')`,
      `public.lock_friendship('${me}', '${alex}')`,
      `public.challenge_blocked('${me}', '${alex}', 'most')`,
    ]) {
      await expect(call(me, sql), sql).rejects.toThrow(/permission denied/i);
    }
  });
});

describe('deleting an account', () => {
  it('takes its code, its friendships and its requests with it', async () => {
    const leaving = await person('Leaving');
    const friend = await person('Friend');
    const asked = await person('Asked');
    await friends(leaving, friend);
    await send(leaving, await codeOf(asked));

    await h.actAs(leaving, () => h.db.query(`select public.delete_my_account()`));

    const left = await h.db.query(
      `select 1 from public.friendships where $1 in (requester_id, addressee_id)
       union all select 1 from public.friend_profiles where user_id = $1`,
      [leaving],
    );
    expect(left.rows).toHaveLength(0);
    const overview = await call<{ friends: unknown[] }>(friend, 'public.friends_overview()');
    expect(overview.friends).toEqual([]);
  });
});
