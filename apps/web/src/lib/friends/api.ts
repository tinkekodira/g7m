/**
 * Friends, over the network.
 *
 * Every call here is a Postgres function through PostgREST (`supabase.rpc`),
 * never PowerSync: a friend's training is somebody else's rows, and the sync
 * bucket that carries a user's own rows is the access control between users
 * (ADR-0105). So this needs a connection, the screens say so when there is
 * none, and nothing here is kept in the local database.
 */
import type { EarnedAchievement, LeaderboardRanking, LeaderboardStat } from '@g7m/core';
import { supabase } from '../supabase.js';
import { describeDataError } from '../errors.js';
import {
  FriendsError,
  decodeChallengeAnswer,
  decodeChallengeSend,
  decodeChallenges,
  decodeChallengeHistory,
  type ChallengeFilter,
  type ChallengeHistory,
  decodeDetail,
  decodeFriendProfile,
  decodeLeaderboard,
  decodeOverview,
  decodeSendResult,
  type BoardFriend,
  type Challenge,
  type ChallengeAnswerOutcome,
  type ChallengeSendOutcome,
  type FriendDetail,
  type FriendProfile,
  type FriendsOverview,
  type SendResult,
} from './decode.js';

export * from './decode.js';

// ---------------------------------------------------------------------------
// Calls
// ---------------------------------------------------------------------------

async function rpc(name: string, args?: Record<string, unknown>): Promise<unknown> {
  const response: { readonly data: unknown; readonly error: { readonly message: string } | null } =
    await supabase.rpc(name, args);
  if (response.error !== null) throw new FriendsError(describeDataError(response.error.message));
  return response.data;
}

export async function fetchOverview(): Promise<FriendsOverview> {
  return decodeOverview(await rpc('friends_overview'));
}

/**
 * Every friend, with the workouts of those who share since `since` — the
 * start of last month, worked out on this phone in its own timezone.
 */
export async function fetchLeaderboard(since: Date): Promise<readonly BoardFriend[]> {
  return decodeLeaderboard(await rpc('friends_leaderboard', { since: since.toISOString() }));
}

/** Null when they are not a friend sharing their training — or no longer one. */
export async function fetchFriend(friendId: string): Promise<FriendDetail | null> {
  const data = await rpc('friend_detail', { friend_id: friendId });
  return data === null ? null : decodeDetail(data);
}

/**
 * A friend's body, achievements, routines and best lifts (ADR-0117), with
 * the heat counted from `since`. Null when they are not a friend sharing
 * their training.
 */
export async function fetchFriendProfile(
  friendId: string,
  since: Date,
): Promise<FriendProfile | null> {
  const data = await rpc('friend_profile', { friend_id: friendId, since: since.toISOString() });
  return data === null ? null : decodeFriendProfile(data);
}

/** Your earned badges, for friends to see. Replaces whatever was published before. */
export async function publishAchievements(earned: readonly EarnedAchievement[]): Promise<void> {
  await rpc('publish_achievements', {
    earned: earned.map((each) => ({ key: each.key, earned_at: each.earnedAt.toISOString() })),
  });
}

/** Your total XP, for friends to read your level from. ADR-0132. */
export async function publishXp(total: number): Promise<void> {
  await rpc('publish_xp', { total });
}

/**
 * The server's reply for one of a friend's workouts, undecoded, so it can be
 * kept on the device exactly as it came (`cache.ts`) and decoded on the way
 * out with `decodeSession`. Null when it is not theirs to show.
 */
export async function fetchFriendSessionReply(
  friendId: string,
  sessionId: string,
): Promise<unknown> {
  return rpc('friend_session', { friend_id: friendId, session_id: sessionId });
}

export async function sendFriendRequest(code: string): Promise<SendResult> {
  return decodeSendResult(await rpc('send_friend_request', { code }));
}

export async function answerFriendRequest(requestId: string, accept: boolean): Promise<void> {
  await rpc('respond_to_friend_request', { request_id: requestId, accept });
}

export async function removeFriend(friendId: string): Promise<void> {
  await rpc('remove_friend', { friend_id: friendId });
}

export async function setTrainingSharing(enabled: boolean): Promise<void> {
  await rpc('set_training_sharing', { enabled });
}

export async function touchLastActive(): Promise<void> {
  await rpc('touch_last_active');
}

/** Pending, running, finalizing and unacknowledged finished challenges. */
export async function fetchChallenges(): Promise<readonly Challenge[]> {
  return decodeChallenges(await rpc('my_challenges'));
}

export async function acknowledgeChallenge(id: string): Promise<void> {
  await rpc('acknowledge_challenge', { challenge_id: id });
  globalThis.dispatchEvent(new Event('challenge-results-changed'));
}

export async function claimChallengeResults(): Promise<readonly Challenge[]> {
  const results = decodeChallenges(await rpc('claim_challenge_results'));
  if (results.length > 0) globalThis.dispatchEvent(new Event('challenge-results-changed'));
  return results;
}

export async function fetchChallengeHistory(
  filter: ChallengeFilter = 'all',
  offset = 0,
): Promise<ChallengeHistory> {
  return decodeChallengeHistory(
    await rpc('challenge_history', { result_filter: filter, page_offset: offset }),
  );
}

export async function sendChallenge(
  friendId: string,
  stat: LeaderboardStat,
  ranking: LeaderboardRanking,
): Promise<{ readonly outcome: ChallengeSendOutcome; readonly name: string | null }> {
  return decodeChallengeSend(await rpc('send_challenge', { friend_id: friendId, stat, ranking }));
}

export async function answerChallenge(
  challengeId: string,
  accept: boolean,
): Promise<ChallengeAnswerOutcome> {
  return decodeChallengeAnswer(
    await rpc('respond_to_challenge', { challenge_id: challengeId, accept }),
  );
}

export async function withdrawChallenge(challengeId: string): Promise<void> {
  await rpc('withdraw_challenge', { challenge_id: challengeId });
}
