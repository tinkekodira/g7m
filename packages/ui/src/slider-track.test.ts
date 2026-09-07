import { describe, expect, it } from 'vitest';
import { stopAt, thumbOffset, trackFraction } from './slider-track.js';

describe('trackFraction', () => {
  it('measures where along the track the pointer landed', () => {
    expect(trackFraction(100, 100, 300)).toBe(0);
    expect(trackFraction(250, 100, 300)).toBe(0.5);
    expect(trackFraction(400, 100, 300)).toBe(1);
  });

  /**
   * The pointer is captured, so it keeps reporting after it leaves the
   * element — including from the other side of the screen. Without the clamp
   * the pill leaves with it.
   */
  it('holds on at the edges when the finger keeps going', () => {
    expect(trackFraction(-999, 100, 300)).toBe(0);
    expect(trackFraction(9999, 100, 300)).toBe(1);
  });

  it('answers rather than dividing by zero before layout', () => {
    expect(trackFraction(50, 0, 0)).toBe(0);
  });
});

describe('stopAt', () => {
  /**
   * The boundaries have to fall where the reader sees them — between two
   * words. A nearest-stop mapping puts them at the quarter points instead, and
   * then a tap on the first of three words selects the second.
   */
  it('cuts the track where the words are, not at the midpoints', () => {
    expect(stopAt(0.3, 3)).toBe(0); // still in the first third
    expect(stopAt(0.34, 3)).toBe(1);
    expect(stopAt(0.66, 3)).toBe(1);
    expect(stopAt(0.67, 3)).toBe(2);
  });

  it('reaches both ends', () => {
    expect(stopAt(0, 3)).toBe(0);
    expect(stopAt(1, 3)).toBe(2);
  });

  it('never answers off the end of the list', () => {
    for (const stops of [2, 3, 5]) {
      for (let step = -5; step <= 105; step += 1) {
        const answer = stopAt(step / 100, stops);
        expect(Number.isInteger(answer), `${String(stops)} stops at ${String(step)}`).toBe(true);
        expect(answer).toBeGreaterThanOrEqual(0);
        expect(answer).toBeLessThanOrEqual(stops - 1);
      }
    }
  });

  it('has nowhere to go with a single stop', () => {
    expect(stopAt(0.9, 1)).toBe(0);
    expect(stopAt(0.9, 0)).toBe(0);
  });
});

describe('thumbOffset', () => {
  it('runs from the first cell to the last, in pill widths', () => {
    expect(thumbOffset(0, 3)).toBe(0);
    expect(thumbOffset(0.5, 3)).toBe(1);
    expect(thumbOffset(1, 3)).toBe(2);
  });

  it('pins at the ends while the finger carries on past', () => {
    // Inside the outer half-cell the pill has already reached the end.
    expect(thumbOffset(0.1, 3)).toBe(0);
    expect(thumbOffset(0.95, 3)).toBe(2);
  });

  it('follows the finger rather than jumping between stops', () => {
    // The whole point of the drag: 1/300th of the track moves the pill.
    expect(thumbOffset(0.5, 3)).not.toBe(thumbOffset(0.5033, 3));
  });

  it('never moves backwards as the finger moves forwards', () => {
    let previous = -1;
    for (let step = 0; step <= 100; step += 1) {
      const offset = thumbOffset(step / 100, 3);
      expect(offset, String(step)).toBeGreaterThanOrEqual(previous);
      previous = offset;
    }
  });
});

/**
 * The property the whole control rests on. If the drawn position and the
 * selected stop can disagree by more than half a cell, then the pill sits over
 * one word while another is highlighted, and letting go makes it jump
 * somewhere the finger never was.
 */
describe('the pill and the selection', () => {
  it('never disagree by more than half a cell', () => {
    for (const stops of [2, 3, 5]) {
      for (let step = 0; step <= 1000; step += 1) {
        const fraction = step / 1000;
        const drawn = thumbOffset(fraction, stops);
        const selected = stopAt(fraction, stops);
        expect(
          Math.abs(drawn - selected),
          `${String(stops)} stops at ${String(fraction)}`,
        ).toBeLessThanOrEqual(0.5);
      }
    }
  });

  it('agree exactly at every resting position', () => {
    for (const stops of [2, 3, 5]) {
      for (let index = 0; index < stops; index += 1) {
        // The centre of a cell is where the pill comes to rest.
        const fraction = (index + 0.5) / stops;
        expect(stopAt(fraction, stops)).toBe(index);
        // Close rather than equal: a cell centre is a third or a fifth, and
        // those do not survive a round trip through binary floating point.
        expect(thumbOffset(fraction, stops)).toBeCloseTo(index, 10);
      }
    }
  });
});
