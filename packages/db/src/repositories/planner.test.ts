import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PlannerRepository } from './planner.js';
import { startSqliteHarness, type SqliteHarness } from './testing/sqlite-harness.js';

let db: SqliteHarness;
let planner: PlannerRepository;

const USER = 'user-1';
const WEEK_START = new Date('2026-09-07T00:00:00.000Z');

beforeEach(async () => {
  db = startSqliteHarness();
  planner = new PlannerRepository(db, { userId: USER });
  await seedCatalogue();
});

afterEach(() => {
  db.close();
});

/**
 * A miniature catalogue: two chest exercises (one needing a barbell, one a
 * dumbbell) and one back exercise, each with a primary muscle in a group.
 */
async function seedCatalogue(): Promise<void> {
  await db.seed('muscle_groups', { id: 'g-chest', slug: 'chest', name: 'Chest' });
  await db.seed('muscle_groups', { id: 'g-back', slug: 'back', name: 'Back' });
  await db.seed('muscles', { id: 'm-pec', slug: 'pec', muscle_group_id: 'g-chest' });
  await db.seed('muscles', { id: 'm-lat', slug: 'lat', muscle_group_id: 'g-back' });
  await db.seed('muscles', { id: 'm-tri', slug: 'tri', muscle_group_id: 'g-chest' });

  await db.seed('equipment', { id: 'eq-bb', slug: 'barbell', name: 'Barbell' });
  await db.seed('equipment', { id: 'eq-db', slug: 'dumbbell', name: 'Dumbbell' });

  await addExercise('bench', 'Barbell Bench Press', 'compound', 1, 'm-pec', 'eq-bb');
  await addExercise('db-press', 'Dumbbell Press', 'compound', 2, 'm-pec', 'eq-db');
  await addExercise('row', 'Barbell Row', 'compound', 3, 'm-lat', 'eq-bb');
}

async function addExercise(
  id: string,
  name: string,
  mechanic: string,
  rank: number,
  muscleId: string,
  equipmentId: string,
): Promise<void> {
  await db.seed('exercises', {
    id,
    slug: id,
    name,
    mechanic,
    is_active: 1,
    is_time_based: 0,
    popularity_rank: rank,
    default_rep_low: 8,
    default_rep_high: 12,
  });
  await db.seed('exercise_muscles', {
    id: `em-${id}`,
    exercise_id: id,
    muscle_id: muscleId,
    role: 'primary',
    recruitment_weight: 1,
  });
  await db.seed('exercise_equipment', {
    id: `ee-${id}`,
    exercise_id: id,
    equipment_id: equipmentId,
    is_primary: 1,
  });
}

/** A finished session with one exercise and its sets. */
async function logSession(
  sessionId: string,
  exerciseId: string,
  startedAt: string,
  sets: readonly (readonly [number | null, number | null])[],
  over: { completed?: boolean; setType?: string; finished?: boolean; rpe?: number } = {},
): Promise<void> {
  await db.seed('workout_sessions', {
    id: sessionId,
    user_id: USER,
    started_at: startedAt,
    ended_at: over.finished === false ? null : startedAt,
  });
  await db.seed('session_exercises', {
    id: `se-${sessionId}`,
    user_id: USER,
    session_id: sessionId,
    exercise_id: exerciseId,
    order_key: 'a',
  });

  let index = 0;
  for (const [weightKg, reps] of sets) {
    await db.seed('session_sets', {
      id: `ss-${sessionId}-${String(index)}`,
      user_id: USER,
      session_exercise_id: `se-${sessionId}`,
      order_key: `a${String(index)}`,
      set_type: over.setType ?? 'working',
      load_type: 'external',
      weight_kg: weightKg,
      reps,
      rpe: over.rpe ?? null,
      is_completed: over.completed === false ? 0 : 1,
    });
    index++;
  }
}

describe('candidates', () => {
  it('returns the catalogue with its muscle groups attached', () => {
    return planner.candidates().then((candidates) => {
      expect(candidates).toHaveLength(3);
      const bench = candidates.find((entry) => entry.id === 'bench');
      expect(bench?.groupSlugs).toContain('chest');
      expect(bench?.mechanic).toBe('compound');
    });
  });

  it('collects every group an exercise trains as a primary mover', async () => {
    await db.seed('exercise_muscles', {
      id: 'em-bench-2',
      exercise_id: 'bench',
      muscle_id: 'm-tri',
      role: 'primary',
      recruitment_weight: 0.5,
    });
    const bench = (await planner.candidates()).find((entry) => entry.id === 'bench');
    // Both muscles are in the chest group here, so the slug list stays unique.
    expect(bench?.groupSlugs).toEqual(['chest']);
  });

  /**
   * An empty equipment list means "I have not told you", not "I own nothing".
   * A plan with no exercises in it is a worse first impression than an
   * aspirational one.
   */
  it('offers everything when the user has recorded no equipment', async () => {
    expect(await planner.candidates()).toHaveLength(3);
  });

  it('offers only what the user can actually lift with', async () => {
    await db.seed('user_equipment', { id: 'ue-1', user_id: USER, equipment_id: 'eq-db' });

    const ids = (await planner.candidates()).map((entry) => entry.id);
    expect(ids).toEqual(['db-press']);
  });

  it('leaves out a retired exercise', async () => {
    await db.seed('exercises', {
      id: 'gone',
      slug: 'gone',
      name: 'Removed',
      mechanic: 'compound',
      is_active: 0,
      is_time_based: 0,
      popularity_rank: 1,
      default_rep_low: 8,
      default_rep_high: 12,
    });
    await db.seed('exercise_muscles', {
      id: 'em-gone',
      exercise_id: 'gone',
      muscle_id: 'm-pec',
      role: 'primary',
      recruitment_weight: 1,
    });

    expect((await planner.candidates()).map((entry) => entry.id)).not.toContain('gone');
  });

  it('leaves out an exercise with no primary muscle at all', async () => {
    // Nothing can be prescribed for a group it does not train.
    await db.seed('exercises', {
      id: 'orphan',
      slug: 'orphan',
      name: 'Orphan',
      mechanic: 'compound',
      is_active: 1,
      is_time_based: 0,
      popularity_rank: 1,
      default_rep_low: 8,
      default_rep_high: 12,
    });
    expect((await planner.candidates()).map((entry) => entry.id)).not.toContain('orphan');
  });
});

const SINCE = new Date('2026-06-01T00:00:00.000Z');

describe('lastPerformances', () => {
  it('is empty for somebody who has never trained', async () => {
    expect(await planner.lastPerformances(SINCE)).toEqual([]);
  });

  /**
   * The difference between "you hit 12" and "you hit 12, 12, then 7". Only
   * the second is a session that ran out, and prescribing more weight after it
   * is how a generated plan buries somebody.
   */
  it('keeps every working set at the top weight, not just the best', async () => {
    await logSession('s1', 'bench', '2026-09-01T10:00:00.000Z', [
      [70, 12],
      [80, 12],
      [80, 12],
      [80, 7],
    ]);

    const [bench] = await planner.lastPerformances(SINCE);
    expect(bench?.sessions[0]?.topSetKg).toBe(80);
    expect(bench?.sessions[0]?.repsAtTopSet).toEqual([12, 12, 7]);
  });

  it('orders sessions newest first', async () => {
    await logSession('s1', 'bench', '2026-08-01T10:00:00.000Z', [[75, 8]]);
    await logSession('s2', 'bench', '2026-09-01T10:00:00.000Z', [[80, 8]]);

    const [bench] = await planner.lastPerformances(SINCE);
    expect(bench?.sessions.map((entry) => entry.topSetKg)).toEqual([80, 75]);
    expect(bench?.sessions[0]?.at).toEqual(new Date('2026-09-01T10:00:00.000Z'));
  });

  it('keeps only as many sessions as the deload rule needs', async () => {
    for (const [index, day] of ['08-01', '08-08', '08-15', '08-22'].entries()) {
      await logSession(`s${String(index)}`, 'bench', `2026-${day}T10:00:00.000Z`, [[80, 8]]);
    }
    expect((await planner.lastPerformances(SINCE))[0]?.sessions).toHaveLength(3);
  });

  it('reads reps in reserve back off the rpe column', async () => {
    // The logger asks "how many more could you have done?" and stores it as
    // RPE, which is the notation the rest of the world writes it in.
    await logSession('s1', 'bench', '2026-09-01T10:00:00.000Z', [[80, 12]], { rpe: 7 });
    expect((await planner.lastPerformances(SINCE))[0]?.sessions[0]?.repsInReserve).toBe(3);
  });

  it('is null when nobody answered', async () => {
    await logSession('s1', 'bench', '2026-09-01T10:00:00.000Z', [[80, 12]]);
    expect((await planner.lastPerformances(SINCE))[0]?.sessions[0]?.repsInReserve).toBeNull();
  });

  it('ignores warm-ups', async () => {
    await logSession('s1', 'bench', '2026-09-01T10:00:00.000Z', [[100, 5]], {
      setType: 'warmup',
    });
    expect(await planner.lastPerformances(SINCE)).toEqual([]);
  });

  it('ignores a set that was never ticked off', async () => {
    await logSession('s1', 'bench', '2026-09-01T10:00:00.000Z', [[100, 5]], {
      completed: false,
    });
    expect(await planner.lastPerformances(SINCE)).toEqual([]);
  });

  it('ignores a session that was never finished', async () => {
    // A workout in progress has not happened yet.
    await logSession('s1', 'bench', '2026-09-01T10:00:00.000Z', [[100, 5]], {
      finished: false,
    });
    expect(await planner.lastPerformances(SINCE)).toEqual([]);
  });

  it('ignores anything before the window', async () => {
    await logSession('s1', 'bench', '2026-01-01T10:00:00.000Z', [[100, 5]]);
    expect(await planner.lastPerformances(SINCE)).toEqual([]);
  });

  it('handles a set with no weight on it', async () => {
    // Bodyweight work. There is a performance; there is just nothing to load.
    await logSession('s1', 'bench', '2026-09-01T10:00:00.000Z', [[null, 12]]);
    const [bench] = await planner.lastPerformances(SINCE);
    expect(bench?.sessions[0]?.topSetKg).toBeNull();
    expect(bench?.sessions[0]?.repsAtTopSet).toEqual([12]);
  });

  it('reports one entry per exercise', async () => {
    await logSession('s1', 'bench', '2026-09-01T10:00:00.000Z', [[80, 8]]);
    await logSession('s2', 'row', '2026-09-02T10:00:00.000Z', [[60, 10]]);

    const performances = await planner.lastPerformances(SINCE);
    expect(performances).toHaveLength(2);
    expect(new Set(performances.map((entry) => entry.exerciseId)).size).toBe(2);
  });

  it('does not read another user’s training', async () => {
    await logSession('s1', 'bench', '2026-09-01T10:00:00.000Z', [[80, 8]]);
    const stranger = new PlannerRepository(db, { userId: 'user-2' });
    expect(await stranger.lastPerformances(SINCE)).toEqual([]);
  });
});

describe('setsByGroupSince', () => {
  it('counts working sets against the primary group', async () => {
    await logSession('s1', 'bench', '2026-09-08T10:00:00.000Z', [
      [70, 10],
      [80, 8],
      [80, 8],
    ]);

    const totals = await planner.setsByGroupSince(WEEK_START);
    expect(totals.get('chest')).toBe(3);
  });

  /**
   * Coarser than the progress screen's attribution, on purpose. Crediting a
   * chest press against a triceps target would let somebody go a month without
   * ever being given a triceps exercise.
   */
  it('does not credit a set to a muscle that only assisted', async () => {
    await db.seed('exercise_muscles', {
      id: 'em-bench-sec',
      exercise_id: 'bench',
      muscle_id: 'm-lat',
      role: 'secondary',
      recruitment_weight: 0.3,
    });
    await logSession('s1', 'bench', '2026-09-08T10:00:00.000Z', [[80, 8]]);

    const totals = await planner.setsByGroupSince(WEEK_START);
    expect(totals.get('back')).toBeUndefined();
  });

  it('leaves out anything before the window', async () => {
    await logSession('s1', 'bench', '2026-09-01T10:00:00.000Z', [[80, 8]]);
    expect((await planner.setsByGroupSince(WEEK_START)).get('chest')).toBeUndefined();
  });

  it('leaves out warm-ups and unfinished work', async () => {
    await logSession('s1', 'bench', '2026-09-08T10:00:00.000Z', [[40, 12]], {
      setType: 'warmup',
    });
    await logSession('s2', 'row', '2026-09-08T10:00:00.000Z', [[60, 8]], { completed: false });

    expect(await planner.setsByGroupSince(WEEK_START)).toEqual(new Map());
  });

  it('is empty rather than null when nothing has been done', async () => {
    expect(await planner.setsByGroupSince(WEEK_START)).toEqual(new Map());
  });
});

describe('sessionCountSince', () => {
  it('is zero for a fresh week', async () => {
    expect(await planner.sessionCountSince(WEEK_START)).toBe(0);
  });

  /**
   * Started, not finished. Somebody mid-workout has used today's slot, and
   * offering the same focus again the moment they finish would be the app
   * losing its place.
   */
  it('counts a session that is still in progress', async () => {
    await logSession('s1', 'bench', '2026-09-08T10:00:00.000Z', [[80, 8]], { finished: false });
    expect(await planner.sessionCountSince(WEEK_START)).toBe(1);
  });

  it('does not count last week', async () => {
    await logSession('s1', 'bench', '2026-09-01T10:00:00.000Z', [[80, 8]]);
    expect(await planner.sessionCountSince(WEEK_START)).toBe(0);
  });

  it('does not count another user’s sessions', async () => {
    await logSession('s1', 'bench', '2026-09-08T10:00:00.000Z', [[80, 8]]);
    const stranger = new PlannerRepository(db, { userId: 'user-2' });
    expect(await stranger.sessionCountSince(WEEK_START)).toBe(0);
  });
});

describe('when nobody is signed in', () => {
  it('refuses to read', async () => {
    const anonymous = new PlannerRepository(db, { userId: '' });
    await expect(anonymous.candidates()).rejects.toThrow(/signed-in user/);
    await expect(anonymous.lastPerformances(SINCE)).rejects.toThrow(/signed-in user/);
  });
});
