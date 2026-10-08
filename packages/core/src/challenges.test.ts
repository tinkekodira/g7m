import { describe, expect, it } from 'vitest';
import { challengeScore, challengeSpan, challengeStanding } from './challenges.js';
import type { BoardWorkout } from './leaderboard.js';

/** Local time, never a `Z` string — see the note at the top of week.test.ts. */
function local(year: number, month: number, day: number, hour = 12, minute = 0): Date {
  return new Date(year, month - 1, day, hour, minute);
}

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

// Accepted on Thursday 8 October 2026 at 19:30.
const STARTS = local(2026, 10, 8, 19, 30);
const SPAN = challengeSpan(STARTS);

describe('the seven days', () => {
  it('run from the moment it was accepted to the same moment a week later', () => {
    expect(SPAN).toEqual({ start: STARTS, end: local(2026, 10, 15, 19, 30) });
  });

  it('are seven days of elapsed time, even across a clock change', () => {
    // Europe's clocks go back on 25 October 2026; a challenge is the same
    // instant for both people, wherever they are.
    const across = challengeSpan(local(2026, 10, 22, 12));
    expect(across.end.getTime() - across.start.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });
});

describe('a side’s score', () => {
  const before = [workout(local(2026, 10, 8, 18, 0))];
  const inside = [workout(local(2026, 10, 9)), workout(local(2026, 10, 15, 19, 0))];
  const after = [workout(local(2026, 10, 15, 20, 0))];

  it('counts the workouts that started inside it, and none before or after', () => {
    const all = [...before, ...inside, ...after];
    expect(challengeScore(all, SPAN, 'workouts', 'most', 'metric')).toEqual({
      score: 2,
      usual: 0,
    });
  });

  it('counts the chosen stat by the leaderboard’s rules', () => {
    expect(challengeScore(inside, SPAN, 'sets', 'most', 'metric').score).toBe(24);
    expect(challengeScore(inside, SPAN, 'lifted', 'most', 'metric').score).toBe(8000);
  });

  it('is a percentage of a usual week when ranked by improvement', () => {
    // Four workouts in the four weeks before it began: one a week is usual.
    const usual = [11, 17, 24].map((day) => workout(local(2026, 9, day))).concat(before);
    expect(challengeScore([...usual, ...inside], SPAN, 'workouts', 'improved', 'metric')).toEqual({
      score: 200,
      usual: 1,
    });
  });

  it('has no score ranked by improvement with nothing to measure against', () => {
    expect(challengeScore(inside, SPAN, 'workouts', 'improved', 'metric')).toEqual({
      score: null,
      usual: 0,
    });
  });
});

describe('where you stand', () => {
  it('is the difference in the stat, ranked by the most', () => {
    expect(challengeStanding({ score: 5, usual: 0 }, { score: 3, usual: 0 }, 'most')).toEqual({
      kind: 'ahead',
      by: 2,
    });
    expect(challengeStanding({ score: 3, usual: 0 }, { score: 5, usual: 0 }, 'most')).toEqual({
      kind: 'behind',
      by: 2,
    });
    expect(challengeStanding({ score: 0, usual: 0 }, { score: 0, usual: 0 }, 'most')).toEqual({
      kind: 'level',
    });
  });

  it('is what the one behind has to do on their own usual, ranked by improvement', () => {
    // You at 150% of a usual of 2, Alex at 100% of a usual of 4: Alex needs
    // half a usual week more, which for Alex is two workouts.
    const you = { score: 150, usual: 2 };
    const alex = { score: 100, usual: 4 };
    expect(challengeStanding(you, alex, 'improved')).toEqual({ kind: 'ahead', by: 2 });
    // Seen from Alex's side, the same two, behind.
    expect(challengeStanding(alex, you, 'improved')).toEqual({ kind: 'behind', by: 2 });
  });

  it('counts somebody with no usual as nothing done', () => {
    expect(
      challengeStanding({ score: null, usual: 0 }, { score: 40, usual: 3 }, 'improved'),
    ).toEqual({ kind: 'behind', by: 1 });
    expect(
      challengeStanding({ score: null, usual: 0 }, { score: null, usual: 0 }, 'improved'),
    ).toEqual({ kind: 'level' });
  });
});
