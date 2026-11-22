import { describe, expect, it } from 'vitest';
import {
  MAX_SET_REPS,
  MAX_SET_WEIGHT_KG,
  canComplete,
  clampSetReps,
  clampSetWeightKg,
  doubtAboutSet,
  type SetToCheck,
} from './set-sanity.js';

const bench = (over: Partial<SetToCheck>): SetToCheck => ({
  weightKg: 100,
  reps: 5,
  loadType: 'external',
  isTimeBased: false,
  bestKg: 100,
  ...over,
});

describe('clampSetWeightKg', () => {
  it('keeps an ordinary weight to two decimals', () => {
    expect(clampSetWeightKg(102.5)).toBe(102.5);
    expect(clampSetWeightKg(33.333)).toBe(33.33);
  });

  it('never goes past what the server stores', () => {
    // 10000 overflowed numeric(6,2): the upload was refused for good and the
    // server's older value synced back over the one typed.
    expect(clampSetWeightKg(10_000)).toBe(MAX_SET_WEIGHT_KG);
    expect(clampSetWeightKg(9999)).toBe(MAX_SET_WEIGHT_KG);
  });

  it('turns nonsense into zero', () => {
    expect(clampSetWeightKg(-5)).toBe(0);
    expect(clampSetWeightKg(Number.NaN)).toBe(0);
    expect(clampSetWeightKg(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe('clampSetReps', () => {
  it('keeps whole reps and caps them', () => {
    expect(clampSetReps(8.9)).toBe(8);
    expect(clampSetReps(2 ** 40)).toBe(MAX_SET_REPS);
    expect(clampSetReps(-1)).toBe(0);
    expect(clampSetReps(Number.NaN)).toBe(0);
  });
});

describe('canComplete', () => {
  it('refuses a set of nothing', () => {
    expect(canComplete(0)).toBe(false);
    expect(canComplete(0.5)).toBe(false);
    expect(canComplete(1)).toBe(true);
  });
});

describe('doubtAboutSet', () => {
  it('lets ordinary progress through without a word', () => {
    expect(doubtAboutSet(bench({ weightKg: 105 }))).toBeNull();
    expect(doubtAboutSet(bench({ weightKg: 150 }))).toBeNull();
  });

  it('asks about a slipped zero', () => {
    expect(doubtAboutSet(bench({ weightKg: 1000 }))).toEqual({
      kind: 'jump',
      weightKg: 1000,
      bestKg: 100,
    });
  });

  it('does not nag about a big jump on a light lift', () => {
    // 8 kg to 14 kg is 75% heavier and an ordinary dumbbell step.
    expect(doubtAboutSet(bench({ weightKg: 14, bestKg: 8 }))).toBeNull();
  });

  it('asks about an unheard-of weight with no history', () => {
    expect(doubtAboutSet(bench({ weightKg: 500, bestKg: null }))).toEqual({
      kind: 'heavy',
      weightKg: 500,
    });
    expect(doubtAboutSet(bench({ weightKg: 300, bestKg: null }))).toBeNull();
  });

  it('never weighs assistance or bodyweight against a best', () => {
    expect(doubtAboutSet(bench({ loadType: 'assisted', weightKg: 900 }))).toBeNull();
    expect(doubtAboutSet(bench({ loadType: 'bodyweight', weightKg: 0, bestKg: null }))).toBeNull();
  });

  it('asks about a hundred-odd reps, but not about a long hold', () => {
    expect(doubtAboutSet(bench({ reps: 101 }))).toEqual({ kind: 'reps', reps: 101 });
    expect(doubtAboutSet(bench({ reps: 100 }))).toBeNull();
    expect(doubtAboutSet(bench({ reps: 300, isTimeBased: true }))).toBeNull();
  });

  it('asks about the weight before the reps', () => {
    expect(doubtAboutSet(bench({ weightKg: 9999, reps: 999 }))?.kind).toBe('jump');
  });
});
