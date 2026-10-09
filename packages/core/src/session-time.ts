/**
 * How long a session takes, and what to do when it will not fit.
 *
 * The person this is for has forty minutes before work and a plan that needs
 * fifty. Cutting the last two exercises is what most apps would do, and it
 * cuts exactly the accessories that were behind. Doing them in pairs — a
 * curl between sets of a triceps pushdown — gets the same work done in less
 * time, which is what a coach standing there would suggest.
 *
 * Only when time is short. A superset trades a little quality for time, and
 * nobody who has an hour should be made to make that trade.
 */
import { estimateSessionSeconds } from './estimate.js';

export interface TimedExercise {
  readonly sets: number;
  readonly restSeconds: number;
  /** Shared by the exercises done as one superset; null for straight sets. */
  readonly superset: string | null;
}

export interface PairableExercise extends TimedExercise {
  readonly exerciseId: string;
  readonly mechanic: 'compound' | 'isolation' | 'unknown';
  /** The group this exercise was chosen for. */
  readonly groupSlug: string;
  /** Every group it trains as a primary mover. */
  readonly groupSlugs: readonly string[];
  readonly repHigh: number;
}

/** Pairs that pull against each other, so one rests while the other works. */
const ANTAGONISTS: readonly (readonly [string, string])[] = [
  ['chest', 'back'],
  ['biceps', 'triceps'],
  ['quads', 'hamstrings'],
];

const LOWER_BODY = new Set(['quads', 'hamstrings', 'glutes', 'calves']);

/** Heavy enough that a lifter needs every second of the rest, and the station to themselves. */
const HEAVY_REP_HIGH = 6;

export function areAntagonists(a: string, b: string): boolean {
  return ANTAGONISTS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

/**
 * Whether two exercises can be done as a superset without one ruining the
 * other.
 *
 *   · **Different muscles.** A superset of two chest exercises is not a
 *     superset, it is a longer set with a walk in the middle.
 *   · **Never a heavy compound.** A squat for five needs its full rest; doing
 *     anything between its sets is how a heavy set fails.
 *   · **Two compounds only as antagonists, and not two leg lifts.** A bench
 *     press and a row work, each resting what the other trains. A squat and a
 *     Romanian deadlift both tax the legs and lower back, and the second set of
 *     either suffers.
 */
export function compatiblePair(a: PairableExercise, b: PairableExercise): boolean {
  if (a.exerciseId === b.exerciseId) return false;
  const groupsA = new Set([a.groupSlug, ...a.groupSlugs]);
  if ([b.groupSlug, ...b.groupSlugs].some((group) => groupsA.has(group))) return false;
  if (isHeavyCompound(a) || isHeavyCompound(b)) return false;
  if (a.mechanic === 'compound' && b.mechanic === 'compound') {
    if (!areAntagonists(a.groupSlug, b.groupSlug)) return false;
    if (LOWER_BODY.has(a.groupSlug) && LOWER_BODY.has(b.groupSlug)) return false;
  }
  return true;
}

function isHeavyCompound(exercise: PairableExercise): boolean {
  return exercise.mechanic === 'compound' && exercise.repHigh <= HEAVY_REP_HIGH;
}

export interface FittedSession<T> {
  /** The session, paired where it had to be, in the order to do it. */
  readonly exercises: T[];
  /** Left out because even paired up it would not fit, last first. */
  readonly trimmed: T[];
  /** Whether anything was paired. */
  readonly paired: boolean;
  readonly estimatedSeconds: number;
}

/**
 * Pair exercises up until the session fits the time there is.
 *
 * Nothing changes if it already fits. Otherwise pairs are made one at a time,
 * best first: antagonists before anything else, and later exercises before
 * earlier ones, because the accessories at the end are the ones that were
 * going to be cut, and the big lift at the start is the one worth doing fresh.
 * The second of a pair moves up to sit beside the first.
 *
 * Only once nothing more can be paired is anything cut, from the end, and an
 * exercise left alone by its partner going goes back to straight sets.
 */
export function pairForTime<T extends PairableExercise>(
  exercises: readonly T[],
  budgetSeconds: number,
): FittedSession<T> {
  let list: T[] = exercises.map((exercise) => ({ ...exercise, superset: null }));
  const fits = (): boolean => (estimateSessionSeconds(list) ?? 0) <= budgetSeconds;
  let labels = 0;

  while (!fits()) {
    let best: { i: number; j: number; score: number } | null = null;
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i]!;
        const b = list[j]!;
        if (a.superset !== null || b.superset !== null || !compatiblePair(a, b)) continue;
        const score = (areAntagonists(a.groupSlug, b.groupSlug) ? 100 : 0) + i + j;
        if (best === null || score > best.score) best = { i, j, score };
      }
    }
    if (best === null) break;

    const { i, j } = best;
    const label = String.fromCharCode(65 + labels++);
    const first = { ...list[i]!, superset: label } as T;
    const second = { ...list[j]!, superset: label } as T;
    const others = list.filter((_, index) => index !== i && index !== j);
    others.splice(i, 0, first, second);
    list = others;
  }

  const trimmed: T[] = [];
  while (!fits() && list.length > 1) {
    const last = list.pop()!;
    trimmed.push(last);
    const label = last.superset;
    if (label !== null && list.filter((exercise) => exercise.superset === label).length === 1) {
      list = list.map((exercise) =>
        exercise.superset === label ? { ...exercise, superset: null } : exercise,
      );
    }
  }

  return {
    exercises: list,
    trimmed,
    paired: list.some((exercise) => exercise.superset !== null),
    estimatedSeconds: estimateSessionSeconds(list) ?? 0,
  };
}
