import { describe, expect, it } from 'vitest';
import { monthGrid, type CalendarDay } from '@g7m/core';
import { dayLabel, dayTitle, monthTitle, selectedDay, weekdayHeadings } from './calendar-view.js';

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
