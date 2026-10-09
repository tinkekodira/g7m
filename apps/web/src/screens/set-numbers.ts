/**
 * Which number each set wears, counting warm-ups and working sets separately.
 *
 * A ramp put in front of a working set must not renumber it: adding four
 * warm-ups to an exercise turned "Set 1" into "Set 5", which is the app
 * disagreeing with every training program ever written. Warm-ups get their own
 * count, and the tick's accessible name follows the same rule — "Complete
 * warm-up 2" and "Complete set 1" are different things to be told.
 *
 * Shared by the logger and a finished workout's page, because the two used to
 * disagree: the logger said "Set 1" after two warm-ups and history called the
 * same row "Set 3". A set is the same set whichever screen it is read on.
 *
 * `isFirstWorking` marks the row whose weight the warm-up button ramps to.
 */
export function numberSets<T extends { readonly setType: string }>(
  sets: readonly T[],
): { set: T; number: number; isFirstWorking: boolean }[] {
  let warmups = 0;
  let working = 0;
  let seenWorking = false;

  return sets.map((set) => {
    if (set.setType === 'warmup') {
      warmups += 1;
      return { set, number: warmups, isFirstWorking: false };
    }
    working += 1;
    const first = !seenWorking;
    seenWorking = true;
    return { set, number: working, isFirstWorking: first };
  });
}

/** "Warm-up 2" or "Set 1": the name a numbered set is read out by. */
export function setTitle(setType: string, number: number): string {
  return setType === 'warmup' ? `Warm-up ${String(number)}` : `Set ${String(number)}`;
}
