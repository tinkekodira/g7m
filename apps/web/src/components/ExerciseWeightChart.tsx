import { formatDate, formatNumber, t } from '@g7m/i18n';
import { useId } from 'react';
import { toDisplayWeight, type ExerciseWeightPoint, type UnitSystem } from '@g7m/core';
import { linePointsWithin, niceRange, polylinePoints } from './chart-scale.js';

function describeWeight(point: ExerciseWeightPoint, units: UnitSystem): string {
  if (point.loadType === 'bodyweight' || (point.loadType !== 'external' && point.weightKg === 0)) {
    return t().progress.weightChart.bw;
  }
  const { value, unit } = toDisplayWeight(Math.abs(point.weightKg), units);
  const sign =
    point.loadType === 'assisted' ? '−' : point.loadType === 'bodyweight_plus' ? '+' : '';
  return `${sign}${formatNumber(value)} ${unit}`;
}

/** A non-interactive preview: in a picker row, on an exercise's page, on a recap card. */
export function ExerciseWeightChart({
  points,
  unitSystem,
  cardio,
  compact = false,
  wide = false,
  decorative = false,
}: {
  readonly points: readonly ExerciseWeightPoint[];
  readonly unitSystem: UnitSystem;
  readonly cardio: boolean;
  /** Recap cards already show the best set, so only the sparkline is needed. */
  readonly compact?: boolean;
  /** A full-width line, for an exercise's own page rather than a row. */
  readonly wide?: boolean;
  /**
   * Inside a button, whose children are presentational: the dated history
   * would become one long button name. Screen readers get the latest weight
   * and the caption instead.
   */
  readonly decorative?: boolean;
}) {
  const gradientId = useId();
  const latest = points.at(-1);
  const values = points.map((point) => point.weightKg);
  const width = wide ? 300 : 100;
  const plot = linePointsWithin(values, niceRange(values, 5), width, 34).map(({ x, y }) => ({
    x: x + 7,
    y: y + 7,
  }));
  const last = plot.at(-1);
  const first = plot[0];
  const words = t().progress.weightChart;
  const caption =
    latest === undefined
      ? cardio
        ? words.noWeightData
        : words.notLogged
      : points.length === 1
        ? words.oneSession
        : words.lastSessions(points.length);
  const history = points
    .map((point) => {
      const date = formatDate(point.performedAt, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const weight = describeWeight(point, unitSystem).replace(words.bw, words.bodyweight);
      return words.point(
        date,
        weight,
        point.loadType === 'assisted'
          ? 'assisted'
          : point.loadType === 'bodyweight_plus'
            ? 'added'
            : null,
      );
    })
    .join('; ');
  const summary =
    latest === undefined ? (cardio ? words.cardio : words.none) : words.summary(caption, history);

  const latestText = latest === undefined ? '—' : describeWeight(latest, unitSystem);
  const chart = (
    <span
      className={`exercise-weight-chart${wide ? ' exercise-weight-chart-wide' : ''}`}
      {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': summary })}
    >
      {!compact && (
        <span aria-hidden="true" className="numeric text-sm font-medium text-primary">
          {latestText}
        </span>
      )}
      <svg viewBox={`0 0 ${String(width + 14)} 48`} aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        {first !== undefined && last !== undefined ? (
          <>
            {plot.length > 1 && (
              <>
                <path
                  d={`M ${String(first.x)} 48 L ${polylinePoints(plot)} L ${String(last.x)} 48 Z`}
                  fill={`url(#${gradientId})`}
                />
                <polyline
                  points={polylinePoints(plot)}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            )}
            {plot.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="2.3"
                fill="var(--bg-surface)"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            ))}
            <circle cx={last.x} cy={last.y} r="5.5" fill="currentColor" opacity="0.2" />
            <circle
              cx={last.x}
              cy={last.y}
              r="3"
              fill="var(--text-primary)"
              stroke="currentColor"
              strokeWidth="1.8"
            />
          </>
        ) : (
          <line x1="7" x2={width + 7} y1="35" y2="35" stroke="var(--border-subtle)" />
        )}
      </svg>
      {!compact && (
        <span aria-hidden="true" className="exercise-weight-caption text-secondary">
          {caption}
        </span>
      )}
    </span>
  );
  if (!decorative) return chart;
  return (
    <>
      {chart}
      <span className="sr-only">
        {latest === undefined ? `, ${caption}` : `, ${latestText}, ${caption}`}
      </span>
    </>
  );
}
