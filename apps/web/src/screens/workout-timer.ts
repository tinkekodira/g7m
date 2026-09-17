import { dayTitle } from './calendar-view.js';

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
  /** Logged afterwards from the calendar: its start is a day, not a clock. */
  readonly past?: boolean;
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
  /**
   * A workout being logged afterwards started days ago on purpose. Measured
   * like a live one it read "You left a workout open · open for 72 hours",
   * which is the one thing it certainly is not.
   */
  if (session.past === true) {
    const parts = [dayTitle(session.startedAt)];
    if (session.exerciseCount > 0) parts.push(plural(session.exerciseCount, 'exercise'));
    if (session.completedSets > 0) parts.push(`${plural(session.completedSets, 'set')} done`);
    return {
      headline: 'Finish logging your past workout',
      detail: parts.join(' · '),
      stale: false,
    };
  }

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

/**
 * How many idle limits pass before the app stops asking and finishes it.
 *
 * Two: one to ask, one to wait. A workout nobody has touched for an hour is
 * over, whatever the phone thinks — and the alternative is what used to happen,
 * a session left open until the next one starts, taking its sets with it.
 */
export const AUTO_FINISH_LIMITS = 2;

/**
 * Whether to finish a workout that nobody is coming back to.
 *
 * The same clock as `shouldAskStillTraining`, twice over: answering "keep
 * going" buys another full interval before the question is asked again, and
 * another before this. Nothing is thrown away when it fires — every ticked set
 * is already saved; the workout is closed at its last set, which is the only
 * honest end time for it. ADR-0077.
 */
export function shouldAutoFinish(input: {
  readonly lastActivityAt: Date;
  readonly snoozedAt: Date | null;
  readonly now: Date;
  readonly limitMinutes: number;
}): boolean {
  const since = Math.max(input.lastActivityAt.getTime(), input.snoozedAt?.getTime() ?? 0);
  return input.now.getTime() - since >= input.limitMinutes * AUTO_FINISH_LIMITS * 60_000;
}

/** Whole minutes since the last sign of training, for the prompt's wording. */
export function idleMinutes(lastActivity: Date, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - lastActivity.getTime()) / 60_000));
}

/** What the workout the app closed by itself amounted to. ADR-0077. */
export interface AutoFinishNotice {
  readonly title: string;
  /** Why it was closed, and when. */
  readonly reason: string;
  /** What was saved: `5 exercises · 18 sets · 52 min`. */
  readonly detail: string;
}

/**
 * The popup that owns up to it, the next time the app is opened.
 *
 * Said plainly and in that order — what happened, why, what was kept — because
 * the one thing somebody wants to know on reading "we finished your workout"
 * is whether their sets are still there. They are; nothing was ever unsaved.
 */
export function autoFinishNotice(input: {
  readonly startedAt: Date;
  readonly endedAt: Date | null;
  readonly exerciseCount: number;
  /** Counted sets, bouts included, as the history counts them. */
  readonly setCount: number;
  readonly boutCount: number;
  readonly minutes: number | null;
  readonly now: Date;
}): AutoFinishNotice {
  // "Thursday 17 September", as the calendar writes it. Not lower-cased: a
  // weekday and a month are names wherever they land in a sentence.
  const when = dayTitle(input.startedAt);
  const at = input.endedAt === null ? null : clockTime(input.endedAt);

  const parts: string[] = [];
  if (input.exerciseCount > 0) parts.push(plural(input.exerciseCount, 'exercise'));
  const sets = input.setCount - input.boutCount;
  if (sets > 0) parts.push(plural(sets, 'set'));
  if (input.boutCount > 0) parts.push(plural(input.boutCount, 'bout'));
  if (input.minutes !== null && input.minutes > 0) parts.push(`${String(input.minutes)} min`);

  return {
    title: 'We finished your workout',
    reason:
      at === null
        ? `Nothing was ticked for a while, so your workout from ${when} was closed for you.`
        : `Nothing was ticked for a while, so your workout from ${when} was closed at your last set, ${at}.`,
    // Never empty: a workout with nothing in it is never closed this way.
    detail: parts.length === 0 ? 'Everything you logged is saved.' : `Saved: ${parts.join(' · ')}.`,
  };
}

function clockTime(at: Date): string {
  return `${String(at.getHours())}:${String(at.getMinutes()).padStart(2, '0')}`;
}
