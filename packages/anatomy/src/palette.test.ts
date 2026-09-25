import { describe, expect, it } from 'vitest';
import { HEAT_FLOOR, PALETTE, RESTING_SKIN, heatColour } from './palette.js';

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

  it('keeps the full red for the top fifth', () => {
    const red = PALETTE.skinHeat.at(-1);
    expect(heatColour(1, true)).toBe(red);
    expect(heatColour(0.85, true)).toBe(red);
    expect(heatColour(0.75, true)).not.toBe(red);
  });

  it('climbs through every step on the way up', () => {
    const seen = new Set([0.1, 0.3, 0.5, 0.7, 0.9].map((value) => heatColour(value, true)));
    expect(seen.size).toBe(PALETTE.skinHeat.length - 1);
  });

  it('runs the same hot colours on the generated body, from its own cold', () => {
    expect(heatColour(0, false)).toBe(PALETTE.heat[0]);
    expect(heatColour(1, false)).toBe(heatColour(1, true));
  });
});
