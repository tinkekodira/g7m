import { useMemo } from 'react';
import { Link, useParams } from 'react-router';
import {
  MAX_REPS_FOR_1RM_ESTIMATE,
  describeWhen,
  exerciseTrend,
  personalRecords,
  toDisplayWeight,
  type UnitSystem,
} from '@g7m/core';
import { HeaderLink } from '../components/HeaderLink.js';
import { TrendChart } from '../components/Charts.js';
import { useCatalogue } from '../lib/db/use-catalogue.js';

/**
 * One exercise over time.
 *
 * Two lines, not one: the heaviest set is what a lifter remembers, and the
 * estimated 1RM is what actually tracks progress when the rep scheme changes.
 * A single line has to pick one, and whichever it picks is wrong the week
 * somebody switches from fives to eights.
 */
export function ExerciseTrendScreen() {
  const { exerciseId = '' } = useParams();
  const now = useMemo(() => new Date(), []);

  const state = useCatalogue(`trend:${exerciseId}`, async (repositories) => {
    const [exercise, profile, sets] = await Promise.all([
      repositories.exercises.byId(exerciseId),
      repositories.profile.current(),
      repositories.history.completedSets({ exerciseId }),
    ]);

    return {
      exercise,
      unitSystem: profile?.unitSystem ?? 'metric',
      points: exerciseTrend(sets),
      records: personalRecords(sets),
    };
  });

  const data = state.data;

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-4 px-4 pt-safe-top pb-safe-bottom">
      <header className="flex items-baseline justify-between gap-4 pt-6 pb-2">
        <h1 className="text-2xl font-semibold text-primary">
          {data?.exercise?.name ?? 'Exercise'}
        </h1>
        <HeaderLink to="/progress">Progress</HeaderLink>
      </header>

      {state.error !== null ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : state.loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : data === null || data.points.length === 0 ? (
        <p className="rounded-card bg-surface p-4 text-sm text-secondary">
          Nothing logged for this exercise yet, or the sessions containing it were never finished.
        </p>
      ) : (
        <Trend
          points={data.points}
          records={data.records}
          unitSystem={data.unitSystem}
          exerciseSlug={data.exercise?.slug ?? null}
          now={now}
        />
      )}
    </main>
  );
}

function Trend({
  points,
  records,
  unitSystem,
  exerciseSlug,
  now,
}: {
  readonly points: readonly ReturnType<typeof exerciseTrend>[number][];
  readonly records: readonly ReturnType<typeof personalRecords>[number][];
  readonly unitSystem: UnitSystem;
  readonly exerciseSlug: string | null;
  readonly now: Date;
}) {
  const unit = unitSystem === 'imperial' ? 'lb' : 'kg';
  const display = (kg: number): string => String(toDisplayWeight(kg, unitSystem).value);

  const topSets = points.map((point) => point.topSetKg);
  /**
   * Sessions with no estimate are dropped rather than plotted as zero.
   *
   * A twenty-rep set produces no estimate on purpose — Epley says more about
   * conditioning than strength up there — and drawing it as a zero would put a
   * cliff in the line on the day somebody did a back-off set.
   */
  const estimates = points
    .map((point) => point.estimatedOneRepMax?.valueKg)
    .filter((value): value is number => value !== undefined);

  return (
    <>
      <section className="rounded-card bg-surface p-4">
        <h2 className="mb-1 text-lg font-semibold text-primary">Heaviest set</h2>
        <p className="mb-2 text-xs text-muted">The top set of each workout, in {unit}.</p>
        <TrendChart
          values={topSets.map((kg) => Number(display(kg)))}
          summary={`Heaviest set per workout across ${String(points.length)} sessions.`}
          format={(value) => `${String(Math.round(value))} ${unit}`}
        />
      </section>

      <section className="rounded-card bg-surface p-4">
        <h2 className="mb-1 text-lg font-semibold text-primary">Estimated one-rep max</h2>
        <p className="mb-2 text-xs text-muted">
          Epley, from sets of {String(MAX_REPS_FOR_1RM_ESTIMATE)} reps or fewer. It is an estimate,
          not a number to attempt.
        </p>
        {estimates.length === 0 ? (
          <p className="text-sm text-muted">
            No set so far is in the range where the estimate means anything.
          </p>
        ) : (
          <TrendChart
            values={estimates.map((kg) => Number(display(kg)))}
            summary={`Estimated one-rep max across ${String(estimates.length)} sessions.`}
            format={(value) => `${String(Math.round(value))} ${unit}`}
          />
        )}
      </section>

      <section className="rounded-card bg-surface p-4">
        <h2 className="mb-3 text-lg font-semibold text-primary">Every session</h2>
        <ul className="flex flex-col">
          {[...points].reverse().map((point) => (
            <li
              key={point.sessionId}
              className="flex items-baseline justify-between gap-3 border-b border-subtle py-2 last:border-b-0"
            >
              <Link
                to={`/progress/session/${point.sessionId}`}
                className="text-sm text-secondary underline-offset-4 hover:underline"
              >
                {describeWhen(point.performedAt, now)}
              </Link>
              <span className="numeric text-sm text-primary">
                {display(point.topSetKg)} {unit} × {point.reps}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {records.length > 0 && (
        <section className="rounded-card bg-surface p-4">
          <h2 className="mb-3 text-lg font-semibold text-primary">Bests</h2>
          <ul className="flex flex-col">
            {records.map((record) => (
              <li
                key={record.recordType}
                className="flex items-baseline justify-between gap-3 border-b border-subtle py-2 last:border-b-0"
              >
                <span className="text-sm text-secondary">{describeRecord(record.recordType)}</span>
                <span className="numeric text-sm text-primary">
                  {display(record.value)} {unit}
                  <span className="text-muted"> · {describeWhen(record.achievedAt, now)}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {exerciseSlug !== null && (
        <p className="pb-4 text-sm">
          <Link
            to={`/exercises/${exerciseSlug}`}
            className="text-accent underline-offset-4 hover:underline"
          >
            How to do this exercise
          </Link>
        </p>
      )}
    </>
  );
}

function describeRecord(recordType: string): string {
  if (recordType === 'max_weight') return 'Heaviest set';
  if (recordType === 'estimated_1rm') return 'Best estimated 1RM';
  return 'Most volume in one session';
}
