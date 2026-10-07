/**
 * The little of a friend's training that stays on this phone.
 *
 * Two things, both in local storage and both small:
 *
 * **The friend workouts you have opened**, the last few, exactly as the server
 * sent them. "Do this workout" is pressed standing at a rack, which is where a
 * phone has no signal; a workout read on the bus should still start in the
 * basement. Nothing else about friends works offline, and nothing else is kept.
 *
 * **Their numbers for the workout you started from theirs**, so the logger can
 * show "Alex: 5 × 100 kg" beside each exercise. Device-only on purpose: it is
 * a note for this session, not training data, and writing it into your synced
 * rows would keep a friend's numbers in your account after they stopped
 * sharing them (ADR-0105).
 *
 * Both are labelled with the account that wrote them and are cleared on
 * sign-out, so a phone handed to somebody else does not hand them your
 * friends' workouts too.
 */
import type { LoadType } from '@g7m/core';
import type { NoticeStorage } from '../workout-notice.js';

export const FRIEND_SESSIONS_KEY = 'g7m.friendSessions';
export const FRIEND_WORKOUT_KEY = 'g7m.friendWorkout';

/** How many opened workouts to keep. Enough for "the ones I looked at this week". */
export const KEPT_SESSIONS = 10;

interface StoredSession {
  readonly friendId: string;
  readonly sessionId: string;
  readonly friendName: string | null;
  /** The server's reply, undecoded. */
  readonly reply: unknown;
}

interface StoredSessions {
  readonly owner: string;
  readonly entries: readonly StoredSession[];
}

export interface FriendReference {
  readonly reps: number;
  readonly weightKg: number;
  readonly loadType: LoadType;
}

/** What the logger needs to say whose workout this was, and their numbers. */
export interface FriendWorkoutNote {
  readonly owner: string;
  /** The session started from it, on this account. */
  readonly sessionId: string;
  readonly friendName: string | null;
  /** Their heaviest working set, by exercise id. */
  readonly references: Readonly<Record<string, FriendReference>>;
}

function read(storage: NoticeStorage | undefined, key: string): unknown {
  try {
    const text = storage?.getItem(key) ?? null;
    return text === null ? null : (JSON.parse(text) as unknown);
  } catch {
    // Private browsing, storage switched off, or something unreadable left by
    // another build. None of it is worth more than starting again.
    return null;
  }
}

function write(storage: NoticeStorage | undefined, key: string, value: unknown): void {
  try {
    if (value === null) storage?.removeItem(key);
    else storage?.setItem(key, JSON.stringify(value));
  } catch {
    // A full or disabled store: the workout simply is not there offline.
  }
}

function sessionsFor(owner: string, storage: NoticeStorage | undefined): StoredSession[] {
  const stored = read(storage, FRIEND_SESSIONS_KEY) as Partial<StoredSessions> | null;
  if (stored?.owner !== owner || !Array.isArray(stored.entries)) return [];
  return (stored.entries as unknown[]).filter(isStoredSession);
}

function isStoredSession(value: unknown): value is StoredSession {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as Record<string, unknown>;
  return typeof entry['friendId'] === 'string' && typeof entry['sessionId'] === 'string';
}

/** Keep one opened workout, newest first, dropping the oldest past the limit. */
export function rememberFriendSession(
  owner: string,
  entry: StoredSession,
  storage: NoticeStorage | undefined = globalThis.localStorage,
): void {
  const others = sessionsFor(owner, storage).filter(
    (kept) => !(kept.friendId === entry.friendId && kept.sessionId === entry.sessionId),
  );
  write(storage, FRIEND_SESSIONS_KEY, {
    owner,
    entries: [entry, ...others].slice(0, KEPT_SESSIONS),
  } satisfies StoredSessions);
}

/** A workout opened before, as the server sent it, or null. */
export function recallFriendSession(
  owner: string,
  friendId: string,
  sessionId: string,
  storage: NoticeStorage | undefined = globalThis.localStorage,
): { readonly reply: unknown; readonly friendName: string | null } | null {
  const found = sessionsFor(owner, storage).find(
    (entry) => entry.friendId === friendId && entry.sessionId === sessionId,
  );
  return found === undefined ? null : { reply: found.reply, friendName: found.friendName };
}

/** Forget a workout the server no longer shows: unshared, removed, or deleted. */
export function forgetFriendSession(
  owner: string,
  friendId: string,
  sessionId: string,
  storage: NoticeStorage | undefined = globalThis.localStorage,
): void {
  const kept = sessionsFor(owner, storage).filter(
    (entry) => !(entry.friendId === friendId && entry.sessionId === sessionId),
  );
  write(storage, FRIEND_SESSIONS_KEY, { owner, entries: kept } satisfies StoredSessions);
}

export function writeFriendWorkoutNote(
  note: FriendWorkoutNote,
  storage: NoticeStorage | undefined = globalThis.localStorage,
): void {
  write(storage, FRIEND_WORKOUT_KEY, note);
}

/** The note for this session on this account, or null for any other. */
export function readFriendWorkoutNote(
  owner: string,
  sessionId: string,
  storage: NoticeStorage | undefined = globalThis.localStorage,
): FriendWorkoutNote | null {
  const note = read(storage, FRIEND_WORKOUT_KEY) as Partial<FriendWorkoutNote> | null;
  if (note?.owner !== owner || note.sessionId !== sessionId) return null;
  if (typeof note.references !== 'object' || note.references === null) return null;
  return note as FriendWorkoutNote;
}

/** Everything above, for sign-out and account deletion. */
export function forgetFriendsOnDevice(
  storage: NoticeStorage | undefined = globalThis.localStorage,
): void {
  write(storage, FRIEND_SESSIONS_KEY, null);
  write(storage, FRIEND_WORKOUT_KEY, null);
}
