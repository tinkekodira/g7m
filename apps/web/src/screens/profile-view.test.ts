import { describe, expect, it } from 'vitest';
import type { PersonalRecord } from '@g7m/core';
import { bestLifts, goalCardLine, profileStats, type ProfileFacts } from './profile-view.js';

const NOW = new Date(2026, 8, 12, 12);

const EMPTY: ProfileFacts = {
  unitSystem: 'metric',
  weightKg: null,
  weightAt: null,
  heightCm: null,
  birthDate: null,
  sex: null,
  activityLevel: null,
  country: null,
};

function valueOf(facts: ProfileFacts, key: string): string | null | undefined {
  return profileStats(facts, NOW).find((tile) => tile.key === key)?.value;
}

describe('profileStats', () => {
  /** A new profile is mostly blanks, and a blank must never print as "null cm". */
  it('leaves every unknown as a blank rather than a made-up value', () => {
    const tiles = profileStats(EMPTY, NOW);
    expect(tiles.map((tile) => tile.key)).toEqual([
      'weight',
      'height',
      'age',
      'activity',
      'sex',
      'country',
    ]);
    expect(tiles.every((tile) => tile.value === null)).toBe(true);
    expect(tiles.every((tile) => tile.detail === undefined)).toBe(true);
  });

  it('shows what is known, in the lifter’s own units', () => {
    const facts: ProfileFacts = {
      ...EMPTY,
      weightKg: 82.5,
      weightAt: new Date(2026, 8, 9, 8),
      heightCm: 182,
      birthDate: new Date(Date.UTC(2000, 2, 14)),
      sex: 'male',
      activityLevel: 'moderate',
      country: 'HR',
    };
    const tiles = profileStats(facts, NOW);
    const byKey = new Map(tiles.map((tile) => [tile.key, tile]));

    expect(byKey.get('weight')).toMatchObject({ value: '82.5 kg', detail: '3 days ago' });
    expect(byKey.get('height')?.value).toBe('182 cm');
    expect(byKey.get('age')?.value).toBe('26');
    expect(byKey.get('activity')?.value).toBe('Moderately active');
    expect(byKey.get('sex')?.value).toBe('Male');
    expect(byKey.get('country')?.value).toBe('Croatia');
    // With its code, for the flag beside the name.
    expect(byKey.get('country')?.flag).toBe('HR');
  });

  it('converts for somebody who asked for pounds and inches', () => {
    const facts: ProfileFacts = { ...EMPTY, unitSystem: 'imperial', weightKg: 100, heightCm: 180 };
    expect(valueOf(facts, 'weight')).toBe('220.5 lb');
    expect(valueOf(facts, 'height')).toBe('71 in');
  });

  it('leaves the goal to its own card', () => {
    expect(profileStats(EMPTY, NOW).some((tile) => tile.key === 'goal')).toBe(false);
  });
});

describe('goalCardLine', () => {
  it('names the goal, the days and when it began', () => {
    expect(
      goalCardLine({ goal: 'build_muscle', daysPerWeek: 4, startedAt: new Date(2026, 8, 3) }, NOW),
    ).toEqual({ title: 'Build muscle', detail: '4 days a week · since 3 September' });
  });

  it('says "day" for one, and the year when it is not this one', () => {
    expect(
      goalCardLine({ goal: 'get_stronger', daysPerWeek: 1, startedAt: new Date(2025, 10, 20) }, NOW)
        .detail,
    ).toBe('1 day a week · since 20 November 2025');
  });
});

function record(exerciseId: string, value: number, recordType: PersonalRecord['recordType']) {
  return {
    exerciseId,
    recordType,
    value,
    achievedAt: new Date(2026, 7, 1),
    formula: recordType === 'estimated_1rm' ? ('epley' as const) : null,
  };
}

describe('bestLifts', () => {
  const names = new Map([
    ['squat', 'Back squat'],
    ['bench', 'Bench press'],
    ['row', 'Barbell row'],
  ]);

  it('keeps one line per exercise — its heaviest — heaviest first', () => {
    const lifts = bestLifts(
      [
        record('bench', 100, 'max_weight'),
        record('bench', 116.7, 'estimated_1rm'),
        record('bench', 2400, 'max_session_volume'),
        record('squat', 140, 'max_weight'),
        record('row', 80, 'max_weight'),
      ],
      names,
    );
    expect(lifts.map((lift) => [lift.name, lift.valueKg])).toEqual([
      ['Back squat', 140],
      ['Bench press', 100],
      ['Barbell row', 80],
    ]);
  });

  it('breaks a tie by name, so the order never shuffles', () => {
    const lifts = bestLifts(
      [record('row', 80, 'max_weight'), record('bench', 80, 'max_weight')],
      names,
    );
    expect(lifts.map((lift) => lift.name)).toEqual(['Barbell row', 'Bench press']);
  });

  it('names an exercise it cannot find rather than dropping the record', () => {
    expect(bestLifts([record('mystery', 50, 'max_weight')], names)[0]?.name).toBe(
      'Unknown exercise',
    );
  });
});
