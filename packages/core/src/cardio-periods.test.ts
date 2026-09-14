import { describe, expect, it } from 'vitest';
import { EMPTY_BOUT, type Bout, type CardioKind, type LoggedBout } from './cardio.js';
import { cardioTotalsWithin, periodWindow } from './periods.js';

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
