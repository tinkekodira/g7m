/**
 * Estimated one-rep max.
 *
 * Brief §5: use Epley — `w × (1 + reps/30)` — and only compute it for sets of
 * 12 reps or fewer, where the formula is actually meaningful. Store the formula
 * name alongside the value so we can change formulas later without corrupting
 * history that was computed under the old one.
 */

/**
 * Recorded on every stored estimate. When we add Brzycki or Lombardi later,
 * old rows stay interpretable instead of becoming mystery numbers.
 */
export type OneRepMaxFormula = 'epley';

export const CURRENT_1RM_FORMULA: OneRepMaxFormula = 'epley';

/**
 * Above this the rep-max formulae diverge badly from reality — a 20-rep set
 * says more about your conditioning than your strength. Brief §5.
 */
export const MAX_REPS_FOR_1RM_ESTIMATE = 12;

export interface OneRepMaxEstimate {
  readonly valueKg: number;
  readonly formula: OneRepMaxFormula;
  /** Echoed back so a stored estimate is self-describing. */
  readonly sourceWeightKg: number;
  readonly sourceReps: number;
}

/**
 * Estimate a 1RM from a completed set.
 *
 * Returns `null` — not a wrong number — whenever the estimate would be
 * meaningless: too many reps, no reps, non-positive load (bodyweight work),
 * or non-finite input. Callers must handle `null`; that is the point.
 */
export function estimateOneRepMax(weightKg: number, reps: number): OneRepMaxEstimate | null {
  if (!Number.isFinite(weightKg) || !Number.isFinite(reps)) return null;
  if (weightKg <= 0) return null;
  if (!Number.isInteger(reps) || reps < 1) return null;
  if (reps > MAX_REPS_FOR_1RM_ESTIMATE) return null;

  // A single rep IS the one-rep max. Epley would inflate it by 3.3%, which
  // would quietly award a PR the lifter never hit.
  const valueKg = reps === 1 ? weightKg : weightKg * (1 + reps / 30);

  return {
    valueKg: Math.round((valueKg + Number.EPSILON) * 100) / 100,
    formula: CURRENT_1RM_FORMULA,
    sourceWeightKg: weightKg,
    sourceReps: reps,
  };
}

/**
 * The best estimate across a collection of sets, or `null` if none qualify.
 * Used for the per-exercise 1RM trend line (Brief §9).
 */
export function bestOneRepMax(
  sets: readonly { readonly weightKg: number; readonly reps: number }[],
): OneRepMaxEstimate | null {
  let best: OneRepMaxEstimate | null = null;
  for (const set of sets) {
    const estimate = estimateOneRepMax(set.weightKg, set.reps);
    if (estimate !== null && (best === null || estimate.valueKg > best.valueKg)) {
      best = estimate;
    }
  }
  return best;
}
