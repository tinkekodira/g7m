import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startHarness, type Harness } from './testing/pglite-harness.js';

/**
 * The schema, verified against a real Postgres.
 *
 * These are not unit tests of our code — they are assertions that the SQL we
 * ship actually does what the comments in it claim. The migrations are applied
 * exactly as Supabase would apply them, then poked at.
 */

let h: Harness;

beforeAll(async () => {
  h = await startHarness();
}, 120_000);

afterAll(async () => {
  await h?.close();
});

const REFERENCE_TABLES = [
  'muscle_groups',
  'muscles',
  'equipment',
  'exercises',
  'exercise_equipment',
  'exercise_muscles',
];

const USER_TABLES = [
  'profiles',
  'user_equipment',
  'routines',
  'routine_exercises',
  'workout_sessions',
  'session_exercises',
  'session_sets',
  'personal_records',
  'body_metrics',
  'training_goals',
];

describe('migrations', () => {
  it('apply cleanly from empty', async () => {
    const { rows } = await h.db.query<{ table_name: string }>(
      `select table_name from information_schema.tables
       where table_schema = 'public' and table_type = 'BASE TABLE'`,
    );
    const names = rows.map((r) => r.table_name).sort();
    expect(names).toEqual([...REFERENCE_TABLES, ...USER_TABLES].sort());
  });

  it('give every table the id / created_at / updated_at convention', async () => {
    for (const table of [...REFERENCE_TABLES, ...USER_TABLES]) {
      const { rows } = await h.db.query<{ column_name: string }>(
        `select column_name from information_schema.columns
         where table_schema = 'public' and table_name = $1
           and column_name in ('id', 'created_at', 'updated_at')`,
        [table],
      );
      expect(rows.map((r) => r.column_name).sort(), `${table} is missing one`).toEqual([
        'created_at',
        'id',
        'updated_at',
      ]);
    }
  });

  it('make id the primary key on every table, as PowerSync requires', async () => {
    const { rows } = await h.db.query<{ table_name: string; column_name: string }>(
      `select tc.table_name, kcu.column_name
         from information_schema.table_constraints tc
         join information_schema.key_column_usage kcu
           on kcu.constraint_name = tc.constraint_name
        where tc.table_schema = 'public' and tc.constraint_type = 'PRIMARY KEY'`,
    );
    for (const table of [...REFERENCE_TABLES, ...USER_TABLES]) {
      const pk = rows.filter((r) => r.table_name === table).map((r) => r.column_name);
      expect(pk, `${table} primary key`).toEqual(['id']);
    }
  });
});

describe('row level security', () => {
  it('is enabled on every table without exception', async () => {
    const { rows } = await h.db.query<{ relname: string; relrowsecurity: boolean }>(
      `select c.relname, c.relrowsecurity
         from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind = 'r'`,
    );
    const without = rows.filter((r) => !r.relrowsecurity).map((r) => r.relname);
    expect(without, 'tables with RLS disabled').toEqual([]);
  });

  it('gives every user-owned table an owner policy covering all commands', async () => {
    for (const table of USER_TABLES) {
      const { rows } = await h.db.query<{ cmd: string; qual: string | null }>(
        `select cmd, qual from pg_policies where schemaname = 'public' and tablename = $1`,
        [table],
      );
      expect(rows.length, `${table} has no policy`).toBeGreaterThan(0);
      expect(
        rows.some((r) => r.cmd === 'ALL'),
        `${table} policy is not FOR ALL`,
      ).toBe(true);
      expect(rows[0]?.qual ?? '', `${table} policy does not check auth.uid()`).toContain(
        'auth.uid()',
      );
    }
  });

  it('gives reference tables a read policy and no write policy', async () => {
    for (const table of REFERENCE_TABLES) {
      const { rows } = await h.db.query<{ cmd: string }>(
        `select cmd from pg_policies where schemaname = 'public' and tablename = $1`,
        [table],
      );
      expect(
        rows.map((r) => r.cmd),
        `${table}`,
      ).toEqual(['SELECT']);
    }
  });

  it('actually isolates one user from another', async () => {
    const alice = await h.createUser('alice@example.test');
    const bob = await h.createUser('bob@example.test');

    await h.actAs(alice, async () => {
      await h.db.query(`insert into public.routines (user_id, name) values ($1, 'Push Day')`, [
        alice,
      ]);
      const mine = await h.db.query(`select name from public.routines`);
      expect(mine.rows).toHaveLength(1);
    });

    await h.actAs(bob, async () => {
      const theirs = await h.db.query(`select name from public.routines`);
      expect(theirs.rows, "Bob can see Alice's routine").toHaveLength(0);
    });
  });

  it('refuses to let a user write a row owned by someone else', async () => {
    const carol = await h.createUser('carol@example.test');
    const dave = await h.createUser('dave@example.test');

    await expect(
      h.actAs(carol, async () => {
        await h.db.query(`insert into public.routines (user_id, name) values ($1, 'Sneaky')`, [
          dave,
        ]);
      }),
    ).rejects.toThrow(/row-level security/i);
  });
});

describe('the profile trigger', () => {
  it('creates a profile row for every new auth user', async () => {
    const id = await h.createUser('erin@example.test', { full_name: 'Erin' });
    const { rows } = await h.db.query<{ display_name: string; unit_system: string }>(
      `select display_name, unit_system from public.profiles where user_id = $1`,
      [id],
    );
    expect(rows[0]?.display_name).toBe('Erin');
    expect(rows[0]?.unit_system).toBe('metric');
  });

  it('falls back to the "name" claim that Google and Apple send', async () => {
    const id = await h.createUser('frank@example.test', { name: 'Frank' });
    const { rows } = await h.db.query<{ display_name: string }>(
      `select display_name from public.profiles where user_id = $1`,
      [id],
    );
    expect(rows[0]?.display_name).toBe('Frank');
  });

  it('tolerates a user with no metadata at all', async () => {
    const id = await h.createUser('grace@example.test');
    const { rows } = await h.db.query(`select 1 from public.profiles where user_id = $1`, [id]);
    expect(rows).toHaveLength(1);
  });
});

describe('constraints that protect the domain', () => {
  async function insertExercise(overrides: Record<string, string>): Promise<void> {
    const base: Record<string, string> = {
      slug: `x-${Math.random().toString(36).slice(2, 10)}`,
      name: `'Test Exercise'`,
      mechanic: `'compound'`,
      force: `'push'`,
      joint_count: '2',
      difficulty: `'beginner'`,
      cues: `array['chest up']`,
      default_rep_low: '8',
      default_rep_high: '12',
      ...overrides,
    };
    const slug = base['slug'];
    delete base['slug'];
    const cols = ['slug', ...Object.keys(base)].join(', ');
    const vals = [`'${slug ?? ''}'`, ...Object.values(base)].join(', ');
    await h.db.exec(`insert into public.exercises (${cols}) values (${vals});`);
  }

  it('rejects a single-joint exercise that claims to be compound', async () => {
    await expect(insertExercise({ joint_count: '1', mechanic: `'compound'` })).rejects.toThrow(
      /joint_count_matches_mechanic/,
    );
  });

  it('rejects a multi-joint exercise that claims to be isolation', async () => {
    await expect(insertExercise({ joint_count: '3', mechanic: `'isolation'` })).rejects.toThrow(
      /joint_count_matches_mechanic/,
    );
  });

  it('accepts a genuine isolation exercise', async () => {
    await expect(
      insertExercise({ joint_count: '1', mechanic: `'isolation'` }),
    ).resolves.not.toThrow();
  });

  it('rejects an exercise with no coaching cues, the offline fallback', async () => {
    await expect(insertExercise({ cues: `array[]::text[]` })).rejects.toThrow(/cues_not_empty/);
  });

  it('rejects an inverted rep range', async () => {
    await expect(insertExercise({ default_rep_low: '12', default_rep_high: '8' })).rejects.toThrow(
      /rep_range_ordered/,
    );
  });

  it('rejects a video provider with no reference, and vice versa', async () => {
    await expect(insertExercise({ video_provider: `'youtube'` })).rejects.toThrow(
      /video_ref_matches_provider/,
    );
    await expect(insertExercise({ video_ref: `'abc123'` })).rejects.toThrow(
      /video_ref_matches_provider/,
    );
  });

  it('rejects a selectable muscle with no mesh node, which could never be clicked', async () => {
    await expect(
      h.db.exec(`
        insert into public.muscles
          (slug, common_name, latin_name, muscle_group_id, region, is_selectable, display_order)
        values ('bad', 'Bad', 'Malus',
                (select id from public.muscle_groups where slug = 'chest'),
                'anterior', true, 1);
      `),
    ).rejects.toThrow(/selectable_needs_mesh/);
  });

  it('allows a non-selectable muscle with no mesh node', async () => {
    await expect(
      h.db.exec(`
        insert into public.muscles
          (slug, common_name, latin_name, muscle_group_id, region, is_selectable, display_order)
        values ('decorative', 'Decorative', 'Ornamentum',
                (select id from public.muscle_groups where slug = 'chest'),
                'anterior', false, 99);
      `),
    ).resolves.toBeDefined();
  });

  it('allows only one primary equipment station per exercise', async () => {
    // The seeded bench press already has the barbell as its primary station and
    // the flat bench as an accessory. Promoting the accessory must fail.
    await expect(
      h.db.exec(`
        update public.exercise_equipment set is_primary = true
         where exercise_id = (select id from public.exercises where slug = 'barbell-bench-press')
           and equipment_id = (select id from public.equipment where slug = 'flat-bench');
      `),
    ).rejects.toThrow(/exercise_equipment_one_primary/);
  });

  it('gives the seeded bench press the barbell as its station, not the bench', async () => {
    const { rows } = await h.db.query<{ slug: string }>(
      `select q.slug from public.exercise_equipment ee
         join public.equipment q on q.id = ee.equipment_id
         join public.exercises e on e.id = ee.exercise_id
        where e.slug = 'barbell-bench-press' and ee.is_primary`,
    );
    expect(rows.map((r) => r.slug)).toEqual(['barbell']);
  });
});

describe('session sets', () => {
  it('requires a completion timestamp exactly when the set is completed', async () => {
    const user = await h.createUser('helen@example.test');
    await h.db.exec(`
      insert into public.workout_sessions (id, user_id) values
        ('11111111-1111-1111-1111-111111111111', '${user}');
      insert into public.session_exercises (id, user_id, session_id, exercise_id, order_key)
      values ('22222222-2222-2222-2222-222222222222', '${user}',
              '11111111-1111-1111-1111-111111111111',
              (select id from public.exercises where slug = 'barbell-bench-press'), 'a0');
    `);

    await expect(
      h.db.exec(`
        insert into public.session_sets (user_id, session_exercise_id, order_key, is_completed)
        values ('${user}', '22222222-2222-2222-2222-222222222222', 'a0', true);
      `),
    ).rejects.toThrow(/completed_has_timestamp/);
  });

  it('refuses external load on a pure bodyweight set', async () => {
    const { rows } = await h.db.query<{ user_id: string }>(
      `select user_id from public.session_exercises limit 1`,
    );
    const user = rows[0]?.user_id ?? '';
    await expect(
      h.db.exec(`
        insert into public.session_sets
          (user_id, session_exercise_id, order_key, load_type, weight_kg, reps)
        values ('${user}', '22222222-2222-2222-2222-222222222222', 'a1',
                'bodyweight', 60, 10);
      `),
    ).rejects.toThrow(/bodyweight_has_no_load/);
  });

  it('accepts weighted and assisted variants', async () => {
    const { rows } = await h.db.query<{ user_id: string }>(
      `select user_id from public.session_exercises limit 1`,
    );
    const user = rows[0]?.user_id ?? '';
    await expect(
      h.db.exec(`
        insert into public.session_sets
          (user_id, session_exercise_id, order_key, load_type, weight_kg, reps)
        values ('${user}', '22222222-2222-2222-2222-222222222222', 'a2',
                'bodyweight_plus', 20, 8),
               ('${user}', '22222222-2222-2222-2222-222222222222', 'a3',
                'assisted', 15, 12);
      `),
    ).resolves.toBeDefined();
  });
});

describe('composite foreign keys', () => {
  it('make it impossible for a child row to belong to a different user', async () => {
    const owner = await h.createUser('ivan@example.test');
    const other = await h.createUser('judy@example.test');
    await h.db.exec(
      `insert into public.routines (id, user_id, name)
       values ('33333333-3333-3333-3333-333333333333', '${owner}', 'Legs');`,
    );
    await expect(
      h.db.exec(`
        insert into public.routine_exercises (user_id, routine_id, exercise_id, order_key)
        values ('${other}', '33333333-3333-3333-3333-333333333333',
                (select id from public.exercises where slug = 'barbell-bench-press'), 'a0');
      `),
    ).rejects.toThrow(/foreign key/i);
  });
});

describe('updated_at', () => {
  it('advances on update, on every table with the trigger', async () => {
    const before = await h.db.query<{ updated_at: Date; created_at: Date }>(
      `select created_at, updated_at from public.equipment where slug = 'barbell'`,
    );
    await h.db.exec(`update public.equipment set name = 'Olympic Barbell' where slug = 'barbell';`);
    const after = await h.db.query<{ updated_at: Date }>(
      `select updated_at from public.equipment where slug = 'barbell'`,
    );
    const first = before.rows[0];
    const second = after.rows[0];
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(new Date(second?.updated_at ?? 0).getTime()).toBeGreaterThanOrEqual(
      new Date(first?.updated_at ?? 0).getTime(),
    );
  });
});

describe('the search_text generated column', () => {
  it('is built from the name and the aliases together', async () => {
    const { rows } = await h.db.query<{ search_text: string }>(
      `select search_text from public.exercises where slug = 'barbell-bench-press'`,
    );
    expect(rows[0]?.search_text).toBe('barbell bench press bench bp flat bench bench press');
  });

  it('recomputes itself when the aliases change', async () => {
    await h.db.exec(
      `update public.exercises set aliases = array['flat press']
        where slug = 'machine-chest-press';`,
    );
    const { rows } = await h.db.query<{ search_text: string }>(
      `select search_text from public.exercises where slug = 'machine-chest-press'`,
    );
    expect(rows[0]?.search_text).toBe('machine chest press flat press');
  });
});
