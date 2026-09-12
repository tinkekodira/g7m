import { describe, expect, it } from 'vitest';
import type { WeightTrend } from './body.js';
import {
  GOAL_DESCRIPTIONS,
  goalExpectation,
  GOAL_LABELS,
  TRAINING_GOALS,
  suggestGoal,
  goalChangedAt,
} from './goals.js';

function trend(over: Partial<WeightTrend> = {}): WeightTrend {
  return {
    latestKg: 82,
    startKg: 85,
    endKg: 82,
    changeKg: -3,
    perWeekKg: -0.5,
    spanDays: 42,
    samples: 6,
    ...over,
  };
}

describe('the goals themselves', () => {
  it('labels, describes and sets an expectation for every one', () => {
    for (const goal of TRAINING_GOALS) {
      expect(GOAL_LABELS[goal]).not.toBe('');
      expect(GOAL_DESCRIPTIONS[goal]).not.toBe('');
      expect(goalExpectation(goal, null)).not.toBe('');
      expect(goalExpectation(goal, 'female')).not.toBe('');
    }
  });

  /**
   * Somebody told "0.1 to 0.3 kg a week" up front does not quit in week three
   * for gaining 0.2. The expectations exist to be slower than the internet's.
   */
  it('says what is realistic in numbers, not in encouragement', () => {
    expect(goalExpectation('lose_fat', null)).toMatch(/\d/);
    expect(goalExpectation('build_muscle', null)).toMatch(/\d/);
  });

  it('covers the four the brief asked for', () => {
    expect([...TRAINING_GOALS]).toEqual(['lose_fat', 'build_muscle', 'recomp', 'get_stronger']);
  });
});

describe('suggestGoal', () => {
  /**
   * A suggestion invented from nothing looks like the app knows something,
   * and the first thing it says about somebody should not be a guess.
   */
  it('suggests nothing when it knows nothing', () => {
    expect(suggestGoal({ trend: null, experienceLevel: null })).toBeNull();
    expect(suggestGoal({ trend: null, experienceLevel: 'intermediate' })).toBeNull();
  });

  it('matches a goal to a weight that is already coming down', () => {
    const suggestion = suggestGoal({ trend: trend({ perWeekKg: -0.5 }), experienceLevel: null });
    expect(suggestion?.goal).toBe('lose_fat');
    expect(suggestion?.because).toContain('0.5 kg a week');
  });

  it('matches a goal to a weight that is going up', () => {
    const suggestion = suggestGoal({ trend: trend({ perWeekKg: 0.3 }), experienceLevel: null });
    expect(suggestion?.goal).toBe('build_muscle');
  });

  it('treats a weight that is holding as no signal at all', () => {
    // Below the threshold this is water, salt and what time they last ate.
    expect(suggestGoal({ trend: trend({ perWeekKg: -0.05 }), experienceLevel: null })).toBeNull();
  });

  it('ignores a rate the trend refused to state', () => {
    // Under a fortnight `weightTrend` returns null here, and a suggestion
    // built on it would be a guess wearing a decimal point.
    const short = trend({ perWeekKg: null, spanDays: 9, changeKg: -1.8 });
    expect(suggestGoal({ trend: short, experienceLevel: null })).toBeNull();
  });

  /**
   * Real, and it stops being true within a year or so — which is why this is
   * the one place recomp is the honest recommendation rather than the
   * compromise it becomes later.
   */
  it('points a beginner at recomp when there is no trend yet', () => {
    expect(suggestGoal({ trend: null, experienceLevel: 'beginner' })?.goal).toBe('recomp');
  });

  it('prefers what they are doing over what they are', () => {
    // A beginner already losing weight on purpose gets the goal that matches
    // the behaviour, not the one that matches the category.
    const suggestion = suggestGoal({
      trend: trend({ perWeekKg: -0.6 }),
      experienceLevel: 'beginner',
    });
    expect(suggestion?.goal).toBe('lose_fat');
  });

  /**
   * The line this module exists to hold. Nothing here may be derived from how
   * much somebody weighs or how tall they are — only from what their weight
   * has been doing and how long they have trained. See ADR-0035.
   */
  it('never reasons from the weight itself', () => {
    const heavy = suggestGoal({
      trend: trend({ latestKg: 140, perWeekKg: 0.3 }),
      experienceLevel: 'intermediate',
    });
    const light = suggestGoal({
      trend: trend({ latestKg: 55, perWeekKg: 0.3 }),
      experienceLevel: 'intermediate',
    });
    expect(heavy?.goal).toBe(light?.goal);
    expect(heavy?.because).toBe(light?.because);
  });

  it('describes the user rather than judging them', () => {
    for (const rate of [-0.5, 0.5]) {
      const suggestion = suggestGoal({ trend: trend({ perWeekKg: rate }), experienceLevel: null });
      expect(suggestion?.because).toMatch(/if that is on purpose/i);
      expect(suggestion?.because).not.toMatch(/should|too much|overweight|need to/i);
    }
  });
});

describe('goalExpectation', () => {
  /**
   * The one goal where a single number is good advice for one person and a
   * setup for disappointment for another. Saying so is the point of stating a
   * rate at all — it is not a smaller goal, it is the real number.
   */
  it('quotes a slower rate of muscle gain to women', () => {
    const male = goalExpectation('build_muscle', 'male');
    const female = goalExpectation('build_muscle', 'female');
    expect(female).not.toBe(male);
    expect(female).toMatch(/0\.05/);
    expect(male).toMatch(/0\.1/);
  });

  it('names effort as not being the reason', () => {
    expect(goalExpectation('build_muscle', 'female')).toMatch(/biology rather than effort/i);
  });

  /**
   * Fat loss is quoted as a share of bodyweight, which is better advice and
   * needs no sex: half a percent a week is the same instruction to everybody,
   * and 0.75 kg is a very different week at 60 kg than at 100 kg.
   */
  it('does not vary the goals where sex changes nothing', () => {
    for (const goal of ['lose_fat', 'recomp', 'get_stronger'] as const) {
      expect(goalExpectation(goal, 'female')).toBe(goalExpectation(goal, 'male'));
    }
    expect(goalExpectation('lose_fat', null)).toMatch(/%/);
  });

  it('gives an unknown sex both figures rather than a guess', () => {
    const unknown = goalExpectation('build_muscle', null);
    expect(unknown).toMatch(/men/i);
    expect(unknown).toMatch(/women/i);
  });
});

describe('goalChangedAt', () => {
  const at = (iso: string): Date => new Date(iso);

  /**
   * The bug. Onboarding asked every existing account for a goal, they restated
   * the one they had, and the review measured from that day — ten sessions
   * became one. Restating is not changing.
   */
  it('does not treat a restated goal as a change', () => {
    const history = [
      { goal: 'build_muscle' as const, startedAt: at('2026-09-11') },
      { goal: 'build_muscle' as const, startedAt: at('2026-09-01') },
    ];
    expect(goalChangedAt(history)).toBeNull();
  });

  /**
   * And the case the first version of this fix still got wrong. If the first
   * goal ever chosen is the one onboarding wrote, every earlier session was
   * training with no goal at all — not training for a different one. There is
   * nothing for it to contaminate, so nothing is cut.
   */
  it('cuts nothing when there has only ever been one goal', () => {
    expect(goalChangedAt([{ goal: 'recomp', startedAt: at('2026-09-11') }])).toBeNull();
  });

  /** A cut's sessions are not evidence about a bulk. */
  it('cuts at the switch when the goal really changed', () => {
    const history = [
      { goal: 'build_muscle' as const, startedAt: at('2026-09-11') },
      { goal: 'lose_fat' as const, startedAt: at('2026-08-01') },
    ];
    expect(goalChangedAt(history)).toEqual(at('2026-09-11'));
  });

  it('cuts at the start of the run, past any restatements after the switch', () => {
    const history = [
      { goal: 'build_muscle' as const, startedAt: at('2026-09-11') },
      { goal: 'build_muscle' as const, startedAt: at('2026-09-01') },
      { goal: 'lose_fat' as const, startedAt: at('2026-08-01') },
    ];
    expect(goalChangedAt(history)).toEqual(at('2026-09-01'));
  });

  it('uses the most recent switch, even if an older run matches', () => {
    const history = [
      { goal: 'build_muscle' as const, startedAt: at('2026-09-11') },
      { goal: 'lose_fat' as const, startedAt: at('2026-08-01') },
      { goal: 'build_muscle' as const, startedAt: at('2026-06-01') },
    ];
    expect(goalChangedAt(history)).toEqual(at('2026-09-11'));
  });

  it('has nothing to say about an empty history', () => {
    expect(goalChangedAt([])).toBeNull();
  });
});
