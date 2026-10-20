import {
  describePreviousSet,
  formatDuration,
  regionOf,
  type LiftMark,
  type ExerciseWeightPoint,
  type UnitSystem,
} from '@g7m/core';
import type { loadWorkoutRecap } from '../lib/db/workout-recap.js';
import { RecapCarousel } from './RecapCarousel.js';
import { WorkoutMuscleBody } from './WorkoutMuscleBody.js';
import { ExerciseWeightChart } from './ExerciseWeightChart.js';
import { SessionBody } from './SessionBody.js';
import { Panel } from './Panel.js';
import { formatWeightExact, formatWeightTotal } from './chart-scale.js';
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
              className="recap-card"
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
              <dl className="recap-totals numeric mt-5 grid grid-cols-2 gap-x-5 gap-y-4">
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
              {recap.elapsedSeconds !== null && recap.trainingMinutes !== null && (
                <p className="mt-4 text-xs text-muted">
                  Workout time runs from start to finish. Logged training:{' '}
                  {formatDuration(recap.trainingMinutes * 60)}, spanning your completed work.
                </p>
              )}
              {(rewards.xp > 0 || rewards.achievements.length > 0) && (
                <section
                  aria-label="Earned this session"
                  className="mt-5 border-t border-subtle pt-4"
                >
                  <h3 className="text-sm font-semibold text-primary">
                    Earned this session{' '}
                    <span className="numeric text-accent">+{rewards.xp} XP</span>
                  </h3>
                  {rewards.levelAfter > rewards.levelBefore && (
                    <p className="mt-2 text-sm font-medium text-primary">
                      Level {rewards.levelBefore} → Level {rewards.levelAfter}
                    </p>
                  )}
                  {rewards.achievements.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {rewards.achievements.map((a) => (
                        <li key={a.key}>
                          <p className="text-sm font-medium text-primary">{a.name}</p>
                          <p className="text-xs text-muted">{a.description}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-3 text-xs text-muted">
                    Includes applicable workout, set, record and milestone rewards.
                  </p>
                </section>
              )}
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
              <p className="mt-1 text-xs text-muted">
                The model highlights primary and assisting muscles from this session. Percentages
                show working sets across primary muscle groups.
              </p>
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
              <p className="mt-3 text-xs text-muted">
                Shared sets are split between primary movers. This shows what you logged, not
                measured muscle stimulus.
              </p>
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
              <ul className="mt-3 divide-y divide-subtle">
                {recap.comparisons.map((comparison) => {
                  const exercise = data.exercises.get(comparison.exerciseId);
                  const points = data.weightProgress.get(comparison.exerciseId) ?? [];
                  return (
                    <li key={comparison.exerciseId} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <p className="text-sm font-medium text-primary">
                          {exercise?.name ?? 'Exercise'}
                        </p>
                        {comparison.records.length > 0 && (
                          <span className="text-xs font-semibold text-accent">
                            {comparison.records.some((r) => r.kind === 'heaviest')
                              ? 'Heaviest yet'
                              : 'Best estimated 1RM'}
                          </span>
                        )}
                      </div>
                      {!comparison.timed && (
                        <div className="recap-weight-history mt-3">
                          <ExerciseWeightChart points={points} unitSystem={units} cardio={false} />
                          <p className="mt-1 text-xs text-secondary">
                            {weightChange(points, units)}
                          </p>
                        </div>
                      )}
                      <div className="numeric mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                        {comparison.current !== null && (
                          <p className="text-primary">
                            This session: {showSet(comparison.current, comparison.timed, units)}
                          </p>
                        )}
                        <p className="text-muted">
                          {comparison.previous === null
                            ? 'First logged session'
                            : `Previous: ${showSet(comparison.previous, comparison.timed, units)}`}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 text-xs text-muted">
                Best logged weight over up to six workouts, oldest to newest, ending here. BW:
                bodyweight; +: added load; &minus;: assistance. Sets compare weight and reps or
                duration.
              </p>
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
function weightChange(points: readonly ExerciseWeightPoint[], units: UnitSystem): string {
  const latest = points.at(-1);
  const previous = points.at(-2);
  if (latest === undefined || previous === undefined) return '';
  if (latest.loadType !== previous.loadType) return 'Load type changed';
  const delta = latest.weightKg - previous.weightKg;
  if (delta === 0) return 'Same logged weight as last time';
  const weight = formatWeightExact(Math.abs(delta), units);
  if (latest.loadType === 'assisted') return `${weight} ${delta > 0 ? 'less' : 'more'} assistance`;
  return `${delta > 0 ? 'Up' : 'Down'} ${weight} from last time`;
}
function showSet(mark: LiftMark, timed: boolean, units: UnitSystem): string {
  if (timed) return `${String(mark.reps)} sec`;
  return describePreviousSet(mark, (kg) => formatWeightExact(kg, units));
}
