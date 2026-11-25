import { validPastWorkoutMinutes } from '@g7m/core';

/**
 * The time given to a past workout while it is still being logged (ADR-0194).
 *
 * An open workout has no end, and its length lives in its end and its set
 * stamps (`setPastTime`), so it is held on this device until Finish applies
 * it. Keyed by session, so it survives a reload or a trip to the calendar and
 * never lands on another workout.
 */
const key = (sessionId: string): string => `g7m.pastTime.${sessionId}`;

export interface PendingPastTime {
  readonly start: Date;
  readonly minutes: number;
}

export function readPendingPastTime(sessionId: string): PendingPastTime | null {
  try {
    const raw = localStorage.getItem(key(sessionId));
    if (raw === null) return null;
    const parsed = JSON.parse(raw) as { start?: unknown; minutes?: unknown };
    const start = new Date(typeof parsed.start === 'string' ? parsed.start : Number.NaN);
    const minutes = typeof parsed.minutes === 'number' ? parsed.minutes : Number.NaN;
    if (Number.isNaN(start.getTime()) || !validPastWorkoutMinutes(minutes)) return null;
    return { start, minutes };
  } catch {
    // Storage blocked or a malformed value: nothing pending, never a crash.
    return null;
  }
}

export function writePendingPastTime(sessionId: string, time: PendingPastTime): void {
  try {
    localStorage.setItem(
      key(sessionId),
      JSON.stringify({ start: time.start.toISOString(), minutes: time.minutes }),
    );
  } catch {
    // Storage blocked: the time is lost, the workout is not.
  }
}

export function clearPendingPastTime(sessionId: string): void {
  try {
    localStorage.removeItem(key(sessionId));
  } catch {
    // Nothing to do.
  }
}
