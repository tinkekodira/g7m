import { describe, expect, it } from 'vitest';
import { checkFriendCode } from '@g7m/core';
import type { Friend, FriendTraining, WorkoutSummary } from '../lib/friends/api.js';
import {
  NAMELESS,
  describeCodeProblem,
  describeReference,
  describeSendResult,
  friendCard,
  liftCell,
  requestRow,
  sentWhen,
  sortFriends,
  summaryDuration,
  summaryTitle,
  type CardContext,
  type Movers,
} from './friends-view.js';

function local(year: number, month: number, day: number, hour = 12, minute = 0): Date {
  return new Date(year, month - 1, day, hour, minute);
}

// Wednesday 7 October 2026, in a Monday week.
const NOW = local(2026, 10, 7, 18);

const MOVERS: Movers = new Map([
  ['squat', [{ muscle: 'quadriceps', group: 'quads' }]],
  ['leg-press', [{ muscle: 'quadriceps', group: 'quads' }]],
  ['treadmill', []],
]);

const summary = (over: Partial<WorkoutSummary> = {}): WorkoutSummary => ({
  id: 's1',
  name: null,
  source: 'manual',
  startedAt: local(2026, 10, 6, 17),
  endedAt: local(2026, 10, 6, 18),
  work: [
    { exerciseId: 'squat', sets: 5 },
    { exerciseId: 'leg-press', sets: 3 },
  ],
  firstSetAt: local(2026, 10, 6, 17, 5),
  lastSetAt: local(2026, 10, 6, 18, 23),
  ...over,
});

const training = (over: Partial<FriendTraining> = {}): FriendTraining => ({
  lastActiveAt: new Date(NOW.getTime() - 60_000),
  daysPerWeek: 2,
  trainedAt: [local(2026, 10, 6, 17), local(2026, 9, 28), local(2026, 9, 30)],
  bigThree: new Map([
    ['barbell-back-squat', 140],
    ['barbell-bench-press', 100],
  ]),
  lastWorkout: summary(),
  ...over,
});

const CONTEXT: CardContext = {
  now: NOW,
  weekStartsOn: 1,
  unitSystem: 'metric',
  myBigThree: new Map([
    ['barbell-back-squat', 150],
    ['barbell-bench-press', 100],
    ['conventional-deadlift', 180],
  ]),
  movers: MOVERS,
};

describe('summaryTitle', () => {
  it('keeps a name somebody gave the workout', () => {
    expect(summaryTitle(summary({ name: 'Heavy legs' }), MOVERS)).toBe('Heavy legs');
  });

  it('names an unnamed one the way your own history would', () => {
    expect(summaryTitle(summary(), MOVERS)).toMatch(/^Leg day/);
  });

  it('calls a machines-only workout cardio', () => {
    expect(summaryTitle(summary({ work: [{ exerciseId: 'treadmill', sets: 2 }] }), MOVERS)).toBe(
      'Cardio',
    );
  });
});

describe('summaryDuration', () => {
  it('runs from the first set ticked to the last', () => {
    expect(summaryDuration(summary())).toBe('1h 18m');
  });

  it('says nothing for a workout logged afterwards, or one with no sets', () => {
    expect(summaryDuration(summary({ source: 'past' }))).toBeNull();
    expect(summaryDuration(summary({ firstSetAt: null, lastSetAt: null }))).toBeNull();
  });
});

describe('liftCell', () => {
  it('shows their best, and the gap from your side', () => {
    expect(liftCell('Squat', 140, 150, 'metric', 'Alex')).toEqual({
      label: 'Squat',
      theirs: '140 kg',
      delta: { text: '+10', standing: 'ahead' },
      description: 'Squat: Alex 140 kg, you are 10 kg ahead',
    });
    expect(liftCell('Bench', 105, 100, 'metric', 'Alex').delta).toEqual({
      text: '−5',
      standing: 'behind',
    });
    expect(liftCell('Bench', 100, 100, 'metric', 'Alex').delta).toEqual({
      text: 'Level',
      standing: 'level',
    });
  });

  it('is a dash when either of you has not logged it', () => {
    expect(liftCell('Deadlift', null, 180, 'metric', 'Alex')).toMatchObject({
      theirs: '—',
      delta: null,
    });
    expect(liftCell('Squat', 140, null, 'metric', 'Alex')).toMatchObject({
      theirs: '140 kg',
      delta: null,
      description: 'Squat: Alex 140 kg; you have not logged it',
    });
  });

  it('speaks in pounds to somebody who lifts in pounds', () => {
    expect(liftCell('Squat', 100, 110, 'imperial', 'Alex')).toMatchObject({
      theirs: '220.5 lb',
      delta: { text: '+22', standing: 'ahead' },
    });
  });
});

describe('friendCard', () => {
  const friend = (over: Partial<Friend> = {}): Friend => ({
    userId: 'alex',
    name: 'Alex',
    sharing: true,
    training: training(),
    ...over,
  });

  it('gives a sharing friend everything the card shows', () => {
    const card = friendCard(friend(), CONTEXT);
    expect(card.presence).toEqual({ online: true, label: 'Online now' });
    expect(card.dots?.map((dot) => dot.trained)).toEqual([
      false,
      true,
      false,
      false,
      false,
      false,
      false,
    ]);
    // Last week had two days, this week has one so far: one week, not broken.
    expect(card.streak).toBe('1 week');
    expect(card.lifts?.map((lift) => [lift.label, lift.theirs, lift.delta?.text ?? null])).toEqual([
      ['Squat', '140 kg', '+10'],
      ['Bench', '100 kg', 'Level'],
      ['Deadlift', '—', null],
    ]);
    expect(card.lastWorkout).toMatchObject({
      sessionId: 's1',
      when: 'Yesterday',
      duration: '1h 18m',
    });
  });

  it('gives a friend who is not sharing a name and nothing else', () => {
    const card = friendCard(friend({ sharing: false, training: null }), CONTEXT);
    expect(card).toEqual({
      userId: 'alex',
      name: 'Alex',
      avatarName: 'Alex',
      sharing: false,
      presence: null,
      dots: null,
      streak: null,
      lifts: null,
      lastWorkout: null,
    });
  });

  it('copes with a friend who never set a name, or never trained', () => {
    const card = friendCard(
      friend({ name: null, training: training({ trainedAt: [], lastWorkout: null }) }),
      CONTEXT,
    );
    expect(card.name).toBe(NAMELESS);
    expect(card.avatarName).toBeNull();
    expect(card.streak).toBeNull();
    expect(card.lastWorkout).toBeNull();
  });
});

describe('sortFriends', () => {
  it('puts sharing friends first, then by name', () => {
    const sorted = sortFriends([
      { userId: '1', name: 'Zoe', sharing: true, training: null },
      { userId: '2', name: 'Ana', sharing: false, training: null },
      { userId: '3', name: 'Ben', sharing: true, training: null },
    ]);
    expect(sorted.map((friend) => friend.name)).toEqual(['Ben', 'Zoe', 'Ana']);
  });
});

describe('requests', () => {
  it('says when a request was sent in the words a person would', () => {
    expect(sentWhen(new Date(NOW.getTime() - 20_000), NOW)).toBe('Just now');
    expect(sentWhen(new Date(NOW.getTime() - 12 * 60_000), NOW)).toBe('12 min ago');
    expect(sentWhen(new Date(NOW.getTime() - 3 * 3600_000), NOW)).toBe('3h ago');
    expect(sentWhen(local(2026, 10, 6, 1), NOW)).toBe('Yesterday');
  });

  it('names a request from somebody nameless gently', () => {
    expect(
      requestRow({ id: 'r', userId: 'u', name: null, requestedAt: local(2026, 10, 5) }, NOW),
    ).toEqual({ id: 'r', name: NAMELESS, avatarName: null, when: 'Mon 5 Oct' });
  });
});

describe('sending a request', () => {
  it('catches a mistyped code before anything is sent', () => {
    expect(describeCodeProblem(checkFriendCode('K7PX4M'))).toBeNull();
    expect(describeCodeProblem(checkFriendCode(''))?.text).toMatch(/first/);
    expect(describeCodeProblem(checkFriendCode('K7P'))?.text).toMatch(/six/);
    expect(describeCodeProblem(checkFriendCode('K7PX4O'))?.text).toMatch(/0, O, 1, I or L/);
  });

  it('says what came of it, in place', () => {
    expect(describeSendResult({ outcome: 'sent', name: 'Alex' })).toEqual({
      tone: 'success',
      text: 'Request sent to Alex.',
    });
    expect(describeSendResult({ outcome: 'own_code', name: null }).text).toBe(
      'That’s your own code.',
    );
    expect(describeSendResult({ outcome: 'unknown', name: null }).text).toMatch(
      /No one has that code/,
    );
    expect(describeSendResult({ outcome: 'already_friends', name: 'Alex' }).text).toBe(
      'You’re already friends with Alex.',
    );
    expect(describeSendResult({ outcome: 'already_requested', name: 'Alex' }).text).toBe(
      'You’ve already sent Alex a request.',
    );
    expect(describeSendResult({ outcome: 'now_friends', name: 'Alex' }).tone).toBe('success');
    expect(describeSendResult({ outcome: 'too_many', name: null }).tone).toBe('error');
    expect(describeSendResult({ outcome: 'invalid', name: null }).tone).toBe('error');
    expect(describeSendResult({ outcome: 'sent', name: null }).text).toBe('Request sent.');
  });
});

describe('describeReference', () => {
  const set = (loadType: string, weightKg: number, reps: number) => ({ loadType, weightKg, reps });

  it('says their top set the way the logger would', () => {
    expect(describeReference('Alex', set('external', 100, 5), 'metric', false)).toBe(
      'Alex: 5 × 100 kg',
    );
    expect(describeReference('Alex', set('bodyweight', 0, 12), 'metric', false)).toBe(
      'Alex: 12 reps',
    );
    expect(describeReference('Alex', set('bodyweight_plus', 20, 8), 'metric', false)).toBe(
      'Alex: 8 × +20 kg',
    );
    expect(describeReference('Alex', set('assisted', 15, 10), 'metric', false)).toBe(
      'Alex: 10 × 15 kg assisted',
    );
    expect(describeReference('Alex', set('external', 0, 60), 'metric', true)).toBe('Alex: 60 s');
    expect(describeReference('Alex', set('external', 100, 5), 'imperial', false)).toBe(
      'Alex: 5 × 220.5 lb',
    );
  });
});
