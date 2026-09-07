import { describe, expect, it } from 'vitest';
import {
  formatVolume,
  fractionOf,
  fractionWithin,
  linePoints,
  linePointsWithin,
  niceMax,
  niceRange,
  polylinePoints,
} from './chart-scale.js';

describe('niceMax', () => {
  /**
   * Scaling to the raw maximum makes the tallest bar touch the ceiling, which
   * reads as "off the chart" rather than "the biggest one".
   */
  it('rounds up to something a person would say out loud', () => {
    expect(niceMax([3400])).toBe(5000);
    expect(niceMax([12])).toBe(15);
    expect(niceMax([1])).toBe(1);
    expect(niceMax([26])).toBe(50);
  });

  it('is never below the largest value', () => {
    for (const peak of [1, 7, 99, 100, 101, 4321, 99_999]) {
      expect(niceMax([peak]), String(peak)).toBeGreaterThanOrEqual(peak);
    }
  });

  it('is zero for an empty chart rather than dividing by nothing', () => {
    expect(niceMax([])).toBe(0);
    expect(niceMax([0, 0, 0])).toBe(0);
  });

  it('ignores negatives and nonsense instead of scaling to them', () => {
    expect(niceMax([-500, 100])).toBe(100);
    expect(niceMax([Number.NaN, 100])).toBe(100);
  });

  it('scales to the peak, not the last value', () => {
    expect(niceMax([4000, 100, 200])).toBe(5000);
  });
});

describe('fractionOf', () => {
  it('is a fraction of the axis', () => {
    expect(fractionOf(50, 100)).toBe(0.5);
    expect(fractionOf(100, 100)).toBe(1);
    expect(fractionOf(0, 100)).toBe(0);
  });

  /**
   * A chart drawn from live data eventually meets a value above the axis it
   * was scaled for, and an SVG rect with a negative height silently does not
   * render at all.
   */
  it('clamps rather than overflowing the plot', () => {
    expect(fractionOf(150, 100)).toBe(1);
    expect(fractionOf(-50, 100)).toBe(0);
  });

  it('is zero when there is no axis to be a fraction of', () => {
    expect(fractionOf(50, 0)).toBe(0);
    expect(fractionOf(Number.NaN, 100)).toBe(0);
  });
});

describe('niceRange', () => {
  it('brackets the data instead of starting at zero', () => {
    const range = niceRange([80, 84]);
    expect(range.min).toBeLessThan(80);
    expect(range.max).toBeGreaterThan(84);
  });

  /**
   * The reason this exists. Bodyweight on a zero-based axis puts four
   * kilograms of change inside the top 5% of the plot, where it renders as a
   * flat line — the chart showing nothing at exactly the moment it has
   * something to show.
   */
  it('spreads a bodyweight series across the plot', () => {
    const values = [84, 83.2, 82.5, 81.1, 80];
    const range = niceRange(values);
    const spread = fractionWithin(84, range) - fractionWithin(80, range);
    expect(spread).toBeGreaterThan(0.5);
  });

  it('gives a flat series a band rather than a zero-height plot', () => {
    // Every reading identical is a real thing that happens on maintenance,
    // and dividing by a zero span would put every point at the bottom.
    const range = niceRange([82, 82, 82]);
    expect(range.max).toBeGreaterThan(range.min);
    expect(fractionWithin(82, range)).toBeCloseTo(0.5);
  });

  it('has a usable answer for no data at all', () => {
    expect(niceRange([])).toEqual({ min: 0, max: 1 });
  });
});

describe('fractionWithin', () => {
  it('places a value between the ends', () => {
    expect(fractionWithin(5, { min: 0, max: 10 })).toBe(0.5);
    expect(fractionWithin(85, { min: 80, max: 90 })).toBe(0.5);
  });

  it('clamps outside the range', () => {
    expect(fractionWithin(200, { min: 80, max: 90 })).toBe(1);
    expect(fractionWithin(0, { min: 80, max: 90 })).toBe(0);
  });
});

describe('linePointsWithin', () => {
  it('draws against a floor that is not zero', () => {
    // The lowest reading sits on the bottom of the box, not near the top of it.
    const points = linePointsWithin([80, 90], { min: 80, max: 90 }, 100, 40);
    expect(points[0]?.y).toBe(40);
    expect(points[1]?.y).toBe(0);
  });
});

describe('linePoints', () => {
  /**
   * SVG's origin is top-left, so a chart drawn from raw values comes out
   * upside down — a mistake that looks plausible on a noisy series.
   */
  it('puts the biggest value at the top', () => {
    const [low, high] = linePoints([0, 100], 100, 100, 50);
    expect(low?.y).toBe(50);
    expect(high?.y).toBe(0);
  });

  it('spaces points evenly across the full width', () => {
    const points = linePoints([1, 2, 3], 3, 100, 50);
    expect(points.map((p) => p.x)).toEqual([0, 50, 100]);
  });

  it('centres a single point, so the dot is not half off the edge', () => {
    expect(linePoints([5], 10, 100, 50)[0]?.x).toBe(50);
  });

  it('has nothing to draw for no data', () => {
    expect(linePoints([], 10, 100, 50)).toEqual([]);
  });

  it('draws a flat line along the bottom when nothing has a value', () => {
    const points = linePoints([0, 0, 0], 0, 100, 50);
    expect(points.every((p) => p.y === 50)).toBe(true);
  });
});

describe('polylinePoints', () => {
  it('is an SVG points attribute', () => {
    expect(
      polylinePoints([
        { x: 0, y: 50 },
        { x: 100, y: 0 },
      ]),
    ).toBe('0,50 100,0');
  });

  it('rounds, so the markup is not full of floating point noise', () => {
    expect(polylinePoints([{ x: 33.333333, y: 16.666666 }])).toBe('33.3,16.7');
  });

  it('is empty for an empty series', () => {
    expect(polylinePoints([])).toBe('');
  });
});

describe('formatVolume', () => {
  /**
   * Session volumes run to tens of thousands of kilograms, and an axis
   * reading "24500" is four characters of noise on a phone.
   */
  it('switches to tonnes once the number gets long', () => {
    expect(formatVolume(340)).toBe('340');
    expect(formatVolume(1200)).toBe('1.2t');
    expect(formatVolume(24_500)).toBe('25t');
  });

  it('rounds kilograms to whole numbers', () => {
    expect(formatVolume(340.6)).toBe('341');
  });

  it('is a plain zero for nothing at all', () => {
    expect(formatVolume(0)).toBe('0');
    expect(formatVolume(Number.NaN)).toBe('0');
  });
});
