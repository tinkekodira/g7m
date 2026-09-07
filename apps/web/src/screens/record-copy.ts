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

  const name = exerciseName.toLocaleLowerCase();

  if (record.kind === 'heaviest') {
    return {
      badge: 'PR',
      short: 'Heaviest yet',
      headline: `Heaviest ${name} yet`,
      detail: `${format(now.value)} ${now.unit} — ${format(gain)} ${now.unit} over your old best.`,
    };
  }

  return {
    badge: 'PR',
    short: 'Best set yet',
    headline: `Best ${name} set yet`,
    // Named as an estimate, because it is one. A number presented as measured
    // when it was calculated is the kind of thing people build a plan on.
    detail: `Estimated max ${format(now.value)} ${now.unit}, up from ${format(before.value)} ${before.unit}.`,
  };
}

function roundTo(value: number, places: number): number {
  const factor = 10 ** places;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/** No trailing zeroes: "5" rather than "5.00", "2.5" rather than "2.50". */
function format(value: number): string {
  return String(Number(value.toFixed(2)));
}
