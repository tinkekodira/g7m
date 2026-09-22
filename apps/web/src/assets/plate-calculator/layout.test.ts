import { describe, expect, it } from 'vitest';
import { layoutBar } from './layout.js';
import { BAR_SPRITES } from './sprite-geometry.js';

const bar20 = BAR_SPRITES.bar_20;

describe('layoutBar', () => {
  it('places the collar against the stop on an empty bar', () => {
    const layout = layoutBar(bar20, []);
    expect(layout.plates).toEqual([]);
    // plate_start, in world coordinates: -(635.22 + (431.75 - 407.69))
    expect(layout.collar.x + 54.89).toBeCloseTo(-659.28, 1);
  });

  it('stacks plates outward from the stop, each butting the one before it', () => {
    const layout = layoutBar(bar20, [0, 1]); // red then blue
    expect(layout.plates).toHaveLength(2);

    const [red, blue] = layout.plates;
    // The red plate's anchor sits at plate_start.
    expect((red?.x ?? 0) + 135.57).toBeCloseTo(-659.28, 1);
    // The blue plate's anchor sits one red-thickness further out.
    expect((blue?.x ?? 0) + 122.72).toBeCloseTo(-659.28 - 73.15, 1);
    // The collar follows the blue plate by blue's own advance.
    expect(layout.collar.x + 54.89).toBeCloseTo(-659.28 - 73.15 - 65.45, 1);
  });

  it('keeps every piece on the shared axis row', () => {
    const layout = layoutBar(bar20, [3]);
    expect(layout.shaft.y).toBe(-240);
    expect(layout.sleeve.y).toBe(-240);
    expect(layout.plates[0]?.y).toBe(-240);
    expect(layout.collar.y).toBe(-240);
  });

  it('sets the frame half-width to the sleeve tip, independent of what is loaded', () => {
    const empty = layoutBar(bar20, []);
    const loaded = layoutBar(bar20, [0, 0, 0, 3, 5]);
    expect(empty.halfWidth).toBeCloseTo(1058.7, 1);
    expect(loaded.halfWidth).toBe(empty.halfWidth);
  });

  it('paints innermost first — plates are in the order they were loaded', () => {
    const layout = layoutBar(bar20, [0, 0, 0, 4, 6]);
    expect(layout.plates.map((plate) => plate.rank)).toEqual([0, 0, 0, 4, 6]);
  });
});
