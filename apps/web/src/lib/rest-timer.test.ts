import { describe, expect, it } from 'vitest';
import {
  REST_KEPT_AFTER_SECONDS,
  REST_TIMER_STORAGE_KEY,
  readRunningRest,
  restOfSession,
  writeRunningRest,
  type RestTimerStorage,
} from './rest-timer.js';

function memoryStorage(initial: Record<string, string> = {}): RestTimerStorage {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };
}

const throwing: RestTimerStorage = {
  getItem: () => {
    throw new Error('SecurityError');
  },
  setItem: () => {
    throw new Error('QuotaExceededError');
  },
  removeItem: () => {
    throw new Error('SecurityError');
  },
};

const STARTED = new Date('2026-10-13T15:00:00.000Z');
const rest = { sessionId: 'session-1', startedAt: STARTED, seconds: 90 };
const at = (seconds: number) => new Date(STARTED.getTime() + seconds * 1000);

describe('readRunningRest', () => {
  it('brings back what was written, exactly', () => {
    const storage = memoryStorage();
    writeRunningRest(rest, storage);
    expect(readRunningRest(at(30), storage)).toEqual(rest);
  });

  it('is nothing once forgotten, or never written', () => {
    const storage = memoryStorage();
    writeRunningRest(rest, storage);
    writeRunningRest(null, storage);
    expect(readRunningRest(at(30), storage)).toBeNull();
    expect(readRunningRest(at(30), memoryStorage())).toBeNull();
  });

  /** Back from the library to "Rest over": still worth showing for a while. */
  it('keeps a finished rest for a few minutes, then lets it go', () => {
    const storage = memoryStorage();
    writeRunningRest(rest, storage);
    expect(readRunningRest(at(90 + REST_KEPT_AFTER_SECONDS), storage)).toEqual(rest);
    expect(readRunningRest(at(90 + REST_KEPT_AFTER_SECONDS + 1), storage)).toBeNull();
  });

  it('reads nothing from anything malformed, or from storage that throws', () => {
    for (const raw of [
      '{',
      '[]',
      JSON.stringify({ sessionId: '', startedAt: STARTED.toISOString(), seconds: 90 }),
      JSON.stringify({ sessionId: 's', startedAt: 'yesterday', seconds: 90 }),
      JSON.stringify({ sessionId: 's', startedAt: STARTED.toISOString(), seconds: '90' }),
    ]) {
      const storage = memoryStorage({ [REST_TIMER_STORAGE_KEY]: raw });
      expect(readRunningRest(at(1), storage), raw).toBeNull();
    }
    expect(readRunningRest(at(1), throwing)).toBeNull();
  });
});

describe('writeRunningRest', () => {
  it('swallows storage that throws', () => {
    expect(() => {
      writeRunningRest(rest, throwing);
      writeRunningRest(null, throwing);
    }).not.toThrow();
  });
});

describe('restOfSession', () => {
  it('shows a rest only on the workout it belongs to', () => {
    expect(restOfSession(rest, 'session-1')).toBe(rest);
    expect(restOfSession(rest, 'session-2')).toBeNull();
    // The workout has not loaded yet.
    expect(restOfSession(rest, null)).toBeNull();
    expect(restOfSession(null, 'session-1')).toBeNull();
  });
});
