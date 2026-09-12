import { describe, expect, it } from 'vitest';
import type { LiftMark, Link, Observation } from '@g7m/core';
import { describeLink, describeMark, describeObservation } from './review-copy.js';

const kg = (value: number): string => `${String(value)} kg`;
const bar = (weightKg: number, reps: number): LiftMark => ({
  loadType: 'external',
  weightKg,
  reps,
});
const reps = (count: number): LiftMark => ({ loadType: 'bodyweight', weightKg: 0, reps: count });

const STALLED_SQUAT: Observation = {
  kind: 'lift_stalled',
  exerciseId: 'b',
  name: 'Back Squat',
  best: bar(100, 5),
  timed: false,
  sessionsSince: 3,
  daysSince: 24,
};

const STALLED_PULLUP: Observation = {
  kind: 'lift_stalled',
  exerciseId: 'p',
  name: 'Pull-up',
  best: reps(10),
  timed: false,
  sessionsSince: 3,
  daysSince: 28,
};

const ALL: Observation[] = [
  { kind: 'too_soon', sessions: 2, needed: 4, days: 3, neededDays: 12 },
  { kind: 'consistency', perWeek: 1.8, target: 4, weeks: 5 },
  { kind: 'group_short', group: 'back', perWeek: 4, target: 16 },
  { kind: 'group_over', group: 'chest', perWeek: 28, target: 16 },
  {
    kind: 'lift_climbing',
    exerciseId: 'a',
    name: 'Barbell Bench Press',
    from: bar(80, 8),
    to: bar(90, 8),
    timed: false,
    sessions: 6,
  },
  STALLED_SQUAT,
  STALLED_PULLUP,
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
    const line = describeObservation(STALLED_SQUAT, 'metric');
    expect(line.detail).toMatch(/ten percent|back(ing)? off/i);
  });

  /**
   * The plan never adjusts a bodyweight movement — it prescribes no load for
   * one — so promising it will back one off is a promise nothing keeps.
   */
  it('does not promise the plan will fix a bodyweight plateau', () => {
    const line = describeObservation(STALLED_PULLUP, 'metric');
    expect(line.detail).not.toMatch(/ten percent|plan will do/i);
    expect(line.detail).toMatch(/yours to adjust/i);
  });
});

describe('what a lift did, in the terms of the lift', () => {
  it('says a set the way a lifter says it', () => {
    expect(describeMark(bar(100, 5), false, kg)).toBe('100 kg × 5');
    expect(describeMark(reps(12), false, kg)).toBe('12 reps');
    expect(describeMark(reps(1), false, kg)).toBe('1 rep');
    expect(describeMark({ loadType: 'bodyweight_plus', weightKg: 10, reps: 6 }, false, kg)).toBe(
      '+10 kg × 6',
    );
    expect(describeMark({ loadType: 'bodyweight_plus', weightKg: 0, reps: 8 }, false, kg)).toBe(
      '8 reps',
    );
    expect(describeMark({ loadType: 'assisted', weightKg: 20, reps: 8 }, false, kg)).toBe(
      '8 reps with 20 kg of help',
    );
  });

  it('says a timed hold in seconds', () => {
    expect(describeMark(reps(60), true, kg)).toBe('60 s');
    expect(describeMark(bar(20, 45), true, kg)).toBe('20 kg for 45 s');
  });

  /** The reported bug: more reps at the same weight read as "has not moved". */
  it('shows progress that was all in the reps', () => {
    const line = describeObservation(
      {
        kind: 'lift_climbing',
        exerciseId: 'a',
        name: 'Barbell Bench Press',
        from: bar(80, 6),
        to: bar(80, 10),
        timed: false,
        sessions: 4,
      },
      'metric',
    );
    expect(line.heading).toBe('Your barbell bench press is going up');
    expect(line.detail).toContain('80 kg × 6 to 80 kg × 10 across 4 sessions');
  });

  /** "Still 82 kg" about a pull-up was a sentence about the scale. */
  it('never describes a bodyweight movement by the lifter’s weight', () => {
    const line = describeObservation(STALLED_PULLUP, 'metric');
    expect(line.detail).toContain('Your best lately is still 10 reps, from 4 weeks ago');
    expect(line.detail).not.toMatch(/\d kg/);
  });

  it('says how long a best has stood, and how many sessions have tried it', () => {
    expect(describeObservation(STALLED_SQUAT, 'metric').detail).toContain(
      'Your best lately is still 100 kg × 5, from 3 weeks ago, and the 3 sessions since have not beaten it.',
    );
  });
});

describe('joined-up lines about a lift', () => {
  const programming = (best: LiftMark): Link => ({
    kind: 'stall_is_programming',
    name: 'Back Squat',
    best,
    timed: false,
    sessionsSince: 3,
  });

  it('points a barbell plateau at the back-off the plan will do', () => {
    const line = describeLink(programming(bar(100, 5)), 'metric');
    expect(line.detail).toContain('Your best lately is still 100 kg × 5 after 3 more sessions');
    expect(line.detail).toMatch(/ten percent/);
  });

  it('leaves a bodyweight plateau to the lifter, and says so', () => {
    const line = describeLink(programming(reps(10)), 'metric');
    expect(line.detail).not.toMatch(/ten percent/);
    expect(line.detail).toMatch(/change is yours/);
  });

  it('describes a stall in a deficit by the set, not by a weight', () => {
    const line = describeLink(
      {
        kind: 'stall_from_deficit',
        name: 'Pull-up',
        best: reps(10),
        timed: false,
        perWeekKg: -0.6,
        goal: 'lose_fat',
      },
      'metric',
    );
    expect(line.detail).toContain(
      'Your best lately is still 10 reps, while you are losing 0.6 kg a week',
    );
  });

  it('confirms progress in the lift’s own terms', () => {
    const line = describeLink(
      {
        kind: 'progress_confirmed',
        name: 'Pull-up',
        from: reps(6),
        to: reps(11),
        timed: false,
        perWeekKg: 0.3,
      },
      'metric',
    );
    expect(line.detail).toContain('Your pull-up went 6 reps to 11 reps');
  });
});

describe('units', () => {
  it('speaks pounds to an imperial user', () => {
    const line = describeObservation(
      {
        kind: 'lift_climbing',
        exerciseId: 'a',
        name: 'Bench',
        from: bar(80, 8),
        to: bar(90, 8),
        timed: false,
        sessions: 6,
      },
      'imperial',
    );
    expect(line.detail).toContain('176.4 lb × 8 to 198.4 lb × 8');
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

  /** It read "your glutes is behind" to everybody whose glutes were. */
  it('agrees with a plural group', () => {
    const plural = describeObservation(
      { kind: 'group_short', group: 'glutes', perWeek: 0, target: 16 },
      'metric',
    );
    expect(plural.heading).toBe('Your glutes are behind');
    const singular = describeObservation(
      { kind: 'group_short', group: 'chest', perWeek: 0, target: 16 },
      'metric',
    );
    expect(singular.heading).toBe('Your chest is behind');
  });

  it('falls back to the slug rather than showing nothing', () => {
    const line = describeObservation(
      { kind: 'group_short', group: 'adductors', perWeek: 2, target: 16 },
      'metric',
    );
    expect(line.heading).toContain('adductors');
  });
});

describe('saying which threshold is short', () => {
  const early = (sessions: number, days: number): Observation => ({
    kind: 'too_soon',
    sessions,
    needed: 4,
    days,
    neededDays: 12,
  });

  it('asks for sessions while there are too few', () => {
    expect(describeObservation(early(2, 3), 'metric').detail).toContain('2 of 4 sessions');
  });

  /**
   * The reported bug. Enough sessions, too few days, and the old copy printed
   * "10 of 4 sessions logged" — which reads as a counter that cannot count.
   */
  it('never reports more sessions than it asked for', () => {
    const line = describeObservation(early(10, 5), 'metric');
    expect(line.detail).not.toContain('10 of 4');
    expect(line.detail).toContain('10 sessions over 5 days');
  });

  it('says how long is left rather than only that it is too soon', () => {
    expect(describeObservation(early(10, 5), 'metric').detail).toContain('in 7 days');
    expect(describeObservation(early(10, 11), 'metric').detail).toContain('tomorrow');
  });

  it('asks for sessions first when both are short', () => {
    // Four days and two sessions: "log a few more" is the one somebody can act
    // on today, and a date is not.
    expect(describeObservation(early(2, 4), 'metric').detail).toContain('2 of 4 sessions');
  });

  it('does not say "1 days"', () => {
    expect(describeObservation(early(5, 1), 'metric').detail).toContain('over 1 day.');
  });
});
