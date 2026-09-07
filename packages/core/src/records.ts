/**
 * A personal record, at the moment it happens.
 *
 * `personalRecords` in `progress.ts` answers a different question: *what are
 * my bests*, over a window, for a screen somebody opens afterwards. It is the
 * right shape for a list and the wrong shape for a moment — by the time the
 * Progress screen is open, the set that mattered was three days ago.
 *
 * This answers *did the set I just finished beat anything*, and it is the one
 * half-second in lifting that the app was silently filing away.
 *
 * ## Declarative, not an event
 *
 * Nothing here detects a record "happening". Given the history and the sets
 * logged so far, it says which of today's sets *are* records. That is the same
 * answer on every re-render, survives closing the app and coming back, and
 * cannot fire twice or miss one — all of which an event listener on a write
 * would get wrong at least once.
 *
 * ## What counts, and what deliberately does not
 *
 * **Two kinds, not three.** `max_session_volume` is a real record and it is
 * left on the Progress screen, because it accrues: it would be beaten in the
 * middle of an ordinary third set, and announcing it there means the badge
 * stops meaning *that lift was your best*.
 *
 * **A first attempt is not a record.** Every exercise would fire one the first
 * time it was logged, and a badge that appears for everybody on everything is
 * a decoration rather than an achievement.
 *
 * **A load that cannot be measured cannot be beaten.** A pull-up logged with no
 * bodyweight on the session has no number, and "heaviest yet" against an
 * unknown past is a claim rather than a fact.
 *
 * **Warm-ups never count**, on either side of the comparison.
 *
 * **Ties are not records.** Repeating a best is not beating it, and a badge
 * that appears every time somebody matches their working weight stops meaning
 * anything inside a fortnight. This is the same rule `personalRecords` uses
 * when it keeps the earlier date on a tie.
 */
import { countsTowardVolume, effectiveLoadKg, type LoggedSet } from './load.js';
import { estimateOneRepMax } from './one-rep-max.js';
import type { HistoricalSet } from './progress.js';

/** What today has to beat. Null means the history cannot answer. */
export interface ExerciseBests {
  /** Heaviest single load ever moved on this exercise. */
  readonly maxWeightKg: number | null;
  /** Best estimated one-rep max, which rewards reps as well as load. */
  readonly estimated1rmKg: number | null;
  /**
   * Whether this exercise has ever been trained before.
   *
   * Separate from the two numbers above, because "never done it" and "done it
   * but never with a measurable load" are different, and only the first one
   * makes a badge on the first set wrong for the obvious reason.
   */
  readonly hasHistory: boolean;
}

export const NO_HISTORY: ExerciseBests = {
  maxWeightKg: null,
  estimated1rmKg: null,
  hasHistory: false,
};

export const RECORD_KINDS = ['heaviest', 'best_set'] as const;
export type RecordKind = (typeof RECORD_KINDS)[number];

export interface SetRecord {
  readonly setId: string;
  readonly kind: RecordKind;
  /** Kilograms: the load for `heaviest`, the estimate for `best_set`. */
  readonly value: number;
  /** The number it beat. Never null — a record with nothing to beat is not one. */
  readonly previous: number;
}

/** One of today's sets, with enough identity to hang a badge on. */
export interface IdentifiedSet extends LoggedSet {
  readonly id: string;
}

/**
 * The bests from everything logged before today.
 *
 * Takes the same `HistoricalSet` rows the Progress screen reads. Those come
 * from finished sessions only, so the workout in progress is already excluded
 * and today cannot be its own baseline.
 */
export function bestsFrom(history: readonly HistoricalSet[]): ExerciseBests {
  let maxWeightKg: number | null = null;
  let estimated1rmKg: number | null = null;
  let hasHistory = false;

  for (const set of history) {
    if (!countsTowardVolume(set)) continue;
    hasHistory = true;

    const load = effectiveLoadKg(set, set.bodyweightKg);
    if (load === null) continue;

    if (maxWeightKg === null || load > maxWeightKg) maxWeightKg = load;

    const estimate = estimateOneRepMax(load, set.reps);
    if (estimate !== null && (estimated1rmKg === null || estimate.valueKg > estimated1rmKg)) {
      estimated1rmKg = estimate.valueKg;
    }
  }

  return { maxWeightKg, estimated1rmKg, hasHistory };
}

/**
 * Which of today's sets on one exercise are records.
 *
 * Walked in order with a running best, so the second set of the day at the
 * same weight is not a second record — it beat nothing, the first one did.
 *
 * At most one record per set, and `heaviest` wins when a set is both. Two
 * badges on one row is two claims about the same lift, and the heavier one is
 * the one anybody means.
 */
export function recordsInSession(input: {
  readonly sets: readonly IdentifiedSet[];
  /** The session's snapshot, not today's profile value. */
  readonly bodyweightKg: number | null;
  readonly bests: ExerciseBests;
}): SetRecord[] {
  // Nothing to beat. Not a record, however heavy it was.
  if (!input.bests.hasHistory) return [];

  const records: SetRecord[] = [];
  let bestWeight = input.bests.maxWeightKg;
  let best1rm = input.bests.estimated1rmKg;

  for (const set of input.sets) {
    if (!countsTowardVolume(set)) continue;

    const load = effectiveLoadKg(set, input.bodyweightKg);
    if (load === null) continue;

    // A past that cannot be measured cannot be beaten. Left as null so every
    // later set in the session reaches the same conclusion.
    const beatsWeight = bestWeight !== null && load > bestWeight;
    const estimate = estimateOneRepMax(load, set.reps);
    const beats1rm = best1rm !== null && estimate !== null && estimate.valueKg > best1rm;

    if (beatsWeight && bestWeight !== null) {
      records.push({ setId: set.id, kind: 'heaviest', value: round2(load), previous: bestWeight });
    } else if (beats1rm && best1rm !== null && estimate !== null) {
      records.push({
        setId: set.id,
        kind: 'best_set',
        value: estimate.valueKg,
        previous: best1rm,
      });
    }

    // Both running bests move whichever badge was awarded, so a later set has
    // to beat what actually happened rather than what was announced.
    if (bestWeight !== null && load > bestWeight) bestWeight = load;
    if (best1rm !== null && estimate !== null && estimate.valueKg > best1rm) {
      best1rm = estimate.valueKg;
    }
  }

  return records;
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
