import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MuscleRepository } from './muscles.js';
import { writeStringArray } from './rows.js';
import { startSqliteHarness, type SqliteHarness } from './testing/sqlite-harness.js';

let db: SqliteHarness;
let muscles: MuscleRepository;

async function seedGroup(over: Record<string, string | number | null> = {}): Promise<string> {
  const { id: overrideId, ...rest } = over;
  const id = String(overrideId ?? `grp-${Math.random().toString(36).slice(2, 10)}`);
  await db.seed('muscle_groups', { slug: 'chest', name: 'Chest', display_order: 1, ...rest, id });
  return id;
}

async function seedMuscle(over: Record<string, string | number | null> = {}): Promise<string> {
  const { id: overrideId, ...rest } = over;
  const id = String(overrideId ?? `mus-${Math.random().toString(36).slice(2, 10)}`);
  await db.seed('muscles', {
    slug: 'pec-major-sternal',
    common_name: 'Chest',
    latin_name: 'Pectoralis major, pars sternalis',
    muscle_group_id: 'grp-chest',
    mesh_node_names: writeStringArray(['Pec_Major_L', 'Pec_Major_R']),
    region: 'anterior',
    is_selectable: 1,
    display_order: 1,
    ...rest,
    id,
  });
  return id;
}

beforeEach(() => {
  db = startSqliteHarness();
  muscles = new MuscleRepository(db);
});

afterEach(() => {
  db.close();
});

describe('groups', () => {
  it('returns them in anatomical order, not insertion order', async () => {
    await seedGroup({ id: 'g-back', slug: 'back', name: 'Back', display_order: 3 });
    await seedGroup({ id: 'g-chest', slug: 'chest', name: 'Chest', display_order: 1 });
    await seedGroup({ id: 'g-arms', slug: 'arms', name: 'Arms', display_order: 2 });

    expect((await muscles.groups()).map((g) => g.id)).toEqual(['g-chest', 'g-arms', 'g-back']);
  });

  it('breaks a tied order on name, so the filter chips do not shuffle', async () => {
    // `display_order` is not unique. Without the tiebreak SQLite may return
    // tied rows in a different order between two identical queries, and the
    // chip row would reorder itself under the user's thumb.
    await seedGroup({ id: 'g-2', slug: 'shoulders', name: 'Shoulders', display_order: 5 });
    await seedGroup({ id: 'g-1', slug: 'arms', name: 'Arms', display_order: 5 });

    const once = (await muscles.groups()).map((g) => g.name);
    const twice = (await muscles.groups()).map((g) => g.name);
    expect(once).toEqual(['Arms', 'Shoulders']);
    expect(twice).toEqual(once);
  });
});

describe('reading a muscle back', () => {
  it('decodes the mesh node names from JSON', async () => {
    // Phase 5 raycasts into these. An empty array is a muscle that cannot be
    // tapped on the model, which looks like a broken viewer.
    await seedMuscle({ id: 'm-1' });
    expect((await muscles.byId('m-1'))?.meshNodeNames).toEqual(['Pec_Major_L', 'Pec_Major_R']);
  });

  it('decodes the region and the selectable flag', async () => {
    await seedMuscle({ id: 'm-1', region: 'posterior', is_selectable: 0 });
    const muscle = await muscles.byId('m-1');
    expect(muscle?.region).toBe('posterior');
    expect(muscle?.isSelectable).toBe(false);
  });

  it('treats an unknown region as facing both ways rather than failing', async () => {
    await seedMuscle({ id: 'm-1', region: 'lateral' });
    expect((await muscles.byId('m-1'))?.region).toBe('both');
  });

  it('assumes a muscle is selectable when the flag is missing', async () => {
    // A model that ignores a tap reads as broken; one that responds to a
    // muscle nobody trains is merely uninteresting.
    await seedMuscle({ id: 'm-1', is_selectable: null });
    expect((await muscles.byId('m-1'))?.isSelectable).toBe(true);
  });

  it('finds one by slug, and is null for one that does not exist', async () => {
    await seedMuscle({ id: 'm-1', slug: 'lat-dorsi' });
    expect((await muscles.bySlug('lat-dorsi'))?.id).toBe('m-1');
    expect(await muscles.bySlug('nope')).toBeNull();
    expect(await muscles.byId('nope')).toBeNull();
  });
});

describe('narrowing the list', () => {
  it('returns only the selectable ones for the model', async () => {
    await seedMuscle({ id: 'm-shown', slug: 'pec-major', is_selectable: 1 });
    await seedMuscle({ id: 'm-hidden', slug: 'deep-stabiliser', is_selectable: 0 });

    expect((await muscles.selectable()).map((m) => m.id)).toEqual(['m-shown']);
    expect((await muscles.list()).map((m) => m.id).sort()).toEqual(['m-hidden', 'm-shown']);
  });

  it('returns the muscles in one group, in display order', async () => {
    await seedMuscle({ id: 'm-a', slug: 'a', muscle_group_id: 'g-chest', display_order: 2 });
    await seedMuscle({ id: 'm-b', slug: 'b', muscle_group_id: 'g-chest', display_order: 1 });
    await seedMuscle({ id: 'm-c', slug: 'c', muscle_group_id: 'g-back', display_order: 1 });

    expect((await muscles.inGroup('g-chest')).map((m) => m.id)).toEqual(['m-b', 'm-a']);
  });
});
