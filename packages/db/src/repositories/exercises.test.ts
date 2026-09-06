import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ExerciseRepository } from './exercises.js';
import { writeStringArray } from './rows.js';
import { startSqliteHarness, type SqliteHarness } from './testing/sqlite-harness.js';

/**
 * Against real SQLite, with the schema built from AppSchema.
 *
 * A fake that records query strings would prove the strings were built. It
 * would not catch a wrong join, an ordering that only looks right, or the
 * `NOT EXISTS` in `availableWithUserEquipment` being subtly inverted — which
 * are the mistakes that actually happen.
 */

let db: SqliteHarness;
let exercises: ExerciseRepository;

/** Only the columns a test cares about; the rest stay null, as they can in life. */
async function seedExercise(over: Record<string, string | number | null> = {}): Promise<string> {
  const { id: overrideId, ...rest } = over;
  const id = String(overrideId ?? `ex-${Math.random().toString(36).slice(2, 10)}`);
  await db.seed('exercises', {
    slug: 'back-squat',
    name: 'Back Squat',
    aliases: writeStringArray(['squat']),
    mechanic: 'compound',
    force: 'push',
    joint_count: 3,
    difficulty: 'intermediate',
    is_unilateral: 0,
    is_time_based: 0,
    instructions: writeStringArray(['Unrack the bar.']),
    cues: writeStringArray(['chest up']),
    common_mistakes: writeStringArray([]),
    default_rep_low: 5,
    default_rep_high: 8,
    default_rest_seconds: null,
    video_provider: 'none',
    video_ref: null,
    thumbnail_url: null,
    popularity_rank: 1,
    is_active: 1,
    ...rest,
    id,
  });
  return id;
}

beforeEach(() => {
  db = startSqliteHarness();
  exercises = new ExerciseRepository(db);
});

afterEach(() => {
  db.close();
});

describe('reading an exercise back', () => {
  it('decodes every column into the domain shape', async () => {
    await seedExercise({ id: 'ex-1' });
    const exercise = await exercises.byId('ex-1');

    expect(exercise).not.toBeNull();
    expect(exercise?.name).toBe('Back Squat');
    expect(exercise?.aliases).toEqual(['squat']);
    expect(exercise?.mechanic).toBe('compound');
    expect(exercise?.jointCount).toBe(3);
    expect(exercise?.cues).toEqual(['chest up']);
    expect(exercise?.defaultRestSeconds).toBeNull();
  });

  /**
   * SQLite stores booleans as 0 and 1. Getting this wrong on `is_time_based`
   * means a plank renders a rep stepper and earns a personal record of
   * "60 reps of plank".
   */
  it('turns 0 and 1 back into booleans', async () => {
    await seedExercise({ id: 'plank', is_time_based: 1, is_unilateral: 0 });
    const exercise = await exercises.byId('plank');
    expect(exercise?.isTimeBased).toBe(true);
    expect(exercise?.isUnilateral).toBe(false);
  });

  it('is null for an id that does not exist', async () => {
    expect(await exercises.byId('nope')).toBeNull();
  });

  it('finds one by slug', async () => {
    await seedExercise({ id: 'ex-1', slug: 'bench-press' });
    expect((await exercises.bySlug('bench-press'))?.id).toBe('ex-1');
    expect(await exercises.bySlug('missing')).toBeNull();
  });
});

describe('list', () => {
  it('orders by popularity, then name', async () => {
    await seedExercise({ id: 'c', name: 'Curl', slug: 'curl', popularity_rank: 50 });
    await seedExercise({ id: 'a', name: 'Squat', slug: 'squat', popularity_rank: 1 });
    await seedExercise({ id: 'b', name: 'Bench', slug: 'bench', popularity_rank: 1 });

    const names = (await exercises.list()).map((e) => e.name);
    // Rank 1 before rank 50; within rank 1, alphabetical.
    expect(names).toEqual(['Bench', 'Squat', 'Curl']);
  });

  /**
   * Ranks are not unique in the seed data, and without the name tiebreak
   * SQLite may order tied rows differently between queries — so a list would
   * reshuffle under the user's thumb for no reason.
   */
  it('is stable across repeated queries when ranks tie', async () => {
    for (const name of ['Delta', 'Alpha', 'Charlie', 'Bravo']) {
      await seedExercise({ id: name, name, slug: name.toLowerCase(), popularity_rank: 5 });
    }
    const first = (await exercises.list()).map((e) => e.name);
    const second = (await exercises.list()).map((e) => e.name);
    expect(first).toEqual(second);
    expect(first).toEqual(['Alpha', 'Bravo', 'Charlie', 'Delta']);
  });

  it('hides inactive exercises', async () => {
    await seedExercise({ id: 'live', slug: 'live', is_active: 1 });
    await seedExercise({ id: 'retired', slug: 'retired', is_active: 0 });
    expect((await exercises.list()).map((e) => e.id)).toEqual(['live']);
  });

  it('returns nothing from an empty catalogue rather than failing', async () => {
    expect(await exercises.list()).toEqual([]);
  });
});

describe('search', () => {
  /**
   * The regression the server-side search already had once: trigram similarity
   * is length-sensitive and put Front Squat above Back Squat for "squat". The
   * offline path must not reintroduce it — which is why the ranking is the
   * same @g7m/core code, not a second implementation in SQL.
   */
  it('ranks the common lift first', async () => {
    await seedExercise({
      id: 'front',
      name: 'Front Squat',
      slug: 'front-squat',
      aliases: writeStringArray([]),
      popularity_rank: 40,
    });
    await seedExercise({
      id: 'back',
      name: 'Back Squat',
      slug: 'back-squat',
      aliases: writeStringArray(['squat']),
      popularity_rank: 1,
    });

    const results = await exercises.search('squat');
    expect(results.map((r) => r.item.name)).toEqual(['Back Squat', 'Front Squat']);
  });

  it('finds by alias', async () => {
    await seedExercise({
      id: 'bench',
      name: 'Bench Press',
      slug: 'bench-press',
      aliases: writeStringArray(['bp']),
    });
    expect((await exercises.search('bp'))[0]?.item.id).toBe('bench');
  });

  it('returns nothing for an empty query rather than everything', async () => {
    await seedExercise();
    expect(await exercises.search('')).toEqual([]);
    expect(await exercises.search('   ')).toEqual([]);
  });

  it('does not search inactive exercises', async () => {
    await seedExercise({ id: 'retired', name: 'Old Squat', slug: 'old', is_active: 0 });
    expect(await exercises.search('squat')).toEqual([]);
  });
});

describe('forMuscle', () => {
  beforeEach(async () => {
    await seedExercise({ id: 'squat', name: 'Squat', slug: 'squat', popularity_rank: 1 });
    await seedExercise({
      id: 'legpress',
      name: 'Leg Press',
      slug: 'leg-press',
      popularity_rank: 9,
    });
    await seedExercise({ id: 'curl', name: 'Curl', slug: 'curl', popularity_rank: 3 });

    await db.seed('exercise_muscles', {
      id: 'em-1',
      exercise_id: 'squat',
      muscle_id: 'quads',
      role: 'primary',
      recruitment_weight: 0.9,
    });
    await db.seed('exercise_muscles', {
      id: 'em-2',
      exercise_id: 'legpress',
      muscle_id: 'quads',
      role: 'primary',
      recruitment_weight: 1,
    });
    await db.seed('exercise_muscles', {
      id: 'em-3',
      exercise_id: 'curl',
      muscle_id: 'biceps',
      role: 'primary',
      recruitment_weight: 1,
    });
  });

  it('finds the exercises that train it, strongest first', async () => {
    const found = await exercises.forMuscle('quads');
    expect(found.map((e) => e.id)).toEqual(['legpress', 'squat']);
  });

  it('filters by role when asked', async () => {
    await db.seed('exercise_muscles', {
      id: 'em-4',
      exercise_id: 'curl',
      muscle_id: 'quads',
      role: 'stabilizer',
      recruitment_weight: 0.1,
    });
    expect((await exercises.forMuscle('quads', 'primary')).map((e) => e.id)).toEqual([
      'legpress',
      'squat',
    ]);
    expect((await exercises.forMuscle('quads', 'stabilizer')).map((e) => e.id)).toEqual(['curl']);
  });

  it('excludes inactive exercises', async () => {
    await db.execute("UPDATE exercises SET is_active = 0 WHERE id = 'legpress'");
    expect((await exercises.forMuscle('quads')).map((e) => e.id)).toEqual(['squat']);
  });

  it('is empty for a muscle nothing trains', async () => {
    expect(await exercises.forMuscle('tibialis')).toEqual([]);
  });

  it('reads the involvement back the other way', async () => {
    const involvement = await exercises.musclesFor('squat');
    expect(involvement).toEqual([{ muscleId: 'quads', role: 'primary', recruitmentWeight: 0.9 }]);
  });
});

describe('equipmentFor', () => {
  it('puts the primary station first', async () => {
    await seedExercise({ id: 'hipthrust', slug: 'hip-thrust' });
    await db.seed('equipment', { id: 'eq-bench', slug: 'bench', name: 'Bench', category: 'other' });
    await db.seed('equipment', {
      id: 'eq-bar',
      slug: 'barbell',
      name: 'Barbell',
      category: 'barbell',
    });
    await db.seed('exercise_equipment', {
      id: 'ee-1',
      exercise_id: 'hipthrust',
      equipment_id: 'eq-bench',
      is_primary: 0,
    });
    await db.seed('exercise_equipment', {
      id: 'ee-2',
      exercise_id: 'hipthrust',
      equipment_id: 'eq-bar',
      is_primary: 1,
    });

    const kit = await exercises.equipmentFor('hipthrust');
    expect(kit.map((k) => k.name)).toEqual(['Barbell', 'Bench']);
    expect(kit[0]?.isPrimary).toBe(true);
    expect(kit[1]?.isPrimary).toBe(false);
  });

  it('is empty for a bodyweight exercise with no equipment rows', async () => {
    await seedExercise({ id: 'pushup', slug: 'push-up' });
    expect(await exercises.equipmentFor('pushup')).toEqual([]);
  });
});

describe('availableWithUserEquipment', () => {
  beforeEach(async () => {
    await seedExercise({ id: 'pushup', name: 'Push-up', slug: 'push-up', popularity_rank: 1 });
    await seedExercise({ id: 'squat', name: 'Squat', slug: 'squat', popularity_rank: 2 });
    await seedExercise({ id: 'hipthrust', name: 'Hip Thrust', slug: 'ht', popularity_rank: 3 });

    for (const [id, slug] of [
      ['eq-bar', 'barbell'],
      ['eq-bench', 'bench'],
    ]) {
      await db.seed('equipment', {
        id: id ?? '',
        slug: slug ?? '',
        name: slug ?? '',
        category: 'other',
      });
    }

    // Squat needs a barbell. Hip thrust needs a barbell AND a bench.
    await db.seed('exercise_equipment', {
      id: 'ee-1',
      exercise_id: 'squat',
      equipment_id: 'eq-bar',
      is_primary: 1,
    });
    await db.seed('exercise_equipment', {
      id: 'ee-2',
      exercise_id: 'hipthrust',
      equipment_id: 'eq-bar',
      is_primary: 1,
    });
    await db.seed('exercise_equipment', {
      id: 'ee-3',
      exercise_id: 'hipthrust',
      equipment_id: 'eq-bench',
      is_primary: 0,
    });
  });

  it('includes anything needing no equipment at all', async () => {
    expect((await exercises.availableWithUserEquipment()).map((e) => e.id)).toEqual(['pushup']);
  });

  /**
   * "Every piece", not "any piece". A barbell hip thrust needs the barbell and
   * the bench, and offering it to someone with only a barbell wastes the one
   * trip they made to the gym.
   */
  it('requires every piece an exercise needs, not just one', async () => {
    await db.seed('user_equipment', { id: 'ue-1', user_id: 'u1', equipment_id: 'eq-bar' });

    const available = (await exercises.availableWithUserEquipment()).map((e) => e.id);
    expect(available).toContain('squat');
    expect(available, 'hip thrust needs a bench too').not.toContain('hipthrust');
  });

  it('includes it once the missing piece is added', async () => {
    await db.seed('user_equipment', { id: 'ue-1', user_id: 'u1', equipment_id: 'eq-bar' });
    await db.seed('user_equipment', { id: 'ue-2', user_id: 'u1', equipment_id: 'eq-bench' });

    expect((await exercises.availableWithUserEquipment()).map((e) => e.id)).toEqual([
      'pushup',
      'squat',
      'hipthrust',
    ]);
  });

  it('keeps the popularity ordering', async () => {
    await db.seed('user_equipment', { id: 'ue-1', user_id: 'u1', equipment_id: 'eq-bar' });
    await db.seed('user_equipment', { id: 'ue-2', user_id: 'u1', equipment_id: 'eq-bench' });
    const ranks = (await exercises.availableWithUserEquipment()).map((e) => e.popularityRank);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });
});
