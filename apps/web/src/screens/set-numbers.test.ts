import { describe, expect, it } from 'vitest';
import { numberSets, setTitle } from './set-numbers.js';

const warmup = { setType: 'warmup' };
const working = { setType: 'working' };

describe('numberSets', () => {
  /**
   * The bug this file was pulled out to fix: a finished workout's page counted
   * every row, so the first working set after two warm-ups read "Set 3".
   */
  it('counts warm-ups and working sets apart', () => {
    const numbered = numberSets([warmup, warmup, working, working]);
    expect(numbered.map(({ set, number }) => setTitle(set.setType, number))).toEqual([
      'Warm-up 1',
      'Warm-up 2',
      'Set 1',
      'Set 2',
    ]);
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
