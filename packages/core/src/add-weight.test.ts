import { describe, expect, it } from 'vitest';
import { repsThatEarnMoreWeight, weightAdvice } from './add-weight.js';
import type { LoadType, LoggedSet, SetType } from './load.js';

function set(
  reps: number,
  overrides: Partial<LoggedSet> & { readonly loadType?: LoadType; readonly setType?: SetType } = {},
): LoggedSet {
  return {
    setType: 'working',
    loadType: 'external',
    weightKg: 14,
    reps,
    isCompleted: true,
    ...overrides,
  };
}

const STEP = { repHigh: 12, stepKg: 2 };

describe('when the weight is ready to go up', () => {
  it('speaks after the last set hits the top of the range', () => {
    expect(weightAdvice({ sets: [set(12), set(12)], ...STEP })).toEqual({
      weightKg: 14,
      nextKg: 16,
      reps: 12,
    });
  });

  it('says nothing while the exercise is still going', () => {
    expect(weightAdvice({ sets: [set(12), set(12, { isCompleted: false })], ...STEP })).toBeNull();
  });

  /** The last set is the one that decides; a big first set is finding the weight. */
  it('reads the last set, not the best one', () => {
    expect(weightAdvice({ sets: [set(15), set(6)], ...STEP })).toBeNull();
    expect(weightAdvice({ sets: [set(6), set(15)], ...STEP })?.reps).toBe(15);
  });

  it('never suggests more below ten reps, whatever the range says', () => {
    expect(repsThatEarnMoreWeight(5)).toBe(10);
    expect(repsThatEarnMoreWeight(null)).toBe(10);
    // A range that tops out at 15 waits for 15.
    expect(repsThatEarnMoreWeight(15)).toBe(15);
    expect(weightAdvice({ sets: [set(7)], repHigh: 5, stepKg: 2.5 })).toBeNull();
    expect(weightAdvice({ sets: [set(10)], repHigh: 5, stepKg: 2.5 })).toMatchObject({
      nextKg: 16.5,
    });
    expect(weightAdvice({ sets: [set(12)], repHigh: 15, stepKg: 2 })).toBeNull();
  });

  it('ignores warm-ups, on both sides of the question', () => {
    const sets = [set(20, { setType: 'warmup', weightKg: 6 }), set(12)];
    expect(weightAdvice({ sets, ...STEP })?.weightKg).toBe(14);
    // A warm-up alone is not an exercise anybody has finished.
    expect(weightAdvice({ sets: [sets[0] ?? set(20)], ...STEP })).toBeNull();
  });

  it('says nothing where more weight is not the advice', () => {
    // Push-ups: there is no weight to add.
    expect(
      weightAdvice({ sets: [set(20, { loadType: 'bodyweight', weightKg: 0 })], ...STEP }),
    ).toBeNull();
    // Assisted: more weight means less work, which would be backwards.
    expect(weightAdvice({ sets: [set(15, { loadType: 'assisted' })], ...STEP })).toBeNull();
    expect(weightAdvice({ sets: [set(12, { weightKg: 0 })], ...STEP })).toBeNull();
    expect(weightAdvice({ sets: [], ...STEP })).toBeNull();
    expect(weightAdvice({ sets: [set(12)], repHigh: 12, stepKg: 0 })).toBeNull();
  });

  it('rounds the suggestion to something a rack has', () => {
    expect(
      weightAdvice({ sets: [set(12, { weightKg: 12.5 })], repHigh: 12, stepKg: 2.5 })?.nextKg,
    ).toBe(15);
  });
});
