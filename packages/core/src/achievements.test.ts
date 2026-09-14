import { describe, expect, it } from 'vitest';
import {
  ACHIEVEMENT_KEYS,
  achievements,
  type Achievement,
  type AchievementInput,
  type AchievementSession,
  type ClubLift,
} from './achievements.js';
import { EMPTY_BOUT, type Bout, type CardioKind, type LoggedBout } from './cardio.js';
import type { HistoricalSet } from './progress.js';

/** Monday 14 September 2026, mid-afternoon. Weeks start on Monday. */
const NOW = new Date(2026, 8, 14, 15, 0);

function day(month: number, date: number, hour = 18, minute = 0, year = 2026): Date {
  return new Date(year, month, date, hour, minute);
}

function session(at: Date, overrides: Partial<AchievementSession> = {}): AchievementSession {
  return {
    sessionId: `s-${at.toISOString()}`,
    startedAt: at,
    firstSetAt: at,
    lastSetAt: new Date(at.getTime() + 60 * 60 * 1000),
    finished: true,
    clockKnown: true,
    ...overrides,
  };
}

function set(
  at: Date,
  exerciseId: string,
  weightKg: number,
  reps: number,
  overrides: Partial<HistoricalSet> = {},
): HistoricalSet {
  return {
    sessionId: `s-${at.toISOString()}`,
    exerciseId,
    performedAt: at,
    bodyweightKg: 80,
    setType: 'working',
    loadType: 'external',
    weightKg,
    reps,
    isCompleted: true,
    ...overrides,
  };
}

function bout(at: Date, kind: CardioKind, fields: Partial<Bout>): LoggedBout {
  return {
    sessionId: `s-${at.toISOString()}`,
    performedAt: at,
    kind,
    bout: { ...EMPTY_BOUT, ...fields },
    bodyweightKg: 80,
  };
}

const LIFTS = new Map<string, ClubLift>([
  ['bench', 'bench'],
  ['squat', 'squat'],
  ['deadlift', 'deadlift'],
  ['press', 'overhead'],
  ['pull-up', 'pull_up'],
]);

function input(overrides: Partial<AchievementInput> = {}): AchievementInput {
  return {
    sessions: [],
    sets: [],
    bouts: [],
    lifts: LIFTS,
    groups: new Map(),
    goals: [],
    birthDate: null,
    bodyweightKg: 80,
    unitSystem: 'metric',
    weekStartsOn: 1,
    ...overrides,
  };
}

function find(list: readonly Achievement[], key: string): Achievement {
  const found = list.find((each) => each.key === key);
  if (found === undefined) throw new Error(`No achievement ${key}`);
  return found;
}

function badge(key: string, overrides: Partial<AchievementInput> = {}, now = NOW): Achievement {
  return find(achievements(input(overrides), now), key);
}

describe('the catalogue', () => {
  it('has the 52 agreed, each once, the birthday the only secret', () => {
    const all = achievements(input(), NOW);
    expect(all).toHaveLength(52);
    expect(new Set(ACHIEVEMENT_KEYS).size).toBe(52);
    expect(all.filter((each) => each.secret).map((each) => each.key)).toEqual(['birthday-pump']);
    const count = (category: string) => all.filter((each) => each.category === category).length;
    expect([count('milestones'), count('strength'), count('consistency'), count('cardio')]).toEqual(
      [12, 15, 13, 11],
    );
  });

  it('keeps the keys the profile stores to letters, digits and hyphens', () => {
    for (const key of ACHIEVEMENT_KEYS) expect(key).toMatch(/^[a-z0-9-]+$/);
  });

  it('earns nothing on an empty log', () => {
    expect(achievements(input(), NOW).filter((each) => each.earnedAt !== null)).toEqual([]);
  });
});

describe('milestones', () => {
  it('dates a count of workouts to the workout that reached it', () => {
    const sessions = Array.from({ length: 10 }, (_, index) => session(day(7, index + 1)));
    expect(badge('day-one', { sessions }).earnedAt).toEqual(day(7, 1));
    expect(badge('double-digits', { sessions }).earnedAt).toEqual(day(7, 10));
    expect(badge('quarter-century', { sessions }).progress).toEqual({
      current: 10,
      target: 25,
      unit: 'workouts',
    });
  });

  it('waits for Finish before a workout counts as one', () => {
    const open = session(day(8, 14, 9), { finished: false });
    expect(badge('day-one', { sessions: [open] }).earnedAt).toBeNull();
  });

  it('carries no progress once earned', () => {
    const earned = badge('day-one', { sessions: [session(day(7, 1))] });
    expect(earned.progress).toBeNull();
    expect(earned.nextChance).toBeNull();
  });

  it('counts records the way the logger does: the first workout sets the bar, a tie is not one', () => {
    const sets = [
      set(day(7, 1), 'bench', 80, 5),
      set(day(7, 1), 'bench', 85, 5), // first workout on it: the bar, not a record
      set(day(7, 8), 'bench', 85, 5), // a tie
      set(day(7, 15), 'bench', 87.5, 5), // a record
      set(day(7, 15), 'bench', 87.5, 6), // a better set at the same weight: another
      set(day(7, 22), 'bench', 40, 10, { setType: 'warmup' }),
    ];
    expect(badge('record-breaker', { sets }).earnedAt).toEqual(day(7, 15));
    expect(badge('pr-machine', { sets }).progress?.current).toBe(2);
  });

  it('adds up tonnage, in tonnes or in US tons', () => {
    const sets = [set(day(7, 1), 'squat', 100, 50), set(day(7, 8), 'squat', 100, 50)];
    expect(badge('heavy-mover', { sets }).earnedAt).toEqual(day(7, 8));
    // 10 US tons is 20,000 lb, 9,072 kg: also past only with the second workout.
    expect(badge('heavy-mover', { sets, unitSystem: 'imperial' }).earnedAt).toEqual(day(7, 8));
    expect(badge('heavy-mover', { unitSystem: 'imperial' }).description).toBe(
      'Lift 10 tons in total, about two elephants',
    );
    expect(badge('heavy-mover').description).toBe('Lift 10 tonnes in total, about two elephants');
  });
});

describe('strength clubs', () => {
  it('awards a plate club for one rep at the weight, in the finished or the current workout', () => {
    const sets = [set(day(7, 1), 'bench', 97.5, 3), set(day(8, 14, 9), 'bench', 100, 1)];
    expect(badge('two-plate-bench', { sets }).earnedAt).toEqual(day(8, 14, 9));
    expect(badge('three-plate-bench', { sets }).progress).toEqual({
      current: 100,
      target: 140,
      unit: 'weight',
    });
  });

  it('sets pounds users the pound numbers, 225 lb forgiven its rounding', () => {
    // 225 lb, as stored: 102.06 kg.
    const sets = [set(day(7, 1), 'bench', 102.06, 1)];
    expect(badge('two-plate-bench', { sets, unitSystem: 'imperial' }).earnedAt).toEqual(day(7, 1));
    expect(badge('two-plate-bench', { unitSystem: 'imperial' }).description).toBe(
      'Bench press 225 lb',
    );
    // 100 kg is not 225 lb.
    const hundred = [set(day(7, 1), 'bench', 100, 1)];
    expect(badge('two-plate-bench', { sets: hundred, unitSystem: 'imperial' }).earnedAt).toBeNull();
  });

  it('ignores warm-ups, other exercises and sets of no reps', () => {
    const sets = [
      set(day(7, 1), 'bench', 100, 1, { setType: 'warmup' }),
      set(day(7, 1), 'dumbbell-bench', 100, 5),
      set(day(7, 1), 'bench', 100, 0),
    ];
    expect(badge('two-plate-bench', { sets }).earnedAt).toBeNull();
  });

  it('holds a bodyweight club to the bodyweight on the day', () => {
    const sets = [
      set(day(7, 1), 'deadlift', 170, 1, { bodyweightKg: 90 }),
      set(day(7, 8), 'deadlift', 170, 1, { bodyweightKg: 85 }),
    ];
    const earned = badge('double-trouble', { sets, bodyweightKg: 84 });
    expect(earned.earnedAt).toEqual(day(7, 8));
    // Not earned: measured against today's weight.
    const bench = badge('bench-your-body', { sets: [set(day(7, 1), 'bench', 70, 5)] });
    expect(bench.progress).toEqual({ current: 70, target: 80, unit: 'weight' });
    expect(badge('bench-your-body', { bodyweightKg: null }).progress).toBeNull();
  });

  it('adds the best bench, squat and deadlift for the total', () => {
    const sets = [
      set(day(7, 1), 'bench', 120, 1),
      set(day(7, 2), 'squat', 170, 1),
      set(day(7, 3), 'deadlift', 200, 1),
      set(day(7, 10), 'deadlift', 210, 1),
    ];
    expect(badge('total-club', { sets }).earnedAt).toEqual(day(7, 10));
    expect(badge('total-club', { unitSystem: 'imperial' }).name).toBe('The 1,000 lb Club');
    // 1,000 lb is 453.6 kg, reached with the first deadlift.
    expect(badge('total-club', { sets, unitSystem: 'imperial' }).earnedAt).toEqual(day(7, 3));
  });

  it('counts ten pull-ups, but not assisted ones', () => {
    const assisted = [set(day(7, 1), 'pull-up', 20, 12, { loadType: 'assisted' })];
    expect(badge('ten-clean', { sets: assisted }).earnedAt).toBeNull();
    const clean = [set(day(7, 2), 'pull-up', 0, 10, { loadType: 'bodyweight' })];
    expect(badge('ten-clean', { sets: clean }).earnedAt).toEqual(day(7, 2));
  });
});

describe('consistency', () => {
  it('makes a Gym Rat of five workouts in one week', () => {
    const sessions = [7, 8, 9, 10, 11].map((date) => session(day(8, date)));
    expect(badge('gym-rat', { sessions }).earnedAt).toEqual(day(8, 11));
    // Across two weeks, it is not.
    const split = [10, 11, 12, 13, 14].map((date) => session(day(8, date, 7)));
    expect(badge('gym-rat', { sessions: split }).progress?.current).toBe(1);
  });

  it('holds each week to the goal in force, and lets this week finish', () => {
    // Three weeks at 2 a week under a 2-day goal, then a 4-day goal from the
    // fourth week, met this week (the fourth) only twice so far.
    const sessions = [
      ...[24, 26].map((date) => session(day(7, date))),
      ...[31, 33].map((date) => session(day(7, date))),
      ...[7, 9].map((date) => session(day(8, date))),
      session(day(8, 14, 9)),
      session(day(8, 14, 12)),
    ];
    const goals = [
      { startedAt: day(6, 1), daysPerWeek: 2 },
      { startedAt: day(8, 14, 8), daysPerWeek: 4 },
    ];
    const roll = badge('on-a-roll', { sessions, goals });
    expect(roll.earnedAt).toBeNull();
    expect(roll.progress?.current).toBe(3);
    // Under the old goal this week would already count, and the badge with it.
    const kept = badge('on-a-roll', { sessions, goals: goals.slice(0, 1) });
    expect(kept.earnedAt).toEqual(day(8, 14, 12));
  });

  it('breaks a streak on a week that ended short', () => {
    const sessions = [
      ...[3, 5, 7].map((date) => session(day(7, date))),
      ...[17, 19, 21].map((date) => session(day(7, date))),
      ...[24, 26, 28].map((date) => session(day(7, date))),
    ];
    // Three days a week by default; the week of 10 August had none.
    expect(badge('on-a-roll', { sessions }).progress?.current).toBe(0);
  });

  it('counts seven days in a row, and the run still going', () => {
    const week = [1, 2, 3, 4, 5, 6, 7].map((date) => session(day(8, date)));
    expect(badge('no-days-off', { sessions: week }).earnedAt).toEqual(day(8, 7));
    const going = [12, 13].map((date) => session(day(8, date)));
    expect(badge('no-days-off', { sessions: going }).progress?.current).toBe(2);
  });

  it('welcomes back somebody who was away 30 days', () => {
    const sessions = [session(day(6, 1)), session(day(6, 20)), session(day(7, 19))];
    expect(badge('comeback-kid', { sessions }).earnedAt).toEqual(day(7, 19));
  });

  it('reads the time of day from the sets, never from a workout logged afterwards', () => {
    const dawn = session(day(8, 1, 5, 10), { firstSetAt: day(8, 1, 5, 20) });
    expect(badge('early-bird', { sessions: [dawn] }).earnedAt).toEqual(day(8, 1, 5, 20));
    const past = session(day(8, 2, 5), { clockKnown: false });
    expect(badge('early-bird', { sessions: [past] }).earnedAt).toBeNull();

    const late = session(day(8, 3, 23), {
      firstSetAt: day(8, 3, 23, 10),
      lastSetAt: day(8, 4, 0, 20),
    });
    expect(badge('night-owl', { sessions: [late] }).earnedAt).toEqual(day(8, 4, 0, 20));
    expect(badge('night-owl', { sessions: [session(day(8, 5, 22))] }).earnedAt).toBeNull();
  });

  it('wants both days of one weekend', () => {
    const sessions = [session(day(8, 5)), session(day(8, 6))];
    expect(badge('weekend-warrior', { sessions }).earnedAt).toEqual(day(8, 6));
    const apart = [session(day(8, 6)), session(day(8, 12))];
    const waiting = badge('weekend-warrior', { sessions: apart });
    expect(waiting.earnedAt).toBeNull();
    expect(waiting.nextChance).toEqual(new Date(2026, 8, 19));
  });

  it('names the next chance at a date, 29 February waiting for 2028', () => {
    expect(badge('new-year-same-me').nextChance).toEqual(new Date(2027, 0, 1));
    expect(badge('jingle-lifts').nextChance).toEqual(new Date(2026, 11, 25));
    expect(badge('leap-lifter').nextChance).toEqual(new Date(2028, 1, 29));
    const newYear = [session(day(0, 1, 10))];
    expect(badge('new-year-same-me', { sessions: newYear }).earnedAt).toEqual(day(0, 1, 10));
  });

  it('finds a workout on the birthday, the 28th for somebody born on the 29th', () => {
    const birthDate = new Date('1999-09-12');
    expect(badge('birthday-pump', { sessions: [session(day(8, 12))], birthDate }).earnedAt).toEqual(
      day(8, 12),
    );
    const leapling = new Date('2000-02-29');
    const sessions = [session(day(1, 28, 18, 0, 2026))];
    expect(badge('birthday-pump', { sessions, birthDate: leapling }).earnedAt).toEqual(
      day(1, 28, 18, 0, 2026),
    );
    expect(badge('birthday-pump', { sessions }).earnedAt).toBeNull();
  });
});

describe('cardio and variety', () => {
  it('counts one long bout for The 2K and the 5K', () => {
    const bouts = [
      bout(day(7, 1), 'rower', { distanceM: 1500 }),
      bout(day(7, 8), 'rower', { distanceM: 2000 }),
      bout(day(7, 9), 'treadmill', { distanceM: 4000 }),
    ];
    expect(badge('heart-starter', { bouts }).earnedAt).toEqual(day(7, 1));
    expect(badge('the-2k', { bouts }).earnedAt).toEqual(day(7, 8));
    expect(badge('five-k-finisher', { bouts }).progress).toEqual({
      current: 4000,
      target: 5000,
      unit: 'distance',
    });
  });

  it('adds distance up for the marathon, 60 miles or 100 km for the road trip', () => {
    const bouts = Array.from({ length: 10 }, (_, index) =>
      bout(day(7, index + 1), 'bike', { distanceM: 10_000 }),
    );
    expect(badge('marathoner', { bouts }).earnedAt).toEqual(day(7, 5));
    expect(badge('road-tripper', { bouts }).earnedAt).toEqual(day(7, 10));
    expect(badge('road-tripper', { bouts, unitSystem: 'imperial' }).earnedAt).toEqual(day(7, 10));
    expect(badge('road-tripper', { unitSystem: 'imperial' }).description).toBe(
      'Cover 60 miles of cardio in total',
    );
  });

  it('climbs Everest on stairs and incline', () => {
    const bouts = [
      // 2,500 floors of 3.2 m: 8,000 m.
      bout(day(7, 1), 'stair_climber', { floors: 2500 }),
      // 10 km at 10%: 1,000 m.
      bout(day(7, 2), 'treadmill', { distanceM: 10_000, inclinePercent: 10 }),
    ];
    expect(badge('everest', { bouts }).earnedAt).toEqual(day(7, 2));
  });

  it('adds a workout’s calories for the Furnace', () => {
    const at = day(7, 1);
    const bouts = [
      bout(at, 'bike', { caloriesKcal: 300 }),
      bout(at, 'rower', { caloriesKcal: 250 }),
    ];
    expect(badge('furnace', { bouts }).earnedAt).toEqual(at);
  });

  it('collects the five machines', () => {
    const kinds: CardioKind[] = ['treadmill', 'bike', 'rower', 'ski_erg', 'stair_climber'];
    const bouts = kinds.map((kind, index) => bout(day(7, index + 1), kind, {}));
    expect(badge('machine-collector', { bouts }).earnedAt).toEqual(day(7, 5));
    expect(badge('machine-collector', { bouts: bouts.slice(0, 2) }).progress?.current).toBe(2);
  });

  it('spots lifting and cardio in one workout', () => {
    const at = day(7, 1);
    const earned = badge('hybrid-athlete', {
      sets: [set(at, 'squat', 100, 5)],
      bouts: [bout(at, 'bike', {}), bout(day(7, 2), 'rower', {})],
    });
    expect(earned.earnedAt).toEqual(at);
  });

  it('counts different exercises, a machine as one', () => {
    const sets = Array.from({ length: 24 }, (_, index) =>
      set(day(7, 1), `e-${String(index)}`, 20, 10),
    );
    const bouts = [bout(day(7, 2), 'bike', {}), bout(day(7, 3), 'bike', {})];
    expect(badge('explorer', { sets, bouts }).earnedAt).toEqual(day(7, 2));
  });

  it('lights up every group some exercise trains, in one week', () => {
    const groups = new Map([
      ['bench', ['chest']],
      ['squat', ['quads', 'glutes']],
    ]);
    const sets = [set(day(8, 14, 9), 'bench', 60, 5), set(day(8, 14, 10), 'squat', 60, 5)];
    expect(badge('lit-up', { groups, sets }).earnedAt).toEqual(day(8, 14, 10));
    const half = badge('lit-up', { groups, sets: sets.slice(0, 1) });
    expect(half.progress).toEqual({ current: 1, target: 3, unit: 'groups' });
  });
});
