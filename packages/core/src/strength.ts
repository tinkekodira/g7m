/**
 * An estimated one-rep max for an exercise, from the sets that were logged.
 *
 * The maths has been here since the start (`one-rep-max.ts`), and was only
 * ever used to decide personal records. This is the number itself, for the
 * exercise's own page: roughly how much could be lifted once, today.
 *
 * Two readings. **Current** is the best estimate from the last eight weeks —
 * long enough to include a heavy day, short enough to still be true. **Best**
 * is the best ever, which is the same unless somebody was stronger before.
 *
 * Only sets the formula means something for: completed working sets of twelve
 * reps or fewer (the limit `estimateOneRepMax` already holds), on a loaded bar,
 * machine or cable — or on a belt, where the estimate includes the bodyweight
 * it hangs from. Plain bodyweight and assisted work are left out. A push-up is
 * not a lift of the whole body, and an estimate that pretended otherwise would
 * put a number on the page nobody could use.
 */
import { countsTowardVolume, type LoadType } from './load.js';
import { estimateOneRepMax, type OneRepMaxEstimate } from './one-rep-max.js';
import type { HistoricalSet } from './progress.js';

/** How far back "current" looks. */
export const CURRENT_STRENGTH_WEEKS = 8;

const DAY_MS = 86_400_000;

export interface OneRepMaxReading {
  readonly estimate: OneRepMaxEstimate;
  /** When the session it came from started. */
  readonly at: Date;
  readonly loadType: LoadType;
  /** The set as logged: the bar, or what was on the belt. */
  readonly weightKg: number;
  readonly reps: number;
}

export interface StrengthEstimate {
  readonly current: OneRepMaxReading | null;
  readonly best: OneRepMaxReading | null;
}

/** The loaded weight a set's estimate is taken from, or null if it has none. */
function estimableLoadKg(set: HistoricalSet): number | null {
  if (set.loadType === 'external') return set.weightKg;
  if (set.loadType === 'bodyweight_plus') {
    return set.bodyweightKg === null ? null : set.bodyweightKg + set.weightKg;
  }
  return null;
}

export function strengthEstimate(sets: readonly HistoricalSet[], now: Date): StrengthEstimate {
  const since = now.getTime() - CURRENT_STRENGTH_WEEKS * 7 * DAY_MS;
  let current: OneRepMaxReading | null = null;
  let best: OneRepMaxReading | null = null;

  // Higher wins; a tie keeps the earlier one, as a record does — matching a
  // best is not setting it.
  const better = (candidate: OneRepMaxReading, held: OneRepMaxReading | null): boolean =>
    held === null ||
    candidate.estimate.valueKg > held.estimate.valueKg ||
    (candidate.estimate.valueKg === held.estimate.valueKg && candidate.at < held.at);

  for (const set of sets) {
    if (!countsTowardVolume(set)) continue;
    const load = estimableLoadKg(set);
    if (load === null) continue;
    const estimate = estimateOneRepMax(load, set.reps);
    if (estimate === null) continue;

    const reading: OneRepMaxReading = {
      estimate,
      at: set.performedAt,
      loadType: set.loadType,
      weightKg: set.weightKg,
      reps: set.reps,
    };
    if (better(reading, best)) best = reading;
    const at = set.performedAt.getTime();
    if (at >= since && at <= now.getTime() && better(reading, current)) current = reading;
  }

  return { current, best };
}
