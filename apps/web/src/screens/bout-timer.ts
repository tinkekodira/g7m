/**
 * The machine timer: start when you get on, stop when you get off.
 *
 * Kept in storage rather than in the component, because the time on a
 * treadmill is exactly the time a phone spends locked in a pocket or swapped
 * for a music app — and a timer that lived in React state would be gone when
 * the page came back. What is stored is when it started and what it started
 * from; the elapsed time is always worked out from the clock, so a phone that
 * slept through twenty minutes shows twenty minutes the moment it wakes.
 */

export interface RunningTimer {
  /** Epoch milliseconds when the timer was started. */
  readonly startedAt: number;
  /** Seconds already on the bout when it started, so stop-and-start adds up. */
  readonly baseSeconds: number;
}

export type TimerStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const KEY_PREFIX = 'g7m.bout-timer.';

export function timerKey(setId: string): string {
  return `${KEY_PREFIX}${setId}`;
}

/** Seconds on the bout now: what it started from, plus the time since. */
export function elapsedSeconds(timer: RunningTimer, now: number): number {
  return timer.baseSeconds + Math.max(0, Math.floor((now - timer.startedAt) / 1000));
}

/** The running timer for a bout, or null — including for anything unreadable. */
export function readTimer(
  setId: string,
  storage: TimerStorage | undefined = globalThis.localStorage,
): RunningTimer | null {
  try {
    const raw = storage?.getItem(timerKey(setId));
    if (raw === null || raw === undefined) return null;
    const parsed = JSON.parse(raw) as Partial<RunningTimer>;
    if (typeof parsed.startedAt !== 'number' || typeof parsed.baseSeconds !== 'number') {
      return null;
    }
    return { startedAt: parsed.startedAt, baseSeconds: parsed.baseSeconds };
  } catch {
    return null;
  }
}

export function startTimer(
  setId: string,
  baseSeconds: number,
  now: number,
  storage: TimerStorage | undefined = globalThis.localStorage,
): RunningTimer {
  const timer: RunningTimer = { startedAt: now, baseSeconds: Math.max(0, baseSeconds) };
  try {
    storage?.setItem(timerKey(setId), JSON.stringify(timer));
  } catch {
    // Storage off: the timer still runs, for as long as the page stays open.
  }
  return timer;
}

export function clearTimer(
  setId: string,
  storage: TimerStorage | undefined = globalThis.localStorage,
): void {
  try {
    storage?.removeItem(timerKey(setId));
  } catch {
    // Nothing to clear, or nowhere to clear it from.
  }
}
