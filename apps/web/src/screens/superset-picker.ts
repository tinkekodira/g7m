/**
 * Picking a superset in "Add an exercise".
 *
 * With the Superset switch on, a tap selects rather than adds, and the order
 * of the taps is the order of the superset — the first exercise picked is the
 * one done first in every round. Confirm appears once there are two, because
 * one exercise is not a superset.
 */

/** The fewest exercises a superset can have. */
export const MIN_SUPERSET = 2;

/** Tap an exercise: in if it was out, at the end; out if it was in. */
export function toggleSelected<T extends { readonly id: string }>(
  selected: readonly T[],
  item: T,
): T[] {
  return selected.some((entry) => entry.id === item.id)
    ? selected.filter((entry) => entry.id !== item.id)
    : [...selected, item];
}

/** Its place in the superset, from 1, or null when it is not picked. */
export function selectionNumber(
  selected: readonly { readonly id: string }[],
  id: string,
): number | null {
  const index = selected.findIndex((entry) => entry.id === id);
  return index === -1 ? null : index + 1;
}

export function canConfirm(selected: readonly unknown[]): boolean {
  return selected.length >= MIN_SUPERSET;
}
