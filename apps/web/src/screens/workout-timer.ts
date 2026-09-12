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

/** What Home knows about a workout that is still open. */
export interface OpenSession {
  readonly startedAt: Date;
  readonly exerciseCount: number;
  readonly completedSets: number;
}

export interface OpenSessionSummary {
  readonly headline: string;
  /** One line under it. Never empty. */
  readonly detail: string;
  /** Open long enough that finishing it is the likelier intent. */
  readonly stale: boolean;
}

/**
 * The line Home shows when a workout is already running.
 *
 * Home used to offer "Start an empty workout" whether or not one was open,
 * which is the app forgetting the thing the lifter is in the middle of. Coming
 * back to it after a phone call meant tapping through to the logger to find out
 * whether anything was still there.
 *
 * Split out of the screen because the wording has edges: a session five seconds
 * old should not say "0 min in", one left open overnight should not read as an
 * invitation to carry on, and a workout with nothing in it yet should not
 * announce "0 exercises".
 */
export function openSessionSummary(session: OpenSession, now: Date): OpenSessionSummary {
  const stale = looksAbandoned(session.startedAt, now);
  const minutes = Math.max(0, Math.floor((now.getTime() - session.startedAt.getTime()) / 60000));

  const parts = [elapsedPhrase(minutes, stale)];
  if (session.exerciseCount > 0) parts.push(plural(session.exerciseCount, 'exercise'));
  if (session.completedSets > 0) parts.push(`${plural(session.completedSets, 'set')} done`);

  return {
    // Not an invitation to carry on when it has been open since yesterday —
    // by then the useful action is closing it, and the elapsed time stored
    // with it is already wrong.
    headline: stale ? 'You left a workout open' : 'Continue your workout',
    detail: parts.join(' · '),
    stale,
  };
}

function elapsedPhrase(minutes: number, stale: boolean): string {
  // "0 min in" is worse than saying nothing about the clock at all.
  if (minutes < 1) return 'just started';
  if (stale) return `open for ${plural(Math.floor(minutes / 60), 'hour')}`;
  if (minutes < 60) return `${String(minutes)} min in`;
  return `${String(Math.floor(minutes / 60))} h ${String(minutes % 60)} min in`;
}

function plural(count: number, noun: string): string {
  return `${String(count)} ${noun}${count === 1 ? '' : 's'}`;
}

/**
 * What kind of session is being idled in, for how long it may go quiet.
 *
 * Only `strength` exists today. `cardio` is written in because the numbers were
 * decided with it, and a treadmill session is precisely the one that ticks
 * nothing for an hour on purpose — so it must never inherit the strength limit
 * by default when it arrives.
 */
export type SessionKind = 'strength' | 'cardio';

/**
 * How long a workout may go without a ticked set before the app asks.
 *
 * Idle time, never time since starting. A normal strength session runs
 * forty-five to seventy-five minutes, so a limit measured from the start would
 * interrupt nearly every real workout; measured from the last set, thirty
 * minutes is several times any rest period and well short of a phone left on
 * a bench overnight.
 */
export function idleLimitMinutes(kind: SessionKind): number {
  return kind === 'cardio' ? 120 : 30;
}

/**
 * The last sign that somebody was training: the most recent ticked set, or
 * the start if nothing has been ticked yet.
 *
 * Only ticked sets count. Typing into a stepper is not evidence of training —
 * it is also what somebody does while deciding to leave.
 */
export function lastActivityAt(startedAt: Date, completedAt: readonly (Date | null)[]): Date {
  let latest = startedAt.getTime();
  for (const at of completedAt) {
    if (at === null) continue;
    const time = at.getTime();
    if (!Number.isNaN(time) && time > latest) latest = time;
  }
  return new Date(latest);
}

/**
 * Whether to ask "still training?".
 *
 * `snoozedAt` is the last time the question was answered "keep going" — or
 * the last time something else proved they were here, like coming back from
 * adding an exercise. The clock runs from whichever is later, so answering it
 * buys a full interval rather than one that is already half spent.
 */
export function shouldAskStillTraining(input: {
  readonly lastActivityAt: Date;
  readonly snoozedAt: Date | null;
  readonly now: Date;
  readonly limitMinutes: number;
}): boolean {
  const since = Math.max(input.lastActivityAt.getTime(), input.snoozedAt?.getTime() ?? 0);
  return input.now.getTime() - since >= input.limitMinutes * 60_000;
}

/** Whole minutes since the last sign of training, for the prompt's wording. */
export function idleMinutes(lastActivity: Date, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - lastActivity.getTime()) / 60_000));
}
