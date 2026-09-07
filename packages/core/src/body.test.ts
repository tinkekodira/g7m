import { describe, expect, it } from 'vitest';
import {
  ACTIVITY_DESCRIPTIONS,
  ACTIVITY_LABELS,
  ACTIVITY_LEVELS,
  MIN_TREND_DAYS,
  ageOn,
  weighInStatus,
  weightTrend,
  type WeighIn,
} from './body.js';

const DAY = 86_400_000;
const START = new Date('2026-01-05T08:00:00.000Z');

/** A series counted forward in days from `START`, oldest first. */
function series(entries: readonly (readonly [number, number])[]): WeighIn[] {
  return entries.map(([day, weightKg]) => ({
    at: new Date(START.getTime() + day * DAY),
    weightKg,
  }));
}

describe('activity levels', () => {
  it('labels and describes every level', () => {
    // A level added to the union without a label would render as blank in the
    // picker, which is a screen bug that TypeScript can catch here instead.
    for (const level of ACTIVITY_LEVELS) {
      expect(ACTIVITY_LABELS[level]).not.toBe('');
      expect(ACTIVITY_DESCRIPTIONS[level]).not.toBe('');
    }
  });

  it('describes the week outside the gym, not the training in it', () => {
    // The session log already knows about training. Asking twice would double
    // count the one thing the app measures directly.
    expect(ACTIVITY_DESCRIPTIONS.sedentary).toMatch(/desk|driving|walking/i);
  });
});

describe('ageOn', () => {
  it('is the difference in calendar years', () => {
    expect(ageOn(1998, new Date('2026-09-07T00:00:00.000Z'))).toBe(28);
  });

  it('is null when there is no birth year', () => {
    expect(ageOn(null, new Date('2026-09-07T00:00:00.000Z'))).toBeNull();
  });

  it('refuses a year that cannot be right rather than returning a number', () => {
    // A stray digit produces an age of 1926, and a plan generator downstream
    // has no way to tell that from a very old lifter.
    expect(ageOn(19998, new Date('2026-09-07T00:00:00.000Z'))).toBeNull();
    expect(ageOn(2050, new Date('2026-09-07T00:00:00.000Z'))).toBeNull();
  });
});

describe('weighInStatus', () => {
  const now = new Date('2026-01-20T09:00:00.000Z');

  it('is never before the first weigh-in', () => {
    expect(weighInStatus(null, now)).toEqual({ state: 'never', days: null });
  });

  it('is fresh inside the week', () => {
    const status = weighInStatus(new Date('2026-01-17T09:00:00.000Z'), now);
    expect(status).toEqual({ state: 'fresh', days: 3 });
  });

  it('comes due on the seventh day', () => {
    expect(weighInStatus(new Date('2026-01-13T09:00:00.000Z'), now).state).toBe('due');
    expect(weighInStatus(new Date('2026-01-14T09:00:00.000Z'), now).state).toBe('fresh');
  });

  it('is overdue after a fortnight', () => {
    expect(weighInStatus(new Date('2026-01-06T09:00:00.000Z'), now).state).toBe('overdue');
  });

  /**
   * A calendar-week rule would fire here, and it would be wrong: somebody who
   * weighed in on Sunday evening does not need asking again on Monday morning.
   */
  it('counts elapsed days, so a weekend weigh-in is not re-asked on Monday', () => {
    const sundayEvening = new Date('2026-01-18T21:00:00.000Z');
    const mondayMorning = new Date('2026-01-19T07:00:00.000Z');
    expect(weighInStatus(sundayEvening, mondayMorning).state).toBe('fresh');
  });

  it('treats a reading from the future as fresh', () => {
    // A wrong device clock is not a reason to nag.
    expect(weighInStatus(new Date('2026-02-01T09:00:00.000Z'), now)).toEqual({
      state: 'fresh',
      days: 0,
    });
  });
});

describe('weightTrend', () => {
  it('is null with nothing to read', () => {
    expect(weightTrend([])).toBeNull();
  });

  it('reports the latest reading unsmoothed', () => {
    // The headline number has to match the scale, or the screen is arguing
    // with the thing the user is standing on.
    const trend = weightTrend(
      series([
        [0, 84],
        [7, 83.4],
        [21, 82],
      ]),
    );
    expect(trend?.latestKg).toBe(82);
  });

  it('measures the change between averaged ends', () => {
    const trend = weightTrend(
      series([
        [0, 84],
        [3, 83],
        [28, 81],
        [31, 80],
      ]),
    );
    // (84 + 83) / 2 down to (81 + 80) / 2.
    expect(trend?.startKg).toBe(83.5);
    expect(trend?.endKg).toBe(80.5);
    expect(trend?.changeKg).toBe(-3);
  });

  /**
   * The reason both ends are averaged at all. Weigh in dehydrated after a
   * long Friday, then again after a big Sunday lunch, and endpoint-to-endpoint
   * turns a successful cut into a gain.
   */
  it('does not let one heavy morning reverse the story', () => {
    const trend = weightTrend(
      series([
        [0, 82],
        [1, 84],
        [2, 83.5],
        [28, 80],
        [29, 79.5],
        [30, 82.5],
      ]),
    );
    expect(trend?.changeKg).toBeLessThan(0);
  });

  it('states a weekly rate once there is a fortnight to divide by', () => {
    const trend = weightTrend(
      series([
        [0, 84],
        [28, 80],
      ]),
    );
    expect(trend?.spanDays).toBe(28);
    expect(trend?.perWeekKg).toBe(-1);
  });

  /**
   * Below two weeks the two windows overlap, so the same readings would appear
   * on both sides of the subtraction and the rate would be noise with a
   * decimal point on it.
   */
  it('refuses a weekly rate over too short a span', () => {
    const trend = weightTrend(
      series([
        [0, 84],
        [10, 82],
      ]),
    );
    expect(trend?.spanDays).toBeLessThan(MIN_TREND_DAYS);
    expect(trend?.perWeekKg).toBeNull();
    // The change itself is still worth showing; only the extrapolation is not.
    expect(trend?.changeKg).toBe(-2);
  });

  it('handles a single reading without dividing by zero', () => {
    const trend = weightTrend(series([[0, 84]]));
    expect(trend).toEqual({
      latestKg: 84,
      startKg: 84,
      endKg: 84,
      changeKg: 0,
      perWeekKg: null,
      spanDays: 0,
      samples: 1,
    });
  });

  it('sorts a series given out of order', () => {
    // `between()` returns oldest first, but a backfilled reading entered today
    // for last month is exactly the case that would arrive unsorted.
    const trend = weightTrend([
      { at: new Date(START.getTime() + 28 * DAY), weightKg: 80 },
      { at: START, weightKg: 84 },
    ]);
    expect(trend?.latestKg).toBe(80);
    expect(trend?.changeKg).toBe(-4);
  });

  it('ignores readings that carry no usable weight', () => {
    const trend = weightTrend([
      { at: START, weightKg: 84 },
      { at: new Date(START.getTime() + 14 * DAY), weightKg: Number.NaN },
      { at: new Date(START.getTime() + 28 * DAY), weightKg: 80 },
    ]);
    expect(trend?.samples).toBe(2);
  });
});
