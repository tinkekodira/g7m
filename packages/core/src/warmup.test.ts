import { describe, expect, it } from 'vitest';
import { KG_KIT, LB_KIT } from './plates.js';
import { fromDisplayWeight, toDisplayWeight } from './units.js';
import { canWarmUp, roundToLoadable, warmupRungs, warmupSets } from './warmup.js';

/** The common case: a barbell lift, in kilograms. */
function bar(workingKg: number) {
  return warmupSets({
    workingKg,
    loadType: 'external',
    barbell: true,
    dumbbell: false,
    unitSystem: 'metric',
  });
}

describe('warmupSets', () => {
  it('ramps a heavy barbell lift from the empty bar', () => {
    const sets = bar(100);
    expect(sets.map((set) => set.weightKg)).toEqual([20, 40, 55, 70, 85]);
    // Reps come down as the weight goes up: the last rung is to feel it.
    expect(sets.map((set) => set.reps)).toEqual([8, 8, 5, 3, 2]);
  });

  it('marks every set as a warm-up, which is the whole point', () => {
    for (const set of bar(100)) {
      expect(set.setType).toBe('warmup');
      expect(set.loadType).toBe('external');
    }
  });

  /**
   * The failure a fixed percentage ladder produces: 40% of 40 kg is 16 kg,
   * which is lighter than the bar it would be loaded onto.
   */
  it('shortens the ladder as the weight comes down', () => {
    expect(bar(140).length).toBeGreaterThan(bar(60).length);
    for (const set of bar(40)) expect(set.weightKg).toBeGreaterThanOrEqual(KG_KIT.bar);
  });

  it('offers nothing for a weight barely above the bar', () => {
    expect(bar(25)).toEqual([]);
    expect(bar(KG_KIT.bar)).toEqual([]);
  });

  it('never proposes a rung at or above the working weight', () => {
    for (const working of [30, 45, 60, 87.5, 100, 142.5, 200]) {
      for (const set of bar(working)) expect(set.weightKg).toBeLessThan(working);
    }
  });

  it('climbs, with no weight repeated', () => {
    for (const working of [30, 45, 60, 87.5, 100, 142.5, 200]) {
      const weights = bar(working).map((set) => set.weightKg);
      for (let index = 1; index < weights.length; index++) {
        expect(weights[index]).toBeGreaterThan(weights[index - 1] ?? 0);
      }
    }
  });

  /**
   * Every rung has to be loadable. A barbell moves in pairs of the smallest
   * plate, so 2.5 kg at a time with the standard kit.
   */
  it('lands every barbell rung on a loading that exists', () => {
    for (const working of [52.5, 77.5, 100, 123.75, 180]) {
      for (const set of bar(working)) {
        const overBar = set.weightKg - KG_KIT.bar;
        expect(Math.round(overBar * 100) % 250).toBe(0);
      }
    }
  });

  it('starts a dumbbell lift on the rack rather than on a bar', () => {
    const sets = warmupSets({
      workingKg: 30,
      loadType: 'external',
      barbell: false,
      dumbbell: true,
      unitSystem: 'metric',
    });
    expect(sets.length).toBeGreaterThan(0);
    // No empty bar to start from, so nothing weighs what a bar weighs by rule.
    for (const set of sets) expect(set.weightKg).toBeLessThan(30);
  });

  /**
   * The bug this test was written for: `LB_KIT.bar` is 45 *pounds*, and doing
   * the arithmetic in storage units ramped an imperial lifter to a 45 kg bar
   * — more than twice the weight, and silently.
   */
  it('works in pounds, on a pound bar', () => {
    const sets = warmupSets({
      workingKg: fromDisplayWeight(225, 'imperial'),
      loadType: 'external',
      barbell: true,
      dumbbell: false,
      unitSystem: 'imperial',
    });
    const shown = sets.map((set) => toDisplayWeight(set.weightKg, 'imperial').value);
    expect(shown[0]).toBe(LB_KIT.bar);
    // Every rung loadable on a pound bar: pairs of the smallest plate, 5 lb.
    for (const weight of shown) {
      expect(Math.round((weight - LB_KIT.bar) * 10) % 50).toBe(0);
      expect(weight).toBeLessThan(225);
    }
  });

  /**
   * A percentage of "your own bodyweight" is not a weight anybody can load,
   * so these get no ladder rather than a wrong one.
   */
  it('refuses every load type but external', () => {
    for (const loadType of ['bodyweight', 'bodyweight_plus', 'assisted'] as const) {
      expect(
        warmupSets({
          workingKg: 100,
          loadType,
          barbell: true,
          dumbbell: false,
          unitSystem: 'metric',
        }),
      ).toEqual([]);
      expect(canWarmUp(loadType)).toBe(false);
    }
    expect(canWarmUp('external')).toBe(true);
  });

  it('has an answer for a weight that is not one', () => {
    expect(bar(0)).toEqual([]);
    expect(bar(-50)).toEqual([]);
    expect(bar(Number.NaN)).toEqual([]);
  });
});

describe('warmupRungs', () => {
  it('gives more rungs the further the weight is above the floor', () => {
    expect(warmupRungs(1)).toBe(0);
    expect(warmupRungs(1.6)).toBe(1);
    expect(warmupRungs(2.5)).toBe(2);
    expect(warmupRungs(3.5)).toBe(3);
    expect(warmupRungs(7)).toBe(4);
  });

  it('never goes backwards as the ratio climbs', () => {
    let last = 0;
    for (let ratio = 1; ratio <= 10; ratio += 0.25) {
      const rungs = warmupRungs(ratio);
      expect(rungs).toBeGreaterThanOrEqual(last);
      last = rungs;
    }
  });

  it('has an answer for nonsense', () => {
    expect(warmupRungs(Number.NaN)).toBe(0);
  });
});

describe('roundToLoadable', () => {
  /**
   * Down, never up. A warm-up that rounded up could land heavier than
   * intended, and the ladder exists to reach the working weight fresh.
   */
  /** A 20 kg bar moving in pairs of the smallest plate: 2.5 kg at a time. */
  const barbell = { floor: KG_KIT.bar, step: 2.5, hasBar: true };
  /** A rack with no floor to build on, stepping in twos. */
  const rack = { floor: 2, step: 2, hasBar: false };

  it('rounds a barbell down to a loading that exists', () => {
    expect(roundToLoadable(61, barbell)).toBe(60);
    expect(roundToLoadable(62.5, barbell)).toBe(62.5);
    expect(roundToLoadable(19, barbell)).toBe(KG_KIT.bar);
  });

  it('rounds a rack down to a rung it has', () => {
    expect(roundToLoadable(15, rack)).toBe(14);
    expect(roundToLoadable(15, rack)).toBeLessThanOrEqual(15);
  });

  it('never returns nothing to lift', () => {
    expect(roundToLoadable(0.5, rack)).toBeGreaterThan(0);
    expect(roundToLoadable(10, { floor: 0, step: 0, hasBar: false })).toBe(10);
  });
});
