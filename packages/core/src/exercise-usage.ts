import { SEARCH_TIERS, searchTierFor, type SearchableExercise } from './exercise-search.js';

/** Personal workout-picker order; callers supply the already filtered catalogue. */
export function exercisesByUsage<
  T extends SearchableExercise & { readonly id: string; readonly slug: string },
>(
  exercises: readonly T[],
  usage: ReadonlyMap<string, number>,
  favourites: ReadonlySet<string>,
  query = '',
): T[] {
  const searching = query.trim().length > 0;
  return exercises
    .map((exercise, index) => ({
      exercise,
      index,
      tier: searching ? SEARCH_TIERS.indexOf(searchTierFor(exercise, query) ?? 'fuzzy') : 0,
    }))
    .sort(
      (a, b) =>
        a.tier - b.tier ||
        (usage.get(b.exercise.id) ?? 0) - (usage.get(a.exercise.id) ?? 0) ||
        Number(favourites.has(b.exercise.slug)) - Number(favourites.has(a.exercise.slug)) ||
        a.index - b.index,
    )
    .map(({ exercise }) => exercise);
}
