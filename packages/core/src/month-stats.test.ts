import { describe, expect, it } from 'vitest';
import {
  BODY_REGIONS,
  activityInsight,
  durationInsight,
  monthRecords,
  monthStats,
  monthStatsSince,
  musclesInsight,
  percentChange,
  recordsInsight,
  regionOf,
  workoutsInsight,
  type MonthStats,
} from './month-stats.js';
import type { SessionTimes } from './periods.js';
import type { HistoricalSet } from './progress.js';

/** Local time, so these test the code and not the machine's timezone. */
function local(year: number, month: number, day: number, hour = 12, minute = 0): Date {
  return new Date(year, month - 1, day, hour, minute);
}

/** A workout of `minutes` starting at `at`, first set to last. */
function session(at: Date, minutes = 45): SessionTimes {
  return {
    startedAt: at,
    firstSetAt: at,
    lastSetAt: new Date(at.getTime() + minutes * 60_000),
  };
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

const GROUPS = new Map<string, readonly string[]>([
  ['bench', ['chest']],
  ['squat', ['quads', 'glutes']],
  ['row', ['back']],
  ['press', ['shoulders']],
  ['curl', ['biceps']],
  ['dip', ['chest', 'triceps']],
  ['plank', ['core']],
]);

// Tuesday 13 October 2026, the middle of the afternoon.
const NOW = local(2026, 10, 13, 15);

function stats(
  sessions: readonly SessionTimes[],
  sets: readonly HistoricalSet[] = [],
  now = NOW,
): MonthStats {
  return monthStats({ sessions, sets, groupsByExercise: GROUPS, now });
}

describe('monthStats', () => {
  it('reads from the start of last month', () => {
    expect(monthStatsSince(NOW)).toEqual(local(2026, 9, 1, 0));
    expect(monthStatsSince(local(2026, 1, 5))).toEqual(local(2025, 12, 1, 0));
  });

  it('compares this month with last month up to the same day, not all of it', () => {
    const result = stats([
      session(local(2026, 10, 2)),
      session(local(2026, 10, 9)),
      session(local(2026, 9, 3)),
      session(local(2026, 9, 13, 20)), // the 13th still counts, all of it
      session(local(2026, 9, 14, 7)), // the 14th is after "the same day"
      session(local(2026, 9, 28)),
    ]);

    expect(result.workouts).toEqual({ current: 2, previous: 2 });
    expect(result.previousTotal).toBe(4);
  });

  it('compares the 31st with all of a shorter month and none of this one', () => {
    const now = local(2026, 12, 31, 9);
    const result = stats([session(local(2026, 11, 30)), session(local(2026, 12, 1, 8))], [], now);

    expect(result.daysInPreviousMonth).toBe(30);
    expect(result.workouts).toEqual({ current: 1, previous: 1 });
  });

  it('draws a running total per day, to today this month and the whole of last', () => {
    const result = stats([
      session(local(2026, 10, 1)),
      session(local(2026, 10, 1, 18)),
      session(local(2026, 10, 5)),
      session(local(2026, 9, 30)),
    ]);

    expect(result.cumulative).toHaveLength(13);
    expect(result.cumulative.slice(0, 6)).toEqual([2, 2, 2, 2, 3, 3]);
    expect(result.cumulative.at(-1)).toBe(3);
    expect(result.previousCumulative).toHaveLength(30);
    expect(result.previousCumulative.at(-1)).toBe(1);
  });

  it('adds up training time and volume on each side', () => {
    const result = stats(
      [session(local(2026, 10, 2), 50), session(local(2026, 9, 2), 30)],
      [
        set({ performedAt: local(2026, 10, 2), weightKg: 100, reps: 5 }),
        set({ performedAt: local(2026, 10, 2), weightKg: 60, reps: 10, setType: 'dropset' }),
        set({ performedAt: local(2026, 10, 2), weightKg: 40, reps: 10, setType: 'warmup' }),
        set({ performedAt: local(2026, 9, 2), weightKg: 80, reps: 5 }),
      ],
    );

    expect(result.minutes).toEqual({ current: 50, previous: 30 });
    // The drop is volume; the warm-up is not.
    expect(result.volumeKg).toEqual({ current: 1100, previous: 400 });
    // The drop is not a set of its own.
    expect(result.sets).toEqual({ current: 1, previous: 1 });
  });

  it('counts a week at least, so two workouts on the 2nd are not seven a week', () => {
    const now = local(2026, 10, 2, 20);
    const result = stats([session(local(2026, 10, 1)), session(local(2026, 10, 2))], [], now);
    expect(result.perWeek.current).toBe(2);

    expect(stats([session(local(2026, 10, 1)), session(local(2026, 10, 8))]).perWeek.current).toBe(
      1.1,
    );
  });

  it('splits a set between the regions its exercise trains, so the ring adds up', () => {
    const result = stats(
      [],
      [
        set({ exerciseId: 'squat', performedAt: local(2026, 10, 2) }), // legs twice, counted once
        set({ exerciseId: 'dip', performedAt: local(2026, 10, 2) }), // chest and arms, half each
        set({ exerciseId: 'bench', performedAt: local(2026, 10, 2) }),
        set({ exerciseId: 'row', performedAt: local(2026, 10, 2) }),
      ],
    );

    expect(result.regionSets).toBe(4);
    expect(result.regions.map((r) => [r.region, r.sets])).toEqual([
      ['legs', 1],
      ['arms', 0.5],
      ['back', 1],
      ['chest', 1.5],
    ]);
    expect(result.regions.reduce((sum, r) => sum + r.share, 0)).toBeCloseTo(1);
  });

  it('keeps the regions in ring order, whatever order they were trained in', () => {
    const result = stats(
      [],
      [
        set({ exerciseId: 'plank', performedAt: local(2026, 10, 2) }),
        set({ exerciseId: 'bench', performedAt: local(2026, 10, 3) }),
        set({ exerciseId: 'squat', performedAt: local(2026, 10, 4) }),
      ],
    );
    expect(result.regions.map((r) => r.region)).toEqual(['legs', 'chest', 'core']);
  });

  it('knows how long since each region, reaching back into last month', () => {
    const result = stats(
      [],
      [
        set({ exerciseId: 'squat', performedAt: local(2026, 9, 20) }),
        set({ exerciseId: 'bench', performedAt: local(2026, 10, 12) }),
      ],
    );
    expect(result.daysSince.legs).toBe(23);
    expect(result.daysSince.chest).toBe(1);
    expect(result.daysSince.back).toBeNull();
    expect(result.historyDays).toBe(23);
  });

  it('maps every catalogue group to a region', () => {
    const groups = [
      'chest',
      'back',
      'shoulders',
      'biceps',
      'triceps',
      'forearms',
      'core',
      'quads',
      'hamstrings',
      'glutes',
      'calves',
      'adductors',
      'traps',
      'neck',
    ];
    for (const group of groups) expect(BODY_REGIONS).toContain(regionOf(group));
    expect(regionOf('tail')).toBeNull();
  });
});

describe('workoutsInsight', () => {
  it('waits for a first workout when there is nothing at all', () => {
    expect(workoutsInsight(stats([]))).toEqual({ kind: 'start' });
  });

  it('points at last month when this one has not started', () => {
    expect(workoutsInsight(stats([session(local(2026, 9, 20))]))).toEqual({
      kind: 'not_yet',
      previousTotal: 1,
    });
  });

  it('has nothing to compare in a first month', () => {
    expect(workoutsInsight(stats([session(local(2026, 10, 2))]))).toEqual({
      kind: 'first_month',
      workouts: 1,
    });
  });

  it('is ahead, level or behind against the same day last month', () => {
    const lastMonth = [session(local(2026, 9, 2)), session(local(2026, 9, 25))];
    expect(
      workoutsInsight(
        stats([...lastMonth, session(local(2026, 10, 2)), session(local(2026, 10, 3))]),
      ),
    ).toEqual({ kind: 'ahead', by: 1 });
    expect(workoutsInsight(stats([...lastMonth, session(local(2026, 10, 2))]))).toEqual({
      kind: 'level',
      workouts: 1,
    });
    expect(
      workoutsInsight(
        stats([
          session(local(2026, 9, 2)),
          session(local(2026, 9, 5)),
          session(local(2026, 9, 9)),
          session(local(2026, 10, 2)),
        ]),
      ),
    ).toEqual({ kind: 'behind', by: 2 });
  });
});

describe('musclesInsight', () => {
  const day = (n: number): Date => local(2026, 10, n);

  it('says nothing about balance before there is anything to balance', () => {
    expect(musclesInsight(stats([]))).toEqual({ kind: 'none' });
    expect(musclesInsight(stats([], [set({ exerciseId: 'bench', performedAt: day(12) })]))).toEqual(
      { kind: 'early', sets: 1 },
    );
  });

  it('does not call a region missed for somebody who only started this week', () => {
    const sets = Array.from({ length: 10 }, () =>
      set({ exerciseId: 'bench', performedAt: day(11) }),
    );
    expect(musclesInsight(stats([], sets)).kind).not.toBe('neglected');
  });

  it('names the longest-missed major region once two weeks have gone by', () => {
    const result = musclesInsight(
      stats(
        [],
        [
          set({ exerciseId: 'squat', performedAt: local(2026, 9, 20) }),
          set({ exerciseId: 'row', performedAt: local(2026, 9, 2) }),
          set({ exerciseId: 'bench', performedAt: day(12) }),
          set({ exerciseId: 'press', performedAt: day(12) }),
        ],
      ),
    );
    expect(result).toEqual({ kind: 'neglected', region: 'back', days: 41, atLeast: false });
  });

  it('says "at least" for a region the history read never saw', () => {
    const result = musclesInsight(
      stats(
        [],
        [
          set({ exerciseId: 'squat', performedAt: local(2026, 9, 2) }),
          set({ exerciseId: 'bench', performedAt: day(12) }),
          set({ exerciseId: 'press', performedAt: day(12) }),
          set({ exerciseId: 'squat', performedAt: day(12) }),
        ],
      ),
    );
    // Back is the one never seen, and the history goes back 41 days.
    expect(result).toEqual({ kind: 'neglected', region: 'back', days: 41, atLeast: true });
  });

  it('calls out one region taking half the work', () => {
    const sets = [
      ...Array.from({ length: 8 }, () => set({ exerciseId: 'bench', performedAt: day(12) })),
      set({ exerciseId: 'squat', performedAt: day(12) }),
      set({ exerciseId: 'row', performedAt: day(12) }),
      set({ exerciseId: 'press', performedAt: day(12) }),
    ];
    expect(musclesInsight(stats([], sets))).toMatchObject({ kind: 'lopsided', region: 'chest' });
  });

  it('does not call a squat, bench and deadlift program lopsided at half legs', () => {
    const groups = new Map<string, readonly string[]>([
      ['bench', ['chest']],
      ['squat', ['quads', 'glutes']],
      ['deadlift', ['hamstrings', 'back']],
    ]);
    const sets = (['bench', 'squat', 'deadlift'] as const).flatMap((exerciseId) =>
      Array.from({ length: 3 }, () => set({ exerciseId, performedAt: day(12) })),
    );
    const stats = monthStats({ sessions: [], sets, groupsByExercise: groups, now: NOW });
    expect(stats.regions.find((share) => share.region === 'legs')?.share).toBeCloseTo(0.5);
    expect(musclesInsight(stats)).toEqual({ kind: 'focused', regions: ['legs', 'chest'] });
  });

  it('is balanced when every major region has a fair share', () => {
    const sets = (['bench', 'squat', 'row', 'press'] as const).flatMap((exerciseId) =>
      Array.from({ length: 3 }, () => set({ exerciseId, performedAt: day(12) })),
    );
    expect(musclesInsight(stats([], sets))).toEqual({ kind: 'balanced' });
  });
});

describe('activityInsight', () => {
  it('is quiet with no workouts this month', () => {
    expect(activityInsight(stats([]))).toEqual({ kind: 'quiet' });
  });

  it('leads with lifting more, when the workouts kept up', () => {
    const result = activityInsight(
      stats(
        [session(local(2026, 9, 2)), session(local(2026, 10, 2))],
        [
          set({ performedAt: local(2026, 9, 2), weightKg: 100 }),
          set({ performedAt: local(2026, 10, 2), weightKg: 120 }),
        ],
      ),
    );
    expect(result).toEqual({ kind: 'stronger', percent: 20 });
  });

  it('is consistent at two or more a week, keeping pace with last month', () => {
    const sessions = [2, 4, 6, 8, 10].map((n) => session(local(2026, 10, n)));
    expect(activityInsight(stats(sessions))).toEqual({ kind: 'consistent', perWeek: 2.7 });
  });

  it('says how many to catch up when behind', () => {
    const result = activityInsight(
      stats([
        session(local(2026, 9, 2)),
        session(local(2026, 9, 4)),
        session(local(2026, 9, 6)),
        session(local(2026, 10, 2)),
      ]),
    );
    expect(result).toEqual({ kind: 'catch_up', by: 2 });
  });
});

describe('percentChange', () => {
  it('has no percentage against nothing', () => {
    expect(percentChange(5, 0)).toBeNull();
    expect(percentChange(12, 10)).toBe(20);
    expect(percentChange(8, 10)).toBe(-20);
  });
});

describe('duration', () => {
  it('adds each day’s training minutes, and counts only workouts long enough to time', () => {
    const untimed: SessionTimes = {
      startedAt: local(2026, 10, 3),
      firstSetAt: local(2026, 10, 3),
      lastSetAt: local(2026, 10, 3),
    };
    const result = stats([
      session(local(2026, 10, 2), 50),
      session(local(2026, 10, 2, 18), 20),
      untimed,
      session(local(2026, 9, 2), 40),
    ]);

    expect(result.dailyMinutes).toHaveLength(31);
    expect(result.dailyMinutes.slice(0, 3)).toEqual([0, 70, 0]);
    expect(result.timed).toEqual({ current: 2, previous: 1 });
    expect(durationInsight(result)).toEqual({ kind: 'average', minutes: 35, previous: 40 });
  });

  it('has no average without a timed workout, and no comparison without one last month', () => {
    expect(durationInsight(stats([]))).toEqual({ kind: 'none' });
    expect(durationInsight(stats([session(local(2026, 10, 2), 45)]))).toEqual({
      kind: 'average',
      minutes: 45,
      previous: null,
    });
  });
});

describe('monthRecords', () => {
  const history = [
    set({ exerciseId: 'bench', performedAt: local(2026, 8, 20), weightKg: 100 }),
    set({ exerciseId: 'bench', performedAt: local(2026, 10, 5), weightKg: 105 }),
    set({ exerciseId: 'row', performedAt: local(2026, 9, 10), weightKg: 80 }),
    set({ exerciseId: 'row', performedAt: local(2026, 10, 6), weightKg: 88 }),
    set({ exerciseId: 'squat', performedAt: local(2026, 9, 1), weightKg: 140 }),
    set({ exerciseId: 'squat', performedAt: local(2026, 10, 7), weightKg: 135 }),
    set({ exerciseId: 'curl', performedAt: local(2026, 10, 8), weightKg: 30 }),
    set({ exerciseId: 'plank', performedAt: local(2026, 10, 8), weightKg: 20 }),
    // A warm-up heavier than anything is still not a record.
    set({ exerciseId: 'curl', performedAt: local(2026, 10, 9), weightKg: 60, setType: 'warmup' }),
  ];

  it('measures this month against every set before the 1st, biggest jump first', () => {
    const records = monthRecords(history, NOW, new Set(['plank']));

    expect(records.newBests).toBe(2);
    expect(records.lifts.map((lift) => [lift.exerciseId, lift.isRecord])).toEqual([
      ['row', true], // +10%
      ['bench', true], // +5%
      ['squat', false],
      ['curl', false], // first time: a start, not a record
    ]);
    expect(records.lifts.find((lift) => lift.exerciseId === 'curl')).toMatchObject({
      bestKg: 30,
      previousKg: null,
    });
  });

  it('names the biggest new best, a near miss, or that the bests still stand', () => {
    expect(recordsInsight(monthRecords(history, NOW))).toEqual({
      kind: 'new',
      count: 2,
      exerciseId: 'row',
    });

    const nearMiss = history.filter((entry) => !['bench', 'row'].includes(entry.exerciseId));
    expect(recordsInsight(monthRecords(nearMiss, NOW))).toEqual({
      kind: 'close',
      exerciseId: 'squat',
      shortKg: 5,
    });

    const farOff = [
      set({ exerciseId: 'squat', performedAt: local(2026, 9, 1), weightKg: 140 }),
      set({ exerciseId: 'squat', performedAt: local(2026, 10, 7), weightKg: 120 }),
    ];
    expect(recordsInsight(monthRecords(farOff, NOW))).toEqual({ kind: 'holding' });
    expect(recordsInsight(monthRecords([], NOW))).toEqual({ kind: 'none' });

    const firsts = [set({ exerciseId: 'curl', performedAt: local(2026, 10, 8), weightKg: 30 })];
    expect(recordsInsight(monthRecords(firsts, NOW))).toEqual({ kind: 'first', count: 1 });
  });
});
