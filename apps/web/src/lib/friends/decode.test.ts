import { describe, expect, it } from 'vitest';
import {
  decodeChallengeAnswer,
  decodeChallengeSend,
  decodeChallenges,
  decodeDetail,
  decodeOverview,
  decodeSendResult,
  decodeSession,
  FriendsError,
} from './decode.js';

/** The shapes the friend functions in the migration return, as PostgREST sends them. */
const SUMMARY = {
  id: 's1',
  name: null,
  source: 'manual',
  started_at: '2026-10-06T17:00:00+00:00',
  ended_at: '2026-10-06T18:00:00+00:00',
  work: [{ exercise_id: 'e1', sets: 3 }],
  first_set_at: '2026-10-06T17:05:00+00:00',
  last_set_at: null,
};

const TRAINING = {
  last_active_at: '2026-10-07T10:00:00+00:00',
  days_per_week: 3,
  trained_at: ['2026-10-06T17:00:00+00:00', 'not a date'],
  big_three: [{ slug: 'barbell-bench-press', best_kg: 102.5 }],
  last_workout: SUMMARY,
};

describe('decodeOverview', () => {
  it('reads your code, the requests and every friend', () => {
    const overview = decodeOverview({
      me: { code: 'K7PX4M', sharing: true },
      requests: [
        { id: 'r1', user_id: 'u2', name: 'Jordan', requested_at: '2026-10-07T09:00:00+00:00' },
      ],
      friends: [
        { user_id: 'u3', name: 'Alex', since: null, sharing: true, training: TRAINING },
        { user_id: 'u4', name: '  ', since: null, sharing: false },
      ],
    });
    expect(overview.me).toEqual({ code: 'K7PX4M', sharing: true });
    expect(overview.requests[0]?.requestedAt.toISOString()).toBe('2026-10-07T09:00:00.000Z');
    const [alex, quiet] = overview.friends;
    expect(alex?.training?.bigThree.get('barbell-bench-press')).toBe(102.5);
    expect(alex?.training?.trainedAt).toHaveLength(1);
    expect(alex?.training?.lastWorkout?.work).toEqual([{ exerciseId: 'e1', sets: 3 }]);
    expect(quiet).toEqual({ userId: 'u4', name: null, sharing: false, training: null });
  });

  it('treats an empty reply as no friends rather than an error', () => {
    expect(decodeOverview({ me: null, requests: null, friends: null })).toEqual({
      me: null,
      requests: [],
      friends: [],
    });
  });

  it('refuses something it does not understand, in words', () => {
    expect(() => decodeOverview('nope')).toThrow(FriendsError);
    expect(() => decodeOverview({ friends: [{ user_id: 7 }] })).toThrow(/does not understand/);
  });
});

describe('decodeSendResult', () => {
  it('knows every outcome, and nothing else', () => {
    expect(decodeSendResult({ outcome: 'sent', name: 'Alex' })).toEqual({
      outcome: 'sent',
      name: 'Alex',
    });
    expect(() => decodeSendResult({ outcome: 'hacked' })).toThrow(FriendsError);
  });
});

describe('decodeDetail and decodeSession', () => {
  it('reads a friend’s page', () => {
    const detail = decodeDetail({
      user_id: 'u3',
      name: 'Alex',
      training: TRAINING,
      bests: [{ exercise_id: 'e1', best_kg: '100.00', last_at: '2026-10-06T17:00:00+00:00' }],
      recent: [SUMMARY],
    });
    expect(detail.bests).toEqual([
      { exerciseId: 'e1', bestKg: 100, lastAt: new Date('2026-10-06T17:00:00Z') },
    ]);
    expect(detail.recent).toHaveLength(1);
  });

  it('reads every set of a workout, and a bout’s numbers', () => {
    const session = decodeSession({
      ...SUMMARY,
      exercises: [
        {
          exercise_id: 'e1',
          sets: [
            {
              set_type: 'warmup',
              load_type: 'external',
              weight_kg: 60,
              reps: 5,
              is_completed: true,
              completed_at: '2026-10-06T17:05:00+00:00',
              duration_seconds: null,
            },
            {
              set_type: 'working',
              load_type: 'external',
              weight_kg: 0,
              reps: 0,
              is_completed: true,
              completed_at: null,
              duration_seconds: 600,
              calories_kcal: 90,
            },
          ],
        },
      ],
    });
    const [warmup, bout] = session.exercises[0]?.sets ?? [];
    expect(warmup).toMatchObject({ setType: 'warmup', weightKg: 60, reps: 5, isCompleted: true });
    expect(bout?.bout).toMatchObject({ durationSeconds: 600, caloriesKcal: 90, distanceM: null });
  });

  it('refuses a set type it has never heard of', () => {
    expect(() =>
      decodeSession({
        ...SUMMARY,
        exercises: [{ exercise_id: 'e1', sets: [{ set_type: 'mystery', load_type: 'external' }] }],
      }),
    ).toThrow(FriendsError);
  });
});

describe('decodeChallenges', () => {
  const RUNNING = {
    id: 'c1',
    friend_id: 'alex',
    name: 'Alex',
    sent_by_me: true,
    stat: 'sets',
    ranking: 'improved',
    status: 'active',
    sent_at: '2026-10-05T09:00:00+00:00',
    starts_at: '2026-10-05T18:00:00+00:00',
    sharing: true,
    workouts: [
      {
        started_at: '2026-10-06T17:00:00+00:00',
        source: 'manual',
        first_set_at: '2026-10-06T17:05:00+00:00',
        last_set_at: '2026-10-06T18:00:00+00:00',
        sets: 12,
        lifted_kg: '4200.5',
      },
    ],
  };

  it('reads a running challenge and the friend’s workouts in it', () => {
    const [challenge] = decodeChallenges({ challenges: [RUNNING] });
    expect(challenge).toMatchObject({
      id: 'c1',
      friendId: 'alex',
      sentByMe: true,
      stat: 'sets',
      ranking: 'improved',
      status: 'active',
      startsAt: new Date('2026-10-05T18:00:00Z'),
      sharing: true,
    });
    expect(challenge?.workouts?.[0]).toMatchObject({ sets: 12, liftedKg: 4200.5 });
  });

  it('has no workouts for one still waiting, or a friend who stopped sharing', () => {
    const [waiting, hidden] = decodeChallenges({
      challenges: [
        { ...RUNNING, status: 'pending', starts_at: null, workouts: undefined },
        { ...RUNNING, sharing: false, workouts: undefined },
      ],
    });
    expect(waiting).toMatchObject({ status: 'pending', startsAt: null, workouts: null });
    expect(hidden).toMatchObject({ sharing: false, workouts: null });
  });

  it('refuses a stat, ranking or outcome it does not know', () => {
    expect(() => decodeChallenges({ challenges: [{ ...RUNNING, stat: 'reps' }] })).toThrow(
      FriendsError,
    );
    expect(() => decodeChallenges({ challenges: [{ ...RUNNING, ranking: 'loudest' }] })).toThrow(
      FriendsError,
    );
    expect(decodeChallengeSend({ outcome: 'no_usual', name: 'Alex' })).toEqual({
      outcome: 'no_usual',
      name: 'Alex',
    });
    expect(decodeChallengeAnswer({ outcome: 'started' })).toBe('started');
    expect(() => decodeChallengeAnswer({ outcome: 'maybe' })).toThrow(FriendsError);
  });
});
