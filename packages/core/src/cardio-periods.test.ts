import { describe, expect, it } from 'vitest';
import { EMPTY_BOUT, type Bout, type CardioKind, type LoggedBout } from './cardio.js';
import { cardioBuckets, cardioTotalsWithin, periodWindow } from './periods.js';

/** Wednesday 16 September 2026, mid-afternoon; weeks start on Monday. */
const NOW = new Date(2026, 8, 16, 15, 0);

function logged(
  day: number,
  kind: CardioKind,
  fields: Partial<Bout>,
  bodyweightKg: number | null = 80,
): LoggedBout {
  return {
    sessionId: `s-${String(day)}`,
    performedAt: new Date(2026, 8, day, 7, 30),
    kind,
    bout: { ...EMPTY_BOUT, ...fields },
    bodyweightKg,
  };
}

const MONDAY_ROW = logged(14, 'rower', { durationSeconds: 480, distanceM: 2000 });
const MONDAY_BIKE = logged(14, 'bike', { durationSeconds: 1200, avgWatts: 150 });
const TODAY_RUN = logged(16, 'treadmill', { durationSeconds: 1800, distanceM: 5000, speedKmh: 10 });
const LAST_WEEK = logged(9, 'treadmill', { durationSeconds: 1500, caloriesKcal: 300 });

describe('cardioBuckets', () => {
  const week = periodWindow('week', NOW, 1);

  it('draws the same seven days as the volume chart', () => {
    const buckets = cardioBuckets(week, [MONDAY_ROW, TODAY_RUN], NOW);
    expect(buckets.map((bucket) => bucket.key)).toEqual([
      '2026-09-14',
      '2026-09-15',
      '2026-09-16',
      '2026-09-17',
      '2026-09-18',
      '2026-09-19',
      '2026-09-20',
    ]);
  });

  it('adds up each day’s minutes', () => {
    const buckets = cardioBuckets(week, [MONDAY_ROW, MONDAY_BIKE, TODAY_RUN, LAST_WEEK], NOW);
    expect(buckets.map((bucket) => bucket.minutes)).toEqual([28, 0, 30, 0, 0, 0, 0]);
  });

  it('marks today as in progress and the days after as not yet happened', () => {
    const buckets = cardioBuckets(week, [], NOW);
    expect(buckets.map((bucket) => bucket.inProgress)).toEqual([
      false,
      false,
      true,
      false,
      false,
      false,
      false,
    ]);
    expect(buckets.filter((bucket) => bucket.future).length).toBe(4);
  });

  it('draws a column a month for all time', () => {
    const all = periodWindow('all', NOW, 1, new Date(2026, 6, 2));
    const buckets = cardioBuckets(all, [MONDAY_ROW, LAST_WEEK], NOW);
    expect(buckets.at(-1)).toMatchObject({ key: '2026-09', minutes: 33, inProgress: true });
  });
});

describe('cardioTotalsWithin', () => {
  const week = periodWindow('week', NOW, 1);

  it('adds up time, distance and calories for the week, and nothing outside it', () => {
    // Rower 112 kcal from its pace; bike 150 W for 20 min: 27.66 ml/kg/min →
    // 11.06 kcal/min × 20 = 221; treadmill 10 km/h for 30 min: 442.
    expect(
      cardioTotalsWithin([MONDAY_ROW, MONDAY_BIKE, TODAY_RUN, LAST_WEEK], week.current),
    ).toEqual({ minutes: 58, distanceM: 7000, kcal: 112 + 221 + 442, bouts: 3 });
  });

  it('uses the machine’s figure where one was typed', () => {
    expect(cardioTotalsWithin([LAST_WEEK], week.previous ?? week.current).kcal).toBe(300);
  });

  it('counts a bout it cannot price, adding no calories for it', () => {
    const noWeight = logged(15, 'bike', { durationSeconds: 600 }, null);
    expect(cardioTotalsWithin([noWeight], week.current)).toEqual({
      minutes: 10,
      distanceM: 0,
      kcal: 0,
      bouts: 1,
    });
  });

  it('is all zeros for a week with no cardio', () => {
    expect(cardioTotalsWithin([], week.current)).toEqual({
      minutes: 0,
      distanceM: 0,
      kcal: 0,
      bouts: 0,
    });
  });
});
