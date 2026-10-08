/**
 * Starred exercises first (ADR-0108).
 *
 * Applied after every filter, never instead of one. A starred squat leads the
 * list when it is in the list: the whole library, the library narrowed to
 * Quads, a search for "squat". Narrowed to Back, it is not in the list, so it
 * does not lead it.
 *
 * Stable on both sides of the split. Whatever order the list came in (the
 * catalogue's popularity order, a search's ranking, a muscle's recruitment
 * weight) still holds among the starred and among the rest, so starring one
 * lift moves that lift and nothing else.
 */
export function favouritesFirst<T extends { readonly slug: string }>(
  exercises: readonly T[],
  favourites: ReadonlySet<string>,
): T[] {
  if (favourites.size === 0) return [...exercises];
  const starred: T[] = [];
  const rest: T[] = [];
  for (const exercise of exercises) {
    (favourites.has(exercise.slug) ? starred : rest).push(exercise);
  }
  return [...starred, ...rest];
}
