import { describe, expect, it } from 'vitest';
import type { Achievement } from '@g7m/core';
import {
  MAX_LOUD,
  celebrationsFor,
  earnedCount,
  earnedWords,
  latestEarned,
  nextChanceWords,
  progressFraction,
  progressWords,
  quietSummary,
} from './achievements-view.js';

/** Monday 14 September 2026, mid-afternoon. */
const NOW = new Date(2026, 8, 14, 15, 0);

function achievement(key: string, earnedAt: Date | null): Achievement {
  return {
    key,
    category: 'milestones',
    name: key,
    description: '',
    secret: false,
    earnedAt,
    progress: null,
    nextChance: null,
  };
}

describe('progressWords', () => {
  it('counts things, singular when the target is one', () => {
    expect(progressWords({ current: 7, target: 10, unit: 'workouts' }, 'metric')).toBe(
      '7 / 10 workouts',
    );
    expect(progressWords({ current: 0, target: 1, unit: 'workouts' }, 'metric')).toBe(
      '0 / 1 workout',
    );
    expect(progressWords({ current: 7, target: 12, unit: 'groups' }, 'metric')).toBe(
      '7 / 12 muscle groups',
    );
  });

  it('weighs in the lifter’s units', () => {
    expect(progressWords({ current: 97.5, target: 100, unit: 'weight' }, 'metric')).toBe(
      '97.5 / 100 kg',
    );
    expect(
      progressWords({ current: 97.52, target: 225 * 0.45359237, unit: 'weight' }, 'imperial'),
    ).toBe('215 / 225 lb');
  });

  it('writes tonnage in tonnes or US tons', () => {
    expect(progressWords({ current: 4250, target: 10_000, unit: 'volume' }, 'metric')).toBe(
      '4.3 / 10 t',
    );
    expect(
      progressWords({ current: 4536, target: 20_000 * 0.45359237, unit: 'volume' }, 'imperial'),
    ).toBe('5 / 10 tons');
  });

  it('keeps a rower in metres and a long distance in km or miles', () => {
    expect(progressWords({ current: 1500, target: 2000, unit: 'distance' }, 'imperial')).toBe(
      '1,500 / 2,000 m',
    );
    expect(progressWords({ current: 12_500, target: 42_195, unit: 'distance' }, 'metric')).toBe(
      '12.5 / 42.2 km',
    );
    expect(
      progressWords({ current: 16_093.44, target: 96_560.64, unit: 'distance' }, 'imperial'),
    ).toBe('10 / 60 mi');
    expect(progressWords({ current: 1000, target: 8849, unit: 'climb' }, 'imperial')).toBe(
      '3,281 / 29,032 ft',
    );
  });

  it('fills the bar by the fraction, never past full', () => {
    expect(progressFraction({ current: 3, target: 4, unit: 'weeks' })).toBe(0.75);
    expect(progressFraction({ current: 0, target: 0, unit: 'weeks' })).toBe(0);
  });
});

describe('dates', () => {
  it('says when, with the year only when it was another one', () => {
    expect(earnedWords(new Date(2026, 8, 3), NOW)).toBe('Earned 3 Sep');
    expect(earnedWords(new Date(2025, 11, 25), NOW)).toBe('Earned 25 Dec 2025');
  });

  it('names the next chance as near things are named', () => {
    expect(nextChanceWords(new Date(2026, 8, 14), NOW)).toBe('Next chance: today');
    expect(nextChanceWords(new Date(2026, 8, 15), NOW)).toBe('Next chance: tomorrow');
    expect(nextChanceWords(new Date(2026, 8, 19), NOW)).toBe('Next chance: Saturday');
    expect(nextChanceWords(new Date(2026, 11, 25), NOW)).toBe('Next chance: 25 Dec');
    expect(nextChanceWords(new Date(2028, 1, 29), NOW)).toBe('Next chance: 29 Feb 2028');
  });
});

describe('celebrationsFor', () => {
  const today = new Date(2026, 8, 14, 9);
  const lastMonth = new Date(2026, 7, 10);

  it('gives a banner to what was earned today and folds the past into one line', () => {
    const list = [achievement('day-one', lastMonth), achievement('two-plate-bench', today)];
    const { loud, quiet } = celebrationsFor({
      list,
      seen: new Set(),
      earnedWhenOpened: null,
      now: NOW,
    });
    expect(loud.map((each) => each.key)).toEqual(['two-plate-bench']);
    expect(quiet.map((each) => each.key)).toEqual(['day-one']);
  });

  it('celebrates nothing twice', () => {
    const list = [achievement('two-plate-bench', today)];
    const result = celebrationsFor({
      list,
      seen: new Set(['two-plate-bench']),
      earnedWhenOpened: null,
      now: NOW,
    });
    expect(result).toEqual({ loud: [], quiet: [] });
  });

  it('is loud about anything earned while the app was open, whatever its date', () => {
    const list = [achievement('double-digits', lastMonth)];
    const { loud } = celebrationsFor({
      list,
      seen: new Set(),
      earnedWhenOpened: new Set(),
      now: NOW,
    });
    expect(loud).toHaveLength(1);
  });

  it(`plays at most ${String(MAX_LOUD)} banners and summarises the rest`, () => {
    const list = ['a', 'b', 'c', 'd'].map((key) => achievement(key, today));
    const { loud, quiet } = celebrationsFor({
      list,
      seen: new Set(),
      earnedWhenOpened: null,
      now: NOW,
    });
    expect(loud.map((each) => each.key)).toEqual(['a', 'b', 'c']);
    expect(quiet.map((each) => each.key)).toEqual(['d']);
  });
});

describe('summaries', () => {
  const list = [
    achievement('day-one', new Date(2026, 7, 1)),
    achievement('gym-rat', new Date(2026, 8, 11)),
    achievement('lifer', null),
  ];

  it('counts and finds the latest', () => {
    expect(earnedCount(list)).toEqual({ earned: 2, total: 3 });
    expect(latestEarned(list)?.key).toBe('gym-rat');
    expect(latestEarned([achievement('lifer', null)])).toBeNull();
  });

  it('writes the quiet banner for one or for many', () => {
    expect(quietSummary(list.slice(0, 1), NOW)).toEqual({
      title: 'day-one',
      detail: 'Earned 1 Aug · tap to see it',
    });
    expect(quietSummary(list.slice(0, 2), NOW).title).toBe('2 achievements earned');
  });
});
