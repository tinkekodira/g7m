/**
 * Saying what was beaten, in the reader's own units.
 *
 * Separate from `records.ts` for the same reason `review-copy.ts` is separate
 * from `review.ts`: core answers in kilograms and the screen answers in words,
 * and a lifter reading in pounds must not be shown a delta that does not add
 * up against the two numbers either side of it.
 *
 * Understated on purpose. The badge is "PR", which is what a gym calls it, and
 * the line under it is two numbers and no adjectives. A record that has to be
 * described as huge is not one.
 */
import { formatNumber, t } from '@g7m/i18n';
import { toDisplayWeight, type SetRecord, type UnitSystem } from '@g7m/core';

export interface RecordLine {
  /** Short enough to sit on a set row next to "Set 3". */
  readonly badge: string;
  /**
   * For the set row, where the card heading already says which lift it was.
   * Repeating the exercise name there reads as a bug.
   */
  readonly short: string;
  /** For the bar at the bottom, which has no exercise name near it. */
  readonly headline: string;
  readonly detail: string;
}

export function describeRecord(
  record: SetRecord,
  exerciseName: string,
  unitSystem: UnitSystem,
): RecordLine {
  // Both numbers are converted before the subtraction, so the difference shown
  // is the difference between the two figures on the screen. Converting the
  // kilogram delta instead gives an honest number that visibly fails to add up.
  const now = toDisplayWeight(record.value, unitSystem);
  const before = toDisplayWeight(record.previous, unitSystem);
  const gain = roundTo(now.value - before.value, unitSystem === 'imperial' ? 1 : 2);

  const words = t().workout.record;

  if (record.kind === 'heaviest') {
    return {
      badge: words.badge,
      short: words.heaviestShort,
      headline: words.heaviest(exerciseName),
      detail: words.heaviestDetail(format(now.value), format(gain), now.unit),
    };
  }

  return {
    badge: words.badge,
    short: words.bestShort,
    headline: words.best(exerciseName),
    // Named as an estimate, because it is one. A number presented as measured
    // when it was calculated is the kind of thing people build a plan on.
    detail: words.bestDetail(format(now.value), format(before.value), now.unit, before.unit),
  };
}

function roundTo(value: number, places: number): number {
  const factor = 10 ** places;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/** No trailing zeroes: "5" rather than "5.00", "2.5" rather than "2.50". */
function format(value: number): string {
  return formatNumber(Number(value.toFixed(2)));
}
