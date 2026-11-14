import { describe, expect, it } from 'vitest';
import { exercisesByUsage } from './exercise-usage.js';
import { searchExercises } from './exercise-search.js';

function exercise(id: string, name = id, aliases: string[] = []) {
  return { id, slug: id, name, aliases, popularityRank: 1 };
}
const catalogue = [exercise('bench'), exercise('squat'), exercise('curl')];
const ids = (items: readonly { id: string }[]) => items.map((item) => item.id);

describe('exercisesByUsage', () => {
  it('puts frequency ahead of favourites without changing the supplied list', () => {
    const usage = new Map([
      ['curl', 12],
      ['squat', 5],
    ]);
    expect(ids(exercisesByUsage(catalogue, usage, new Set(['bench'])))).toEqual([
      'curl',
      'squat',
      'bench',
    ]);
    expect(ids(catalogue)).toEqual(['bench', 'squat', 'curl']);
  });

  it('breaks equal counts on favourites, then preserves catalogue order', () => {
    const usage = new Map(catalogue.map((e) => [e.id, 3]));
    expect(ids(exercisesByUsage(catalogue, usage, new Set(['curl'])))).toEqual([
      'curl',
      'bench',
      'squat',
    ]);
  });

  it('falls back to favourites and catalogue order with no history or a blank search', () => {
    expect(ids(exercisesByUsage(catalogue, new Map(), new Set(['squat']), '  '))).toEqual([
      'squat',
      'bench',
      'curl',
    ]);
    expect(exercisesByUsage([], new Map(), new Set())).toEqual([]);
  });

  it('only orders supplied filtered results', () => {
    expect(
      ids(exercisesByUsage([catalogue[0]!], new Map([['curl', 50]]), new Set(['squat']))),
    ).toEqual(['bench']);
  });

  it('keeps exact, alias prefix, word-prefix, substring and fuzzy tiers before frequency', () => {
    const items = [
      exercise('exact', 'Bench'),
      exercise('alias', 'Flat Press', ['bench']),
      exercise('word', 'Barbell Bench Press'),
      exercise('substring', 'Superbench'),
      exercise('fuzzy', 'Bnech'),
    ];
    const matches = searchExercises(items, 'bench').map((m) => m.item);
    const usage = new Map(items.map((e, i) => [e.id, i * 10]));
    expect(ids(exercisesByUsage(matches, usage, new Set(['fuzzy']), ' BENCH '))).toEqual([
      'exact',
      'alias',
      'word',
      'substring',
      'fuzzy',
    ]);
  });

  it('personalizes equal-relevance search results before popularity and favourites', () => {
    const items = [
      exercise('a', 'Cable Curl'),
      exercise('b', 'Cable Fly'),
      exercise('c', 'Cable Row'),
    ];
    expect(
      ids(
        exercisesByUsage(
          items,
          new Map([
            ['b', 2],
            ['c', 2],
          ]),
          new Set(['c']),
          'cable',
        ),
      ),
    ).toEqual(['c', 'b', 'a']);
  });
});
