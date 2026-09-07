import { describe, expect, it } from 'vitest';
import { TRAINING_GOALS } from './goals.js';
import {
  FOCUS_GROUPS,
  FOCUS_LABELS,
  SESSION_FOCUSES,
  nextFocus,
  prescriptionFor,
  splitFor,
} from './programming.js';

describe('prescriptionFor', () => {
  it('answers for every goal', () => {
    for (const goal of TRAINING_GOALS) {
      const prescription = prescriptionFor(goal, 'intermediate');
      expect(prescription.repLow).toBeGreaterThan(0);
      expect(prescription.repHigh).toBeGreaterThan(prescription.repLow);
      expect(prescription.weeklySetsPerGroup).toBeGreaterThan(0);
    }
  });

  it('puts strength in a low rep range with long rests', () => {
    const strength = prescriptionFor('get_stronger', 'intermediate');
    expect(strength.repHigh).toBeLessThanOrEqual(6);
    expect(strength.restSeconds).toBeGreaterThanOrEqual(180);
  });

  it('gives hypertrophy the most weekly work of the four', () => {
    const volumes = TRAINING_GOALS.map((goal) => prescriptionFor(goal, 'intermediate'));
    const most = Math.max(...volumes.map((entry) => entry.weeklySetsPerGroup));
    expect(prescriptionFor('build_muscle', 'intermediate').weeklySetsPerGroup).toBe(most);
  });

  /**
   * The direction surprises people who assume beginners should work hardest.
   * A beginner adapts to almost anything, gets more from practising the
   * movement than from the tenth set, and is the person most likely to be hurt
   * by volume they cannot yet recover from.
   */
  it('prescribes a beginner less than an advanced lifter', () => {
    const beginner = prescriptionFor('build_muscle', 'beginner');
    const advanced = prescriptionFor('build_muscle', 'advanced');
    expect(beginner.weeklySetsPerGroup).toBeLessThan(advanced.weeklySetsPerGroup);
    expect(beginner.maxSetsPerSession).toBeLessThan(advanced.maxSetsPerSession);
  });

  it('treats an unknown experience level as a beginner', () => {
    // The cautious direction. Prescribing an advanced load to somebody the app
    // knows nothing about is how a first session becomes an injury.
    expect(prescriptionFor('build_muscle', null)).toEqual(
      prescriptionFor('build_muscle', 'beginner'),
    );
  });

  /**
   * Not zero for any goal. Training to failure on every set costs more
   * recovery than the extra rep buys.
   */
  it('always leaves a rep in the tank', () => {
    for (const goal of TRAINING_GOALS) {
      expect(prescriptionFor(goal, 'intermediate').repsInReserve).toBeGreaterThan(0);
    }
  });

  it('keeps a cut heavy while cutting the volume', () => {
    const cut = prescriptionFor('lose_fat', 'intermediate');
    const bulk = prescriptionFor('build_muscle', 'intermediate');
    // Less work, but not lighter work — the loads are what keep the muscle.
    expect(cut.weeklySetsPerGroup).toBeLessThan(bulk.weeklySetsPerGroup);
    expect(cut.repHigh).toBeLessThanOrEqual(bulk.repHigh);
  });
});

describe('splitFor', () => {
  it('gives one session per training day', () => {
    for (let days = 1; days <= 7; days++) {
      expect(splitFor(days, 'intermediate')).toHaveLength(days);
    }
  });

  /**
   * Splitting three days into push/pull/legs trains each muscle once a week,
   * and once a week is the least productive frequency there is.
   */
  it('keeps three days as full body rather than a three-way split', () => {
    expect(splitFor(3, 'intermediate').every((focus) => focus === 'full_body')).toBe(true);
  });

  it('makes an exception for an advanced lifter on three days', () => {
    // They can generate enough fatigue in one session that training everything
    // three times a week stops fitting inside the recovery.
    expect([...splitFor(3, 'advanced')]).toEqual(['push', 'pull', 'legs']);
  });

  it('trains everything twice on four days', () => {
    expect([...splitFor(4, 'intermediate')]).toEqual(['upper', 'lower', 'upper', 'lower']);
  });

  it('runs push/pull/legs twice on six', () => {
    expect([...splitFor(6, 'intermediate')]).toEqual([
      'push',
      'pull',
      'legs',
      'push',
      'pull',
      'legs',
    ]);
  });

  it('clamps nonsense rather than returning nothing', () => {
    expect(splitFor(0, 'intermediate')).toHaveLength(1);
    expect(splitFor(99, 'intermediate')).toHaveLength(7);
  });
});

describe('nextFocus', () => {
  it('walks the split in order', () => {
    const split = splitFor(4, 'intermediate');
    expect(nextFocus(split, 0)).toBe('upper');
    expect(nextFocus(split, 1)).toBe('lower');
  });

  /**
   * An extra session is the start of the rotation again, not a rest day the
   * app refuses to let somebody skip.
   */
  it('wraps past the end of the week', () => {
    const split = splitFor(4, 'intermediate');
    expect(nextFocus(split, 4)).toBe(nextFocus(split, 0));
  });

  it('has an answer for an empty split', () => {
    expect(nextFocus([], 0)).toBe('full_body');
  });
});

describe('the focuses themselves', () => {
  it('labels and fills every one', () => {
    for (const focus of SESSION_FOCUSES) {
      expect(FOCUS_LABELS[focus]).not.toBe('');
      expect(FOCUS_GROUPS[focus].length).toBeGreaterThan(2);
    }
  });

  it('leads each focus with its biggest movers', () => {
    // The session budget runs out, and what is still standing when it does
    // should be the squat rather than the calf raise.
    expect(FOCUS_GROUPS.legs[0]).toBe('quads');
    expect(FOCUS_GROUPS.push[0]).toBe('chest');
    expect(FOCUS_GROUPS.pull[0]).toBe('back');
  });

  it('does not send anybody to train their neck', () => {
    const everything = SESSION_FOCUSES.flatMap((focus) => [...FOCUS_GROUPS[focus]]);
    expect(everything).not.toContain('neck');
    expect(everything).not.toContain('forearms');
  });

  it('covers push and pull between them', () => {
    const combined = new Set([...FOCUS_GROUPS.push, ...FOCUS_GROUPS.pull]);
    for (const group of ['chest', 'back', 'shoulders', 'biceps', 'triceps']) {
      expect(combined.has(group), group).toBe(true);
    }
  });

  it('never names a group the seed does not have', () => {
    const known = new Set([
      'chest',
      'back',
      'shoulders',
      'biceps',
      'triceps',
      'forearms',
      'core',
      'quads',
      'hamstrings',
      'glutes',
      'calves',
      'adductors',
      'traps',
      'neck',
    ]);
    for (const focus of SESSION_FOCUSES) {
      for (const group of FOCUS_GROUPS[focus]) {
        expect(known.has(group), `${focus}: ${group}`).toBe(true);
      }
    }
  });
});

describe('the numbers stay inside what the literature supports', () => {
  /**
   * Roughly 10 sets a week is where most people stop leaving progress on the
   * table, and roughly 20 is where the returns flatten for almost everybody.
   * A generated plan drifting outside that band is a bug, not a philosophy.
   */
  it('keeps weekly volume between 6 and 20 sets a group', () => {
    const levels = ['beginner', 'intermediate', 'advanced'] as const;
    for (const goal of TRAINING_GOALS) {
      for (const level of levels) {
        const sets = prescriptionFor(goal, level).weeklySetsPerGroup;
        expect(sets, `${goal}/${level}`).toBeGreaterThanOrEqual(6);
        expect(sets, `${goal}/${level}`).toBeLessThanOrEqual(20);
      }
    }
  });
});
