import { describe, expect, it } from 'vitest';
import {
  SESSION_TIME_STORAGE_KEY,
  readSessionMinutes,
  writeSessionMinutes,
  type TimeStorage,
} from './session-time-settings.js';

function memory(initial: Record<string, string> = {}): TimeStorage {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

describe('time today', () => {
  it('is no limit until something is chosen', () => {
    expect(readSessionMinutes(memory())).toBeNull();
  });

  it('remembers the last choice, and no limit', () => {
    const storage = memory();
    writeSessionMinutes(45, storage);
    expect(readSessionMinutes(storage)).toBe(45);
    writeSessionMinutes(null, storage);
    expect(readSessionMinutes(storage)).toBeNull();
  });

  it('reads anything it did not write as no limit', () => {
    expect(readSessionMinutes(memory({ [SESSION_TIME_STORAGE_KEY]: '37' }))).toBeNull();
    expect(readSessionMinutes(memory({ [SESSION_TIME_STORAGE_KEY]: '{oops' }))).toBeNull();
  });

  it('survives storage that refuses to be used', () => {
    const broken: TimeStorage = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
    };
    expect(readSessionMinutes(broken)).toBeNull();
    expect(() => {
      writeSessionMinutes(30, broken);
    }).not.toThrow();
  });
});
