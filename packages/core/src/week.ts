/**
 * Training weeks.
 *
 * Every progress view buckets by week — volume per week, sessions per week,
 * the heat map's window — so this is one place with one rule rather than a
 * date calculation copied into four screens.
 *
 * **Weeks are local, not UTC**, and that is the decision this file exists to
 * hold. Timestamps are stored as UTC ISO because that is the only thing that
 * compares correctly across devices, but a workout at 01:00 on Monday in
 * Zagreb happened at 23:00 on Sunday UTC. Bucketing in UTC would file it under
 * the previous week and quietly move a session out of the week the lifter
 * remembers doing it in. Nobody would report that; they would just find the
 * chart slightly wrong and stop trusting it.
 */

/** 0 = Sunday, 1 = Monday, matching `Date.getDay()` and `profiles.week_starts_on`. */
export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** ISO 8601's answer, and the default on `profiles`. */
export const DEFAULT_WEEK_START: WeekStart = 1;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Midnight, local time, on the day the given date falls in. */
export function startOfDay(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Midnight, local time, on the first day of the week the date falls in.
 *
 * Built by stepping whole days rather than subtracting milliseconds, so a
 * clock change lands correctly: the week containing a spring-forward Sunday is
 * 167 hours long, and arithmetic on epoch milliseconds would put its Monday an
 * hour into the previous week.
 */
export function startOfWeek(date: Date, weekStartsOn: WeekStart = DEFAULT_WEEK_START): Date {
  const start = startOfDay(date);
  const offset = (start.getDay() - weekStartsOn + 7) % 7;
  start.setDate(start.getDate() - offset);
  return start;
}

/**
 * A stable, sortable label for a week: `2026-09-07`, its first day.
 *
 * Deliberately not an ISO week number. `2026-W37` sorts correctly and tells a
 * reader nothing, and the year boundary rules for ISO weeks are a source of
 * off-by-one bugs nobody needs for a chart of squats.
 */
export function weekKey(date: Date, weekStartsOn: WeekStart = DEFAULT_WEEK_START): string {
  const start = startOfWeek(date, weekStartsOn);
  const month = String(start.getMonth() + 1).padStart(2, '0');
  const day = String(start.getDate()).padStart(2, '0');
  return `${String(start.getFullYear())}-${month}-${day}`;
}

export function isSameWeek(
  a: Date,
  b: Date,
  weekStartsOn: WeekStart = DEFAULT_WEEK_START,
): boolean {
  return weekKey(a, weekStartsOn) === weekKey(b, weekStartsOn);
}

/**
 * The last `count` week starts, oldest first, ending with the week `now` is in.
 *
 * Returned as a complete run rather than only the weeks with data in them: a
 * chart that skips empty weeks shows a lifter who trained twice in March and
 * twice in July as a steady four-week block, which is the opposite of the
 * truth.
 */
export function recentWeeks(
  now: Date,
  count: number,
  weekStartsOn: WeekStart = DEFAULT_WEEK_START,
): Date[] {
  const weeks: Date[] = [];
  const current = startOfWeek(now, weekStartsOn);
  for (let index = count - 1; index >= 0; index -= 1) {
    const week = new Date(current);
    week.setDate(week.getDate() - index * 7);
    weeks.push(week);
  }
  return weeks;
}

/** Whole days between two dates, by local calendar day rather than by hours. */
export function daysBetween(from: Date, to: Date): number {
  const a = startOfDay(from).getTime();
  const b = startOfDay(to).getTime();
  return Math.round((b - a) / MS_PER_DAY);
}

/**
 * "Today", "Yesterday", "3 days ago", or a date.
 *
 * A history list is read to answer "when did I last train this", and a person
 * counts in days for about a week before they start wanting the date.
 */
export function describeWhen(date: Date, now: Date): string {
  const days = daysBetween(date, now);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${String(days)} days ago`;
  if (days < 14) return 'Last week';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
