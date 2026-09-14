import { describe, expect, it } from 'vitest';
import { EMPTY_BOUT, type LoggedBout } from './cardio.js';
import {
  CHART_METRICS,
  chartBuckets,
  isChartMetric,
  periodWindow,
  type ChartInput,
  type SessionTimes,
} from './periods.js';
import type { HistoricalSet } from './progress.js';

/** Wednesday 16 September 2026; weeks start on Monday. */
const NOW = new Date(2026, 8, 16, 15, 0);
const WEEK = periodWindow('week', NOW, 1);

function at(day: number, hour = 7, minute = 0): Date {
  return new Date(2026, 8, day, hour, minute);
}

function set(
  day: number,
  weightKg: number,
  reps: number,
  setType: 'working' | 'warmup' = 'working',
) {
  const entry: HistoricalSet = {
    sessionId: `s-${String(day)}`,
    exerciseId: 'bench',
    performedAt: at(day),
    bodyweightKg: 80,
    setType,
    loadType: 'external',
    weightKg,
    reps,
    isCompleted: true,
  };
  return entry;
}

function session(day: number, minutes: number): SessionTimes {
  return { startedAt: at(day), firstSetAt: at(day, 7, 5), lastSetAt: at(day, 7, 5 + minutes) };
}

const ROW: LoggedBout = {
  sessionId: 's-16',
  performedAt: at(16),
  kind: 'rower',
  bout: { ...EMPTY_BOUT, durationSeconds: 480, distanceM: 2000 },
  bodyweightKg: 80,
};

const INPUT: ChartInput = {
  sets: [set(14, 100, 5), set(14, 100, 5), set(14, 40, 10, 'warmup'), set(16, 60, 10)],
  sessions: [session(14, 50), session(16, 30), session(16, 20)],
  bouts: [ROW],
};

function values(metric: (typeof CHART_METRICS)[number]): number[] {
  return chartBuckets(metric, WEEK, INPUT, NOW).map((bucket) => bucket.value);
}

describe('chartBuckets', () => {
  it('knows its six views', () => {
    expect(CHART_METRICS).toEqual(['volume', 'workouts', 'time', 'sets', 'cardio', 'calories']);
    expect(isChartMetric('sets')).toBe(true);
    expect(isChartMetric('reps')).toBe(false);
  });

  it('draws weight lifted as it always has, warm-ups left out', () => {
    expect(values('volume')).toEqual([1000, 0, 600, 0, 0, 0, 0]);
  });

  it('counts working sets', () => {
    expect(values('sets')).toEqual([2, 0, 1, 0, 0, 0, 0]);
  });

  it('counts workouts, two on one day included', () => {
    expect(values('workouts')).toEqual([1, 0, 2, 0, 0, 0, 0]);
  });

  it('adds up training minutes per day', () => {
    expect(values('time')).toEqual([50, 0, 50, 0, 0, 0, 0]);
  });

  it('adds up cardio minutes and calories', () => {
    expect(values('cardio')).toEqual([0, 0, 8, 0, 0, 0, 0]);
    // 2,000 m in 8:00 on a rower at 80 kg: 112 kcal (see cardio.test.ts).
    expect(values('calories')).toEqual([0, 0, 112, 0, 0, 0, 0]);
  });

  it('keeps the same columns, today in progress, whatever the view', () => {
    for (const metric of CHART_METRICS) {
      const buckets = chartBuckets(metric, WEEK, INPUT, NOW);
      expect(buckets.map((bucket) => bucket.key)[0]).toBe('2026-09-14');
      expect(buckets.filter((bucket) => bucket.inProgress).map((bucket) => bucket.key)).toEqual([
        '2026-09-16',
      ]);
    }
  });

  it('draws a column a month for all time', () => {
    const all = periodWindow('all', NOW, 1, new Date(2026, 6, 1));
    expect(chartBuckets('workouts', all, INPUT, NOW).at(-1)).toMatchObject({
      key: '2026-09',
      value: 3,
    });
  });
});
