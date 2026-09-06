/**
 * When to look for a new build, and what counts as one.
 *
 * Pure, so the two rules that are easy to get quietly wrong can be tested: a
 * check that never fires leaves the user on an old build indefinitely, and one
 * that fires constantly puts a network request on every tab switch.
 */

/**
 * How long to leave between update checks.
 *
 * A minute is chosen against the actual trigger, which is the app becoming
 * visible. On iOS that fires every time the app is brought back from the
 * switcher, which can be several times a minute; the check itself is a
 * conditional GET for one small file, but there is no reason to make it on
 * every glance at the screen. It is also well inside the ten minutes GitHub
 * Pages caches for, so a deploy is picked up on the first return after it.
 */
export const UPDATE_CHECK_INTERVAL_MS = 60_000;

export function shouldCheckForUpdate(
  lastCheckedAt: number | null,
  now: number,
  minIntervalMs: number = UPDATE_CHECK_INTERVAL_MS,
): boolean {
  if (lastCheckedAt === null) return true;
  // A clock that jumped backwards — a timezone change on a plane, an NTP
  // correction — must not lock out update checks until it catches up.
  if (now < lastCheckedAt) return true;
  return now - lastCheckedAt >= minIntervalMs;
}

/**
 * A newly installed worker means an update only if one was already in charge.
 *
 * On a first ever visit there is no controller, and the worker reaching
 * `installed` is the app being set up rather than a new version arriving.
 * Prompting "a new version is ready" to somebody who has been here for four
 * seconds is how a reload prompt gets ignored forever after.
 */
export function isUpdateReady(workerState: string, hasController: boolean): boolean {
  return hasController && workerState === 'installed';
}
