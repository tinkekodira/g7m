import { describe, expect, it } from 'vitest';
import type { BoardWorkout } from '@g7m/core';
import type { Challenge } from '../lib/friends/api.js';
import {
  challengeCard,
  challengeCards,
  challengeTimeLeft,
  challengeTitle,
  describeChallengeProblem,
  type ChallengeContext,
} from './challenges-view.js';

function local(year: number, month: number, day: number, hour = 12, minute = 0): Date {
  return new Date(year, month - 1, day, hour, minute);
}

function workout(startedAt: Date, over: Partial<BoardWorkout> = {}): BoardWorkout {
  return {
    startedAt,
    clockKnown: true,
    firstSetAt: startedAt,
    lastSetAt: new Date(startedAt.getTime() + 60 * 60_000),
    sets: 10,
    liftedKg: 3000,
    ...over,
  };
}

// Accepted on Monday 5 October 2026 at 18:00; "now" is Wednesday evening.
const STARTS = local(2026, 10, 5, 18);
const NOW = local(2026, 10, 7, 20);
const CONTEXT: ChallengeContext = { now: NOW, unitSystem: 'metric' };

function challenge(over: Partial<Challenge> = {}): Challenge {
  return {
    id: 'c1',
    friendId: 'alex',
    name: 'Alex',
    sentByMe: true,
    stat: 'sets',
    ranking: 'most',
    status: 'active',
    sentAt: local(2026, 10, 5, 9),
    startsAt: STARTS,
    sharing: true,
    workouts: [workout(local(2026, 10, 6)), workout(local(2026, 10, 7, 7))],
    ...over,
  };
}

describe('a running challenge', () => {
  it('shows both sides and how far apart they are', () => {
    const card = challengeCard(challenge(), [workout(local(2026, 10, 6), { sets: 14 })], CONTEXT);
    expect(card).toMatchObject({
      phase: 'running',
      title: 'Most sets',
      when: '5 days left',
      sides: [
        { name: 'You', score: '14', leading: false },
        { name: 'Alex', score: '20', leading: true },
      ],
      verdict: '6 sets behind Alex',
    });
    expect(card.description).toBe(
      'Most sets, against Alex. 5 days left. You: 14. Alex: 20. 6 sets behind Alex',
    );
  });

  it('leaves out a workout from before it was accepted', () => {
    // Monday morning's workout started before the 18:00 accept.
    const mine = [workout(local(2026, 10, 5, 9), { sets: 30 }), workout(local(2026, 10, 6))];
    expect(challengeCard(challenge(), mine, CONTEXT).verdict).toBe('10 sets behind Alex');
  });

  it('says when you are level, or ahead', () => {
    const level = challengeCard(challenge(), challenge().workouts ?? [], CONTEXT);
    expect(level.verdict).toBe('Level with Alex');
    const ahead = challengeCard(
      challenge({ stat: 'lifted' }),
      [workout(local(2026, 10, 6), { liftedKg: 7500 })],
      CONTEXT,
    );
    expect(ahead.verdict).toBe('1,500 kg ahead of Alex');
    expect(ahead.sides?.[0]).toMatchObject({ score: '7,500 kg', leading: true });
  });

  it('ranked by improvement, shows each side against their own usual', () => {
    // Alex usually does one workout a week and has done two; you usually do
    // two and have done two.
    const alexUsual = [9, 16, 23, 30].map((day) => workout(local(2026, 9, day)));
    const myUsual = [9, 12, 16, 19, 23, 26, 30].map((day) => workout(local(2026, 9, day)));
    const card = challengeCard(
      challenge({
        stat: 'workouts',
        ranking: 'improved',
        workouts: [...alexUsual, ...(challenge().workouts ?? [])],
      }),
      [
        ...myUsual,
        workout(local(2026, 10, 3)),
        workout(local(2026, 10, 6)),
        workout(local(2026, 10, 7, 7)),
      ],
      CONTEXT,
    );
    expect(card.title).toBe('Most improved: workouts');
    expect(card.sides?.map((side) => side.score)).toEqual(['100%', '200%']);
    // 100 points on your usual of two a week.
    expect(card.verdict).toBe('2 workouts behind Alex');
  });

  it('cannot be scored once the friend stops sharing', () => {
    const card = challengeCard(challenge({ workouts: null, sharing: false }), [], CONTEXT);
    expect(card.sides).toBeNull();
    expect(card.verdict).toBe('Alex isn’t sharing their training now, so this can’t be scored.');
  });
});

describe('a finished challenge', () => {
  const later: ChallengeContext = { now: local(2026, 10, 13, 9), unitSystem: 'metric' };

  it('names the winner', () => {
    expect(challengeCard(challenge(), [], later)).toMatchObject({
      phase: 'finished',
      when: 'Ended yesterday',
      verdict: 'Alex won',
    });
    const mine = [workout(local(2026, 10, 8), { sets: 25 })];
    expect(challengeCard(challenge(), mine, later).verdict).toBe('You won');
    expect(challengeCard(challenge(), challenge().workouts ?? [], later).verdict).toBe('A draw');
  });

  it('counts nothing after it ended', () => {
    const mine = [workout(local(2026, 10, 12, 19), { sets: 50 })];
    expect(challengeCard(challenge(), mine, later).verdict).toBe('Alex won');
  });
});

describe('a challenge waiting for an answer', () => {
  const waiting = { status: 'pending' as const, startsAt: null, workouts: null };

  it('waits on the friend when you sent it', () => {
    expect(challengeCard(challenge(waiting), [], CONTEXT)).toMatchObject({
      phase: 'outgoing',
      when: 'Sent 2 days ago',
      sides: null,
      verdict: 'Waiting for Alex to accept',
    });
  });

  it('waits on you when it was sent to you', () => {
    expect(challengeCard(challenge({ ...waiting, sentByMe: false }), [], CONTEXT)).toMatchObject({
      phase: 'incoming',
      verdict: 'Alex challenged you. Seven days, from when you accept.',
    });
  });
});

describe('the list', () => {
  it('puts the ones for you to answer apart, and running before waiting before finished', () => {
    const cards = challengeCards(
      [
        challenge({ id: 'done', startsAt: local(2026, 9, 25) }),
        challenge({ id: 'mine-waiting', status: 'pending', startsAt: null, workouts: null }),
        challenge({
          id: 'theirs-waiting',
          status: 'pending',
          startsAt: null,
          workouts: null,
          sentByMe: false,
        }),
        challenge({ id: 'running' }),
      ],
      [],
      CONTEXT,
    );
    expect(cards.incoming.map((card) => card.id)).toEqual(['theirs-waiting']);
    expect(cards.others.map((card) => card.id)).toEqual(['running', 'mine-waiting', 'done']);
  });
});

describe('words', () => {
  it('titles each stat and ranking', () => {
    expect(challengeTitle('workouts', 'most')).toBe('Most workouts');
    expect(challengeTitle('lifted', 'most')).toBe('Most weight lifted');
    expect(challengeTitle('minutes', 'improved')).toBe('Most improved: time training');
  });

  it('counts down in days, then hours', () => {
    const end = local(2026, 10, 12, 18);
    expect(challengeTimeLeft(end, local(2026, 10, 7, 20))).toBe('5 days left');
    expect(challengeTimeLeft(end, local(2026, 10, 11, 17))).toBe('2 days left');
    expect(challengeTimeLeft(end, local(2026, 10, 11, 18))).toBe('24 hours left');
    expect(challengeTimeLeft(end, local(2026, 10, 12, 16, 30))).toBe('2 hours left');
    expect(challengeTimeLeft(end, local(2026, 10, 12, 17))).toBe('1 hour left');
    expect(challengeTimeLeft(end, local(2026, 10, 12, 17, 30))).toBe('Under an hour left');
  });

  it('explains every refusal, and says nothing when it worked', () => {
    expect(describeChallengeProblem('sent', 'Alex')).toBeNull();
    expect(describeChallengeProblem('started', 'Alex')).toBeNull();
    expect(describeChallengeProblem('already_live', 'Alex')).toBe(
      'You already have a challenge with Alex. One at a time.',
    );
    expect(describeChallengeProblem('no_usual', 'Alex')).toMatch(/^Alex has no workouts/);
  });
});
