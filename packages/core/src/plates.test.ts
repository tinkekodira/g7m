import { describe, expect, it } from 'vitest';
import {
  DUMBBELL_KG_KIT,
  DUMBBELL_LB_KIT,
  KG_KIT,
  LB_KIT,
  MAX_PLATE_DIAMETER_MM,
  loadBar,
  plateLook,
} from './plates.js';

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

describe('loadBar, on a dumbbell handle', () => {
  /** A handle is a very short bar, and the arithmetic is the same arithmetic. */
  it('loads both ends of the handle from its own weight up', () => {
    expect(loadBar(12, DUMBBELL_KG_KIT)).toEqual({
      kind: 'plates',
      bar: 2,
      perSide: [5],
      total: 12,
      short: 0,
    });
  });

  it('is just the handle at the handle’s weight', () => {
    expect(loadBar(2, DUMBBELL_KG_KIT).kind).toBe('bar_only');
    expect(loadBar(1, DUMBBELL_KG_KIT).kind).toBe('below_bar');
  });

  /**
   * A rack has a 14 kg dumbbell; a handle and a pair of plates cannot make one.
   * Saying so is the point — it is the whole reason somebody reaches for this.
   */
  it('says how far short it falls when the plates cannot make the number', () => {
    const loading = loadBar(14, DUMBBELL_KG_KIT);
    expect(loading.kind).toBe('plates');
    if (loading.kind !== 'plates') return;
    // A 5 a side is as close as it gets: the next pair up is a 2.5, and
    // 1 kg a side is less than the smallest plate there is.
    expect(loading.total).toBe(12);
    expect(loading.short).toBe(2);
  });

  /** No 25 on a dumbbell: a 450 mm disc on a short sleeve reaches the floor. */
  it('leaves out the plates that do not fit a handle', () => {
    expect(DUMBBELL_KG_KIT.plates).not.toContain(25);
    expect(DUMBBELL_LB_KIT.plates).not.toContain(45);
    const loading = loadBar(42, DUMBBELL_KG_KIT);
    if (loading.kind !== 'plates') throw new Error('expected plates');
    expect(Math.max(...loading.perSide)).toBe(10);
  });
});

describe('plateLook', () => {
  /** The international code, which is what is printed on the plates. */
  it('gives every plate in both kits a colour and a real size', () => {
    for (const kit of [KG_KIT, LB_KIT, DUMBBELL_KG_KIT, DUMBBELL_LB_KIT]) {
      for (const size of kit.plates) {
        const look = plateLook(size, kit.unit);
        expect(look.colour).toMatch(/^#[0-9a-f]{6}$/);
        expect(look.ink).toMatch(/^#[0-9a-f]{6}$/);
        expect(look.diameterMm).toBeGreaterThan(0);
        expect(look.thicknessMm).toBeGreaterThan(0);
      }
    }
  });

  /**
   * The drawing is only worth anything if heavier really does look bigger.
   * Competition bumpers break this — 25, 20, 15 and 10 are all 450 mm — which
   * is why these are iron diameters.
   */
  it('never draws a heavier plate smaller than a lighter one', () => {
    for (const kit of [KG_KIT, LB_KIT]) {
      // `plates` is heaviest first, so each should be at least the next.
      const sizes = kit.plates.map((size) => plateLook(size, kit.unit));
      for (let index = 1; index < sizes.length; index += 1) {
        expect(sizes[index - 1]?.diameterMm).toBeGreaterThanOrEqual(sizes[index]?.diameterMm ?? 0);
        expect(sizes[index - 1]?.thicknessMm).toBeGreaterThanOrEqual(
          sizes[index]?.thicknessMm ?? 0,
        );
      }
    }
  });

  it('separates the two plates that share a colour by size instead', () => {
    // 25 and 2.5 are both red in the real code.
    const heavy = plateLook(25, 'kg');
    const light = plateLook(2.5, 'kg');
    expect(light.colour).toBe(heavy.colour);
    expect(heavy.diameterMm).toBeGreaterThan(light.diameterMm * 1.5);
  });

  it('draws a plate from no kit at all rather than nothing', () => {
    const odd = plateLook(7.5, 'kg');
    expect(odd.diameterMm).toBeGreaterThan(0);
    expect(odd.diameterMm).toBeLessThanOrEqual(MAX_PLATE_DIAMETER_MM);
  });
});
