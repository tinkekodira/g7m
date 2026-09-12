/**
 * A month laid out as a calendar, and workouts filed under their days.
 *
 * Local calendar time throughout, for the reason `week.ts` gives, and days
 * stepped with `setDate` so a month with a clock change in it still has one
 * midnight per day.
 */
import { startOfMonth } from './periods.js';
import { DEFAULT_WEEK_START, dateKey, startOfDay, startOfWeek, type WeekStart } from './week.js';

export interface CalendarDay {
  /** `2026-09-10`. What a day is looked up and linked by. */
  readonly key: string;
  /** Local midnight. */
  readonly date: Date;
  /** False for the days of the months either side that fill out the first and last weeks. */
  readonly inMonth: boolean;
  readonly isToday: boolean;
  /** After today. Nothing can have happened on it yet. */
  readonly isFuture: boolean;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/**
 * The month `month` falls in, as weeks of seven.
 *
 * Whole weeks, in the lifter's own week — Monday first unless their profile
 * says Sunday — so the first and last rows carry days from the months either
 * side, marked `inMonth: false`. Four rows for a February that starts on the
 * first day of the week, six for a month that starts on its last; the rest
 * are five.
 */
export function monthGrid(
  month: Date,
  now: Date,
  weekStartsOn: WeekStart = DEFAULT_WEEK_START,
): CalendarDay[][] {
  const first = startOfMonth(month);
  const next = new Date(first.getFullYear(), first.getMonth() + 1, 1);
  const today = startOfDay(now).getTime();

  const weeks: CalendarDay[][] = [];
  for (
    let weekStart = startOfWeek(first, weekStartsOn);
    weekStart < next;
    weekStart = addDays(weekStart, 7)
  ) {
    const week: CalendarDay[] = [];
    for (let offset = 0; offset < 7; offset++) {
      const date = addDays(weekStart, offset);
      week.push({
        key: dateKey(date),
        date,
        inMonth: date.getMonth() === first.getMonth(),
        isToday: date.getTime() === today,
        isFuture: date.getTime() > today,
      });
    }
    weeks.push(week);
  }
  return weeks;
}

/**
 * Workouts filed under the day they started, earliest first within a day.
 *
 * By the start, like everything else: a session that runs past midnight is
 * one workout on the day it began, not half of one on each.
 */
export function byDay<T extends { readonly startedAt: Date }>(
  items: readonly T[],
): Map<string, T[]> {
  const days = new Map<string, T[]>();
  const ordered = [...items].sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());
  for (const item of ordered) {
    const key = dateKey(item.startedAt);
    days.set(key, [...(days.get(key) ?? []), item]);
  }
  return days;
}

/**
 * A `2026-09-10` key back into a local date, or null if it is not a real day.
 *
 * Read back and compared rather than trusted, because `new Date(2026, 1, 31)`
 * is quietly the 3rd of March — and this reads a URL, which says whatever the
 * last link or a hand-edited address put there.
 */
export function parseDateKey(key: string | null): Date | null {
  if (key === null) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (match === null) return null;

  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null;
}
