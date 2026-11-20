import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { RepositoryContext } from './database.js';
import { GymRepository } from './gyms.js';
import { HistoryRepository } from './history.js';
import { PlannerRepository } from './planner.js';
import { SessionRepository } from './sessions.js';
import { startSqliteHarness, type SqliteHarness } from './testing/sqlite-harness.js';

/**
 * ADR-0179: a machine is compared with itself at the same gym, a barbell
 * everywhere, and nothing changes for somebody with one gym.
 */

let db: SqliteHarness;
let gyms: GymRepository;
let sessions: SessionRepository;
let history: HistoryRepository;
let planner: PlannerRepository;
let clock: Date;
let nextId: number;

const USER = 'user-1';
const PULLDOWN = 'ex-pulldown';
const BENCH = 'ex-bench';

function context(): RepositoryContext {
  return { userId: USER, newId: () => `id-${String(++nextId)}`, now: () => clock };
}

async function multipleGyms(on: boolean): Promise<void> {
  await db.execute('UPDATE profiles SET multiple_gyms = ? WHERE user_id = ?', [on ? 1 : 0, USER]);
}

/** A finished workout, `daysAgo` before the clock, of top sets at these loads. */
async function trained(
  gymId: string | null,
  daysAgo: number,
  lifts: readonly { exerciseId: string; kg: number; reps: number }[],
): Promise<string> {
  const startedAt = new Date(clock.getTime() - daysAgo * 86_400_000);
  const session = await sessions.start({ gymId, startedAt });
  for (const lift of lifts) {
    const entry = await sessions.addExercise(session.id, lift.exerciseId);
    for (let n = 0; n < 2; n += 1) {
      const set = await sessions.addSet(entry.id, {
        weightKg: lift.kg,
        reps: lift.reps,
        loadType: 'external',
        setType: 'working',
      });
      await sessions.completeSet(set.id);
    }
  }
  await sessions.finish(session.id, { endedAt: new Date(startedAt.getTime() + 3_600_000) });
  return session.id;
}

let gymA: string;
let gymB: string;

beforeEach(async () => {
  db = startSqliteHarness();
  clock = new Date('2026-11-20T10:00:00.000Z');
  nextId = 0;
  const ctx = context();
  gyms = new GymRepository(db, ctx);
  sessions = new SessionRepository(db, ctx);
  history = new HistoryRepository(db, ctx);
  planner = new PlannerRepository(db, ctx);
  await db.execute(
    `INSERT INTO profiles (id, user_id, multiple_gyms, created_at, updated_at)
     VALUES ('p', ?, 1, '2026-11-01T00:00:00Z', '2026-11-01T00:00:00Z')`,
    [USER],
  );
  await db.seed('equipment', {
    id: 'eq-stack',
    slug: 'lat-pulldown',
    name: 'Lat pulldown',
    category: 'cable',
  });
  await db.seed('equipment', {
    id: 'eq-bar',
    slug: 'barbell',
    name: 'Barbell',
    category: 'barbell',
  });
  await db.seed('exercise_equipment', {
    id: 'ee-1',
    exercise_id: PULLDOWN,
    equipment_id: 'eq-stack',
    is_primary: 1,
  });
  await db.seed('exercise_equipment', {
    id: 'ee-2',
    exercise_id: BENCH,
    equipment_id: 'eq-bar',
    is_primary: 1,
  });
  gymA = (await gyms.create('Iron Works')).id;
  gymB = (await gyms.create('City Gym')).id;
});

afterEach(() => {
  db.close();
});

describe('completedSets', () => {
  it('scopes a cable lift to its gym and leaves a barbell lift everywhere', async () => {
    await trained(gymA, 3, [
      { exerciseId: PULLDOWN, kg: 90, reps: 8 },
      { exerciseId: BENCH, kg: 100, reps: 5 },
    ]);
    await trained(gymB, 1, [{ exerciseId: PULLDOWN, kg: 100, reps: 8 }]);

    const sets = await history.completedSets();
    const scopes = new Set(sets.map((set) => `${set.exerciseId}:${String(set.gymScope)}`));
    expect(scopes).toEqual(
      new Set([`${PULLDOWN}:${gymA}`, `${PULLDOWN}:${gymB}`, `${BENCH}:null`]),
    );
  });

  it('scopes nothing for somebody who has switched the gyms off', async () => {
    await trained(gymA, 1, [{ exerciseId: PULLDOWN, kg: 90, reps: 8 }]);
    await multipleGyms(false);
    expect((await history.completedSets()).every((set) => set.gymScope === null)).toBe(true);
  });
});

describe('lastPerformance', () => {
  it('prefills a machine from this gym only, and offers the other gym as a hint', async () => {
    await trained(gymA, 3, [{ exerciseId: PULLDOWN, kg: 90, reps: 8 }]);
    const today = await sessions.start({ gymId: gymB });

    expect(await sessions.gymScopeFor(today.id, PULLDOWN)).toBe(gymB);
    expect(await sessions.lastPerformance(PULLDOWN, today.id)).toEqual([]);
    const elsewhere = await sessions.lastPerformanceElsewhere(PULLDOWN, today.id);
    expect(elsewhere?.gymName).toBe('Iron Works');
    expect(elsewhere?.sets[0]).toMatchObject({ weightKg: 90, reps: 8 });

    await sessions.setGym(today.id, gymA);
    expect((await sessions.lastPerformance(PULLDOWN, today.id))[0]).toMatchObject({
      weightKg: 90,
    });
  });

  it('prefills a barbell from any gym, with no hint to give', async () => {
    await trained(gymA, 3, [{ exerciseId: BENCH, kg: 100, reps: 5 }]);
    const today = await sessions.start({ gymId: gymB });
    expect((await sessions.lastPerformance(BENCH, today.id))[0]).toMatchObject({ weightKg: 100 });
    expect(await sessions.lastPerformanceElsewhere(BENCH, today.id)).toBeNull();
  });
});

describe('refillForGym', () => {
  it('refills undone machine sets from the new gym and leaves done ones', async () => {
    await trained(gymA, 4, [{ exerciseId: PULLDOWN, kg: 90, reps: 8 }]);
    await trained(gymB, 2, [{ exerciseId: PULLDOWN, kg: 100, reps: 10 }]);
    const today = await sessions.start({ gymId: gymA });
    const entry = await sessions.addExercise(today.id, PULLDOWN);
    const done = await sessions.addSet(entry.id, {
      weightKg: 90,
      reps: 8,
      loadType: 'external',
      setType: 'working',
    });
    await sessions.completeSet(done.id);
    await sessions.addSet(entry.id, {
      weightKg: 90,
      reps: 8,
      loadType: 'external',
      setType: 'working',
    });

    await sessions.setGym(today.id, gymB);
    await sessions.refillForGym(today.id);
    const sets = await sessions.setsFor(entry.id);
    expect(sets.map((set) => [set.weightKg, set.reps, set.isCompleted])).toEqual([
      [90, 8, true],
      [100, 10, false],
    ]);
  });

  it('empties the weight where the new gym has nothing to go on', async () => {
    await trained(gymA, 4, [{ exerciseId: PULLDOWN, kg: 90, reps: 8 }]);
    const today = await sessions.start({ gymId: gymA });
    const entry = await sessions.addExercise(today.id, PULLDOWN);
    await sessions.addSet(entry.id, {
      weightKg: 90,
      reps: 8,
      loadType: 'external',
      setType: 'working',
    });
    await sessions.setGym(today.id, gymB);
    await sessions.refillForGym(today.id);
    expect((await sessions.setsFor(entry.id)).map((set) => [set.weightKg, set.reps])).toEqual([
      [0, 8],
    ]);
  });
});

describe('planner', () => {
  it('suggests a machine from the gym the next workout starts at', async () => {
    await trained(gymB, 4, [{ exerciseId: PULLDOWN, kg: 100, reps: 8 }]);
    await trained(gymA, 2, [
      { exerciseId: PULLDOWN, kg: 90, reps: 8 },
      { exerciseId: BENCH, kg: 100, reps: 5 },
    ]);
    const recent = await planner.lastPerformances(new Date('2026-10-01T00:00:00Z'));
    const pulldown = recent.find((entry) => entry.exerciseId === PULLDOWN);
    expect(pulldown?.sessions.map((session) => session.topSetKg)).toEqual([90]);
    expect(recent.find((entry) => entry.exerciseId === BENCH)?.sessions).toHaveLength(1);
  });
});
