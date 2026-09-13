import { describe, expect, it } from 'vitest';
import { EMPTY_BOUT, type Bout } from '@g7m/core';
import {
  boutSummary,
  caloriesText,
  describeCalorieSource,
  fieldLabel,
  parseNumberField,
} from './bout-copy.js';
import {
  clearTimer,
  elapsedSeconds,
  readTimer,
  startTimer,
  timerKey,
  type TimerStorage,
} from './bout-timer.js';

function bout(fields: Partial<Bout>): Bout {
  return { ...EMPTY_BOUT, ...fields };
}

describe('fieldLabel', () => {
  it('names each field with the unit it is typed in', () => {
    expect(fieldLabel('distance', 'treadmill', 'metric')).toBe('Distance (km)');
    expect(fieldLabel('distance', 'treadmill', 'imperial')).toBe('Distance (mi)');
    expect(fieldLabel('distance', 'rower', 'imperial')).toBe('Distance (m)');
    expect(fieldLabel('speed', 'treadmill', 'imperial')).toBe('Speed (mph)');
    expect(fieldLabel('incline', 'treadmill', 'metric')).toBe('Incline (%)');
    expect(fieldLabel('watts', 'bike', 'metric')).toBe('Avg watts');
    expect(fieldLabel('level', 'stair_climber', 'metric')).toBe('Level');
    expect(fieldLabel('floors', 'stair_climber', 'metric')).toBe('Floors');
  });
});

describe('describeCalorieSource', () => {
  it('says where a figure came from', () => {
    expect(describeCalorieSource('machine', 'bike')).toBe('From the machine.');
    expect(describeCalorieSource('treadmill', 'treadmill')).toMatch(/speed and incline/);
    expect(describeCalorieSource('pace', 'rower')).toMatch(/pace/);
  });

  it('tells a rough one what would make it better', () => {
    expect(describeCalorieSource('met', 'treadmill')).toMatch(/rough.*Add the speed/);
    expect(describeCalorieSource('met', 'stair_climber')).toMatch(/Add the floors/);
  });
});

describe('boutSummary', () => {
  it('reads like the display, time first', () => {
    // 5 km in 25 min is 200 m/min: 0.2 × 200 + 3.5 = 43.5 → 17.4 kcal/min × 25.
    expect(
      boutSummary('treadmill', bout({ durationSeconds: 1500, distanceM: 5000 }), 'metric', 80),
    ).toBe('25:00 · 5 km · 5:00 /km · ≈ 435 kcal');
  });

  it('gives a rower its split and the machine’s own calories', () => {
    expect(
      boutSummary(
        'rower',
        bout({ durationSeconds: 480, distanceM: 2000, caloriesKcal: 130 }),
        'imperial',
        80,
      ),
    ).toBe('8:00 · 2,000 m · 2:00 /500 m · 130 kcal');
  });

  it('counts floors on a stair climber', () => {
    expect(
      boutSummary('stair_climber', bout({ durationSeconds: 600, floors: 30 }), 'metric', 80),
    ).toBe('10:00 · 30 floors · ≈ 144 kcal');
  });

  it('says so when nothing was written down', () => {
    expect(boutSummary('bike', EMPTY_BOUT, 'metric', 80)).toBe('Nothing recorded');
  });
});

describe('caloriesText', () => {
  it('marks an estimate, and not the machine’s figure', () => {
    expect(caloriesText({ kcal: 1234, method: 'met', rough: true })).toBe('≈ 1,234 kcal');
    expect(caloriesText({ kcal: 320, method: 'machine', rough: false })).toBe('320 kcal');
  });
});

describe('parseNumberField', () => {
  it('reads numbers, commas included', () => {
    expect(parseNumberField('5.2')).toBe(5.2);
    expect(parseNumberField(' 5,2 ')).toBe(5.2);
  });

  it('reads an empty box as not recorded, and a typo as a typo', () => {
    expect(parseNumberField('')).toBeNull();
    expect(parseNumberField('5..2')).toBe('invalid');
    expect(parseNumberField('fast')).toBe('invalid');
  });
});

describe('the bout timer', () => {
  function memory(): TimerStorage & { readonly values: Map<string, string> } {
    const values = new Map<string, string>();
    return {
      values,
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => {
        values.set(key, value);
      },
      removeItem: (key) => {
        values.delete(key);
      },
    };
  }

  it('counts from where it started, by the clock', () => {
    expect(elapsedSeconds({ startedAt: 1_000_000, baseSeconds: 0 }, 1_000_000 + 90_500)).toBe(90);
  });

  it('adds to the time already on the bout', () => {
    expect(elapsedSeconds({ startedAt: 0, baseSeconds: 600 }, 60_000)).toBe(660);
  });

  it('never runs backwards if the clock does', () => {
    expect(elapsedSeconds({ startedAt: 10_000, baseSeconds: 30 }, 5_000)).toBe(30);
  });

  it('survives the page going away, and is gone once cleared', () => {
    const storage = memory();
    startTimer('set-1', 120, 5_000, storage);
    expect(readTimer('set-1', storage)).toEqual({ startedAt: 5_000, baseSeconds: 120 });
    clearTimer('set-1', storage);
    expect(readTimer('set-1', storage)).toBeNull();
  });

  it('reads anything broken as no timer', () => {
    const storage = memory();
    storage.values.set(timerKey('set-1'), '{not json');
    storage.values.set(timerKey('set-2'), JSON.stringify({ startedAt: 'yesterday' }));
    expect(readTimer('set-1', storage)).toBeNull();
    expect(readTimer('set-2', storage)).toBeNull();
    expect(readTimer('set-3', undefined)).toBeNull();
  });
});
