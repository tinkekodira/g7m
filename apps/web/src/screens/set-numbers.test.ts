import { describe, expect, it } from 'vitest';
import { isDropRow, numberSets, rowTitle, setTitle, tickLabel } from './set-numbers.js';

const warmup = { setType: 'warmup' };
const working = { setType: 'working' };
const drop = { setType: 'dropset' };

describe('numberSets', () => {
  /**
   * The bug this file was pulled out to fix: a finished workout's page counted
   * every row, so the first working set after two warm-ups read "Set 3".
   */
  it('counts warm-ups and working sets apart', () => {
    const numbered = numberSets([warmup, warmup, working, working]);
    expect(numbered.map(rowTitle)).toEqual(['Warm-up 1', 'Warm-up 2', 'Set 1', 'Set 2']);
  });

  it('marks only the first working set as the one a ramp leads to', () => {
    const numbered = numberSets([warmup, working, working]);
    expect(numbered.map((entry) => entry.isFirstWorking)).toEqual([false, true, false]);
  });

  it('keeps counting a warm-up slipped in after the working sets began', () => {
    const numbered = numberSets([working, warmup, working]);
    expect(numbered.map((entry) => entry.number)).toEqual([1, 1, 2]);
  });

  it('numbers nothing when there is nothing', () => {
    expect(numberSets([])).toEqual([]);
  });

  /** Every kind that is not a warm-up is a set, as it is to the logger. */
  it('calls any other kind of set a set', () => {
    expect(setTitle('failure', 4)).toBe('Set 4');
  });
});

describe('drops', () => {
  /** A drop is part of its set: it takes no set number, so the next set is still "Set 2". */
  it('hang from their set without taking a number from the sets after', () => {
    const numbered = numberSets([working, drop, drop, working, drop]);
    expect(numbered.map(rowTitle)).toEqual(['Set 1', 'Drop', 'Drop 2', 'Set 2', 'Drop']);
    expect(numbered.map((entry) => entry.parent)).toEqual([1, 1, 1, 2, 2]);
    expect(numbered.map(isDropRow)).toEqual([false, true, true, false, true]);
  });

  it('say which set they belong to on the tick', () => {
    const numbered = numberSets([
      { setType: 'working', isCompleted: true },
      { setType: 'working', isCompleted: true },
      { setType: 'dropset', isCompleted: false },
      { setType: 'warmup', isCompleted: true },
    ]);
    expect(numbered.map(tickLabel)).toEqual([
      'Undo set 1',
      'Undo set 2',
      'Complete drop 1 of set 2',
      'Undo warm-up 1',
    ]);
  });

  /** Its set was deleted on another phone. It is a set now, not a drop of nothing. */
  it('reads a drop with no set above it as a set', () => {
    const numbered = numberSets([warmup, drop]);
    expect(numbered.map(rowTitle)).toEqual(['Warm-up 1', 'Set 1']);
    expect(numbered.map(isDropRow)).toEqual([false, false]);
  });
});
