import { describe, expect, it } from 'vitest';
import {
  ALL_TIME_CHART_MONTHS,
  comparePeriods,
  formatMinutes,
  periodWindow,
  startOfMonth,
  totalsWithin,
  volumeBuckets,
  type SessionTimes,
} from './periods.js';
import type { HistoricalSet } from './progress.js';

/**
 * Local components, never an ISO string with a `Z`, so these test the code and
 * not the timezone of the machine running them. See `week.test.ts`.
 */
function local(year: number, month: number, day: number, hour = 12, minute = 0): Date {
  return new Date(year, month - 1, day, hour, minute);
}

function set(overrides: Partial<HistoricalSet> & { performedAt: Date }): HistoricalSet {
  return {
    sessionId: 's1',
    exerciseId: 'bench',
    bodyweightKg: 80,
    setType: 'working',
    loadType: 'external',
    weightKg: 100,
    reps: 5,
    isCompleted: true,
    ...overrides,
  };
}

// Wednesday 9 September 2026, mid-afternoon. The 7th is a Monday.
const WEDNESDAY = local(2026, 9, 9, 15);

describe('periodWindow', () => {
  it('runs a week from its first day to the next, and compares with the one before', () => {
    const window = periodWindow('week', WEDNESDAY);
    expect(window.current.start).toEqual(local(2026, 9, 7, 0));
    expect(window.current.end).toEqual(local(2026, 9, 14, 0));
    expect(window.previous?.start).toEqual(local(2026, 8, 31, 0));
    expect(window.previous?.end).toEqual(local(2026, 9, 7, 0));
    expect(window.chart).toEqual(window.current);
    expect(window.clipped).toBe(false);
  });

  it('honours a week that starts on Sunday', () => {
    const window = periodWindow('week', WEDNESDAY, 0);
    expect(window.current.start).toEqual(local(2026, 9, 6, 0));
  });

  it('runs a month from the first to the first', () => {
    const window = periodWindow('month', WEDNESDAY);
    expect(window.current.start).toEqual(local(2026, 9, 1, 0));
    expect(window.current.end).toEqual(local(2026, 10, 1, 0));
    expect(window.previous).toEqual({ start: local(2026, 8, 1, 0), end: local(2026, 9, 1, 0) });
  });

  it('reaches back across a new year for the month before January', () => {
    const window = periodWindow('month', local(2027, 1, 15));
    expect(window.previous?.start).toEqual(local(2026, 12, 1, 0));
    expect(window.previous?.end).toEqual(local(2027, 1, 1, 0));
  });

  it('starts all time at the month of the first workout, with nothing to compare against', () => {
    const window = periodWindow('all', WEDNESDAY, 1, local(2026, 6, 20));
    expect(window.current.start).toEqual(local(2026, 6, 1, 0));
    expect(window.current.end).toEqual(local(2026, 10, 1, 0));
    expect(window.previous).toBeNull();
    expect(window.chart).toEqual(window.current);
    expect(window.clipped).toBe(false);
  });

  /**
   * The totals stay all time; only the drawing stops at a year, and `clipped`
   * is what lets the screen say so rather than silently mislabel the chart.
   */
  it('draws at most a year of all time, and says when it has stopped short', () => {
    const window = periodWindow('all', WEDNESDAY, 1, local(2024, 3, 2));
    expect(window.current.start).toEqual(local(2024, 3, 1, 0));
    expect(window.chart.start).toEqual(local(2025, 10, 1, 0));
    expect(window.clipped).toBe(true);
  });

  it('makes all time this month when nothing has been logged yet', () => {
    const window = periodWindow('all', WEDNESDAY);
    expect(window.current.start).toEqual(local(2026, 9, 1, 0));
    expect(window.clipped).toBe(false);
  });

  it('treats a first workout dated in the future as a clock that was wrong', () => {
    const window = periodWindow('all', WEDNESDAY, 1, local(2027, 1, 1));
    expect(window.current.start).toEqual(local(2026, 9, 1, 0));
  });
});

describe('startOfMonth', () => {
  it('is local midnight on the first', () => {
    const start = startOfMonth(local(2026, 2, 28, 23, 59));
    expect(start).toEqual(local(2026, 2, 1, 0));
  });
});

describe('volumeBuckets', () => {
  it('gives a week seven days, each starting at local midnight', () => {
    const buckets = volumeBuckets(periodWindow('week', WEDNESDAY), [], WEDNESDAY);
    expect(buckets.map((bucket) => bucket.key)).toEqual([
      '2026-09-07',
      '2026-09-08',
      '2026-09-09',
      '2026-09-10',
      '2026-09-11',
      '2026-09-12',
      '2026-09-13',
    ]);
    for (const bucket of buckets) {
      expect(bucket.start.getHours()).toBe(0);
      expect(bucket.volumeKg).toBe(0);
    }
  });

  it('marks today as in progress and the days after it as not yet happened', () => {
    const buckets = volumeBuckets(periodWindow('week', WEDNESDAY), [], WEDNESDAY);
    expect(buckets.map((bucket) => bucket.inProgress)).toEqual([
      false,
      false,
      true,
      false,
      false,
      false,
      false,
    ]);
    expect(buckets.map((bucket) => bucket.future)).toEqual([
      false,
      false,
      false,
      true,
      true,
      true,
      true,
    ]);
  });

  it('adds up each day’s working sets, and counts each workout once', () => {
    const sets = [
      set({ sessionId: 'monday', performedAt: local(2026, 9, 7, 18), weightKg: 100, reps: 5 }),
      set({ sessionId: 'monday', performedAt: local(2026, 9, 7, 18), weightKg: 100, reps: 5 }),
      set({ sessionId: 'wednesday', performedAt: local(2026, 9, 9, 7), weightKg: 60, reps: 10 }),
    ];
    const buckets = volumeBuckets(periodWindow('week', WEDNESDAY), sets, WEDNESDAY);
    expect(buckets[0]).toMatchObject({ volumeKg: 1000, sessions: 1 });
    expect(buckets[1]).toMatchObject({ volumeKg: 0, sessions: 0 });
    expect(buckets[2]).toMatchObject({ volumeKg: 600, sessions: 1 });
  });

  it('leaves out warm-ups and unticked sets', () => {
    const sets = [
      set({ performedAt: local(2026, 9, 8), setType: 'warmup' }),
      set({ performedAt: local(2026, 9, 8), isCompleted: false }),
    ];
    const buckets = volumeBuckets(periodWindow('week', WEDNESDAY), sets, WEDNESDAY);
    expect(buckets[1]).toMatchObject({ volumeKg: 0, sessions: 0 });
  });

  /**
   * A dip with no bodyweight on file cannot be measured, but it was still done,
   * and a day with a workout in it must not draw as a day off.
   */
  it('counts a workout it cannot measure, without inventing volume for it', () => {
    const sets = [
      set({
        performedAt: local(2026, 9, 8),
        loadType: 'bodyweight',
        weightKg: 0,
        bodyweightKg: null,
      }),
    ];
    const buckets = volumeBuckets(periodWindow('week', WEDNESDAY), sets, WEDNESDAY);
    expect(buckets[1]).toMatchObject({ volumeKg: 0, sessions: 1 });
  });

  it('ignores sets outside the chart rather than failing on them', () => {
    const sets = [
      set({ performedAt: local(2026, 9, 1) }),
      set({ performedAt: local(2026, 9, 20) }),
    ];
    const buckets = volumeBuckets(periodWindow('week', WEDNESDAY), sets, WEDNESDAY);
    expect(buckets.every((bucket) => bucket.sessions === 0)).toBe(true);
  });

  it('files a set by its session’s start, so a workout past midnight is one bar', () => {
    const sets = [set({ performedAt: local(2026, 9, 8, 23, 40) })];
    const buckets = volumeBuckets(periodWindow('week', WEDNESDAY), sets, WEDNESDAY);
    expect(buckets[1]?.sessions).toBe(1);
    expect(buckets[2]?.sessions).toBe(0);
  });

  it('gives a month one bar per day it has', () => {
    expect(volumeBuckets(periodWindow('month', WEDNESDAY), [], WEDNESDAY)).toHaveLength(30);
    const february = local(2028, 2, 10);
    expect(volumeBuckets(periodWindow('month', february), [], february)).toHaveLength(29);
  });

  it('gives all time a bar per month, the current one still in progress', () => {
    const window = periodWindow('all', WEDNESDAY, 1, local(2026, 6, 3));
    const sets = [
      set({ sessionId: 'june', performedAt: local(2026, 6, 3), weightKg: 50, reps: 10 }),
      set({ sessionId: 'september', performedAt: local(2026, 9, 8), weightKg: 100, reps: 5 }),
    ];
    const buckets = volumeBuckets(window, sets, WEDNESDAY);
    expect(buckets.map((bucket) => bucket.key)).toEqual([
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
    ]);
    expect(buckets[0]?.volumeKg).toBe(500);
    expect(buckets[3]).toMatchObject({ volumeKg: 500, inProgress: true, future: false });
  });

  it('never draws more months than the chart has room for', () => {
    const window = periodWindow('all', WEDNESDAY, 1, local(2020, 1, 1));
    expect(volumeBuckets(window, [], WEDNESDAY)).toHaveLength(ALL_TIME_CHART_MONTHS);
  });
});

describe('totalsWithin', () => {
  const span = { start: local(2026, 9, 7, 0), end: local(2026, 9, 14, 0) };

  function session(startedAt: Date, minutes: number | null): SessionTimes {
    return {
      startedAt,
      firstSetAt: minutes === null ? null : startedAt,
      lastSetAt: minutes === null ? null : new Date(startedAt.getTime() + minutes * 60_000),
    };
  }

  it('counts the workouts inside the span and adds up their training time', () => {
    const totals = totalsWithin(
      [
        session(local(2026, 9, 7, 18), 50),
        session(local(2026, 9, 9, 7), 45),
        // Either side of the week, and not counted.
        session(local(2026, 9, 6, 18), 60),
        session(local(2026, 9, 14, 0), 60),
      ],
      span,
    );
    expect(totals).toEqual({ workouts: 2, minutes: 95 });
  });

  it('counts a workout too short to time, and adds no minutes for it', () => {
    expect(totalsWithin([session(local(2026, 9, 8), null)], span)).toEqual({
      workouts: 1,
      minutes: 0,
    });
  });

  it('is zero for an empty span', () => {
    expect(totalsWithin([], span)).toEqual({ workouts: 0, minutes: 0 });
  });
});

describe('comparePeriods', () => {
  it('states being ahead, by how much', () => {
    expect(comparePeriods(5, 3)).toEqual({ kind: 'ahead', by: 2 });
    expect(comparePeriods(2, 0)).toEqual({ kind: 'ahead', by: 2 });
  });

  it('states being level', () => {
    expect(comparePeriods(3, 3)).toEqual({ kind: 'level' });
  });

  /**
   * On a Tuesday this week is two days old. A shortfall carries last week's
   * number and no direction, because it may yet be made up.
   */
  it('gives a shortfall only last week’s number, never a direction', () => {
    expect(comparePeriods(1, 4)).toEqual({ kind: 'behind', previous: 4 });
  });

  it('has nothing to say about two empty periods, or with nothing to compare', () => {
    expect(comparePeriods(0, 0)).toEqual({ kind: 'none' });
    expect(comparePeriods(4, null)).toEqual({ kind: 'none' });
    expect(comparePeriods(Number.NaN, 2)).toEqual({ kind: 'none' });
  });
});

describe('formatMinutes', () => {
  it('reads as hours and minutes', () => {
    expect(formatMinutes(0)).toBe('0m');
    expect(formatMinutes(45)).toBe('45m');
    expect(formatMinutes(60)).toBe('1h');
    expect(formatMinutes(165)).toBe('2h 45m');
  });

  it('rounds to a whole minute and never goes negative', () => {
    expect(formatMinutes(59.6)).toBe('1h');
    expect(formatMinutes(-5)).toBe('0m');
    expect(formatMinutes(Number.NaN)).toBe('0m');
  });
});
