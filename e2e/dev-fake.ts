/**
 * `pnpm dev:fake`: the app on this computer, against the fake backend, with
 * people already in it.
 *
 * The same fake the browser tests use — PGlite with every real migration, a
 * stand-in for Supabase Auth, PostgREST and PowerSync (ADR-0067) — started on
 * its own, seeded with four accounts that are friends and have trained, and
 * the app pointed at it. Nothing touches the real Supabase project or the
 * PowerSync dashboard, and `.env.local` is not read for these three values:
 * Vite lets the process environment win.
 *
 *   pnpm dev:fake             Vite's dev server on http://localhost:5173
 *   pnpm dev:fake --preview   a production build on http://127.0.0.1:4381,
 *                             for trying offline (the dev server reloads the
 *                             page when the connection drops)
 *
 * Everything lives in memory and is gone when this stops. It uses port 54380,
 * the browser tests' port, so stop it before running `pnpm e2e`.
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { startFakeBackend } from './fake-backend/server.js';
import { BACKEND_PORT, BACKEND_URL } from './tests/support/urls.js';

const PASSWORD = 'correct horse battery';
const preview = process.argv.includes('--preview');

const backend = await startFakeBackend(BACKEND_PORT);
const people = await seed();

const web = fileURLToPath(new URL('../apps/web/', import.meta.url));
const command = preview
  ? 'npx vite build --outDir dist-dev-fake --emptyOutDir && npx vite preview --outDir dist-dev-fake --host 127.0.0.1 --port 4381 --strictPort'
  : 'npx vite --port 5173 --strictPort';
const app = spawn(command, {
  cwd: web,
  shell: true,
  stdio: 'inherit',
  env: {
    ...process.env,
    VITE_SUPABASE_URL: BACKEND_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: 'e2e-publishable-key-for-the-fake-backend',
    VITE_POWERSYNC_URL: BACKEND_URL,
  },
});

process.stdout.write(`
  Fake backend on ${BACKEND_URL}, seeded. Sign in as any of these
  (password: ${PASSWORD}):

${people.map((person) => `    ${person.email.padEnd(24)} ${person.about}`).join('\n')}

  Open ${preview ? 'http://127.0.0.1:4381' : 'http://localhost:5173'} once the app is up.
  A second account needs a second browser profile or a private window.
  Ctrl+C stops everything; the data goes with it.
`);

let stopping = false;
const stop = () => {
  if (stopping) return;
  stopping = true;
  app.kill();
  void backend.close().then(() => process.exit(0));
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
app.on('exit', stop);

// ---------------------------------------------------------------------------
// The people
// ---------------------------------------------------------------------------

interface Person {
  readonly email: string;
  readonly about: string;
  readonly id: string;
}

async function post(path: string, body: unknown): Promise<unknown> {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${path} failed: ${await response.text()}`);
  return response.json();
}

async function sql<T = Record<string, unknown>>(
  query: string,
  params: unknown[] = [],
): Promise<T[]> {
  return (await post('/__e2e/sql', { sql: query, params })) as T[];
}

async function person(email: string, displayName: string, about: string): Promise<Person> {
  const { id } = (await post('/__e2e/users', {
    email,
    password: PASSWORD,
    displayName,
    onboarded: true,
  })) as { id: string };
  return { email, about, id };
}

/** Local time, `days` ago at `hour`. */
function daysAgo(days: number, hour: number): Date {
  const at = new Date();
  at.setDate(at.getDate() - days);
  at.setHours(hour, 0, 0, 0);
  return at;
}

interface Lift {
  readonly slug: string;
  /** Working weight; three working sets, after a warm-up when asked for. */
  readonly kg: number;
  readonly reps?: number;
  readonly warmup?: boolean;
  /** A cardio bout of this many minutes instead of sets. */
  readonly minutes?: number;
}

interface SeedSet {
  readonly type: 'warmup' | 'working';
  readonly kg: number;
  readonly reps: number;
  readonly seconds: number | null;
}

function setsFor(lift: Lift): SeedSet[] {
  if (lift.minutes !== undefined) {
    return [{ type: 'working', kg: 0, reps: 0, seconds: lift.minutes * 60 }];
  }
  const reps = lift.reps ?? 5;
  const working: SeedSet = { type: 'working', kg: lift.kg, reps, seconds: null };
  return [
    ...(lift.warmup === true
      ? [{ type: 'warmup', kg: Math.round(lift.kg * 0.5), reps: 8, seconds: null } as const]
      : []),
    working,
    working,
    { ...working, reps: Math.max(1, reps - 1) },
  ];
}

async function workout(
  userId: string,
  ids: ReadonlyMap<string, string>,
  startedAt: Date,
  lifts: readonly Lift[],
  name: string | null = null,
): Promise<void> {
  const [session] = await sql<{ id: string }>(
    `insert into public.workout_sessions (user_id, name, started_at, ended_at, bodyweight_kg)
     values ($1, $2, $3, $4, 80) returning id`,
    [
      userId,
      name,
      startedAt.toISOString(),
      new Date(startedAt.getTime() + 70 * 60_000).toISOString(),
    ],
  );
  let minute = 4;
  for (const [index, lift] of lifts.entries()) {
    const [slot] = await sql<{ id: string }>(
      `insert into public.session_exercises (user_id, session_id, exercise_id, order_key)
       values ($1, $2, $3, $4) returning id`,
      [userId, session?.id, ids.get(lift.slug), `a${String(index)}`],
    );
    for (const [number, set] of setsFor(lift).entries()) {
      minute += 3;
      await sql(
        `insert into public.session_sets
           (user_id, session_exercise_id, order_key, set_type, weight_kg, reps,
            duration_seconds, is_completed, completed_at)
         values ($1, $2, $3, $4, $5, $6, $7, true, $8)`,
        [
          userId,
          slot?.id,
          `a${String(number)}`,
          set.type,
          set.kg,
          set.reps,
          set.seconds,
          new Date(startedAt.getTime() + minute * 60_000).toISOString(),
        ],
      );
    }
  }
}

async function seed(): Promise<Person[]> {
  const you = await person('you@friends.test', 'Milan', 'you, friends with Alex and Sam');
  const alex = await person('alex@friends.test', 'Alex', 'trains four days a week, online now');
  const sam = await person('sam@friends.test', 'Sam', 'three days a week, some cardio');
  const jordan = await person('jordan@friends.test', 'Jordan', 'has sent you a friend request');

  const rows = await sql<{ id: string; slug: string }>(
    `select id, slug from public.exercises where slug = any($1)`,
    [
      [
        'barbell-back-squat',
        'barbell-bench-press',
        'conventional-deadlift',
        'overhead-press',
        'barbell-row',
        'lat-pulldown',
        'leg-press',
        'romanian-deadlift',
        'barbell-curl',
        'lateral-raise',
        'treadmill',
      ],
    ],
  );
  const ids = new Map(rows.map((row) => [row.slug, row.id]));

  // Friends: you and Alex, you and Sam; Jordan waiting on you.
  await sql(
    `insert into public.friendships (requester_id, addressee_id, status, requested_at, responded_at)
     values ($1, $2, 'accepted', now() - interval '20 days', now() - interval '19 days'),
            ($3, $1, 'accepted', now() - interval '10 days', now() - interval '9 days'),
            ($4, $1, 'pending', now() - interval '3 hours', null)`,
    [you.id, alex.id, sam.id, jordan.id],
  );

  // Goals: Alex four days a week, Sam three. You and Jordan have none.
  await sql(
    `insert into public.training_goals (user_id, goal, days_per_week, started_at)
     values ($1, 'get_stronger', 4, now() - interval '60 days'),
            ($2, 'build_muscle', 3, now() - interval '60 days')`,
    [alex.id, sam.id],
  );

  // Presence: Alex is in the app, Sam was two hours ago.
  await sql(
    `update public.friend_profiles
        set last_active_at = case when user_id = $1 then now() else now() - interval '2 hours' end
      where user_id in ($1, $2)`,
    [alex.id, sam.id],
  );

  // Alex: six weeks of four days, getting stronger, the last one yesterday.
  for (let week = 5; week >= 0; week -= 1) {
    const add = (5 - week) * 2.5;
    for (const [offset, day] of [
      [0, 'legs'],
      [2, 'push'],
      [4, 'pull'],
      [5, 'legs'],
    ] as const) {
      const ago = week * 7 + 6 - offset;
      if (ago < 1) continue;
      const lifts: Lift[] =
        day === 'legs'
          ? [
              { slug: 'barbell-back-squat', kg: 140 + add, warmup: true },
              { slug: 'romanian-deadlift', kg: 120 + add, reps: 8 },
              { slug: 'leg-press', kg: 200 + add * 2, reps: 10 },
            ]
          : day === 'push'
            ? [
                { slug: 'barbell-bench-press', kg: 100 + add, warmup: true },
                { slug: 'overhead-press', kg: 60 + add / 2, reps: 6 },
                { slug: 'lateral-raise', kg: 12, reps: 15 },
              ]
            : [
                { slug: 'conventional-deadlift', kg: 190 + add * 2, reps: 3, warmup: true },
                { slug: 'barbell-row', kg: 90 + add, reps: 8 },
                { slug: 'lat-pulldown', kg: 70, reps: 10 },
              ];
      await workout(alex.id, ids, daysAgo(ago, 18), lifts);
    }
  }

  // Sam: three days a week for three weeks, and a treadmill finisher.
  for (let week = 2; week >= 0; week -= 1) {
    for (const offset of [0, 2, 4]) {
      const ago = week * 7 + 5 - offset;
      if (ago < 0) continue;
      await workout(
        sam.id,
        ids,
        daysAgo(ago, 7),
        [
          { slug: 'barbell-bench-press', kg: 80, reps: 8, warmup: true },
          { slug: 'barbell-back-squat', kg: 115, reps: 6 },
          { slug: 'barbell-curl', kg: 30, reps: 10 },
          { slug: 'treadmill', kg: 0, minutes: 15 },
        ],
        offset === 0 ? 'Full body' : null,
      );
    }
  }

  // You: enough history for the comparisons, nothing today.
  for (const [ago, bench, squat, deadlift] of [
    [12, 95, 130, 180],
    [8, 100, 132.5, 185],
    [3, 102.5, 135, 190],
  ] as const) {
    await workout(you.id, ids, daysAgo(ago, 19), [
      { slug: 'barbell-bench-press', kg: bench, warmup: true },
      { slug: 'barbell-back-squat', kg: squat, warmup: true },
      { slug: 'conventional-deadlift', kg: deadlift, reps: 3 },
    ]);
  }

  return [you, alex, sam, jordan];
}
