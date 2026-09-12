import { describe, expect, it } from 'vitest';
import { byDay, monthGrid, parseDateKey } from './calendar.js';

/** Local components, never an ISO string with a `Z`. See `week.test.ts`. */
function local(year: number, month: number, day: number, hour = 12, minute = 0): Date {
  return new Date(year, month - 1, day, hour, minute);
}

// Saturday 12 September 2026. The 1st is a Tuesday.
const NOW = local(2026, 9, 12, 15);

describe('monthGrid', () => {
  it('lays a month out as whole weeks, Monday first', () => {
    const weeks = monthGrid(NOW, NOW);
    expect(weeks).toHaveLength(5);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(weeks[0]?.map((day) => day.key)).toEqual([
      '2026-08-31',
      '2026-09-01',
      '2026-09-02',
      '2026-09-03',
      '2026-09-04',
      '2026-09-05',
      '2026-09-06',
    ]);
    expect(weeks.at(-1)?.at(-1)?.key).toBe('2026-10-04');
  });

  it('marks the days that belong to the months either side', () => {
    const days = monthGrid(NOW, NOW).flat();
    expect(days.filter((day) => day.inMonth)).toHaveLength(30);
    expect(days.find((day) => day.key === '2026-08-31')?.inMonth).toBe(false);
    expect(days.find((day) => day.key === '2026-10-01')?.inMonth).toBe(false);
  });

  it('honours a week that starts on Sunday', () => {
    const weeks = monthGrid(NOW, NOW, 0);
    expect(weeks[0]?.[0]?.key).toBe('2026-08-30');
    expect(weeks[0]?.[2]?.key).toBe('2026-09-01');
  });

  it('knows today, and the days that have not happened yet', () => {
    const days = monthGrid(NOW, NOW).flat();
    expect(days.filter((day) => day.isToday).map((day) => day.key)).toEqual(['2026-09-12']);
    expect(days.find((day) => day.key === '2026-09-11')?.isFuture).toBe(false);
    expect(days.find((day) => day.key === '2026-09-12')?.isFuture).toBe(false);
    expect(days.find((day) => day.key === '2026-09-13')?.isFuture).toBe(true);
  });

  it('needs six rows for a month that starts on the last day of the week', () => {
    // August 2026 starts on a Saturday.
    expect(monthGrid(local(2026, 8, 15), NOW)).toHaveLength(6);
  });

  it('needs only four for a February that starts on the first', () => {
    // February 2027 starts on a Monday and has 28 days.
    expect(monthGrid(local(2027, 2, 10), NOW)).toHaveLength(4);
  });

  it('puts every day at local midnight, clock change or not', () => {
    // October 2026 has the European clock change on the 25th.
    for (const day of monthGrid(local(2026, 10, 1), NOW).flat()) {
      expect(day.date.getHours(), day.key).toBe(0);
    }
  });
});

describe('byDay', () => {
  it('files workouts under the day they started, earliest first', () => {
    const days = byDay([
      { id: 'evening', startedAt: local(2026, 9, 10, 18) },
      { id: 'morning', startedAt: local(2026, 9, 10, 7) },
      { id: 'other', startedAt: local(2026, 9, 8, 18) },
    ]);
    expect(days.get('2026-09-10')?.map((entry) => entry.id)).toEqual(['morning', 'evening']);
    expect(days.get('2026-09-08')?.map((entry) => entry.id)).toEqual(['other']);
    expect(days.has('2026-09-09')).toBe(false);
  });

  it('keeps a workout that ran past midnight on the day it began', () => {
    const days = byDay([{ id: 'late', startedAt: local(2026, 9, 10, 23, 40) }]);
    expect([...days.keys()]).toEqual(['2026-09-10']);
  });
});

describe('parseDateKey', () => {
  it('reads a real day back into local time', () => {
    expect(parseDateKey('2026-09-10')).toEqual(local(2026, 9, 10, 0));
  });

  it('refuses anything that is not a real day', () => {
    for (const bad of [null, '', 'today', '2026-9-10', '2026-02-31', '2026-13-01', '10-09-2026']) {
      expect(parseDateKey(bad), String(bad)).toBeNull();
    }
  });
});
