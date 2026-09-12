/**
 * Whether a lift is going anywhere.
 *
 * The review used to answer this with one subtraction: the heaviest effective
 * load in the last session minus the heaviest in the first. Three things were
 * wrong with that, and each told somebody who was progressing that they were
 * stuck.
 *
 * **Reps did not count.** 80 kg for 6 and then 80 kg for 10 is progress — it
 * is exactly the progression the plan itself prescribes ("same weight, more
 * reps") — and a subtraction of weights calls it zero.
 *
 * **Bodyweight movements were weighed by the body.** A pull-up's effective
 * load is the lifter's bodyweight, so going from 6 to 12 pull-ups while losing
 * two kilos read as going *down*, and gaining weight while getting weaker read
 * as going up. What moves on a pull-up is the reps, or the belt, or the
 * assistance on the machine — never the scale.
 *
 * **It only looked at the ends.** A lift that jumped in the first week and then
 * sat still for a month was "going up", because the last session was heavier
 * than the first. The plateau it was actually on was never reported.
 *
 * So progress is now a *new best*: a set that beats every one before it —
 * heavier, or as heavy for more reps — measured on the lift's own ladder. A
 * lift is stalled when its best has stood for three sessions and twenty days.
 *
 * Pure: sets in, a verdict out.
 */
import { countsTowardVolume, type LoadType } from './load.js';
import type { HistoricalSet } from './progress.js';
import { daysBetween } from './week.js';

/** A lift is not judged on fewer sessions than this. */
export const SESSIONS_BEFORE_JUDGING = 3;

/**
 * Sessions a best must stand, counting the one that set it, before it is a
 * plateau: the session that set it and two that tried and did not beat it.
 */
export const SESSIONS_BEFORE_STALLED = 3;

/** And days, so three sessions in one week is not a plateau. */
export const DAYS_BEFORE_STALLED = 20;

/** Below the storage precision of `numeric(6,2)`, two weights are the same weight. */
const SAME_WEIGHT_KG = 0.005;

/**
 * One set, as far as progress is concerned.
 *
 * The weight is the logged one — the bar, the belt, or the assistance — never
 * the effective load, because the effective load of a bodyweight movement is
 * mostly the lifter's bodyweight, and that is not what they are trying to move.
 */
export interface LiftMark {
  readonly loadType: LoadType;
  readonly weightKg: number;
  readonly reps: number;
}

/**
 * Where a set sits on its exercise's ladder, in kilograms. Further up is harder.
 *
 * One scale for every way a movement can be loaded, so a lifter moving from
 * the assisted machine to bodyweight to a belt climbs it the whole way: forty
 * kilos of assistance is −40, bodyweight alone is 0, ten on a belt is +10.
 */
export function ladderKg(mark: LiftMark): number {
  switch (mark.loadType) {
    case 'external':
    case 'bodyweight_plus':
      return mark.weightKg;
    case 'bodyweight':
      return 0;
    case 'assisted':
      return -mark.weightKg;
  }
}

/**
 * Whether `a` is a better set than `b`: heavier, or as heavy for more reps.
 *
 * Deliberately not an estimated one-rep max. That would rank 80 kg for 10 above
 * 85 kg for 6, and the step from the first to the second is the most ordinary
 * progression there is — top of the range, add weight, drop to the bottom of
 * the range. Lighter for more reps is not counted either way: it may be
 * progress and it may be an easy day, and a verdict should not rest on a
 * maybe.
 */
export function beats(a: LiftMark, b: LiftMark): boolean {
  const difference = ladderKg(a) - ladderKg(b);
  if (difference > SAME_WEIGHT_KG) return true;
  if (difference < -SAME_WEIGHT_KG) return false;
  return a.reps > b.reps;
}

export interface SessionBest {
  readonly sessionId: string;
  /** When the session started, as everywhere else. */
  readonly at: Date;
  readonly best: LiftMark;
}

/**
 * The best set of each session, oldest session first.
 *
 * Only sets that count — completed, not warm-ups — and only sets with reps in
 * them. A heavy single logged as zero reps is a miss, and a miss is not the new
 * best.
 */
export function sessionBests(sets: readonly HistoricalSet[]): SessionBest[] {
  const bySession = new Map<string, SessionBest>();

  for (const set of sets) {
    if (!countsTowardVolume(set) || !(set.reps > 0)) continue;
    const mark: LiftMark = { loadType: set.loadType, weightKg: set.weightKg, reps: set.reps };
    const current = bySession.get(set.sessionId);
    if (current === undefined || beats(mark, current.best)) {
      bySession.set(set.sessionId, { sessionId: set.sessionId, at: set.performedAt, best: mark });
    }
  }

  return [...bySession.values()].sort((a, b) => a.at.getTime() - b.at.getTime());
}

export type LiftVerdict =
  /** A new best since the first session in the window, and no plateau since it. */
  | {
      readonly kind: 'climbing';
      /** The first session's best. */
      readonly from: LiftMark;
      /** The best since. */
      readonly to: LiftMark;
      readonly sessions: number;
    }
  /** The best has stood for three sessions and twenty days. */
  | {
      readonly kind: 'stalled';
      readonly best: LiftMark;
      /** Sessions since the best that did not beat it. Two at the least. */
      readonly sessionsSince: number;
      /** Days from the session that set the best to `now`. */
      readonly daysSince: number;
      /** From the best to the last session — how long it has been tried. */
      readonly plateauDays: number;
    }
  /** Too few sessions, or a best too recent to have stood for long. */
  | { readonly kind: 'unclear' };

/**
 * Read one lift's sessions.
 *
 * A plateau outranks an early climb. A lift that went up in the first week and
 * has not moved since is stuck *now*, and that is the thing worth knowing.
 */
export function judgeLift(sets: readonly HistoricalSet[], now: Date): LiftVerdict {
  const bests = sessionBests(sets);
  const first = bests[0];
  const last = bests.at(-1);
  if (first === undefined || last === undefined || bests.length < SESSIONS_BEFORE_JUDGING) {
    return { kind: 'unclear' };
  }

  let record = first;
  let recordIndex = 0;
  bests.forEach((session, index) => {
    if (beats(session.best, record.best)) {
      record = session;
      recordIndex = index;
    }
  });

  const standing = bests.length - recordIndex;
  const plateauDays = daysBetween(record.at, last.at);
  if (standing >= SESSIONS_BEFORE_STALLED && plateauDays >= DAYS_BEFORE_STALLED) {
    return {
      kind: 'stalled',
      best: record.best,
      sessionsSince: standing - 1,
      daysSince: Math.max(plateauDays, daysBetween(record.at, now)),
      plateauDays,
    };
  }

  if (recordIndex > 0) {
    return { kind: 'climbing', from: first.best, to: record.best, sessions: bests.length };
  }

  return { kind: 'unclear' };
}

/**
 * How much a lift has improved, as a fraction, for ranking one climber against
 * another. Never shown.
 *
 * Climbers have to be compared somehow, and "which moved most" across a squat
 * going up in kilos and a pull-up going up in reps needs one scale. An Epley
 * estimate over the ladder does it, with a bodyweight added back for the
 * movements that carry one — the same bodyweight at both ends, so the scale
 * cannot move the answer.
 */
export function liftImprovement(from: LiftMark, to: LiftMark, bodyweightKg: number): number {
  const capacity = (mark: LiftMark): number => {
    const carried = mark.loadType === 'external' ? 0 : bodyweightKg;
    return Math.max(0, ladderKg(mark) + carried) * (1 + mark.reps / 30);
  };
  const before = capacity(from);
  if (before <= 0) return 0;
  return capacity(to) / before - 1;
}
