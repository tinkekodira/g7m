import { describe, expect, it } from 'vitest';
import {
  CURRENT_1RM_FORMULA,
  MAX_REPS_FOR_1RM_ESTIMATE,
  bestOneRepMax,
  estimateOneRepMax,
} from './one-rep-max.js';

describe('estimateOneRepMax', () => {
  it('applies Epley: w x (1 + reps/30)', () => {
    // 100 kg x 5 -> 100 * (1 + 5/30) = 116.666... -> 116.67
    expect(estimateOneRepMax(100, 5)?.valueKg).toBe(116.67);
    // 80 kg x 8 -> 80 * (1 + 8/30) = 101.333... -> 101.33
    expect(estimateOneRepMax(80, 8)?.valueKg).toBe(101.33);
    // 60 kg x 10 -> 60 * (1 + 10/30) = 80
    expect(estimateOneRepMax(60, 10)?.valueKg).toBe(80);
  });

  it('treats a single rep as the max itself, not 3.3% above it', () => {
    // Epley would say 103.33 and hand the lifter a PR they never hit.
    expect(estimateOneRepMax(100, 1)?.valueKg).toBe(100);
    expect(estimateOneRepMax(142.5, 1)?.valueKg).toBe(142.5);
  });

  it('records the formula and the source set on every estimate', () => {
    expect(estimateOneRepMax(100, 5)).toEqual({
      valueKg: 116.67,
      formula: CURRENT_1RM_FORMULA,
      sourceWeightKg: 100,
      sourceReps: 5,
    });
  });

  it('estimates up to and including the rep cap', () => {
    expect(estimateOneRepMax(60, MAX_REPS_FOR_1RM_ESTIMATE)).not.toBeNull();
  });

  it('returns null past the rep cap rather than a meaningless number', () => {
    expect(estimateOneRepMax(60, MAX_REPS_FOR_1RM_ESTIMATE + 1)).toBeNull();
    expect(estimateOneRepMax(40, 20)).toBeNull();
    expect(estimateOneRepMax(20, 100)).toBeNull();
  });

  it('returns null for non-positive load, so bodyweight sets do not fake a PR', () => {
    expect(estimateOneRepMax(0, 8)).toBeNull();
    expect(estimateOneRepMax(-50, 5)).toBeNull();
  });

  it('returns null for rep counts that are not whole positive numbers', () => {
    expect(estimateOneRepMax(100, 0)).toBeNull();
    expect(estimateOneRepMax(100, -3)).toBeNull();
    expect(estimateOneRepMax(100, 5.5)).toBeNull();
  });

  it('returns null for non-finite input', () => {
    expect(estimateOneRepMax(Number.NaN, 5)).toBeNull();
    expect(estimateOneRepMax(100, Number.NaN)).toBeNull();
    expect(estimateOneRepMax(Number.POSITIVE_INFINITY, 5)).toBeNull();
    expect(estimateOneRepMax(100, Number.POSITIVE_INFINITY)).toBeNull();
  });

  it('rounds to storage precision', () => {
    const estimate = estimateOneRepMax(102.5, 7);
    expect(estimate?.valueKg).toBe(126.42);
  });
});

describe('bestOneRepMax', () => {
  it('returns null for an empty set list', () => {
    expect(bestOneRepMax([])).toBeNull();
  });

  it('returns null when no set qualifies', () => {
    expect(
      bestOneRepMax([
        { weightKg: 0, reps: 20 },
        { weightKg: 40, reps: 25 },
      ]),
    ).toBeNull();
  });

  it('picks the highest estimate, not the heaviest set', () => {
    // 100x5 -> 116.67 beats 110x2 -> 117.33? No: 110x2 = 117.33 wins.
    const best = bestOneRepMax([
      { weightKg: 100, reps: 5 },
      { weightKg: 110, reps: 2 },
      { weightKg: 120, reps: 1 },
    ]);
    expect(best?.valueKg).toBe(120);
    expect(best?.sourceWeightKg).toBe(120);
    expect(best?.sourceReps).toBe(1);
  });

  it('ignores disqualified sets mixed in with valid ones', () => {
    const best = bestOneRepMax([
      { weightKg: 60, reps: 30 },
      { weightKg: 100, reps: 5 },
      { weightKg: 0, reps: 5 },
    ]);
    expect(best?.valueKg).toBe(116.67);
  });
});
