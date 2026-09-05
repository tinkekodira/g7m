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
export const SEARCH_TIERS = ['exact', 'prefix', 'word-prefix', 'substring'] as const;
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
  return null;
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
