/**
 * The calendar screen's words, and which day it is showing.
 *
 * Kept out of the component so the edges can be tested: the week that starts
 * on Sunday, the address that names a day that has not happened, the label a
 * screen reader gives a day with two workouts on it.
 */
import type { CalendarDay, WeekStart } from '@g7m/core';
import { WEEKDAYS_SHORT, monthName, weekdayName } from '../lib/date-words.js';

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

/**
 * The day shown under the calendar.
 *
 * The one in the address when it is a day of this month that has happened —
 * which is what brings somebody back to the day they were looking at after
 * opening one of its workouts. Anything else, and the default, is today.
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
