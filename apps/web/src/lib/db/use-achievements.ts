/**
 * Every achievement, worked out from this device's copy of the training log.
 *
 * One read for the Achievements screen, the Profile button and the banner
 * that celebrates new ones, so all three always agree. It re-runs after every
 * write — a set ticked mid-workout included — which is what lets a 100 kg
 * bench be celebrated at the bench rather than on the way home. ADR-0072.
 */
import {
  CLUB_LIFT_SLUGS,
  DEFAULT_WEEK_START,
  achievements,
  type Achievement,
  type ClubLift,
  type UnitSystem,
  type WeekStart,
} from '@g7m/core';
import { useCatalogue, type QueryState } from './use-catalogue.js';
import type { Repositories } from './repositories.js';

export interface AchievementsData {
  readonly list: readonly Achievement[];
  /** Keys already celebrated, on this device or another. */
  readonly seen: readonly string[];
  readonly unitSystem: UnitSystem;
  /**
   * Whether this device has its profile yet.
   *
   * The profile arrives in the same sync as the training log, so before it is
   * here the log may be too — and a banner for "your first workout" to
   * somebody with two hundred of them, still downloading, is the one mistake
   * worth waiting to avoid.
   */
  readonly ready: boolean;
}

export async function loadAchievements(r: Repositories, now: Date): Promise<AchievementsData> {
  const slugs = Object.values(CLUB_LIFT_SLUGS).flat();
  const [profile, summaries, sets, bouts, groups, goals, ids, metrics] = await Promise.all([
    r.profile.current(),
    r.history.sessionSummaries(null, { includeOpen: true }),
    r.history.completedSets({ includeOpen: true }),
    r.history.completedBouts({ includeOpen: true }),
    r.history.groupsByExercise(),
    r.goals.history(1000),
    r.exercises.idsBySlug(slugs),
    r.bodyMetrics.current(),
  ]);

  const lifts = new Map<string, ClubLift>();
  for (const [lift, liftSlugs] of Object.entries(CLUB_LIFT_SLUGS) as [ClubLift, string[]][]) {
    for (const slug of liftSlugs) {
      const id = ids.get(slug);
      if (id !== undefined) lifts.set(id, lift);
    }
  }

  const unitSystem = profile?.unitSystem ?? 'metric';
  const list = achievements(
    {
      sessions: summaries.map((summary) => ({
        sessionId: summary.sessionId,
        startedAt: summary.startedAt,
        firstSetAt: summary.firstSetAt,
        lastSetAt: summary.lastSetAt,
        finished: summary.endedAt !== null,
        clockKnown: summary.source !== 'past',
      })),
      sets,
      bouts,
      lifts,
      groups,
      goals,
      birthDate: profile?.birthDate ?? null,
      bodyweightKg: metrics?.weightKg ?? profile?.bodyweightKg ?? null,
      unitSystem,
      weekStartsOn: (profile?.weekStartsOn ?? DEFAULT_WEEK_START) as WeekStart,
    },
    now,
  );

  return { list, seen: profile?.achievementsSeen ?? [], unitSystem, ready: profile !== null };
}

export function useAchievements(): QueryState<AchievementsData> {
  // The time is taken at each read rather than at mount, so a banner judged
  // "just now" is judged against now, and a screen left open overnight rolls
  // over to the new week.
  return useCatalogue('achievements', (r) => loadAchievements(r, new Date()));
}
