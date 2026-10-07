import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { FRIEND_CODE_ALPHABET, bestLiftsByExercise } from '@g7m/core';
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
}

/** A finished workout, written as the superuser: arranging the test, not testing it. */
async function logWorkout(
  user: string,
  startedAt: string,
  sets: readonly LoggedSet[],
  options: { readonly finished?: boolean; readonly name?: string } = {},
): Promise<string> {
  const { rows } = await h.db.query<{ id: string }>(
    `insert into public.workout_sessions (user_id, name, started_at, ended_at, notes, bodyweight_kg)
     values ($1, $2, $3::timestamptz, case when $4 then $3::timestamptz + interval '1 hour' end,
             'private note', 81.5)
     returning id`,
    [user, options.name ?? null, startedAt, options.finished ?? true],
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
          is_completed, completed_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8,
               case when $8 then $9::timestamptz + make_interval(mins => $10) end)`,
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
        where pubname = 'powersync' and tablename in ('friend_profiles', 'friendships')`,
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

  const NOTHING = { inOverview: null, detail: null, session: null };

  /** Every friend function, as `viewer`, about `other`. */
  async function everything(viewer: string, other: string, session: string) {
    const overview = await call<{ friends: { user_id: string }[] }>(
      viewer,
      'public.friends_overview()',
    );
    return {
      inOverview: overview.friends.find((friend) => friend.user_id === other) ?? null,
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
