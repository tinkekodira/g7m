/**
 * What the body has been trained with lately, and what it is missing.
 *
 * Learn's heat map asks this, and so does Profile, which puts the same body at
 * the top of somebody's statistics. One implementation, because two would
 * drift: a muscle hot on one screen and cold on the other is the app
 * contradicting itself about the same four weeks.
 */
import {
  DEFAULT_WEEK_START,
  prescriptionFor,
  recentWeeks,
  relativeVolume,
  startOfDay,
  suggestForNeglected,
  volumeByMuscle,
  type Suggestion,
} from '@g7m/core';
import { useCatalogue, type QueryState } from './use-catalogue.js';

/** Four weeks. Long enough to include a full training split, short enough to be current. */
export const HEATMAP_WEEKS = 4;

/**
 * Sessions before the app offers an opinion about what is missing.
 *
 * A cold shoulder after two workouts is not a gap in somebody's training, it
 * is a Tuesday.
 */
export const SESSIONS_BEFORE_ADVICE = 5;

/** How many of the hardest-worked muscles to name. */
const TOP_MUSCLES = 3;

export interface TrainingHeat {
  /** 0–1 per muscle slug, relative to the hardest-worked one. What the viewer colours by. */
  readonly intensity: ReadonlyMap<string, number>;
  /** Anything at all in the window. */
  readonly trained: boolean;
  /** The muscles that got the most work, hardest first, by name. */
  readonly top: readonly { readonly slug: string; readonly name: string }[];
}

/**
 * Volume per muscle over the last four weeks, keyed by slug for the viewer.
 *
 * `enabled` keeps it from running at all when nothing will draw it. It reads a
 * month of training and joins the whole `exercise_muscles` table, which is not
 * work to do for somebody who opened Learn to look at where their lats are.
 */
export function useTrainingHeat(now: Date, enabled: boolean): QueryState<TrainingHeat | null> {
  return useCatalogue(`heat:${String(enabled)}:${startOfDay(now).toISOString()}`, async (r) => {
    if (!enabled) return null;

    const weeks = recentWeeks(now, HEATMAP_WEEKS, DEFAULT_WEEK_START);
    const [sets, shares, muscles] = await Promise.all([
      r.history.completedSets({ from: weeks[0] ?? now }),
      r.history.muscleShares(),
      r.muscles.list(),
    ]);

    // The viewer knows muscles by slug; everything below it uses ids.
    const byId = new Map(muscles.map((muscle) => [muscle.id, muscle]));
    const relative = relativeVolume(volumeByMuscle(sets, shares));

    const intensity = new Map<string, number>();
    for (const [muscleId, value] of relative) {
      const muscle = byId.get(muscleId);
      if (muscle !== undefined) intensity.set(muscle.slug, value);
    }

    const top = [...relative]
      .sort((a, b) => b[1] - a[1])
      .flatMap(([muscleId]) => {
        const muscle = byId.get(muscleId);
        return muscle === undefined ? [] : [{ slug: muscle.slug, name: muscle.commonName }];
      })
      .slice(0, TOP_MUSCLES);

    return { intensity, trained: sets.length > 0, top };
  });
}

/**
 * What to do about the muscles the heat map shows cold.
 *
 * The map answers "what have I trained" and stops there, which leaves the more
 * useful half of the question — so what do I add — as an exercise for the
 * reader. Scored by the same function that picks tomorrow's session, so the
 * suggestion here and the exercise there agree.
 *
 * Null below five sessions, and when not enabled.
 */
export function useNeglected(
  now: Date,
  enabled: boolean,
): QueryState<readonly Suggestion[] | null> {
  return useCatalogue(`todo:${String(enabled)}:${startOfDay(now).toISOString()}`, async (r) => {
    if (!enabled) return null;

    const [profile, goal, sessions] = await Promise.all([
      r.profile.current(),
      r.goals.current(),
      r.history.sessionSummaries(SESSIONS_BEFORE_ADVICE + 1),
    ]);
    if (sessions.length < SESSIONS_BEFORE_ADVICE) return null;

    const since = startOfDay(now);
    since.setDate(since.getDate() - 7);

    const [catalogue, history, setsThisWeekByGroup] = await Promise.all([
      r.planner.candidates(),
      r.planner.lastPerformances(since),
      r.planner.setsByGroupSince(since),
    ]);

    const prescription = prescriptionFor(
      goal?.goal ?? 'build_muscle',
      profile?.experienceLevel ?? null,
    );

    return suggestForNeglected({
      catalogue,
      history,
      setsThisWeekByGroup,
      weeklyTarget: prescription.weeklySetsPerGroup,
      now,
    });
  });
}
