import { describe, expect, it } from 'vitest';
import {
  exerciseSearchText,
  searchExercises,
  searchTierFor,
  typoBudget,
  type SearchableExercise,
} from './exercise-search.js';

/** A bare exercise, for the spelling tests below. */
function exercise(name: string, popularityRank: number): SearchableExercise {
  return { name, popularityRank };
}

const backSquat: SearchableExercise = {
  name: 'Back Squat',
  aliases: ['squat', 'barbell squat'],
  popularityRank: 1,
};
const frontSquat: SearchableExercise = {
  name: 'Front Squat',
  aliases: [],
  popularityRank: 40,
};
const benchPress: SearchableExercise = {
  name: 'Bench Press',
  aliases: ['bench', 'bp', 'flat bench'],
  popularityRank: 2,
};
const barbellRow: SearchableExercise = {
  name: 'Barbell Row',
  aliases: ['bent-over row'],
  popularityRank: 10,
};
const catalogue = [frontSquat, backSquat, benchPress, barbellRow];

describe('exerciseSearchText', () => {
  /**
   * This has to match `public.exercise_search_text(name, aliases)` exactly, or
   * the same query returns different results depending on whether the phone
   * had signal. The SQL is:
   *   lower(p_name || ' ' || array_to_string(coalesce(p_aliases, '{}'), ' '))
   */
  it('reproduces the Postgres function, including the trailing space when there are no aliases', () => {
    expect(exerciseSearchText('Bench Press', ['bench', 'bp'])).toBe('bench press bench bp');
    expect(exerciseSearchText('Front Squat', [])).toBe('front squat ');
  });

  it('defaults to no aliases', () => {
    expect(exerciseSearchText('Plank')).toBe('plank ');
  });
});

describe('searchTierFor', () => {
  it('finds nothing for an empty or whitespace query', () => {
    expect(searchTierFor(backSquat, '')).toBeNull();
    expect(searchTierFor(backSquat, '   ')).toBeNull();
  });

  it('ranks a whole-name match highest', () => {
    expect(searchTierFor(backSquat, 'Back Squat')).toBe('exact');
    expect(searchTierFor(backSquat, 'back squat')).toBe('exact');
  });

  it('ranks a name prefix next, which is how people type', () => {
    expect(searchTierFor(backSquat, 'back')).toBe('prefix');
    expect(searchTierFor(frontSquat, 'fro')).toBe('prefix');
  });

  it('treats an exact alias as a prefix match, not a substring one', () => {
    // Typing "bp" means bench press. It should not rank below everything else
    // that happens to contain those two letters.
    expect(searchTierFor(benchPress, 'bp')).toBe('prefix');
  });

  it('finds a word inside the name', () => {
    expect(searchTierFor(barbellRow, 'row')).toBe('word-prefix');
    expect(searchTierFor(frontSquat, 'squat')).toBe('word-prefix');
  });

  it('falls back to a substring anywhere in the haystack', () => {
    expect(searchTierFor(barbellRow, 'ent-over')).toBe('substring');
  });

  it('returns null when nothing matches', () => {
    expect(searchTierFor(backSquat, 'deadlift')).toBeNull();
  });

  it('ignores surrounding whitespace and case', () => {
    expect(searchTierFor(backSquat, '  BACK  ')).toBe('prefix');
  });
});

describe('searchExercises', () => {
  /**
   * The regression the server-side search already had once: trigram
   * `similarity()` is length-sensitive, so "squat" scored Front Squat above
   * Back Squat purely because the name is shorter. The tiers exist to stop
   * that, and the offline path must not reintroduce it.
   */
  it('puts the common lift first for a query that matches several', () => {
    const results = searchExercises(catalogue, 'squat');
    expect(results.map((r) => r.item.name)).toEqual(['Back Squat', 'Front Squat']);
  });

  it('ranks an exact name above a prefix above a word match', () => {
    const results = searchExercises([backSquat, frontSquat], 'front squat');
    expect(results[0]?.item.name).toBe('Front Squat');
    expect(results[0]?.tier).toBe('exact');
  });

  it('breaks ties within a tier by popularity', () => {
    const a: SearchableExercise = { name: 'Row A', popularityRank: 50 };
    const b: SearchableExercise = { name: 'Row B', popularityRank: 5 };
    const results = searchExercises([a, b], 'row');
    expect(results.map((r) => r.item.name)).toEqual(['Row B', 'Row A']);
  });

  it('breaks a remaining tie by name, so the order is total on every device', () => {
    const a: SearchableExercise = { name: 'Row Z', popularityRank: 5 };
    const b: SearchableExercise = { name: 'Row A', popularityRank: 5 };
    const results = searchExercises([a, b], 'row');
    expect(results.map((r) => r.item.name)).toEqual(['Row A', 'Row Z']);
  });

  it('returns nothing rather than everything for an empty query', () => {
    expect(searchExercises(catalogue, '')).toEqual([]);
  });

  it('finds by alias', () => {
    const results = searchExercises(catalogue, 'flat bench');
    expect(results[0]?.item.name).toBe('Bench Press');
  });

  it('leaves the input untouched', () => {
    const input = [...catalogue];
    searchExercises(input, 'squat');
    expect(input).toEqual(catalogue);
  });
});

describe('spelling mistakes', () => {
  /**
   * The reason this tier exists. Postgres gets typo tolerance free from its
   * trigram index; SQLite has no trigram operator, so offline this returned an
   * empty screen and no clue why — which people blame the catalogue for.
   */
  it('finds dumbbell exercises when somebody types dumbells', () => {
    const found = searchExercises(
      [
        exercise('Dumbbell Bench Press', 3),
        exercise('Barbell Bench Press', 1),
        exercise('Back Squat', 2),
      ],
      'dumbells',
    );
    expect(found.map((match) => match.item.name)).toEqual(['Dumbbell Bench Press']);
    expect(found[0]?.tier).toBe('fuzzy');
  });

  it('tolerates a transposition', () => {
    expect(searchTierFor(exercise('Barbell Row', 1), 'brabell')).toBe('fuzzy');
  });

  it('tolerates a missing letter and an extra one', () => {
    expect(searchTierFor(exercise('Romanian Deadlift', 1), 'romanan')).toBe('fuzzy');
    expect(searchTierFor(exercise('Romanian Deadlift', 1), 'romaniann')).toBe('fuzzy');
  });

  /**
   * A fuzzy match must never displace a real one. Somebody typing "squat"
   * wants the squats, not everything a letter away from them.
   */
  it('ranks a spelt-correctly match above a fuzzy one', () => {
    const found = searchExercises(
      [exercise('Barbell Curl', 9), exercise('Cable Crunch', 1)],
      'curl',
    );
    expect(found[0]?.item.name).toBe('Barbell Curl');
    expect(found[0]?.tier).not.toBe('fuzzy');
  });

  it('requires every word of a two-word query to land', () => {
    // "dumbell bench" must not match a barbell bench press on "bench" alone.
    expect(searchTierFor(exercise('Barbell Bench Press', 1), 'dumbell bench')).toBeNull();
    expect(searchTierFor(exercise('Dumbbell Bench Press', 1), 'dumbell bench')).toBe('fuzzy');
  });

  /**
   * At three characters a budget of one turns "row" into a match for "rows",
   * "raw", "bow" and "how" at once — every short word in the catalogue, which
   * is worse than no result at all.
   */
  it('does not guess at short words', () => {
    expect(typoBudget(3)).toBe(0);
    expect(searchTierFor(exercise('Barbell Row', 1), 'bow')).toBeNull();
    expect(searchTierFor(exercise('Cable Fly', 1), 'sly')).toBeNull();
  });

  it('allows more mistakes in a longer word', () => {
    expect(typoBudget(4)).toBe(1);
    expect(typoBudget(9)).toBe(2);
    // Two mistakes in a short word is still a different word.
    expect(searchTierFor(exercise('Cable Fly', 1), 'tabl')).toBeNull();
  });

  it('still returns nothing for a word that is not in the catalogue', () => {
    expect(searchExercises([exercise('Barbell Row', 1)], 'trampoline')).toEqual([]);
  });

  it('matches an alias with a typo in it', () => {
    const rdl = { name: 'Romanian Deadlift', aliases: ['stiff leg deadlift'], popularityRank: 1 };
    expect(searchTierFor(rdl, 'deadlfit')).toBe('fuzzy');
    // And a prefix of an alias is still the better, earlier tier.
    expect(searchTierFor(rdl, 'stif')).toBe('word-prefix');
  });
});
