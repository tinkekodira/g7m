import { formatDate, t } from '@g7m/i18n';
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
import { PastTimeButton } from './PastTimeSheet.js';
import { givenPastTime, pastTimeable } from '../lib/past-time.js';
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
  const timeable = pastTimeable(data.session.source, recap.sets, recap.cardioSeconds);
  return (
    <RecapCarousel
      cards={[
        {
          title: t().history.recap.session,
          content: () => (
            <Panel
              title={t().history.recap.session}
              tone="hero"
              className="recap-card recap-session"
              aside={
                records > 0 ? (
                  <span className="text-sm font-semibold text-accent">
                    {t().history.recap.prs(records)}
                  </span>
                ) : undefined
              }
            >
              <p className="mt-1 text-sm break-words text-secondary">{data.title}</p>
              <p className="mt-1 text-xs text-muted">
                {formatDate(data.session.startedAt, {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
                {data.session.source === 'past' ? t().history.recap.loggedAfterwards : ''}
              </p>
              <dl className="recap-totals numeric grid grid-cols-2">
                <Fact
                  label={t().history.recap.workoutTime}
                  value={
                    recap.elapsedSeconds === null
                      ? t().history.recap.notRecorded
                      : formatDuration(recap.elapsedSeconds)
                  }
                />
                <Fact label={t().history.recap.exercises} value={String(recap.exercises)} />
                <Fact label={t().history.recap.workingSets} value={String(recap.sets)} />
                <Fact
                  label={t().history.recap.liftedVolume}
                  value={formatWeightTotal(recap.volume.volumeKg, units)}
                />
                {recap.cardioSeconds > 0 && (
                  <Fact
                    label={t().history.recap.cardioTime}
                    value={formatDuration(recap.cardioSeconds)}
                  />
                )}
                {recap.cardioKcal > 0 && (
                  <Fact
                    label={t().history.recap.cardioCalories}
                    value={`${String(Math.round(recap.cardioKcal))} kcal`}
                  />
                )}
              </dl>
              {timeable && (
                <PastTimeButton
                  sessionId={data.session.id}
                  day={data.session.startedAt}
                  given={givenPastTime(
                    data.session.startedAt,
                    data.session.endedAt,
                    recap.trainingMinutes,
                  )}
                />
              )}
              {recap.volume.unknownSets > 0 && (
                <p className="recap-volume-note text-xs text-muted">
                  {t().history.recap.excludes(recap.volume.unknownSets)}
                </p>
              )}
              <RecapRewards rewards={rewards} />
            </Panel>
          ),
        },
        {
          title: t().history.recap.muscles,
          content: (active) => (
            <Panel title={t().history.recap.muscles} className="recap-card recap-muscles">
              {active && (
                <WorkoutMuscleBody sex={data.profile?.sex ?? null} muscles={data.trainedMuscles} />
              )}
              {recap.muscles.length === 0 && (
                <p className="mt-4 text-sm text-secondary">{t().history.recap.noMuscles}</p>
              )}
              <ul
                className="recap-muscle-shares"
                aria-label={t().history.recap.percentages}
                tabIndex={0}
              >
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
          title: t().history.recap.compared,
          content: () => (
            <Panel title={t().history.recap.compared} className="recap-card">
              {!strength && (
                <p className="mt-4 text-sm text-secondary">{t().history.recap.noCompare}</p>
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
                              {exercise?.name ?? t().history.recap.exercise}
                            </h3>
                            <p className="mt-0.5 flex items-center gap-2 text-xs text-secondary">
                              {t().history.recap.sets(sets)}
                              {comparison.records.length > 0 && (
                                <span className="text-accent">
                                  <TrophyIcon className="size-3.5" />
                                  <span className="sr-only">
                                    {comparison.records.some((r) => r.kind === 'heaviest')
                                      ? t().history.recap.heaviestYet
                                      : t().history.recap.bestEstimate}
                                  </span>
                                </span>
                              )}
                            </p>
                          </div>
                          <ChevronRightIcon className="size-4 text-muted" />
                          <span className="recap-change numeric" data-direction={change.direction}>
                            {change.direction !== 0 && (
                              <span className="sr-only">
                                {change.direction > 0
                                  ? t().history.recap.up
                                  : t().history.recap.down}
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
                              <dt>{t().history.recap.bestSet}</dt>
                              <dd className="font-semibold text-primary">
                                {comparison.current === null
                                  ? '—'
                                  : showSet(comparison.current, comparison.timed, units)}
                              </dd>
                            </div>
                            <div>
                              <dt>{t().history.recap.previous}</dt>
                              <dd className="text-secondary">
                                {comparison.previous === null
                                  ? t().history.recap.firstSession
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
                    label={t().history.recap.exercises}
                    value={String(recap.exercises)}
                  />
                  <SummaryFact
                    icon={<ClipboardIcon />}
                    label={t().history.recap.sets2}
                    value={String(recap.sets)}
                  />
                  <SummaryFact
                    icon={<ClockIcon />}
                    label={t().history.recap.minutes}
                    value={
                      recap.elapsedSeconds === null
                        ? '—'
                        : String(Math.round(recap.elapsedSeconds / 60))
                    }
                  />
                  <SummaryFact
                    icon={<TrophyIcon />}
                    label={t().history.recap.prsLabel}
                    value={String(records)}
                  />
                </dl>
              )}
            </Panel>
          ),
        },
        {
          title: t().history.recap.log,
          content: () => (
            <Panel title={t().history.recap.log} className="recap-card">
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
      <dd
        data-wide={value.length > 6 || undefined}
        className="mt-1 text-xl leading-tight font-semibold text-primary"
      >
        {value}
      </dd>
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
        <span className="text-secondary [&>svg]:size-5">{icon}</span>
        {value}
      </dd>
    </div>
  );
}
function showSet(mark: LiftMark, timed: boolean, units: UnitSystem): string {
  if (timed) return t().history.recap.seconds(mark.reps);
  return describePreviousSet(mark, (kg) => formatRecapWeight(kg, units));
}
