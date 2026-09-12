import { describe, expect, it } from 'vitest';
import { CHANGEOVER_SECONDS, SECONDS_PER_SET, estimateSessionMinutes } from './estimate.js';

describe('estimateSessionMinutes', () => {
  it('adds the sets, the rests between them and the changeovers', () => {
    // Five exercises of three sets, 150 s rests: 5 × (3 × 40 + 2 × 150) = 2100 s,
    // plus four changeovers of 90 s = 2460 s, which is 41 minutes.
    const plan = Array.from({ length: 5 }, () => ({ sets: 3, restSeconds: 150 }));
    expect(estimateSessionMinutes(plan)).toBe(40);
  });

  it('has no rest after the last set of an exercise, only the changeover', () => {
    const one = estimateSessionMinutes([{ sets: 1, restSeconds: 600 }]);
    // One set is forty seconds, which rounds up to the five-minute floor.
    expect(one).toBe(5);
    expect(SECONDS_PER_SET).toBeLessThan(300);
    expect(CHANGEOVER_SECONDS).toBeGreaterThan(0);
  });

  it('grows with longer rests, as a strength day should', () => {
    const heavy = Array.from({ length: 4 }, () => ({ sets: 4, restSeconds: 210 }));
    const light = Array.from({ length: 4 }, () => ({ sets: 4, restSeconds: 90 }));
    expect(estimateSessionMinutes(heavy)).toBeGreaterThan(estimateSessionMinutes(light) ?? 0);
  });

  it('rounds to five minutes, because it is an estimate', () => {
    const minutes = estimateSessionMinutes([{ sets: 20, restSeconds: 120 }]);
    expect((minutes ?? 1) % 5).toBe(0);
  });

  it('has nothing to say about an empty plan, or one with no sets', () => {
    expect(estimateSessionMinutes([])).toBeNull();
    expect(estimateSessionMinutes([{ sets: 0, restSeconds: 120 }])).toBeNull();
  });

  it('shrugs off numbers that are not numbers', () => {
    expect(
      estimateSessionMinutes([
        { sets: Number.NaN, restSeconds: 120 },
        { sets: 3, restSeconds: Number.NaN },
      ]),
    ).toBe(5);
  });
});
