import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { SetTemplate } from '@g7m/core';
import { SessionRepository } from './sessions.js';
import type { RepositoryContext } from './database.js';
import { startSqliteHarness, type SqliteHarness } from './testing/sqlite-harness.js';

/**
 * The CHECK constraints are the point of most of this.
 *
 * SQLite enforces none of them, so a bad row is written happily here and
 * refused on upload — permanently, because the queue classifies a 23xxx as a
 * discard. The failure lands days later as "some of my sets are missing", so
 * the tests assert the shape of what was written rather than that the write
 * succeeded.
 */

let db: SqliteHarness;
let sessions: SessionRepository;
let clock: Date;
let nextId: number;

const USER = 'user-1';

function context(): RepositoryContext {
  return {
    userId: USER,
    newId: () => `id-${String(++nextId)}`,
    now: () => clock,
  };
}

function template(over: Partial<SetTemplate> = {}): SetTemplate {
  return { weightKg: 100, reps: 5, loadType: 'external', setType: 'working', ...over };
}

/** Read a raw row, because the decoders would hide exactly what is being tested. */
async function rawSet(id: string): Promise<Record<string, unknown>> {
  return db.get<Record<string, unknown>>('SELECT * FROM session_sets WHERE id = ?', [id]);
}

beforeEach(() => {
  db = startSqliteHarness();
  clock = new Date('2026-09-06T10:00:00.000Z');
  nextId = 0;
  sessions = new SessionRepository(db, context());
});

afterEach(() => {
  db.close();
});

describe('starting and finishing a workout', () => {
  it('starts one that is in progress', async () => {
    const session = await sessions.start();
    expect(session.endedAt).toBeNull();
    expect(session.startedAt.toISOString()).toBe('2026-09-06T10:00:00.000Z');
    expect((await sessions.active())?.id).toBe(session.id);
  });

  /**
   * Snapshot, not a reference. A pull-up logged at 80 kg is still an 80 kg
   * pull-up after the lifter drops to 75, and re-deriving it from the profile
   * would rewrite every past total each time somebody weighed themselves.
   */
  it('snapshots the bodyweight it was given', async () => {
    const session = await sessions.start({ bodyweightKg: 80.5 });
    expect(session.bodyweightKg).toBe(80.5);
  });

  it('records no bodyweight rather than zero when it is not known', async () => {
    // `bodyweight_kg > 0` is a CHECK. A zero would be refused on upload.
    expect((await sessions.start({ bodyweightKg: 0 })).bodyweightKg).toBeNull();
    expect((await sessions.start()).bodyweightKg).toBeNull();
  });

  it('is manual by default and names no routine', async () => {
    const session = await sessions.start();
    expect(session.source).toBe('manual');
    expect(session.routineId).toBeNull();
  });

  it('becomes a routine session when given a routine', async () => {
    const session = await sessions.start({ routineId: 'routine-1' });
    expect(session.source).toBe('routine');
  });

  /**
   * `(source = 'routine') = (routine_id is not null)` is a CHECK. Both halves
   * of the contradiction are refused here rather than on upload.
   */
  it('refuses a routine session with no routine, and the reverse', async () => {
    await expect(sessions.start({ source: 'routine' })).rejects.toThrow(/routine id/);
    await expect(sessions.start({ source: 'manual', routineId: 'r-1' })).rejects.toThrow(
      /routine id/,
    );
  });

  it('finishes a workout', async () => {
    const session = await sessions.start();
    clock = new Date('2026-09-06T11:00:00.000Z');
    await sessions.finish(session.id);

    expect(await sessions.active()).toBeNull();
    expect((await sessions.byId(session.id))?.endedAt?.toISOString()).toBe(
      '2026-09-06T11:00:00.000Z',
    );
  });

  /**
   * `ended_at >= started_at` is a CHECK, and a phone whose clock steps
   * backwards mid-workout is not exotic — it is a timezone change on a flight,
   * or an NTP correction.
   */
  it('never ends a workout before it started', async () => {
    const session = await sessions.start();
    clock = new Date('2026-09-06T09:00:00.000Z');
    await sessions.finish(session.id);

    const finished = await sessions.byId(session.id);
    expect(finished?.endedAt?.getTime()).toBe(finished?.startedAt.getTime());
  });

  it('finishing twice does not move the end time', async () => {
    const session = await sessions.start();
    clock = new Date('2026-09-06T11:00:00.000Z');
    await sessions.finish(session.id);
    clock = new Date('2026-09-06T12:00:00.000Z');
    await sessions.finish(session.id);

    expect((await sessions.byId(session.id))?.endedAt?.toISOString()).toBe(
      '2026-09-06T11:00:00.000Z',
    );
  });

  it('reports the newest unfinished workout as the active one', async () => {
    // Two can exist: an app killed mid-workout on one device and reopened on
    // another produces exactly this, and the newest is the one being stood in.
    await sessions.start();
    clock = new Date('2026-09-06T12:00:00.000Z');
    const later = await sessions.start();
    expect((await sessions.active())?.id).toBe(later.id);
  });

  it('lists finished workouts newest first, and excludes the one in progress', async () => {
    const first = await sessions.start();
    await sessions.finish(first.id);
    clock = new Date('2026-09-07T10:00:00.000Z');
    const second = await sessions.start();
    await sessions.finish(second.id);
    clock = new Date('2026-09-08T10:00:00.000Z');
    await sessions.start();

    expect((await sessions.recent()).map((s) => s.id)).toEqual([second.id, first.id]);
  });
});

describe('exercises in a workout', () => {
  it('appends them in the order they were added', async () => {
    const session = await sessions.start();
    await sessions.addExercise(session.id, 'squat');
    await sessions.addExercise(session.id, 'bench');
    await sessions.addExercise(session.id, 'row');

    expect((await sessions.exercisesFor(session.id)).map((e) => e.exerciseId)).toEqual([
      'squat',
      'bench',
      'row',
    ]);
  });

  it('gives every exercise a non-empty order key', async () => {
    // `length(order_key) > 0` is a CHECK, and an empty key would also make
    // the ordering above meaningless.
    const session = await sessions.start();
    const added = await sessions.addExercise(session.id, 'squat');
    expect(added.orderKey.length).toBeGreaterThan(0);
  });

  it('removes an exercise and every set under it', async () => {
    const session = await sessions.start();
    const exercise = await sessions.addExercise(session.id, 'squat');
    await sessions.addSet(exercise.id, template());
    await sessions.removeExercise(exercise.id);

    expect(await sessions.exercisesFor(session.id)).toEqual([]);
    expect(await sessions.setsFor(exercise.id)).toEqual([]);
  });

  it('restores an undone exercise with all of its sets, in order', async () => {
    const session = await sessions.start();
    const exercise = await sessions.addExercise(session.id, 'squat');
    await sessions.addSet(exercise.id, template({ weightKg: 60 }));
    await sessions.addSet(exercise.id, template({ weightKg: 80 }));
    const before = await sessions.setsFor(exercise.id);

    const removed = await sessions.removeExercise(exercise.id);
    if (removed === null) throw new Error('nothing to restore');
    expect(removed.sets).toHaveLength(2);

    await sessions.restoreExercise(removed);
    expect((await sessions.exercisesFor(session.id)).map((e) => e.id)).toEqual([exercise.id]);
    expect(await sessions.setsFor(exercise.id)).toEqual(before);
  });

  it('puts an undone exercise back in its place in the list', async () => {
    const session = await sessions.start();
    await sessions.addExercise(session.id, 'squat');
    const middle = await sessions.addExercise(session.id, 'bench');
    await sessions.addExercise(session.id, 'row');

    const removed = await sessions.removeExercise(middle.id);
    if (removed === null) throw new Error('nothing to restore');
    await sessions.restoreExercise(removed);

    expect((await sessions.exercisesFor(session.id)).map((e) => e.exerciseId)).toEqual([
      'squat',
      'bench',
      'row',
    ]);
  });

  it('has nothing to hand back for an exercise that was already gone', async () => {
    expect(await sessions.removeExercise('not-an-exercise')).toBeNull();
  });

  /**
   * SQLite has `PRAGMA foreign_keys` off and PowerSync does not cascade, so
   * the children have to be deleted explicitly or they are orphaned locally
   * until a full re-sync.
   */
  it('discards a whole workout without leaving orphans behind', async () => {
    const session = await sessions.start();
    const exercise = await sessions.addExercise(session.id, 'squat');
    await sessions.addSet(exercise.id, template());
    await sessions.discard(session.id);

    expect(await sessions.byId(session.id)).toBeNull();
    expect(await db.dump('session_exercises')).toEqual([]);
    expect(await db.dump('session_sets')).toEqual([]);
  });
});

describe('logging sets', () => {
  let exerciseId: string;

  beforeEach(async () => {
    const session = await sessions.start({ bodyweightKg: 80 });
    exerciseId = (await sessions.addExercise(session.id, 'squat')).id;
  });

  it('adds a set that has not been done yet', async () => {
    const added = await sessions.addSet(exerciseId, template());
    expect(added.isCompleted).toBe(false);
    expect(added.completedAt).toBeNull();
  });

  /**
   * `is_completed = (completed_at is not null)` is a CHECK, and it is the one
   * that would hurt most: the set the lifter just did never reaches the
   * server, and nothing on the device says so.
   */
  it('keeps is_completed and completed_at in step, in both directions', async () => {
    const added = await sessions.addSet(exerciseId, template());

    const pending = await rawSet(added.id);
    expect(pending.is_completed).toBe(0);
    expect(pending.completed_at).toBeNull();

    await sessions.completeSet(added.id);
    const done = await rawSet(added.id);
    expect(done.is_completed).toBe(1);
    expect(done.completed_at).not.toBeNull();

    await sessions.uncompleteSet(added.id);
    const undone = await rawSet(added.id);
    expect(undone.is_completed).toBe(0);
    expect(undone.completed_at).toBeNull();
  });

  it('completes a set and its numbers in one call', async () => {
    // The three-second path: correct the reps and tick, without two writes.
    const added = await sessions.addSet(exerciseId, template({ reps: 5 }));
    await sessions.completeSet(added.id, { reps: 7, weightKg: 102.5 });

    const set = await sessions.setById(added.id);
    expect(set?.reps).toBe(7);
    expect(set?.weightKg).toBe(102.5);
    expect(set?.isCompleted).toBe(true);
  });

  /**
   * `load_type <> 'bodyweight' or weight_kg = 0` is a CHECK. Leaving 60 kg
   * behind on a switch to press-ups would also double-count against the
   * session's bodyweight snapshot.
   */
  it('zeroes the weight when a set becomes pure bodyweight', async () => {
    const added = await sessions.addSet(exerciseId, template({ weightKg: 60 }));
    await sessions.updateSet(added.id, { loadType: 'bodyweight' });

    const set = await sessions.setById(added.id);
    expect(set?.loadType).toBe('bodyweight');
    expect(set?.weightKg).toBe(0);
  });

  it('refuses to store a weight on a bodyweight set at insert either', async () => {
    const added = await sessions.addSet(
      exerciseId,
      template({ loadType: 'bodyweight', weightKg: 60 }),
    );
    expect(added.weightKg).toBe(0);
    expect((await rawSet(added.id)).weight_kg).toBe(0);
  });

  it('keeps the added load on a weighted pull-up', async () => {
    // The constraint is about `bodyweight`, not everything bodyweight-derived.
    // Zeroing this would erase the only number that made it a weighted pull-up.
    const added = await sessions.addSet(
      exerciseId,
      template({ loadType: 'bodyweight_plus', weightKg: 20 }),
    );
    expect(added.weightKg).toBe(20);
  });

  it('drops an RPE outside 1–10 rather than storing it', async () => {
    // `rpe between 1 and 10` is a CHECK. Out of range means "not recorded".
    const added = await sessions.addSet(exerciseId, template());
    await sessions.updateSet(added.id, { rpe: 12 });
    expect((await sessions.setById(added.id))?.rpe).toBeNull();

    await sessions.updateSet(added.id, { rpe: 8.5 });
    expect((await sessions.setById(added.id))?.rpe).toBe(8.5);
  });

  it('never stores negative or fractional reps', async () => {
    const added = await sessions.addSet(exerciseId, template({ reps: -3 }));
    expect(added.reps).toBe(0);

    await sessions.updateSet(added.id, { reps: 7.9 });
    expect((await sessions.setById(added.id))?.reps).toBe(7);
  });

  it('leaves untouched fields alone on an update', async () => {
    const added = await sessions.addSet(exerciseId, template({ weightKg: 100, reps: 5 }));
    await sessions.updateSet(added.id, { reps: 8 });

    const set = await sessions.setById(added.id);
    expect(set?.weightKg).toBe(100);
    expect(set?.setType).toBe('working');
  });

  it('keeps sets in the order they were added', async () => {
    await sessions.addSet(exerciseId, template({ weightKg: 60 }));
    await sessions.addSet(exerciseId, template({ weightKg: 80 }));
    await sessions.addSet(exerciseId, template({ weightKg: 100 }));

    expect((await sessions.setsFor(exerciseId)).map((s) => s.weightKg)).toEqual([60, 80, 100]);
  });

  it('removes a set', async () => {
    const added = await sessions.addSet(exerciseId, template());
    await sessions.removeSet(added.id);
    expect(await sessions.setById(added.id)).toBeNull();
  });

  /**
   * Undo. Removing is a hard delete rather than a tombstone — a soft-delete
   * column would have to be filtered out of volume, records, the prefill, the
   * review and the generator, and one missed filter counts a set twice
   * forever — so the row itself is what comes back, and the caller holds it
   * for as long as the undo is on screen.
   */
  it('hands back what it deleted, and puts it back exactly', async () => {
    const added = await sessions.addSet(exerciseId, template({ weightKg: 82.5, reps: 6 }));
    await sessions.completeSet(added.id, { weightKg: 82.5, reps: 6 });
    const before = await sessions.setById(added.id);

    const removed = await sessions.removeSet(added.id);
    expect(removed).not.toBeNull();
    expect(await sessions.setById(added.id)).toBeNull();

    if (removed === null) throw new Error('nothing to restore');
    await sessions.restoreSet(removed);
    expect(await sessions.setById(added.id)).toEqual(before);
  });

  it('puts an undone set back where it was, not at the end', async () => {
    const first = await sessions.addSet(exerciseId, template({ weightKg: 60 }));
    const middle = await sessions.addSet(exerciseId, template({ weightKg: 80 }));
    await sessions.addSet(exerciseId, template({ weightKg: 100 }));

    const removed = await sessions.removeSet(middle.id);
    if (removed === null) throw new Error('nothing to restore');
    await sessions.restoreSet(removed);

    // A new order key appended to the end would read 60, 100, 80.
    expect((await sessions.setsFor(exerciseId)).map((set) => set.weightKg)).toEqual([60, 80, 100]);
    expect(first.orderKey.length).toBeGreaterThan(0);
  });

  /**
   * `is_completed = (completed_at is not null)` is a CHECK, and the two are
   * written from the row they were read from precisely so a restore cannot
   * split them. A row that breaks it is accepted here and refused on upload,
   * permanently.
   */
  it('restores a finished set with both halves of the completion pair', async () => {
    const added = await sessions.addSet(exerciseId, template());
    await sessions.completeSet(added.id, { weightKg: 100, reps: 5 });

    const removed = await sessions.removeSet(added.id);
    if (removed === null) throw new Error('nothing to restore');
    await sessions.restoreSet(removed);

    const raw = await rawSet(added.id);
    expect(raw.is_completed).toBe(1);
    expect(raw.completed_at).not.toBeNull();
    expect(raw.user_id).toBe(USER);
  });

  it('has nothing to hand back for a set that was already gone', async () => {
    expect(await sessions.removeSet('not-a-set')).toBeNull();
  });

  it('stamps the owner on every row it writes', async () => {
    // A row with no owner is refused by RLS permanently, discarded by the
    // queue, and stranded on the device with nothing explaining why.
    const added = await sessions.addSet(exerciseId, template());
    expect((await rawSet(added.id)).user_id).toBe(USER);
  });
});

describe('lastPerformance', () => {
  async function loggedSession(when: string, sets: readonly SetTemplate[]): Promise<string> {
    clock = new Date(when);
    const session = await sessions.start();
    const exercise = await sessions.addExercise(session.id, 'squat');
    for (const set of sets) {
      const added = await sessions.addSet(exercise.id, set);
      await sessions.completeSet(added.id);
    }
    await sessions.finish(session.id);
    return session.id;
  }

  it('is empty for an exercise never done', async () => {
    expect(await sessions.lastPerformance('squat')).toEqual([]);
  });

  it('returns the sets from the most recent session, not the first', async () => {
    await loggedSession('2026-09-01T10:00:00.000Z', [template({ weightKg: 80 })]);
    await loggedSession('2026-09-05T10:00:00.000Z', [template({ weightKg: 100 })]);

    expect((await sessions.lastPerformance('squat')).map((s) => s.weightKg)).toEqual([100]);
  });

  it('ignores sets that were planned and never done', async () => {
    clock = new Date('2026-09-01T10:00:00.000Z');
    const session = await sessions.start();
    const exercise = await sessions.addExercise(session.id, 'squat');
    const done = await sessions.addSet(exercise.id, template({ weightKg: 80 }));
    await sessions.completeSet(done.id);
    await sessions.addSet(exercise.id, template({ weightKg: 90 }));
    await sessions.finish(session.id);

    expect((await sessions.lastPerformance('squat')).map((s) => s.weightKg)).toEqual([80]);
  });

  it('skips a session where nothing was completed at all', async () => {
    await loggedSession('2026-09-01T10:00:00.000Z', [template({ weightKg: 80 })]);

    clock = new Date('2026-09-05T10:00:00.000Z');
    const abandoned = await sessions.start();
    const exercise = await sessions.addExercise(abandoned.id, 'squat');
    await sessions.addSet(exercise.id, template({ weightKg: 200 }));
    await sessions.finish(abandoned.id);

    expect((await sessions.lastPerformance('squat')).map((s) => s.weightKg)).toEqual([80]);
  });

  /**
   * Without this, opening an exercise you are part-way through returns today's
   * own sets as "last time", and the prefill compares the lifter to themselves
   * ten seconds ago.
   */
  it('excludes the session in progress when asked to', async () => {
    await loggedSession('2026-09-01T10:00:00.000Z', [template({ weightKg: 80 })]);

    clock = new Date('2026-09-06T10:00:00.000Z');
    const today = await sessions.start();
    const exercise = await sessions.addExercise(today.id, 'squat');
    const set = await sessions.addSet(exercise.id, template({ weightKg: 95 }));
    await sessions.completeSet(set.id);

    expect((await sessions.lastPerformance('squat', today.id)).map((s) => s.weightKg)).toEqual([
      80,
    ]);
    expect((await sessions.lastPerformance('squat')).map((s) => s.weightKg)).toEqual([95]);
  });

  it('carries the load type through, so a pull-up prefills as a pull-up', async () => {
    await loggedSession('2026-09-01T10:00:00.000Z', [
      template({ loadType: 'bodyweight_plus', weightKg: 10, reps: 6 }),
    ]);

    const previous = await sessions.lastPerformance('squat');
    expect(previous[0]?.loadType).toBe('bodyweight_plus');
    expect(previous[0]?.weightKg).toBe(10);
  });

  it('does not return another exercise’s history', async () => {
    await loggedSession('2026-09-01T10:00:00.000Z', [template({ weightKg: 80 })]);
    expect(await sessions.lastPerformance('bench')).toEqual([]);
  });
});

describe('when nobody is signed in', () => {
  it('refuses to write rather than writing an ownerless row', async () => {
    const anonymous = new SessionRepository(db, { userId: '' });
    await expect(anonymous.start()).rejects.toThrow(/signed-in user/);
  });
});
