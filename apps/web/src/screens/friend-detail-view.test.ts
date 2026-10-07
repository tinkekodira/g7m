import { describe, expect, it } from 'vitest';
import type { BestLift } from '@g7m/core';
import { headToHead, recentRows } from './friend-detail-view.js';

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
