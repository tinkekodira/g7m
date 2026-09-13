import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  AccountRepository,
  USER_TABLE_NAMES,
  buildAccountExport,
  schemaUserTables,
} from './account.js';
import { BodyMetricsRepository } from './body-metrics.js';
import { SessionRepository } from './sessions.js';
import type { RepositoryContext } from './database.js';
import { startSqliteHarness, type SqliteHarness } from './testing/sqlite-harness.js';

let db: SqliteHarness;
let nextId: number;
const clock = new Date('2026-09-10T08:00:00.000Z');

function context(userId: string): RepositoryContext {
  return { userId, newId: () => `id-${String(++nextId)}`, now: () => clock };
}

beforeEach(async () => {
  db = startSqliteHarness();
  nextId = 0;
  await db.seed('exercises', { id: 'bench', slug: 'bench-press', name: 'Bench Press' });
  await db.seed('exercises', { id: 'squat', slug: 'back-squat', name: 'Back Squat' });
  await db.seed('equipment', { id: 'bar', slug: 'barbell', name: 'Barbell' });
  await db.seed('equipment', { id: 'rings', slug: 'rings', name: 'Gymnastic rings' });
});

afterEach(() => {
  db.close();
});

/** One finished bench workout for `userId`, written through the real logger. */
async function benchDay(userId: string): Promise<void> {
  const sessions = new SessionRepository(db, context(userId));
  const session = await sessions.start({ bodyweightKg: 80 });
  const exercise = await sessions.addExercise(session.id, 'bench');
  const set = await sessions.addSet(exercise.id, {
    weightKg: 100,
    reps: 5,
    loadType: 'external',
    setType: 'working',
  });
  await sessions.completeSet(set.id);
  await sessions.finish(session.id);
}

describe('the tables an export covers', () => {
  it('are exactly the per-user tables in the schema', () => {
    expect([...USER_TABLE_NAMES].sort()).toEqual(schemaUserTables().sort());
  });
});

describe('AccountRepository.exportData', () => {
  it('carries every row the user owns, and nobody else’s', async () => {
    await benchDay('me');
    await benchDay('someone-else');
    await new BodyMetricsRepository(db, context('me')).record({ weightKg: 81 });
    await db.seed('user_equipment', { id: 'ue-1', user_id: 'me', equipment_id: 'bar' });
    await db.seed('user_equipment', { id: 'ue-2', user_id: 'someone-else', equipment_id: 'rings' });

    const { tables } = await new AccountRepository(db, context('me')).exportData();

    expect(tables.workout_sessions).toHaveLength(1);
    expect(tables.session_exercises).toHaveLength(1);
    expect(tables.session_sets).toHaveLength(1);
    expect(tables.body_metrics).toHaveLength(1);
    expect(tables.user_equipment).toHaveLength(1);
    for (const table of USER_TABLE_NAMES) {
      for (const row of tables[table]) expect(row['user_id'], table).toBe('me');
    }
  });

  it('gives every table a list, even an empty one', async () => {
    const { tables } = await new AccountRepository(db, context('me')).exportData();
    expect(Object.keys(tables)).toEqual([...USER_TABLE_NAMES]);
    for (const table of USER_TABLE_NAMES) expect(tables[table]).toEqual([]);
  });

  it('turns SQLite’s 1 and 0 back into true and false, and JSON text back into JSON', async () => {
    await benchDay('me');
    await db.seed('workout_sessions', {
      id: 'generated-1',
      user_id: 'me',
      source: 'generated',
      started_at: '2026-09-11T08:00:00.000Z',
      created_at: '2026-09-11T08:00:00.000Z',
      generation_metadata: JSON.stringify({ goal: 'strength', seed: 7 }),
    });

    const { tables } = await new AccountRepository(db, context('me')).exportData();

    expect(tables.session_sets[0]?.['is_completed']).toBe(true);
    const generated = tables.workout_sessions.find((row) => row['id'] === 'generated-1');
    expect(generated?.['generation_metadata']).toEqual({ goal: 'strength', seed: 7 });
    const logged = tables.workout_sessions.find((row) => row['id'] !== 'generated-1');
    expect(logged?.['generation_metadata']).toBeNull();
  });

  it('keeps a value that is not valid JSON as the text it is', async () => {
    await db.seed('workout_sessions', {
      id: 'odd',
      user_id: 'me',
      source: 'generated',
      created_at: '2026-09-11T08:00:00.000Z',
      generation_metadata: '{not json',
    });
    const { tables } = await new AccountRepository(db, context('me')).exportData();
    expect(tables.workout_sessions[0]?.['generation_metadata']).toBe('{not json');
  });

  it('names the exercises and equipment the rows point at, and only those', async () => {
    await benchDay('me');
    await benchDay('someone-else');
    await db.seed('user_equipment', { id: 'ue-1', user_id: 'me', equipment_id: 'bar' });

    const data = await new AccountRepository(db, context('me')).exportData();

    expect(data.exercises).toEqual([{ id: 'bench', slug: 'bench-press', name: 'Bench Press' }]);
    expect(data.equipment).toEqual([{ id: 'bar', slug: 'barbell', name: 'Barbell' }]);
  });

  it('refuses to run without a signed-in user', () => {
    expect(() => new AccountRepository(db, { userId: '' })).toThrow(/signed-in user/);
  });
});

describe('buildAccountExport', () => {
  it('puts the file together, labelled and versioned', async () => {
    await benchDay('me');
    const data = await new AccountRepository(db, context('me')).exportData();

    const file = buildAccountExport({
      data,
      account: {
        id: 'me',
        email: 'lifter@example.com',
        createdAt: '2026-09-01T10:00:00.000Z',
        signInMethods: ['google'],
      },
      device: { pendingChanges: 2, lastSyncedAt: '2026-09-10T07:59:00.000Z' },
      exportedAt: new Date('2026-09-13T12:00:00.000Z'),
    });

    expect(file.format).toBe('g7m-export');
    expect(file.version).toBe(1);
    expect(file.exportedAt).toBe('2026-09-13T12:00:00.000Z');
    expect(file.account.email).toBe('lifter@example.com');
    expect(file.device.pendingChanges).toBe(2);
    expect(file.data.session_sets).toHaveLength(1);
    expect(file.reference.exercises.map((exercise) => exercise.name)).toEqual(['Bench Press']);
    // It is going into a file, so it has to survive the trip.
    expect(JSON.parse(JSON.stringify(file))).toEqual(file);
  });
});
