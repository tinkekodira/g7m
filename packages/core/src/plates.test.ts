import { describe, expect, it } from 'vitest';
import { KG_KIT, LB_KIT, MAX_PLATE_DIAMETER_MM, loadBar, plateLook } from './plates.js';

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

describe('plateLook', () => {
  /** The international code, which is what is printed on the plates. */
  it('gives every plate in both kits a colour and a real size', () => {
    for (const kit of [KG_KIT, LB_KIT]) {
      for (const size of kit.plates) {
        const look = plateLook(size, kit.unit);
        // Three tones each: the facets are shaded between them.
        for (const tone of [look.colour, look.lit, look.shade, look.ink]) {
          expect(tone).toMatch(/^#[0-9a-f]{6}$/);
        }
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

  /** Every disc on the bar has to be tellable from every other one. */
  it('gives no two plates in a kit the same colour', () => {
    for (const kit of [KG_KIT, LB_KIT]) {
      const faces = kit.plates.map((size) => plateLook(size, kit.unit).colour);
      expect(new Set(faces).size).toBe(faces.length);
    }
  });

  /** Lit is brighter than the face, and the face than the shade, or the facets
      shade the wrong way round and the disc reads as a hole. */
  it('orders the three tones of every plate', () => {
    for (const size of KG_KIT.plates) {
      const look = plateLook(size, 'kg');
      expect(luminance(look.lit)).toBeGreaterThan(luminance(look.colour));
      expect(luminance(look.colour)).toBeGreaterThan(luminance(look.shade));
    }
  });

  it('draws a plate from no kit at all rather than nothing', () => {
    const odd = plateLook(7.5, 'kg');
    expect(odd.diameterMm).toBeGreaterThan(0);
    expect(odd.diameterMm).toBeLessThanOrEqual(MAX_PLATE_DIAMETER_MM);
  });
});

/** Rough brightness of a hex colour, for the ordering test above. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((at) => Number.parseInt(hex.slice(at, at + 2), 16));
  return 0.299 * (r ?? 0) + 0.587 * (g ?? 0) + 0.114 * (b ?? 0);
}
