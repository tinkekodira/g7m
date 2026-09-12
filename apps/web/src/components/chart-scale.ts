/**
 * The arithmetic behind the charts.
 *
 * The charts themselves are hand-drawn SVG — a bar chart and a line are about
 * eighty lines each, they inherit the design tokens for free, and the
 * alternative is another dependency in a bundle that already carries three.js.
 * What that costs is exactly this: the scaling nobody writes tests for and
 * everybody gets subtly wrong.
 */
import { kgToLb, type UnitSystem } from '@g7m/core';

/**
 * A round number at or above the largest value, for the top of an axis.
 *
 * Scaling to the raw maximum makes the tallest bar touch the ceiling, which
 * reads as "off the chart" rather than "the biggest one". Rounding up to
 * something a person would say out loud — 5, 10, 25, 50 — also gives the axis
 * a label worth printing.
 *
 * Zero in, zero out: an empty chart should draw a flat baseline, not a
 * division by zero.
 */
export function niceMax(values: readonly number[]): number {
  const peak = Math.max(0, ...values.filter((value) => Number.isFinite(value)));
  if (peak <= 0) return 0;

  const magnitude = 10 ** Math.floor(Math.log10(peak));
  // The mantissa is peak expressed in units of that magnitude: 3400 → 3.4.
  const mantissa = peak / magnitude;
  const rounded = [1, 1.5, 2, 2.5, 5, 10].find((step) => mantissa <= step) ?? 10;
  return rounded * magnitude;
}

/**
 * A value's height as a fraction of the plot, 0 at the bottom.
 *
 * Clamped, because a chart drawn from live data will eventually be handed a
 * value above the axis it was scaled for — the week in progress growing past
 * the top of a chart built a moment earlier — and an SVG rectangle with a
 * negative height silently does not render.
 */
export function fractionOf(value: number, max: number): number {
  if (!Number.isFinite(value) || max <= 0) return 0;
  return Math.min(1, Math.max(0, value / max));
}

export interface Range {
  readonly min: number;
  readonly max: number;
}

/**
 * An axis that fits the data instead of starting at zero.
 *
 * Zero is the honest baseline for a volume chart — a week with no training
 * really is nothing, and a fitted axis would turn ordinary variation into a
 * cliff. It is the wrong baseline for bodyweight, where nobody is near zero
 * and the whole story lives inside a four-kilogram band: on a 0-to-90 axis a
 * successful cut is a flat line, which is precisely the information the chart
 * was drawn to show.
 *
 * A tenth of the spread is added at each end so the line does not run along
 * the edges of its own box, and a flat series gets a band around it rather
 * than a zero-height plot to divide by.
 */
export function niceRange(values: readonly number[], minimumSpread = 1): Range {
  const usable = values.filter((value) => Number.isFinite(value));
  if (usable.length === 0) return { min: 0, max: 1 };

  const low = Math.min(...usable);
  const high = Math.max(...usable);
  const padding = Math.max((high - low) * 0.1, minimumSpread / 2);
  return { min: low - padding, max: high + padding };
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

/**
 * Evenly spaced points across a box, for a trend line.
 *
 * `y` is flipped here rather than in the component: SVG's origin is top-left,
 * so a chart drawn from raw values comes out upside down, and it is the kind
 * of mistake that looks plausible on a noisy series.
 *
 * A single point sits in the middle horizontally rather than at x = 0, where
 * half the dot would be clipped by the edge of the viewbox.
 */
export function linePoints(
  values: readonly number[],
  max: number,
  width: number,
  height: number,
): Point[] {
  return linePointsWithin(values, { min: 0, max }, width, height);
}

/** `linePoints` against an axis that need not start at zero. See `niceRange`. */
export function linePointsWithin(
  values: readonly number[],
  range: Range,
  width: number,
  height: number,
): Point[] {
  const place = (value: number): number => height - fractionWithin(value, range) * height;

  if (values.length === 0) return [];
  if (values.length === 1) {
    return [{ x: width / 2, y: place(values[0] ?? 0) }];
  }

  const step = width / (values.length - 1);
  return values.map((value, index) => ({ x: index * step, y: place(value) }));
}

/** Where a value sits in a range, 0 at the bottom. Clamped, like `fractionOf`. */
export function fractionWithin(value: number, range: Range): number {
  const span = range.max - range.min;
  if (!Number.isFinite(value) || span <= 0) return 0;
  return Math.min(1, Math.max(0, (value - range.min) / span));
}

/** An SVG `points` attribute for a polyline. */
export function polylinePoints(points: readonly Point[]): string {
  return points.map((point) => `${round1(point.x)},${round1(point.y)}`).join(' ');
}

/**
 * A short, readable weight: `1.2t` past a tonne, `340` below it.
 *
 * Session volumes run to tens of thousands of kilograms, and an axis reading
 * "24500" is four characters of noise on a phone.
 */
export function formatVolume(kg: number): string {
  if (!Number.isFinite(kg) || kg <= 0) return '0';
  if (kg >= 1000) return `${(kg / 1000).toFixed(kg >= 10_000 ? 0 : 1)}t`;
  return String(Math.round(kg));
}

/**
 * `formatVolume` in the lifter's own unit, for a chart's bars and axis.
 *
 * Pounds get `k` where kilograms get `t`: a tonne is a metric unit, and "12t"
 * over a chart of pounds would be a third number in a third unit.
 */
export function formatVolumeShort(kg: number, unitSystem: UnitSystem): string {
  if (unitSystem === 'metric') return formatVolume(kg);
  const lb = Number.isFinite(kg) ? kgToLb(kg) : 0;
  if (lb <= 0) return '0';
  if (lb >= 1000) return `${(lb / 1000).toFixed(lb >= 10_000 ? 0 : 1)}k`;
  return String(Math.round(lb));
}

/**
 * A total with its unit on: `850 kg`, `12.4 t`, `1,870 lb`, `27k lb`.
 *
 * Replaces a pattern that appended " kg" to `formatVolume`, which works until
 * the total passes a tonne and the screen reads "2.1t kg" — and says kilograms
 * to somebody who asked for pounds.
 */
export function formatWeightTotal(kg: number, unitSystem: UnitSystem): string {
  const usable = Number.isFinite(kg) && kg > 0 ? kg : 0;

  if (unitSystem === 'imperial') {
    const lb = kgToLb(usable);
    if (lb < 10_000) return `${Math.round(lb).toLocaleString('en')} lb`;
    return `${(lb / 1000).toFixed(lb >= 100_000 ? 0 : 1)}k lb`;
  }

  if (usable < 1000) return `${String(Math.round(usable))} kg`;
  return `${(usable / 1000).toFixed(usable >= 10_000 ? 0 : 1)} t`;
}

/**
 * The same total to the kilogram or pound: `2,450 kg`, `5,401 lb`.
 *
 * For the running count on the workout screen, which should move with every
 * set ticked. Rounded to tonnes it would sit at "2.5 t" for four sets in a row
 * and look stuck.
 */
export function formatWeightExact(kg: number, unitSystem: UnitSystem): string {
  const usable = Number.isFinite(kg) && kg > 0 ? kg : 0;
  const value = unitSystem === 'imperial' ? kgToLb(usable) : usable;
  return `${Math.round(value).toLocaleString('en')} ${unitSystem === 'imperial' ? 'lb' : 'kg'}`;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
