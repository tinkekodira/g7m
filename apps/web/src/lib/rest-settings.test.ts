import { describe, expect, it } from 'vitest';
import {
  DEFAULT_REST_SETTINGS,
  REST_MAX_SECONDS,
  REST_MIN_SECONDS,
  REST_SETTINGS_STORAGE_KEY,
  chosenRestSeconds,
  readRestSettings,
  tidyRestSeconds,
  writeRestSettings,
  type SettingsStorage,
} from './rest-settings.js';

function memoryStorage(initial: Record<string, string> = {}): SettingsStorage & {
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

const throwing: SettingsStorage = {
  getItem: () => {
    throw new Error('SecurityError');
  },
  setItem: () => {
    throw new Error('QuotaExceededError');
  },
};

describe('readRestSettings', () => {
  /** Off: the timer keeps doing what it did before the setting existed. */
  it('is off, at three minutes and ninety seconds, until somebody chooses', () => {
    expect(readRestSettings(memoryStorage())).toEqual(DEFAULT_REST_SETTINGS);
    expect(DEFAULT_REST_SETTINGS).toEqual({ custom: false, compound: 180, isolation: 90 });
  });

  it('reads back what was saved', () => {
    const storage = memoryStorage();
    writeRestSettings({ custom: true, compound: 150, isolation: 60 }, storage);
    expect(readRestSettings(storage)).toEqual({ custom: true, compound: 150, isolation: 60 });
  });

  it('falls back field by field on anything malformed', () => {
    const storage = memoryStorage({
      [REST_SETTINGS_STORAGE_KEY]: JSON.stringify({ custom: 'yes', compound: 'x', isolation: 45 }),
    });
    expect(readRestSettings(storage)).toEqual({ custom: false, compound: 180, isolation: 45 });
  });

  it('reads the defaults from unparseable text and from storage that throws', () => {
    expect(readRestSettings(memoryStorage({ [REST_SETTINGS_STORAGE_KEY]: '{' }))).toEqual(
      DEFAULT_REST_SETTINGS,
    );
    expect(readRestSettings(throwing)).toEqual(DEFAULT_REST_SETTINGS);
  });

  it('pulls a stored time back into range', () => {
    const storage = memoryStorage({
      [REST_SETTINGS_STORAGE_KEY]: JSON.stringify({ custom: true, compound: 9999, isolation: 1 }),
    });
    expect(readRestSettings(storage)).toEqual({
      custom: true,
      compound: REST_MAX_SECONDS,
      isolation: REST_MIN_SECONDS,
    });
  });
});

describe('writeRestSettings', () => {
  it('swallows storage that throws', () => {
    expect(() => {
      writeRestSettings(DEFAULT_REST_SETTINGS, throwing);
    }).not.toThrow();
  });
});

describe('tidyRestSeconds', () => {
  it('rounds to the fifteen-second step', () => {
    expect(tidyRestSeconds(97)).toBe(90);
    expect(tidyRestSeconds(98)).toBe(105);
  });

  it('refuses what is not a number', () => {
    expect(tidyRestSeconds(Number.NaN)).toBeNull();
  });
});

describe('chosenRestSeconds', () => {
  it('is nothing while the setting is off', () => {
    expect(chosenRestSeconds(DEFAULT_REST_SETTINGS, 'compound')).toBeNull();
  });

  it('is the time for that kind of lift while it is on', () => {
    const settings = { custom: true, compound: 180, isolation: 60 };
    expect(chosenRestSeconds(settings, 'compound')).toBe(180);
    expect(chosenRestSeconds(settings, 'isolation')).toBe(60);
  });
});
