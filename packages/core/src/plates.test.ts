import { describe, expect, it } from 'vitest';
import { KG_KIT, LB_KIT, loadBar } from './plates.js';

describe('loadBar, in kilograms', () => {
  it('loads each side, heaviest plate first', () => {
    expect(loadBar(100, KG_KIT)).toEqual({
      kind: 'plates',
      bar: 20,
      perSide: [25, 15],
      total: 100,
      short: 0,
    });
    expect(loadBar(102.5, KG_KIT)).toMatchObject({ perSide: [25, 15, 1.25], total: 102.5 });
    expect(loadBar(60, KG_KIT)).toMatchObject({ perSide: [20] });
    expect(loadBar(185, KG_KIT)).toMatchObject({ perSide: [25, 25, 25, 5, 2.5] });
  });

  /** The mistake this exists to stop: forgetting the bar weighs anything. */
  it('takes the bar off before halving', () => {
    expect(loadBar(40, KG_KIT)).toMatchObject({ perSide: [10], total: 40 });
  });

  it('says when it is just the bar, or less than the bar', () => {
    expect(loadBar(20, KG_KIT)).toEqual({ kind: 'bar_only', bar: 20 });
    expect(loadBar(15, KG_KIT)).toEqual({ kind: 'below_bar', bar: 20 });
    expect(loadBar(0, KG_KIT)).toEqual({ kind: 'below_bar', bar: 20 });
  });

  it('reaches every weight the stepper can, exactly', () => {
    for (let kg = 22.5; kg <= 300; kg += 2.5) {
      const loading = loadBar(kg, KG_KIT);
      expect(loading.kind, String(kg)).toBe('plates');
      if (loading.kind === 'plates') expect(loading.short, String(kg)).toBe(0);
    }
  });

  /** A weight typed by hand can fall between plates. It loads what it can and says so. */
  it('gets as close as it can from below, and says how far short', () => {
    expect(loadBar(101, KG_KIT)).toMatchObject({ perSide: [25, 15], total: 100, short: 1 });
    // Less than a pair of the smallest plate over the bar: the bar alone.
    expect(loadBar(21, KG_KIT)).toEqual({ kind: 'bar_only', bar: 20 });
  });

  it('adds up without floating-point dust', () => {
    const loading = loadBar(47.5, KG_KIT);
    expect(loading).toMatchObject({ perSide: [10, 2.5, 1.25], total: 47.5, short: 0 });
  });

  it('refuses nonsense rather than loading it', () => {
    expect(loadBar(Number.NaN, KG_KIT).kind).toBe('below_bar');
  });
});

describe('loadBar, in pounds', () => {
  it('uses a 45 lb bar and pound plates', () => {
    expect(loadBar(135, LB_KIT)).toMatchObject({ bar: 45, perSide: [45], total: 135 });
    expect(loadBar(225, LB_KIT)).toMatchObject({ perSide: [45, 45] });
    expect(loadBar(185, LB_KIT)).toMatchObject({ perSide: [45, 25] });
    expect(loadBar(50, LB_KIT)).toMatchObject({ perSide: [2.5] });
  });

  it('reaches every weight a five-pound stepper can, exactly', () => {
    for (let lb = 50; lb <= 600; lb += 5) {
      const loading = loadBar(lb, LB_KIT);
      if (loading.kind === 'plates') expect(loading.short, String(lb)).toBe(0);
      else throw new Error(`${String(lb)} lb did not load`);
    }
  });
});
