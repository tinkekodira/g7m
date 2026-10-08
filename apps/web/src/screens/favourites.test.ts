import { describe, expect, it } from 'vitest';
import { favouritesFirst } from './favourites.js';

const list = ['squat', 'bench', 'row', 'curl', 'plank'].map((slug) => ({ slug }));
const slugs = (exercises: readonly { slug: string }[]) => exercises.map((e) => e.slug);

describe('favouritesFirst', () => {
  it('leaves the list as it was when nothing is starred', () => {
    expect(slugs(favouritesFirst(list, new Set()))).toEqual([
      'squat',
      'bench',
      'row',
      'curl',
      'plank',
    ]);
  });

  it('moves the starred to the top, in the order the list had them', () => {
    // Starred in the opposite order to the list: the list's order wins, so a
    // search's best match still comes first among the starred.
    expect(slugs(favouritesFirst(list, new Set(['plank', 'row'])))).toEqual([
      'row',
      'plank',
      'squat',
      'bench',
      'curl',
    ]);
  });

  it('keeps the rest in their order too', () => {
    expect(slugs(favouritesFirst(list, new Set(['bench'])))).toEqual([
      'bench',
      'squat',
      'row',
      'curl',
      'plank',
    ]);
  });

  it('adds nothing a filter took out', () => {
    // Starred, but not in this list: Back has no squat in it.
    const back = [{ slug: 'row' }, { slug: 'pull-up' }];
    expect(slugs(favouritesFirst(back, new Set(['squat', 'pull-up'])))).toEqual(['pull-up', 'row']);
  });

  it('does not change the list it was given', () => {
    const before = slugs(list);
    favouritesFirst(list, new Set(['curl']));
    expect(slugs(list)).toEqual(before);
  });
});
