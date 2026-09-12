import {
  fractionOf,
  formatVolume,
  linePointsWithin,
  niceMax,
  niceRange,
  polylinePoints,
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
        <div
          aria-hidden
          className="absolute inset-x-0 top-5 bottom-0 flex flex-col justify-between"
        >
          <div className="border-t border-dashed border-subtle" />
          <div className="border-t border-dashed border-subtle" />
          <div className="border-t border-subtle" />
        </div>

        {/* Without labels on the columns, the top line needs its value. */}
        {!showValues && max > 0 && (
          <span className="numeric absolute top-0 left-0 text-[11px] text-muted">
            {format(max)}
          </span>
        )}

        <div className={`absolute inset-x-0 top-5 bottom-0 flex items-end ${gap}`}>
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
                {!datum.future && (
                  <div
                    className={`w-full max-w-9 rounded-t-md transition-[height] duration-300 ease-out ${
                      datum.inProgress === true ? 'bg-accent/55' : 'bg-accent'
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
