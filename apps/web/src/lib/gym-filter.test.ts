import { describe, expect, it } from 'vitest';
import type { HistoricalSet } from '@g7m/core';
import { scopesIn, setsAtGym } from './gym-filter.js';

const set = (day: number, gymScope: string | null): HistoricalSet => ({
  sessionId: `s${String(day)}`,
  exerciseId: 'pulldown',
  performedAt: new Date(2026, 10, day),
  bodyweightKg: null,
  gymScope,
  setType: 'working',
  loadType: 'external',
  weightKg: 90,
  reps: 8,
  isCompleted: true,
});

describe('gym filter', () => {
  it('lists gyms most recent first and keeps one gym’s sets', () => {
    const sets = [set(1, 'a'), set(2, 'b'), set(3, 'a')];
    expect(scopesIn(sets)).toEqual(['a', 'b']);
    expect(setsAtGym(sets, 'b')).toEqual([sets[1]]);
  });

  it('leaves a lift compared everywhere whole', () => {
    const sets = [set(1, null), set(2, null)];
    expect(scopesIn(sets)).toEqual([]);
    expect(setsAtGym(sets, null)).toEqual(sets);
  });
});
