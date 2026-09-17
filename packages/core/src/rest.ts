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

/**
 * The rest the catalogue is written around, and `profiles.rest_seconds_default`'s
 * own column default.
 *
 * It is what makes the profile setting a *pace* rather than an override — see
 * `restSecondsFor`. Because it is also the column's default, a lifter who has
 * never opened the setting scales everything by exactly 1 and sees the
 * catalogue's own numbers, unchanged.
 */
export const REST_BASELINE_SECONDS = 120;

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
 * **The exercise decides the shape; the profile decides the pace.** Rest is a
 * property of the movement — a heavy squat and a lateral raise genuinely
 * differ, and one number on a profile cannot say so. So the profile value does
 * not replace the exercise's, it *scales* it, against the baseline the
 * catalogue is written around: set 60 seconds and everything halves, and the
 * squat still rests twice as long as the curl.
 *
 * This is the correction to a precedence that could never fire. The original
 * rule was exercise, then profile, then mechanic — and every one of the seeded
 * exercises carries an explicit `default_rest_seconds`, so the profile value
 * lost every time and the setting was inert. Overriding instead would have
 * been the other failure: a global number silently flattening every movement
 * to the same rest, which produces bad training with no visible cause.
 *
 * The profile still wins outright for an exercise with no opinion of its own,
 * which is what "default" means on that column, and what a custom exercise
 * would arrive with.
 */
export function restSecondsFor(inputs: RestInputs): number {
  const exercise = usable(inputs.exerciseSeconds);
  const profile = usable(inputs.profileSeconds);

  if (exercise !== null) {
    // Scaled, or left exactly as the catalogue wrote it when nobody has asked
    // for a different pace.
    return clampRest(profile === null ? exercise : exercise * (profile / REST_BASELINE_SECONDS));
  }

  return clampRest(
    profile ?? (inputs.mechanic === 'compound' ? REST_SECONDS_COMPOUND : REST_SECONDS_ISOLATION),
  );
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
