import { describe, expect, it } from 'vitest';
import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  appliedTheme,
  readTheme,
  writeTheme,
  type ThemeStorage,
} from './theme.js';

function memoryStorage(initial: Record<string, string> = {}): ThemeStorage & {
  readonly values: Map<string, string>;
} {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

const throwing: ThemeStorage = {
  getItem: () => {
    throw new Error('SecurityError');
  },
  setItem: () => {
    throw new Error('QuotaExceededError');
  },
};

describe('readTheme', () => {
  it('is dark until somebody chooses', () => {
    expect(DEFAULT_THEME).toBe('dark');
    expect(readTheme(memoryStorage())).toBe('dark');
  });

  it('reads back a choice that was made', () => {
    expect(readTheme(memoryStorage({ [THEME_STORAGE_KEY]: 'light' }))).toBe('light');
  });

  it('treats anything it does not recognise as the default', () => {
    expect(readTheme(memoryStorage({ [THEME_STORAGE_KEY]: 'sepia' }))).toBe('dark');
  });

  it('survives storage that refuses to be read', () => {
    expect(readTheme(throwing)).toBe('dark');
  });
});

describe('writeTheme', () => {
  it('remembers the choice', () => {
    const storage = memoryStorage();
    writeTheme('light', storage);
    expect(storage.values.get(THEME_STORAGE_KEY)).toBe('light');
    expect(readTheme(storage)).toBe('light');
  });

  it('does not throw when storage is full or switched off', () => {
    expect(() => {
      writeTheme('light', throwing);
    }).not.toThrow();
  });
});

describe('appliedTheme', () => {
  /** v1 is dark only. The switch is kept; its effect waits for a light palette. */
  it('draws dark whatever was chosen', () => {
    expect(appliedTheme('dark')).toBe('dark');
    expect(appliedTheme('light')).toBe('dark');
  });
});
