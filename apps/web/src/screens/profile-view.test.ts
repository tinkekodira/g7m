import { describe, expect, it } from 'vitest';
import type { PersonalRecord } from '@g7m/core';
import {
  bestLifts,
  bmiNote,
  goalCardLine,
  indexFor,
  profileStats,
  type ProfileFacts,
} from './profile-view.js';

const NOW = new Date(2026, 8, 12, 12);

const EMPTY: ProfileFacts = {
  unitSystem: 'metric',
  weightKg: null,
  weightAt: null,
  heightCm: null,
  birthDate: null,
  sex: null,
  activityLevel: null,
  trainingDaysPerWeek: null,
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
      'bmi',
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
    };
    const tiles = profileStats(facts, NOW);
    const byKey = new Map(tiles.map((tile) => [tile.key, tile]));

    expect(byKey.get('weight')).toMatchObject({ value: '82.5 kg', detail: '3 days ago' });
    expect(byKey.get('height')?.value).toBe('182 cm');
    expect(byKey.get('age')?.value).toBe('26');
    expect(byKey.get('activity')?.value).toBe('Moderately active');
    expect(byKey.get('sex')?.value).toBe('Male');
  });

  it('converts for somebody who asked for pounds and inches', () => {
    const facts: ProfileFacts = { ...EMPTY, unitSystem: 'imperial', weightKg: 100, heightCm: 180 };
    expect(valueOf(facts, 'weight')).toBe('220.5 lb');
    expect(valueOf(facts, 'height')).toBe('71 in');
    // BMI is kilograms over metres squared wherever it is quoted. Converting it
    // would produce a number no chart anywhere agrees with.
    expect(valueOf(facts, 'bmi')).toBe('30.9');
  });

  it('leaves the goal to its own card', () => {
    expect(profileStats(EMPTY, NOW).some((tile) => tile.key === 'goal')).toBe(false);
  });

  /** The flag beside the name says it, and a country is not one of your numbers. */
  it('no longer keeps a tile for where somebody is from', () => {
    expect(profileStats(EMPTY, NOW).some((tile) => tile.key === 'country')).toBe(false);
  });
});

describe('the BMI tile', () => {
  const LIFTER: ProfileFacts = {
    ...EMPTY,
    weightKg: 86,
    heightCm: 180,
    birthDate: new Date(Date.UTC(1996, 0, 10)),
    sex: 'male',
    activityLevel: 'active',
    trainingDaysPerWeek: 5,
  };

  it('shows the ratio with the band it was judged against, not just a verdict', () => {
    expect(profileStats(LIFTER, NOW).at(-1)).toMatchObject({
      key: 'bmi',
      label: 'BMI',
      value: '26.5',
      detail: 'Healthy · 18.5–27.5',
      tone: 'good',
    });
  });

  /**
   * The same body with nothing on file about how it is used. Both tiles print
   * the same ratio; only the band it is measured against moves — which is the
   * whole answer to ADR-0035.
   */
  it('reads the same ratio against a narrower band when nothing is known', () => {
    const tile = profileStats({ ...EMPTY, weightKg: 86, heightCm: 180 }, NOW).at(-1);
    expect(tile).toMatchObject({ value: '26.5', detail: 'Above range · 18.5–25', tone: 'caution' });
  });

  it('asks for the measurements rather than printing a ratio without them', () => {
    expect(valueOf({ ...EMPTY, weightKg: 86 }, 'bmi')).toBeNull();
    expect(valueOf({ ...EMPTY, heightCm: 180 }, 'bmi')).toBeNull();
  });

  /** A whole-number bound prints as 25, not 25.0 — a band is not a measurement. */
  it('does not dress a round bound up as a measurement', () => {
    const tile = profileStats({ ...EMPTY, weightKg: 70, heightCm: 180 }, NOW).at(-1);
    expect(tile?.detail).toBe('Healthy · 18.5–25');
  });
});

describe('bmiNote', () => {
  it('says nothing without a ratio to explain', () => {
    expect(bmiNote(indexFor(EMPTY, NOW))).toBeNull();
  });

  /** Nothing on file means the standard band, and the note asks for the rest. */
  it('invites the missing answers when the band is the standard one', () => {
    const note = bmiNote(indexFor({ ...EMPTY, weightKg: 86, heightCm: 180 }, NOW));
    expect(note).toMatch(/standard range/);
    expect(note).toMatch(/how many days a week you train/);
  });

  it('names what moved the band once something has', () => {
    const note = bmiNote(
      indexFor({ ...EMPTY, weightKg: 86, heightCm: 180, trainingDaysPerWeek: 5 }, NOW),
    );
    expect(note).toMatch(/counts muscle as excess weight/);
    expect(note).not.toMatch(/standard range/);
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
