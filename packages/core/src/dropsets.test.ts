import { describe, expect, it } from 'vitest';
import { canDrop, dropChains, dropTemplate, dropsOf, finalTopSet } from './dropsets.js';
import { countSets, countsAsSet, countsTowardVolume, isTopSet } from './load.js';
import type { SetTemplate } from './prefill.js';

const metric = { barbell: false, dumbbell: false, unitSystem: 'metric' } as const;
const barbell = { ...metric, barbell: true } as const;
const dumbbell = { ...metric, dumbbell: true } as const;

function set(weightKg: number, loadType: SetTemplate['loadType'] = 'external'): SetTemplate {
  return { weightKg, reps: 8, loadType, setType: 'working' };
}

describe('counting a drop', () => {
  /**
   * The rule everything else follows: a heavy set and the drops off it are
   * one set, and every kilo in them was lifted.
   */
  it('is volume, but never a set of its own', () => {
    const drop = { setType: 'dropset', isCompleted: true } as const;
    expect(countsTowardVolume(drop)).toBe(true);
    expect(countsAsSet(drop)).toBe(false);
    expect(isTopSet(drop)).toBe(false);
  });

  it('counts a set with two drops as one', () => {
    expect(
      countSets([
        { setType: 'warmup', isCompleted: true },
        { setType: 'working', isCompleted: true },
        { setType: 'dropset', isCompleted: true },
        { setType: 'dropset', isCompleted: true },
        { setType: 'working', isCompleted: false },
      ]),
    ).toBe(1);
  });

  it('still counts failure sets and AMRAPs as sets', () => {
    expect(countsAsSet({ setType: 'failure', isCompleted: true })).toBe(true);
    expect(countsAsSet({ setType: 'amrap', isCompleted: true })).toBe(true);
  });
});

describe('the drop after a set', () => {
  it('takes a fifth off a barbell, onto a loading that exists', () => {
    expect(dropTemplate(set(100), barbell)).toEqual({
      weightKg: 80,
      reps: 8,
      loadType: 'external',
      setType: 'dropset',
    });
    // 48 is not a barbell weight; 47.5 is the nearest one.
    expect(dropTemplate(set(60), barbell)?.weightKg).toBe(47.5);
  });

  it('chains: each drop comes off the one before it', () => {
    const first = dropTemplate(set(100), barbell);
    expect(first).not.toBeNull();
    const second = dropTemplate(first!, barbell);
    expect(second?.weightKg).toBe(65);
  });

  it('stops at the empty bar', () => {
    expect(dropTemplate(set(20), barbell)).toBeNull();
    // 25 → 20 is a real drop to the bar; the bar is the last one.
    expect(dropTemplate(set(25), barbell)?.weightKg).toBe(20);
  });

  /**
   * The reason it rounds to the nearest rung rather than down: from the 15 kg
   * dumbbells, a fifth off is 12, and the 12.5s are right there. Rounding
   * down would hand over the 10s and take off a third.
   */
  it('lands on a dumbbell the rack has, nearest first', () => {
    expect(dropTemplate(set(15), dumbbell)?.weightKg).toBe(12.5);
    // 20 is on the rack that counts in twos, where 16 is a dumbbell.
    expect(dropTemplate(set(20), dumbbell)?.weightKg).toBe(16);
    expect(dropTemplate(set(14), dumbbell)?.weightKg).toBe(12);
  });

  it('is always lighter than the set it comes off', () => {
    for (const kg of [2.5, 5, 7.5, 10, 12.5, 22.5, 41, 100, 142.5]) {
      const drop = dropTemplate(set(kg), metric);
      if (drop !== null) expect(drop.weightKg).toBeLessThan(kg);
    }
  });

  it('has nothing below the smallest step on a machine', () => {
    expect(dropTemplate(set(2.5), metric)).toBeNull();
    expect(dropTemplate(set(0), metric)).toBeNull();
  });

  it('works in pounds, on a 45 lb bar', () => {
    // 225 lb is 102.06 kg. A fifth off is 180 lb.
    const drop = dropTemplate(set(225 * 0.45359237), { ...barbell, unitSystem: 'imperial' });
    expect(drop).not.toBeNull();
    expect(Math.round(drop!.weightKg / 0.45359237)).toBe(180);
  });

  /** The last drop off a weighted dip is a plain one, which is still a set worth doing. */
  it('takes a weighted dip down to bodyweight once the belt is empty', () => {
    expect(dropTemplate(set(20, 'bodyweight_plus'), metric)?.weightKg).toBe(15);
    expect(dropTemplate(set(2.5, 'bodyweight_plus'), metric)).toEqual({
      weightKg: 0,
      reps: 8,
      loadType: 'bodyweight',
      setType: 'dropset',
    });
  });

  it('offers nothing for a plain bodyweight set or an assisted one', () => {
    expect(canDrop('bodyweight')).toBe(false);
    expect(canDrop('assisted')).toBe(false);
    expect(dropTemplate(set(0, 'bodyweight'), metric)).toBeNull();
    expect(dropTemplate(set(30, 'assisted'), metric)).toBeNull();
  });

  it('refuses a weight that is not a number', () => {
    expect(dropTemplate(set(Number.NaN), barbell)).toBeNull();
  });
});

describe('which set a drop belongs to', () => {
  const rows = [
    { id: 'w1', setType: 'warmup' },
    { id: 's1', setType: 'working' },
    { id: 'd1', setType: 'dropset' },
    { id: 'd2', setType: 'dropset' },
    { id: 's2', setType: 'working' },
  ];

  it('is the nearest top set above it', () => {
    const { warmups, chains } = dropChains(rows);
    expect(warmups.map((row) => row.id)).toEqual(['w1']);
    expect(chains.map((chain) => [chain.top.id, chain.drops.map((row) => row.id)])).toEqual([
      ['s1', ['d1', 'd2']],
      ['s2', []],
    ]);
    expect(dropsOf(rows, 's1').map((row) => row.id)).toEqual(['d1', 'd2']);
    expect(dropsOf(rows, 's2')).toEqual([]);
    expect(dropsOf(rows, 'nowhere')).toEqual([]);
  });

  /** Only possible once the set it came off was deleted elsewhere. Kept, not lost. */
  it('reads a drop with nothing above it as a set of its own', () => {
    const { chains } = dropChains([{ id: 'd1', setType: 'dropset' }]);
    expect(chains).toEqual([{ top: { id: 'd1', setType: 'dropset' }, drops: [] }]);
  });
});

describe('the set the effort question is about', () => {
  const ticked = (setType: string, rpe: number | null = null) => ({
    setType,
    isCompleted: true,
    rpe,
  });

  it('is the last top set, not the drop after it', () => {
    const top = ticked('working');
    expect(finalTopSet([ticked('working', 8), top, ticked('dropset')])).toBe(top);
  });

  it('waits until every set, drops included, is ticked', () => {
    expect(
      finalTopSet([ticked('working'), { setType: 'dropset', isCompleted: false, rpe: null }]),
    ).toBeNull();
    expect(finalTopSet([])).toBeNull();
  });

  it('does not ask twice', () => {
    expect(finalTopSet([ticked('working', 9), ticked('dropset')])).toBeNull();
  });
});
