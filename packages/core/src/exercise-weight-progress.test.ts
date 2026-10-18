import { describe, expect, it } from 'vitest';
import { exerciseWeightProgress } from './exercise-weight-progress.js';
import type { HistoricalSet } from './progress.js';

function set(overrides: Partial<HistoricalSet> = {}): HistoricalSet {
  return {
    exerciseId: 'bench',
    sessionId: 'one',
    performedAt: new Date('2026-10-01T10:00:00Z'),
    bodyweightKg: null,
    loadType: 'external',
    weightKg: 60,
    reps: 8,
    setType: 'working',
    isCompleted: true,
    ...overrides,
  };
}

describe('exerciseWeightProgress', () => {
  it('leaves unlogged exercises empty and ignores warm-ups, unticked sets and zero reps', () => {
    expect(exerciseWeightProgress([]).size).toBe(0);
    expect(
      exerciseWeightProgress([
        set({ setType: 'warmup' }),
        set({ isCompleted: false }),
        set({ reps: 0 }),
      ]).size,
    ).toBe(0);
  });

  it('selects one heaviest working set per exercise and session, including repeated slots', () => {
    const result = exerciseWeightProgress([
      set({ weightKg: 100, setType: 'warmup' }),
      set({ weightKg: 500, isCompleted: false }),
      set({ weightKg: 65 }),
      set({ weightKg: 75, setType: 'failure' }),
      set({ weightKg: 50, setType: 'dropset' }),
      set({ weightKg: 70, setType: 'amrap' }),
      set({ exerciseId: 'squat', weightKg: 90 }),
    ]);
    expect(result.get('bench')?.map((p) => p.weightKg)).toEqual([75]);
    expect(result.get('squat')?.map((p) => p.weightKg)).toEqual([90]);
  });

  it('takes six workouts for each exercise, sorting by performance date, not insertion order', () => {
    const sets = Array.from({ length: 8 }, (_, i) =>
      set({
        sessionId: String(i),
        performedAt: new Date(`2026-10-0${String(i + 1)}T10:00:00Z`),
        weightKg: 50 + i * 5,
      }),
    ).reverse();
    const result = exerciseWeightProgress([...sets, set({ exerciseId: 'squat' })]);
    expect(result.get('bench')?.map((p) => p.weightKg)).toEqual([60, 65, 70, 75, 80, 85]);
    expect(result.get('squat')).toHaveLength(1);
  });

  it('keeps separate same-day workouts and orders timestamp ties consistently', () => {
    const result = exerciseWeightProgress([set({ sessionId: 'b' }), set({ sessionId: 'a' })]);
    expect(result.get('bench')?.map((p) => p.sessionId)).toEqual(['a', 'b']);
  });

  it('keeps bodyweight flat regardless of weigh-ins, and plots added plates only', () => {
    const result = exerciseWeightProgress([
      set({ sessionId: 'a', loadType: 'bodyweight', bodyweightKg: null }),
      set({ sessionId: 'b', loadType: 'bodyweight', bodyweightKg: 90 }),
      set({ sessionId: 'c', loadType: 'bodyweight_plus', weightKg: 10, bodyweightKg: 80 }),
      set({ sessionId: 'c', loadType: 'bodyweight', weightKg: 0 }),
    ]).get('bench');
    expect(result?.map((p) => p.weightKg)).toEqual([0, 0, 10]);
    expect(result?.at(-1)?.loadType).toBe('bodyweight_plus');
  });

  it('selects the least assistance and rises toward bodyweight as assistance decreases', () => {
    const result = exerciseWeightProgress([
      set({ sessionId: 'a', loadType: 'assisted', weightKg: 30 }),
      set({ sessionId: 'a', loadType: 'assisted', weightKg: 40 }),
      set({ sessionId: 'b', loadType: 'assisted', weightKg: 20 }),
      set({ sessionId: 'c', loadType: 'bodyweight', weightKg: 0 }),
    ]).get('bench');
    expect(result?.map((p) => p.weightKg)).toEqual([-30, -20, 0]);
  });

  it('retains real zero loads and single or flat series', () => {
    expect(exerciseWeightProgress([set({ weightKg: 0 })]).get('bench')?.[0]?.weightKg).toBe(0);
    expect(
      exerciseWeightProgress([set(), set({ sessionId: 'two' })])
        .get('bench')
        ?.map((p) => p.weightKg),
    ).toEqual([60, 60]);
  });

  it('rejects corrupt numeric values and dates before they reach SVG geometry', () => {
    expect(
      exerciseWeightProgress([
        set({ weightKg: NaN }),
        set({ weightKg: Infinity }),
        set({ weightKg: -1 }),
        set({ reps: NaN }),
        set({ reps: -1 }),
        set({ performedAt: new Date('invalid') }),
      ]).size,
    ).toBe(0);
  });
});
