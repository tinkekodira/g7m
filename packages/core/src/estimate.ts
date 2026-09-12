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

export interface EstimableExercise {
  readonly sets: number;
  readonly restSeconds: number;
}

/**
 * Minutes, rounded to the nearest five. Null when there is nothing to time.
 *
 * Measured the way the training time is measured elsewhere — first set to
 * last — so a finished session and its estimate describe the same thing. The
 * warm-up before the first set is left out of both.
 */
export function estimateSessionMinutes(exercises: readonly EstimableExercise[]): number | null {
  let seconds = 0;
  let counted = 0;

  for (const exercise of exercises) {
    const sets = Number.isFinite(exercise.sets) ? Math.max(0, Math.round(exercise.sets)) : 0;
    if (sets === 0) continue;
    const rest = Number.isFinite(exercise.restSeconds) ? Math.max(0, exercise.restSeconds) : 0;

    if (counted > 0) seconds += CHANGEOVER_SECONDS;
    seconds += sets * SECONDS_PER_SET + (sets - 1) * rest;
    counted += 1;
  }

  if (counted === 0) return null;
  // Never "about 0 min": one set of anything is still a visit to the gym.
  return Math.max(5, Math.round(seconds / 300) * 5);
}
