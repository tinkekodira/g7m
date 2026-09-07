/**
 * Turning a goal into numbers a workout can be built from.
 *
 * This is the opinionated part of the app and the part most likely to be
 * wrong, so every number below says where it came from. They are middle-of-the
 * -road readings of the training literature, not the aggressive end: the cost
 * of prescribing too little is a slower month, and the cost of prescribing too
 * much is an injured person who stops.
 *
 * Nothing here reads a bodyweight or a height. ADR-0035 and ADR-0036 hold
 * across this file too — the plan is shaped by the goal, the training history
 * and how many days somebody has, never by an opinion about their body.
 */
import { DEFAULT_INCREMENT_KG } from './units.js';
import type { ExperienceLevel, TrainingGoal } from './goals.js';

export interface Prescription {
  /** The rep window each working set aims for. */
  readonly repLow: number;
  readonly repHigh: number;
  /**
   * Target working sets per muscle group per week.
   *
   * The single most load-bearing number in the app. Roughly 10 sets a week is
   * where most people stop leaving progress on the table and roughly 20 is
   * where the returns flatten for almost everybody, so the goals sit inside
   * that band and lean low.
   */
  readonly weeklySetsPerGroup: number;
  /** Rest after a compound. Isolations get less; see `restSecondsFor`. */
  readonly restSeconds: number;
  /**
   * Reps left in the tank at the end of a working set.
   *
   * Not zero for any goal. Training to failure on every set costs more
   * recovery than the extra rep buys, and it is the single easiest way for a
   * generated plan to bury somebody in week two.
   */
  readonly repsInReserve: number;
  /** How much to add when the top of the rep range gets hit. */
  readonly progressionKg: number;
  /** Sets in one session, past which the session is too long to finish. */
  readonly maxSetsPerSession: number;
  readonly maxExercisesPerSession: number;
}

const BASE: Record<
  TrainingGoal,
  Omit<Prescription, 'progressionKg' | 'maxSetsPerSession' | 'maxExercisesPerSession'>
> = {
  /**
   * Heavy, low reps, long rests. Volume is deliberately the lowest of the
   * four: strength comes from practising heavy singles-to-fives, and the
   * fatigue from extra sets competes directly with the ability to lift heavy
   * on the next one.
   */
  get_stronger: {
    repLow: 3,
    repHigh: 6,
    weeklySetsPerGroup: 10,
    restSeconds: 210,
    repsInReserve: 2,
  },

  /** The most total work of the four, in the range that tolerates it. */
  build_muscle: {
    repLow: 6,
    repHigh: 12,
    weeklySetsPerGroup: 16,
    restSeconds: 150,
    repsInReserve: 1,
  },

  /**
   * Intensity stays high and volume comes down. In a deficit recovery is
   * worse, and the training's job changes from adding muscle to keeping the
   * muscle already there — which heavy loads do and extra sets do not.
   */
  lose_fat: { repLow: 6, repHigh: 10, weeklySetsPerGroup: 12, restSeconds: 120, repsInReserve: 2 },

  /** Between the two, with the fatigue tolerance of neither. */
  recomp: { repLow: 6, repHigh: 12, weeklySetsPerGroup: 14, restSeconds: 150, repsInReserve: 2 },
};

/**
 * Less for a beginner, slightly more for an advanced lifter.
 *
 * The direction surprises people who assume beginners need to work hardest. A
 * beginner adapts to almost anything, gets more out of practising the movement
 * than out of the tenth set, and is the person most likely to hurt themselves
 * chasing volume they cannot yet recover from.
 */
const EXPERIENCE_VOLUME: Record<ExperienceLevel, number> = {
  beginner: 0.7,
  intermediate: 1,
  advanced: 1.15,
};

/** A session past this stops being finished; it becomes abandoned. */
const SESSION_CAPS: Record<ExperienceLevel, { sets: number; exercises: number }> = {
  beginner: { sets: 15, exercises: 5 },
  intermediate: { sets: 20, exercises: 6 },
  advanced: { sets: 24, exercises: 7 },
};

export function prescriptionFor(
  goal: TrainingGoal,
  experience: ExperienceLevel | null,
): Prescription {
  const level = experience ?? 'beginner';
  const base = BASE[goal];
  const caps = SESSION_CAPS[level];

  return {
    ...base,
    weeklySetsPerGroup: Math.round(base.weeklySetsPerGroup * EXPERIENCE_VOLUME[level]),
    progressionKg: DEFAULT_INCREMENT_KG,
    maxSetsPerSession: caps.sets,
    maxExercisesPerSession: caps.exercises,
  };
}

export const SESSION_FOCUSES = ['full_body', 'upper', 'lower', 'push', 'pull', 'legs'] as const;
export type SessionFocus = (typeof SESSION_FOCUSES)[number];

export const FOCUS_LABELS: Record<SessionFocus, string> = {
  full_body: 'Full body',
  upper: 'Upper body',
  lower: 'Lower body',
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
};

/**
 * The muscle groups each focus is responsible for, in priority order.
 *
 * Order matters: the generator spends a session's budget from the front, so
 * the group listed first is the one that still gets trained when time runs
 * out. Big movers lead; forearms and neck appear nowhere, because they get
 * enough work from everything else and nobody's first month should be spent on
 * them.
 */
export const FOCUS_GROUPS: Record<SessionFocus, readonly string[]> = {
  full_body: ['quads', 'back', 'chest', 'hamstrings', 'shoulders', 'glutes', 'core'],
  upper: ['back', 'chest', 'shoulders', 'triceps', 'biceps'],
  lower: ['quads', 'hamstrings', 'glutes', 'calves', 'core'],
  push: ['chest', 'shoulders', 'triceps'],
  pull: ['back', 'biceps', 'traps'],
  legs: ['quads', 'hamstrings', 'glutes', 'calves'],
};

/**
 * The week's rotation, from how many days somebody actually has.
 *
 * A split is a way of dividing a week's work so each muscle gets trained often
 * enough and recovers in between. Which one is right is mostly a function of
 * frequency, which is why this takes days and not preference:
 *
 *   1–3 days   full body every time. Splitting three days into push/pull/legs
 *              hits each muscle once a week, and once a week is the least
 *              productive frequency there is.
 *   4 days     upper/lower twice. Everything twice a week, which is the sweet
 *              spot most of the literature lands on.
 *   5 days     upper/lower plus a push, so the extra day goes to the muscles
 *              with the most room rather than to a fourth leg session.
 *   6–7 days   push/pull/legs twice through. At seven the seventh day repeats
 *              the focus with the least recent work rather than inventing an
 *              eighth category.
 *
 * An advanced lifter on three days gets push/pull/legs instead: they can
 * generate enough fatigue in one session that training everything three times
 * a week stops fitting inside the recovery.
 */
export function splitFor(
  daysPerWeek: number,
  experience: ExperienceLevel | null,
): readonly SessionFocus[] {
  const days = Math.min(7, Math.max(1, Math.round(daysPerWeek)));

  if (days <= 2) return Array.from({ length: days }, () => 'full_body' as const);
  if (days === 3) {
    return experience === 'advanced'
      ? ['push', 'pull', 'legs']
      : ['full_body', 'full_body', 'full_body'];
  }
  if (days === 4) return ['upper', 'lower', 'upper', 'lower'];
  if (days === 5) return ['upper', 'lower', 'push', 'pull', 'legs'];
  if (days === 6) return ['push', 'pull', 'legs', 'push', 'pull', 'legs'];
  return ['push', 'pull', 'legs', 'push', 'pull', 'legs', 'full_body'];
}

/**
 * Which session is next.
 *
 * Driven by how many sessions have already happened this week rather than by
 * the day of the week, because a plan tied to calendar days punishes somebody
 * for training on Tuesday instead of Monday — and the person most likely to
 * miss a day is the person who most needs the app not to make it a failure.
 *
 * Past the end of the split it wraps, so an extra session is the start of the
 * rotation again rather than a rest day the app refuses to let them skip.
 */
export function nextFocus(split: readonly SessionFocus[], sessionsThisWeek: number): SessionFocus {
  if (split.length === 0) return 'full_body';
  const index = Math.max(0, Math.trunc(sessionsThisWeek)) % split.length;
  return split[index] ?? 'full_body';
}
