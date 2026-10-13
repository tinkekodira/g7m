/**
 * Home's numbers: this month so far against last month, read once a day.
 *
 * The arithmetic is `monthStats` in `@g7m/core`, tested there without a
 * database. This is the read: two months of sets, the workouts, and which
 * groups each exercise trains, keyed on the day so a re-render never re-reads
 * and a sync still does (`useCatalogue`).
 */
import { useMemo } from 'react';
import {
  monthStats,
  monthStatsSince,
  startOfDay,
  trainingMinutes,
  type MonthStats,
  type UnitSystem,
} from '@g7m/core';
import { useCatalogue, type QueryState } from './use-catalogue.js';

/**
 * How many workouts to read back.
 *
 * Two months, even for somebody training twice a day, with room to spare —
 * and a bound, so the first screen never reads years of history to draw one.
 */
const SESSIONS_READ = 200;

export interface TrainedToday {
  readonly minutes: number | null;
  readonly sets: number;
}

export interface HomeStats {
  readonly stats: MonthStats;
  /** False for somebody who has never finished a workout: Home shows the first step instead. */
  readonly hasHistory: boolean;
  /** The workout finished today, if there is one. The latest, if there are two. */
  readonly trainedToday: TrainedToday | null;
  readonly unitSystem: UnitSystem;
}

export function useMonthStats(now: Date): QueryState<HomeStats> {
  const today = useMemo(() => startOfDay(now).toISOString(), [now]);

  return useCatalogue(`month-stats-${today}`, async (repositories) => {
    const [profile, sessions, sets, groupsByExercise] = await Promise.all([
      repositories.profile.current(),
      repositories.history.sessionSummaries(SESSIONS_READ),
      repositories.history.completedSets({ from: monthStatsSince(now) }),
      repositories.history.groupsByExercise(),
    ]);

    const midnight = startOfDay(now).getTime();
    // Newest first, so the first one from today is the latest.
    const latestToday = sessions.find((session) => session.startedAt.getTime() >= midnight);

    return {
      stats: monthStats({ sessions, sets, groupsByExercise, now }),
      hasHistory: sessions.length > 0,
      trainedToday:
        latestToday === undefined
          ? null
          : {
              minutes: trainingMinutes([latestToday.firstSetAt, latestToday.lastSetAt]),
              sets: latestToday.setCount,
            },
      unitSystem: profile?.unitSystem ?? 'metric',
    };
  });
}
