/**
 * How long to rest.
 *
 * Three places can have an opinion and most of the time none of them do, so
 * this is mostly about precedence and about having a sane answer when the
 * catalogue says nothing. The exercise detail screen already promised this
 * derivation existed; it did not, and this is it.
 */

/**
 * Defaults by mechanic, for the many catalogue rows with no explicit value.
 *
 * A compound moves more mass through more joints and takes longer to recover
 * from between sets; an isolation does not. These are the conventional middle
 * of the usual advice rather than anything derived — three minutes and ninety
 * seconds — and they exist so the timer starts at something defensible instead
 * of at zero.
 */
export const REST_SECONDS_COMPOUND = 180;
export const REST_SECONDS_ISOLATION = 90;

/** Below this a rest timer is not resting, and above it nobody is training. */
export const MIN_REST_SECONDS = 5;
export const MAX_REST_SECONDS = 60 * 15;

export interface RestInputs {
  /** `exercises.default_rest_seconds`. Null for most rows. */
  readonly exerciseSeconds: number | null;
  /** `profiles.rest_seconds_default`. The lifter's blanket preference. */
  readonly profileSeconds: number | null;
  readonly mechanic: 'compound' | 'isolation';
}

/**
 * The rest to start the timer at.
 *
 * **Precedence: the exercise, then the profile, then the mechanic.** The
 * exercise wins because rest is a property of the movement — a heavy squat and
 * a lateral raise genuinely differ, and one number on a profile cannot say so.
 * The profile value is what fills in for the many exercises with no opinion,
 * which is what "default" means on that column.
 *
 * The arguable case is a lifter who set 60 seconds because they are short of
 * time and then meets a squat that insists on 180. They can change the timer;
 * the alternative — a global setting silently flattening every movement to the
 * same rest — is the one that produces bad training with no visible cause.
 */
export function restSecondsFor(inputs: RestInputs): number {
  const chosen =
    usable(inputs.exerciseSeconds) ??
    usable(inputs.profileSeconds) ??
    (inputs.mechanic === 'compound' ? REST_SECONDS_COMPOUND : REST_SECONDS_ISOLATION);

  return clampRest(chosen);
}

export function clampRest(seconds: number): number {
  if (!Number.isFinite(seconds)) return REST_SECONDS_ISOLATION;
  return Math.min(MAX_REST_SECONDS, Math.max(MIN_REST_SECONDS, Math.round(seconds)));
}

/**
 * `m:ss`, and never a bare number of seconds.
 *
 * Read at arm's length, mid-set, upside down on a bench. "2:00" is a duration
 * at a glance; "120" is a number you have to think about.
 */
export function formatRest(seconds: number): string {
  const total = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(total / 60);
  const remainder = total % 60;
  return `${String(minutes)}:${String(remainder).padStart(2, '0')}`;
}

/** Null, zero and negative all mean "no opinion", not "rest for no time". */
function usable(seconds: number | null): number | null {
  if (seconds === null || !Number.isFinite(seconds) || seconds <= 0) return null;
  return seconds;
}
