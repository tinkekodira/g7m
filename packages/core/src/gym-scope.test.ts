import { describe, expect, it } from 'vitest';
import { EMPTY_BOUT } from './cardio.js';
import { monthRecords } from './month-stats.js';
import type { HistoricalSet } from './progress.js';
import { buildWorkoutRecap, type RecapSet } from './workout-recap.js';

/**
 * ADR-0179, the case that started it: a chest press machine at two gyms.
 * 100 kg × 8 at Iron Works, and at City Gym 90 kg is too much for more than
 * six. Neither is a record against the other, and neither is a regression.
 */

const day = (n: number): Date => new Date(2026, 10, n, 18);

function past(
  sessionId: string,
  n: number,
  gymScope: string | null,
  weightKg: number,
  reps: number,
  exerciseId = 'chest-press',
): HistoricalSet {
  return {
    sessionId,
    exerciseId,
    gymScope,
    performedAt: day(n),
    bodyweightKg: 80,
    setType: 'working',
    loadType: 'external',
    weightKg,
    reps,
    isCompleted: true,
  };
}

function today(id: string, weightKg: number, reps: number): RecapSet {
  return {
    id,
    setType: 'working',
    loadType: 'external',
    weightKg,
    reps,
    isCompleted: true,
    completedAt: day(10),
    bout: EMPTY_BOUT,
  };
}

function recap(gymScope: string | null, sets: readonly RecapSet[], history: HistoricalSet[]) {
  return buildWorkoutRecap({
    sessionId: 'today',
    startedAt: day(10),
    endedAt: new Date(day(10).getTime() + 3_600_000),
    backdated: false,
    bodyweightKg: 80,
    blocks: [{ exerciseId: 'chest-press', gymScope, isTimeBased: false, cardioKind: null, sets }],
    history,
    work: [],
  }).comparisons[0];
}

describe('a machine at two gyms', () => {
  const history = [past('a1', 1, 'iron', 100, 8)];

  it('is a first time, not a regression, at the second gym', () => {
    const first = recap('city', [today('s1', 90, 6)], history);
    expect(first?.previous).toBeNull();
    expect(first?.records).toEqual([]);
  });

  it('is a record at the second gym once it beats its own best there', () => {
    const second = recap(
      'city',
      [today('s1', 92.5, 6)],
      [...history, past('c1', 5, 'city', 90, 6)],
    );
    expect(second?.previous?.weightKg).toBe(90);
    expect(second?.records.map((record) => record.kind)).toEqual(['heaviest']);
  });

  it('still compares the first gym with itself', () => {
    const back = recap('iron', [today('s1', 100, 8)], [...history, past('c1', 5, 'city', 90, 6)]);
    expect(back?.previous?.weightKg).toBe(100);
    expect(back?.records).toEqual([]);
  });

  it('is one history for somebody with one gym', () => {
    const one = recap(null, [today('s1', 102.5, 8)], [past('a1', 1, null, 100, 8)]);
    expect(one?.records.map((record) => record.kind)).toEqual(['heaviest']);
  });

  it('counts this month’s records per gym', () => {
    const records = monthRecords(
      [
        past('a1', 1, 'iron', 100, 8),
        past('c1', 2, 'city', 80, 6),
        past('a2', 25, 'iron', 100, 8),
        past('c2', 26, 'city', 92.5, 6),
      ],
      new Date(2026, 10, 28),
    );
    // November is the whole history here, so nothing before it: no records,
    // but the two gyms are two lifts.
    expect(records.lifts.map((lift) => [lift.gymScope, lift.bestKg])).toEqual([
      ['iron', 100],
      ['city', 92.5],
    ]);
  });
});
