import { describe, expect, it } from 'vitest';
import { PLATE_SLOTS } from '@g7m/core';
import {
  DEFAULT_PLATE_SETTINGS,
  PLATE_SETTINGS_STORAGE_KEY,
  readPlateSettings,
  writePlateSettings,
  type SettingsStorage,
} from './plate-calculator-settings.js';

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

describe('readPlateSettings', () => {
  it('is every plate, both bar defaults, until somebody chooses', () => {
    const settings = readPlateSettings(memoryStorage());
    expect(settings).toEqual(DEFAULT_PLATE_SETTINGS);
    expect(settings.availableSlots.size).toBe(7);
  });

  it('reads back a selection and EZ bar weight that were saved', () => {
    const storage = memoryStorage({
      [PLATE_SETTINGS_STORAGE_KEY]: JSON.stringify({
        slots: ['blue', 'green', 'black'],
        ezKg: 7.5,
        ezLb: 15,
      }),
    });
    const settings = readPlateSettings(storage);
    expect([...settings.availableSlots].sort()).toEqual(['black', 'blue', 'green']);
    expect(settings.ezBarWeightKg).toBe(7.5);
    expect(settings.ezBarWeightLb).toBe(15);
  });

  it('falls back to every plate rather than an empty selection', () => {
    const storage = memoryStorage({
      [PLATE_SETTINGS_STORAGE_KEY]: JSON.stringify({ slots: [] }),
    });
    expect(readPlateSettings(storage).availableSlots.size).toBe(7);
  });

  it('drops a slot it no longer recognises rather than failing the whole read', () => {
    const storage = memoryStorage({
      [PLATE_SETTINGS_STORAGE_KEY]: JSON.stringify({ slots: ['red', 'purple', 'blue'] }),
    });
    expect([...readPlateSettings(storage).availableSlots].sort()).toEqual(['blue', 'red']);
  });

  it('falls back to the default EZ bar weight when the stored one is not a positive number', () => {
    const storage = memoryStorage({
      [PLATE_SETTINGS_STORAGE_KEY]: JSON.stringify({ ezKg: -1, ezLb: 'a lot' }),
    });
    const settings = readPlateSettings(storage);
    expect(settings.ezBarWeightKg).toBe(DEFAULT_PLATE_SETTINGS.ezBarWeightKg);
    expect(settings.ezBarWeightLb).toBe(DEFAULT_PLATE_SETTINGS.ezBarWeightLb);
  });

  it('treats malformed JSON as the defaults', () => {
    const storage = memoryStorage({ [PLATE_SETTINGS_STORAGE_KEY]: '{not json' });
    expect(readPlateSettings(storage)).toEqual(DEFAULT_PLATE_SETTINGS);
  });

  it('survives storage that refuses to be read', () => {
    expect(readPlateSettings(throwing)).toEqual(DEFAULT_PLATE_SETTINGS);
  });
});

describe('writePlateSettings', () => {
  it('remembers a selection and EZ bar weight', () => {
    const storage = memoryStorage();
    writePlateSettings(
      { availableSlots: new Set(['red', 'blue']), ezBarWeightKg: 8, ezBarWeightLb: 17.5 },
      storage,
    );
    const settings = readPlateSettings(storage);
    expect([...settings.availableSlots].sort()).toEqual(['blue', 'red']);
    expect(settings.ezBarWeightKg).toBe(8);
    expect(settings.ezBarWeightLb).toBe(17.5);
  });

  it('does not throw when storage is full or switched off', () => {
    expect(() => {
      writePlateSettings(DEFAULT_PLATE_SETTINGS, throwing);
    }).not.toThrow();
  });

  it('round-trips every slot', () => {
    const storage = memoryStorage();
    writePlateSettings(
      { availableSlots: new Set(PLATE_SLOTS), ezBarWeightKg: 10, ezBarWeightLb: 20 },
      storage,
    );
    expect(readPlateSettings(storage).availableSlots.size).toBe(PLATE_SLOTS.length);
  });
});
