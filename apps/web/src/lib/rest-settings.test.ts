import { describe, expect, it } from 'vitest';
import {
  DEFAULT_REST_SETTINGS,
  REST_ADJUST_MAX_SECONDS,
  REST_ADJUST_MIN_SECONDS,
  REST_MAX_SECONDS,
  REST_MIN_SECONDS,
  REST_SETTINGS_STORAGE_KEY,
  chosenRestSeconds,
  formatAdjust,
  readRestSettings,
  tidyAdjustSeconds,
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
    expect(DEFAULT_REST_SETTINGS).toEqual({
      custom: false,
      compound: 180,
      isolation: 90,
      adjust: 30,
      sound: true,
    });
  });

  it('reads back what was saved', () => {
    const storage = memoryStorage();
    const saved = { custom: true, compound: 150, isolation: 60, adjust: 20, sound: false };
    writeRestSettings(saved, storage);
    expect(readRestSettings(storage)).toEqual(saved);
  });

  /** Saved before the step and the sound existed: 30 seconds, and the sound on. */
  it('gives settings saved before the step and the sound existed their defaults', () => {
    const storage = memoryStorage({
      [REST_SETTINGS_STORAGE_KEY]: JSON.stringify({ custom: true, compound: 150, isolation: 60 }),
    });
    expect(readRestSettings(storage)).toEqual({
      custom: true,
      compound: 150,
      isolation: 60,
      adjust: 30,
      sound: true,
    });
  });

  it('turns the sound off only for an explicit off', () => {
    const read = (sound: unknown) =>
      readRestSettings(memoryStorage({ [REST_SETTINGS_STORAGE_KEY]: JSON.stringify({ sound }) }))
        .sound;
    expect(read(false)).toBe(false);
    expect(read(true)).toBe(true);
    expect(read('off')).toBe(true);
  });

  it('falls back field by field on anything malformed', () => {
    const storage = memoryStorage({
      [REST_SETTINGS_STORAGE_KEY]: JSON.stringify({ custom: 'yes', compound: 'x', isolation: 45 }),
    });
    expect(readRestSettings(storage)).toEqual({
      ...DEFAULT_REST_SETTINGS,
      custom: false,
      compound: 180,
      isolation: 45,
    });
  });

  it('reads the defaults from unparseable text and from storage that throws', () => {
    expect(readRestSettings(memoryStorage({ [REST_SETTINGS_STORAGE_KEY]: '{' }))).toEqual(
      DEFAULT_REST_SETTINGS,
    );
    expect(readRestSettings(throwing)).toEqual(DEFAULT_REST_SETTINGS);
  });

  it('pulls a stored time back into range', () => {
    const storage = memoryStorage({
      [REST_SETTINGS_STORAGE_KEY]: JSON.stringify({
        custom: true,
        compound: 9999,
        isolation: 1,
        adjust: 1000,
      }),
    });
    expect(readRestSettings(storage)).toEqual({
      custom: true,
      compound: REST_MAX_SECONDS,
      isolation: REST_MIN_SECONDS,
      adjust: REST_ADJUST_MAX_SECONDS,
      sound: true,
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

describe('tidyAdjustSeconds', () => {
  it('keeps the steps people asked for, twenty included', () => {
    for (const seconds of [15, 20, 30, 45]) expect(tidyAdjustSeconds(seconds)).toBe(seconds);
  });

  it('rounds to five seconds and stays in range', () => {
    expect(tidyAdjustSeconds(22)).toBe(20);
    expect(tidyAdjustSeconds(0)).toBe(REST_ADJUST_MIN_SECONDS);
    expect(tidyAdjustSeconds(600)).toBe(REST_ADJUST_MAX_SECONDS);
  });

  it('refuses what is not a number', () => {
    expect(tidyAdjustSeconds(Number.NaN)).toBeNull();
  });
});

describe('formatAdjust', () => {
  it('says seconds under a minute and m:ss from one up', () => {
    expect(formatAdjust(30)).toBe('30s');
    expect(formatAdjust(5)).toBe('5s');
    expect(formatAdjust(60)).toBe('1:00');
    expect(formatAdjust(90)).toBe('1:30');
  });
});

describe('chosenRestSeconds', () => {
  it('is nothing while the setting is off', () => {
    expect(chosenRestSeconds(DEFAULT_REST_SETTINGS, 'compound')).toBeNull();
  });

  it('is the time for that kind of lift while it is on', () => {
    const settings = { ...DEFAULT_REST_SETTINGS, custom: true, compound: 180, isolation: 60 };
    expect(chosenRestSeconds(settings, 'compound')).toBe(180);
    expect(chosenRestSeconds(settings, 'isolation')).toBe(60);
  });
});
