import { useId, type ReactNode } from 'react';
import {
  fractionOf,
  formatVolume,
  linePointsWithin,
  niceMax,
  niceRange,
  polylinePoints,
  smoothPath,
} from './chart-scale.js';

/**
 * Two hand-drawn SVG charts.
 *
 * No charting library. A bar chart and a line are this much code, they take
 * their colours from the design tokens without a theme adapter, and the
 * bundle already carries three.js for the Learn pillar — a second large
 * dependency to draw twelve rectangles is not a trade worth making.
 *
 * Both are `role="img"` with a written summary. A chart that a screen reader
 * announces as "graphic" is a chart that is not there for some people, and
 * the summary is cheap because the numbers are already to hand.
 */

export interface BarDatum {
  readonly label: string;
  readonly value: number;
  /** Shown under the bar. Kept short — there are twelve of them on a phone. */
  readonly caption?: string;
}

export function BarChart({
  data,
  summary,
  format = formatVolume,
}: {
  readonly data: readonly BarDatum[];
  readonly summary: string;
  readonly format?: (value: number) => string;
}) {
  const max = niceMax(data.map((datum) => datum.value));

  return (
    <figure className="m-0">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="numeric text-xs text-muted">{max === 0 ? '' : format(max)}</span>
      </div>

      <div role="img" aria-label={summary} className="flex h-32 items-end gap-1">
        {data.map((datum, index) => (
          <div
            key={`${datum.label}-${String(index)}`}
            className="flex h-full flex-1 flex-col justify-end"
          >
            <div
              className={
                // The last bar is the week in progress. Distinguishing it stops
                // a Monday reading as a collapse in training.
                index === data.length - 1
                  ? 'w-full rounded-t-sm bg-accent/50'
                  : 'w-full rounded-t-sm bg-accent'
              }
              // A minimum of one pixel for any non-zero value: a bar rounded
              // to nothing is indistinguishable from a week off.
              style={{
                height: `${String(Math.max(datum.value > 0 ? 2 : 0, fractionOf(datum.value, max) * 100))}%`,
              }}
            />
          </div>
        ))}
      </div>

      <div className="mt-1 flex gap-1">
        {data.map((datum, index) => (
          <span
            key={`${datum.label}-caption-${String(index)}`}
            className="numeric flex-1 text-center text-[10px] text-muted"
          >
            {datum.caption ?? ''}
          </span>
        ))}
      </div>
    </figure>
  );
}

export interface ColumnDatum {
  readonly key: string;
  readonly value: number;
  /** Under the column. Empty leaves a gap — thirty-one day numbers do not fit a phone. */
  readonly caption: string;
  /** Still filling up, so drawn lighter: a month three days old is not a collapse. */
  readonly inProgress?: boolean;
  /** Has not happened yet. No column, and a fainter caption. */
  readonly future?: boolean;
  /** The caption to pick out — today. */
  readonly highlight?: boolean;
}

/**
 * The progress screen's chart: one column per day, or per month.
 *
 * Taller and rounder than `BarChart`, with its gridlines drawn and — where
 * there are few enough columns to have room — each column's value printed on
 * top of it. Seven numbers over seven days is the answer somebody wanted; an
 * axis they have to read across to is a step between them and it.
 *
 * Columns are measured against a plot area that stops short of the top, so
 * the tallest one still has room for its label above it.
 */
export function ColumnChart({
  data,
  summary,
  format = formatVolume,
  showValues = data.length <= 12,
}: {
  readonly data: readonly ColumnDatum[];
  readonly summary: string;
  readonly format?: (value: number) => string;
  readonly showValues?: boolean;
}) {
  const max = niceMax(data.map((datum) => datum.value));
  const gap = data.length > 14 ? 'gap-0.5' : 'gap-1.5';

  return (
    <figure className="m-0">
      <div role="img" aria-label={summary} className="relative h-44">
        {/* Solid hairlines, as on Home: a dashed rule reads as a target or a
            projection, and these are neither (ADR-0124). */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-5 bottom-0 flex flex-col justify-between"
        >
          <div className="border-t border-subtle/50" />
          <div className="border-t border-subtle/50" />
          <div className="border-t border-subtle" />
        </div>

        {/* Without labels on the columns, the top line needs its value. */}
        {!showValues && max > 0 && (
          <span className="numeric absolute top-0 left-0 text-[11px] text-muted">
            {format(max)}
          </span>
        )}

        <div className={`grow-y absolute inset-x-0 top-5 bottom-0 flex items-end ${gap}`}>
          {data.map((datum) => {
            const height = Math.max(datum.value > 0 ? 3 : 0, fractionOf(datum.value, max) * 100);
            return (
              <div
                key={datum.key}
                className="relative flex h-full min-w-0 flex-1 items-end justify-center"
              >
                {showValues && datum.value > 0 && (
                  <span
                    className="numeric absolute left-1/2 -translate-x-1/2 text-[10px] whitespace-nowrap text-secondary"
                    style={{ bottom: `calc(${String(height)}% + 4px)` }}
                  >
                    {format(datum.value)}
                  </span>
                )}
                {/* Today in the full accent, the rest a step lighter, as on
                    Home's duration card: the eye finds where the period is up
                    to. A month still running is lighter again. */}
                {!datum.future && (
                  <div
                    className={`w-full max-w-6 rounded-t-sm transition-[height] duration-300 ease-out ${
                      datum.highlight === true
                        ? 'bg-accent'
                        : datum.inProgress === true
                          ? 'bg-accent/40'
                          : 'bg-accent/70'
                    }`}
                    style={{ height: `${String(height)}%` }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className={`mt-2 flex ${gap}`}>
        {data.map((datum) => (
          <span
            key={`${datum.key}-caption`}
            className={`numeric min-w-0 flex-1 text-center text-[11px] ${
              datum.highlight === true
                ? 'font-semibold text-primary'
                : datum.future === true
                  ? 'text-muted/60'
                  : 'text-muted'
            }`}
          >
            {datum.caption}
          </span>
        ))}
      </div>
    </figure>
  );
}

/**
 * A trend line, with a dot per session.
 *
 * `preserveAspectRatio="none"` so the line stretches to whatever width the
 * card is, and stroke widths given in the viewBox's own units so they do not
 * stretch with it — a line scaled horizontally by three renders three times
 * thicker on the vertical strokes otherwise.
 */
/**
 * Where the bottom of the axis sits.
 *
 * `zero` for anything that can genuinely be none of something — a week with
 * no training is zero volume, and fitting the axis to the data would redraw
 * ordinary variation as a cliff.
 *
 * `fit` for a quantity with no meaningful zero. Bodyweight is the case: on an
 * axis running from zero, four kilograms lost over three months is a flat
 * line, which is exactly the information the chart was drawn to show.
 */
export type Baseline = 'zero' | 'fit';

export function TrendChart({
  values,
  summary,
  format = formatVolume,
  baseline = 'zero',
  empty = 'Not enough sessions yet to draw a line.',
}: {
  readonly values: readonly number[];
  readonly summary: string;
  readonly format?: (value: number) => string;
  readonly baseline?: Baseline;
  readonly empty?: string;
}) {
  const range = baseline === 'fit' ? niceRange(values) : { min: 0, max: niceMax(values) };
  const points = linePointsWithin(values, range, 100, 40);
  const last = values.at(-1) ?? 0;
  const first = values[0] ?? 0;

  if (values.length === 0) {
    return <p className="text-sm text-muted">{empty}</p>;
  }

  return (
    <figure className="m-0">
      <div className="flex items-baseline justify-between">
        <span className="numeric text-lg text-primary">{format(last)}</span>
        {/* The change since the first point, which is the question somebody
            opened the chart to answer. */}
        {values.length > 1 && (
          <span className={`numeric text-xs ${last >= first ? 'text-accent' : 'text-muted'}`}>
            {last >= first ? '+' : '−'}
            {format(Math.abs(last - first))} since the first
          </span>
        )}
      </div>

      <svg
        role="img"
        aria-label={summary}
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
        className="mt-2 h-24 w-full overflow-visible"
      >
        <polyline
          points={polylinePoints(points)}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={1}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {/*
          Zero-length lines with a round cap, not circles.

          `preserveAspectRatio="none"` stretches the viewBox horizontally to
          whatever width the card is, and a `<circle>` stretches with it into a
          wide oval. A stroke marked `non-scaling-stroke` is drawn in screen
          units after that transform, so a round cap stays round — which makes
          this the one shape that survives the stretch.
        */}
        {points.map((point, index) => (
          <line
            key={`${String(index)}-${String(point.x)}`}
            x1={point.x}
            y1={point.y}
            x2={point.x}
            y2={point.y}
            stroke="var(--color-accent)"
            strokeWidth={4}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
    </figure>
  );
}

/**
 * How a chart arrives (ADR-0120).
 *
 *   still  drawn as it is, no motion — Reduce Motion, or Home opened again
 *   wait   not drawn yet: a card off to the side, waiting to be swiped to
 *   play   drawing itself in now
 *
 * The motion itself is CSS (`styles.css`), so the system's Reduce Motion rule
 * flattens it without anything here having to ask.
 */
export type Motion = 'still' | 'wait' | 'play';

const LINE_WIDTH = 300;
const LINE_HEIGHT = 100;

/** The days a month axis is labelled at: the 1st, each week, the last. */
function dayTicks(days: number): number[] {
  return [1, 8, 15, 22, days];
}

/**
 * Where a running total bends: zero at the start of the 1st, the end of every
 * day it went up, and the end of the last day drawn.
 *
 * Not one point a day. A count goes up in whole steps, and a point on every
 * flat day drew a staircase; through the days that changed it reads as the
 * climb it is, and the monotone curve still never dips.
 *
 * A long break is the exception. Between a workout on the 2nd and the next on
 * the 25th, a curve through those two alone would creep up for three weeks of
 * nothing. So after more than `HOLD_DAYS` without a change, the line is held
 * flat until the day before the next one, and the break looks like a break.
 */
const HOLD_DAYS = 3;

function knots(totals: readonly number[], days: number): { x: number; y: number }[] {
  const end = (index: number): number => ((index + 1) / days) * LINE_WIDTH;
  const points = [{ x: 0, y: 0 }];
  let lastIndex = -1;
  let lastValue = 0;
  totals.forEach((value, index) => {
    const changed = value !== lastValue;
    if (!changed && index !== totals.length - 1) return;
    if (changed && index - lastIndex > HOLD_DAYS) {
      points.push({ x: end(index - 1), y: lastValue });
    }
    points.push({ x: end(index), y: value });
    lastIndex = index;
    lastValue = value;
  });
  return points;
}

/**
 * Workouts so far this month as a running total, over last month's.
 *
 * A running total rather than a column a day: most days have no workout, and
 * thirty columns of mostly nothing reads as a month of failing. A line that
 * only ever rises reads as what it is — progress adding up. Last month is the
 * faint line behind it, so "ahead" and "behind" are something to see, not just
 * a sentence underneath.
 *
 * Drawn like `TrendChart`: the SVG stretches to the card and its strokes do
 * not, and anything that must stay round — the dot on today — is HTML placed
 * over it rather than an SVG circle that would stretch into an oval.
 */
export function MonthLine({
  current,
  previous,
  days,
  monthLabel,
  currentName,
  previousName,
  showPrevious,
  summary,
  motion,
}: {
  /** Running totals from the 1st to today. */
  readonly current: readonly number[];
  /** Running totals for every day of last month. */
  readonly previous: readonly number[];
  /** Days in this month: the width of the axis. */
  readonly days: number;
  /** "Oct", for the first tick. */
  readonly monthLabel: string;
  readonly currentName: string;
  readonly previousName: string;
  readonly showPrevious: boolean;
  readonly summary: string;
  readonly motion: Motion;
}) {
  const gradient = useId();
  const shown = showPrevious ? previous.slice(0, days) : [];
  // Never an axis of 0 to 1: four is the least a month's line is drawn against.
  const max = niceMax([...current, ...shown, 4]);
  const y = (value: number): number => LINE_HEIGHT - fractionOf(value, max) * LINE_HEIGHT;
  const plot = (totals: readonly number[]) =>
    knots(totals, days).map((point) => ({ x: point.x, y: y(point.y) }));

  // The axis runs from the start of the 1st to the end of the last day, so
  // the line always leaves from nothing and today's dot sits at the end of
  // today, where the day's workouts are counted.
  const points = current.length === 0 ? [] : plot(current);
  const line = smoothPath(points);
  const last = points.at(-1);
  const area =
    last === undefined
      ? ''
      : `${line}L${String(last.x)},${String(LINE_HEIGHT)}L0,${String(LINE_HEIGHT)}Z`;
  const ghost = shown.length === 0 ? '' : smoothPath(plot(shown));

  return (
    <figure className="m-0 flex min-h-0 flex-1 flex-col">
      <div className="relative min-h-24 flex-1">
        {/* Two values on the axis: the top, and nothing. The line's own end
            says where it is now, and the number above the chart says how many. */}
        <span className="numeric absolute top-0 left-0 -translate-y-1/2 text-[10px] leading-none text-muted">
          {max}
        </span>
        <span className="numeric absolute bottom-0 left-0 translate-y-1/2 text-[10px] leading-none text-muted">
          0
        </span>

        <div className="absolute inset-y-0 right-1 left-5">
          <div aria-hidden className="absolute inset-0 flex flex-col justify-between">
            <div className="border-t border-subtle/50" />
            <div className="border-t border-subtle/50" />
            <div className="border-t border-subtle" />
          </div>

          {showPrevious && (
            <div
              aria-hidden
              className="absolute top-1.5 left-1.5 flex items-center gap-3 text-[10px] text-muted"
            >
              <span className="flex items-center gap-1">
                <span className="h-0.5 w-3 rounded-full bg-accent" />
                {currentName}
              </span>
              <span className="flex items-center gap-1">
                <span className="h-0.5 w-3 rounded-full bg-muted" />
                {previousName}
              </span>
            </div>
          )}

          <svg
            role="img"
            aria-label={summary}
            viewBox={`0 0 ${String(LINE_WIDTH)} ${String(LINE_HEIGHT)}`}
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full overflow-visible"
          >
            <defs>
              <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {ghost !== '' && (
              <path
                d={ghost}
                fill="none"
                stroke="var(--text-muted)"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            )}
            <g
              className={
                motion === 'play' ? 'reveal-x' : motion === 'wait' ? 'reveal-wait' : undefined
              }
            >
              <path d={area} fill={`url(#${gradient})`} />
              <path
                d={line}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          </svg>

          {last !== undefined && (
            <span
              aria-hidden
              className={`absolute size-0 ${motion === 'play' ? 'pop-in' : motion === 'wait' ? 'opacity-0' : ''}`}
              style={{
                left: `${String((last.x / LINE_WIDTH) * 100)}%`,
                top: `${String((last.y / LINE_HEIGHT) * 100)}%`,
              }}
            >
              <span className="absolute size-6 -translate-1/2 rounded-full bg-accent/20" />
              <span className="absolute size-2.5 -translate-1/2 rounded-full bg-accent ring-2 ring-surface" />
            </span>
          )}
        </div>
      </div>

      <div aria-hidden className="relative mt-2 mr-1 ml-5 h-3">
        {dayTicks(days).map((day, index, all) => (
          <span
            key={day}
            className={`numeric absolute top-0 text-[10px] leading-none whitespace-nowrap text-muted ${
              index === 0 ? '' : index === all.length - 1 ? '-translate-x-full' : '-translate-x-1/2'
            }`}
            // A day's label sits under the middle of that day.
            style={{ left: `${String(((day - 0.5) / Math.max(1, days)) * 100)}%` }}
          >
            {index === 0 ? `${monthLabel} 1` : day}
          </span>
        ))}
      </div>
    </figure>
  );
}

export interface RingSlice {
  readonly key: string;
  readonly value: number;
  /** A CSS colour, normally a region token: `var(--region-legs)`. */
  readonly color: string;
}

const RING_RADIUS = 46;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
/** The surface showing between slices, in the ring's own units. */
const RING_GAP = 2.4;

/**
 * Part of a whole, as a ring: the muscle groups on Home.
 *
 * Six slices at most, in a fixed order — colour follows the region, never its
 * rank, so legs are the same colour this month and next. The slices are
 * separated by a gap in the surface colour rather than an outline, and the
 * total sits in the middle, where a pie would have put more pie.
 *
 * It sweeps round once on arrival: a mask over the whole ring draws in from
 * twelve o'clock, so the slices themselves never have to animate.
 */
export function RegionRing({
  slices,
  center,
  summary,
  motion,
}: {
  readonly slices: readonly RingSlice[];
  readonly center: ReactNode;
  readonly summary: string;
  readonly motion: Motion;
}) {
  const mask = useId();
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const gap = slices.length > 1 ? RING_GAP : 0;

  let offset = 0;
  const arcs = slices.map((slice) => {
    const length = total > 0 ? (slice.value / total) * RING_CIRCUMFERENCE : 0;
    const arc = { ...slice, dash: Math.max(length - gap, 0.5), offset };
    offset += length;
    return arc;
  });

  return (
    <div className="relative size-32 shrink-0">
      <svg role="img" aria-label={summary} viewBox="0 0 120 120" className="size-full -rotate-90">
        <defs>
          <mask id={mask}>
            <circle
              cx="60"
              cy="60"
              r={RING_RADIUS}
              fill="none"
              stroke="white"
              strokeWidth={16}
              pathLength={1}
              strokeDasharray="1 1"
              className={motion === 'play' ? 'sweep' : motion === 'wait' ? 'sweep-wait' : undefined}
            />
          </mask>
        </defs>
        {total === 0 && (
          <circle
            cx="60"
            cy="60"
            r={RING_RADIUS}
            fill="none"
            stroke="var(--border-subtle)"
            strokeWidth={12}
          />
        )}
        <g mask={`url(#${mask})`}>
          {arcs.map((arc) => (
            <circle
              key={arc.key}
              cx="60"
              cy="60"
              r={RING_RADIUS}
              fill="none"
              stroke={arc.color}
              strokeWidth={12}
              strokeDasharray={`${String(arc.dash)} ${String(RING_CIRCUMFERENCE)}`}
              strokeDashoffset={-arc.offset}
            />
          ))}
        </g>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{center}</div>
    </div>
  );
}
