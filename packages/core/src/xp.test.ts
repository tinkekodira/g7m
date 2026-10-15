import { describe, expect, it } from 'vitest';
import type { Achievement } from './achievements.js';
import { EMPTY_BOUT, type LoggedBout } from './cardio.js';
import type { HistoricalSet } from './progress.js';
import {
  LEVEL_CURVE,
  XP,
  levelFor,
  xpForLevel,
  xpLedger,
  type XpInput,
  type XpSession,
} from './xp.js';

/** Weeks start on Monday; 14 September 2026 is one. */
function day(date: number, hour = 18, month = 8): Date {
  return new Date(2026, month, date, hour, 0);
}

function session(at: Date, overrides: Partial<XpSession> = {}): XpSession {
  return {
    sessionId: `s-${at.toISOString()}`,
    startedAt: at,
    loggedAt: at,
    backdated: false,
    finished: true,
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

/** `count` working sets of one exercise at one weight. */
function sets(at: Date, count: number, exerciseId = 'bench', weightKg = 60): HistoricalSet[] {
  return Array.from({ length: count }, () => set(at, exerciseId, weightKg, 8));
}

function input(overrides: Partial<XpInput> = {}): XpInput {
  return {
    sessions: [],
    sets: [],
    bouts: [],
    goals: [],
    achievements: [],
    weekStartsOn: 1,
    ...overrides,
  };
}

/** A plain workout: started, three sets of bench, finished. */
function workout(at: Date, setCount = 3) {
  return { sessions: [session(at)], sets: sets(at, setCount) };
}

function total(overrides: Partial<XpInput>): number {
  return xpLedger(input(overrides)).total;
}

function sourceTotal(overrides: Partial<XpInput>, source: string): number {
  return xpLedger(input(overrides))
    .entries.filter((entry) => entry.source === source)
    .reduce((sum, entry) => sum + entry.xp, 0);
}

describe('a workout', () => {
  it('earns 100, and 5 for each set', () => {
    expect(total(workout(day(14)))).toBe(XP.workout + 3 * XP.set);
  });

  it('earns nothing with fewer than three sets', () => {
    expect(total(workout(day(14), 2))).toBe(0);
  });

  it('does not count warm-ups or drops as sets', () => {
    const at = day(14);
    expect(
      total({
        sessions: [session(at)],
        sets: [
          ...sets(at, 2),
          set(at, 'bench', 40, 10, { setType: 'warmup' }),
          set(at, 'bench', 50, 6, { setType: 'dropset' }),
        ],
      }),
    ).toBe(0);
  });

  it('counts failure and AMRAP sets as sets', () => {
    const at = day(14);
    expect(
      total({
        sessions: [session(at)],
        sets: [
          set(at, 'bench', 60, 8),
          set(at, 'bench', 60, 8, { setType: 'failure' }),
          set(at, 'bench', 60, 8, { setType: 'amrap' }),
        ],
      }),
    ).toBe(XP.workout + 3 * XP.set);
  });

  it('counts ten minutes of cardio as a workout, and no sets for it', () => {
    const at = day(14);
    const bout = (seconds: number): LoggedBout => ({
      sessionId: session(at).sessionId,
      performedAt: at,
      kind: 'treadmill',
      bout: { ...EMPTY_BOUT, durationSeconds: seconds },
      bodyweightKg: 80,
    });
    expect(total({ sessions: [session(at)], bouts: [bout(300), bout(300)] })).toBe(XP.workout);
    expect(total({ sessions: [session(at)], bouts: [bout(599)] })).toBe(0);
    expect(total({ sessions: [session(at)], bouts: [{ ...bout(0), bout: EMPTY_BOUT }] })).toBe(0);
  });

  it('stops counting sets at 25', () => {
    expect(sourceTotal(workout(day(14), 40), 'sets')).toBe(25 * XP.set);
  });

  it('earns nothing until it is finished', () => {
    const at = day(14);
    expect(total({ sessions: [session(at, { finished: false })], sets: sets(at, 5) })).toBe(0);
  });

  it('ignores sets of a workout it was not given', () => {
    expect(total({ sets: sets(day(14), 5) })).toBe(0);
  });

  it('counts two a day, not three', () => {
    const times = [day(14, 7), day(14, 12), day(14, 19)];
    const awarded = xpLedger(
      input({
        sessions: times.map((at) => session(at)),
        sets: times.flatMap((at) => sets(at, 3)),
      }),
    ).entries.filter((entry) => entry.source === 'workout');
    expect(awarded.map((entry) => entry.at)).toEqual([day(14, 7), day(14, 12)]);
  });

  it('does not let a workout too small to count use up the day', () => {
    const small = day(14, 7);
    const real = [day(14, 12), day(14, 19)];
    const awarded = xpLedger(
      input({
        sessions: [session(small), ...real.map((at) => session(at))],
        sets: [...sets(small, 1), ...real.flatMap((at) => sets(at, 3))],
      }),
    ).entries.filter((entry) => entry.source === 'workout');
    expect(awarded).toHaveLength(2);
  });

  it('takes its XP with it when it is deleted', () => {
    const a = day(14);
    const b = day(15);
    const both = total({
      sessions: [session(a), session(b)],
      sets: [...sets(a, 3), ...sets(b, 3)],
    });
    expect(total(workout(a))).toBeLessThan(both);
  });
});

describe('a workout logged afterwards', () => {
  const at = day(7, 12);
  const loggedOn = (date: Date) => ({
    sessions: [session(at, { backdated: true, loggedAt: date })],
    sets: sets(at, 3),
  });

  it('counts when logged within a week', () => {
    expect(total(loggedOn(new Date(2026, 8, 14, 12, 0)))).toBe(XP.workout + 3 * XP.set);
  });

  it('counts when logged before the noon it is filed at', () => {
    expect(total(loggedOn(new Date(2026, 8, 7, 9, 0)))).toBe(XP.workout + 3 * XP.set);
  });

  it('earns nothing when logged later than that', () => {
    expect(total(loggedOn(new Date(2026, 8, 14, 12, 1)))).toBe(0);
  });

  it('only matters when it was logged afterwards', () => {
    expect(
      total({
        sessions: [session(at, { loggedAt: new Date(2026, 9, 1) })],
        sets: sets(at, 3),
      }),
    ).toBe(XP.workout + 3 * XP.set);
  });

  it('still sets the bar for the next record', () => {
    const late = day(1, 12);
    const next = day(14);
    const records = sourceTotal(
      {
        sessions: [
          session(day(1, 9)),
          session(late, { backdated: true, loggedAt: day(14, 9) }),
          session(next),
        ],
        sets: [
          ...sets(day(1, 9), 3, 'bench', 60),
          ...sets(late, 3, 'bench', 100),
          ...sets(next, 3, 'bench', 80),
        ],
      },
      'records',
    );
    expect(records).toBe(0);
  });
});

describe('personal records', () => {
  it('earn 25 each, against everything before', () => {
    const first = day(14);
    const second = day(16);
    expect(
      sourceTotal(
        {
          sessions: [session(first), session(second)],
          sets: [
            ...sets(first, 3, 'bench', 60),
            ...sets(first, 3, 'squat', 80),
            ...sets(second, 3, 'bench', 65),
            ...sets(second, 3, 'squat', 85),
          ],
        },
        'records',
      ),
    ).toBe(2 * XP.record);
  });

  it('are not earned by a first attempt or a tie', () => {
    const first = day(14);
    const second = day(16);
    expect(
      sourceTotal(
        {
          sessions: [session(first), session(second)],
          sets: [...sets(first, 3, 'bench', 60), ...sets(second, 3, 'bench', 60)],
        },
        'records',
      ),
    ).toBe(0);
  });

  it('stop at four a workout', () => {
    const first = day(14);
    const second = day(16);
    const exercises = ['a', 'b', 'c', 'd', 'e', 'f'];
    expect(
      sourceTotal(
        {
          sessions: [session(first), session(second)],
          sets: exercises.flatMap((id) => [
            set(first, id, 50, 5),
            set(second, id, 55, 5),
            set(second, id, 60, 5),
          ]),
        },
        'records',
      ),
    ).toBe(4 * XP.record);
  });

  it('are judged against workouts that earned nothing too', () => {
    const day14 = [day(14, 7), day(14, 12)];
    const third = day(14, 19);
    const next = day(16);
    // The third workout of the 14th is past the day's two, but its 100 kg is
    // still the number the 16th has to beat.
    expect(
      sourceTotal(
        {
          sessions: [...day14.map((at) => session(at)), session(third), session(next)],
          sets: [
            ...day14.flatMap((at) => sets(at, 3, 'bench', 60)),
            ...sets(third, 3, 'bench', 100),
            ...sets(next, 3, 'bench', 80),
          ],
        },
        'records',
      ),
    ).toBe(0);
  });
});

describe('a week at the goal', () => {
  const week = [day(14), day(15), day(16)];

  it('earns 150 the day the goal is reached', () => {
    const awarded = xpLedger(
      input({
        sessions: week.map((at) => session(at)),
        sets: week.flatMap((at) => sets(at, 3)),
        goals: [{ startedAt: day(1), daysPerWeek: 3 }],
      }),
    ).entries.filter((entry) => entry.source === 'week');
    expect(awarded).toEqual([
      { source: 'week', xp: XP.week, at: day(16), sessionId: null, key: '2026-09-14' },
    ]);
  });

  it('counts days, not workouts', () => {
    const twice = [day(14, 7), day(14, 19), day(15)];
    expect(
      sourceTotal(
        {
          sessions: twice.map((at) => session(at)),
          sets: twice.flatMap((at) => sets(at, 3)),
          goals: [{ startedAt: day(1), daysPerWeek: 3 }],
        },
        'week',
      ),
    ).toBe(0);
  });

  it('holds a week to the goal in force when it ended', () => {
    expect(
      sourceTotal(
        {
          sessions: week.map((at) => session(at)),
          sets: week.flatMap((at) => sets(at, 3)),
          goals: [
            // Chosen the Tuesday after: too late for the week it would let off.
            { startedAt: day(22, 9), daysPerWeek: 3 },
            { startedAt: day(1), daysPerWeek: 5 },
          ],
        },
        'week',
      ),
    ).toBe(0);
  });

  it('uses the first goal for weeks before it, and three days with none', () => {
    const early = [day(1), day(2), day(3)];
    const base = {
      sessions: early.map((at) => session(at)),
      sets: early.flatMap((at) => sets(at, 3)),
    };
    expect(sourceTotal(base, 'week')).toBe(XP.week);
    expect(sourceTotal({ ...base, goals: [{ startedAt: day(20), daysPerWeek: 2 }] }, 'week')).toBe(
      XP.week,
    );
    expect(sourceTotal({ ...base, goals: [{ startedAt: day(20), daysPerWeek: 4 }] }, 'week')).toBe(
      0,
    );
  });

  it('earns once, however many days past the goal', () => {
    const many = [day(14), day(15), day(16), day(17), day(18)];
    expect(
      sourceTotal(
        {
          sessions: many.map((at) => session(at)),
          sets: many.flatMap((at) => sets(at, 3)),
          goals: [{ startedAt: day(1), daysPerWeek: 2 }],
        },
        'week',
      ),
    ).toBe(XP.week);
  });

  it('starts on the day the lifter says weeks start', () => {
    // Sunday 13th and Monday 14th: one week from Sunday, two from Monday.
    const pair = [day(13), day(14)];
    const base = {
      sessions: pair.map((at) => session(at)),
      sets: pair.flatMap((at) => sets(at, 3)),
      goals: [{ startedAt: day(1), daysPerWeek: 2 }],
    };
    expect(sourceTotal({ ...base, weekStartsOn: 0 }, 'week')).toBe(XP.week);
    expect(sourceTotal({ ...base, weekStartsOn: 1 }, 'week')).toBe(0);
  });
});

describe('achievements', () => {
  const badge = (key: string, earnedAt: Date | null, secret = false): Achievement => ({
    key,
    category: secret ? 'secret' : 'milestones',
    name: key,
    description: key,
    secret,
    earnedAt,
    progress: null,
    nextChance: null,
  });

  it('earn 100 each, on the day earned, but not the secret one or unearned ones', () => {
    const ledger = xpLedger(
      input({
        achievements: [
          badge('first-rep', day(14)),
          badge('centurion', null),
          badge('birthday-pump', day(15), true),
        ],
      }),
    );
    expect(ledger.entries).toEqual([
      { source: 'achievement', xp: XP.achievement, at: day(14), sessionId: null, key: 'first-rep' },
    ]);
    expect(ledger.total).toBe(XP.achievement);
  });
});

describe('the ledger', () => {
  it('is in date order and adds up', () => {
    const later = day(16);
    const earlier = day(14);
    const ledger = xpLedger(
      input({
        sessions: [session(later), session(earlier)],
        sets: [...sets(later, 3), ...sets(earlier, 3)],
      }),
    );
    const dates = ledger.entries.map((entry) => entry.at.getTime());
    expect(dates).toEqual([...dates].sort((a, b) => a - b));
    expect(ledger.total).toBe(ledger.entries.reduce((sum, entry) => sum + entry.xp, 0));
    expect(ledger.total).toBe(2 * (XP.workout + 3 * XP.set));
  });

  it('is empty with nothing logged', () => {
    expect(xpLedger(input())).toEqual({ total: 0, entries: [] });
  });
});

describe('levels', () => {
  it('step up by 50 from 450, flat at 2,000 from level 32', () => {
    expect(xpForLevel(1)).toBe(450);
    expect(xpForLevel(2)).toBe(500);
    expect(xpForLevel(31)).toBe(1950);
    expect(xpForLevel(32)).toBe(LEVEL_CURVE.cap);
    expect(xpForLevel(200)).toBe(LEVEL_CURVE.cap);
  });

  it('start at level 1', () => {
    expect(levelFor(0)).toEqual({ level: 1, xpIntoLevel: 0, xpForLevel: 450, progress: 0 });
  });

  it('go up exactly at the threshold', () => {
    expect(levelFor(449).level).toBe(1);
    expect(levelFor(450)).toEqual({ level: 2, xpIntoLevel: 0, xpForLevel: 500, progress: 0 });
    expect(levelFor(950).level).toBe(3);
  });

  it('report how far into a level', () => {
    expect(levelFor(700)).toEqual({ level: 2, xpIntoLevel: 250, xpForLevel: 500, progress: 0.5 });
  });

  it('agree with the curve on the flat part', () => {
    let threshold = 0;
    for (let level = 1; level < 60; level += 1) threshold += xpForLevel(level);
    expect(levelFor(threshold)).toMatchObject({ level: 60, xpIntoLevel: 0 });
    expect(levelFor(threshold - 1)).toMatchObject({ level: 59, xpIntoLevel: LEVEL_CURVE.cap - 1 });
    expect(levelFor(threshold + 2500)).toMatchObject({ level: 61, xpIntoLevel: 500 });
  });

  it('match the pace the curve was chosen for', () => {
    const toReach = (level: number) => {
      let sum = 0;
      for (let n = 1; n < level; n += 1) sum += xpForLevel(n);
      return sum;
    };
    expect(toReach(10)).toBe(5850);
    expect(toReach(20)).toBe(17_100);
    expect(toReach(30)).toBe(33_350);
  });

  it('treat nonsense as nothing', () => {
    expect(levelFor(-50).level).toBe(1);
    expect(levelFor(Number.NaN).level).toBe(1);
    expect(levelFor(1000.9)).toMatchObject({ level: 3, xpIntoLevel: 50 });
  });
});
