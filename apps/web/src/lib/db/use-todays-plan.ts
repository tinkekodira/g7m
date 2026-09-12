/**
 * Today's generated session, for every screen that shows it.
 *
 * Two screens do: Home puts it at the top as "Today's workout", and the plan
 * screen lays it out in full with a reason for every number. They must never
 * disagree — a card promising an upper-body day that opens on a leg day is the
 * app contradicting itself one tap apart — so both read this, and the plan is
 * built in exactly one place.
 *
 * The generator itself is pure (`planSession` in core). This is the wiring:
 * which goal, which week, which history, read from this device.
 */
import { useMemo } from 'react';
import {
  chooseFocus,
  FOCUS_LABELS,
  planSession,
  prescriptionFor,
  splitFor,
  startOfDay,
  type PlannedExercise,
  type PlannedSession,
  type UnitSystem,
} from '@g7m/core';
import type { Goal, Profile, WorkoutSession } from '@g7m/db';
import { useCatalogue } from './use-catalogue.js';
import type { Repositories } from './repositories.js';

/**
 * The window the weekly targets are measured over.
 *
 * A trailing seven days, not the calendar week. A calendar week resets to zero
 * on a Monday morning regardless of what happened on Sunday, so somebody
 * training Saturday and Sunday would be offered a third chest session on the
 * Monday — the counter having forgotten two days of training that their chest
 * has not. A muscle does not know what day it is; it knows it was trained
 * thirty-six hours ago.
 */
const TRAILING_DAYS = 7;

/** Far past the layoff and plateau windows the generator can ask about. */
const HISTORY_DAYS = 120;

export interface TodaysPlan {
  readonly profile: Profile | null;
  readonly goal: Goal | null;
  /** Read, and there is no goal. Different from not having read it yet. */
  readonly noGoal: boolean;
  /** Every input has arrived, so `plan` is the answer rather than a gap. */
  readonly ready: boolean;
  readonly plan: PlannedSession | null;
  readonly unitSystem: UnitSystem;
  readonly error: string | null;
}

export function useTodaysPlan(now: Date): TodaysPlan {
  const profile = useCatalogue('profile', (r) => r.profile.current());
  const goal = useCatalogue('goal-current', (r) => r.goals.current());

  // Anchored to the start of today so the keys are stable for the day rather
  // than changing every render and re-querying forever.
  const today = useMemo(() => startOfDay(now), [now]);
  const trailingWeek = useMemo(() => daysBefore(today, TRAILING_DAYS), [today]);
  const historyFrom = useMemo(() => daysBefore(today, HISTORY_DAYS), [today]);
  const dayKey = today.toISOString();

  const catalogue = useCatalogue('plan-candidates', (r) => r.planner.candidates());
  const performances = useCatalogue(`plan-history-${dayKey}`, (r) =>
    r.planner.lastPerformances(historyFrom),
  );
  const weekSets = useCatalogue(`plan-trailing-${dayKey}`, (r) =>
    r.planner.setsByGroupSince(trailingWeek),
  );

  const plan = useMemo<PlannedSession | null>(() => {
    if (
      goal.data === null ||
      catalogue.data === null ||
      performances.data === null ||
      weekSets.data === null
    ) {
      return null;
    }

    const experience = profile.data?.experienceLevel ?? null;
    const prescription = prescriptionFor(goal.data.goal, experience);
    const split = splitFor(goal.data.daysPerWeek, experience);

    return planSession({
      // Which day of the split has the most catching up to do, rather than
      // the next one along. A workout opened and abandoned logs no sets and
      // therefore moves nothing, which a session counter could not manage.
      focus: chooseFocus(split, weekSets.data, prescription.weeklySetsPerGroup),
      prescription,
      catalogue: catalogue.data,
      history: performances.data,
      setsThisWeekByGroup: weekSets.data,
      now,
    });
  }, [goal.data, catalogue.data, performances.data, weekSets.data, profile.data, now]);

  return {
    profile: profile.data,
    goal: goal.data,
    noGoal: goal.data === null && !goal.loading && goal.error === null,
    ready:
      goal.data !== null &&
      catalogue.data !== null &&
      performances.data !== null &&
      weekSets.data !== null,
    plan,
    unitSystem: profile.data?.unitSystem ?? 'metric',
    error: profile.error ?? goal.error ?? catalogue.error ?? performances.error ?? weekSets.error,
  };
}

/**
 * Start a generated session: the workout, its exercises, and their sets.
 *
 * The sets go in unticked, so the logger opens on a full workout rather than
 * an empty one. Nothing is locked — the logger can change every number, and
 * does not know or care that a generator wrote them.
 */
export async function startPlannedWorkout(
  repositories: Repositories,
  input: {
    readonly plan: PlannedSession;
    /** What is actually being prescribed, after any swaps on the plan screen. */
    readonly exercises: readonly PlannedExercise[];
    readonly bodyweightKg: number | null;
  },
): Promise<WorkoutSession> {
  const session = await repositories.sessions.start({
    source: 'generated',
    name: FOCUS_LABELS[input.plan.focus],
    bodyweightKg: input.bodyweightKg,
  });

  for (const exercise of input.exercises) {
    const slot = await repositories.sessions.addExercise(session.id, exercise.exerciseId);
    for (let index = 0; index < exercise.sets; index++) {
      await repositories.sessions.addSet(slot.id, {
        weightKg: exercise.suggestedKg ?? 0,
        reps: exercise.repLow,
        loadType: exercise.loadType,
        setType: 'working',
      });
    }
  }

  return session;
}

/** `days` before a date, kept out of the hook so the memo stays readable. */
function daysBefore(from: Date, days: number): Date {
  const at = new Date(from);
  at.setDate(at.getDate() - days);
  return at;
}
