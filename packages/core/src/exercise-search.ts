/**
 * Finding an exercise by name, offline.
 *
 * Postgres does this with a trigram index over a generated `search_text`
 * column, which is fast and forgiving of typos. None of that exists on the
 * device: SQLite has no trigram operator, and the generated column does not
 * even reach it — Postgres logical replication does not carry generated
 * columns before Postgres 18, so the client rebuilds the same string from
 * `name` and `aliases`, which it does have.
 *
 * The ranking below is deliberately the same shape as the server's. When the
 * catalogue is fifty exercises, "squat" must put Back Squat above Front Squat,
 * and a similarity score alone does not do that — it is length-sensitive, so
 * the shorter name of a less common lift wins. Tiers fix that, and they behave
 * identically online and offline, which matters more than either being clever.
 *
 * The last tier is `fuzzy`, and it exists because the offline path was the
 * weaker of the two. Postgres gets typo tolerance free from its trigram index;
 * SQLite has no trigram operator, so somebody typing "dumbells" got an empty
 * screen and no clue why — and an empty result set for a real word is the kind
 * of failure people blame the catalogue for rather than their spelling.
 */

/**
 * The haystack a search runs against.
 *
 * Byte-for-byte what `public.exercise_search_text(name, aliases)` produces in
 * Postgres. Keeping them identical is what stops the same query returning
 * different results depending on whether the phone had signal.
 */
export function exerciseSearchText(name: string, aliases: readonly string[] = []): string {
  return `${name} ${aliases.join(' ')}`.toLowerCase();
}

/** The tiers, best first. Exported so a caller can explain a result if it wants. */
export const SEARCH_TIERS = ['exact', 'prefix', 'word-prefix', 'substring', 'fuzzy'] as const;
export type SearchTier = (typeof SEARCH_TIERS)[number];

export interface SearchableExercise {
  readonly name: string;
  readonly aliases?: readonly string[];
  /** Lower is more popular. Used to break ties within a tier. */
  readonly popularityRank: number;
}

export interface SearchMatch<T> {
  readonly item: T;
  readonly tier: SearchTier;
}

/** Normalised the same way on both sides of the network. */
function normalise(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Which tier a single exercise falls into, or null if it does not match.
 *
 * The tiers, and why each exists:
 *
 *   · `exact`       — the query is the whole name. "bench press" should not
 *                     rank below "close-grip bench press" for any reason.
 *   · `prefix`      — the name starts with the query. Covers typing forwards,
 *                     which is what everybody does.
 *   · `word-prefix` — some word in the name or an alias starts with the query.
 *                     This is what finds "Barbell Row" from "row", and it is
 *                     the tier that stops the substring tier from burying it.
 *   · `substring`   — the query appears anywhere. The catch-all; matches
 *                     aliases like "bp" and mid-word text.
 */
export function searchTierFor(exercise: SearchableExercise, query: string): SearchTier | null {
  const needle = normalise(query);
  if (needle.length === 0) return null;

  const name = normalise(exercise.name);
  if (name === needle) return 'exact';
  if (name.startsWith(needle)) return 'prefix';

  const haystack = exerciseSearchText(exercise.name, exercise.aliases ?? []);

  // An alias that matches exactly is as good as a name prefix: somebody typing
  // "bp" means bench press and does not want to see everything containing "bp".
  for (const alias of exercise.aliases ?? []) {
    if (normalise(alias) === needle) return 'prefix';
  }

  // A word boundary is a space in this haystack, since both name and aliases
  // are joined with spaces.
  if (haystack.split(' ').some((word) => word.startsWith(needle))) return 'word-prefix';
  if (haystack.includes(needle)) return 'substring';
  if (fuzzyMatches(needle, haystack)) return 'fuzzy';
  return null;
}

/**
 * How many single-character mistakes a word of this length is allowed.
 *
 * Nothing under four characters, because at three a budget of one turns "row"
 * into a match for "rows", "raw", "bow" and "how" — every short word in the
 * catalogue at once, which is worse than no result. The budget then grows with
 * length, since "romanian" has more places to go wrong than "curl" does.
 */
export function typoBudget(wordLength: number): number {
  if (wordLength < 4) return 0;
  if (wordLength < 8) return 1;
  return 2;
}

/**
 * Every word of the query is within a typo or two of some word in the haystack.
 *
 * Word by word rather than over the whole string: "dumbell bench" should find
 * the dumbbell bench press, and a whole-string distance between that query and
 * "dumbbell bench press" is seven edits — mostly the word the user did not
 * type. Requiring *every* query word to land is what stops a two-word search
 * matching on one word and ignoring the other.
 */
function fuzzyMatches(query: string, haystack: string): boolean {
  const tokens = query.split(/\s+/).filter((token) => token.length > 0);
  if (tokens.length === 0) return false;

  const words = haystack.split(' ').filter((word) => word.length > 0);
  return tokens.every((token) => words.some((word) => closeEnough(token, word)));
}

function closeEnough(token: string, word: string): boolean {
  const budget = typoBudget(token.length);
  if (budget === 0) return false;
  // Length alone can rule it out before any of the work below.
  if (Math.abs(token.length - word.length) > budget) return false;
  return withinDistance(token, word, budget);
}

/**
 * Damerau-Levenshtein distance, computed only far enough to answer "is it
 * under `budget`".
 *
 * Damerau rather than plain Levenshtein, which is not a detail. Plain
 * Levenshtein charges two edits for a transposition, so "brabell" is two
 * mistakes away from "barbell" and falls outside a one-edit budget — and
 * swapping two adjacent letters is the single most common way anybody mistypes
 * a word. Counting it as one edit is the whole difference between tolerating
 * real typos and tolerating only the tidy ones.
 *
 * Bounded rather than complete: the caller never wants the number, only the
 * comparison, and a row whose best cell already exceeds the budget cannot
 * recover — every later row is at least as large.
 */
function withinDistance(a: string, b: string, budget: number): boolean {
  // Two rows back, because a transposition reaches diagonally over two.
  let twoBack: number[] = [];
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    const current: number[] = [i];
    let best = i;

    for (let j = 1; j <= b.length; j++) {
      const same = a[i - 1] === b[j - 1];
      let cost = Math.min(
        (previous[j - 1] ?? 0) + (same ? 0 : 1),
        (current[j - 1] ?? 0) + 1,
        (previous[j] ?? 0) + 1,
      );

      // The adjacent swap, charged once rather than twice.
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        cost = Math.min(cost, (twoBack[j - 2] ?? 0) + 1);
      }

      current.push(cost);
      best = Math.min(best, cost);
    }

    if (best > budget) return false;
    twoBack = previous;
    previous = current;
  }

  return (previous[b.length] ?? Infinity) <= budget;
}

/**
 * Exercises matching `query`, best first.
 *
 * Ties inside a tier break on popularity and then on name, so the order is
 * total and identical on every device — the same reason list ordering breaks
 * ties on id rather than leaving them to the sort's whim.
 */
export function searchExercises<T extends SearchableExercise>(
  exercises: readonly T[],
  query: string,
): SearchMatch<T>[] {
  const matches: SearchMatch<T>[] = [];
  for (const item of exercises) {
    const tier = searchTierFor(item, query);
    if (tier !== null) matches.push({ item, tier });
  }

  return matches.sort((a, b) => {
    const byTier = SEARCH_TIERS.indexOf(a.tier) - SEARCH_TIERS.indexOf(b.tier);
    if (byTier !== 0) return byTier;
    const byPopularity = a.item.popularityRank - b.item.popularityRank;
    if (byPopularity !== 0) return byPopularity;
    return a.item.name.localeCompare(b.item.name);
  });
}
