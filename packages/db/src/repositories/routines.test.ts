import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { RepositoryContext } from './database.js';
import { RoutineRepository } from './routines.js';
import { SessionRepository } from './sessions.js';
import { startSqliteHarness, type SqliteHarness } from './testing/sqlite-harness.js';

let db: SqliteHarness;
let routines: RoutineRepository;
let sessions: SessionRepository;
let clock: Date;
let nextId: number;

const USER = 'user-1';
const OTHER = 'user-2';
const SQUAT = 'exercise-squat';
const BENCH = 'exercise-bench';
const ROW = 'exercise-row';

function context(userId = USER): RepositoryContext {
  return { userId, newId: () => `r-${String(++nextId)}`, now: () => clock };
}

beforeEach(() => {
  db = startSqliteHarness();
  clock = new Date('2026-09-07T10:00:00.000Z');
  nextId = 0;
  routines = new RoutineRepository(db, context());
  sessions = new SessionRepository(db, context());
});

afterEach(() => {
  db.close();
});

describe('create', () => {
  it('saves a routine with its movements in order', async () => {
    const saved = await routines.create({
      name: 'Push Day',
      exercises: [{ exerciseId: BENCH }, { exerciseId: SQUAT }],
    });

    const detail = await routines.byId(saved.id);
    expect(detail?.routine.name).toBe('Push Day');
    expect(detail?.exercises.map((entry) => entry.exerciseId)).toEqual([BENCH, SQUAT]);
  });

  /** `check (length(trim(name)) > 0)`. Refused here, where somebody can be told. */
  it('refuses a routine with no name', async () => {
    await expect(routines.create({ name: '   ' })).rejects.toThrow(/name/i);
  });

  it('trims the name rather than storing the spaces', async () => {
    const saved = await routines.create({ name: '  Pull Day  ' });
    expect(saved.name).toBe('Pull Day');
  });

  it('starts life never performed', async () => {
    const saved = await routines.create({ name: 'Legs' });
    expect(saved.lastPerformedAt).toBeNull();
  });

  /** Mirrors `check (target_sets between 1 and 20)`. */
  it('clamps targets to what the columns allow', async () => {
    const saved = await routines.create({
      name: 'Odd',
      exercises: [{ exerciseId: SQUAT, targetSets: 99, targetRepLow: 10, targetRepHigh: 2 }],
    });
    const [entry] = (await routines.byId(saved.id))?.exercises ?? [];
    expect(entry?.targetSets).toBe(20);
    // `check (target_rep_high >= target_rep_low)`.
    expect(entry?.targetRepHigh).toBeGreaterThanOrEqual(entry?.targetRepLow ?? 0);
  });
});

describe('createFromSession', () => {
  /** Three working sets of eight becomes a routine asking for three of eight. */
  it('takes the shape of what was actually trained', async () => {
    const session = await sessions.start({ bodyweightKg: 80 });
    const entry = await sessions.addExercise(session.id, SQUAT);
    for (const reps of [8, 8, 6]) {
      const set = await sessions.addSet(entry.id, {
        weightKg: 100,
        reps,
        loadType: 'external',
        setType: 'working',
      });
      await sessions.completeSet(set.id);
    }

    const saved = await routines.createFromSession({ sessionId: session.id, name: 'Leg Day' });
    const [movement] = (await routines.byId(saved.id))?.exercises ?? [];

    expect(movement?.exerciseId).toBe(SQUAT);
    expect(movement?.targetSets).toBe(3);
    expect(movement?.targetRepLow).toBe(6);
    expect(movement?.targetRepHigh).toBe(8);
  });

  /**
   * A warm-up is preparation, not part of the shape of the session. A routine
   * that asked for three warm-ups next time would be wrong.
   */
  it('does not count warm-ups toward the target sets', async () => {
    const session = await sessions.start({});
    const entry = await sessions.addExercise(session.id, BENCH);
    const warmup = await sessions.addSet(entry.id, {
      weightKg: 20,
      reps: 8,
      loadType: 'external',
      setType: 'warmup',
    });
    await sessions.completeSet(warmup.id);
    const working = await sessions.addSet(entry.id, {
      weightKg: 80,
      reps: 5,
      loadType: 'external',
      setType: 'working',
    });
    await sessions.completeSet(working.id);

    const saved = await routines.createFromSession({ sessionId: session.id, name: 'Bench' });
    expect((await routines.byId(saved.id))?.exercises[0]?.targetSets).toBe(1);
  });

  /** Opened and abandoned is not trained, and does not belong in a template. */
  it('leaves out an exercise nobody completed a set of', async () => {
    const session = await sessions.start({});
    const done = await sessions.addExercise(session.id, SQUAT);
    const set = await sessions.addSet(done.id, {
      weightKg: 60,
      reps: 5,
      loadType: 'external',
      setType: 'working',
    });
    await sessions.completeSet(set.id);
    // Added, never touched.
    await sessions.addExercise(session.id, ROW);

    const saved = await routines.createFromSession({ sessionId: session.id, name: 'Partial' });
    const detail = await routines.byId(saved.id);
    expect(detail?.exercises.map((entry) => entry.exerciseId)).toEqual([SQUAT]);
  });
});

describe('list', () => {
  /** Opened to start something, so the thing started last comes first. */
  it('puts the most recently trained first and the never-trained last', async () => {
    const old = await routines.create({ name: 'Old' });
    const fresh = await routines.create({ name: 'Fresh' });
    await routines.create({ name: 'Never' });

    await routines.markPerformed(old.id, new Date('2026-09-01T10:00:00.000Z'));
    await routines.markPerformed(fresh.id, new Date('2026-09-06T10:00:00.000Z'));

    expect((await routines.list()).map((entry) => entry.name)).toEqual(['Fresh', 'Old', 'Never']);
  });

  it('counts what is in each one without a query per routine', async () => {
    await routines.create({
      name: 'Three',
      exercises: [{ exerciseId: SQUAT }, { exerciseId: BENCH }, { exerciseId: ROW }],
    });
    await routines.create({ name: 'Empty' });

    const listed = await routines.list();
    expect(listed.find((entry) => entry.name === 'Three')?.exerciseCount).toBe(3);
    expect(listed.find((entry) => entry.name === 'Empty')?.exerciseCount).toBe(0);
  });

  it('never shows another account’s routines', async () => {
    await routines.create({ name: 'Mine' });
    const theirs = new RoutineRepository(db, context(OTHER));
    await theirs.create({ name: 'Theirs' });

    expect((await routines.list()).map((entry) => entry.name)).toEqual(['Mine']);
    expect((await theirs.list()).map((entry) => entry.name)).toEqual(['Theirs']);
  });
});

describe('editing', () => {
  it('renames, and refuses an empty name', async () => {
    const saved = await routines.create({ name: 'Before' });
    await routines.rename(saved.id, 'After');
    expect((await routines.byId(saved.id))?.routine.name).toBe('After');
    await expect(routines.rename(saved.id, ' ')).rejects.toThrow(/name/i);
  });

  it('adds a movement to the end', async () => {
    const saved = await routines.create({ name: 'Growing', exercises: [{ exerciseId: SQUAT }] });
    await routines.addExercise(saved.id, { exerciseId: BENCH });
    expect((await routines.byId(saved.id))?.exercises.map((e) => e.exerciseId)).toEqual([
      SQUAT,
      BENCH,
    ]);
  });

  it('removes a movement without touching the rest', async () => {
    const saved = await routines.create({
      name: 'Shrinking',
      exercises: [{ exerciseId: SQUAT }, { exerciseId: BENCH }],
    });
    const [first] = (await routines.byId(saved.id))?.exercises ?? [];
    await routines.removeExercise(first?.id ?? '');
    expect((await routines.byId(saved.id))?.exercises.map((e) => e.exerciseId)).toEqual([BENCH]);
  });

  /**
   * One row changes however far it moved. This is what `order_key` is for, and
   * what stops two offline devices destroying each other's reordering.
   */
  it('reorders by writing one row', async () => {
    const saved = await routines.create({
      name: 'Ordered',
      exercises: [{ exerciseId: SQUAT }, { exerciseId: BENCH }, { exerciseId: ROW }],
    });
    const before = (await routines.byId(saved.id))?.exercises ?? [];
    const last = before[2];
    const first = before[0];

    // Move the last one to the top.
    await routines.move(last?.id ?? '', null, first?.orderKey ?? null);

    const after = (await routines.byId(saved.id))?.exercises ?? [];
    expect(after.map((entry) => entry.exerciseId)).toEqual([ROW, SQUAT, BENCH]);
    // The two that did not move kept their keys.
    expect(after[1]?.orderKey).toBe(first?.orderKey);
  });
});

describe('remove', () => {
  it('takes its movements with it', async () => {
    const saved = await routines.create({
      name: 'Doomed',
      exercises: [{ exerciseId: SQUAT }, { exerciseId: BENCH }],
    });
    await routines.remove(saved.id);

    expect(await routines.byId(saved.id)).toBeNull();
    const orphans = await db.getAll<{ id: string }>(
      'SELECT id FROM routine_exercises WHERE routine_id = ?',
      [saved.id],
    );
    expect(orphans).toHaveLength(0);
  });

  /**
   * A workout that happened is a fact. Deleting the template it came from must
   * not delete the training, and `routine_id` is nullable for exactly this —
   * but it has to be cleared, because `(source = 'routine') = (routine_id is
   * not null)` is a CHECK the server enforces.
   */
  it('leaves the workouts it produced, pointing at nothing', async () => {
    const saved = await routines.create({ name: 'Gone', exercises: [{ exerciseId: SQUAT }] });
    const session = await sessions.start({ source: 'routine', routineId: saved.id });

    await routines.remove(saved.id);

    const after = await sessions.byId(session.id);
    expect(after).not.toBeNull();
    expect(after?.routineId).toBeNull();
    expect(after?.source).toBe('manual');
  });
});
