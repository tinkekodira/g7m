/**
 * What the friend functions send, as the app holds it, and the decoding in
 * between — kept apart from `api.ts` so it can be tested without a Supabase
 * client, which needs the build's environment to exist at all.
 *
 * Each reply is decoded field by field rather than cast. It crosses a network
 * from a server that may be a migration ahead or behind the app, and a reply
 * that has the wrong shape should become "the server said something we do not
 * understand", not a `NaN` drawn on a friend's card.
 */
import {
  EMPTY_BOUT,
  LEADERBOARD_RANKINGS,
  LEADERBOARD_STATS,
  type BoardWorkout,
  type Bout,
  type LeaderboardRanking,
  type LeaderboardStat,
  type LoadType,
  type SetType,
} from '@g7m/core';

export interface WorkoutSummary {
  readonly id: string;
  readonly name: string | null;
  /** `past` for a workout logged afterwards, whose clock times mean nothing. */
  readonly source: string;
  readonly startedAt: Date;
  readonly endedAt: Date | null;
  /** Each exercise in order, with its count of completed working sets. */
  readonly work: readonly { readonly exerciseId: string; readonly sets: number }[];
  /** When the first and last sets were ticked, for the duration. */
  readonly firstSetAt: Date | null;
  readonly lastSetAt: Date | null;
}

export interface FriendTraining {
  readonly lastActiveAt: Date | null;
  /** Their current goal's days per week, or null with no goal set. */
  readonly daysPerWeek: number | null;
  /** When each finished workout of the last year started, newest first. */
  readonly trainedAt: readonly Date[];
  /** Their best on every lift they have done, for the card to choose its three from. */
  readonly bests: readonly FriendBest[];
  readonly lastWorkout: WorkoutSummary | null;
}

export interface Friend {
  readonly userId: string;
  readonly name: string | null;
  readonly sharing: boolean;
  /** Null when they are not sharing. */
  readonly training: FriendTraining | null;
}

export interface FriendRequest {
  readonly id: string;
  readonly userId: string;
  readonly name: string | null;
  readonly requestedAt: Date;
}

export interface FriendsOverview {
  readonly me: { readonly code: string; readonly sharing: boolean } | null;
  readonly requests: readonly FriendRequest[];
  readonly friends: readonly Friend[];
}

export interface FriendBest {
  readonly exerciseId: string;
  readonly bestKg: number;
  readonly lastAt: Date;
}

export interface FriendDetail {
  readonly userId: string;
  readonly name: string | null;
  readonly training: FriendTraining;
  readonly bests: readonly FriendBest[];
  readonly recent: readonly WorkoutSummary[];
}

export interface FriendSessionSet {
  readonly setType: SetType;
  readonly loadType: LoadType;
  readonly weightKg: number;
  readonly reps: number;
  readonly isCompleted: boolean;
  readonly completedAt: Date | null;
  readonly bout: Bout;
}

export interface FriendSessionExercise {
  readonly exerciseId: string;
  readonly sets: readonly FriendSessionSet[];
  /** Shared by the exercises they did as one superset. Null from an older server. */
  readonly supersetId: string | null;
}

export interface FriendSession extends WorkoutSummary {
  readonly exercises: readonly FriendSessionExercise[];
}

export const SEND_OUTCOMES = [
  'sent',
  'now_friends',
  'own_code',
  'unknown',
  'invalid',
  'already_friends',
  'already_requested',
  'too_many',
] as const;
export type SendOutcome = (typeof SEND_OUTCOMES)[number];

export interface SendResult {
  readonly outcome: SendOutcome;
  readonly name: string | null;
}

/** A request that did not work, already in words somebody can read. */
/** A friend on the leaderboard. */
export interface BoardFriend {
  readonly userId: string;
  readonly name: string | null;
  readonly sharing: boolean;
  /** Their finished workouts since the start of last month; empty when not sharing. */
  readonly workouts: readonly BoardWorkout[];
}

/** A challenge you are in, as `my_challenges` sends it (ADR-0110). */
export interface Challenge {
  readonly id: string;
  readonly friendId: string;
  readonly name: string | null;
  /** You sent it; false when it was sent to you. */
  readonly sentByMe: boolean;
  readonly stat: LeaderboardStat;
  readonly ranking: LeaderboardRanking;
  /** Waiting to be accepted, or accepted (running, or finished in the last week). */
  readonly status: 'pending' | 'active';
  readonly sentAt: Date;
  /** When it was accepted. Null while it waits. */
  readonly startsAt: Date | null;
  /** Whether the friend shares their training now. */
  readonly sharing: boolean;
  /**
   * The friend's workouts from four weeks before it began to its end. Null
   * while it waits, and when they are not sharing.
   */
  readonly workouts: readonly BoardWorkout[] | null;
}

export const CHALLENGE_SEND_OUTCOMES = [
  'sent',
  'already_live',
  'not_friends',
  'not_sharing',
  'you_not_sharing',
  'no_usual',
  'you_no_usual',
  'too_many',
  'invalid',
] as const;
export type ChallengeSendOutcome = (typeof CHALLENGE_SEND_OUTCOMES)[number];

export const CHALLENGE_ANSWER_OUTCOMES = [
  'started',
  'declined',
  'not_found',
  'not_sharing',
  'you_not_sharing',
  'no_usual',
  'you_no_usual',
] as const;
export type ChallengeAnswerOutcome = (typeof CHALLENGE_ANSWER_OUTCOMES)[number];

export class FriendsError extends Error {}

// ---------------------------------------------------------------------------
// Decoding
// ---------------------------------------------------------------------------

class Malformed extends FriendsError {
  constructor(what: string) {
    super(`The server sent something this version of the app does not understand (${what}).`);
  }
}

type Json = Record<string, unknown>;

function record(value: unknown): Json {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Malformed('expected an object');
  }
  return value as Json;
}

function list(value: unknown): readonly unknown[] {
  if (value === null || value === undefined) return [];
  if (!Array.isArray(value)) throw new Malformed('expected a list');
  return value;
}

function string(value: unknown): string {
  if (typeof value !== 'string') throw new Malformed('expected text');
  return value;
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function number(value: unknown, fallback: number): number {
  const parsed = typeof value === 'string' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : fallback;
}

function optionalNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = number(value, Number.NaN);
  return Number.isNaN(parsed) ? null : parsed;
}

function date(value: unknown): Date {
  const parsed = optionalDate(value);
  if (parsed === null) throw new Malformed('expected a date');
  return parsed;
}

function optionalDate(value: unknown): Date | null {
  if (typeof value !== 'string') return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T {
  if (typeof value === 'string' && (allowed as readonly string[]).includes(value)) {
    return value as T;
  }
  throw new Malformed(`unexpected value ${JSON.stringify(value)}`);
}

const SET_TYPES = ['warmup', 'working', 'dropset', 'failure', 'amrap'] as const;
const LOAD_TYPES = ['external', 'bodyweight', 'bodyweight_plus', 'assisted'] as const;

export function decodeSendResult(value: unknown): SendResult {
  const data = record(value);
  return { outcome: oneOf(data['outcome'], SEND_OUTCOMES), name: optionalString(data['name']) };
}

export function decodeWorkoutSummary(value: unknown): WorkoutSummary {
  const data = record(value);
  return {
    id: string(data['id']),
    name: optionalString(data['name']),
    source: typeof data['source'] === 'string' ? data['source'] : 'manual',
    startedAt: date(data['started_at']),
    endedAt: optionalDate(data['ended_at']),
    work: list(data['work']).map((entry) => {
      const exercise = record(entry);
      return { exerciseId: string(exercise['exercise_id']), sets: number(exercise['sets'], 0) };
    }),
    firstSetAt: optionalDate(data['first_set_at']),
    lastSetAt: optionalDate(data['last_set_at']),
  };
}

function decodeBest(value: unknown): FriendBest {
  const best = record(value);
  return {
    exerciseId: string(best['exercise_id']),
    bestKg: number(best['best_kg'], 0),
    lastAt: date(best['last_at']),
  };
}

export function decodeTraining(value: unknown): FriendTraining {
  const data = record(value);
  const last = data['last_workout'];
  return {
    lastActiveAt: optionalDate(data['last_active_at']),
    daysPerWeek: optionalNumber(data['days_per_week']),
    trainedAt: list(data['trained_at']).flatMap((at) => {
      const parsed = optionalDate(at);
      return parsed === null ? [] : [parsed];
    }),
    // A best with no weight is no best; the card would show it as a dash.
    bests: list(data['bests'])
      .map(decodeBest)
      .filter((best) => best.bestKg > 0),
    lastWorkout: last === null || last === undefined ? null : decodeWorkoutSummary(last),
  };
}

export function decodeOverview(value: unknown): FriendsOverview {
  const data = record(value);
  const me = data['me'];
  return {
    me:
      me === null || me === undefined
        ? null
        : {
            code: string(record(me)['code']),
            sharing: record(me)['sharing'] !== false,
          },
    requests: list(data['requests']).map((entry) => {
      const request = record(entry);
      return {
        id: string(request['id']),
        userId: string(request['user_id']),
        name: optionalString(request['name']),
        requestedAt: date(request['requested_at']),
      };
    }),
    friends: list(data['friends']).map((entry) => {
      const friend = record(entry);
      const sharing = friend['sharing'] === true;
      const training = friend['training'];
      return {
        userId: string(friend['user_id']),
        name: optionalString(friend['name']),
        sharing,
        training:
          sharing && training !== null && training !== undefined ? decodeTraining(training) : null,
      };
    }),
  };
}

export function decodeDetail(value: unknown): FriendDetail {
  const data = record(value);
  return {
    userId: string(data['user_id']),
    name: optionalString(data['name']),
    training: decodeTraining(data['training']),
    bests: list(data['bests']).map(decodeBest),
    recent: list(data['recent']).map(decodeWorkoutSummary),
  };
}

export function decodeSession(value: unknown): FriendSession {
  const data = record(value);
  return {
    ...decodeWorkoutSummary(data),
    exercises: list(data['exercises']).map((entry) => {
      const exercise = record(entry);
      return {
        exerciseId: string(exercise['exercise_id']),
        sets: list(exercise['sets']).map(decodeSet),
        supersetId: optionalString(exercise['superset_id']),
      };
    }),
  };
}

function decodeSet(value: unknown): FriendSessionSet {
  const set = record(value);
  return {
    setType: oneOf(set['set_type'], SET_TYPES),
    loadType: oneOf(set['load_type'], LOAD_TYPES),
    weightKg: number(set['weight_kg'], 0),
    reps: number(set['reps'], 0),
    isCompleted: set['is_completed'] === true,
    completedAt: optionalDate(set['completed_at']),
    bout: {
      ...EMPTY_BOUT,
      durationSeconds: optionalNumber(set['duration_seconds']),
      distanceM: optionalNumber(set['distance_m']),
      speedKmh: optionalNumber(set['speed_kmh']),
      inclinePercent: optionalNumber(set['incline_percent']),
      resistanceLevel: optionalNumber(set['resistance_level']),
      avgWatts: optionalNumber(set['avg_watts']),
      floors: optionalNumber(set['floors']),
      caloriesKcal: optionalNumber(set['calories_kcal']),
    },
  };
}

export function decodeLeaderboard(value: unknown): readonly BoardFriend[] {
  return list(record(value)['friends']).map((entry) => {
    const friend = record(entry);
    const sharing = friend['sharing'] === true;
    return {
      userId: string(friend['user_id']),
      name: optionalString(friend['name']),
      sharing,
      workouts: sharing ? list(friend['workouts']).map(decodeBoardWorkout) : [],
    };
  });
}

function decodeBoardWorkout(value: unknown): BoardWorkout {
  const data = record(value);
  return {
    startedAt: date(data['started_at']),
    clockKnown: data['source'] !== 'past',
    firstSetAt: optionalDate(data['first_set_at']),
    lastSetAt: optionalDate(data['last_set_at']),
    sets: number(data['sets'], 0),
    liftedKg: number(data['lifted_kg'], 0),
  };
}

export function decodeChallenges(value: unknown): readonly Challenge[] {
  return list(record(value)['challenges']).map((entry) => {
    const data = record(entry);
    const status = oneOf(data['status'], ['pending', 'active'] as const);
    const sent = data['workouts'];
    return {
      id: string(data['id']),
      friendId: string(data['friend_id']),
      name: optionalString(data['name']),
      sentByMe: data['sent_by_me'] === true,
      stat: oneOf(data['stat'], LEADERBOARD_STATS),
      ranking: oneOf(data['ranking'], LEADERBOARD_RANKINGS),
      status,
      sentAt: date(data['sent_at']),
      startsAt: status === 'active' ? date(data['starts_at']) : null,
      sharing: data['sharing'] === true,
      workouts:
        status === 'active' && sent !== null && sent !== undefined
          ? list(sent).map(decodeBoardWorkout)
          : null,
    };
  });
}

export function decodeChallengeSend(value: unknown): {
  readonly outcome: ChallengeSendOutcome;
  readonly name: string | null;
} {
  const data = record(value);
  return {
    outcome: oneOf(data['outcome'], CHALLENGE_SEND_OUTCOMES),
    name: optionalString(data['name']),
  };
}

export function decodeChallengeAnswer(value: unknown): ChallengeAnswerOutcome {
  return oneOf(record(value)['outcome'], CHALLENGE_ANSWER_OUTCOMES);
}
