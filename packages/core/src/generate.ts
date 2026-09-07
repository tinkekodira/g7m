/**
 * Building one session out of a goal, a split and what has already been done.
 *
 * The generator is adaptive rather than a fixed template per goal, and the
 * difference is entirely in the last of those three inputs. A template answers
 * "what does a push day look like". This answers "what does *your* push day
 * look like, given that your back is six sets short, you benched 80 kg for 8
 * on Tuesday, and you have missed reps on the squat three sessions running".
 *
 * That is also what makes it fallible, so every choice it makes carries a
 * `reason` the screen can print, and every exercise carries the alternatives
 * it beat. A plan somebody cannot interrogate or override is a plan they
 * cannot correct.
 *
 * Pure. Everything it knows arrives in `PlanInput`; nothing here reads a
 * database, a clock or a bodyweight.
 */
import type { LoadType } from './load.js';
import { FOCUS_GROUPS, type Prescription, type SessionFocus } from './programming.js';
import { roundToIncrement } from './units.js';
import { daysBetween } from './week.js';

export interface PlannableExercise {
  readonly id: string;
  readonly name: string;
  readonly mechanic: 'compound' | 'isolation' | 'unknown';
  /** Reps mean seconds. A plank cannot be loaded or progressed like a press. */
  readonly isTimeBased: boolean;
  /**
   * How the exercise carries load, from its equipment.
   *
   * A pull-up prescribed at "0 kg" is worse than one prescribed at nothing:
   * the logger would show a weight field reading zero and the set would be
   * logged as an unloaded rep.
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

/**
 * One session's worth of an exercise, as it was actually performed.
 *
 * `repsAtTopSet` is every working set done at the heaviest weight, not just
 * the best one. That is the difference between "you hit 12" and "you hit 12,
 * 12, then 7" — the second is a session that ran out, and prescribing more
 * weight after it is how a generated plan buries somebody.
 */
export interface SessionPerformance {
  readonly at: Date;
  readonly topSetKg: number | null;
  readonly repsAtTopSet: readonly number[];
  /**
   * Reps left in the tank on the last set, if they said.
   *
   * Optional by design: the prompt is skippable and everything below has an
   * answer without it. What it adds is the one thing counting reps cannot
   * tell you — whether twelve reps were comfortable or a fight.
   */
  readonly repsInReserve: number | null;
}

/** What has been done on one exercise lately, newest session first. */
export interface ExerciseHistory {
  readonly exerciseId: string;
  readonly sessions: readonly SessionPerformance[];
}

export interface PlanInput {
  readonly focus: SessionFocus;
  readonly prescription: Prescription;
  readonly catalogue: readonly PlannableExercise[];
  readonly history: readonly ExerciseHistory[];
  /** Working sets done in the trailing week, by muscle group slug. */
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
  | { readonly kind: 'jump'; readonly fromKg: number; readonly repsInReserve: number }
  | { readonly kind: 'repeat'; readonly kg: number; readonly reps: number }
  | { readonly kind: 'deload'; readonly fromKg: number; readonly misses: number }
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
  /**
   * The exercises this one beat, best first, each planned in full.
   *
   * Carried so the screen can offer a swap without asking the generator
   * again — and so a swap lands on a real prescription rather than on a name
   * with no weight against it. Nested entries carry none of their own: an
   * alternative to an alternative is a menu, not a swap.
   */
  readonly alternatives: readonly PlannedExercise[];
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

/**
 * Consecutive sessions falling short before the weight comes down.
 *
 * Three, not one. Anybody can have a bad Tuesday — slept badly, ate late, had
 * a hard week — and an app that drops the weight over one of those is an app
 * nobody ever gets stronger on. Three in a row is not a bad day, it is a
 * plateau, and the answer to a plateau is to back off and run at it again.
 */
export const DELOAD_AFTER_MISSES = 3;

/** What both a deload and a comeback drop to. */
const BACKOFF = 0.9;

/**
 * Reps in reserve at which the usual increment is too small.
 *
 * Somebody who finishes twelve reps with three left in the tank is nowhere
 * near their limit, and moving them 2.5 kg wastes a session. This is the one
 * thing counting reps genuinely cannot tell you, and the only reason the
 * logger asks.
 */
const EASY_REPS_IN_RESERVE = 3;

/** Below this a group has had enough this week and is left alone. */
const DEFICIT_FLOOR = 2;

/** How many alternatives to carry per exercise. */
const ALTERNATIVES = 2;

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

    const ranked = rank(group, input, seen, used, true);
    const choice = ranked[0];
    if (choice === undefined) continue;

    const sets = Math.min(setsPerExercise, deficit, setsLeft);
    exercises.push(plan(choice, group, sets, input, seen, ranked.slice(1, 1 + ALTERNATIVES)));
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
    const ranked = rank(group, input, seen, used, false);
    const choice = ranked[0];
    if (choice === undefined) continue;
    exercises.push(plan(choice, group, sets, input, seen, ranked.slice(1, 1 + ALTERNATIVES)));
    used.add(choice.id);
    return true;
  }
  return false;
}

/**
 * Every usable exercise for a group, best first.
 *
 * Scored rather than filtered, so a thin catalogue still returns something
 * instead of a session with a hole in it. The one hard exclusion is an
 * exercise trained in the last two days.
 */
function rank(
  group: string,
  input: PlanInput,
  seen: ReadonlyMap<string, ExerciseHistory>,
  used: ReadonlySet<string>,
  wantCompound: boolean,
): PlannableExercise[] {
  const usable: { candidate: PlannableExercise; score: number }[] = [];

  for (const candidate of input.catalogue) {
    if (used.has(candidate.id)) continue;
    if (!candidate.groupSlugs.includes(group)) continue;

    const last = seen.get(candidate.id)?.sessions[0];
    if (last !== undefined && daysBetween(last.at, input.now) < MIN_DAYS_BETWEEN_REPEATS) {
      continue;
    }

    usable.push({ candidate, score: scoreOf(candidate, last, wantCompound, input.now) });
  }

  return usable.sort((a, b) => b.score - a.score).map((entry) => entry.candidate);
}

/**
 * Anchor the compounds, rotate the accessories.
 *
 * The two slots want opposite things, and treating them the same is what makes
 * a generator boring. The big lift of a session is the one somebody is trying
 * to add weight to, so it should be the same lift week after week — nobody
 * progresses on something they never repeat. The accessory afterwards has no
 * such claim: doing cable flies for eleven months because they won a tie-break
 * once is how a plan stops being interesting and starts being ignored.
 *
 * So familiarity is a large bonus for the compound slot and a penalty for the
 * accessory one, and the penalty fades with time so an accessory comes back
 * around rather than being retired.
 */
function scoreOf(
  candidate: PlannableExercise,
  last: SessionPerformance | undefined,
  wantCompound: boolean,
  now: Date,
): number {
  let score = 0;

  // Compounds lead a session: they cover the most muscle for the time spent,
  // and they are the lifts worth doing while fresh.
  if (candidate.mechanic === 'compound') score += wantCompound ? 100 : -20;
  if (candidate.mechanic === 'isolation' && !wantCompound) score += 40;

  if (last !== undefined) {
    const days = daysBetween(last.at, now);
    score += wantCompound ? 60 + Math.max(0, 20 - days) : -Math.max(0, 30 - days);
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
  alternatives: readonly PlannableExercise[],
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
    alternatives: alternatives.map((option) => plan(option, group, sets, input, seen, [])),
  };
}

/**
 * What to put on the bar.
 *
 * Six answers, and each is a different conversation:
 *
 *   first_time  nothing to go on, so nothing is claimed
 *   returning   away long enough that the old number is no longer theirs
 *   deload      stuck three sessions running — back off and run at it again
 *   jump        finished the range with reps to spare, so 2.5 kg is too small
 *   progress    finished the range
 *   repeat      did not finish it, which is not a failure
 */
function suggestLoad(
  candidate: PlannableExercise,
  history: ExerciseHistory | undefined,
  input: PlanInput,
): { suggestedKg: number | null; reason: LoadReason } {
  const sessions = history?.sessions ?? [];
  const last = sessions[0];
  const lastKg = last?.topSetKg ?? null;

  // Bodyweight work has no number to put on a bar and a time-based hold has no
  // rep range to progress out of. Both are real exercises with nothing to
  // suggest, which the screen presents the same way as a first attempt.
  if (candidate.isTimeBased || candidate.loadType === 'bodyweight') {
    return { suggestedKg: null, reason: { kind: 'first_time' } };
  }
  if (last === undefined || lastKg === null) {
    return { suggestedKg: null, reason: { kind: 'first_time' } };
  }

  const increment = input.prescription.progressionKg;
  const daysAway = daysBetween(last.at, input.now);

  if (daysAway >= LAYOFF_DAYS) {
    return {
      suggestedKg: roundToIncrement(lastKg * BACKOFF, increment),
      reason: { kind: 'returning', daysAway, fromKg: lastKg },
    };
  }

  const misses = consecutiveMisses(sessions, input.prescription.repLow);
  if (misses >= DELOAD_AFTER_MISSES) {
    return {
      suggestedKg: roundToIncrement(lastKg * BACKOFF, increment),
      reason: { kind: 'deload', fromKg: lastKg, misses },
    };
  }

  if (finishedTheRange(last, input.prescription.repHigh)) {
    // Reps to spare on top of a finished range means the increment is wrong,
    // not that they are ready for one more kilo of the same.
    if (last.repsInReserve !== null && last.repsInReserve >= EASY_REPS_IN_RESERVE) {
      return {
        suggestedKg: roundToIncrement(lastKg + increment * 2, increment),
        reason: { kind: 'jump', fromKg: lastKg, repsInReserve: last.repsInReserve },
      };
    }
    return {
      suggestedKg: roundToIncrement(lastKg + increment, increment),
      reason: { kind: 'progress', fromKg: lastKg, reps: bestReps(last) },
    };
  }

  return { suggestedKg: lastKg, reason: { kind: 'repeat', kg: lastKg, reps: bestReps(last) } };
}

/** Every working set at the top weight reached the top of the range. */
function finishedTheRange(session: SessionPerformance, repHigh: number): boolean {
  return session.repsAtTopSet.length > 0 && session.repsAtTopSet.every((reps) => reps >= repHigh);
}

/**
 * How many recent sessions in a row fell short of the bottom of the range.
 *
 * Counted from the most recent backwards and stopped at the first session that
 * did not, so one good session resets it. That is what makes a deload
 * self-clearing rather than something that fires again the following week.
 */
function consecutiveMisses(sessions: readonly SessionPerformance[], repLow: number): number {
  let misses = 0;
  for (const session of sessions) {
    if (session.repsAtTopSet.length === 0) break;
    if (session.repsAtTopSet.some((reps) => reps < repLow)) misses++;
    else break;
  }
  return misses;
}

function bestReps(session: SessionPerformance): number {
  return session.repsAtTopSet.length === 0 ? 0 : Math.max(...session.repsAtTopSet);
}
