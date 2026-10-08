import { describe, expect, it } from 'vitest';
import {
  boardGap,
  boardScore,
  boardSince,
  boardSpans,
  boardTotals,
  liftedKg,
  rankBoard,
  tallyWorkouts,
  type BoardSet,
  type BoardTotals,
  type BoardWorkout,
} from './leaderboard.js';

/** Local time, never a `Z` string — see the note at the top of week.test.ts. */
function local(year: number, month: number, day: number, hour = 12, minute = 0): Date {
  return new Date(year, month - 1, day, hour, minute);
}

// 2026-10-05 is a Monday; "now" is the Wednesday after it.
const NOW = local(2026, 10, 7, 18);

function workout(startedAt: Date, overrides: Partial<BoardWorkout> = {}): BoardWorkout {
  return {
    startedAt,
    clockKnown: true,
    firstSetAt: startedAt,
    lastSetAt: new Date(startedAt.getTime() + 50 * 60_000),
    sets: 12,
    liftedKg: 4000,
    ...overrides,
  };
}

describe('weight lifted', () => {
  const set = {
    setType: 'working',
    isCompleted: true,
    loadType: 'external',
    weightKg: 100,
    reps: 5,
  } as const;

  it('is load × reps on a ticked working set', () => {
    expect(liftedKg(set)).toBe(500);
    expect(liftedKg({ ...set, setType: 'amrap' })).toBe(500);
  });

  it('leaves out warm-ups and sets never ticked', () => {
    expect(liftedKg({ ...set, setType: 'warmup' })).toBe(0);
    expect(liftedKg({ ...set, isCompleted: false })).toBe(0);
  });

  it('counts the plate on a weighted pull-up and never the body under it', () => {
    expect(liftedKg({ ...set, loadType: 'bodyweight_plus', weightKg: 20 })).toBe(100);
    expect(liftedKg({ ...set, loadType: 'bodyweight', weightKg: 0 })).toBe(0);
    expect(liftedKg({ ...set, loadType: 'assisted', weightKg: 30 })).toBe(0);
  });

  it('adds nothing for a nonsense number', () => {
    expect(liftedKg({ ...set, weightKg: Number.NaN })).toBe(0);
    expect(liftedKg({ ...set, reps: -3 })).toBe(0);
  });
});

describe('tallying your own workouts', () => {
  const start = local(2026, 10, 6, 18);
  const at = (minutes: number) => new Date(start.getTime() + minutes * 60_000);
  function set(overrides: Partial<BoardSet>): BoardSet {
    return {
      sessionId: 's1',
      startedAt: start,
      clockKnown: true,
      setType: 'working',
      isCompleted: true,
      loadType: 'external',
      weightKg: 100,
      reps: 5,
      completedAt: at(5),
      durationSeconds: null,
      cardio: false,
      ...overrides,
    };
  }

  it('gives each workout its sets, its weight and its clock', () => {
    const tallies = tallyWorkouts([
      set({ setType: 'warmup', weightKg: 60, completedAt: at(1) }),
      set({ completedAt: at(5) }),
      set({ loadType: 'bodyweight_plus', weightKg: 20, completedAt: at(10) }),
      set({ loadType: 'bodyweight', weightKg: 0, completedAt: at(15) }),
      set({ cardio: true, weightKg: 0, reps: 0, durationSeconds: 600, completedAt: at(45) }),
    ]);
    expect(tallies).toEqual([
      {
        startedAt: start,
        clockKnown: true,
        firstSetAt: at(5),
        lastSetAt: at(45),
        sets: 3,
        liftedKg: 600,
      },
    ]);
  });

  it('starts the clock when a bout began, not when it was ticked', () => {
    const [tally] = tallyWorkouts([
      set({ cardio: true, weightKg: 0, reps: 0, durationSeconds: 1800, completedAt: at(30) }),
    ]);
    expect(tally?.firstSetAt).toEqual(at(0));
    expect(tally?.sets).toBe(0);
  });

  it('has no workout made only of warm-ups', () => {
    expect(tallyWorkouts([set({ setType: 'warmup' })])).toEqual([]);
  });

  it('keeps workouts apart', () => {
    const tallies = tallyWorkouts([set({}), set({ sessionId: 's2', clockKnown: false })]);
    expect(tallies.map((tally) => tally.clockKnown)).toEqual([true, false]);
  });
});

describe('a period’s totals', () => {
  const week = boardSpans('week', NOW, 1).current;

  it('adds up every workout that started inside the span', () => {
    const totals = boardTotals(
      [workout(local(2026, 10, 5, 9)), workout(local(2026, 10, 7, 7), { sets: 8, liftedKg: 2500 })],
      week,
    );
    expect(totals).toEqual({ workouts: 2, liftedKg: 6500, sets: 20, minutes: 100 });
  });

  it('leaves out a workout from last week, even one that ran past midnight into this', () => {
    const sunday = local(2026, 10, 4, 23, 30);
    const totals = boardTotals([workout(sunday)], week);
    expect(totals.workouts).toBe(0);
  });

  it('gives a workout logged afterwards no time, and everything else', () => {
    const totals = boardTotals([workout(local(2026, 10, 6), { clockKnown: false })], week);
    expect(totals).toEqual({ workouts: 1, liftedKg: 4000, sets: 12, minutes: 0 });
  });

  it('counts a workout too short to time as a workout', () => {
    const at = local(2026, 10, 6);
    const totals = boardTotals([workout(at, { lastSetAt: at })], week);
    expect(totals.workouts).toBe(1);
    expect(totals.minutes).toBe(0);
  });
});

describe('scores', () => {
  const totals: BoardTotals = { workouts: 3, liftedKg: 12_450.4, sets: 41, minutes: 185 };

  it('ranks weight in whole units of what the viewer reads', () => {
    expect(boardScore(totals, 'lifted', 'metric')).toBe(12_450);
    expect(boardScore(totals, 'lifted', 'imperial')).toBe(27_448);
  });

  it('passes the counts through', () => {
    expect(boardScore(totals, 'workouts', 'metric')).toBe(3);
    expect(boardScore(totals, 'sets', 'metric')).toBe(41);
    expect(boardScore(totals, 'minutes', 'metric')).toBe(185);
  });
});

describe('periods', () => {
  it('runs a week from the viewer’s own week start', () => {
    expect(boardSpans('week', NOW, 1)).toEqual({
      current: { start: local(2026, 10, 5, 0), end: local(2026, 10, 12, 0) },
      previous: { start: local(2026, 9, 28, 0), end: local(2026, 10, 5, 0) },
    });
    expect(boardSpans('week', NOW, 0).current.start).toEqual(local(2026, 10, 4, 0));
  });

  it('runs a month from the first', () => {
    expect(boardSpans('month', NOW, 1)).toEqual({
      current: { start: local(2026, 10, 1, 0), end: local(2026, 11, 1, 0) },
      previous: { start: local(2026, 9, 1, 0), end: local(2026, 10, 1, 0) },
    });
  });

  it('asks for enough history to cover last week and last month, whichever is earlier', () => {
    expect(boardSince(NOW)).toEqual(local(2026, 9, 1, 0));
    // Early in a month last week reaches back into the month before; last month is earlier still.
    const early = local(2026, 10, 2, 9);
    expect(boardSince(early).getTime()).toBeLessThanOrEqual(
      boardSpans('week', early, 1).previous.start.getTime(),
    );
    expect(boardSince(local(2026, 1, 15))).toEqual(local(2025, 12, 1, 0));
  });
});

describe('ranking', () => {
  it('puts the most first and shares a place on a tie', () => {
    const ranked = rankBoard([
      { id: 'sam', score: 3 },
      { id: 'alex', score: 5 },
      { id: 'jordan', score: 3 },
      { id: 'you', score: 1 },
    ]);
    expect(ranked.map((entry) => [entry.id, entry.rank])).toEqual([
      ['alex', 1],
      ['sam', 2],
      ['jordan', 2],
      ['you', 4],
    ]);
  });

  it('keeps a tie in the order it was given', () => {
    const ranked = rankBoard([
      { id: 'b', score: 2 },
      { id: 'a', score: 2 },
    ]);
    expect(ranked.map((entry) => entry.id)).toEqual(['b', 'a']);
  });

  it('gives nobody a place for doing nothing', () => {
    const ranked = rankBoard([
      { id: 'alex', score: 0 },
      { id: 'you', score: 2 },
      { id: 'sam', score: 0 },
    ]);
    expect(ranked.map((entry) => [entry.id, entry.rank])).toEqual([
      ['you', 1],
      ['alex', null],
      ['sam', null],
    ]);
  });
});

describe('the gap to the next place', () => {
  const board = (scores: Record<string, number>) =>
    rankBoard(Object.entries(scores).map(([id, score]) => ({ id, score })));

  it('is the nearest score above yours', () => {
    expect(boardGap(board({ alex: 9, sam: 6, you: 4 }), 'you')).toEqual({
      kind: 'behind',
      id: 'sam',
      by: 2,
    });
  });

  it('is the lowest score on the board when you have done nothing yet', () => {
    expect(boardGap(board({ alex: 9, sam: 3, you: 0 }), 'you')).toEqual({
      kind: 'behind',
      id: 'sam',
      by: 3,
    });
  });

  it('says level when you share first place', () => {
    expect(boardGap(board({ alex: 5, you: 5, sam: 1 }), 'you')).toEqual({
      kind: 'level',
      id: 'alex',
    });
  });

  it('says by how much you lead', () => {
    expect(boardGap(board({ you: 8, alex: 5, sam: 5 }), 'you')).toEqual({
      kind: 'ahead',
      id: 'alex',
      by: 3,
    });
  });

  it('has nothing to say when nobody has done anything, or you are alone', () => {
    expect(boardGap(board({ you: 0, alex: 0 }), 'you')).toBeNull();
    expect(boardGap(board({ you: 4 }), 'you')).toBeNull();
  });
});
