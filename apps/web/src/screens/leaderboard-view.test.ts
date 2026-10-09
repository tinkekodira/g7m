import { describe, expect, it } from 'vitest';
import type { BoardWorkout } from '@g7m/core';
import type { BoardFriend } from '../lib/friends/api.js';
import {
  boardSummary,
  leaderboard,
  scoreText,
  scoreWords,
  timeLeft,
  type BoardContext,
} from './leaderboard-view.js';

function local(year: number, month: number, day: number, hour = 12, minute = 0): Date {
  return new Date(year, month - 1, day, hour, minute);
}

// Wednesday 7 October 2026, in a Monday week.
const NOW = local(2026, 10, 7, 18);

function workout(startedAt: Date, over: Partial<BoardWorkout> = {}): BoardWorkout {
  return {
    startedAt,
    clockKnown: true,
    firstSetAt: startedAt,
    lastSetAt: new Date(startedAt.getTime() + 60 * 60_000),
    sets: 15,
    liftedKg: 5000,
    ...over,
  };
}

function friend(userId: string, name: string | null, workouts: BoardWorkout[]): BoardFriend {
  return { userId, name, sharing: true, workouts };
}

const CONTEXT: BoardContext = {
  ranking: 'most',
  stat: 'workouts',
  period: 'week',
  now: NOW,
  weekStartsOn: 1,
  unitSystem: 'metric',
  myName: 'Milan',
};

const MONDAY = local(2026, 10, 5, 18);
const TUESDAY = local(2026, 10, 6, 18);
const LAST_WEEK = local(2026, 9, 30, 18);

describe('the board', () => {
  const alex = friend('alex', 'Alex', [workout(MONDAY), workout(TUESDAY), workout(LAST_WEEK)]);
  const sam = friend('sam', 'Sam', [workout(TUESDAY, { sets: 30 })]);
  const jordan = friend('jordan', 'Jordan', []);
  const mine = [workout(MONDAY)];

  it('ranks you among your friends on this week’s count', () => {
    const view = leaderboard([alex, sam, jordan], mine, CONTEXT);
    expect(view.rows.map((row) => [row.name, row.rankText, row.scoreText])).toEqual([
      ['Alex', '1', '2'],
      ['Sam', '2', '1'],
      ['You', '2', '1'],
      ['Jordan', '–', '0'],
    ]);
    expect(view.rows.find((row) => row.isYou)?.avatarName).toBe('Milan');
  });

  it('switches stat and period without asking the server again', () => {
    const sets = leaderboard([alex, sam], mine, { ...CONTEXT, stat: 'sets' });
    expect(sets.rows.map((row) => [row.name, row.scoreText])).toEqual([
      ['Alex', '30'],
      ['Sam', '30'],
      ['You', '15'],
    ]);

    const month = leaderboard([alex, sam], mine, { ...CONTEXT, period: 'month' });
    // Last week's Wednesday was 30 September: still last month.
    expect(month.rows[0]).toMatchObject({ name: 'Alex', scoreText: '2' });
  });

  it('describes each row for a screen reader', () => {
    const view = leaderboard([alex, jordan], mine, CONTEXT);
    expect(view.rows.map((row) => row.description)).toEqual([
      '1st, Alex: 2 workouts. Won last week',
      '2nd, You: 1 workout. 1 workout behind Alex',
      'Jordan: nothing yet',
    ]);
  });

  it('leaves off friends who are not sharing, and says so', () => {
    const hidden: BoardFriend = { userId: 'kim', name: 'Kim', sharing: false, workouts: [] };
    const one = leaderboard([alex, hidden], mine, CONTEXT);
    expect(one.rows.map((row) => row.name)).toEqual(['Alex', 'You']);
    expect(one.notSharing).toBe('Kim isn’t sharing their training, so isn’t on the board.');

    const two = leaderboard(
      [alex, hidden, { ...hidden, userId: 'lee', name: null }],
      mine,
      CONTEXT,
    );
    expect(two.notSharing).toBe('2 friends aren’t sharing their training, so aren’t on the board.');
    expect(leaderboard([alex], mine, CONTEXT).notSharing).toBeNull();
  });

  it('knows when there is nobody to be on a board with', () => {
    expect(leaderboard([], mine, CONTEXT).alone).toBe(true);
    expect(leaderboard([alex], mine, CONTEXT).alone).toBe(false);
  });

  it('says how long the period has left, and what the weight counts', () => {
    expect(leaderboard([alex], mine, CONTEXT).left).toBe('5 days left');
    expect(leaderboard([alex], mine, { ...CONTEXT, period: 'month' }).left).toBe('25 days left');
    expect(leaderboard([alex], mine, CONTEXT).footnote).toBeNull();
    expect(leaderboard([alex], mine, { ...CONTEXT, stat: 'lifted' }).footnote).toMatch(
      /count only the weight added/,
    );
  });
});

describe('the gap under your name', () => {
  const alex = friend('alex', 'Alex', [workout(MONDAY), workout(TUESDAY)]);
  const sam = friend('sam', 'Sam', [workout(MONDAY, { liftedKg: 3800 })]);

  it('names who is next above you and by how much', () => {
    const view = leaderboard([alex, sam], [], CONTEXT);
    const you = view.rows.find((row) => row.isYou);
    expect(you?.note).toBe('1 workout behind Sam');
    expect(you?.description).toBe('You: nothing yet. 1 workout behind Sam');
    expect(view.rows.filter((row) => !row.isYou).map((row) => row.note)).toEqual([null, null]);
  });

  it('speaks in the stat’s own terms', () => {
    const mine = [workout(MONDAY, { liftedKg: 2600 })];
    const lifted = leaderboard([alex, sam], mine, { ...CONTEXT, stat: 'lifted' });
    expect(lifted.rows.find((row) => row.isYou)?.note).toBe('1,200 kg behind Sam');

    const ahead = leaderboard([sam], [workout(MONDAY), workout(TUESDAY)], CONTEXT);
    expect(ahead.rows.find((row) => row.isYou)?.note).toBe('1 workout ahead of Sam');

    const level = leaderboard([sam], [workout(TUESDAY)], { ...CONTEXT, stat: 'minutes' });
    expect(level.rows.find((row) => row.isYou)?.note).toBe('Level with Sam');
  });

  it('stays quiet when nobody has trained yet', () => {
    const view = leaderboard([friend('sam', 'Sam', [])], [], CONTEXT);
    expect(view.rows.find((row) => row.isYou)?.note).toBeNull();
  });
});

describe('the bars and the pinned summary', () => {
  const alex = friend('alex', 'Alex', [workout(MONDAY), workout(TUESDAY)]);
  const sam = friend('sam', 'Sam', [workout(MONDAY)]);

  it('measures each bar against the leader, and gives no bar without a place', () => {
    const view = leaderboard([alex, sam], [], CONTEXT);
    expect(view.rows.map((row) => [row.name, row.share])).toEqual([
      ['Alex', 1],
      ['Sam', 0.5],
      ['You', null],
    ]);
  });

  it('says your place and the gap to the next one', () => {
    expect(leaderboard([alex, sam], [workout(MONDAY)], CONTEXT).standing).toEqual({
      place: 'You’re #2',
      gap: '1 workout behind Alex',
    });
    expect(leaderboard([alex, sam], [], CONTEXT).standing).toEqual({
      place: 'No place yet',
      gap: '1 workout behind Sam',
    });
  });

  it('sums up the three choices in the controls’ own words', () => {
    expect(boardSummary('most', 'workouts', 'week')).toBe('Most workouts this week');
    expect(boardSummary('improved', 'lifted', 'month')).toBe('Most improved: weight this month');
  });
});

describe('last period’s crown', () => {
  it('goes to whoever was first last week, on this week’s board', () => {
    const alex = friend('alex', 'Alex', [workout(LAST_WEEK)]);
    const sam = friend('sam', 'Sam', [workout(MONDAY), workout(TUESDAY)]);
    const view = leaderboard([alex, sam], [], CONTEXT);
    expect(view.rows.filter((row) => row.champion).map((row) => row.name)).toEqual(['Alex']);
    expect(view.rows.find((row) => row.name === 'Alex')?.description).toBe(
      'Alex: nothing yet. Won last week',
    );
  });

  it('goes to last month’s winner on the month’s board, and is shared on a tie', () => {
    const september = local(2026, 9, 10);
    const alex = friend('alex', 'Alex', [workout(september)]);
    const sam = friend('sam', 'Sam', [workout(september, { sets: 3 })]);
    const month = leaderboard([alex, sam], [], { ...CONTEXT, period: 'month' });
    expect(month.rows.filter((row) => row.champion).map((row) => row.name)).toEqual([
      'Alex',
      'Sam',
    ]);
    expect(month.rows[0]?.description).toMatch(/Won last month$/);

    const sets = leaderboard([alex, sam], [], { ...CONTEXT, period: 'month', stat: 'sets' });
    expect(sets.rows.filter((row) => row.champion).map((row) => row.name)).toEqual(['Alex']);
  });

  it('goes to nobody after a period nobody trained in', () => {
    const view = leaderboard([friend('alex', 'Alex', [workout(MONDAY)])], [], CONTEXT);
    expect(view.rows.some((row) => row.champion)).toBe(false);
  });
});

describe('arrows since yesterday', () => {
  it('show who climbed and who was passed today', () => {
    const today = local(2026, 10, 7, 9);
    const alex = friend('alex', 'Alex', [workout(MONDAY)]);
    const sam = friend('sam', 'Sam', [workout(TUESDAY), workout(today)]);
    const view = leaderboard([alex, sam], [workout(MONDAY), workout(TUESDAY)], CONTEXT);
    expect(view.rows.map((row) => [row.name, row.moveText])).toEqual([
      ['Sam', '▲1'],
      // Sam drew level with you: still first, so no arrow. Alex was second with Sam.
      ['You', null],
      ['Alex', '▼1'],
    ]);
    expect(view.rows[0]?.description).toBe('1st, Sam: 2 workouts. Up 1 since yesterday');
  });

  it('show nothing on the first day of the week', () => {
    const monday = local(2026, 10, 5, 20);
    const view = leaderboard([friend('alex', 'Alex', [workout(local(2026, 10, 5, 9))])], [], {
      ...CONTEXT,
      now: monday,
    });
    expect(view.rows.every((row) => row.moveText === null)).toBe(true);
  });
});

describe('most improved', () => {
  const september = (...days: number[]) => days.map((day) => workout(local(2026, 9, day)));
  // Usually four a week, and two so far this week: half a usual week.
  const alex = friend('alex', 'Alex', [
    ...september(7, 8, 9, 10, 14, 15, 16, 17, 21, 22, 23, 24, 28, 29, 30),
    workout(local(2026, 10, 1)),
    workout(MONDAY),
    workout(TUESDAY),
  ]);
  // Five in the four weeks before this one, and two so far: 160% of usual.
  const sam = friend('sam', 'Sam', [
    ...september(8, 15, 22, 29, 30),
    workout(MONDAY),
    workout(TUESDAY),
  ]);
  // Nothing before this week.
  const jordan = friend('jordan', 'Jordan', [workout(MONDAY)]);
  // Usually two a week, and one so far.
  const mine = [...september(7, 9, 14, 16, 21, 23, 28, 30), workout(MONDAY)];
  const IMPROVED: BoardContext = { ...CONTEXT, ranking: 'improved' };

  it('ranks each person against their own last four weeks', () => {
    const view = leaderboard([alex, sam, jordan], mine, IMPROVED);
    expect(view.rows.map((row) => [row.name, row.rankText, row.scoreText])).toEqual([
      ['Sam', '1', '160%'],
      ['Alex', '2', '50%'],
      ['You', '2', '50%'],
      ['Jordan', '–', 'New'],
    ]);
  });

  it('crowns last week’s most improved, measured against the four weeks before it', () => {
    // Last week Sam did two against a usual of three-quarters; the others a third more than usual.
    const view = leaderboard([alex, sam, jordan], mine, IMPROVED);
    expect(view.rows.filter((row) => row.champion).map((row) => row.name)).toEqual(['Sam']);
    expect(view.rows.map((row) => row.description)).toEqual([
      '1st, Sam: 160% of usual. Most improved last week',
      '2nd, Alex: 50% of usual',
      '2nd, You: 50% of usual. 3 workouts behind Sam',
      'Jordan: new, nothing in the four weeks before this week to measure against',
    ]);
  });

  it('says the gap as what the one behind has to do', () => {
    // Three more of your workouts takes you from half a usual week to twice one.
    const behind = leaderboard([sam], mine, IMPROVED);
    expect(behind.rows.find((row) => row.isYou)?.note).toBe('3 workouts behind Sam');

    // Sam's history as yours, 160% against Alex's 50%: on Alex's usual of four a
    // week, Alex needs five more to draw level.
    const ahead = leaderboard([alex], sam.workouts, IMPROVED);
    expect(ahead.rows.find((row) => row.isYou)?.note).toBe('5 workouts ahead of Alex');
  });

  it('tells you when you have no usual yet', () => {
    const view = leaderboard([alex], [workout(MONDAY)], IMPROVED);
    const you = view.rows.find((row) => row.isYou);
    expect(you).toMatchObject({ rankText: '–', scoreText: 'New' });
    expect(you?.note).toBe('Nothing to measure against yet');
    expect(you?.description).toBe('You: new. Nothing to measure against yet');
  });

  it('says what 100% means, and what the weight counts', () => {
    expect(leaderboard([alex], mine, IMPROVED).footnote).toBe(
      '100% is a usual week: a quarter of what each person did in the four weeks before it.',
    );
    expect(leaderboard([alex], mine, { ...IMPROVED, period: 'month' }).footnote).toMatch(
      /^100% is a usual month/,
    );
    expect(leaderboard([alex], mine, { ...IMPROVED, stat: 'lifted' }).footnote).toMatch(
      /^100% is a usual week.* count only the weight added to them\.$/,
    );
  });
});

describe('numbers', () => {
  it('shows each stat in its own terms', () => {
    expect(scoreText(12_450, 'lifted', 'metric')).toBe('12,450 kg');
    expect(scoreText(27_448, 'lifted', 'imperial')).toBe('27,448 lb');
    expect(scoreText(185, 'minutes', 'metric')).toBe('3h 5m');
    expect(scoreText(41, 'sets', 'metric')).toBe('41');
  });

  it('says them in words', () => {
    expect(scoreWords(1, 'workouts', 'metric')).toBe('1 workout');
    expect(scoreWords(1, 'sets', 'metric')).toBe('1 set');
    expect(scoreWords(12_450, 'lifted', 'metric')).toBe('12,450 kg lifted');
    expect(scoreWords(45, 'minutes', 'metric')).toBe('45m of training');
  });

  it('counts today among the days left', () => {
    const sunday = local(2026, 10, 11, 20);
    expect(timeLeft(local(2026, 10, 12, 0), sunday)).toBe('Last day');
    expect(timeLeft(local(2026, 10, 12, 0), local(2026, 10, 10, 9))).toBe('2 days left');
  });
});
