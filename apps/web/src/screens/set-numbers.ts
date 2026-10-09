/**
 * Which number each set wears, counting warm-ups and working sets separately.
 *
 * A ramp put in front of a working set must not renumber it: adding four
 * warm-ups to an exercise turned "Set 1" into "Set 5", which is the app
 * disagreeing with every training program ever written. Warm-ups get their own
 * count, and the tick's accessible name follows the same rule — "Complete
 * warm-up 2" and "Complete set 1" are different things to be told.
 *
 * A drop is not a set of its own (ADR-0112): it takes no set number, and is
 * counted instead among the drops off the set above it — "Drop", "Drop 2" —
 * with `parent` saying which set that is.
 *
 * Shared by the logger and a finished workout's page, because the two used to
 * disagree: the logger said "Set 1" after two warm-ups and history called the
 * same row "Set 3". A set is the same set whichever screen it is read on.
 *
 * `isFirstWorking` marks the row whose weight the warm-up button ramps to.
 */
export function numberSets<T extends { readonly setType: string }>(
  sets: readonly T[],
): { set: T; number: number; parent: number; drop: boolean; isFirstWorking: boolean }[] {
  let warmups = 0;
  let working = 0;
  let drops = 0;
  let seenWorking = false;

  return sets.map((set) => {
    if (set.setType === 'warmup') {
      warmups += 1;
      return { set, number: warmups, parent: 0, drop: false, isFirstWorking: false };
    }
    // A drop with a set above it hangs from that set. One with nothing above
    // it — its set deleted on another phone — is numbered as the set it now is.
    if (set.setType === 'dropset' && working > 0) {
      drops += 1;
      return { set, number: drops, parent: working, drop: true, isFirstWorking: false };
    }
    working += 1;
    drops = 0;
    const first = !seenWorking;
    seenWorking = true;
    return { set, number: working, parent: working, drop: false, isFirstWorking: first };
  });
}

/** Whether a numbered row is a drop hanging from a set, rather than a set. */
export function isDropRow(entry: { readonly drop: boolean }): boolean {
  return entry.drop;
}

/** "Warm-up 2" or "Set 1": the name a numbered set is read out by. */
export function setTitle(setType: string, number: number): string {
  return setType === 'warmup' ? `Warm-up ${String(number)}` : `Set ${String(number)}`;
}

/** As `setTitle`, and "Drop", "Drop 2" for the drops hanging from a set. */
export function rowTitle(entry: {
  readonly set: { readonly setType: string };
  readonly number: number;
  readonly drop: boolean;
}): string {
  if (isDropRow(entry)) return entry.number <= 1 ? 'Drop' : `Drop ${String(entry.number)}`;
  return setTitle(entry.set.setType, entry.number);
}

/**
 * What the tick says it does: "Complete set 2", "Undo warm-up 1", "Complete
 * drop 1 of set 2". A drop names its set, because "Complete drop 1" alone
 * would be the same words on every exercise's first drop.
 */
export function tickLabel(entry: {
  readonly set: { readonly setType: string; readonly isCompleted: boolean };
  readonly number: number;
  readonly parent: number;
  readonly drop: boolean;
}): string {
  const verb = entry.set.isCompleted ? 'Undo' : 'Complete';
  if (entry.set.setType === 'warmup') return `${verb} warm-up ${String(entry.number)}`;
  if (isDropRow(entry)) {
    return `${verb} drop ${String(entry.number)} of set ${String(entry.parent)}`;
  }
  return `${verb} set ${String(entry.number)}`;
}
