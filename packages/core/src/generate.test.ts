import { describe, expect, it } from 'vitest';
import {
  DELOAD_AFTER_MISSES,
  planSession,
  suggestForNeglected,
  type ExerciseHistory,
  type PlanInput,
  type PlannableExercise,
  type SessionPerformance,
} from './generate.js';
import { prescriptionFor } from './programming.js';

const NOW = new Date('2026-09-07T18:00:00.000Z');
const DAY = 86_400_000;

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * DAY);
}

let nextRank = 1;

function exercise(
  name: string,
  groupSlugs: readonly string[],
  mechanic: PlannableExercise['mechanic'] = 'compound',
  over: Partial<PlannableExercise> = {},
): PlannableExercise {
  return {
    id: name.toLowerCase().replaceAll(' ', '-'),
    name,
    mechanic,
    isTimeBased: false,
    loadType: 'external',
    groupSlugs,
    popularityRank: nextRank++,
    defaultRepLow: 8,
    defaultRepHigh: 12,
    defaultRestSeconds: null,
    ...over,
  };
}

/** A catalogue wide enough that the generator has real choices to make. */
function catalogue(): PlannableExercise[] {
  nextRank = 1;
  return [
    exercise('Barbell Bench Press', ['chest']),
    exercise('Incline Dumbbell Press', ['chest']),
    exercise('Cable Fly', ['chest'], 'isolation'),
    exercise('Pec Deck', ['chest'], 'isolation'),
    exercise('Barbell Row', ['back']),
    exercise('Pull-Up', ['back']),
    exercise('Lat Pulldown', ['back']),
    exercise('Back Squat', ['quads']),
    exercise('Leg Press', ['quads']),
    exercise('Leg Extension', ['quads'], 'isolation'),
    exercise('Romanian Deadlift', ['hamstrings']),
    exercise('Leg Curl', ['hamstrings'], 'isolation'),
    exercise('Overhead Press', ['shoulders']),
    exercise('Lateral Raise', ['shoulders'], 'isolation'),
    exercise('Hip Thrust', ['glutes']),
    exercise('Triceps Pushdown', ['triceps'], 'isolation'),
    exercise('Barbell Curl', ['biceps'], 'isolation'),
    exercise('Calf Raise', ['calves'], 'isolation'),
    exercise('Plank', ['core'], 'isolation', {
      isTimeBased: true,
      defaultRepLow: 30,
      defaultRepHigh: 60,
    }),
  ];
}

function input(over: Partial<PlanInput> = {}): PlanInput {
  return {
    focus: 'full_body',
    prescription: prescriptionFor('build_muscle', 'intermediate'),
    catalogue: catalogue(),
    history: [],
    setsThisWeekByGroup: new Map(),
    now: NOW,
    ...over,
  };
}

/** One finished session of an exercise, `days` ago. */
function session(
  days: number,
  topSetKg: number | null,
  repsAtTopSet: readonly number[],
  repsInReserve: number | null = null,
): SessionPerformance {
  return { at: daysAgo(days), topSetKg, repsAtTopSet, repsInReserve };
}

function history(exerciseId: string, sessions: readonly SessionPerformance[]): ExerciseHistory {
  return { exerciseId, sessions };
}

/** The common case: one session a week ago, 80 kg for 8. */
function lastWeek(exerciseId: string, over: Partial<SessionPerformance> = {}): ExerciseHistory {
  return history(exerciseId, [
    { at: daysAgo(7), topSetKg: 80, repsAtTopSet: [8], repsInReserve: null, ...over },
  ]);
}

describe('a first session, with nothing to go on', () => {
  it('still produces a workout', () => {
    const session = planSession(input());
    expect(session.exercises.length).toBeGreaterThan(2);
    expect(session.totalSets).toBeGreaterThan(6);
  });

  it('leads with compounds', () => {
    // The lifts worth doing while fresh, and the most muscle for the time.
    const [first] = planSession(input()).exercises;
    expect(['Back Squat', 'Barbell Row', 'Barbell Bench Press']).toContain(first?.name);
  });

  it('suggests no weight it has no basis for', () => {
    const session = planSession(input());
    expect(session.exercises.every((entry) => entry.suggestedKg === null)).toBe(true);
    expect(session.exercises[0]?.reason.kind).toBe('first_time');
  });

  it('stays inside the session budget', () => {
    const prescription = prescriptionFor('build_muscle', 'beginner');
    const session = planSession(input({ prescription }));
    expect(session.totalSets).toBeLessThanOrEqual(prescription.maxSetsPerSession);
    expect(session.exercises.length).toBeLessThanOrEqual(prescription.maxExercisesPerSession);
  });

  it('covers different muscle groups rather than four chest exercises', () => {
    const groups = planSession(input()).exercises.map((entry) => entry.groupSlug);
    expect(new Set(groups).size).toBeGreaterThan(2);
  });
});

describe('adapting to the week so far', () => {
  /**
   * The whole of the adaptation, and the thing a fixed template cannot do.
   */
  it('skips a group that has already had its week', () => {
    const session = planSession(input({ setsThisWeekByGroup: new Map([['chest', 20]]) }));
    expect(session.exercises.map((entry) => entry.groupSlug)).not.toContain('chest');
    expect(session.restedGroups).toContain('chest');
  });

  it('still trains a group that is only part-way there', () => {
    const session = planSession(input({ setsThisWeekByGroup: new Map([['chest', 4]]) }));
    expect(session.exercises.map((entry) => entry.groupSlug)).toContain('chest');
  });

  it('does not prescribe more sets than the group is short', () => {
    // Two sets short means two sets, not a full three-set slot.
    const session = planSession(
      input({
        focus: 'push',
        setsThisWeekByGroup: new Map([['chest', 14]]),
      }),
    );
    const chest = session.exercises.find((entry) => entry.groupSlug === 'chest');
    expect(chest?.sets).toBe(2);
  });

  it('has something to say when everything is done', () => {
    const done = new Map(
      ['chest', 'back', 'quads', 'hamstrings', 'shoulders', 'glutes', 'core'].map((group) => [
        group,
        30,
      ]),
    );
    const session = planSession(input({ setsThisWeekByGroup: done }));
    expect(session.exercises).toEqual([]);
    expect(session.restedGroups.length).toBeGreaterThan(4);
  });
});

describe('choosing what to train', () => {
  /**
   * Training the same lift on consecutive days is not a program, it is a
   * mistake — and it is the mistake a naive "pick the best exercise" scorer
   * makes every single time.
   */
  it('will not repeat a lift trained yesterday', () => {
    const session = planSession(
      input({
        focus: 'push',
        history: [lastWeek('barbell-bench-press', { at: daysAgo(1) })],
      }),
    );
    expect(session.exercises.map((entry) => entry.exerciseId)).not.toContain('barbell-bench-press');
  });

  it('prefers a lift it has numbers for over one it does not', () => {
    // Continuity beats novelty: a program somebody can see themselves
    // progressing on is worth more than a fresh workout every session.
    const session = planSession(
      input({
        focus: 'push',
        history: [lastWeek('incline-dumbbell-press', { at: daysAgo(4) })],
      }),
    );
    const chest = session.exercises.find((entry) => entry.groupSlug === 'chest');
    expect(chest?.exerciseId).toBe('incline-dumbbell-press');
  });

  it('does not put the same exercise in twice', () => {
    const session = planSession(input());
    const ids = session.exercises.map((entry) => entry.exerciseId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('honours the focus', () => {
    const legs = planSession(input({ focus: 'legs' }));
    expect(legs.exercises.map((entry) => entry.groupSlug)).not.toContain('chest');

    const pull = planSession(input({ focus: 'pull' }));
    expect(pull.exercises.map((entry) => entry.groupSlug)).not.toContain('chest');
  });

  it('produces an empty session rather than crashing on an empty catalogue', () => {
    const session = planSession(input({ catalogue: [] }));
    expect(session.exercises).toEqual([]);
    expect(session.totalSets).toBe(0);
  });
});

describe('what to put on the bar', () => {
  it('adds weight when the top of the range was hit', () => {
    const session = planSession(
      input({
        focus: 'push',
        history: [lastWeek('barbell-bench-press', { topSetKg: 80, repsAtTopSet: [12, 12, 12] })],
      }),
    );
    const bench = session.exercises.find((entry) => entry.exerciseId === 'barbell-bench-press');
    expect(bench?.suggestedKg).toBe(82.5);
    expect(bench?.reason).toEqual({ kind: 'progress', fromKg: 80, reps: 12 });
  });

  it('repeats the weight when the range was not finished', () => {
    const session = planSession(
      input({
        focus: 'push',
        history: [lastWeek('barbell-bench-press', { topSetKg: 80, repsAtTopSet: [8] })],
      }),
    );
    const bench = session.exercises.find((entry) => entry.exerciseId === 'barbell-bench-press');
    expect(bench?.suggestedKg).toBe(80);
    expect(bench?.reason.kind).toBe('repeat');
  });

  /**
   * Three weeks off costs real strength. Prescribing the old number means a
   * first session back that fails on set two, and failing publicly takes
   * people out of the gym for months.
   */
  it('backs off after a layoff instead of picking up where they left off', () => {
    const session = planSession(
      input({
        focus: 'push',
        history: [
          lastWeek('barbell-bench-press', {
            topSetKg: 80,
            repsAtTopSet: [12],
            at: daysAgo(40),
          }),
        ],
      }),
    );
    const bench = session.exercises.find((entry) => entry.exerciseId === 'barbell-bench-press');
    expect(bench?.suggestedKg).toBe(72.5);
    expect(bench?.reason.kind).toBe('returning');
  });

  it('never suggests a weight for something that is not loaded', () => {
    const session = planSession(
      input({
        focus: 'lower',
        history: [lastWeek('plank', { topSetKg: 40, repsAtTopSet: [60] })],
      }),
    );
    const plank = session.exercises.find((entry) => entry.exerciseId === 'plank');
    if (plank !== undefined) expect(plank.suggestedKg).toBeNull();
  });

  it('keeps a time-based exercise on its own scale', () => {
    // Prescribing a plank for "6 to 12 reps" is six seconds of plank.
    const session = planSession(input({ focus: 'lower' }));
    const plank = session.exercises.find((entry) => entry.exerciseId === 'plank');
    if (plank !== undefined) {
      expect(plank.repLow).toBe(30);
      expect(plank.repHigh).toBe(60);
    }
  });
});

describe('the goal changes the session', () => {
  it('gives a strength session heavier sets in a lower rep range', () => {
    const strength = planSession(
      input({ prescription: prescriptionFor('get_stronger', 'intermediate') }),
    );
    const muscle = planSession(
      input({ prescription: prescriptionFor('build_muscle', 'intermediate') }),
    );

    expect(strength.exercises[0]?.repHigh).toBeLessThan(muscle.exercises[0]?.repHigh ?? 0);
    // Fewer reps means more sets to accumulate the same practice.
    expect(strength.exercises[0]?.sets).toBeGreaterThan(muscle.exercises[0]?.sets ?? 0);
    expect(strength.exercises[0]?.restSeconds).toBeGreaterThan(
      muscle.exercises[0]?.restSeconds ?? 0,
    );
  });

  it('gives a cut less total work than a bulk', () => {
    // Recovery is worse in a deficit, and the training's job changes from
    // adding muscle to keeping what is there.
    const cut = prescriptionFor('lose_fat', 'intermediate');
    const bulk = prescriptionFor('build_muscle', 'intermediate');
    expect(cut.weeklySetsPerGroup).toBeLessThan(bulk.weeklySetsPerGroup);
  });
});

describe('being stuck', () => {
  const missing = (days: number) => session(days, 100, [5, 5, 4]);

  /**
   * Anybody can have a bad Tuesday. An app that drops the weight over one of
   * those is an app nobody ever gets stronger on.
   */
  it('does not back off after one bad session', () => {
    const plan = planSession(
      input({ focus: 'push', history: [history('barbell-bench-press', [missing(7)])] }),
    );
    const bench = plan.exercises.find((entry) => entry.exerciseId === 'barbell-bench-press');
    expect(bench?.reason.kind).toBe('repeat');
    expect(bench?.suggestedKg).toBe(100);
  });

  it('backs off once it is a plateau rather than a bad day', () => {
    const plan = planSession(
      input({
        focus: 'push',
        history: [history('barbell-bench-press', [missing(3), missing(10), missing(17)])],
      }),
    );
    const bench = plan.exercises.find((entry) => entry.exerciseId === 'barbell-bench-press');
    expect(bench?.suggestedKg).toBe(90);
    expect(bench?.reason).toEqual({ kind: 'deload', fromKg: 100, misses: DELOAD_AFTER_MISSES });
  });

  /**
   * What makes a deload self-clearing rather than something that fires again
   * the following week.
   */
  it('forgets the streak after one good session', () => {
    const plan = planSession(
      input({
        focus: 'push',
        history: [
          history('barbell-bench-press', [session(3, 100, [8, 8, 8]), missing(10), missing(17)]),
        ],
      }),
    );
    const bench = plan.exercises.find((entry) => entry.exerciseId === 'barbell-bench-press');
    expect(bench?.reason.kind).not.toBe('deload');
  });

  it('counts a session where any set fell short, not only the last one', () => {
    // 12, 12, 7 is the same top set as 12, 12, 12 and a completely different
    // session. Only the second is a reason to add weight.
    const ranOut = planSession(
      input({
        focus: 'push',
        history: [history('barbell-bench-press', [session(7, 80, [12, 12, 5])])],
      }),
    );
    const bench = ranOut.exercises.find((entry) => entry.exerciseId === 'barbell-bench-press');
    expect(bench?.reason.kind).toBe('repeat');
  });
});

describe('reps in reserve', () => {
  /**
   * The one thing counting reps cannot tell you. Somebody who finishes twelve
   * with three left is nowhere near their limit, and 2.5 kg wastes a session.
   */
  it('takes a bigger jump when the range was finished easily', () => {
    const plan = planSession(
      input({
        focus: 'push',
        history: [history('barbell-bench-press', [session(7, 80, [12, 12, 12], 3)])],
      }),
    );
    const bench = plan.exercises.find((entry) => entry.exerciseId === 'barbell-bench-press');
    expect(bench?.suggestedKg).toBe(85);
    expect(bench?.reason).toEqual({ kind: 'jump', fromKg: 80, repsInReserve: 3 });
  });

  it('takes the normal step when it was a fight', () => {
    const plan = planSession(
      input({
        focus: 'push',
        history: [history('barbell-bench-press', [session(7, 80, [12, 12, 12], 0)])],
      }),
    );
    const bench = plan.exercises.find((entry) => entry.exerciseId === 'barbell-bench-press');
    expect(bench?.suggestedKg).toBe(82.5);
    expect(bench?.reason.kind).toBe('progress');
  });

  it('works without an answer, because the prompt is skippable', () => {
    const plan = planSession(
      input({
        focus: 'push',
        history: [history('barbell-bench-press', [session(7, 80, [12, 12, 12], null)])],
      }),
    );
    const bench = plan.exercises.find((entry) => entry.exerciseId === 'barbell-bench-press');
    expect(bench?.suggestedKg).toBe(82.5);
  });
});

describe('anchor and rotate', () => {
  /**
   * Nobody progresses on a lift they never repeat, so the big movement of a
   * session should be the same one week after week.
   */
  it('keeps the compound somebody has been training', () => {
    const plan = planSession(
      input({ focus: 'push', history: [lastWeek('incline-dumbbell-press', { at: daysAgo(5) })] }),
    );
    const chest = plan.exercises.find((entry) => entry.groupSlug === 'chest');
    expect(chest?.exerciseId).toBe('incline-dumbbell-press');
  });

  /**
   * The opposite rule for the accessory slot. Doing cable flies for eleven
   * months because they won a tie-break once is how a plan gets ignored.
   */
  it('moves the accessory on once it has just been done', () => {
    // Chest has two isolations in this catalogue, so there is somewhere to
    // rotate to — which is the only situation the rule can be seen in.
    const fresh = planSession(input({ focus: 'push', setsThisWeekByGroup: chestOnly() }));
    expect(accessory(fresh)).toBe('cable-fly');

    const after = planSession(
      input({
        focus: 'push',
        setsThisWeekByGroup: chestOnly(),
        history: [lastWeek('cable-fly', { at: daysAgo(3) })],
      }),
    );
    expect(accessory(after)).toBe('pec-deck');
  });

  it('brings a rested accessory back rather than retiring it', () => {
    // The penalty fades with time. An exercise dropped for being recent has
    // to be able to return, or the rotation is a one-way door.
    const after = planSession(
      input({
        focus: 'push',
        setsThisWeekByGroup: chestOnly(),
        history: [lastWeek('cable-fly', { at: daysAgo(45) })],
      }),
    );
    expect(accessory(after)).toBe('cable-fly');
  });
});

describe('alternatives', () => {
  it('carries the exercises each choice beat', () => {
    const plan = planSession(input({ focus: 'push' }));
    const chest = plan.exercises.find((entry) => entry.groupSlug === 'chest');

    expect(chest?.alternatives.length).toBeGreaterThan(0);
    expect(chest?.alternatives.map((entry) => entry.exerciseId)).not.toContain(chest?.exerciseId);
  });

  it('plans them in full, so a swap lands on a real prescription', () => {
    const plan = planSession(
      input({
        focus: 'push',
        history: [lastWeek('incline-dumbbell-press', { topSetKg: 30, repsAtTopSet: [12, 12, 12] })],
      }),
    );
    const chest = plan.exercises.find((entry) => entry.groupSlug === 'chest');
    const swap = [chest, ...(chest?.alternatives ?? [])].find(
      (entry) => entry?.exerciseId === 'incline-dumbbell-press',
    );
    expect(swap?.suggestedKg).toBe(32.5);
    expect(swap?.sets).toBe(chest?.sets);
  });

  it('stops one level deep, because a menu is not a swap', () => {
    const plan = planSession(input({ focus: 'push' }));
    for (const exercise of plan.exercises) {
      for (const option of exercise.alternatives) {
        expect(option.alternatives).toEqual([]);
      }
    }
  });

  it('offers alternatives from the same muscle group', () => {
    const plan = planSession(input({ focus: 'push' }));
    for (const exercise of plan.exercises) {
      for (const option of exercise.alternatives) {
        expect(option.groupSlug).toBe(exercise.groupSlug);
      }
    }
  });
});

/**
 * The second chest exercise in a session — the accessory slot.
 *
 * The first is chosen by the compound rule, which anchors; only the second is
 * chosen by the rule that rotates.
 */
function accessory(plan: {
  exercises: readonly { groupSlug: string; exerciseId: string }[];
}): string | undefined {
  return plan.exercises.filter((entry) => entry.groupSlug === 'chest')[1]?.exerciseId;
}

/**
 * Enough shoulder and triceps work banked that only chest is left, so the
 * spare budget goes on a second chest exercise rather than elsewhere.
 */
function chestOnly(): Map<string, number> {
  return new Map([
    ['shoulders', 30],
    ['triceps', 30],
  ]);
}

describe('suggestForNeglected', () => {
  const target = 16;

  /** Every group at its weekly target, so a test can put one group behind. */
  const ALL_DONE = Object.fromEntries(
    [
      'chest',
      'back',
      'shoulders',
      'triceps',
      'biceps',
      'quads',
      'hamstrings',
      'glutes',
      'calves',
      'core',
      'traps',
    ].map((group) => [group, target]),
  );

  function suggest(done: Record<string, number>, over: { limit?: number } = {}) {
    return suggestForNeglected({
      catalogue: catalogue(),
      history: [],
      setsThisWeekByGroup: new Map(Object.entries(done)),
      weeklyTarget: target,
      now: NOW,
      ...over,
    });
  }

  /**
   * A heat map answers "what have I trained" and stops there, leaving the
   * useful half of the question as an exercise for the reader.
   */
  it('names an exercise for the group furthest behind', () => {
    const found = suggest({ ...ALL_DONE, quads: 0 });
    expect(found[0]?.group).toBe('quads');
    expect(found[0]?.name).toBe('Back Squat');
  });

  it('orders by how overdue each group is', () => {
    // Everything else at target, or the groups this test does not mention are
    // all sixteen sets behind and win — which is correct, and not the point.
    const found = suggest({ ...ALL_DONE, back: 2, quads: 8 });
    expect(found.map((entry) => entry.group)).toEqual(['back', 'quads']);
  });

  it('says nothing about a group that has had its week', () => {
    expect(suggest(ALL_DONE)).toEqual([]);
  });

  it('does not suggest the same exercise for two groups', () => {
    const found = suggest({});
    const ids = found.map((entry) => entry.exerciseId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps the list short enough to read under a model', () => {
    expect(suggest({}).length).toBeLessThanOrEqual(4);
    expect(suggest({}, { limit: 2 })).toHaveLength(2);
  });

  it('prefers compounds, which is the most muscle for the time', () => {
    const found = suggest({ ...ALL_DONE, chest: 0 });
    expect(found[0]?.name).toBe('Barbell Bench Press');
  });

  /**
   * The same scorer the generator uses, so the suggestion under the model and
   * the exercise in tomorrow's session agree. Two answers to one question is
   * worse than having only one.
   */
  it('will not suggest something trained yesterday', () => {
    const found = suggestForNeglected({
      catalogue: catalogue(),
      history: [lastWeek('barbell-bench-press', { at: daysAgo(1) })],
      setsThisWeekByGroup: new Map([['chest', 0]]),
      weeklyTarget: target,
      now: NOW,
    });
    const chest = found.find((entry) => entry.group === 'chest');
    expect(chest?.exerciseId).not.toBe('barbell-bench-press');
  });

  it('has nothing to say with an empty catalogue', () => {
    expect(
      suggestForNeglected({
        catalogue: [],
        history: [],
        setsThisWeekByGroup: new Map(),
        weeklyTarget: target,
        now: NOW,
      }),
    ).toEqual([]);
  });
});
