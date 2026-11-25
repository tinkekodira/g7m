/**
 * The time of a workout logged afterwards (ADR-0061, ADR-0193).
 *
 * Every reader of a workout's duration — calendar, progress, the recap, a
 * friend's view, the server's summaries — measures it from the first counted
 * set to the last (`trainingMinutes`), a timed set or bout counting from when
 * it began. A past workout stamps all its sets at one instant, which is what
 * makes it read as "not recorded". Giving it a time therefore means spreading
 * those stamps across the window the lifter says it took: no new column, no
 * new sync rule, and every reader agrees without being told.
 */

/** Longer than any real session; a typo of 900 minutes is refused, not saved. */
export const MAX_PAST_WORKOUT_MINUTES = 600;

export interface PastStampItem {
  readonly setType: string;
  /** A timed set or a cardio bout: it began this long before it was ticked. */
  readonly durationSeconds: number | null;
}

export function validPastWorkoutMinutes(minutes: number): boolean {
  return Number.isInteger(minutes) && minutes >= 1 && minutes <= MAX_PAST_WORKOUT_MINUTES;
}

/**
 * When each completed set was done, in workout order, so the counted sets span
 * exactly `start` to `start + minutes`.
 *
 * Counted sets (everything but warm-ups) are spread evenly, the first at the
 * start and the last at the end; a timed one is never ticked before its own
 * time has passed. A warm-up takes the time of the set it leads into, so the
 * order stays true without it stretching the span the readers ignore it for.
 * One untimed counted set has no span to give and lands at the end.
 */
export function pastWorkoutStamps(
  items: readonly PastStampItem[],
  start: Date,
  minutes: number,
): Date[] {
  const from = start.getTime();
  const span = minutes * 60_000;
  const end = from + span;
  const counted = items.flatMap((item, index) => (item.setType === 'warmup' ? [] : [index]));
  const stamps = new Array<number>(items.length).fill(end);

  counted.forEach((index, k) => {
    const slot = counted.length === 1 ? end : from + Math.round((span * k) / (counted.length - 1));
    const lasted = Math.max(0, items[index]?.durationSeconds ?? 0) * 1000;
    stamps[index] = Math.min(end, Math.max(slot, from + lasted));
  });

  // Each warm-up borrows the next counted set's time; trailing ones, the end.
  let next = end;
  for (let index = items.length - 1; index >= 0; index--) {
    if (items[index]?.setType === 'warmup') stamps[index] = next;
    else next = stamps[index] ?? end;
  }
  return stamps.map((at) => new Date(at));
}
