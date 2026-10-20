import type { ReactNode } from 'react';
import {
  describePreviousSet,
  formatDuration,
  regionOf,
  type LiftMark,
  type UnitSystem,
} from '@g7m/core';
import type { loadWorkoutRecap } from '../lib/db/workout-recap.js';
import { RecapCarousel } from './RecapCarousel.js';
import { RecapRewards } from './RecapRewards.js';
import { ExerciseIcon } from './ExerciseIcon.js';
import { Link } from 'react-router';
import {
  ArrowUpIcon,
  ChevronRightIcon,
  ClockIcon,
  DumbbellIcon,
  ClipboardIcon,
  TrophyIcon,
} from './icons.js';
import { formatRecapWeight, recapChange } from './recap-change.js';
import { WorkoutMuscleBody } from './WorkoutMuscleBody.js';
import { ExerciseWeightChart } from './ExerciseWeightChart.js';
import { SessionBody } from './SessionBody.js';
import { Panel } from './Panel.js';
import { formatWeightTotal } from './chart-scale.js';
import { muscleColorStyle } from './muscle-colors.js';

type RecapData = NonNullable<Awaited<ReturnType<typeof loadWorkoutRecap>>>;

/** Four pages of the saved workout, with a shared action area below. */
export function WorkoutRecap({ data }: { readonly data: RecapData }) {
  const { recap, rewards } = data;
  const units = data.profile?.unitSystem ?? 'metric';
  const records = recap.comparisons.reduce((sum, c) => sum + c.records.length, 0);
  const strength = recap.comparisons.length > 0;
  return (
    <RecapCarousel
      cards={[
        {
          title: 'Your session',
          content: () => (
            <Panel
              title="Your session"
              tone="hero"
              className="recap-card recap-session"
              aside={
                records > 0 ? (
                  <span className="text-sm font-semibold text-accent">
                    {records} {records === 1 ? 'PR' : 'PRs'}
                  </span>
                ) : undefined
              }
            >
              <p className="mt-1 text-sm break-words text-secondary">{data.title}</p>
              <p className="mt-1 text-xs text-muted">
                {data.session.startedAt.toLocaleDateString(undefined, {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
                {data.session.source === 'past' ? ' · Logged afterwards' : ''}
              </p>
              <dl className="recap-totals numeric grid grid-cols-2">
                <Fact
                  label="Workout time"
                  value={
                    recap.elapsedSeconds === null
                      ? 'Not recorded'
                      : formatDuration(recap.elapsedSeconds)
                  }
                />
                <Fact label="Exercises" value={String(recap.exercises)} />
                <Fact label="Working sets" value={String(recap.sets)} />
                <Fact
                  label="Lifted volume"
                  value={formatWeightTotal(recap.volume.volumeKg, units)}
                />
                {recap.cardioSeconds > 0 && (
                  <Fact label="Cardio time" value={formatDuration(recap.cardioSeconds)} />
                )}
                {recap.cardioKcal > 0 && (
                  <Fact
                    label="Estimated cardio calories"
                    value={`${String(Math.round(recap.cardioKcal))} kcal`}
                  />
                )}
              </dl>
              {recap.volume.unknownSets > 0 && (
                <p className="mt-4 text-xs text-muted">
                  Volume excludes {recap.volume.unknownSets}{' '}
                  {recap.volume.unknownSets === 1 ? 'set' : 'sets'} without a recorded bodyweight.
                </p>
              )}
              <RecapRewards rewards={rewards} />
            </Panel>
          ),
        },
        {
          title: 'Muscles trained',
          content: (active) => (
            <Panel title="Muscles trained" className="recap-card">
              {active && (
                <WorkoutMuscleBody sex={data.profile?.sex ?? null} muscles={data.trainedMuscles} />
              )}
              {recap.muscles.length === 0 && (
                <p className="mt-4 text-sm text-secondary">
                  No primary muscle distribution recorded for this session.
                </p>
              )}
              <ul className="mt-4 space-y-3">
                {recap.muscles.map((muscle) => (
                  <li key={muscle.group} style={muscleColorStyle(muscle.group)}>
                    <div className="mb-1 flex justify-between gap-3 text-sm">
                      <span className="text-secondary">
                        {data.muscleNames.get(muscle.group) ?? muscle.group}
                      </span>
                      <span className="numeric text-muted">{Math.round(muscle.share * 100)}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-elevated" aria-hidden>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${String(muscle.share * 100)}%`,
                          background: `var(--region-${regionOf(muscle.group) ?? 'core'})`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          ),
        },
        {
          title: 'Compared with last time',
          content: () => (
            <Panel title="Compared with last time" className="recap-card">
              {!strength && (
                <p className="mt-4 text-sm text-secondary">
                  No working strength sets to compare in this session.
                </p>
              )}
              <ul className="recap-comparisons mt-3 space-y-3">
                {recap.comparisons.map((comparison) => {
                  const exercise = data.exercises.get(comparison.exerciseId);
                  const points = data.weightProgress.get(comparison.exerciseId) ?? [];
                  const change = recapChange(comparison, units);
                  const sets = data.blocks
                    .filter((b) => b.entry.exerciseId === comparison.exerciseId)
                    .reduce(
                      (n, b) =>
                        n + b.sets.filter((s) => s.isCompleted && s.setType !== 'warmup').length,
                      0,
                    );
                  return (
                    <li key={comparison.exerciseId}>
                      <Link
                        to={`/progress/exercise/${comparison.exerciseId}`}
                        className="recap-comparison block rounded-control border border-subtle p-3 hover:border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      >
                        <div className="recap-comparison-heading">
                          <ExerciseIcon slug={exercise?.slug ?? ''} />
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold break-words text-primary">
                              {exercise?.name ?? 'Exercise'}
                            </h3>
                            <p className="mt-0.5 flex items-center gap-2 text-xs text-secondary">
                              {sets} {sets === 1 ? 'set' : 'sets'}
                              {comparison.records.length > 0 && (
                                <span className="text-accent">
                                  <TrophyIcon className="size-3.5" />
                                  <span className="sr-only">
                                    {comparison.records.some((r) => r.kind === 'heaviest')
                                      ? 'Heaviest yet'
                                      : 'Best estimated 1RM'}
                                  </span>
                                </span>
                              )}
                            </p>
                          </div>
                          <ChevronRightIcon className="size-4 text-muted" />
                          <span className="recap-change numeric" data-direction={change.direction}>
                            {change.direction !== 0 && (
                              <span className="sr-only">
                                {change.direction > 0 ? 'Up ' : 'Down '}
                              </span>
                            )}
                            {change.direction !== 0 && (
                              <ArrowUpIcon
                                className={`size-3.5 shrink-0 ${change.direction < 0 ? 'rotate-180' : ''}`}
                              />
                            )}
                            <span>
                              {change.direction === 0 ? '− ' : ''}
                              {change.label}
                            </span>
                          </span>
                        </div>
                        <div
                          className={`recap-comparison-detail numeric ${comparison.timed ? 'recap-comparison-timed' : ''}`}
                        >
                          <dl className="recap-best-sets">
                            <div>
                              <dt>Best set</dt>
                              <dd className="font-semibold text-primary">
                                {comparison.current === null
                                  ? '—'
                                  : showSet(comparison.current, comparison.timed, units)}
                              </dd>
                            </div>
                            <div>
                              <dt>Previous</dt>
                              <dd className="text-secondary">
                                {comparison.previous === null
                                  ? 'First session'
                                  : showSet(comparison.previous, comparison.timed, units)}
                              </dd>
                            </div>
                          </dl>
                          {!comparison.timed && (
                            <div className="recap-sparkline">
                              <ExerciseWeightChart
                                points={points}
                                unitSystem={units}
                                cardio={false}
                                compact
                              />
                            </div>
                          )}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              {strength && (
                <dl className="recap-comparison-totals numeric mt-3 grid grid-cols-4 rounded-control border border-subtle py-3">
                  <SummaryFact
                    icon={<DumbbellIcon />}
                    label="Exercises"
                    value={String(recap.exercises)}
                  />
                  <SummaryFact icon={<ClipboardIcon />} label="Sets" value={String(recap.sets)} />
                  <SummaryFact
                    icon={<ClockIcon />}
                    label="Minutes"
                    value={
                      recap.elapsedSeconds === null
                        ? '—'
                        : String(Math.round(recap.elapsedSeconds / 60))
                    }
                  />
                  <SummaryFact icon={<TrophyIcon />} label="PRs" value={String(records)} />
                </dl>
              )}
            </Panel>
          ),
        },
        {
          title: 'Exercise log',
          content: () => (
            <Panel title="Exercise log" className="recap-card">
              <SessionBody
                showSummary={false}
                startedAt={data.session.startedAt}
                bodyweightKg={data.session.bodyweightKg}
                unitSystem={units}
                blocks={data.blocks}
              />
            </Panel>
          ),
        },
      ]}
    />
  );
}

function Fact({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 text-xl leading-tight font-semibold text-primary">{value}</dd>
    </div>
  );
}
function SummaryFact({
  icon,
  label,
  value,
}: {
  readonly icon: ReactNode;
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1 border-r border-subtle px-1 last:border-0">
      <dt className="order-2 text-[11px] text-secondary">{label}</dt>
      <dd className="flex flex-col items-center gap-1 text-lg font-semibold text-primary">
        <span className="text-accent [&>svg]:size-5">{icon}</span>
        {value}
      </dd>
    </div>
  );
}
function showSet(mark: LiftMark, timed: boolean, units: UnitSystem): string {
  if (timed) return `${String(mark.reps)} sec`;
  return describePreviousSet(mark, (kg) => formatRecapWeight(kg, units));
}
