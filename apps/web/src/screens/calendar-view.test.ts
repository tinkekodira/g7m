import { describe, expect, it } from 'vitest';
import { monthGrid, type CalendarDay } from '@g7m/core';
import {
  dayLabel,
  dayTitle,
  earliestMonth,
  monthKey,
  monthSummary,
  monthTitle,
  selectedDay,
  shownMonth,
  stepMonth,
  weekdayHeadings,
} from './calendar-view.js';

function local(year: number, month: number, day: number, hour = 12): Date {
  return new Date(year, month - 1, day, hour);
}

// Saturday 12 September 2026.
const NOW = local(2026, 9, 12, 15);
const WEEKS = monthGrid(NOW, NOW);

function day(key: string): CalendarDay {
  const found = WEEKS.flat().find((entry) => entry.key === key);
  if (found === undefined) throw new Error(`no ${key} in the grid`);
  return found;
}

describe('titles', () => {
  it('names the month and the day in English', () => {
    expect(monthTitle(NOW)).toBe('September 2026');
    expect(dayTitle(local(2026, 9, 10))).toBe('Thursday 10 September');
  });
});

describe('weekdayHeadings', () => {
  it('starts the week where the lifter’s week starts', () => {
    expect(weekdayHeadings(1)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    expect(weekdayHeadings(0)).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  });
});

describe('dayLabel', () => {
  /** A colour is not something a screen reader can announce. */
  it('says what the colours say', () => {
    expect(dayLabel(day('2026-09-10'), 1)).toBe('Thursday 10 September, 1 workout');
    expect(dayLabel(day('2026-09-10'), 2)).toBe('Thursday 10 September, 2 workouts');
    expect(dayLabel(day('2026-09-09'), 0)).toBe('Wednesday 9 September, no workout');
    expect(dayLabel(day('2026-09-12'), 0)).toBe('Saturday 12 September, no workout, today');
  });

  it('does not call a day that has not happened a day without a workout', () => {
    expect(dayLabel(day('2026-09-20'), 0)).toBe('Sunday 20 September');
  });
});

describe('selectedDay', () => {
  it('is today until somebody picks a day', () => {
    expect(selectedDay(null, WEEKS)?.key).toBe('2026-09-12');
  });

  it('is the day in the address when there is one', () => {
    expect(selectedDay('2026-09-03', WEEKS)?.key).toBe('2026-09-03');
  });

  it('falls back to today for a day it cannot show', () => {
    // Not yet happened, the month before, and not a day at all.
    for (const key of ['2026-09-20', '2026-08-31', 'yesterday', '2026-02-31']) {
      expect(selectedDay(key, WEEKS)?.key, key).toBe('2026-09-12');
    }
  });
});

describe('which month', () => {
  const earliest = local(2025, 10, 1);

  it('is this one by default', () => {
    expect(monthKey(shownMonth(null, null, NOW, earliest))).toBe('2026-09');
  });

  it('is the month in the address, or else the month of the day in it', () => {
    expect(monthKey(shownMonth('2026-07', null, NOW, earliest))).toBe('2026-07');
    expect(monthKey(shownMonth(null, '2026-08-14', NOW, earliest))).toBe('2026-08');
  });

  it('never shows a month that has not started, or one past the earliest', () => {
    expect(monthKey(shownMonth('2026-12', null, NOW, earliest))).toBe('2026-09');
    expect(monthKey(shownMonth('2024-01', null, NOW, earliest))).toBe('2025-10');
    expect(monthKey(shownMonth('nonsense', null, NOW, earliest))).toBe('2026-09');
  });

  it('steps a month either way, across a new year', () => {
    expect(monthKey(stepMonth(local(2026, 1, 1), -1))).toBe('2025-12');
    expect(monthKey(stepMonth(local(2026, 12, 1), 1))).toBe('2027-01');
  });
});

describe('earliestMonth', () => {
  it('always reaches a year back, for logging what came before the app', () => {
    expect(monthKey(earliestMonth(null, NOW))).toBe('2025-10');
    expect(monthKey(earliestMonth(local(2026, 6, 3), NOW))).toBe('2025-10');
  });

  it('reaches further when the history does', () => {
    expect(monthKey(earliestMonth(local(2024, 3, 9), NOW))).toBe('2024-03');
  });
});

describe('monthSummary', () => {
  it('counts the workouts and the time trained', () => {
    expect(monthSummary({ workouts: 6, minutes: 320 }, NOW, NOW)).toBe('6 workouts · 5h 20m');
    expect(monthSummary({ workouts: 1, minutes: 45 }, NOW, NOW)).toBe('1 workout · 45m');
  });

  /** Workouts logged afterwards carry no duration, and "0m" is not one. */
  it('leaves the time off when there is none to add up', () => {
    expect(monthSummary({ workouts: 2, minutes: 0 }, NOW, NOW)).toBe('2 workouts');
  });

  it('says so plainly when there are none', () => {
    expect(monthSummary({ workouts: 0, minutes: 0 }, NOW, NOW)).toBe('No workouts yet this month');
    expect(monthSummary({ workouts: 0, minutes: 0 }, local(2026, 8, 1), NOW)).toBe(
      'No workouts in August',
    );
  });
});

describe('selectedDay in another month', () => {
  it('shows no day until one is picked, when today is not in the month', () => {
    const august = monthGrid(local(2026, 8, 1), NOW);
    expect(selectedDay(null, august)).toBeUndefined();
    expect(selectedDay('2026-08-14', august)?.key).toBe('2026-08-14');
  });
});
