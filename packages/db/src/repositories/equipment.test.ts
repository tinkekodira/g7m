import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EquipmentRepository } from './equipment.js';
import { startSqliteHarness, type SqliteHarness } from './testing/sqlite-harness.js';

let db: SqliteHarness;
let equipment: EquipmentRepository;

async function seedEquipment(over: Record<string, string | number | null> = {}): Promise<string> {
  const { id: overrideId, ...rest } = over;
  const id = String(overrideId ?? `eq-${Math.random().toString(36).slice(2, 10)}`);
  await db.seed('equipment', {
    slug: 'barbell',
    name: 'Barbell',
    category: 'barbell',
    ...rest,
    id,
  });
  return id;
}

beforeEach(() => {
  db = startSqliteHarness();
  equipment = new EquipmentRepository(db);
});

afterEach(() => {
  db.close();
});

describe('list', () => {
  it('is alphabetical, because there is no other order a person expects', async () => {
    await seedEquipment({ id: 'eq-s', slug: 'squat-rack', name: 'Squat rack' });
    await seedEquipment({ id: 'eq-b', slug: 'barbell', name: 'Barbell' });
    await seedEquipment({ id: 'eq-d', slug: 'dumbbell', name: 'Dumbbell' });

    expect((await equipment.list()).map((e) => e.name)).toEqual([
      'Barbell',
      'Dumbbell',
      'Squat rack',
    ]);
  });

  it('decodes the category', async () => {
    await seedEquipment({ id: 'eq-1', slug: 'pull-up-bar', category: 'bodyweight' });
    expect((await equipment.byId('eq-1'))?.category).toBe('bodyweight');
  });

  it('falls back to other for a category from a newer schema', async () => {
    // A check constraint enforces these in Postgres and nothing enforces them
    // in SQLite. An unrecognised value should not break the picker.
    await seedEquipment({ id: 'eq-1', category: 'plyometric' });
    expect((await equipment.byId('eq-1'))?.category).toBe('other');
  });

  it('finds one by slug, and is null for one that does not exist', async () => {
    await seedEquipment({ id: 'eq-1', slug: 'kettlebell' });
    expect((await equipment.bySlug('kettlebell'))?.id).toBe('eq-1');
    expect(await equipment.bySlug('nope')).toBeNull();
  });
});
