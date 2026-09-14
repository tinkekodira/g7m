import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EMPTY_BOUT } from '@g7m/core';
import { ExerciseRepository } from './exercises.js';
import { HistoryRepository } from './history.js';
import { PlannerRepository } from './planner.js';
import { SessionRepository } from './sessions.js';
import type { RepositoryContext } from './database.js';
import { startSqliteHarness, type SqliteHarness } from './testing/sqlite-harness.js';

/**
 * Cardio as the repositories see it: a bout is a set with a machine's
 * numbers on it, and a cardio machine is an exercise that strength features
 * leave alone. ADR-0069.
 */

let db: SqliteHarness;
let sessions: SessionRepository;
let nextId: number;
const USER = 'user-1';

function context(): RepositoryContext {
  return {
    userId: USER,
    newId: () => `id-${String(++nextId)}`,
    now: () => new Date('2026-09-14T10:00:00.000Z'),
  };
}

beforeEach(async () => {
  db = startSqliteHarness();
  nextId = 0;
  sessions = new SessionRepository(db, context());
  await db.seed('muscle_groups', { id: 'g-chest', slug: 'chest', name: 'Chest' });
  await db.seed('muscles', { id: 'm-pec', slug: 'pec', muscle_group_id: 'g-chest' });
  await db.seed('exercises', {
    id: 'bench',
    slug: 'bench-press',
    name: 'Bench Press',
    mechanic: 'compound',
    is_active: 1,
    popularity_rank: 10,
  });
  await db.seed('exercises', {
    id: 'rower',
    slug: 'rowing-machine',
    name: 'Rowing Machine',
    mechanic: 'compound',
    is_active: 1,
    popularity_rank: 115,
    cardio_kind: 'rower',
  });
  await db.seed('exercise_muscles', {
    id: 'em-1',
    exercise_id: 'bench',
    muscle_id: 'm-pec',
    role: 'primary',
    recruitment_weight: 1,
  });
});

afterEach(() => {
  db.close();
});

async function rowerBout() {
  const session = await sessions.start({ bodyweightKg: 80 });
  const exercise = await sessions.addExercise(session.id, 'rower');
  return sessions.addSet(exercise.id, {
    weightKg: 0,
    reps: 0,
    loadType: 'external',
    setType: 'working',
    bout: { durationSeconds: 480, distanceM: 2000 },
  });
}

describe('a bout', () => {
  it('is saved with the machine’s numbers and read back', async () => {
    const added = await rowerBout();
    const read = await sessions.setById(added.id);
    expect(read?.bout).toEqual({ ...EMPTY_BOUT, durationSeconds: 480, distanceM: 2000 });
    expect(read?.weightKg).toBe(0);
    expect(read?.reps).toBe(0);
  });

  it('merges changes: a field left out keeps its value, a null clears it', async () => {
    const added = await rowerBout();
    await sessions.updateSet(added.id, { bout: { avgWatts: 200 } });
    await sessions.updateSet(added.id, { bout: { distanceM: null } });
    expect((await sessions.setById(added.id))?.bout).toMatchObject({
      durationSeconds: 480,
      distanceM: null,
      avgWatts: 200,
    });
  });

  it('keeps its numbers when completed with changes', async () => {
    const added = await rowerBout();
    await sessions.completeSet(added.id, { bout: { caloriesKcal: 130 } });
    const done = await sessions.setById(added.id);
    expect(done?.isCompleted).toBe(true);
    expect(done?.bout).toMatchObject({ durationSeconds: 480, caloriesKcal: 130 });
  });

  it('drops a number the server would refuse, rather than the whole bout', async () => {
    const added = await rowerBout();
    await sessions.updateSet(added.id, {
      bout: { avgWatts: 99_999, inclinePercent: 55, speedKmh: 12.345, floors: -3 },
    });
    expect((await sessions.setById(added.id))?.bout).toMatchObject({
      durationSeconds: 480,
      avgWatts: null,
      inclinePercent: null,
      speedKmh: 12.3,
      floors: null,
    });
  });

  it('comes back whole after an undo', async () => {
    const added = await rowerBout();
    await sessions.updateSet(added.id, { bout: { avgWatts: 210 } });
    const removed = await sessions.removeSet(added.id);
    expect(removed).not.toBeNull();
    if (removed === null) return;
    await sessions.restoreSet(removed);
    expect((await sessions.setById(added.id))?.bout).toMatchObject({
      durationSeconds: 480,
      distanceM: 2000,
      avgWatts: 210,
    });
  });

  it('leaves a strength set’s bout empty', async () => {
    const session = await sessions.start({ bodyweightKg: 80 });
    const exercise = await sessions.addExercise(session.id, 'bench');
    const set = await sessions.addSet(exercise.id, {
      weightKg: 100,
      reps: 5,
      loadType: 'external',
      setType: 'working',
    });
    expect((await sessions.setById(set.id))?.bout).toEqual(EMPTY_BOUT);
  });
});

describe('a cardio machine', () => {
  const exercises = () => new ExerciseRepository(db);

  it('knows its kind; a lift has none', async () => {
    expect((await exercises().byId('rower'))?.cardioKind).toBe('rower');
    expect((await exercises().byId('bench'))?.cardioKind).toBeNull();
  });

  it('is found by the cardio filter, and left out by the strength one', async () => {
    expect((await exercises().filter({ cardio: true })).map((e) => e.id)).toEqual(['rower']);
    expect((await exercises().filter({ cardio: false })).map((e) => e.id)).toEqual(['bench']);
    expect((await exercises().filter({})).map((e) => e.id)).toEqual(['bench', 'rower']);
  });

  it('is never offered by the planner, even given a muscle', async () => {
    await db.seed('exercise_muscles', {
      id: 'em-2',
      exercise_id: 'rower',
      muscle_id: 'm-pec',
      role: 'primary',
      recruitment_weight: 1,
    });
    const candidates = await new PlannerRepository(db, context()).candidates();
    expect(candidates.map((candidate) => candidate.id)).toEqual(['bench']);
  });

  it('is not a lift to trend on Progress', async () => {
    const bout = await rowerBout();
    await sessions.completeSet(bout.id);
    const session = await sessions.active();
    if (session !== null) await sessions.finish(session.id);
    expect(await new HistoryRepository(db, context()).trainedExercises()).toEqual([]);
  });
});

describe('cardio in history', () => {
  const history = () => new HistoryRepository(db, context());

  async function finishedRowerWorkout(tick: boolean) {
    const bout = await rowerBout();
    if (tick) await sessions.completeSet(bout.id);
    const session = await sessions.active();
    if (session !== null) await sessions.finish(session.id);
    return bout;
  }

  it('hands Progress every finished bout, with its machine and bodyweight', async () => {
    const bout = await finishedRowerWorkout(true);
    expect(await history().completedBouts()).toEqual([
      {
        sessionId: expect.any(String) as string,
        performedAt: new Date('2026-09-14T10:00:00.000Z'),
        kind: 'rower',
        bout: { ...EMPTY_BOUT, durationSeconds: 480, distanceM: 2000 },
        bodyweightKg: 80,
      },
    ]);
    expect(bout.id).toBeTruthy();
  });

  it('leaves out a bout that was never ticked', async () => {
    await finishedRowerWorkout(false);
    expect(await history().completedBouts()).toEqual([]);
  });

  it('starts a workout’s training time when its first bout began, not when it was ticked', async () => {
    await finishedRowerWorkout(true);
    const [summary] = await history().sessionSummaries();
    // Ticked at 10:00 after eight minutes on the rower.
    expect(summary?.firstSetAt?.toISOString()).toBe('2026-09-14T09:52:00.000Z');
    expect(summary?.lastSetAt?.toISOString()).toBe('2026-09-14T10:00:00.000Z');
  });

  it('keeps bouts out of the lifting history', async () => {
    await finishedRowerWorkout(true);
    expect(await history().completedSets()).toEqual([]);
  });

  it('counts a workout’s bouts apart from its sets', async () => {
    await finishedRowerWorkout(true);
    const [summary] = await history().sessionSummaries();
    expect(summary).toMatchObject({ setCount: 1, boutCount: 1 });
  });
});
