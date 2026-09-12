/**
 * A week, a month, or everything: the three ways the progress screen reads the
 * log.
 *
 * The screen used to draw one chart — volume per week over twelve weeks — and
 * it answered a question lifters rarely ask of a phone ("how did week 37
 * compare with week 34") while skipping the one they do ask every day: *what
 * have I done this week?* A week split into its days answers that at a glance,
 * a month split into its days shows the rhythm of training, and all time split
 * into months keeps the long view the old chart had.
 *
 * Everything here is local calendar time, for the reason `week.ts` gives: a
 * workout at 01:00 on a Monday in Zagreb happened on Monday, whatever UTC says.
 * Days are stepped with `setDate` rather than by adding milliseconds, so a week
 * that contains a clock change still has seven midnights in it.
 */
import { countsTowardVolume, setVolumeKg } from './load.js';
import { trainingMinutes, type HistoricalSet } from './progress.js';
import { DEFAULT_WEEK_START, startOfWeek, type WeekStart } from './week.js';

export const PERIODS = ['week', 'month', 'all'] as const;
export type Period = (typeof PERIODS)[number];

/** A stretch of local time. Start inclusive, end exclusive. */
export interface Span {
  readonly start: Date;
  readonly end: Date;
}

export interface PeriodWindow {
  readonly period: Period;
  /** The period `now` is in. For all time, everything since the first workout. */
  readonly current: Span;
  /**
   * The period before, to compare against.
   *
   * Null for all time, which has nothing before it — comparing a lifetime with
   * something would mean inventing the something.
   */
  readonly previous: Span | null;
  /** What the chart draws. The same as `current`, except for a long all time. */
  readonly chart: Span;
  /** True when all time runs back further than the chart has room to draw. */
  readonly clipped: boolean;
}

/**
 * How far back the all-time chart reaches, in months.
 *
 * Twelve bars fit a phone with room for a label on each. The totals above the
 * chart are still all time — only the drawing stops at a year, and the screen
 * says so when it does.
 */
export const ALL_TIME_CHART_MONTHS = 12;

/** Midnight, local time, on the first day of the month the date falls in. */
export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** The first of the month, `months` away. Day-of-month overflow cannot happen from the 1st. */
function addMonths(monthStart: Date, months: number): Date {
  return new Date(monthStart.getFullYear(), monthStart.getMonth() + months, 1);
}

/**
 * The spans a period covers, as of `now`.
 *
 * `firstSessionAt` only matters for all time, where it is where "all" begins.
 * Null — nobody has trained yet — makes all time this month, so an empty
 * history still draws one sensible bar rather than a chart of nothing.
 */
export function periodWindow(
  period: Period,
  now: Date,
  weekStartsOn: WeekStart = DEFAULT_WEEK_START,
  firstSessionAt: Date | null = null,
): PeriodWindow {
  if (period === 'week') {
    const start = startOfWeek(now, weekStartsOn);
    const current = { start, end: addDays(start, 7) };
    return {
      period,
      current,
      previous: { start: addDays(start, -7), end: start },
      chart: current,
      clipped: false,
    };
  }

  if (period === 'month') {
    const start = startOfMonth(now);
    const current = { start, end: addMonths(start, 1) };
    return {
      period,
      current,
      previous: { start: addMonths(start, -1), end: start },
      chart: current,
      clipped: false,
    };
  }

  const thisMonth = startOfMonth(now);
  const end = addMonths(thisMonth, 1);
  // A first workout "in the future" is a device clock that was wrong when it
  // was logged. It still belongs to all time, which then starts this month.
  const first =
    firstSessionAt === null || firstSessionAt > now ? thisMonth : startOfMonth(firstSessionAt);
  const earliestDrawn = addMonths(thisMonth, -(ALL_TIME_CHART_MONTHS - 1));
  const clipped = first < earliestDrawn;

  return {
    period,
    current: { start: first, end },
    previous: null,
    chart: { start: clipped ? earliestDrawn : first, end },
    clipped,
  };
}

export interface VolumeBucket {
  /** `2026-09-07` for a day, `2026-09` for a month. Stable and sortable. */
  readonly key: string;
  readonly start: Date;
  readonly end: Date;
  /** Load times reps over the completed working sets in it. */
  readonly volumeKg: number;
  /** Workouts with at least one counted set in it. */
  readonly sessions: number;
  /** `now` is inside it, so it is still filling up. */
  readonly inProgress: boolean;
  /** Entirely after `now`. Empty because it has not happened, not because it was skipped. */
  readonly future: boolean;
}

/**
 * Volume per bar: a day each for a week or a month, a month each for all time.
 *
 * Every bucket in the chart comes back, empty or not. A chart that skipped the
 * days with no training would draw three sessions in a week as three days in a
 * row, which is the opposite of what happened.
 *
 * A set is placed by its session's start, as everywhere else, so a workout that
 * runs past midnight stays one bar rather than splitting across two.
 */
export function volumeBuckets(
  window: PeriodWindow,
  sets: readonly HistoricalSet[],
  now: Date,
): VolumeBucket[] {
  const monthly = window.period === 'all';
  const spans = monthly ? monthsIn(window.chart) : daysIn(window.chart);
  const totals = spans.map(() => ({ volumeKg: 0, sessions: new Set<string>() }));

  for (const set of sets) {
    if (!countsTowardVolume(set)) continue;
    const at = set.performedAt.getTime();
    const index = spans.findIndex((span) => at >= span.start.getTime() && at < span.end.getTime());
    const total = totals[index];
    // Outside the chart. Not an error — the caller may pass a wider window.
    if (total === undefined) continue;

    total.sessions.add(set.sessionId);
    // An unmeasurable set — bodyweight work with no bodyweight on file — adds
    // no volume but still happened, so it still counts as a workout that day.
    total.volumeKg += setVolumeKg(set, set.bodyweightKg) ?? 0;
  }

  const moment = now.getTime();
  return spans.map((span, index) => ({
    key: monthly ? monthKey(span.start) : dayKey(span.start),
    start: span.start,
    end: span.end,
    volumeKg: round2(totals[index]?.volumeKg ?? 0),
    sessions: totals[index]?.sessions.size ?? 0,
    inProgress: moment >= span.start.getTime() && moment < span.end.getTime(),
    future: span.start.getTime() > moment,
  }));
}

/** What a session contributes to a period's headline numbers. */
export interface SessionTimes {
  readonly startedAt: Date;
  readonly firstSetAt: Date | null;
  readonly lastSetAt: Date | null;
}

export interface PeriodTotals {
  readonly workouts: number;
  /**
   * Time spent training, first ticked set to last in each workout.
   *
   * Never how long a workout was *open* — that measured a session left
   * running overnight as thirty-five hours of training. See `trainingMinutes`.
   */
  readonly minutes: number;
}

/**
 * Workouts and training time inside a span.
 *
 * The sessions are expected to be the ones worth counting already — finished,
 * with at least one ticked working set — which is what `sessionSummaries`
 * returns. A workout too short to time still counts as a workout; it just adds
 * no minutes.
 */
export function totalsWithin(sessions: readonly SessionTimes[], span: Span): PeriodTotals {
  const start = span.start.getTime();
  const end = span.end.getTime();
  let workouts = 0;
  let minutes = 0;

  for (const session of sessions) {
    const at = session.startedAt.getTime();
    if (Number.isNaN(at) || at < start || at >= end) continue;
    workouts += 1;
    minutes += trainingMinutes([session.firstSetAt, session.lastSetAt]) ?? 0;
  }

  return { workouts, minutes };
}

/**
 * This period against the last one, in the only terms that stay true while
 * this one is still running.
 *
 * On a Tuesday this week is two days old and last week is seven. "Down 60% on
 * last week" would be arithmetically right and a lie about the training, and it
 * would be said every Monday to everybody. So a shortfall carries no direction
 * at all — only last week's number, to read against. Being ahead is different:
 * once this week has passed last week it cannot fall back below it, so that is
 * the one direction the screen can state as a fact.
 */
export type Comparison =
  | { readonly kind: 'ahead'; readonly by: number }
  | { readonly kind: 'level' }
  | { readonly kind: 'behind'; readonly previous: number }
  /** Nothing to compare: no previous period, or nothing in either. */
  | { readonly kind: 'none' };

export function comparePeriods(current: number, previous: number | null): Comparison {
  if (previous === null || !Number.isFinite(previous) || !Number.isFinite(current)) {
    return { kind: 'none' };
  }
  // "Same as last week" about two empty weeks is true and tells nobody anything.
  if (current === 0 && previous === 0) return { kind: 'none' };
  if (current > previous) return { kind: 'ahead', by: current - previous };
  if (current === previous) return { kind: 'level' };
  return { kind: 'behind', previous };
}

/**
 * Minutes as `2h 45m`, `45m` or `1h`.
 *
 * Compact because it sits in a stat card read at a glance, where "2 hours 45
 * minutes" wraps and "165 min" makes somebody do the division.
 */
export function formatMinutes(total: number): string {
  const minutes = Number.isFinite(total) ? Math.max(0, Math.round(total)) : 0;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${String(rest)}m`;
  if (rest === 0) return `${String(hours)}h`;
  return `${String(hours)}h ${String(rest)}m`;
}

function daysIn(span: Span): Span[] {
  const days: Span[] = [];
  for (let day = new Date(span.start); day < span.end; day = addDays(day, 1)) {
    days.push({ start: day, end: addDays(day, 1) });
  }
  return days;
}

function monthsIn(span: Span): Span[] {
  const months: Span[] = [];
  for (let month = startOfMonth(span.start); month < span.end; month = addMonths(month, 1)) {
    months.push({ start: month, end: addMonths(month, 1) });
  }
  return months;
}

function dayKey(date: Date): string {
  return `${monthKey(date)}-${String(date.getDate()).padStart(2, '0')}`;
}

function monthKey(date: Date): string {
  return `${String(date.getFullYear())}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
