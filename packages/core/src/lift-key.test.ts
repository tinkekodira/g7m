import { describe, expect, it } from 'vitest';
import {
  exerciseOfLiftKey,
  isGymDependent,
  latestScopeOnly,
  liftKey,
  sameLift,
} from './lift-key.js';

describe('liftKey', () => {
  it('is the exercise id for a lift compared everywhere', () => {
    expect(liftKey({ exerciseId: 'bench' })).toBe('bench');
    expect(liftKey({ exerciseId: 'bench', gymScope: null })).toBe('bench');
  });

  it('keeps one machine at two gyms apart', () => {
    const a = { exerciseId: 'pulldown', gymScope: 'gym-a' };
    const b = { exerciseId: 'pulldown', gymScope: 'gym-b' };
    expect(sameLift(a, b)).toBe(false);
    expect(sameLift(a, { ...a })).toBe(true);
    expect(exerciseOfLiftKey(liftKey(a))).toBe('pulldown');
    expect(exerciseOfLiftKey('bench')).toBe('bench');
  });
});

describe('isGymDependent', () => {
  it('is machines and cables only', () => {
    expect(isGymDependent('machine')).toBe(true);
    expect(isGymDependent('cable')).toBe(true);
    for (const other of ['barbell', 'dumbbell', 'bodyweight', 'bands', 'other', null, undefined])
      expect(isGymDependent(other)).toBe(false);
  });
});

describe('latestScopeOnly', () => {
  const day = (n: number) => new Date(2026, 10, n);
  it('keeps each exercise at the gym it was last done at', () => {
    const sets = [
      { exerciseId: 'pulldown', gymScope: 'a', performedAt: day(1) },
      { exerciseId: 'pulldown', gymScope: 'b', performedAt: day(2) },
      { exerciseId: 'pulldown', gymScope: 'a', performedAt: day(3) },
      { exerciseId: 'bench', gymScope: null, performedAt: day(2) },
    ];
    expect(latestScopeOnly(sets)).toEqual([sets[0], sets[2], sets[3]]);
  });
});
