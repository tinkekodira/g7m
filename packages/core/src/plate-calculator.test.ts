import { describe, expect, it } from 'vitest';
import {
  ALL_PLATE_SLOTS,
  BAR_SPECS,
  DEFAULT_EZ_BAR_WEIGHT,
  PLATE_SLOTS,
  barWeight,
  calculatorKit,
  loadCalculatorBar,
  sleeveFits,
  slotValue,
  toggleSlot,
} from './plate-calculator.js';

describe('calculatorKit', () => {
  it('lists every slot heaviest first, in kilograms', () => {
    const kit = calculatorKit({
      unit: 'kg',
      bar: 'bar_20',
      ezBarWeight: DEFAULT_EZ_BAR_WEIGHT,
      availableSlots: ALL_PLATE_SLOTS,
    });
    expect(kit).toEqual({ unit: 'kg', bar: 20, plates: [25, 20, 15, 10, 5, 2.5, 1.25] });
  });

  it('lists every slot heaviest first, in pounds — its own ladder, not a conversion', () => {
    const kit = calculatorKit({
      unit: 'lb',
      bar: 'bar_20',
      ezBarWeight: DEFAULT_EZ_BAR_WEIGHT,
      availableSlots: ALL_PLATE_SLOTS,
    });
    expect(kit).toEqual({ unit: 'lb', bar: 45, plates: [55, 45, 35, 25, 10, 5, 2.5] });
  });

  it('drops a deselected slot from both units', () => {
    const withoutRed = new Set(PLATE_SLOTS.filter((slot) => slot !== 'red'));
    expect(
      calculatorKit({
        unit: 'kg',
        bar: 'bar_20',
        ezBarWeight: DEFAULT_EZ_BAR_WEIGHT,
        availableSlots: withoutRed,
      }).plates,
    ).toEqual([20, 15, 10, 5, 2.5, 1.25]);
    expect(
      calculatorKit({
        unit: 'lb',
        bar: 'bar_20',
        ezBarWeight: DEFAULT_EZ_BAR_WEIGHT,
        availableSlots: withoutRed,
      }).plates,
    ).toEqual([45, 35, 25, 10, 5, 2.5]);
  });

  it('uses the fixed weight for the two Olympic bars, standard lb weights included', () => {
    expect(barWeight('bar_20', 'kg', DEFAULT_EZ_BAR_WEIGHT)).toBe(20);
    expect(barWeight('bar_20', 'lb', DEFAULT_EZ_BAR_WEIGHT)).toBe(45);
    expect(barWeight('bar_15', 'kg', DEFAULT_EZ_BAR_WEIGHT)).toBe(15);
    expect(barWeight('bar_15', 'lb', DEFAULT_EZ_BAR_WEIGHT)).toBe(35);
  });

  it('takes the EZ bar weight from the editable value, not a fixed constant', () => {
    expect(barWeight('bar_ez', 'kg', DEFAULT_EZ_BAR_WEIGHT)).toBe(10);
    expect(barWeight('bar_ez', 'kg', { kg: 7.5, lb: 15 })).toBe(7.5);
    expect(barWeight('bar_ez', 'lb', { kg: 7.5, lb: 15 })).toBe(15);
  });
});

describe('toggleSlot', () => {
  it('adds and removes a slot', () => {
    const withoutRed = toggleSlot(ALL_PLATE_SLOTS, 'red');
    expect(withoutRed.has('red')).toBe(false);
    expect(withoutRed.size).toBe(6);

    const backToAll = toggleSlot(withoutRed, 'red');
    expect(backToAll.has('red')).toBe(true);
    expect(backToAll.size).toBe(7);
  });

  it('refuses to empty the selection', () => {
    const onlyRed = new Set<(typeof PLATE_SLOTS)[number]>(['red']);
    expect(toggleSlot(onlyRed, 'red')).toBe(onlyRed);
  });
});

describe('loadCalculatorBar', () => {
  it('matches the logger example: 100 kg is a 25 and a 15 on a 20 kg bar', () => {
    const loading = loadCalculatorBar(100, {
      unit: 'kg',
      bar: 'bar_20',
      ezBarWeight: DEFAULT_EZ_BAR_WEIGHT,
      availableSlots: ALL_PLATE_SLOTS,
    });
    expect(loading).toMatchObject({ kind: 'plates', bar: 20, perSide: [25, 15], total: 100 });
  });

  it('rebuilds the same 100 kg from what is left once red and yellow are gone', () => {
    const availableSlots = new Set(
      PLATE_SLOTS.filter((slot) => slot !== 'red' && slot !== 'yellow'),
    );
    const loading = loadCalculatorBar(100, {
      unit: 'kg',
      bar: 'bar_20',
      ezBarWeight: DEFAULT_EZ_BAR_WEIGHT,
      availableSlots,
    });
    // Without a 25 or a 15, 40 kg a side is two 20s exactly — no shortfall.
    expect(loading).toMatchObject({ kind: 'plates', bar: 20, perSide: [20, 20], total: 100 });
  });

  it('gets as close as it can and says how short, from a reduced kit', () => {
    const availableSlots = new Set<(typeof PLATE_SLOTS)[number]>(['blue', 'green']);
    const loading = loadCalculatorBar(59, {
      unit: 'kg',
      bar: 'bar_20',
      ezBarWeight: DEFAULT_EZ_BAR_WEIGHT,
      availableSlots,
    });
    // (59-20)/2 = 19.5 a side; only 20s and 10s to build it with, so 10 a side, 40 kg total, 19 short.
    expect(loading).toMatchObject({ kind: 'plates', bar: 20, perSide: [10], total: 40, short: 19 });
  });

  it('loads the EZ bar at its own, editable weight', () => {
    const loading = loadCalculatorBar(25, {
      unit: 'kg',
      bar: 'bar_ez',
      ezBarWeight: { kg: 7.5, lb: 15 },
      availableSlots: ALL_PLATE_SLOTS,
    });
    // (25-7.5)/2 = 8.75 -> 5 + 2.5 + 1.25 a side, exactly.
    expect(loading).toMatchObject({ bar: 7.5, perSide: [5, 2.5, 1.25], total: 25, short: 0 });
  });
});

describe('sleeveFits', () => {
  it('fits the full seven-plate rack exactly on the 20 kg bar — the sleeve is sized for it', () => {
    expect(sleeveFits([25, 20, 15, 10, 5, 2.5, 1.25], 'kg', 'bar_20')).toBe(true);
  });

  it('does not fit the full rack on the 15 kg bar’s shorter sleeve', () => {
    expect(sleeveFits([25, 20, 15, 10, 5], 'kg', 'bar_15')).toBe(false);
  });

  it('fits two big plates on the EZ bar but not a third', () => {
    expect(sleeveFits([25, 20], 'kg', 'bar_ez')).toBe(true);
    expect(sleeveFits([25, 20, 15], 'kg', 'bar_ez')).toBe(false);
  });

  it('works from the pound ladder too', () => {
    expect(sleeveFits([55, 45, 35, 25, 10, 5, 2.5], 'lb', 'bar_20')).toBe(true);
  });
});

describe('slotValue', () => {
  it('has every slot mapped in both units', () => {
    for (const slot of PLATE_SLOTS) {
      expect(slotValue(slot, 'kg')).toBeGreaterThan(0);
      expect(slotValue(slot, 'lb')).toBeGreaterThan(0);
    }
  });
});

describe('BAR_SPECS', () => {
  it('gives the EZ bar no fixed weight — it always comes from EzBarWeight', () => {
    expect(BAR_SPECS.bar_ez.weightKg).toBeNull();
    expect(BAR_SPECS.bar_ez.weightLb).toBeNull();
  });
});
