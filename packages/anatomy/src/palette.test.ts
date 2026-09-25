import { describe, expect, it } from 'vitest';
import { HEAT_FLOOR, PALETTE, RESTING_SKIN, heatColour } from './palette.js';

/** Red minus blue: how far along a ramp that runs from clay to coral red. */
const redness = (hex: string) => parseInt(hex.slice(1, 3), 16) - parseInt(hex.slice(5, 7), 16);

describe('heatColour', () => {
  it('leaves an untrained muscle the colour of the body', () => {
    expect(heatColour(0, true)).toBe(RESTING_SKIN);
    // A stabiliser's sliver of somebody's squats is not training the abs.
    expect(heatColour(HEAT_FLOOR / 2, true)).toBe(RESTING_SKIN);
    expect(heatColour(Number.NaN, true)).toBe(RESTING_SKIN);
  });

  /** Rounding to the nearest step used to send a tenth of the peak back to skin. */
  it('paints anything trained, however little, a hot colour', () => {
    expect(heatColour(HEAT_FLOOR, true)).toBe(PALETTE.skinHeat[1]);
    expect(heatColour(0.1, true)).not.toBe(RESTING_SKIN);
  });

  it('keeps the deepest colour for the hardest-worked muscle', () => {
    expect(heatColour(1, true)).toBe(PALETTE.skinHeat.at(-1));
    expect(heatColour(3, true)).toBe(PALETTE.skinHeat.at(-1));
  });

  it('lands on each step where it sits, and blends between them', () => {
    const hot = PALETTE.skinHeat.slice(1);
    const at = (step: number) => HEAT_FLOOR + ((1 - HEAT_FLOOR) * step) / (hot.length - 1);
    hot.forEach((colour, step) => expect(heatColour(at(step), true)).toBe(colour));
    expect(hot).not.toContain(heatColour(at(1.5), true));
  });

  it('only ever gets hotter as the volume goes up', () => {
    const values = Array.from({ length: 20 }, (_, i) => HEAT_FLOOR + ((1 - HEAT_FLOOR) * i) / 19);
    const reds = values.map((value) => redness(heatColour(value, true)));
    reds.slice(1).forEach((red, i) => expect(red).toBeGreaterThanOrEqual(reds[i] ?? 0));
  });

  it('runs the same hot colours on the generated body, from its own cold', () => {
    expect(heatColour(0, false)).toBe(PALETTE.heat[0]);
    expect(heatColour(1, false)).toBe(heatColour(1, true));
    expect(heatColour(0.4, false)).toBe(heatColour(0.4, true));
  });
});
