import { describe, expect, it } from 'vitest';
import {
  DEFAULT_WEEK_START,
  daysBetween,
  describeWhen,
  isSameWeek,
  recentWeeks,
  startOfDay,
  startOfWeek,
  weekKey,
} from './week.js';

/**
 * Dates are constructed from local components, never from an ISO string with a
 * `Z` on it. `new Date('2026-09-07')` is midnight *UTC*, which in a westward
 * timezone is the 6th — and half of these assertions would then be testing the
 * runner's timezone rather than the code.
 */
function local(year: number, month: number, day: number, hour = 12): Date {
  return new Date(year, month - 1, day, hour);
}

describe('startOfWeek', () => {
  // 2026-09-07 is a Monday.
  it('finds the Monday of a mid-week day', () => {
    expect(startOfWeek(local(2026, 9, 10)).getDate()).toBe(7);
  });

  it('leaves a Monday where it is', () => {
    expect(startOfWeek(local(2026, 9, 7)).getDate()).toBe(7);
  });

  it('puts Sunday at the end of its week, not the start', () => {
    // The classic off-by-one: with a Monday start, Sunday the 13th belongs to
    // the week beginning Monday the 7th.
    expect(startOfWeek(local(2026, 9, 13)).getDate()).toBe(7);
  });

  it('honours a Sunday start', () => {
    expect(startOfWeek(local(2026, 9, 10), 0).getDate()).toBe(6);
    expect(startOfWeek(local(2026, 9, 13), 0).getDate()).toBe(13);
  });

  it('crosses a month boundary', () => {
    // Wednesday 2026-10-01 belongs to the week starting Monday 2026-09-28.
    const start = startOfWeek(local(2026, 10, 1));
    expect(start.getMonth()).toBe(8);
    expect(start.getDate()).toBe(28);
  });

  it('is midnight, not the time of day it was given', () => {
    const start = startOfWeek(local(2026, 9, 10, 23));
    expect([start.getHours(), start.getMinutes(), start.getSeconds()]).toEqual([0, 0, 0]);
  });

  it('is idempotent', () => {
    const once = startOfWeek(local(2026, 9, 10));
    expect(startOfWeek(once)).toEqual(once);
  });
});

describe('weeks are local, not UTC', () => {
  /**
   * The bug this file exists to prevent. A session logged at 00:30 on Monday
   * is in the week beginning that Monday — in UTC it may still be Sunday, and
   * bucketing there would file it under the previous week and quietly move a
   * workout out of the week the lifter remembers doing it in.
   */
  it('keeps a workout just after midnight in the week that just started', () => {
    const justAfterMidnight = local(2026, 9, 7, 0);
    justAfterMidnight.setMinutes(30);
    expect(startOfWeek(justAfterMidnight).getDate()).toBe(7);
    expect(weekKey(justAfterMidnight)).toBe('2026-09-07');
  });

  it('keeps a workout just before midnight in the week that is ending', () => {
    const justBeforeMidnight = local(2026, 9, 13, 23);
    justBeforeMidnight.setMinutes(45);
    expect(weekKey(justBeforeMidnight)).toBe('2026-09-07');
  });
});

describe('weekKey', () => {
  it('is the first day of the week, zero-padded so it sorts as text', () => {
    expect(weekKey(local(2026, 9, 10))).toBe('2026-09-07');
    expect(weekKey(local(2026, 1, 8))).toBe('2026-01-05');
  });

  it('sorts chronologically as a plain string', () => {
    const keys = [local(2026, 12, 1), local(2026, 1, 15), local(2026, 9, 10)].map((d) =>
      weekKey(d),
    );
    expect([...keys].sort()).toEqual([weekKey(local(2026, 1, 15)), keys[2], keys[0]]);
  });

  it('agrees with isSameWeek', () => {
    expect(isSameWeek(local(2026, 9, 7), local(2026, 9, 13))).toBe(true);
    expect(isSameWeek(local(2026, 9, 13), local(2026, 9, 14))).toBe(false);
  });
});

describe('recentWeeks', () => {
  it('ends with the week we are in, oldest first', () => {
    const weeks = recentWeeks(local(2026, 9, 10), 4);
    expect(weeks.map((w) => weekKey(w))).toEqual([
      '2026-08-17',
      '2026-08-24',
      '2026-08-31',
      '2026-09-07',
    ]);
  });

  /**
   * A chart that skips empty weeks shows somebody who trained twice in March
   * and twice in July as a steady four-week block.
   */
  it('is a complete run with no gaps', () => {
    const weeks = recentWeeks(local(2026, 9, 10), 12);
    expect(weeks).toHaveLength(12);

    const gaps = weeks.slice(1).map((week, index) => {
      const previous = weeks[index];
      return previous === undefined ? null : daysBetween(previous, week);
    });
    expect(gaps).toEqual(new Array(11).fill(7));
  });

  it('returns nothing for a count of zero', () => {
    expect(recentWeeks(local(2026, 9, 10), 0)).toEqual([]);
  });

  it('uses the same week start it was given', () => {
    const [sundayWeek] = recentWeeks(local(2026, 9, 10), 1, 0);
    expect(sundayWeek === undefined ? null : weekKey(sundayWeek, 0)).toBe('2026-09-06');
  });
});

describe('daysBetween', () => {
  it('counts calendar days, not elapsed hours', () => {
    // 23:00 to 01:00 is two hours and one day.
    expect(daysBetween(local(2026, 9, 7, 23), local(2026, 9, 8, 1))).toBe(1);
  });

  it('is zero within a day and negative going backwards', () => {
    expect(daysBetween(local(2026, 9, 7, 1), local(2026, 9, 7, 23))).toBe(0);
    expect(daysBetween(local(2026, 9, 8), local(2026, 9, 7))).toBe(-1);
  });
});

describe('describeWhen', () => {
  const now = local(2026, 9, 10);

  it('counts in days for the first week', () => {
    expect(describeWhen(local(2026, 9, 10, 6), now)).toBe('Today');
    expect(describeWhen(local(2026, 9, 9), now)).toBe('Yesterday');
    expect(describeWhen(local(2026, 9, 7), now)).toBe('3 days ago');
  });

  it('says today for something logged later in the same day', () => {
    // The session that is still open, read from a screen a minute later.
    expect(describeWhen(local(2026, 9, 10, 23), now)).toBe('Today');
  });

  it('gives up counting and shows a date once it stops helping', () => {
    expect(describeWhen(local(2026, 9, 1), now)).toBe('Last week');
    expect(describeWhen(local(2026, 6, 1), now)).toMatch(/2026/);
  });
});

describe('startOfDay', () => {
  it('does not mutate what it was given', () => {
    const original = local(2026, 9, 10, 15);
    startOfDay(original);
    expect(original.getHours()).toBe(15);
  });
});

describe('DEFAULT_WEEK_START', () => {
  it('is Monday, matching ISO 8601 and the profiles column', () => {
    expect(DEFAULT_WEEK_START).toBe(1);
  });
});
