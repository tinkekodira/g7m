import { describe, expect, it } from 'vitest';
import {
  RECORD_TYPES,
  exerciseTrend,
  personalRecords,
  relativeVolume,
  volumeByMuscle,
  weeklyVolume,
  type HistoricalSet,
  type MuscleShare,
} from './progress.js';
import { recentWeeks } from './week.js';

function local(year: number, month: number, day: number, hour = 12): Date {
  return new Date(year, month - 1, day, hour);
}

function set(over: Partial<HistoricalSet> = {}): HistoricalSet {
  return {
    sessionId: 's1',
    exerciseId: 'bench',
    performedAt: local(2026, 9, 7),
    bodyweightKg: 80,
    setType: 'working',
    loadType: 'external',
    weightKg: 100,
    reps: 5,
    isCompleted: true,
    ...over,
  };
}

describe('volumeByMuscle', () => {
  const shares = new Map<string, MuscleShare[]>([
    [
      'bench',
      [
        { muscleId: 'chest', recruitmentWeight: 1 },
        { muscleId: 'triceps', recruitmentWeight: 0.5 },
      ],
    ],
  ]);

  /**
   * A bench press is not 100% chest. Attributing it that way makes the heat
   * map say the triceps are never trained, which is wrong in a way that
   * changes what somebody does next.
   */
  it('splits a set across the muscles that did it', () => {
    const totals = volumeByMuscle([set({ weightKg: 100, reps: 5 })], shares);
    expect(totals.get('chest')).toBe(500);
    expect(totals.get('triceps')).toBe(250);
  });

  it('adds across sets and sessions', () => {
    const totals = volumeByMuscle(
      [set({ weightKg: 100, reps: 5 }), set({ sessionId: 's2', weightKg: 100, reps: 5 })],
      shares,
    );
    expect(totals.get('chest')).toBe(1000);
  });

  it('ignores warm-ups and sets that were never done', () => {
    const totals = volumeByMuscle(
      [set({ setType: 'warmup' }), set({ isCompleted: false })],
      shares,
    );
    expect(totals.size).toBe(0);
  });

  it('counts bodyweight work, which is the whole point of load types', () => {
    const totals = volumeByMuscle(
      [set({ exerciseId: 'pushup', loadType: 'bodyweight', weightKg: 0, reps: 10 })],
      new Map([['pushup', [{ muscleId: 'chest', recruitmentWeight: 1 }]]]),
    );
    expect(totals.get('chest')).toBe(800);
  });

  it('skips a set whose load cannot be worked out', () => {
    const totals = volumeByMuscle(
      [set({ loadType: 'bodyweight', weightKg: 0, bodyweightKg: null })],
      shares,
    );
    expect(totals.size).toBe(0);
  });

  it('ignores an exercise with no muscle mapping rather than guessing', () => {
    expect(volumeByMuscle([set({ exerciseId: 'mystery' })], shares).size).toBe(0);
  });

  it('ignores a zero or negative recruitment weight', () => {
    const totals = volumeByMuscle(
      [set()],
      new Map([['bench', [{ muscleId: 'chest', recruitmentWeight: 0 }]]]),
    );
    expect(totals.size).toBe(0);
  });
});

describe('relativeVolume', () => {
  /**
   * Absolute kilograms cannot be coloured: a leg session and an arm session
   * are an order of magnitude apart, so a fixed scale shows one uniformly hot
   * and the other uniformly cold.
   */
  it('scales against the hardest-worked muscle', () => {
    const relative = relativeVolume(
      new Map([
        ['quads', 4000],
        ['chest', 1000],
        ['triceps', 500],
      ]),
    );
    expect(relative.get('quads')).toBe(1);
    expect(relative.get('chest')).toBe(0.25);
    expect(relative.get('triceps')).toBe(0.125);
  });

  it('is empty rather than full of NaN when nothing has been trained', () => {
    expect(relativeVolume(new Map())).toEqual(new Map());
    expect(relativeVolume(new Map([['chest', 0]]))).toEqual(new Map());
  });
});

describe('weeklyVolume', () => {
  const weeks = recentWeeks(local(2026, 9, 10), 3);

  it('buckets sets into the week they were performed in', () => {
    const result = weeklyVolume(
      [
        set({ performedAt: local(2026, 9, 8), weightKg: 100, reps: 5 }),
        set({ sessionId: 's2', performedAt: local(2026, 9, 1), weightKg: 100, reps: 5 }),
      ],
      weeks,
    );
    expect(result.map((w) => w.volumeKg)).toEqual([0, 500, 500]);
  });

  /**
   * A week with no training is the most informative point on the chart.
   * Deriving the axis from the data would delete it.
   */
  it('keeps empty weeks', () => {
    const result = weeklyVolume([], weeks);
    expect(result).toHaveLength(3);
    expect(result.every((w) => w.volumeKg === 0 && w.sessions === 0)).toBe(true);
  });

  it('counts distinct sessions, not sets', () => {
    const result = weeklyVolume(
      [
        set({ performedAt: local(2026, 9, 8) }),
        set({ performedAt: local(2026, 9, 8) }),
        set({ sessionId: 's2', performedAt: local(2026, 9, 9) }),
      ],
      weeks,
    );
    expect(result.at(-1)?.sessions).toBe(2);
    expect(result.at(-1)?.sets).toBe(3);
  });

  it('drops sets outside the window without complaining', () => {
    // The caller owns the axis; data older than it is not an error.
    const result = weeklyVolume([set({ performedAt: local(2025, 1, 1) })], weeks);
    expect(result.every((w) => w.sets === 0)).toBe(true);
  });

  it('does not count warm-ups toward the weekly set count', () => {
    const result = weeklyVolume(
      [set({ performedAt: local(2026, 9, 8), setType: 'warmup' })],
      weeks,
    );
    expect(result.at(-1)?.sets).toBe(0);
  });
});

describe('exerciseTrend', () => {
  /**
   * A point per set is a scatter of warm-ups and back-offs with the line
   * hidden inside it. The top set is what a lifter remembers doing.
   */
  it('is one point per session, at the top set', () => {
    const points = exerciseTrend([
      set({ sessionId: 's1', weightKg: 80, reps: 8 }),
      set({ sessionId: 's1', weightKg: 100, reps: 5 }),
      set({ sessionId: 's1', weightKg: 90, reps: 6 }),
    ]);
    expect(points).toHaveLength(1);
    expect(points[0]?.topSetKg).toBe(100);
    expect(points[0]?.reps).toBe(5);
  });

  it('is sorted oldest first, whatever order the query returned', () => {
    const points = exerciseTrend([
      set({ sessionId: 'late', performedAt: local(2026, 9, 10) }),
      set({ sessionId: 'early', performedAt: local(2026, 9, 1) }),
    ]);
    expect(points.map((p) => p.sessionId)).toEqual(['early', 'late']);
  });

  it('estimates a 1RM from the best qualifying set', () => {
    const points = exerciseTrend([
      set({ weightKg: 100, reps: 5 }),
      set({ weightKg: 120, reps: 1 }),
    ]);
    // A single rep is its own 1RM; Epley on 100×5 is 116.67.
    expect(points[0]?.estimatedOneRepMax?.valueKg).toBe(120);
  });

  it('has no estimate when nothing in the session qualifies', () => {
    // Twenty reps says more about conditioning than strength, so Epley is
    // deliberately not applied — and the trend has to cope with that.
    const points = exerciseTrend([set({ weightKg: 60, reps: 20 })]);
    expect(points[0]?.estimatedOneRepMax).toBeNull();
    expect(points[0]?.topSetKg).toBe(60);
  });

  it('uses the effective load, so a weighted pull-up is not a 20 kg lift', () => {
    const points = exerciseTrend([
      set({ loadType: 'bodyweight_plus', weightKg: 20, reps: 5, bodyweightKg: 80 }),
    ]);
    expect(points[0]?.topSetKg).toBe(100);
  });

  it('ignores warm-ups and unfinished sets entirely', () => {
    expect(exerciseTrend([set({ setType: 'warmup' }), set({ isCompleted: false })])).toEqual([]);
  });
});

describe('personalRecords', () => {
  it('finds the heaviest load and the best estimate', () => {
    const records = personalRecords([
      set({ performedAt: local(2026, 9, 1), weightKg: 100, reps: 5 }),
      set({ sessionId: 's2', performedAt: local(2026, 9, 8), weightKg: 110, reps: 3 }),
    ]);

    const maxWeight = records.find((r) => r.recordType === 'max_weight');
    expect(maxWeight?.value).toBe(110);
    expect(maxWeight?.achievedAt).toEqual(local(2026, 9, 8));

    const oneRepMax = records.find((r) => r.recordType === 'estimated_1rm');
    expect(oneRepMax?.formula).toBe('epley');
    expect(oneRepMax?.value).toBeGreaterThan(110);
  });

  /**
   * The record was set the first time it was hit. A screen that says "new PR"
   * every time somebody matches their best stops meaning anything inside a
   * fortnight.
   */
  it('keeps the earlier date when a best is matched, not beaten', () => {
    const records = personalRecords([
      set({ performedAt: local(2026, 9, 1), weightKg: 100, reps: 5 }),
      set({ sessionId: 's2', performedAt: local(2026, 9, 8), weightKg: 100, reps: 5 }),
    ]);
    expect(records.find((r) => r.recordType === 'max_weight')?.achievedAt).toEqual(
      local(2026, 9, 1),
    );
  });

  it('tracks the best single-exercise session volume', () => {
    const records = personalRecords([
      set({ sessionId: 's1', performedAt: local(2026, 9, 1), weightKg: 100, reps: 5 }),
      set({ sessionId: 's1', performedAt: local(2026, 9, 1), weightKg: 100, reps: 5 }),
      set({ sessionId: 's2', performedAt: local(2026, 9, 8), weightKg: 100, reps: 5 }),
    ]);
    expect(records.find((r) => r.recordType === 'max_session_volume')?.value).toBe(1000);
  });

  it('keeps records per exercise, not pooled', () => {
    const records = personalRecords([
      set({ exerciseId: 'bench', weightKg: 100 }),
      set({ exerciseId: 'squat', weightKg: 140 }),
    ]);
    const byExercise = new Map(
      records.filter((r) => r.recordType === 'max_weight').map((r) => [r.exerciseId, r.value]),
    );
    expect(byExercise.get('bench')).toBe(100);
    expect(byExercise.get('squat')).toBe(140);
  });

  it('sets a formula only on the estimate, matching the CHECK in Postgres', () => {
    // `(record_type = 'estimated_1rm') = (formula is not null)`. A row that
    // breaks it is refused on upload and lost.
    for (const record of personalRecords([set()])) {
      expect(record.formula === null, record.recordType).toBe(
        record.recordType !== 'estimated_1rm',
      );
    }
  });

  it('counts bodyweight work, which would otherwise never set a record', () => {
    const records = personalRecords([
      set({ exerciseId: 'pullup', loadType: 'bodyweight', weightKg: 0, reps: 8 }),
    ]);
    expect(records.find((r) => r.recordType === 'max_weight')?.value).toBe(80);
  });

  it('has nothing to say about warm-ups or an empty history', () => {
    expect(personalRecords([])).toEqual([]);
    expect(personalRecords([set({ setType: 'warmup' })])).toEqual([]);
  });

  /**
   * The schema allows `max_reps_at_weight` and nothing computes it: the table
   * stores one `value` with nowhere to put the weight, so the record would
   * rank twenty reps at 20 kg above five at 100.
   */
  it('does not claim a record type it cannot store correctly', () => {
    expect(RECORD_TYPES).not.toContain('max_reps_at_weight');
    for (const record of personalRecords([set()])) {
      expect(RECORD_TYPES).toContain(record.recordType);
    }
  });
});
