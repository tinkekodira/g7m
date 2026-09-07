import { describe, expect, it } from 'vitest';
import {
  planSession,
  type ExerciseHistory,
  type PlanInput,
  type PlannableExercise,
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

function history(exerciseId: string, over: Partial<ExerciseHistory> = {}): ExerciseHistory {
  return {
    exerciseId,
    lastPerformedAt: daysAgo(7),
    topSetKg: 80,
    topSetReps: 8,
    ...over,
  };
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
        history: [history('barbell-bench-press', { lastPerformedAt: daysAgo(1) })],
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
        history: [history('incline-dumbbell-press', { lastPerformedAt: daysAgo(4) })],
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
        history: [history('barbell-bench-press', { topSetKg: 80, topSetReps: 12 })],
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
        history: [history('barbell-bench-press', { topSetKg: 80, topSetReps: 8 })],
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
          history('barbell-bench-press', {
            topSetKg: 80,
            topSetReps: 12,
            lastPerformedAt: daysAgo(40),
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
        history: [history('plank', { topSetKg: 40, topSetReps: 60 })],
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
