import { describe, expect, it } from 'vitest';
import type { LiftMark, RecapComparison } from '@g7m/core';
import { formatRecapWeight, recapChange } from './recap-change.js';

const mark = (
  weightKg: number,
  reps = 8,
  loadType: LiftMark['loadType'] = 'external',
): LiftMark => ({ weightKg, reps, loadType });
function change(
  current: LiftMark,
  previous: LiftMark | null,
  timed = false,
  units: 'metric' | 'imperial' = 'metric',
) {
  const comparison: RecapComparison = { exerciseId: 'lift', current, previous, timed, records: [] };
  return recapChange(comparison, units);
}

describe('recap change badges', () => {
  it('compares reps when weight is unchanged, including bodyweight', () => {
    expect(change(mark(30, 9), mark(30, 8))).toEqual({ label: '1 rep', direction: 1 });
    expect(change(mark(0, 6, 'bodyweight'), mark(0, 8, 'bodyweight'))).toEqual({
      label: '2 reps',
      direction: -1,
    });
    expect(change(mark(30), mark(30))).toEqual({ label: 'No change', direction: 0 });
  });
  it('treats less assistance as improvement and keeps the load meaning explicit', () => {
    expect(change(mark(20, 8, 'assisted'), mark(25, 8, 'assisted'))).toEqual({
      label: '5 kg less assistance',
      direction: 1,
    });
    expect(change(mark(30, 8, 'assisted'), mark(25, 8, 'assisted'))).toEqual({
      label: '5 kg more assistance',
      direction: -1,
    });
  });
  it('uses logged added load and converts to pounds', () => {
    expect(change(mark(22.5), mark(20))).toEqual({
      label: expect.stringMatching(/^2[.,]5 kg$/),
      direction: 1,
    });
    expect(formatRecapWeight(92.5, 'metric')).toMatch(/^92[.,]5 kg$/);
    expect(change(mark(20, 8, 'bodyweight_plus'), mark(15, 8, 'bodyweight_plus'))).toEqual({
      label: '5 kg',
      direction: 1,
    });
    expect(change(mark(25), mark(20), false, 'imperial')).toEqual({ label: '11 lb', direction: 1 });
    expect(change(mark(20), mark(25))).toEqual({ label: '5 kg', direction: -1 });
  });
  it('handles timed work, new lifts and load-type switches without a false weight gain', () => {
    expect(change(mark(0, 45), mark(0, 30), true)).toEqual({ label: '15 sec', direction: 1 });
    expect(change(mark(20), null)).toEqual({ label: 'First session', direction: 0 });
    expect(change(mark(20), mark(20, 8, 'assisted'))).toEqual({
      label: 'Load changed',
      direction: 0,
    });
  });
});
