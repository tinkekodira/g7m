import { describe, expect, it } from 'vitest';
import {
  NO_FILTERS,
  hasFilters,
  readFilters,
  toExerciseFilter,
  toggleEquipment,
  writeFilters,
  type LibraryFilters,
} from './library-filters.js';

const GROUPS = new Map([
  ['chest', 'g-chest'],
  ['legs', 'g-legs'],
]);
const EQUIPMENT = new Map([
  ['barbell', 'eq-bar'],
  ['flat-bench', 'eq-bench'],
]);

function filters(over: Partial<LibraryFilters> = {}): LibraryFilters {
  return { ...NO_FILTERS, ...over };
}

describe('reading filters from a URL', () => {
  it('is the unfiltered library when there is nothing there', () => {
    expect(readFilters(new URLSearchParams())).toEqual(NO_FILTERS);
  });

  it('reads all four', () => {
    const params = new URLSearchParams('q=press&muscle=chest&gear=barbell,flat-bench&kit=gym');
    expect(readFilters(params)).toEqual({
      query: 'press',
      muscleGroup: 'chest',
      equipment: ['barbell', 'flat-bench'],
      kit: 'gym',
    });
  });

  it('survives an empty or trailing-comma equipment list', () => {
    // People edit these by hand, and a stray comma should not produce a filter
    // on an empty slug that matches nothing.
    expect(readFilters(new URLSearchParams('gear=')).equipment).toEqual([]);
    expect(readFilters(new URLSearchParams('gear=barbell,')).equipment).toEqual(['barbell']);
  });
});

describe('writing filters back', () => {
  it('round-trips', () => {
    const original = filters({ query: 'row', muscleGroup: 'legs', equipment: ['barbell'] });
    expect(readFilters(writeFilters(original))).toEqual(original);
  });

  /**
   * Otherwise the unfiltered library gets a URL of its own, distinct from the
   * one you arrived at, and the back button walks through states nobody chose.
   */
  it('writes nothing at all when nothing is filtered', () => {
    expect(writeFilters(NO_FILTERS).toString()).toBe('');
  });

  it('does not write a query that is only whitespace', () => {
    expect(writeFilters(filters({ query: '   ' })).toString()).toBe('');
  });
});

describe('hasFilters', () => {
  it('is false for the unfiltered library and for blank whitespace', () => {
    expect(hasFilters(NO_FILTERS)).toBe(false);
    expect(hasFilters(filters({ query: '  ' }))).toBe(false);
  });

  it('is true for each filter on its own', () => {
    expect(hasFilters(filters({ query: 'press' }))).toBe(true);
    expect(hasFilters(filters({ muscleGroup: 'chest' }))).toBe(true);
    expect(hasFilters(filters({ equipment: ['barbell'] }))).toBe(true);
  });
});

describe('toExerciseFilter', () => {
  it('asks for nothing when nothing is selected', () => {
    expect(toExerciseFilter(NO_FILTERS, GROUPS, EQUIPMENT)).toEqual({});
  });

  /**
   * The distinction this function exists for. In the repository an empty
   * `equipmentIds` means "needs no equipment at all" — the hotel-room
   * question. On screen, no chips lit means "I have not narrowed by
   * equipment". Translating one into the other would empty the list the moment
   * someone cleared a filter.
   */
  it('omits equipment entirely rather than asking for the empty set', () => {
    const asked = toExerciseFilter(filters({ equipment: [] }), GROUPS, EQUIPMENT);
    expect('equipmentIds' in asked).toBe(false);
  });

  it('resolves slugs to ids', () => {
    const asked = toExerciseFilter(
      filters({ muscleGroup: 'chest', equipment: ['barbell', 'flat-bench'] }),
      GROUPS,
      EQUIPMENT,
    );
    expect(asked).toEqual({ muscleGroupIds: ['g-chest'], equipmentIds: ['eq-bar', 'eq-bench'] });
  });

  /**
   * A link shared from a newer build, or a bookmark from before a rename. An
   * unknown id passed through would match nothing and empty the library with
   * no explanation.
   */
  it('drops a slug it does not recognise instead of filtering everything away', () => {
    const asked = toExerciseFilter(
      filters({ muscleGroup: 'forearms', equipment: ['barbell', 'jetpack'] }),
      GROUPS,
      EQUIPMENT,
    );
    expect(asked).toEqual({ equipmentIds: ['eq-bar'] });
  });

  it('drops the equipment filter when none of the slugs are known', () => {
    const asked = toExerciseFilter(filters({ equipment: ['jetpack'] }), GROUPS, EQUIPMENT);
    expect('equipmentIds' in asked).toBe(false);
  });
});

describe('toggleEquipment', () => {
  it('adds, then removes, without mutating', () => {
    const none = filters();
    const one = toggleEquipment(none, 'barbell');
    expect(one.equipment).toEqual(['barbell']);
    expect(none.equipment).toEqual([]);

    expect(toggleEquipment(one, 'barbell').equipment).toEqual([]);
  });

  it('leaves the other filters alone', () => {
    const before = filters({ query: 'press', muscleGroup: 'chest' });
    const after = toggleEquipment(before, 'barbell');
    expect(after.query).toBe('press');
    expect(after.muscleGroup).toBe('chest');
  });
});

describe('training with a gym or without one', () => {
  /**
   * The coarse question, separate from ticking equipment off a list. Somebody
   * in a park wants one control that means "me and a bar to hang off".
   */
  it('round-trips through the URL', () => {
    const filters = { ...NO_FILTERS, kit: 'bodyweight' as const };
    expect(readFilters(writeFilters(filters))).toEqual(filters);
  });

  it('leaves the parameter out when there is no preference', () => {
    expect(writeFilters(NO_FILTERS).has('kit')).toBe(false);
  });

  /**
   * An unknown value would otherwise reach the repository and filter every
   * exercise away, which happens for real: a link from a newer build, or a
   * URL somebody edited by hand.
   */
  it('ignores a value it does not recognise', () => {
    expect(readFilters(new URLSearchParams('kit=crossfit')).kit).toBeNull();
    expect(readFilters(new URLSearchParams('kit=')).kit).toBeNull();
  });

  it('counts as a filter, so the empty state offers to clear it', () => {
    expect(hasFilters({ ...NO_FILTERS, kit: 'gym' })).toBe(true);
  });

  it('reaches the repository, and is omitted when unset', () => {
    const ids = new Map<string, string>();
    expect(toExerciseFilter({ ...NO_FILTERS, kit: 'bodyweight' }, ids, ids).kit).toBe('bodyweight');
    expect(toExerciseFilter(NO_FILTERS, ids, ids).kit).toBeUndefined();
  });
});
