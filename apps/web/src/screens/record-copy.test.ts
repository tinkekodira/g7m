import { describe, expect, it } from 'vitest';
import type { SetRecord } from '@g7m/core';
import { describeRecord } from './record-copy.js';

const heaviest: SetRecord = { setId: 'a', kind: 'heaviest', value: 105, previous: 100 };
const bestSet: SetRecord = { setId: 'a', kind: 'best_set', value: 116.67, previous: 112.5 };

describe('describeRecord', () => {
  it('names the lift and the gap it closed', () => {
    const line = describeRecord(heaviest, 'Barbell Bench Press', 'metric');
    expect(line.badge).toBe('PR');
    expect(line.short).toBe('Heaviest yet');
    expect(line.headline).toBe('Heaviest barbell bench press yet');
    expect(line.detail).toBe('105 kg — 5 kg over your old best.');
  });

  it('says an estimate is an estimate', () => {
    const line = describeRecord(bestSet, 'Barbell Bench Press', 'metric');
    expect(line.short).toBe('Best set yet');
    expect(line.headline).toBe('Best barbell bench press set yet');
    expect(line.detail).toBe('Estimated max 116.67 kg, up from 112.5 kg.');
  });

  /**
   * The difference on screen has to be the difference between the two numbers
   * on screen. Converting the kilogram delta gives an honest figure that
   * visibly fails to add up: 231.5 lb from a 220.5 lb best is 11 lb, not the
   * 11.02 lb that 5 kg converts to.
   */
  it('does its arithmetic in the units it prints', () => {
    const line = describeRecord(heaviest, 'Squat', 'imperial');
    expect(line.detail).toBe('231.5 lb — 11 lb over your old best.');
  });

  it('does not print trailing zeroes at somebody', () => {
    const line = describeRecord(
      { setId: 'a', kind: 'heaviest', value: 102.5, previous: 100 },
      'Squat',
      'metric',
    );
    expect(line.detail).toBe('102.5 kg — 2.5 kg over your old best.');
  });

  /**
   * The short form sits beside "Set 3" on a card already titled with the
   * exercise. Repeating the name there reads as a bug.
   */
  it('keeps the set-row form free of the exercise name', () => {
    for (const record of [heaviest, bestSet]) {
      expect(describeRecord(record, 'Barbell Bench Press', 'metric').short).not.toContain('bench');
    }
  });

  it('never comes back empty, whatever the numbers are', () => {
    for (const record of [heaviest, bestSet]) {
      for (const units of ['metric', 'imperial'] as const) {
        const line = describeRecord(record, 'Pull-Up', units);
        expect(line.short, units).not.toBe('');
        expect(line.headline, units).not.toBe('');
        expect(line.detail, units).not.toBe('');
      }
    }
  });
});
