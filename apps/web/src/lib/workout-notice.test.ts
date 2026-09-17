import { describe, expect, it } from 'vitest';
import {
  AUTO_FINISH_STORAGE_KEY,
  clearAutoFinished,
  readAutoFinished,
  readSnoozedAt,
  writeAutoFinished,
  writeSnoozedAt,
} from './workout-notice.js';

function fakeStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
  };
}

const AT = new Date('2026-09-17T10:30:00.000Z');

describe('the still-training answer', () => {
  it('belongs to the workout it was given for', () => {
    const storage = fakeStorage();
    writeSnoozedAt('session-1', AT, storage);
    expect(readSnoozedAt('session-1', storage)).toEqual(AT);
    // The next workout starts with a clean clock, not the last one's answer.
    expect(readSnoozedAt('session-2', storage)).toBeNull();
  });

  it('reads as unanswered when there is nothing, or nonsense, stored', () => {
    expect(readSnoozedAt('session-1', fakeStorage())).toBeNull();
    expect(
      readSnoozedAt('session-1', fakeStorage({ 'g7m.stillTraining': 'session-1|nope' })),
    ).toBeNull();
    expect(readSnoozedAt('session-1', fakeStorage({ 'g7m.stillTraining': 'rubbish' }))).toBeNull();
  });
});

describe('the workout the app finished itself', () => {
  it('is remembered until it has been owned up to', () => {
    const storage = fakeStorage();
    expect(readAutoFinished(storage)).toBeNull();
    writeAutoFinished('session-9', storage);
    expect(readAutoFinished(storage)).toBe('session-9');
    clearAutoFinished(storage);
    expect(readAutoFinished(storage)).toBeNull();
  });

  it('survives a storage that throws', () => {
    const broken = {
      getItem: () => {
        throw new Error('nope');
      },
      setItem: () => {
        throw new Error('nope');
      },
      removeItem: () => {
        throw new Error('nope');
      },
    };
    expect(readAutoFinished(broken)).toBeNull();
    expect(() => {
      writeAutoFinished('session-9', broken);
    }).not.toThrow();
    expect(readAutoFinished(fakeStorage({ [AUTO_FINISH_STORAGE_KEY]: '' }))).toBeNull();
  });
});
