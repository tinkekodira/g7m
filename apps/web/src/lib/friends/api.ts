/**
 * Friends, over the network.
 *
 * Every call here is a Postgres function through PostgREST (`supabase.rpc`),
 * never PowerSync: a friend's training is somebody else's rows, and the sync
 * bucket that carries a user's own rows is the access control between users
 * (ADR-0105). So this needs a connection, the screens say so when there is
 * none, and nothing here is kept in the local database.
 */
import { supabase } from '../supabase.js';
import { describeDataError } from '../errors.js';
import {
  FriendsError,
  decodeDetail,
  decodeLeaderboard,
  decodeOverview,
  decodeSendResult,
  type BoardFriend,
  type FriendDetail,
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
