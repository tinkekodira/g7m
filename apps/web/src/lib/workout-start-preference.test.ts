import { afterEach, describe, expect, it, vi } from 'vitest';
import { readWorkoutStartOptions, saveWorkoutStartOptions } from './workout-start-preference.js';

afterEach(() => vi.unstubAllGlobals());

describe('workout start preference', () => {
  it('shows the chooser for missing or invalid preferences', () => {
    vi.stubGlobal('localStorage', { getItem: () => null });
    expect(readWorkoutStartOptions('missing')).toBe(true);
    vi.stubGlobal('localStorage', { getItem: () => 'invalid' });
    expect(readWorkoutStartOptions('invalid')).toBe(true);
    vi.stubGlobal('localStorage', { getItem: () => 'false' });
    expect(readWorkoutStartOptions('saved')).toBe(false);
  });

  it('persists changes per account and lets settings restore the chooser', () => {
    const stored = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: (key: string, value: string) => stored.set(key, value),
    });
    saveWorkoutStartOptions('first', false);
    expect(stored.get('g7m.workout-start-options.first')).toBe('false');
    expect(readWorkoutStartOptions('first')).toBe(false);
    expect(readWorkoutStartOptions('second')).toBe(true);
    saveWorkoutStartOptions('first', true);
    expect(readWorkoutStartOptions('first')).toBe(true);
    expect(stored.get('g7m.workout-start-options.first')).toBe('true');
  });

  it('keeps an account-scoped in-memory fallback when storage throws', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('unavailable');
      },
      setItem: () => {
        throw new Error('unavailable');
      },
    });
    expect(readWorkoutStartOptions('blocked')).toBe(true);
    expect(() => saveWorkoutStartOptions('blocked', false)).not.toThrow();
    expect(readWorkoutStartOptions('blocked')).toBe(false);
    expect(readWorkoutStartOptions('other-blocked')).toBe(true);
    saveWorkoutStartOptions('blocked', true);
    expect(readWorkoutStartOptions('blocked')).toBe(true);
  });
});
