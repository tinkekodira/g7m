/**
 * How long a planned session will take, roughly.
 *
 * The "about 45 min" on the home screen's workout card. Somebody deciding
 * whether today's session fits before work needs a number, and the plan
 * already holds the two things that decide it: how many sets there are, and
 * how long the rests between them run. Everything else — how fast somebody
 * moves, how long they chat — is noise around those two, which is why the
 * answer is rounded to five minutes and always introduced as "about".
 */
import { workoutUnits } from './superset.js';

/**
 * One working set, unrack to rerack.
 *
 * Five reps at a controlled tempo is fifteen to twenty seconds; twelve is
 * nearer forty. Setting up and walking the weight out takes the rest.
 */
export const SECONDS_PER_SET = 40;

/**
 * Moving on to the next exercise: loading a bar, finding a bench, setting a
 * cable. It stands in for the last rest of each exercise, which nobody takes
 * as a rest.
 */
export const CHANGEOVER_SECONDS = 90;

/**
 * Walking from one station to the other inside a superset, between one
 * exercise's set and the next one's.
 */
export const SWITCH_SECONDS = 20;

export interface EstimableExercise {
  readonly sets: number;
  readonly restSeconds: number;
  /** Shared by the exercises done as one superset; null or absent for straight sets. */
  readonly superset?: string | null;
}

/**
 * Seconds, first set to last. Null when there is nothing to time.
 *
 * Measured the way the training time is measured elsewhere — first set to
 * last — so a finished session and its estimate describe the same thing. The
 * warm-up before the first set is left out of both.
 *
 * A superset does each exercise's set in turn, with a walk between them, and
 * rests once per round for as long as its longest rest — the rule the
 * logger's timer follows. It is set up once, as one changeover: both stations
 * are claimed before the first round. So pairing two exercises saves one
 * exercise's rests and one changeover, and pays a walk per set.
 */
export function estimateSessionSeconds(exercises: readonly EstimableExercise[]): number | null {
  let seconds = 0;
  let counted = 0;

  for (const unit of workoutUnits(exercises, (exercise) => exercise.superset ?? null)) {
    const members = (unit.kind === 'single' ? [unit.item] : unit.members)
      .map((exercise) => ({ sets: whole(exercise.sets), rest: nonNegative(exercise.restSeconds) }))
      .filter((exercise) => exercise.sets > 0);
    if (members.length === 0) continue;

    if (counted > 0) seconds += CHANGEOVER_SECONDS;
    counted += 1;

    if (members.length === 1) {
      const [only] = members as [{ sets: number; rest: number }];
      seconds += only.sets * SECONDS_PER_SET + (only.sets - 1) * only.rest;
      continue;
    }

    const rounds = Math.max(...members.map((member) => member.sets));
    const rest = Math.max(...members.map((member) => member.rest));
    const sets = members.reduce((total, member) => total + member.sets, 0);
    // Every set but the last of each round is followed by a walk, not a rest.
    seconds += sets * SECONDS_PER_SET + (sets - rounds) * SWITCH_SECONDS + (rounds - 1) * rest;
  }

  return counted === 0 ? null : seconds;
}

/**
 * Minutes, rounded to the nearest five. Null when there is nothing to time.
 *
 * The rounding is the honesty: how fast somebody moves and how long they chat
 * is noise around the sets and the rests, and "about 45 min" says so.
 */
export function estimateSessionMinutes(exercises: readonly EstimableExercise[]): number | null {
  const seconds = estimateSessionSeconds(exercises);
  if (seconds === null) return null;
  // Never "about 0 min": one set of anything is still a visit to the gym.
  return Math.max(5, Math.round(seconds / 300) * 5);
}

function whole(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

function nonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}
