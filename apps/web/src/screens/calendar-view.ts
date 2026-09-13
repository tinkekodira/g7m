/**
 * The calendar screen's words, and which day it is showing.
 *
 * Kept out of the component so the edges can be tested: the week that starts
 * on Sunday, the address that names a day that has not happened, the label a
 * screen reader gives a day with two workouts on it.
 */
import {
  formatMinutes,
  parseDateKey,
  startOfMonth,
  type CalendarDay,
  type PeriodTotals,
  type WeekStart,
} from '@g7m/core';
import { WEEKDAYS_SHORT, monthName, weekdayName } from '../lib/date-words.js';

/**
 * How many months back the calendar always reaches, counting this one.
 *
 * A year, even with nothing logged in it — which is where somebody new who
 * wants to log the training they did before they found the app needs to go.
 * Further back than that only if their history does.
 */
export const MONTHS_ALWAYS_REACHABLE = 12;

/** "September 2026". */
export function monthTitle(date: Date): string {
  return `${monthName(date)} ${String(date.getFullYear())}`;
}

/** The row of weekday names across the top, in the lifter's own week. */
export function weekdayHeadings(weekStartsOn: WeekStart): string[] {
  return Array.from({ length: 7 }, (_, index) => WEEKDAYS_SHORT[(weekStartsOn + index) % 7] ?? '');
}

/** "Thursday 10 September". */
export function dayTitle(date: Date): string {
  return `${weekdayName(date)} ${String(date.getDate())} ${monthName(date)}`;
}

/**
 * What a screen reader says for a day: "Thursday 10 September, 1 workout".
 *
 * The colours carry this for everybody else — a filled day trained, a ringed
 * day today — and a colour is not something a screen reader can announce.
 */
export function dayLabel(day: CalendarDay, workouts: number): string {
  const parts = [dayTitle(day.date)];
  if (workouts > 0) parts.push(`${String(workouts)} ${workouts === 1 ? 'workout' : 'workouts'}`);
  else if (!day.isFuture) parts.push('no workout');
  if (day.isToday) parts.push('today');
  return parts.join(', ');
}

/** `2026-09`, for the address. */
export function monthKey(date: Date): string {
  return `${String(date.getFullYear())}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * The earliest month the back arrow reaches: a year back, or the month of the
 * first workout if that is further.
 */
export function earliestMonth(firstWorkoutAt: Date | null, now: Date): Date {
  const thisMonth = startOfMonth(now);
  const yearBack = new Date(
    thisMonth.getFullYear(),
    thisMonth.getMonth() - (MONTHS_ALWAYS_REACHABLE - 1),
    1,
  );
  if (firstWorkoutAt === null) return yearBack;
  const first = startOfMonth(firstWorkoutAt);
  return first < yearBack ? first : yearBack;
}

/**
 * The month to show, from the address.
 *
 * `?month=2026-08` when there is one; otherwise the month of `?day=`, so a
 * link back to a day lands on its month; otherwise this month. Held between
 * the earliest reachable month and this one — the future has nothing in it,
 * and an address can say anything.
 */
export function shownMonth(
  month: string | null,
  day: string | null,
  now: Date,
  earliest: Date,
): Date {
  const thisMonth = startOfMonth(now);
  const fromMonth = month === null ? null : parseDateKey(`${month}-01`);
  const fromDay = parseDateKey(day);
  const wanted = startOfMonth(fromMonth ?? fromDay ?? thisMonth);
  if (wanted > thisMonth) return thisMonth;
  if (wanted < earliest) return startOfMonth(earliest);
  return wanted;
}

/** The first of the month either side. */
export function stepMonth(month: Date, by: number): Date {
  return new Date(month.getFullYear(), month.getMonth() + by, 1);
}

/**
 * The line under the month's name: "6 workouts · 5h 20m".
 *
 * The time is left off when there is none to add up — workouts logged
 * afterwards carry no duration — rather than printed as "0m".
 */
export function monthSummary(totals: PeriodTotals, month: Date, now: Date): string {
  if (totals.workouts === 0) {
    return monthKey(month) === monthKey(now)
      ? 'No workouts yet this month'
      : `No workouts in ${monthName(month)}`;
  }
  const count = `${String(totals.workouts)} ${totals.workouts === 1 ? 'workout' : 'workouts'}`;
  return totals.minutes > 0 ? `${count} · ${formatMinutes(totals.minutes)}` : count;
}

/**
 * The day shown under the calendar.
 *
 * The one in the address when it is a day of the month shown that has
 * happened — which is what brings somebody back to the day they were looking
 * at after opening one of its workouts. Otherwise today, if today is in the
 * month shown, and nothing at all for an earlier month until a day is picked.
 */
export function selectedDay(
  key: string | null,
  weeks: readonly (readonly CalendarDay[])[],
): CalendarDay | undefined {
  const days = weeks.flat();
  const asked = days.find((day) => day.key === key);
  if (asked !== undefined && asked.inMonth && !asked.isFuture) return asked;
  return days.find((day) => day.isToday);
}
