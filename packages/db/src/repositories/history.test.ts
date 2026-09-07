import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { HistoryRepository } from './history.js';
import { SessionRepository } from './sessions.js';
import type { RepositoryContext } from './database.js';
import { startSqliteHarness, type SqliteHarness } from './testing/sqlite-harness.js';

/**
 * Written through the real logger rather than seeded row by row.
 *
 * The point of these queries is that they read back what the logger wrote, so
 * a fixture that inserts its own idea of a session would test the joins
 * against a shape production never produces.
 */

let db: SqliteHarness;
let sessions: SessionRepository;
let history: HistoryRepository;
let clock: Date;
let nextId: number;

const USER = 'user-1';

function context(): RepositoryContext {
  return { userId: USER, newId: () => `id-${String(++nextId)}`, now: () => clock };
}

/** One finished workout: an exercise, some sets, all completed. */
async function loggedSession(
  when: string,
  exerciseId: string,
  sets: readonly { weightKg: number; reps: number }[],
  options: { finish?: boolean; bodyweightKg?: number } = {},
): Promise<string> {
  clock = new Date(when);
  const session = await sessions.start({ bodyweightKg: options.bodyweightKg ?? 80 });
  const exercise = await sessions.addExercise(session.id, exerciseId);
  for (const entry of sets) {
    const added = await sessions.addSet(exercise.id, {
      ...entry,
      loadType: 'external',
      setType: 'working',
    });
    await sessions.completeSet(added.id);
  }
  if (options.finish !== false) await sessions.finish(session.id);
  return session.id;
}

beforeEach(async () => {
  db = startSqliteHarness();
  clock = new Date('2026-09-07T10:00:00.000Z');
  nextId = 0;
  sessions = new SessionRepository(db, context());
  history = new HistoryRepository(db, context());

  await db.seed('exercises', { id: 'bench', slug: 'bench-press', name: 'Bench Press' });
  await db.seed('exercises', { id: 'squat', slug: 'back-squat', name: 'Back Squat' });
});

afterEach(() => {
  db.close();
});

describe('completedSets', () => {
  it('returns each completed set with its session context joined on', async () => {
    await loggedSession('2026-09-07T10:00:00.000Z', 'bench', [{ weightKg: 100, reps: 5 }], {
      bodyweightKg: 82,
    });

    const [set] = await history.completedSets();
    expect(set?.exerciseId).toBe('bench');
    expect(set?.weightKg).toBe(100);
    expect(set?.reps).toBe(5);
    // The session's snapshot, which is what makes a bodyweight set measurable.
    expect(set?.bodyweightKg).toBe(82);
    expect(set?.performedAt.toISOString()).toBe('2026-09-07T10:00:00.000Z');
  });

  /**
   * The week's bar growing while somebody is mid-set reads as a bug even when
   * the arithmetic is right. The workout in progress belongs on the logger.
   */
  it('excludes the workout still in progress', async () => {
    await loggedSession('2026-09-07T10:00:00.000Z', 'bench', [{ weightKg: 100, reps: 5 }]);
    await loggedSession('2026-09-08T10:00:00.000Z', 'bench', [{ weightKg: 105, reps: 5 }], {
      finish: false,
    });

    const sets = await history.completedSets();
    expect(sets).toHaveLength(1);
    expect(sets[0]?.weightKg).toBe(100);
  });

  it('excludes sets that were planned and never done', async () => {
    clock = new Date('2026-09-07T10:00:00.000Z');
    const session = await sessions.start();
    const exercise = await sessions.addExercise(session.id, 'bench');
    const done = await sessions.addSet(exercise.id, {
      weightKg: 100,
      reps: 5,
      loadType: 'external',
      setType: 'working',
    });
    await sessions.completeSet(done.id);
    await sessions.addSet(exercise.id, {
      weightKg: 110,
      reps: 5,
      loadType: 'external',
      setType: 'working',
    });
    await sessions.finish(session.id);

    expect((await history.completedSets()).map((s) => s.weightKg)).toEqual([100]);
  });

  it('narrows to a window, with `to` exclusive', async () => {
    await loggedSession('2026-09-01T10:00:00.000Z', 'bench', [{ weightKg: 90, reps: 5 }]);
    await loggedSession('2026-09-07T10:00:00.000Z', 'bench', [{ weightKg: 100, reps: 5 }]);
    await loggedSession('2026-09-14T10:00:00.000Z', 'bench', [{ weightKg: 110, reps: 5 }]);

    const sets = await history.completedSets({
      from: new Date('2026-09-07T00:00:00.000Z'),
      to: new Date('2026-09-14T00:00:00.000Z'),
    });
    expect(sets.map((s) => s.weightKg)).toEqual([100]);
  });

  it('narrows to one exercise', async () => {
    await loggedSession('2026-09-07T10:00:00.000Z', 'bench', [{ weightKg: 100, reps: 5 }]);
    await loggedSession('2026-09-08T10:00:00.000Z', 'squat', [{ weightKg: 140, reps: 5 }]);

    const sets = await history.completedSets({ exerciseId: 'squat' });
    expect(sets.map((s) => s.exerciseId)).toEqual(['squat']);
  });

  it('is chronological, because the trend is drawn in that order', async () => {
    await loggedSession('2026-09-14T10:00:00.000Z', 'bench', [{ weightKg: 110, reps: 5 }]);
    await loggedSession('2026-09-01T10:00:00.000Z', 'bench', [{ weightKg: 90, reps: 5 }]);

    expect((await history.completedSets()).map((s) => s.weightKg)).toEqual([90, 110]);
  });

  it('does not return another user’s training', async () => {
    await loggedSession('2026-09-07T10:00:00.000Z', 'bench', [{ weightKg: 100, reps: 5 }]);
    const stranger = new HistoryRepository(db, { userId: 'user-2' });
    expect(await stranger.completedSets()).toEqual([]);
  });
});

describe('muscleShares', () => {
  it('groups the whole table by exercise', async () => {
    await db.seed('exercise_muscles', {
      id: 'xm-1',
      exercise_id: 'bench',
      muscle_id: 'chest',
      role: 'primary',
      recruitment_weight: 1,
    });
    await db.seed('exercise_muscles', {
      id: 'xm-2',
      exercise_id: 'bench',
      muscle_id: 'triceps',
      role: 'secondary',
      recruitment_weight: 0.5,
    });

    const shares = await history.muscleShares();
    expect(shares.get('bench')).toEqual([
      { muscleId: 'chest', recruitmentWeight: 1 },
      { muscleId: 'triceps', recruitmentWeight: 0.5 },
    ]);
  });

  /**
   * Stabilisers are included here and excluded from the library's muscle
   * filter, on purpose. Holding still under load is work; it is just not what
   * somebody means by "show me chest exercises".
   */
  it('includes stabilisers, because the heat map measures work done', async () => {
    await db.seed('exercise_muscles', {
      id: 'xm-1',
      exercise_id: 'squat',
      muscle_id: 'core',
      role: 'stabilizer',
      recruitment_weight: 0.3,
    });
    expect(await history.muscleShares()).toEqual(
      new Map([['squat', [{ muscleId: 'core', recruitmentWeight: 0.3 }]]]),
    );
  });

  it('is empty rather than throwing when nothing is mapped', async () => {
    expect(await history.muscleShares()).toEqual(new Map());
  });
});

describe('sessionSummaries', () => {
  it('counts exercises and completed working sets', async () => {
    clock = new Date('2026-09-07T10:00:00.000Z');
    const session = await sessions.start();
    const bench = await sessions.addExercise(session.id, 'bench');
    const squat = await sessions.addExercise(session.id, 'squat');

    for (const exercise of [bench, squat]) {
      const added = await sessions.addSet(exercise.id, {
        weightKg: 100,
        reps: 5,
        loadType: 'external',
        setType: 'working',
      });
      await sessions.completeSet(added.id);
    }
    const warmup = await sessions.addSet(bench.id, {
      weightKg: 40,
      reps: 10,
      loadType: 'external',
      setType: 'warmup',
    });
    await sessions.completeSet(warmup.id);
    await sessions.finish(session.id);

    const [summary] = await history.sessionSummaries();
    expect(summary?.exerciseCount).toBe(2);
    // The warm-up is not a set anybody counts.
    expect(summary?.setCount).toBe(2);
  });

  it('is newest first and excludes the workout in progress', async () => {
    await loggedSession('2026-09-01T10:00:00.000Z', 'bench', [{ weightKg: 90, reps: 5 }]);
    await loggedSession('2026-09-07T10:00:00.000Z', 'squat', [{ weightKg: 140, reps: 5 }]);
    await loggedSession('2026-09-08T10:00:00.000Z', 'bench', [{ weightKg: 100, reps: 5 }], {
      finish: false,
    });

    const summaries = await history.sessionSummaries();
    expect(summaries).toHaveLength(2);
    expect(summaries[0]?.startedAt.toISOString()).toBe('2026-09-07T10:00:00.000Z');
  });

  it('honours the limit', async () => {
    for (const day of [1, 2, 3]) {
      await loggedSession(`2026-09-0${String(day)}T10:00:00.000Z`, 'bench', [
        { weightKg: 100, reps: 5 },
      ]);
    }
    expect(await history.sessionSummaries(2)).toHaveLength(2);
  });
});

describe('trainedExercises', () => {
  /**
   * Listing the whole catalogue would bury the four lifts somebody cares
   * about under fifty they have never done.
   */
  it('is only what has actually been trained, most recent first', async () => {
    await loggedSession('2026-09-01T10:00:00.000Z', 'bench', [{ weightKg: 100, reps: 5 }]);
    await loggedSession('2026-09-07T10:00:00.000Z', 'squat', [{ weightKg: 140, reps: 5 }]);

    const trained = await history.trainedExercises();
    expect(trained.map((e) => e.exerciseId)).toEqual(['squat', 'bench']);
    expect(trained[0]?.name).toBe('Back Squat');
  });

  it('reports each exercise once, at its most recent session', async () => {
    await loggedSession('2026-09-01T10:00:00.000Z', 'bench', [{ weightKg: 90, reps: 5 }]);
    await loggedSession('2026-09-07T10:00:00.000Z', 'bench', [{ weightKg: 100, reps: 5 }]);

    const trained = await history.trainedExercises();
    expect(trained).toHaveLength(1);
    expect(trained[0]?.lastAt.toISOString()).toBe('2026-09-07T10:00:00.000Z');
  });

  it('ignores an exercise that was added and never actually done', async () => {
    clock = new Date('2026-09-07T10:00:00.000Z');
    const session = await sessions.start();
    await sessions.addExercise(session.id, 'squat');
    await sessions.finish(session.id);

    expect(await history.trainedExercises()).toEqual([]);
  });
});

describe('groupsByExercise', () => {
  // The shared fixture seeds exercises only; the taxonomy is this block's own.
  beforeEach(async () => {
    await db.seed('muscle_groups', { id: 'g-chest', slug: 'chest', name: 'Chest' });
    await db.seed('muscle_groups', { id: 'g-back', slug: 'back', name: 'Back' });
    await db.seed('muscles', { id: 'pec', slug: 'pec', muscle_group_id: 'g-chest' });
    await db.seed('muscles', { id: 'lat', slug: 'lat', muscle_group_id: 'g-back' });
    await db.seed('exercise_muscles', {
      id: 'em-bench',
      exercise_id: 'bench',
      muscle_id: 'pec',
      role: 'primary',
      recruitment_weight: 0.95,
    });
  });

  it('maps an exercise to the groups of its primary movers', async () => {
    const groups = await history.groupsByExercise();
    expect(groups.get('bench')).toEqual(['chest']);
  });

  /**
   * The same attribution the generator prescribes against. `muscleShares`
   * answers the other question — everything that helped — which is right for a
   * heat map and wrong for "has your back had enough work".
   */
  it('leaves out muscles that only assisted', async () => {
    await db.seed('exercise_muscles', {
      id: 'em-bench-sec',
      exercise_id: 'bench',
      muscle_id: 'lat',
      role: 'secondary',
      recruitment_weight: 0.3,
    });
    expect(await history.groupsByExercise().then((g) => g.get('bench'))).toEqual(['chest']);
  });

  it('counts a group once when two primary muscles share it', async () => {
    await db.seed('muscles', { id: 'pec-2', slug: 'pec-2', muscle_group_id: 'g-chest' });
    await db.seed('exercise_muscles', {
      id: 'em-bench-2',
      exercise_id: 'bench',
      muscle_id: 'pec-2',
      role: 'primary',
      recruitment_weight: 0.8,
    });
    expect(await history.groupsByExercise().then((g) => g.get('bench'))).toEqual(['chest']);
  });
});
