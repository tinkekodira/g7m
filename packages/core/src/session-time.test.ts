import { describe, expect, it } from 'vitest';
import { estimateSessionMinutes, estimateSessionSeconds } from './estimate.js';
import { compatiblePair, pairForTime, type PairableExercise } from './session-time.js';

function exercise(
  exerciseId: string,
  groupSlug: string,
  over: Partial<PairableExercise> = {},
): PairableExercise {
  return {
    exerciseId,
    groupSlug,
    groupSlugs: [groupSlug],
    mechanic: 'isolation',
    repHigh: 12,
    sets: 3,
    restSeconds: 120,
    superset: null,
    ...over,
  };
}

describe('how long a superset takes', () => {
  it('saves one exercise’s rests and a changeover, and pays a walk per set', () => {
    const straight = [exercise('a', 'chest'), exercise('b', 'back')];
    const paired = straight.map((entry) => ({ ...entry, superset: 'A' }));
    // Straight: 2 × (3 × 40 + 2 × 120) + one 90 s changeover.
    expect(estimateSessionSeconds(straight)).toBe(810);
    // Paired: 6 × 40 + 3 walks of 20 + 2 rests of 120.
    expect(estimateSessionSeconds(paired)).toBe(6 * 40 + 3 * 20 + 2 * 120);
  });

  it('rests a round as long as its longest rest', () => {
    const paired = [
      exercise('a', 'chest', { superset: 'A', restSeconds: 180 }),
      exercise('b', 'back', { superset: 'A', restSeconds: 60 }),
    ];
    expect(estimateSessionSeconds(paired)).toBe(6 * 40 + 3 * 20 + 2 * 180);
  });

  it('times an uneven superset by its longer member’s rounds', () => {
    const paired = [
      exercise('a', 'chest', { superset: 'A', sets: 4 }),
      exercise('b', 'back', { superset: 'A', sets: 2 }),
    ];
    // Six sets in four rounds: two walks, three rests.
    expect(estimateSessionSeconds(paired)).toBe(6 * 40 + 2 * 20 + 3 * 120);
  });

  it('still rounds the home card’s number to five minutes', () => {
    expect(estimateSessionMinutes([exercise('a', 'chest'), exercise('b', 'back')])).toBe(15);
    expect(estimateSessionSeconds([])).toBeNull();
  });
});

describe('what can be paired', () => {
  it('pairs two accessories for different muscles', () => {
    expect(compatiblePair(exercise('curl', 'biceps'), exercise('pushdown', 'triceps'))).toBe(true);
  });

  it('never pairs two exercises for the same muscle', () => {
    expect(compatiblePair(exercise('fly', 'chest'), exercise('press', 'chest'))).toBe(false);
    expect(
      compatiblePair(
        exercise('dip', 'triceps', { groupSlugs: ['triceps', 'chest'] }),
        exercise('fly', 'chest'),
      ),
    ).toBe(false);
    expect(compatiblePair(exercise('a', 'chest'), exercise('a', 'back'))).toBe(false);
  });

  it('never pairs a heavy compound with anything', () => {
    const squat = exercise('squat', 'quads', { mechanic: 'compound', repHigh: 5 });
    expect(compatiblePair(squat, exercise('curl', 'biceps'))).toBe(false);
  });

  it('pairs two compounds only as antagonists, and never two leg lifts', () => {
    const compound = { mechanic: 'compound' as const };
    expect(
      compatiblePair(exercise('bench', 'chest', compound), exercise('row', 'back', compound)),
    ).toBe(true);
    expect(
      compatiblePair(
        exercise('bench', 'chest', compound),
        exercise('press', 'shoulders', compound),
      ),
    ).toBe(false);
    expect(
      compatiblePair(exercise('squat', 'quads', compound), exercise('rdl', 'hamstrings', compound)),
    ).toBe(false);
  });
});

describe('fitting a session to the time there is', () => {
  const plan = [
    exercise('bench', 'chest', { mechanic: 'compound', repHigh: 5 }),
    exercise('fly', 'chest'),
    exercise('raise', 'shoulders'),
    exercise('curl', 'biceps'),
    exercise('pushdown', 'triceps'),
  ];

  it('changes nothing when it already fits', () => {
    const fitted = pairForTime(plan, 60 * 60);
    expect(fitted.paired).toBe(false);
    expect(fitted.trimmed).toEqual([]);
    expect(fitted.exercises.map((entry) => entry.exerciseId)).toEqual(
      plan.map((entry) => entry.exerciseId),
    );
  });

  it('pairs antagonists first, keeps the heavy lift alone, and fits', () => {
    const budget = (estimateSessionSeconds(plan) ?? 0) - 60;
    const fitted = pairForTime(plan, budget);
    expect(fitted.trimmed).toEqual([]);
    expect(fitted.estimatedSeconds).toBeLessThanOrEqual(budget);
    const curl = fitted.exercises.find((entry) => entry.exerciseId === 'curl');
    const pushdown = fitted.exercises.find((entry) => entry.exerciseId === 'pushdown');
    expect(curl?.superset).not.toBeNull();
    expect(curl?.superset).toBe(pushdown?.superset);
    expect(fitted.exercises[0]).toMatchObject({ exerciseId: 'bench', superset: null });
  });

  it('puts a pair side by side', () => {
    const fitted = pairForTime(plan, 20 * 60);
    const labels = fitted.exercises.map((entry) => entry.superset);
    for (const label of new Set(labels.filter((entry) => entry !== null))) {
      expect(labels[labels.indexOf(label) + 1]).toBe(label);
    }
  });

  it('cuts from the end only once nothing more can pair', () => {
    const fitted = pairForTime(plan, 12 * 60);
    expect(fitted.trimmed.length).toBeGreaterThan(0);
    expect(fitted.exercises[0]?.exerciseId).toBe('bench');
    // Nobody is left in a superset of one.
    for (const entry of fitted.exercises) {
      if (entry.superset === null) continue;
      expect(fitted.exercises.filter((other) => other.superset === entry.superset)).toHaveLength(2);
    }
  });

  it('never cuts the last exercise', () => {
    expect(pairForTime([exercise('a', 'chest')], 1).exercises).toHaveLength(1);
  });
});
