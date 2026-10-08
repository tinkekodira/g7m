import { describe, expect, it } from 'vitest';
import type { BoardWorkout } from '@g7m/core';
import type { BoardFriend } from '../lib/friends/api.js';
import {
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
      '1st, Alex: 2 workouts',
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
    expect(leaderboard([alex], mine, CONTEXT).heading).toBe('This week · 5 days left');
    expect(leaderboard([alex], mine, { ...CONTEXT, period: 'month' }).heading).toBe(
      'This month · 25 days left',
    );
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
