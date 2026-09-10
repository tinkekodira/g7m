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

describe('filter', () => {
  /**
   * A small catalogue with the shapes that break a filter: an exercise that
   * needs two things, one that needs nothing, and a muscle involved only as a
   * stabiliser.
   */
  beforeEach(async () => {
    await db.seed('muscle_groups', { id: 'g-chest', slug: 'chest', name: 'Chest' });
    await db.seed('muscle_groups', { id: 'g-legs', slug: 'legs', name: 'Legs' });
    await db.seed('muscles', { id: 'm-pec', slug: 'pec', muscle_group_id: 'g-chest' });
    await db.seed('muscles', { id: 'm-quad', slug: 'quad', muscle_group_id: 'g-legs' });
    await db.seed('muscles', { id: 'm-core', slug: 'core', muscle_group_id: 'g-legs' });
    await db.seed('equipment', { id: 'eq-bar', slug: 'barbell', name: 'Barbell' });
    await db.seed('equipment', { id: 'eq-bench', slug: 'flat-bench', name: 'Flat bench' });

    await seedExercise({
      id: 'bench',
      slug: 'bench-press',
      name: 'Bench Press',
      popularity_rank: 2,
    });
    await seedExercise({
      id: 'squat',
      slug: 'back-squat',
      name: 'Back Squat',
      popularity_rank: 1,
      mechanic: 'compound',
      difficulty: 'intermediate',
    });
    await seedExercise({
      id: 'pushup',
      slug: 'push-up',
      name: 'Push-up',
      popularity_rank: 3,
      mechanic: 'compound',
      difficulty: 'beginner',
    });
    await seedExercise({
      id: 'curl',
      slug: 'curl',
      name: 'Curl',
      popularity_rank: 4,
      mechanic: 'isolation',
      difficulty: 'beginner',
    });

    await db.seed('exercise_muscles', {
      id: 'xm-1',
      exercise_id: 'bench',
      muscle_id: 'm-pec',
      role: 'primary',
      recruitment_weight: 1,
    });
    await db.seed('exercise_muscles', {
      id: 'xm-2',
      exercise_id: 'pushup',
      muscle_id: 'm-pec',
      role: 'primary',
      recruitment_weight: 0.9,
    });
    await db.seed('exercise_muscles', {
      id: 'xm-3',
      exercise_id: 'squat',
      muscle_id: 'm-quad',
      role: 'primary',
      recruitment_weight: 1,
    });
    // The trap: the squat involves the core, but only to hold position.
    await db.seed('exercise_muscles', {
      id: 'xm-4',
      exercise_id: 'squat',
      muscle_id: 'm-core',
      role: 'stabilizer',
      recruitment_weight: 0.3,
    });

    await db.seed('exercise_equipment', {
      id: 'xe-1',
      exercise_id: 'bench',
      equipment_id: 'eq-bar',
      is_primary: 1,
    });
    await db.seed('exercise_equipment', {
      id: 'xe-2',
      exercise_id: 'bench',
      equipment_id: 'eq-bench',
      is_primary: 0,
    });
    await db.seed('exercise_equipment', {
      id: 'xe-3',
      exercise_id: 'squat',
      equipment_id: 'eq-bar',
      is_primary: 1,
    });
  });

  it('with no criteria is the whole active catalogue, in list order', async () => {
    const all = await exercises.filter({});
    expect(all.map((e) => e.id)).toEqual(['squat', 'bench', 'pushup', 'curl']);
  });

  it('still hides inactive exercises', async () => {
    await seedExercise({ id: 'retired', slug: 'retired', is_active: 0 });
    expect((await exercises.filter({})).map((e) => e.id)).not.toContain('retired');
  });

  it('narrows to a muscle group', async () => {
    const chest = await exercises.filter({ muscleGroupIds: ['g-chest'] });
    expect(chest.map((e) => e.id)).toEqual(['bench', 'pushup']);
  });

  it('treats several groups as any of them, not all of them', async () => {
    // Someone ticking Chest and Legs is asking for a bigger list, not a
    // smaller one. "All of them" would return nothing here and look broken.
    const both = await exercises.filter({ muscleGroupIds: ['g-chest', 'g-legs'] });
    expect(both.map((e) => e.id)).toEqual(['squat', 'bench', 'pushup']);
  });

  /**
   * The squat holds the core isometrically. Counting that as "trains the core"
   * would put most of the upper body under Legs, and a filter that returns
   * nearly everything has not filtered.
   */
  it('ignores a muscle that is only a stabiliser', async () => {
    const core = await exercises.filter({ muscleIds: ['m-core'] });
    expect(core).toEqual([]);
  });

  it('narrows to individual muscles', async () => {
    expect((await exercises.filter({ muscleIds: ['m-quad'] })).map((e) => e.id)).toEqual(['squat']);
  });

  it('requires every piece of equipment an exercise needs, not any', async () => {
    // The same inversion as availableWithUserEquipment, and just as easy to
    // write backwards: a bench press needs the bar *and* the bench.
    const barOnly = (await exercises.filter({ equipmentIds: ['eq-bar'] })).map((e) => e.id);
    expect(barOnly).toContain('squat');
    expect(barOnly, 'bench press needs a bench too').not.toContain('bench');
  });

  it('includes what needs nothing, whatever equipment was chosen', async () => {
    const barOnly = (await exercises.filter({ equipmentIds: ['eq-bar'] })).map((e) => e.id);
    expect(barOnly).toContain('pushup');
    expect(barOnly).toContain('curl');
  });

  it('reads an empty equipment list as needing nothing at all', async () => {
    // Not the same as omitting the field. This is the answer to "what can I do
    // in a hotel room", and it is why an empty array is not treated as absent.
    expect((await exercises.filter({ equipmentIds: [] })).map((e) => e.id)).toEqual([
      'pushup',
      'curl',
    ]);
  });

  it('combines criteria with AND', async () => {
    const found = await exercises.filter({
      muscleGroupIds: ['g-chest'],
      equipmentIds: [],
      difficulty: 'beginner',
    });
    expect(found.map((e) => e.id)).toEqual(['pushup']);
  });

  it('narrows by mechanic and difficulty', async () => {
    expect((await exercises.filter({ mechanic: 'isolation' })).map((e) => e.id)).toEqual(['curl']);
    expect((await exercises.filter({ difficulty: 'beginner' })).map((e) => e.id)).toEqual([
      'pushup',
      'curl',
    ]);
  });

  it('returns nothing rather than everything when nothing matches', async () => {
    expect(await exercises.filter({ muscleGroupIds: ['g-nonexistent'] })).toEqual([]);
    expect(await exercises.filter({ muscleIds: [] })).toEqual([]);
  });

  it('binds ids rather than interpolating them', async () => {
    // A value arriving from a URL must not be able to end the statement.
    const injected = await exercises.filter({ muscleGroupIds: ["g-chest') OR 1=1 --"] });
    expect(injected).toEqual([]);
  });

  it('keeps popularity order through a filter', async () => {
    const ranks = (await exercises.filter({ muscleGroupIds: ['g-chest', 'g-legs'] })).map(
      (e) => e.popularityRank,
    );
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });
});

describe('primaryMuscleNames', () => {
  beforeEach(async () => {
    await db.seed('muscles', { id: 'm-pec', slug: 'pec', common_name: 'Chest' });
    await db.seed('muscles', { id: 'm-tri', slug: 'tri', common_name: 'Triceps' });
    await seedExercise({ id: 'bench', slug: 'bench-press' });
    await seedExercise({ id: 'curl', slug: 'curl' });
  });

  it('gives the heaviest primary involvement per exercise', async () => {
    await db.seed('exercise_muscles', {
      id: 'xm-1',
      exercise_id: 'bench',
      muscle_id: 'm-tri',
      role: 'primary',
      recruitment_weight: 0.6,
    });
    await db.seed('exercise_muscles', {
      id: 'xm-2',
      exercise_id: 'bench',
      muscle_id: 'm-pec',
      role: 'primary',
      recruitment_weight: 1,
    });

    expect((await exercises.primaryMuscleNames()).get('bench')).toBe('Chest');
  });

  it('ignores secondary and stabiliser involvement', async () => {
    await db.seed('exercise_muscles', {
      id: 'xm-1',
      exercise_id: 'curl',
      muscle_id: 'm-pec',
      role: 'secondary',
      recruitment_weight: 1,
    });

    expect((await exercises.primaryMuscleNames()).has('curl')).toBe(false);
  });

  it('omits an exercise with no primary muscle rather than inventing one', async () => {
    const names = await exercises.primaryMuscleNames();
    expect(names.get('bench')).toBeUndefined();
    expect(names.size).toBe(0);
  });
});

describe('filtering by whether it needs a gym', () => {
  /**
   * The street-workout case. Somebody training in a park does not want to tick
   * eight pieces of equipment off a list to say "nothing"; they want one
   * control that means *nothing but me and a bar to hang off*.
   */
  beforeEach(async () => {
    await db.seed('equipment', {
      id: 'eq-bw',
      slug: 'bodyweight',
      name: 'Bodyweight',
      category: 'bodyweight',
    });
    await db.seed('equipment', {
      id: 'eq-pullup-bar',
      slug: 'pull-up-bar',
      name: 'Pull-up bar',
      category: 'bodyweight',
    });
    await db.seed('equipment', {
      id: 'eq-barbell',
      slug: 'barbell',
      name: 'Barbell',
      category: 'barbell',
    });

    await addExercise('push-up', 'Push-Up', 1);
    await addExercise('pull-up', 'Pull-Up', 2);
    await addExercise('bench', 'Barbell Bench Press', 3);
    await addExercise('sit-up', 'Sit-Up', 4);

    await link('push-up', 'eq-bw');
    await link('pull-up', 'eq-pullup-bar');
    await link('bench', 'eq-barbell');
    // Sit-up needs nothing at all, which is still bodyweight training.
  });

  async function addExercise(id: string, name: string, rank: number): Promise<void> {
    await db.seed('exercises', {
      id,
      slug: id,
      name,
      is_active: 1,
      popularity_rank: rank,
      default_rep_low: 8,
      default_rep_high: 12,
    });
  }

  async function link(exerciseId: string, equipmentId: string): Promise<void> {
    await db.seed('exercise_equipment', {
      id: `ee-${exerciseId}-${equipmentId}`,
      exercise_id: exerciseId,
      equipment_id: equipmentId,
      is_primary: 1,
    });
  }

  it('counts a pull-up as bodyweight even though it needs a bar', () => {
    // The distinction `equipment.category` already draws, and the one a
    // street-workout lifter means.
    return exercises.filter({ kit: 'bodyweight' }).then((found) => {
      expect(found.map((entry) => entry.id).sort()).toEqual(['pull-up', 'push-up', 'sit-up']);
    });
  });

  it('leaves out anything needing a barbell', async () => {
    const found = await exercises.filter({ kit: 'bodyweight' });
    expect(found.map((entry) => entry.id)).not.toContain('bench');
  });

  it('returns only gym work the other way round', async () => {
    const found = await exercises.filter({ kit: 'gym' });
    expect(found.map((entry) => entry.id)).toEqual(['bench']);
  });

  it('returns everything when the filter is absent', async () => {
    expect(await exercises.filter({})).toHaveLength(4);
  });

  it('combines with the other filters rather than replacing them', async () => {
    await db.seed('muscle_groups', { id: 'g-chest2', slug: 'chest2', name: 'Chest' });
    await db.seed('muscles', { id: 'm-pec2', slug: 'pec2', muscle_group_id: 'g-chest2' });
    await db.seed('exercise_muscles', {
      id: 'em-push',
      exercise_id: 'push-up',
      muscle_id: 'm-pec2',
      role: 'primary',
      recruitment_weight: 1,
    });

    const found = await exercises.filter({ kit: 'bodyweight', muscleGroupIds: ['g-chest2'] });
    expect(found.map((entry) => entry.id)).toEqual(['push-up']);
  });
});

/**
 * The library opened on the wrong exercises.
 *
 * Filtering it to Biceps listed Pull-Up, Lat Pulldown and Barbell Row above
 * the curl, because popularity was the whole order and a pull-up is a more
 * popular exercise than a curl. Every one of those does train the biceps.
 * None of them is what somebody who tapped "Biceps" was looking for.
 */
describe('ranking a filtered list', () => {
  beforeEach(async () => {
    await db.seed('muscle_groups', { id: 'g-biceps', slug: 'biceps', name: 'Biceps' });
    await db.seed('muscles', {
      id: 'm-biceps',
      slug: 'biceps-brachii',
      muscle_group_id: 'g-biceps',
    });

    const links: [string, string, string, string, number, number][] = [
      // id, slug, name, role, recruitment, popularity
      ['pullup', 'pull-up', 'Pull-Up', 'secondary', 0.6, 1],
      ['row', 'barbell-row', 'Barbell Row', 'secondary', 0.5, 2],
      ['curl', 'barbell-curl', 'Barbell Curl', 'primary', 0.95, 40],
      ['hammer', 'hammer-curl', 'Hammer Curl', 'primary', 0.8, 50],
    ];

    for (const [id, slug, name, role, weight, rank] of links) {
      await seedExercise({ id, slug, name, popularity_rank: rank });
      await db.seed('exercise_muscles', {
        id: `xm-${id}`,
        exercise_id: id,
        muscle_id: 'm-biceps',
        role,
        recruitment_weight: weight,
      });
    }
  });

  const names = async (criteria: Parameters<ExerciseRepository['filter']>[0]): Promise<string[]> =>
    (await exercises.filter(criteria)).map((exercise) => exercise.name);

  it('puts what targets the group above what merely borrows it', async () => {
    expect(await names({ muscleGroupIds: ['g-biceps'] })).toEqual([
      'Barbell Curl',
      'Hammer Curl',
      'Pull-Up',
      'Barbell Row',
    ]);
  });

  it('ranks within a role by how much of the work the muscle does', async () => {
    const ranked = await names({ muscleGroupIds: ['g-biceps'] });
    // 0.95 before 0.80, and the more popular pull-up still behind both.
    expect(ranked.indexOf('Barbell Curl')).toBeLessThan(ranked.indexOf('Hammer Curl'));
  });

  it('ranks the same way when the filter names a muscle rather than a group', async () => {
    expect((await names({ muscleIds: ['m-biceps'] }))[0]).toBe('Barbell Curl');
  });

  /**
   * Nothing was asked about muscles, so there is no relevance to rank by and
   * popularity is the right answer again.
   */
  it('falls back to popularity when the filter says nothing about muscles', async () => {
    expect(await names({})).toEqual(['Pull-Up', 'Barbell Row', 'Barbell Curl', 'Hammer Curl']);
  });
});
