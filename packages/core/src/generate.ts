/**
 * Building one session out of a goal, a split and what has already been done.
 *
 * The generator is adaptive rather than a fixed template per goal, and the
 * difference is entirely in the last of those three inputs. A template answers
 * "what does a push day look like". This answers "what does *your* push day
 * look like, given that your back is six sets short this week, you benched
 * 80 kg for 8 on Tuesday, and you have not touched a row in eleven days".
 *
 * That is also what makes it fallible, so every choice it makes carries a
 * `reason` the screen can print. A plan somebody cannot interrogate is a plan
 * they cannot correct, and this one will need correcting.
 *
 * Pure. Everything it knows arrives in `PlanInput`; nothing here reads a
 * database, a clock or a bodyweight.
 */
import { daysBetween } from './week.js';
import type { LoadType } from './load.js';
import { FOCUS_GROUPS, type Prescription, type SessionFocus } from './programming.js';
import { roundToIncrement } from './units.js';

export interface PlannableExercise {
  readonly id: string;
  readonly name: string;
  readonly mechanic: 'compound' | 'isolation' | 'unknown';
  /** Reps mean seconds. A plank cannot be loaded or progressed like a press. */
  readonly isTimeBased: boolean;
  /**
   * How the exercise carries load, from its equipment.
   *
   * Carried here because a pull-up prescribed at "0 kg" is worse than one
   * prescribed at nothing: the logger would show a weight field reading zero,
   * and the set would be logged as an unloaded rep.
   */
  readonly loadType: LoadType;
  /** Muscle groups this exercise trains as a *primary* mover. */
  readonly groupSlugs: readonly string[];
  /** 1 is the most commonly performed. Used only to break ties. */
  readonly popularityRank: number;
  readonly defaultRepLow: number;
  readonly defaultRepHigh: number;
  readonly defaultRestSeconds: number | null;
}

/** What happened last time this exercise was trained. */
export interface ExerciseHistory {
  readonly exerciseId: string;
  readonly lastPerformedAt: Date;
  /** The heaviest completed working set, and the reps done at it. */
  readonly topSetKg: number | null;
  readonly topSetReps: number | null;
}

export interface PlanInput {
  readonly focus: SessionFocus;
  readonly prescription: Prescription;
  readonly catalogue: readonly PlannableExercise[];
  readonly history: readonly ExerciseHistory[];
  /** Working sets already done this week, by muscle group slug. */
  readonly setsThisWeekByGroup: ReadonlyMap<string, number>;
  readonly now: Date;
}

/**
 * Why this exercise, at this weight.
 *
 * A tagged union rather than a string so the screen can phrase it and the
 * tests can assert the decision instead of the wording.
 */
export type LoadReason =
  | { readonly kind: 'progress'; readonly fromKg: number; readonly reps: number }
  | { readonly kind: 'repeat'; readonly kg: number; readonly reps: number }
  | { readonly kind: 'returning'; readonly daysAway: number; readonly fromKg: number }
  | { readonly kind: 'first_time' };

export interface PlannedExercise {
  readonly exerciseId: string;
  readonly name: string;
  readonly sets: number;
  readonly repLow: number;
  readonly repHigh: number;
  readonly restSeconds: number;
  readonly loadType: LoadType;
  /** Null when there is nothing to base a number on, or nothing to load. */
  readonly suggestedKg: number | null;
  /** The muscle group this exercise was chosen to cover. */
  readonly groupSlug: string;
  readonly reason: LoadReason;
}

export interface PlannedSession {
  readonly focus: SessionFocus;
  readonly exercises: readonly PlannedExercise[];
  readonly totalSets: number;
  /** Groups skipped because the week's target is already met, in order. */
  readonly restedGroups: readonly string[];
}

/** Training the same lift on consecutive days is not a program, it is a mistake. */
const MIN_DAYS_BETWEEN_REPEATS = 2;

/**
 * Long enough away that last time's top set is no longer a fair target.
 *
 * Three weeks off costs real strength, and prescribing the old number means a
 * first session back that fails on set two. Backing off and rebuilding takes a
 * fortnight; failing publicly takes people out of the gym for months.
 */
const LAYOFF_DAYS = 21;
const LAYOFF_BACKOFF = 0.9;

/** Below this a group has had enough this week and is left alone. */
const DEFICIT_FLOOR = 2;

/**
 * Build the next session.
 *
 * Groups are visited in the order `FOCUS_GROUPS` lists them — big movers
 * first — because the session budget runs out and the thing still standing
 * when it does should be the squat, not the calf raise. Within that order a
 * group whose weekly target is already met is skipped entirely, which is the
 * whole of the adaptation: train what has not been trained.
 */
export function planSession(input: PlanInput): PlannedSession {
  const seen = new Map(input.history.map((entry) => [entry.exerciseId, entry]));
  const groups = FOCUS_GROUPS[input.focus];

  const exercises: PlannedExercise[] = [];
  const restedGroups: string[] = [];
  const used = new Set<string>();

  let setsLeft = input.prescription.maxSetsPerSession;
  const setsPerExercise = input.prescription.repHigh <= 6 ? 4 : 3;

  // First pass: one compound per group, in priority order.
  for (const group of groups) {
    if (
      setsLeft < setsPerExercise ||
      exercises.length >= input.prescription.maxExercisesPerSession
    ) {
      break;
    }

    const deficit = deficitFor(group, input);
    if (deficit < DEFICIT_FLOOR) {
      restedGroups.push(group);
      continue;
    }

    const choice = pick(group, input, seen, used, true);
    if (choice === null) continue;

    const sets = Math.min(setsPerExercise, deficit, setsLeft);
    exercises.push(plan(choice, group, sets, input, seen));
    used.add(choice.id);
    setsLeft -= sets;
  }

  // Second pass: spend anything left over on the group still furthest behind,
  // with an isolation. A session that finishes under budget has wasted the
  // hardest part of training, which is being in the building.
  while (
    setsLeft >= 2 &&
    exercises.length < input.prescription.maxExercisesPerSession &&
    addFiller(exercises, groups, input, seen, used, Math.min(setsPerExercise, setsLeft))
  ) {
    setsLeft -= Math.min(setsPerExercise, setsLeft);
  }

  return {
    focus: input.focus,
    exercises,
    totalSets: exercises.reduce((total, entry) => total + entry.sets, 0),
    restedGroups,
  };
}

/** How many sets this group is short of its weekly target. */
function deficitFor(group: string, input: PlanInput): number {
  const done = input.setsThisWeekByGroup.get(group) ?? 0;
  return Math.max(0, input.prescription.weeklySetsPerGroup - done);
}

function addFiller(
  exercises: PlannedExercise[],
  groups: readonly string[],
  input: PlanInput,
  seen: ReadonlyMap<string, ExerciseHistory>,
  used: Set<string>,
  sets: number,
): boolean {
  const behind = [...groups]
    .map((group) => ({ group, deficit: deficitFor(group, input) }))
    .filter((entry) => entry.deficit >= DEFICIT_FLOOR)
    .sort((a, b) => b.deficit - a.deficit);

  for (const { group } of behind) {
    const choice = pick(group, input, seen, used, false);
    if (choice === null) continue;
    exercises.push(plan(choice, group, sets, input, seen));
    used.add(choice.id);
    return true;
  }
  return false;
}

/**
 * The best exercise for a group right now.
 *
 * Scored rather than filtered, so a thin catalogue still returns something
 * instead of a session with a hole in it. The one hard exclusion is an
 * exercise trained in the last two days.
 */
function pick(
  group: string,
  input: PlanInput,
  seen: ReadonlyMap<string, ExerciseHistory>,
  used: ReadonlySet<string>,
  wantCompound: boolean,
): PlannableExercise | null {
  let best: PlannableExercise | null = null;
  let bestScore = -Infinity;

  for (const candidate of input.catalogue) {
    if (used.has(candidate.id)) continue;
    if (!candidate.groupSlugs.includes(group)) continue;

    const recent = seen.get(candidate.id);
    if (
      recent !== undefined &&
      daysBetween(recent.lastPerformedAt, input.now) < MIN_DAYS_BETWEEN_REPEATS
    ) {
      continue;
    }

    const score = scoreOf(candidate, recent, wantCompound, input.now);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best;
}

function scoreOf(
  candidate: PlannableExercise,
  recent: ExerciseHistory | undefined,
  wantCompound: boolean,
  now: Date,
): number {
  let score = 0;

  // Compounds lead a session: they cover the most muscle for the time spent,
  // and they are the lifts worth doing while fresh.
  if (candidate.mechanic === 'compound') score += wantCompound ? 100 : -20;
  if (candidate.mechanic === 'isolation' && !wantCompound) score += 40;

  if (recent !== undefined) {
    // A lift with history is one the plan can prescribe a real number for
    // instead of guessing, which is worth more than any other single factor.
    score += 60;
    // And among those, the one trained most recently — a program somebody can
    // see themselves progressing on beats a fresh workout every session.
    score += Math.max(0, 20 - daysBetween(recent.lastPerformedAt, now));
  }

  // Popularity only breaks ties. A barbell bench outranks a Smith-machine
  // decline press, and neither consideration should outweigh recovery.
  score += Math.max(0, 20 - candidate.popularityRank) * 0.5;

  return score;
}

function plan(
  candidate: PlannableExercise,
  group: string,
  sets: number,
  input: PlanInput,
  seen: ReadonlyMap<string, ExerciseHistory>,
): PlannedExercise {
  const { suggestedKg, reason } = suggestLoad(candidate, seen.get(candidate.id), input);

  return {
    exerciseId: candidate.id,
    name: candidate.name,
    sets,
    // The goal's rep window, narrowed to what this exercise can actually take:
    // a plank prescribed for 3 to 6 "reps" is six seconds of plank.
    repLow: candidate.isTimeBased ? candidate.defaultRepLow : input.prescription.repLow,
    repHigh: candidate.isTimeBased ? candidate.defaultRepHigh : input.prescription.repHigh,
    restSeconds: input.prescription.restSeconds,
    loadType: candidate.loadType,
    suggestedKg,
    groupSlug: group,
    reason,
  };
}

/**
 * What to put on the bar.
 *
 * Three cases and each is a different conversation with the user: you hit the
 * top of the range, so go up; you did not, so do it again; you have been away,
 * so start under where you left off.
 */
function suggestLoad(
  candidate: PlannableExercise,
  recent: ExerciseHistory | undefined,
  input: PlanInput,
): { suggestedKg: number | null; reason: LoadReason } {
  // Pulled out rather than reached for twice: `recent === undefined ||
  // recent.topSetKg === null` reads as an optional chain and is not one, since
  // the guard has to narrow `recent` for everything below it.
  const lastKg = recent?.topSetKg ?? null;

  // Bodyweight work has no number to put on a bar, and a time-based hold has
  // no rep range to progress out of. Both are real exercises with nothing to
  // suggest, which is different from an exercise never done before — but the
  // screen shows the same thing for all three, so they share a reason.
  if (candidate.isTimeBased || candidate.loadType === 'bodyweight') {
    return { suggestedKg: null, reason: { kind: 'first_time' } };
  }
  if (recent === undefined || lastKg === null) {
    return { suggestedKg: null, reason: { kind: 'first_time' } };
  }

  const daysAway = daysBetween(recent.lastPerformedAt, input.now);
  const increment = input.prescription.progressionKg;

  if (daysAway >= LAYOFF_DAYS) {
    return {
      suggestedKg: roundToIncrement(lastKg * LAYOFF_BACKOFF, increment),
      reason: { kind: 'returning', daysAway, fromKg: lastKg },
    };
  }

  if (recent.topSetReps !== null && recent.topSetReps >= input.prescription.repHigh) {
    return {
      suggestedKg: roundToIncrement(lastKg + increment, increment),
      reason: { kind: 'progress', fromKg: lastKg, reps: recent.topSetReps },
    };
  }

  return {
    suggestedKg: lastKg,
    reason: {
      kind: 'repeat',
      kg: lastKg,
      reps: recent.topSetReps ?? input.prescription.repLow,
    },
  };
}
