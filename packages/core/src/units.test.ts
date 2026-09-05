import { describe, expect, it } from 'vitest';
import {
  DEFAULT_INCREMENT_KG,
  KG_PER_LB,
  fromDisplayWeight,
  incrementKgFor,
  kgToLb,
  lbToKg,
  roundToIncrement,
  toDisplayWeight,
} from './units.js';

describe('KG_PER_LB', () => {
  it('is the exact international definition, not an approximation', () => {
    expect(KG_PER_LB).toBe(0.45359237);
  });
});

describe('kgToLb / lbToKg', () => {
  it('converts the canonical plate weights', () => {
    expect(kgToLb(100)).toBeCloseTo(220.462, 3);
    expect(kgToLb(20)).toBeCloseTo(44.0925, 4);
    expect(lbToKg(45)).toBeCloseTo(20.4117, 4);
    expect(lbToKg(225)).toBeCloseTo(102.058, 3);
  });

  it('round-trips without drift', () => {
    for (const kg of [0, 2.5, 60, 82.5, 140.75, 999.99]) {
      expect(lbToKg(kgToLb(kg))).toBeCloseTo(kg, 10);
    }
  });

  it('maps zero to zero', () => {
    expect(kgToLb(0)).toBe(0);
    expect(lbToKg(0)).toBe(0);
  });
});

describe('roundToIncrement', () => {
  it('snaps to the nearest step', () => {
    expect(roundToIncrement(81.3, 2.5)).toBe(82.5);
    expect(roundToIncrement(81.2, 2.5)).toBe(80);
    expect(roundToIncrement(0.4, 2.5)).toBe(0);
    expect(roundToIncrement(103.7, 5)).toBe(105);
  });

  it('rounds halfway cases up, consistently', () => {
    expect(roundToIncrement(81.25, 2.5)).toBe(82.5);
    expect(roundToIncrement(1.25, 2.5)).toBe(2.5);
  });

  it('handles microplate increments without float noise', () => {
    expect(roundToIncrement(60.62, 1.25)).toBe(60); // 48.496 steps -> 48
    expect(roundToIncrement(0.3, 0.25)).toBe(0.25);
  });

  it('is a no-op on values already on the grid', () => {
    expect(roundToIncrement(100, 2.5)).toBe(100);
    expect(roundToIncrement(97.5, 2.5)).toBe(97.5);
  });

  it('preserves sign for negative values', () => {
    expect(roundToIncrement(-81.3, 2.5)).toBe(-82.5); // -32.52 steps -> -33
  });

  it('throws rather than returning NaN for a non-positive increment', () => {
    expect(() => roundToIncrement(100, 0)).toThrow(RangeError);
    expect(() => roundToIncrement(100, -2.5)).toThrow(RangeError);
    expect(() => roundToIncrement(100, Number.NaN)).toThrow(RangeError);
    expect(() => roundToIncrement(100, Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});

describe('toDisplayWeight', () => {
  it('passes kilograms through at storage precision for metric users', () => {
    expect(toDisplayWeight(82.5, 'metric')).toEqual({ value: 82.5, unit: 'kg' });
    expect(toDisplayWeight(82.499, 'metric')).toEqual({ value: 82.5, unit: 'kg' });
  });

  it('converts to pounds at one decimal for imperial users', () => {
    expect(toDisplayWeight(100, 'imperial')).toEqual({ value: 220.5, unit: 'lb' });
    expect(toDisplayWeight(20.4117, 'imperial')).toEqual({ value: 45, unit: 'lb' });
  });
});

describe('fromDisplayWeight', () => {
  it('stores metric input unchanged, at storage precision', () => {
    expect(fromDisplayWeight(82.5, 'metric')).toBe(82.5);
    expect(fromDisplayWeight(82.567, 'metric')).toBe(82.57);
  });

  it('converts imperial input into kilograms', () => {
    expect(fromDisplayWeight(225, 'imperial')).toBe(102.06);
    expect(fromDisplayWeight(45, 'imperial')).toBe(20.41);
  });

  it('survives a display round-trip within storage precision', () => {
    const stored = 102.06;
    const shown = toDisplayWeight(stored, 'imperial');
    expect(fromDisplayWeight(shown.value, 'imperial')).toBeCloseTo(stored, 1);
  });
});

describe('incrementKgFor', () => {
  it('is 2.5 kg for metric', () => {
    expect(incrementKgFor('metric')).toBe(DEFAULT_INCREMENT_KG);
  });

  it('is 5 lb expressed in kilograms for imperial', () => {
    expect(incrementKgFor('imperial')).toBeCloseTo(2.268, 4);
  });
});
