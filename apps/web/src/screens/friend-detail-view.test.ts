import { describe, expect, it } from 'vitest';
import type { BestLift } from '@g7m/core';
import {
  friendBestLifts,
  friendHeat,
  headToHead,
  recentRows,
  routineLine,
  targetText,
} from './friend-detail-view.js';

const day = (n: number) => new Date(2026, 9, n, 12);
const best = (bestKg: number, n: number): BestLift => ({ bestKg, lastAt: day(n) });

const NAMES = new Map([
  ['bench', 'Barbell Bench Press'],
  ['squat', 'Barbell Back Squat'],
  ['curl', 'Barbell Curl'],
]);

const base = {
  names: NAMES,
  preferredId: 'bench',
  chosenId: null,
  unitSystem: 'metric' as const,
  friend: 'Alex',
};

describe('headToHead', () => {
  it('lists only lifts you have both done, and opens on the bench press', () => {
    const view = headToHead({
      ...base,
      mine: new Map([
        ['bench', best(100, 1)],
        ['squat', best(140, 5)],
        ['curl', best(40, 6)],
      ]),
      theirs: [
        { exerciseId: 'bench', bestKg: 110, lastAt: day(2) },
        { exerciseId: 'squat', bestKg: 130, lastAt: day(3) },
      ],
    });
    expect(view.options).toEqual([
      { exerciseId: 'squat', name: 'Barbell Back Squat' },
      { exerciseId: 'bench', name: 'Barbell Bench Press' },
    ]);
    expect(view.selectedId).toBe('bench');
    expect(view.comparison).toMatchObject({
      mine: '100 kg',
      theirs: '110 kg',
      standing: 'behind',
      verdict: 'Alex is 10 kg ahead',
      theirsShare: 1,
    });
    expect(view.comparison?.mineShare).toBeCloseTo(100 / 110);
  });

  it('follows the pick, and says when you are ahead or level', () => {
    const mine = new Map([
      ['bench', best(100, 1)],
      ['squat', best(140, 5)],
    ]);
    const theirs = [
      { exerciseId: 'bench', bestKg: 100, lastAt: day(2) },
      { exerciseId: 'squat', bestKg: 130, lastAt: day(3) },
    ];
    expect(headToHead({ ...base, mine, theirs, chosenId: 'squat' }).comparison?.verdict).toBe(
      'You’re 10 kg ahead',
    );
    expect(headToHead({ ...base, mine, theirs }).comparison?.verdict).toBe('Level');
  });

  it('ignores a pick that is no longer on the list', () => {
    const view = headToHead({
      ...base,
      chosenId: 'curl',
      mine: new Map([['bench', best(100, 1)]]),
      theirs: [{ exerciseId: 'bench', bestKg: 90, lastAt: day(2) }],
    });
    expect(view.selectedId).toBe('bench');
  });

  it('has nothing to compare when you share no lift', () => {
    expect(
      headToHead({
        ...base,
        mine: new Map([['curl', best(40, 1)]]),
        theirs: [{ exerciseId: 'bench', bestKg: 90, lastAt: day(2) }],
      }),
    ).toEqual({ options: [], selectedId: null, comparison: null });
  });
});

describe('recentRows', () => {
  it('names, dates and sizes each workout', () => {
    const rows = recentRows(
      [
        {
          id: 's1',
          name: 'Push',
          source: 'manual',
          startedAt: day(6),
          endedAt: day(6),
          work: [{ exerciseId: 'bench', sets: 3 }],
          firstSetAt: new Date(2026, 9, 6, 12, 0),
          lastSetAt: new Date(2026, 9, 6, 12, 45),
        },
      ],
      day(7),
      new Map(),
    );
    expect(rows).toEqual([
      {
        sessionId: 's1',
        title: 'Push',
        when: 'Yesterday',
        duration: '45m',
        exercises: '1 exercise',
      },
    ]);
  });
});

describe('friendHeat', () => {
  const names = new Map([
    ['pectoralis-major', 'Chest'],
    ['triceps', 'Triceps'],
    ['deltoid-anterior', 'Front delts'],
  ]);

  it('colours by the server’s shares and names the hardest-worked it knows, in its order', () => {
    const heat = friendHeat(
      {
        trained: true,
        heat: [
          { slug: 'pectoralis-major', intensity: 1 },
          { slug: 'a-muscle-from-a-newer-app', intensity: 0.8 },
          { slug: 'triceps', intensity: 0.5 },
          { slug: 'deltoid-anterior', intensity: 0.3 },
          { slug: 'rounded-away', intensity: 0 },
        ],
      },
      names,
      2,
    );
    expect(heat.top).toEqual([
      { slug: 'pectoralis-major', name: 'Chest' },
      { slug: 'triceps', name: 'Triceps' },
    ]);
    expect(heat.intensity.get('triceps')).toBe(0.5);
    expect(heat.intensity.has('rounded-away')).toBe(false);
    expect(heat.trained).toBe(true);
  });

  it('says nothing was trained when nothing was', () => {
    expect(friendHeat({ trained: false, heat: [] }, names, 3)).toEqual({
      intensity: new Map(),
      trained: false,
      top: [],
    });
  });
});

describe('friendBestLifts', () => {
  it('lists heaviest first, ties by name, with the day it was reached', () => {
    const at = new Date('2026-09-01T10:00:00Z');
    const lifts = friendBestLifts(
      [
        { exerciseId: 'b', bestKg: 100, achievedAt: at },
        { exerciseId: 'a', bestKg: 100, achievedAt: at },
        { exerciseId: 'c', bestKg: 140, achievedAt: at },
      ],
      new Map([
        ['a', 'Bench'],
        ['b', 'Row'],
        ['c', 'Squat'],
      ]),
    );
    expect(lifts.map((lift) => lift.name)).toEqual(['Squat', 'Bench', 'Row']);
    expect(lifts[0]).toEqual({ exerciseId: 'c', name: 'Squat', valueKg: 140, achievedAt: at });
  });
});

describe('routine lines', () => {
  const movement = {
    exerciseId: 'a',
    targetSets: 3,
    targetRepLow: 8,
    targetRepHigh: 12,
    supersetId: null,
  };

  it('counts the exercises and names them', () => {
    const names = new Map([
      ['a', 'Bench'],
      ['b', 'Fly'],
    ]);
    expect(
      routineLine(
        { id: 'r', name: 'Push', exercises: [movement, { ...movement, exerciseId: 'b' }] },
        names,
      ),
    ).toBe('2 exercises · Bench, Fly');
    expect(routineLine({ id: 'r', name: 'Empty', exercises: [] }, names)).toBe('0 exercises');
  });

  it('writes a range as a range and a fixed number once', () => {
    expect(targetText(movement)).toBe('3 × 8–12');
    expect(targetText({ ...movement, targetRepHigh: 8 })).toBe('3 × 8');
  });
});
