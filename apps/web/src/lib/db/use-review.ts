/**
 * The training review, assembled once and shared by every screen that shows it.
 *
 * Two screens want this — the progress screen shows it in full, the home screen
 * shows the headline — and each running its own six queries would be six extra
 * reads on the screen that opens first. One hook, one key, and `useCatalogue`
 * does the rest.
 */
import { useMemo } from 'react';
import {
  DEFAULT_WEEK_START,
  REVIEW_WEEKS,
  reviewTraining,
  startOfDay,
  type Review,
  type UnitSystem,
  type WeekStart,
} from '@g7m/core';
import { useCatalogue, type QueryState } from './use-catalogue.js';

export interface TrainingReview {
  /** Null until a goal is chosen — there is nothing to measure against. */
  readonly review: Review | null;
  readonly unitSystem: UnitSystem;
  readonly weekStartsOn: WeekStart;
}

export function useTrainingReview(now: Date): QueryState<TrainingReview> {
  // Anchored to the start of today, so the key is stable for the day rather
  // than changing every render and re-querying forever.
  const today = useMemo(() => startOfDay(now).toISOString(), [now]);

  return useCatalogue(`training-review-${today}`, async (repositories) => {
    const [profile, goal] = await Promise.all([
      repositories.profile.current(),
      repositories.goals.current(),
    ]);

    const unitSystem: UnitSystem = profile?.unitSystem ?? 'metric';
    const weekStartsOn = (profile?.weekStartsOn ?? DEFAULT_WEEK_START) as WeekStart;

    if (goal === null) return { review: null, unitSystem, weekStartsOn };

    /*
     * The window is the last six weeks, or since the goal was set if that is
     * more recent.
     *
     * Not the whole life of the goal: a cut that has run five months is
     * reviewed on what is happening now, and averaging that against February
     * would hide a month of not training under a good start.
     */
    const window = startOfDay(now);
    window.setDate(window.getDate() - REVIEW_WEEKS * 7);
    const from = goal.startedAt > window ? goal.startedAt : window;

    const [sets, groupsByExercise, trained, weighIns] = await Promise.all([
      repositories.history.completedSets({ from }),
      repositories.history.groupsByExercise(),
      repositories.history.trainedExercises(),
      repositories.bodyMetrics.between({ from }),
    ]);

    return {
      unitSystem,
      weekStartsOn,
      review: reviewTraining({
        goal: goal.goal,
        daysPerWeek: goal.daysPerWeek,
        experienceLevel: profile?.experienceLevel ?? null,
        sex: profile?.sex ?? null,
        sets,
        groupsByExercise,
        exerciseNames: new Map(trained.map((entry) => [entry.exerciseId, entry.name])),
        weighIns: weighIns
          .filter((entry): entry is typeof entry & { weightKg: number } => entry.weightKg !== null)
          .map((entry) => ({ at: entry.recordedAt, weightKg: entry.weightKg })),
        now,
      }),
    };
  });
}
