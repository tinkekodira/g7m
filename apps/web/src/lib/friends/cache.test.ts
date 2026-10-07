import { describe, expect, it } from 'vitest';
import {
  FRIEND_SESSIONS_KEY,
  KEPT_SESSIONS,
  forgetFriendSession,
  forgetFriendsOnDevice,
  readFriendWorkoutNote,
  recallFriendSession,
  rememberFriendSession,
  writeFriendWorkoutNote,
} from './cache.js';

function memory() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
    size: () => map.size,
  };
}

const entry = (sessionId: string) => ({
  friendId: 'alex',
  sessionId,
  friendName: 'Alex',
  reply: { id: sessionId },
});

describe('friend workouts kept on the phone', () => {
  it('gives back a workout opened before, to the account that opened it', () => {
    const storage = memory();
    rememberFriendSession('me', entry('s1'), storage);
    expect(recallFriendSession('me', 'alex', 's1', storage)).toEqual({
      reply: { id: 's1' },
      friendName: 'Alex',
    });
    expect(recallFriendSession('someone-else', 'alex', 's1', storage)).toBeNull();
    expect(recallFriendSession('me', 'alex', 's2', storage)).toBeNull();
  });

  it('keeps only the most recent few, newest first, without duplicates', () => {
    const storage = memory();
    for (let index = 0; index < KEPT_SESSIONS + 3; index += 1) {
      rememberFriendSession('me', entry(`s${String(index)}`), storage);
    }
    rememberFriendSession('me', entry('s5'), storage);
    const stored = JSON.parse(storage.getItem(FRIEND_SESSIONS_KEY) ?? '{}') as {
      entries: { sessionId: string }[];
    };
    expect(stored.entries).toHaveLength(KEPT_SESSIONS);
    expect(stored.entries[0]?.sessionId).toBe('s5');
    expect(stored.entries.filter((kept) => kept.sessionId === 's5')).toHaveLength(1);
    expect(recallFriendSession('me', 'alex', 's0', storage)).toBeNull();
  });

  it('forgets one the server stopped showing', () => {
    const storage = memory();
    rememberFriendSession('me', entry('s1'), storage);
    forgetFriendSession('me', 'alex', 's1', storage);
    expect(recallFriendSession('me', 'alex', 's1', storage)).toBeNull();
  });

  it('survives storage that is missing or full of nonsense', () => {
    const storage = memory();
    storage.setItem(FRIEND_SESSIONS_KEY, '{not json');
    expect(recallFriendSession('me', 'alex', 's1', storage)).toBeNull();
    expect(recallFriendSession('me', 'alex', 's1', undefined)).toBeNull();
  });
});

describe('the note for a workout started from a friend’s', () => {
  it('belongs to one session on one account', () => {
    const storage = memory();
    writeFriendWorkoutNote(
      {
        owner: 'me',
        sessionId: 'mine',
        friendName: 'Alex',
        references: { bench: { reps: 5, weightKg: 100, loadType: 'external' } },
      },
      storage,
    );
    expect(readFriendWorkoutNote('me', 'mine', storage)?.references['bench']?.weightKg).toBe(100);
    expect(readFriendWorkoutNote('me', 'another', storage)).toBeNull();
    expect(readFriendWorkoutNote('them', 'mine', storage)).toBeNull();
  });

  it('goes, with the kept workouts, on sign-out', () => {
    const storage = memory();
    rememberFriendSession('me', entry('s1'), storage);
    writeFriendWorkoutNote(
      { owner: 'me', sessionId: 'mine', friendName: null, references: {} },
      storage,
    );
    forgetFriendsOnDevice(storage);
    expect(storage.size()).toBe(0);
  });
});
