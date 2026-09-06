/**
 * The two clocks on the workout screen.
 *
 * Both are derived from timestamps rather than counted down by an interval,
 * and that is the whole reason this file is separate and tested. A phone locks
 * mid-set, the tab is suspended, `setInterval` stops firing — and a timer that
 * decremented a counter every second comes back showing 1:40 remaining after
 * four minutes of rest. Reading the difference between two dates is correct
 * whether or not anything was running in between.
 */

/**
 * Seconds left of a rest period. Zero once it is over, never negative.
 *
 * Returns null when nothing is resting, which is a different state from "zero
 * seconds left" — one hides the timer, the other shows it finished.
 */
export function restRemaining(
  startedAt: Date | null,
  durationSeconds: number,
  now: Date,
): number | null {
  if (startedAt === null) return null;
  const elapsed = (now.getTime() - startedAt.getTime()) / 1000;
  // A clock that stepped backwards would otherwise show more time remaining
  // than the rest was ever set for.
  if (elapsed < 0) return durationSeconds;
  return Math.max(0, durationSeconds - elapsed);
}

export function isRestOver(remaining: number | null): boolean {
  return remaining !== null && remaining <= 0;
}

/**
 * How long the workout has been going, as `h:mm` or `m:ss`.
 *
 * Switches unit at an hour because a lifter forty minutes in wants to see
 * `41:20`, and one two hours in does not want to read `127:04` and do the
 * division themselves.
 */
export function formatElapsed(startedAt: Date, now: Date): string {
  const seconds = Math.max(0, Math.floor((now.getTime() - startedAt.getTime()) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) return `${String(hours)}:${String(minutes).padStart(2, '0')}`;
  return `${String(minutes)}:${String(seconds % 60).padStart(2, '0')}`;
}

/**
 * Whether an elapsed time is long enough to be suspicious.
 *
 * A session left open overnight is the commonest way the history gets a
 * six-hour workout in it: the lifter finished, walked out, and never tapped
 * Finish. The screen offers to end it rather than silently trusting the clock.
 */
export const STALE_SESSION_HOURS = 4;

export function looksAbandoned(startedAt: Date, now: Date): boolean {
  const hours = (now.getTime() - startedAt.getTime()) / (1000 * 60 * 60);
  return hours >= STALE_SESSION_HOURS;
}
