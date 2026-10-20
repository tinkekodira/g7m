import {
  buildWorkoutRecap,
  exerciseWeightProgress,
  workoutRecapRewards,
  workoutTitle,
  CLUB_LIFT_SLUGS,
  DEFAULT_WEEK_START,
  type ClubLift,
  type WeekStart,
} from '@g7m/core';
import type { Repositories } from './repositories.js';

export async function loadWorkoutRecap(r: Repositories, sessionId: string) {
  const session = await r.sessions.byId(sessionId);
  if (session?.endedAt == null) return null;
  const entries = await r.sessions.exercisesFor(sessionId);
  const [
    profile,
    sets,
    catalogue,
    work,
    history,
    summaries,
    bouts,
    groups,
    goals,
    ids,
    muscleGroups,
    muscles,
    shares,
  ] = await Promise.all([
    r.profile.current(),
    r.sessions.setsForSession(sessionId),
    r.exercises.byIds(entries.map((e) => e.exerciseId)),
    r.history.primaryWork(sessionId),
    r.history.completedSets(),
    r.history.sessionSummaries(null),
    r.history.completedBouts(),
    r.history.groupsByExercise(),
    r.goals.history(1000),
    r.exercises.idsBySlug(Object.values(CLUB_LIFT_SLUGS).flat()),
    r.muscles.groups(),
    r.muscles.list(),
    r.history.muscleShares(),
  ]);
  const exercises = new Map(catalogue.map((e) => [e.id, e]));
  const blocks = entries.map((entry) => ({
    entry,
    exercise: exercises.get(entry.exerciseId) ?? null,
    sets: sets.filter((s) => s.sessionExerciseId === entry.id),
  }));
  const primaryWork = work.get(sessionId) ?? [];
  const title =
    session.name ??
    workoutTitle(
      primaryWork,
      blocks
        .filter((b) => b.exercise?.cardioKind != null)
        .reduce((n, b) => n + b.sets.filter((s) => s.isCompleted).length, 0),
    );
  const recap = buildWorkoutRecap({
    sessionId,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    backdated: session.source === 'past',
    bodyweightKg: session.bodyweightKg,
    history,
    work: primaryWork,
    blocks: blocks.map((b) => ({
      exerciseId: b.entry.exerciseId,
      isTimeBased: b.exercise?.isTimeBased ?? false,
      cardioKind: b.exercise?.cardioKind ?? null,
      sets: b.sets,
    })),
  });
  // Session-only highlighting includes assisting muscles, independent of load
  // and bodyweight availability. Uncompleted work and warm-ups never light it.
  const trainedIds = new Set(
    blocks
      .filter(
        (b) =>
          b.exercise?.cardioKind == null &&
          b.sets.some((s) => s.isCompleted && s.setType !== 'warmup'),
      )
      .flatMap((b) =>
        (shares.get(b.entry.exerciseId) ?? [])
          .filter((share) => share.recruitmentWeight > 0)
          .map((share) => share.muscleId),
      ),
  );
  const trainedMuscles = muscles.filter((m) => m.isSelectable && trainedIds.has(m.id));
  const weightProgress = exerciseWeightProgress(
    history.filter((s) => s.sessionId === sessionId || s.performedAt < session.startedAt),
  );
  const lifts = new Map<string, ClubLift>();
  for (const [lift, slugs] of Object.entries(CLUB_LIFT_SLUGS) as [ClubLift, string[]][])
    for (const slug of slugs) {
      const id = ids.get(slug);
      if (id !== undefined) lifts.set(id, lift);
    }
  const rewards = workoutRecapRewards({
    sessionId,
    sets: history,
    bouts,
    groups,
    goals,
    lifts,
    sessions: summaries.map((s) => ({
      sessionId: s.sessionId,
      startedAt: s.startedAt,
      firstSetAt: s.firstSetAt,
      lastSetAt: s.lastSetAt,
      finished: s.endedAt !== null,
      loggedAt: s.createdAt,
      backdated: s.source === 'past',
      clockKnown: s.source !== 'past',
    })),
    birthDate: profile?.birthDate ?? null,
    bodyweightKg: session.bodyweightKg ?? profile?.bodyweightKg ?? null,
    unitSystem: profile?.unitSystem ?? 'metric',
    weekStartsOn: (profile?.weekStartsOn ?? DEFAULT_WEEK_START) as WeekStart,
  });
  return {
    session,
    profile,
    blocks,
    title,
    recap,
    rewards,
    exercises,
    weightProgress,
    trainedMuscles,
    muscleNames: new Map(muscleGroups.map((g) => [g.slug, g.name])),
  };
}
