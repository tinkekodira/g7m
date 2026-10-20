import {
  describePreviousSet,
  formatDuration,
  regionOf,
  type LiftMark,
  type UnitSystem,
} from '@g7m/core';
import type { loadWorkoutRecap } from '../lib/db/workout-recap.js';
import { Panel } from './Panel.js';
import { formatWeightExact, formatWeightTotal } from './chart-scale.js';
import { muscleColorStyle } from './muscle-colors.js';

type RecapData = NonNullable<Awaited<ReturnType<typeof loadWorkoutRecap>>>;

/** Quiet totals, actual lift comparisons and one compact distribution. */
export function WorkoutRecap({ data }: { readonly data: RecapData }) {
  const { recap, rewards } = data;
  const units = data.profile?.unitSystem ?? 'metric';
  const records = recap.comparisons.reduce((sum, c) => sum + c.records.length, 0);
  const strength = recap.comparisons.length > 0;
  return (
    <>
      <Panel
        title="Your session"
        tone="hero"
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
          {recap.elapsedSeconds !== null && (
            <Fact label="Workout time" value={formatDuration(recap.elapsedSeconds)} />
          )}
          {recap.trainingMinutes !== null && (
            <Fact label="Logged training" value={formatDuration(recap.trainingMinutes * 60)} />
          )}
          <Fact label="Exercises" value={String(recap.exercises)} />
          {strength && <Fact label="Working sets" value={String(recap.sets)} />}
          {strength && (
            <Fact label="Lifted volume" value={formatWeightTotal(recap.volume.volumeKg, units)} />
          )}
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
            Workout time runs from start to finish. Logged training spans your completed work.
          </p>
        )}
      </Panel>

      {strength && (
        <Panel title="Compared with last time">
          <ul className="mt-3 divide-y divide-subtle">
            {recap.comparisons.map((comparison) => {
              const exercise = data.exercises.get(comparison.exerciseId);
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
                  <div className="numeric mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                    {comparison.current !== null && (
                      <p className="text-primary">
                        Today: {showSet(comparison.current, comparison.timed, units)}
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
            Best working sets of the same exercise. More weight and different reps can reflect a
            different training choice.
          </p>
        </Panel>
      )}

      {recap.muscles.length > 0 && (
        <Panel title="Muscles trained">
          <p className="mt-1 text-xs text-muted">
            Working-set distribution across primary muscle groups.
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
            Shared sets are split between primary movers. This shows what you logged, not measured
            muscle stimulus.
          </p>
        </Panel>
      )}

      {(rewards.xp > 0 || rewards.achievements.length > 0) && (
        <Panel
          title="Earned this session"
          aside={
            <span className="numeric text-lg font-semibold text-accent">+{rewards.xp} XP</span>
          }
        >
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
        </Panel>
      )}
    </>
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
function showSet(mark: LiftMark, timed: boolean, units: UnitSystem): string {
  if (timed) return `${String(mark.reps)} sec`;
  return describePreviousSet(mark, (kg) => formatWeightExact(kg, units));
}
