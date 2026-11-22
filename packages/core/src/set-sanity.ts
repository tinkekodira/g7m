/**
 * Numbers a set may hold, and numbers worth a second look before they count.
 *
 * Two different questions, answered in two different ways (ADR-0182).
 *
 * **What can be stored at all** is a hard limit, the same on the phone and in
 * Postgres. A phone that accepts a number the server refuses is the worst
 * failure the sync layer has: the set looks saved, the upload is rejected for
 * good, and the server's older value comes back down over what was typed. So
 * every write path clamps to these, and a CHECK on `session_sets` holds the
 * same line for anything that gets past them.
 *
 * **What is probably a typo** is a question, not a limit. 1000 kg on a bench
 * whose best is 100 is a slipped zero far more often than a world record, and
 * once ticked it is a personal record, three achievements, a level and first
 * place on every friend's leaderboard. Nothing here refuses it; the lifter is
 * asked once, and whatever they answer is logged.
 */
import type { LoadType } from './load.js';

/**
 * The heaviest weight a set can hold, in kilograms.
 *
 * Above the heaviest leg press anyone loads in a commercial gym, below the
 * 9999.99 the column's precision would allow. A gym has no bar or sled that
 * holds more, so nothing real is ever clamped.
 */
export const MAX_SET_WEIGHT_KG = 1000;

/**
 * The most reps a set can hold.
 *
 * `reps` also carries seconds for timed holds (a plank, a wall sit), so this
 * is an hour of those: generous for a hold, absurd for reps, which is what the
 * typo check below is for.
 */
export const MAX_SET_REPS = 3600;

/** More reps than this in one set is asked about. */
export const MANY_REPS = 100;

/**
 * With no history to compare against, a weight this heavy is asked about.
 * Elite territory for every free-weight lift; on a machine, a first log this
 * heavy is rare enough that one question costs nothing.
 */
export const UNHEARD_OF_KG = 500;

/** A jump past the best has to be both this many times it… */
const JUMP_FACTOR = 1.5;
/** …and at least this many kilograms over, so light lifts do not nag. */
const JUMP_MIN_KG = 20;

/** Any number into a weight a set can hold: finite, non-negative, 2 dp, capped. */
export function clampSetWeightKg(weightKg: number): number {
  if (!Number.isFinite(weightKg) || weightKg < 0) return 0;
  return Math.min(MAX_SET_WEIGHT_KG, Math.round(weightKg * 100) / 100);
}

/** Any number into a rep (or second) count a set can hold: whole, non-negative, capped. */
export function clampSetReps(reps: number): number {
  if (!Number.isFinite(reps) || reps < 0) return 0;
  return Math.min(MAX_SET_REPS, Math.trunc(reps));
}

/**
 * Whether a set may be ticked as done.
 *
 * A set of nothing is not a set. Ticked, it counted as a working set in the
 * session's totals and the muscle map, and the next set was prefilled from it
 * with zero reps too.
 */
export function canComplete(reps: number): boolean {
  return clampSetReps(reps) >= 1;
}

/** Why a set is worth a second look, with the numbers the question quotes. */
export type SetDoubt =
  | { readonly kind: 'jump'; readonly weightKg: number; readonly bestKg: number }
  | { readonly kind: 'heavy'; readonly weightKg: number }
  | { readonly kind: 'reps'; readonly reps: number };

export interface SetToCheck {
  readonly weightKg: number;
  readonly reps: number;
  readonly loadType: LoadType;
  /** `reps` is seconds of a hold, which run long legitimately. */
  readonly isTimeBased: boolean;
  /**
   * The heaviest load this lift has seen, finished sessions and today's
   * ticked sets together. Null when there is none to go on.
   *
   * Today's sets count so that a jump confirmed once is not asked about again
   * on the next set at the same weight.
   */
  readonly bestKg: number | null;
}

/**
 * Whether to ask before logging this set. Null means log it without a word.
 *
 * Only a load on the bar is weighed against the best. A bodyweight set has no
 * weight to slip, and the number on an assisted one is help from a machine —
 * more of it is the lift getting easier, never a record.
 */
export function doubtAboutSet(set: SetToCheck): SetDoubt | null {
  const weightKg = clampSetWeightKg(set.weightKg);
  if (set.loadType === 'external' || set.loadType === 'bodyweight_plus') {
    const best = set.bestKg !== null && set.bestKg > 0 ? set.bestKg : null;
    if (best !== null) {
      if (weightKg > best * JUMP_FACTOR && weightKg - best >= JUMP_MIN_KG) {
        return { kind: 'jump', weightKg, bestKg: best };
      }
    } else if (weightKg >= UNHEARD_OF_KG) {
      return { kind: 'heavy', weightKg };
    }
  }

  const reps = clampSetReps(set.reps);
  if (!set.isTimeBased && reps > MANY_REPS) return { kind: 'reps', reps };
  return null;
}
