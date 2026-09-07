import { describe, expect, it } from 'vitest';
import { bestsFrom, recordsInSession, NO_HISTORY, type IdentifiedSet } from './records.js';
import type { HistoricalSet } from './progress.js';

function past(over: Partial<HistoricalSet> = {}): HistoricalSet {
  return {
    sessionId: 'old',
    exerciseId: 'bench',
    performedAt: new Date('2026-08-01T10:00:00Z'),
    bodyweightKg: 80,
    setType: 'working',
    loadType: 'external',
    weightKg: 100,
    reps: 5,
    isCompleted: true,
    ...over,
  };
}

function today(over: Partial<IdentifiedSet> = {}): IdentifiedSet {
  return {
    id: 'set-1',
    setType: 'working',
    loadType: 'external',
    weightKg: 100,
    reps: 5,
    isCompleted: true,
    ...over,
  };
}

describe('bestsFrom', () => {
  it('finds the heaviest load and the best estimate', () => {
    const bests = bestsFrom([
      past({ weightKg: 100, reps: 5 }),
      past({ weightKg: 110, reps: 1 }),
      past({ weightKg: 90, reps: 10 }),
    ]);
    expect(bests.maxWeightKg).toBe(110);
    // 90 x 10 is Epley 120, above both a 110 single and 100 x 5.
    expect(bests.estimated1rmKg).toBe(120);
    expect(bests.hasHistory).toBe(true);
  });

  it('knows the difference between no history and no measurable history', () => {
    expect(bestsFrom([])).toEqual(NO_HISTORY);

    // Pull-ups logged on a session with no bodyweight snapshot. They happened;
    // how heavy they were is unknowable.
    const unmeasured = bestsFrom([past({ loadType: 'bodyweight', bodyweightKg: null })]);
    expect(unmeasured.hasHistory).toBe(true);
    expect(unmeasured.maxWeightKg).toBeNull();
  });

  it('ignores warm-ups and sets nobody finished', () => {
    const bests = bestsFrom([
      past({ weightKg: 60, reps: 5 }),
      past({ weightKg: 200, setType: 'warmup' }),
      past({ weightKg: 300, isCompleted: false }),
    ]);
    expect(bests.maxWeightKg).toBe(60);
  });

  it('measures a bodyweight lift against the session it was done in', () => {
    const bests = bestsFrom([
      past({ loadType: 'bodyweight_plus', weightKg: 20, bodyweightKg: 80, reps: 5 }),
    ]);
    expect(bests.maxWeightKg).toBe(100);
  });
});

describe('recordsInSession', () => {
  const bests = bestsFrom([past({ weightKg: 100, reps: 5 })]);

  function run(sets: readonly IdentifiedSet[], bodyweightKg: number | null = 80) {
    return recordsInSession({ sets, bodyweightKg, bests });
  }

  it('marks a heavier set as the heaviest yet', () => {
    const records = run([today({ id: 'a', weightKg: 105, reps: 3 })]);
    expect(records).toEqual([{ setId: 'a', kind: 'heaviest', value: 105, previous: 100 }]);
  });

  /**
   * Repeating a best is not beating it. A badge that appears every time
   * somebody matches their working weight stops meaning anything inside a
   * fortnight — the same rule `personalRecords` applies when it keeps the
   * earlier date on a tie.
   */
  it('does not call a tie a record', () => {
    expect(run([today({ weightKg: 100, reps: 5 })])).toEqual([]);
  });

  it('rewards more reps at the same weight as the best set yet', () => {
    const records = run([today({ id: 'a', weightKg: 100, reps: 6 })]);
    expect(records).toHaveLength(1);
    expect(records[0]?.kind).toBe('best_set');
    expect(records[0]?.previous).toBe(bests.estimated1rmKg);
  });

  /**
   * Two badges on one row is two claims about the same lift, and the heavier
   * one is the one anybody means.
   */
  it('says heaviest, not both, when a set is both', () => {
    const records = run([today({ id: 'a', weightKg: 120, reps: 6 })]);
    expect(records).toHaveLength(1);
    expect(records[0]?.kind).toBe('heaviest');
  });

  it('gives the record to the set that set it, not to every set after it', () => {
    const records = run([
      today({ id: 'a', weightKg: 105, reps: 3 }),
      today({ id: 'b', weightKg: 105, reps: 3 }),
    ]);
    expect(records.map((record) => record.setId)).toEqual(['a']);
  });

  it('lets a later set beat what the earlier one just set', () => {
    const records = run([
      today({ id: 'a', weightKg: 105, reps: 1 }),
      today({ id: 'b', weightKg: 110, reps: 1 }),
    ]);
    expect(records).toEqual([
      { setId: 'a', kind: 'heaviest', value: 105, previous: 100 },
      { setId: 'b', kind: 'heaviest', value: 110, previous: 105 },
    ]);
  });

  /**
   * The first time an exercise is logged, every set would otherwise be a
   * record — and a badge that appears for everybody on everything is a
   * decoration rather than an achievement.
   */
  it('is silent on an exercise that has never been trained', () => {
    const records = recordsInSession({
      sets: [today({ weightKg: 200, reps: 10 })],
      bodyweightKg: 80,
      bests: NO_HISTORY,
    });
    expect(records).toEqual([]);
  });

  /**
   * "Heaviest yet" against a past nobody can measure is a claim rather than a
   * fact, so the whole session stays silent rather than only its first set.
   */
  it('claims nothing when the past cannot be measured', () => {
    const unmeasured = bestsFrom([past({ loadType: 'bodyweight', bodyweightKg: null })]);
    const records = recordsInSession({
      sets: [
        today({ id: 'a', loadType: 'bodyweight', weightKg: 0, reps: 10 }),
        today({ id: 'b', loadType: 'bodyweight', weightKg: 0, reps: 12 }),
      ],
      bodyweightKg: 80,
      bests: unmeasured,
    });
    expect(records).toEqual([]);
  });

  it('claims nothing for a set whose own load cannot be measured', () => {
    // Bodyweight lift, session with no snapshot. Nothing to compare.
    expect(run([today({ loadType: 'bodyweight', weightKg: 0, reps: 20 })], null)).toEqual([]);
  });

  it('ignores warm-ups and sets nobody has finished yet', () => {
    const records = run([
      today({ id: 'a', weightKg: 140, setType: 'warmup' }),
      today({ id: 'b', weightKg: 150, isCompleted: false }),
    ]);
    expect(records).toEqual([]);
  });

  /**
   * Epley is not trusted past twelve. A set of twenty at a light weight has no
   * estimate at all, so it can only ever claim the load record.
   */
  it('falls back to the load alone when the estimate refuses to answer', () => {
    expect(run([today({ id: 'a', weightKg: 60, reps: 20 })])).toEqual([]);
    expect(run([today({ id: 'a', weightKg: 101, reps: 20 })])).toEqual([
      { setId: 'a', kind: 'heaviest', value: 101, previous: 100 },
    ]);
  });

  it('measures today against the session bodyweight, not the profile', () => {
    const records = recordsInSession({
      sets: [today({ id: 'a', loadType: 'bodyweight_plus', weightKg: 25, reps: 3 })],
      bodyweightKg: 80,
      bests,
    });
    expect(records[0]?.value).toBe(105);
  });

  it('has nothing to say about an empty session', () => {
    expect(run([])).toEqual([]);
  });
});
