import type { Repositories } from './repositories.js';
import { RECOMMENDATION_POLICY, type RecommendationInput } from '@g7m/core';

/** Bounded history and a fixed number of local queries, independent of catalogue size. */
export async function loadWorkoutRecommendations(
  r: Repositories,
): Promise<Omit<RecommendationInput, 'eligibleIds'> | null> {
  const [session, profile] = await Promise.all([r.sessions.active(), r.profile.current()]);
  if (
    session === null ||
    session.source === 'past' ||
    profile === null ||
    profile.workoutRecommendations === false
  )
    return null;
  const now = new Date();
  const [catalogue, equipment, entries, sets, history, goal] = await Promise.all([
    r.exercises.list(),
    r.exercises.equipmentByExercise(),
    r.sessions.exercisesFor(session.id),
    r.sessions.setsForSession(session.id),
    r.history.completedSets({
      from: new Date(now.getTime() - RECOMMENDATION_POLICY.patternDays * 86_400_000),
      to: now,
    }),
    r.goals.current(),
  ]);
  const strength = new Set(catalogue.filter((e) => e.cardioKind === null).map((e) => e.id));
  const favourites = new Set(profile?.favouriteExercises ?? []);
  return {
    sessionId: session.id,
    now,
    experience: profile?.experienceLevel ?? null,
    goal: goal?.goal ?? 'build_muscle',
    catalogue: catalogue
      .filter((e) => strength.has(e.id))
      .map((e) => ({
        id: e.id,
        slug: e.slug,
        equipment: equipment.get(e.id) ?? [],
        favourite: favourites.has(e.slug),
        order: e.popularityRank,
      })),
    blocks: entries
      .filter((e) => strength.has(e.exerciseId))
      .map((e) => ({
        exerciseId: e.exerciseId,
        sets: sets.filter((s) => s.sessionExerciseId === e.id),
      })),
    history,
  };
}
