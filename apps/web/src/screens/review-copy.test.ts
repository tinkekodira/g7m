import { describe, expect, it } from 'vitest';
import type { Observation } from '@g7m/core';
import { describeObservation } from './review-copy.js';

const ALL: Observation[] = [
  { kind: 'too_soon', sessions: 2, needed: 4 },
  { kind: 'consistency', perWeek: 1.8, target: 4, weeks: 5 },
  { kind: 'group_short', group: 'back', perWeek: 4, target: 16 },
  { kind: 'group_over', group: 'chest', perWeek: 28, target: 16 },
  {
    kind: 'lift_climbing',
    exerciseId: 'a',
    name: 'Barbell Bench Press',
    fromKg: 80,
    toKg: 90,
    sessions: 6,
  },
  { kind: 'lift_stalled', exerciseId: 'b', name: 'Back Squat', kg: 100, sessions: 5 },
  { kind: 'pace', verdict: 'on_track', perWeekKg: -0.6, goal: 'lose_fat' },
  { kind: 'pace', verdict: 'fast', perWeekKg: -1.4, goal: 'lose_fat' },
  { kind: 'pace', verdict: 'slow', perWeekKg: -0.1, goal: 'lose_fat' },
  { kind: 'pace', verdict: 'wrong_way', perWeekKg: 0.4, goal: 'lose_fat' },
];

describe('every observation gets a line', () => {
  it('has a heading and a detail for all of them', () => {
    for (const observation of ALL) {
      const line = describeObservation(observation, 'metric');
      expect(line.heading, observation.kind).not.toBe('');
      expect(line.detail, observation.kind).not.toBe('');
    }
  });

  it('puts the number in the sentence', () => {
    // A review without figures is a horoscope.
    for (const observation of ALL) {
      expect(describeObservation(observation, 'metric').detail, observation.kind).toMatch(/\d/);
    }
  });
});

describe('the register', () => {
  /**
   * ADR-0035's rule, carried forward. An app that tells somebody they are
   * doing well is one they stop believing the first time it says so on a bad
   * month.
   */
  it('never compliments and never scolds', () => {
    for (const observation of ALL) {
      const line = describeObservation(observation, 'metric');
      const text = `${line.heading} ${line.detail}`;
      expect(text, observation.kind).not.toMatch(
        /well done|great|amazing|keep it up|proud|lazy|failed|excuse|disappointing/i,
      );
    }
  });

  /**
   * The plan was built to fit the number the user gave. So when the two
   * disagree, changing the plan is as valid an answer as changing the week,
   * and the copy has to leave that door open.
   */
  it('offers changing the plan, not just trying harder', () => {
    const line = describeObservation(
      { kind: 'consistency', perWeek: 1.8, target: 4, weeks: 5 },
      'metric',
    );
    expect(line.detail).toMatch(/changing the number/i);
    expect(line.detail).not.toMatch(/should train more|need to train/i);
  });

  it('names what a fast cut costs rather than telling somebody off', () => {
    const line = describeObservation(
      { kind: 'pace', verdict: 'fast', perWeekKg: -1.4, goal: 'lose_fat' },
      'metric',
    );
    expect(line.detail).toMatch(/strength/i);
    expect(line.detail).not.toMatch(/too much|slow down|stop/i);
  });

  it('says what to do about a plateau, not just that there is one', () => {
    const line = describeObservation(
      { kind: 'lift_stalled', exerciseId: 'b', name: 'Back Squat', kg: 100, sessions: 5 },
      'metric',
    );
    expect(line.detail).toMatch(/ten percent|back(ing)? off/i);
  });
});

describe('units', () => {
  it('speaks pounds to an imperial user', () => {
    const line = describeObservation(
      { kind: 'lift_climbing', exerciseId: 'a', name: 'Bench', fromKg: 80, toKg: 90, sessions: 6 },
      'imperial',
    );
    expect(line.detail).toContain('lb');
    expect(line.detail).not.toContain('kg');
  });

  it('reports a loss as a size, not as a negative number', () => {
    // "−0.6 kg a week down" reads as arithmetic. The direction is in the words.
    const line = describeObservation(
      { kind: 'pace', verdict: 'wrong_way', perWeekKg: 0.4, goal: 'lose_fat' },
      'metric',
    );
    expect(line.detail).not.toContain('-0.4');
    expect(line.detail).toContain('0.4 kg');
  });
});

describe('muscle groups read as words', () => {
  it('does not print a slug at somebody', () => {
    const line = describeObservation(
      { kind: 'group_short', group: 'hamstrings', perWeek: 2, target: 16 },
      'metric',
    );
    expect(line.heading).toContain('hamstrings');
    expect(line.heading).not.toContain('-');
  });

  it('falls back to the slug rather than showing nothing', () => {
    const line = describeObservation(
      { kind: 'group_short', group: 'adductors', perWeek: 2, target: 16 },
      'metric',
    );
    expect(line.heading).toContain('adductors');
  });
});
