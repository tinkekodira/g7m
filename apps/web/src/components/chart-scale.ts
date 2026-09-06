/**
 * The arithmetic behind the charts.
 *
 * The charts themselves are hand-drawn SVG — a bar chart and a line are about
 * eighty lines each, they inherit the design tokens for free, and the
 * alternative is another dependency in a bundle that already carries three.js.
 * What that costs is exactly this: the scaling nobody writes tests for and
 * everybody gets subtly wrong.
 */

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
  if (values.length === 0) return [];
  if (values.length === 1) {
    return [{ x: width / 2, y: height - fractionOf(values[0] ?? 0, max) * height }];
  }

  const step = width / (values.length - 1);
  return values.map((value, index) => ({
    x: index * step,
    y: height - fractionOf(value, max) * height,
  }));
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

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
