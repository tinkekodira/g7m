/**
 * When to say "that was too easy — put more on".
 *
 * The logger already knows what was just lifted and for how many. Double
 * progression is the rule almost every programme runs on: stay at a weight
 * until the top of the rep range is reached, then move up. The app was
 * watching that happen and saying nothing.
 *
 * ## What earns it
 *
 * The **last working set** of an exercise, once every set is ticked, at or
 * above the top of its rep range — and never below ten, so an exercise whose
 * range tops out at six does not suggest more weight for a set of seven.
 *
 * Only the last set. A first set of twelve followed by a third of six is a
 * lifter who found the weight, not one who beat it, and the last set is the
 * one the rest of the app already asks about.
 *
 * ## What does not
 *
 * **Plain bodyweight and assisted sets.** "Add weight" to a set of push-ups is
 * not advice, and on an assisted machine more weight means *less* work.
 *
 * **A warm-up.** Preparing to lift is not lifting.
 *
 * It is a nudge, not a prescription: nothing here writes anything, and the
 * lifter is the one who decides. ADR-0076.
 */
import { countsTowardVolume, type LoggedSet } from './load.js';

/**
 * Never suggest more weight below this, whatever the exercise's range says.
 *
 * Ten is where a set stops being heavy for almost anybody. A triple at the top
 * of a three-to-five range is a good set, not an invitation.
 */
export const MIN_REPS_FOR_MORE_WEIGHT = 10;

export interface WeightAdvice {
  /** What was lifted, in kilograms. */
  readonly weightKg: number;
  /** What to try next time, in kilograms. */
  readonly nextKg: number;
  /** The reps that earned the advice. */
  readonly reps: number;
}

export function repsThatEarnMoreWeight(repHigh: number | null): number {
  if (repHigh === null || !Number.isFinite(repHigh)) return MIN_REPS_FOR_MORE_WEIGHT;
  return Math.max(MIN_REPS_FOR_MORE_WEIGHT, Math.round(repHigh));
}

export function weightAdvice(input: {
  /** Every set logged for one exercise in this session, in order. */
  readonly sets: readonly LoggedSet[];
  /** `exercises.default_rep_high`: the top of the range this exercise aims for. */
  readonly repHigh: number | null;
  /** One step up on this exercise, in kilograms. */
  readonly stepKg: number;
}): WeightAdvice | null {
  const working = input.sets.filter((set) => set.setType !== 'warmup');
  // Mid-exercise is the wrong moment: there may be another set coming, and it
  // is the last one that decides.
  if (working.length === 0 || !working.every((set) => set.isCompleted)) return null;

  const last = working[working.length - 1];
  if (last === undefined || !countsTowardVolume(last)) return null;
  if (last.loadType === 'bodyweight' || last.loadType === 'assisted') return null;
  if (!(last.weightKg > 0) || !(last.reps >= repsThatEarnMoreWeight(input.repHigh))) return null;
  if (!(input.stepKg > 0)) return null;

  return {
    weightKg: last.weightKg,
    nextKg: round2(last.weightKg + input.stepKg),
    reps: last.reps,
  };
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
