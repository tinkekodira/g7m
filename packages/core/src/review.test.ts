import { describe, expect, it } from 'vitest';
import {
  MIN_DAYS,
  MIN_SESSIONS,
  reviewTraining,
  toneOf,
  type Observation,
  type ReviewInput,
} from './review.js';
import type { HistoricalSet } from './progress.js';
import type { WeighIn } from './body.js';

const NOW = new Date('2026-09-07T18:00:00.000Z');
const DAY = 86_400_000;

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * DAY);
}

/** One completed working set. */
function set(
  over: Partial<HistoricalSet> & { sessionId: string; exerciseId: string },
): HistoricalSet {
  return {
    performedAt: daysAgo(7),
    setType: 'working',
    loadType: 'external',
    weightKg: 80,
    reps: 8,
    isCompleted: true,
    bodyweightKg: 82,
    ...over,
  };
}

/**
 * `sessions` sessions spread evenly across `overDays`, each with `perSession`
 * sets of the given exercises.
 */
function log(
  exercises: readonly string[],
  { sessions = 8, overDays = 28, setsEach = 3, kg = 80 } = {},
): HistoricalSet[] {
  const out: HistoricalSet[] = [];
  for (let s = 0; s < sessions; s++) {
    const at = daysAgo(overDays - Math.round((overDays * s) / Math.max(sessions - 1, 1)));
    for (const exerciseId of exercises) {
      for (let i = 0; i < setsEach; i++) {
        out.push(set({ sessionId: `s${String(s)}`, exerciseId, performedAt: at, weightKg: kg }));
      }
    }
  }
  return out;
}

const GROUPS = new Map<string, readonly string[]>([
  ['bench', ['chest']],
  ['row', ['back']],
  ['squat', ['quads']],
  ['curl', ['biceps']],
  ['press', ['shoulders']],
  ['pushdown', ['triceps']],
  ['rdl', ['hamstrings']],
  ['thrust', ['glutes']],
  ['calf', ['calves']],
  ['plank', ['core']],
]);

/** One exercise per tracked group, so nothing is at zero. */
const EVERYTHING = [...GROUPS.keys()];

const NAMES = new Map([
  ['bench', 'Barbell Bench Press'],
  ['row', 'Barbell Row'],
  ['squat', 'Back Squat'],
  ['curl', 'Barbell Curl'],
  ['press', 'Overhead Press'],
  ['pushdown', 'Triceps Pushdown'],
  ['rdl', 'Romanian Deadlift'],
  ['thrust', 'Hip Thrust'],
  ['calf', 'Calf Raise'],
  ['plank', 'Plank'],
]);

function input(over: Partial<ReviewInput> = {}): ReviewInput {
  return {
    goal: 'build_muscle',
    daysPerWeek: 4,
    experienceLevel: 'intermediate',
    sex: 'male',
    sets: log(['bench', 'row', 'squat', 'curl'], { setsEach: 4 }),
    groupsByExercise: GROUPS,
    exerciseNames: NAMES,
    weighIns: [],
    now: NOW,
    ...over,
  };
}

function kinds(review: { observations: readonly Observation[] }): string[] {
  return review.observations.map((entry) => entry.kind);
}

function find<K extends Observation['kind']>(
  review: { observations: readonly Observation[] },
  kind: K,
): Extract<Observation, { kind: K }> | undefined {
  return review.observations.find((entry) => entry.kind === kind) as
    Extract<Observation, { kind: K }> | undefined;
}

/** A steady weekly weigh-in losing `perWeek` kg from `startKg`. */
function weighIns(startKg: number, perWeek: number, weeks = 6): WeighIn[] {
  const out: WeighIn[] = [];
  for (let w = weeks; w >= 0; w--) {
    out.push({ at: daysAgo(w * 7), weightKg: startKg - perWeek * (weeks - w) });
  }
  return out;
}

describe('before there is enough to go on', () => {
  /**
   * "Nothing to report" and "I have not looked yet" are different things, and
   * a screen has to be able to say which.
   */
  it('says so rather than returning nothing', () => {
    const review = reviewTraining(input({ sets: log(['bench'], { sessions: 2, overDays: 5 }) }));
    expect(kinds(review)).toEqual(['too_soon']);
    expect(find(review, 'too_soon')?.needed).toBe(MIN_SESSIONS);
  });

  it('waits for enough sessions even over a long span', () => {
    // Three sessions across two months is not a training history.
    const review = reviewTraining(input({ sets: log(['bench'], { sessions: 3, overDays: 60 }) }));
    expect(kinds(review)).toEqual(['too_soon']);
  });

  /**
   * Four sessions in three days is a holiday, not a fortnight of training, and
   * a weekly rate computed from it says somebody trains eleven times a week.
   */
  it('waits for enough time even with enough sessions', () => {
    const review = reviewTraining(input({ sets: log(['bench'], { sessions: 6, overDays: 4 }) }));
    expect(kinds(review)).toEqual(['too_soon']);
  });

  /**
   * The gate above was always right. What it reported was not: the observation
   * carried only the session count, so six sessions over four days came out as
   * "6 of 4 sessions logged" — a sentence that contradicts itself and reads as
   * a broken counter. It has to say which threshold is the short one.
   */
  it('reports the days when it is the days that are short', () => {
    const review = reviewTraining(input({ sets: log(['bench'], { sessions: 6, overDays: 4 }) }));
    const early = find(review, 'too_soon');

    expect(early?.sessions).toBeGreaterThanOrEqual(MIN_SESSIONS);
    expect(early?.days).toBeLessThan(MIN_DAYS);
    expect(early?.neededDays).toBe(MIN_DAYS);
  });

  it('has nothing to say about an empty log', () => {
    const review = reviewTraining(input({ sets: [] }));
    expect(kinds(review)).toEqual(['too_soon']);
    expect(review.sessions).toBe(0);
  });

  it('does not count warm-ups or unticked sets towards the threshold', () => {
    const warmups = log(['bench'], { sessions: 8 }).map((entry) => ({
      ...entry,
      setType: 'warmup' as const,
    }));
    expect(kinds(reviewTraining(input({ sets: warmups })))).toEqual(['too_soon']);
  });
});

describe('showing up', () => {
  it('says nothing when they are training as often as they said', () => {
    // Eight sessions over four weeks against a target of two.
    const review = reviewTraining(input({ daysPerWeek: 2 }));
    expect(kinds(review)).not.toContain('consistency');
  });

  it('does not nag somebody who is only just short', () => {
    // 3.5 a week against a target of 4 is fine and does not need telling.
    const review = reviewTraining(
      input({ daysPerWeek: 4, sets: log(['bench', 'row'], { sessions: 14, overDays: 28 }) }),
    );
    expect(kinds(review)).not.toContain('consistency');
  });

  it('reports a real shortfall', () => {
    const review = reviewTraining(
      input({ daysPerWeek: 5, sets: log(['bench', 'row'], { sessions: 8, overDays: 28 }) }),
    );
    const observation = find(review, 'consistency');
    expect(observation?.target).toBe(5);
    expect(observation?.perWeek).toBeLessThan(3);
  });
});

describe('muscle group balance', () => {
  it('names the group furthest behind', () => {
    // Chest, quads and biceps trained; the back never.
    const review = reviewTraining(
      input({ sets: log(['bench', 'squat', 'curl'], { setsEach: 5 }) }),
    );
    expect(find(review, 'group_short')?.group).toBe('back');
  });

  it('names only one, not a spreadsheet', () => {
    const review = reviewTraining(input({ sets: log(['bench'], { setsEach: 6 }) }));
    expect(kinds(review).filter((kind) => kind === 'group_short')).toHaveLength(1);
  });

  it('says nothing when everything is roughly on target', () => {
    // Every tracked group at about its weekly target. Four groups covered and
    // six at zero is not "balanced", which is what the first version of this
    // test got wrong.
    const review = reviewTraining(
      // 8 sets each, 8 sessions, 4 weeks = 16 a week per group, which is the
      // intermediate hypertrophy target exactly.
      input({ sets: log(EVERYTHING, { setsEach: 8, sessions: 8, overDays: 28 }) }),
    );
    expect(kinds(review)).not.toContain('group_short');
    expect(kinds(review)).not.toContain('group_over');
  });

  it('flags a group getting far more than it can use', () => {
    const review = reviewTraining(
      input({ sets: log(['bench'], { setsEach: 20, sessions: 10, overDays: 21 }) }),
    );
    expect(find(review, 'group_over')?.group).toBe('chest');
  });

  /**
   * Better silent than confidently wrong about every group at once. A
   * catalogue that never said what an exercise trains is a data problem, not a
   * training problem.
   */
  it('stays quiet when the catalogue knows nothing about the exercises', () => {
    const review = reviewTraining(input({ groupsByExercise: new Map() }));
    expect(kinds(review)).not.toContain('group_short');
    expect(kinds(review)).not.toContain('group_over');
  });

  it('never reports on a group no plan would prescribe for', () => {
    // Nobody needs telling their neck is undertrained.
    const review = reviewTraining(
      input({ groupsByExercise: new Map([['bench', ['neck', 'forearms']]]) }),
    );
    const short = find(review, 'group_short');
    expect(short?.group).not.toBe('neck');
    expect(short?.group).not.toBe('forearms');
  });
});

describe('the lifts themselves', () => {
  /** Sessions on one lift, each heavier than the last. */
  function climbing(exerciseId: string, from: number, step: number, sessions = 5): HistoricalSet[] {
    const out: HistoricalSet[] = [];
    for (let s = 0; s < sessions; s++) {
      const at = daysAgo(35 - s * 7);
      out.push(
        set({ sessionId: `c${String(s)}`, exerciseId, performedAt: at, weightKg: from + step * s }),
      );
    }
    return out;
  }

  it('reports a lift that has been going up', () => {
    const review = reviewTraining(input({ sets: climbing('bench', 80, 2.5) }));
    const observation = find(review, 'lift_climbing');
    expect(observation?.name).toBe('Barbell Bench Press');
    expect(observation?.from).toEqual({ loadType: 'external', weightKg: 80, reps: 8 });
    expect(observation?.to).toEqual({ loadType: 'external', weightKg: 90, reps: 8 });
    expect(observation?.timed).toBe(false);
  });

  it('reports a lift that has not moved', () => {
    const review = reviewTraining(input({ sets: climbing('squat', 100, 0) }));
    const observation = find(review, 'lift_stalled');
    expect(observation?.name).toBe('Back Squat');
    expect(observation?.best).toEqual({ loadType: 'external', weightKg: 100, reps: 8 });
    expect(observation?.sessionsSince).toBe(4);
  });

  /** Weekly sessions of one lift, with each session's single set given. */
  function sessionsOf(
    exerciseId: string,
    tops: readonly Partial<HistoricalSet>[],
  ): HistoricalSet[] {
    return tops.map((top, s) =>
      set({
        sessionId: `${exerciseId}${String(s)}`,
        exerciseId,
        performedAt: daysAgo((tops.length - s) * 7),
        ...top,
      }),
    );
  }

  /**
   * The reported bug. Adding reps at the same weight is the progression the
   * plan itself prescribes, and it used to read as "has not moved".
   */
  it('counts more reps at the same weight as going up', () => {
    const review = reviewTraining(
      input({
        sets: sessionsOf('bench', [
          { weightKg: 80, reps: 6 },
          { weightKg: 80, reps: 7 },
          { weightKg: 80, reps: 8 },
          { weightKg: 80, reps: 10 },
        ]),
      }),
    );
    expect(find(review, 'lift_stalled')).toBeUndefined();
    expect(find(review, 'lift_climbing')?.to).toMatchObject({ weightKg: 80, reps: 10 });
  });

  /**
   * And the report that found it: pull-ups going up in reps while the scale
   * came down, which effective load read as a lift going nowhere.
   */
  it('reads pull-ups by their reps, not by the scale', () => {
    const review = reviewTraining(
      input({
        exerciseNames: new Map([['pullup', 'Pull-up']]),
        sets: sessionsOf('pullup', [
          { loadType: 'bodyweight', weightKg: 0, reps: 6, bodyweightKg: 83 },
          { loadType: 'bodyweight', weightKg: 0, reps: 8, bodyweightKg: 82 },
          { loadType: 'bodyweight', weightKg: 0, reps: 9, bodyweightKg: 81.5 },
          { loadType: 'bodyweight', weightKg: 0, reps: 11, bodyweightKg: 81 },
        ]),
      }),
    );
    expect(find(review, 'lift_stalled')).toBeUndefined();
    expect(find(review, 'lift_climbing')).toMatchObject({
      name: 'Pull-up',
      from: { loadType: 'bodyweight', reps: 6 },
      to: { loadType: 'bodyweight', reps: 11 },
    });
  });

  /** An early jump used to hide a month of standing still. */
  it('reports the plateau a lift is on now, not the jump before it', () => {
    const review = reviewTraining(
      input({
        sets: sessionsOf('squat', [
          { weightKg: 100, reps: 5 },
          { weightKg: 110, reps: 5 },
          { weightKg: 110, reps: 5 },
          { weightKg: 110, reps: 4 },
          { weightKg: 110, reps: 5 },
        ]),
      }),
    );
    expect(find(review, 'lift_climbing')).toBeUndefined();
    expect(find(review, 'lift_stalled')).toMatchObject({
      exerciseId: 'squat',
      best: { weightKg: 110, reps: 5 },
      sessionsSince: 3,
    });
  });

  it('marks a timed hold, so it is described in seconds', () => {
    const review = reviewTraining(
      input({
        timedExercises: new Set(['plank']),
        // Four sessions: the review says nothing at all below `MIN_SESSIONS`.
        sets: sessionsOf('plank', [
          { loadType: 'bodyweight', weightKg: 0, reps: 45 },
          { loadType: 'bodyweight', weightKg: 0, reps: 50 },
          { loadType: 'bodyweight', weightKg: 0, reps: 55 },
          { loadType: 'bodyweight', weightKg: 0, reps: 60 },
        ]),
      }),
    );
    expect(find(review, 'lift_climbing')).toMatchObject({ exerciseId: 'plank', timed: true });
  });

  /**
   * Three sessions in one week is a week, not a plateau. Calling it one would
   * send somebody into a deload they do not need.
   */
  it('does not call a single week a plateau', () => {
    const tight: HistoricalSet[] = [0, 2, 4, 6].map((day) =>
      set({ sessionId: `t${String(day)}`, exerciseId: 'squat', performedAt: daysAgo(20 - day) }),
    );
    const review = reviewTraining(
      input({ sets: [...tight, ...log(['bench'], { sessions: 6, overDays: 28 })] }),
    );
    expect(find(review, 'lift_stalled')?.exerciseId).not.toBe('squat');
  });

  it('needs more than two sessions before judging a lift at all', () => {
    const twice: HistoricalSet[] = [
      set({ sessionId: 'a', exerciseId: 'squat', performedAt: daysAgo(30) }),
      set({ sessionId: 'b', exerciseId: 'squat', performedAt: daysAgo(2) }),
    ];
    const review = reviewTraining(
      input({ sets: [...twice, ...log(['bench'], { sessions: 6, overDays: 28 })] }),
    );
    expect(find(review, 'lift_stalled')?.exerciseId).not.toBe('squat');
  });

  it('picks the biggest climber, not the first one it finds', () => {
    const review = reviewTraining(
      input({ sets: [...climbing('curl', 20, 1), ...climbing('bench', 80, 5)] }),
    );
    expect(find(review, 'lift_climbing')?.name).toBe('Barbell Bench Press');
  });
});

describe('the scale against the goal', () => {
  /**
   * The judgement ADR-0036 deferred. Allowed now for one reason only: there is
   * a goal to measure against, so it is a comparison with something the user
   * asked for rather than an opinion about their body.
   */
  it('says a cut inside the band is on track', () => {
    // 82 kg losing 0.6 kg a week is 0.73% — inside 0.5 to 1%.
    const review = reviewTraining(input({ goal: 'lose_fat', weighIns: weighIns(82, 0.6) }));
    const pace = find(review, 'pace');
    expect(pace?.verdict).toBe('on_track');
    expect(toneOf(pace as Observation)).toBe('good');
  });

  it('says a cut running too hard is too fast', () => {
    // 1.4 kg a week at 82 kg is 1.7%, and strength goes with it.
    const review = reviewTraining(input({ goal: 'lose_fat', weighIns: weighIns(82, 1.4) }));
    expect(find(review, 'pace')?.verdict).toBe('fast');
  });

  it('says a cut that is barely moving is too slow', () => {
    const review = reviewTraining(input({ goal: 'lose_fat', weighIns: weighIns(82, 0.15) }));
    expect(find(review, 'pace')?.verdict).toBe('slow');
  });

  it('says gaining on a cut is the wrong way', () => {
    const review = reviewTraining(input({ goal: 'lose_fat', weighIns: weighIns(82, -0.4) }));
    expect(find(review, 'pace')?.verdict).toBe('wrong_way');
  });

  it('holds a bulk to a slower band than a cut', () => {
    // 0.6 kg a week is fine on a cut and mostly fat on a bulk.
    const bulk = reviewTraining(input({ goal: 'build_muscle', weighIns: weighIns(82, -0.6) }));
    expect(find(bulk, 'pace')?.verdict).toBe('fast');
  });

  it('quotes a woman the slower band she was promised', () => {
    // 0.2 kg a week: on track for a man, fast for a woman. Same numbers the
    // goal screen stated before she started.
    const male = reviewTraining(
      input({ goal: 'build_muscle', sex: 'male', weighIns: weighIns(70, -0.2) }),
    );
    const female = reviewTraining(
      input({ goal: 'build_muscle', sex: 'female', weighIns: weighIns(70, -0.2) }),
    );
    expect(find(male, 'pace')?.verdict).toBe('on_track');
    expect(find(female, 'pace')?.verdict).toBe('fast');
  });

  it('treats a recomp as on track when the scale barely moves', () => {
    const review = reviewTraining(input({ goal: 'recomp', weighIns: weighIns(82, 0.02) }));
    expect(find(review, 'pace')?.verdict).toBe('on_track');
  });

  /**
   * Bodyweight can go either way on a strength phase and neither is a problem.
   * Judging it by the scale would be judging the wrong thing entirely.
   */
  it('says nothing about the scale on a strength goal', () => {
    const review = reviewTraining(input({ goal: 'get_stronger', weighIns: weighIns(82, 0.8) }));
    expect(kinds(review)).not.toContain('pace');
  });

  it('says nothing when there are no weigh-ins', () => {
    expect(kinds(reviewTraining(input({ goal: 'lose_fat', weighIns: [] })))).not.toContain('pace');
  });

  it('says nothing when the trend refuses to state a rate', () => {
    // Under a fortnight `weightTrend` returns no rate, and a verdict built on
    // one would be noise wearing a decimal point.
    const short: WeighIn[] = [
      { at: daysAgo(8), weightKg: 84 },
      { at: daysAgo(1), weightKg: 82 },
    ];
    expect(kinds(reviewTraining(input({ goal: 'lose_fat', weighIns: short })))).not.toContain(
      'pace',
    );
  });
});

describe('what it will not say', () => {
  /**
   * ADR-0035, which does not unlock. Nothing here may be derived from how much
   * somebody weighs — only from what their weight is doing against a goal they
   * chose.
   */
  it('gives the same verdict to two people at very different weights', () => {
    // Both losing 0.75% of bodyweight a week.
    const heavy = reviewTraining(input({ goal: 'lose_fat', weighIns: weighIns(120, 0.9) }));
    const light = reviewTraining(input({ goal: 'lose_fat', weighIns: weighIns(55, 0.41) }));
    expect(find(heavy, 'pace')?.verdict).toBe(find(light, 'pace')?.verdict);
    expect(find(heavy, 'pace')?.verdict).toBe('on_track');
  });

  it('never reports on a height, because it is never given one', () => {
    // Structural: there is no height on ReviewInput at all.
    expect(Object.keys(input())).not.toContain('heightCm');
  });
});

describe('what gets shown first', () => {
  it('puts going the wrong way above everything else', () => {
    const review = reviewTraining(
      input({
        goal: 'lose_fat',
        daysPerWeek: 6,
        weighIns: weighIns(82, -0.5),
        sets: log(['bench'], { sessions: 5, overDays: 28, setsEach: 3 }),
      }),
    );
    expect(review.observations[0]?.kind).toBe('pace');
  });

  it('puts showing up above what was trained', () => {
    const review = reviewTraining(
      input({ daysPerWeek: 6, sets: log(['bench'], { sessions: 5, overDays: 28 }) }),
    );
    const order = kinds(review);
    expect(order.indexOf('consistency')).toBeLessThan(order.indexOf('group_short'));
  });

  /**
   * The deliberate thumb on the scale. A review that is three warnings every
   * time is one somebody stops opening after a fortnight — and they stop
   * opening it precisely when the training is hard, which is when it had
   * something worth saying.
   */
  it('finds room for good news among the warnings', () => {
    const review = reviewTraining(
      input({
        goal: 'lose_fat',
        daysPerWeek: 6,
        weighIns: weighIns(82, -0.5),
        sets: [
          ...log(['bench'], { sessions: 5, overDays: 28 }),
          ...[0, 1, 2, 3].map((s) =>
            set({
              sessionId: `g${String(s)}`,
              exerciseId: 'squat',
              performedAt: daysAgo(28 - s * 7),
              weightKg: 100 + s * 5,
            }),
          ),
        ],
      }),
    );

    const top = review.observations.slice(0, 3).map(toneOf);
    expect(top).toContain('good');
  });

  it('does not invent good news that is not there', () => {
    const review = reviewTraining(
      input({ daysPerWeek: 6, sets: log(['bench'], { sessions: 5, overDays: 28 }) }),
    );
    expect(review.observations.map(toneOf)).not.toContain('good');
  });

  it('keeps every observation, so a screen decides how many to show', () => {
    const review = reviewTraining(
      input({ daysPerWeek: 6, sets: log(['bench'], { sessions: 5, overDays: 28 }) }),
    );
    expect(review.observations.length).toBeGreaterThan(1);
    expect(new Set(review.observations).size).toBe(review.observations.length);
  });
});

describe('every observation has a tone', () => {
  it('classifies all of them', () => {
    const all: Observation[] = [
      { kind: 'too_soon', sessions: 1, needed: 4, days: 0, neededDays: 12 },
      { kind: 'consistency', perWeek: 1, target: 4, weeks: 4 },
      { kind: 'group_short', group: 'back', perWeek: 2, target: 16 },
      { kind: 'group_over', group: 'chest', perWeek: 30, target: 16 },
      {
        kind: 'lift_climbing',
        exerciseId: 'a',
        name: 'A',
        from: { loadType: 'external', weightKg: 80, reps: 8 },
        to: { loadType: 'external', weightKg: 90, reps: 8 },
        timed: false,
        sessions: 5,
      },
      {
        kind: 'lift_stalled',
        exerciseId: 'b',
        name: 'B',
        best: { loadType: 'external', weightKg: 100, reps: 5 },
        timed: false,
        sessionsSince: 4,
        daysSince: 28,
      },
      { kind: 'pace', verdict: 'on_track', perWeekKg: -0.5, goal: 'lose_fat' },
    ];
    for (const observation of all) {
      expect(['good', 'neutral', 'warning'], observation.kind).toContain(toneOf(observation));
    }
  });
});
