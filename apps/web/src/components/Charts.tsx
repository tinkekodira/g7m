import { fractionOf, formatVolume, linePoints, niceMax, polylinePoints } from './chart-scale.js';

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

/**
 * A trend line, with a dot per session.
 *
 * `preserveAspectRatio="none"` so the line stretches to whatever width the
 * card is, and stroke widths given in the viewBox's own units so they do not
 * stretch with it — a line scaled horizontally by three renders three times
 * thicker on the vertical strokes otherwise.
 */
export function TrendChart({
  values,
  summary,
  format = formatVolume,
}: {
  readonly values: readonly number[];
  readonly summary: string;
  readonly format?: (value: number) => string;
}) {
  const max = niceMax(values);
  const points = linePoints(values, max, 100, 40);
  const last = values.at(-1) ?? 0;
  const first = values[0] ?? 0;

  if (values.length === 0) {
    return <p className="text-sm text-muted">Not enough sessions yet to draw a line.</p>;
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
