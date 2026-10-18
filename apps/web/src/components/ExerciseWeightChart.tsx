import { useId } from 'react';
import { toDisplayWeight, type ExerciseWeightPoint, type UnitSystem } from '@g7m/core';
import { linePointsWithin, niceRange, polylinePoints } from './chart-scale.js';

function describeWeight(point: ExerciseWeightPoint, units: UnitSystem): string {
  if (point.loadType === 'bodyweight' || (point.loadType !== 'external' && point.weightKg === 0)) {
    return 'BW';
  }
  const { value, unit } = toDisplayWeight(Math.abs(point.weightKg), units);
  const sign =
    point.loadType === 'assisted' ? '−' : point.loadType === 'bodyweight_plus' ? '+' : '';
  return `${sign}${String(value)} ${unit}`;
}

/** A non-interactive preview inside the row's existing link. */
export function ExerciseWeightChart({
  points,
  unitSystem,
  cardio,
}: {
  readonly points: readonly ExerciseWeightPoint[];
  readonly unitSystem: UnitSystem;
  readonly cardio: boolean;
}) {
  const gradientId = useId();
  const latest = points.at(-1);
  const values = points.map((point) => point.weightKg);
  const plot = linePointsWithin(values, niceRange(values, 5), 100, 34).map(({ x, y }) => ({
    x: x + 7,
    y: y + 7,
  }));
  const last = plot.at(-1);
  const first = plot[0];
  const caption =
    latest === undefined
      ? cardio
        ? 'No weight data'
        : 'Not logged yet'
      : points.length === 1
        ? '1 session'
        : `Last ${String(points.length)} sessions`;
  const history = points
    .map((point) => {
      const date = point.performedAt.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const weight = describeWeight(point, unitSystem).replace('BW', 'Bodyweight');
      return `${date}: ${weight}${point.loadType === 'assisted' ? ' assistance' : point.loadType === 'bodyweight_plus' ? ' added' : ''}`;
    })
    .join('; ');
  const summary =
    latest === undefined
      ? cardio
        ? 'Weight progress is not available for cardio.'
        : 'No weight history. Complete a working set and finish the workout to start your chart.'
      : `Weight progress, ${caption.toLowerCase()}, oldest to newest. ${history}.`;

  return (
    <span className="exercise-weight-chart" role="img" aria-label={summary}>
      <span aria-hidden="true" className="numeric text-sm font-medium text-primary">
        {latest === undefined ? '—' : describeWeight(latest, unitSystem)}
      </span>
      <svg viewBox="0 0 114 48" aria-hidden="true" focusable="false">
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
          <line x1="7" x2="107" y1="35" y2="35" stroke="var(--border-subtle)" />
        )}
      </svg>
      <span aria-hidden="true" className="exercise-weight-caption text-secondary">
        {caption}
      </span>
    </span>
  );
}
