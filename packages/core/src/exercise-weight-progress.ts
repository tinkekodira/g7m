import { latestScopeOnly } from './lift-key.js';
import { countsTowardVolume, type LoadType } from './load.js';
import type { HistoricalSet } from './progress.js';

export interface ExerciseWeightPoint {
  readonly sessionId: string;
  readonly performedAt: Date;
  readonly loadType: LoadType;
  /** Logged load, excluding body mass: added weight positive, assistance negative. */
  readonly weightKg: number;
}

/**
 * The last six workouts per exercise, oldest first. The caller supplies only
 * finished workouts. Unlike effective-load trends, these show the number the
 * lifter logged: a bodyweight change must not look like adding plates.
 * Less assistance is a heavier set, so assistance is compared and plotted
 * below zero. Bodyweight alone is zero, even without a weigh-in snapshot.
 */
export function exerciseWeightProgress(
  sets: readonly HistoricalSet[],
): Map<string, ExerciseWeightPoint[]> {
  const exercises = new Map<string, Map<string, ExerciseWeightPoint>>();
  // One line per exercise, at the gym it was last done at: two gyms' machines
  // on one line would draw a drop that never happened (ADR-0179).
  for (const set of latestScopeOnly(sets)) {
    if (
      !countsTowardVolume(set) ||
      !Number.isFinite(set.reps) ||
      set.reps <= 0 ||
      !Number.isFinite(set.weightKg) ||
      set.weightKg < 0 ||
      !Number.isFinite(set.performedAt.getTime())
    )
      continue;

    const weightKg =
      set.loadType === 'bodyweight'
        ? 0
        : set.loadType === 'assisted'
          ? -set.weightKg
          : set.weightKg;
    let sessions = exercises.get(set.exerciseId);
    if (sessions === undefined) {
      sessions = new Map();
      exercises.set(set.exerciseId, sessions);
    }
    const previous = sessions.get(set.sessionId);
    if (previous === undefined || weightKg > previous.weightKg) {
      sessions.set(set.sessionId, {
        sessionId: set.sessionId,
        performedAt: set.performedAt,
        loadType: set.loadType,
        weightKg,
      });
    }
  }

  return new Map(
    [...exercises].map(([exerciseId, sessions]) => [
      exerciseId,
      [...sessions.values()]
        .sort(
          (a, b) =>
            a.performedAt.getTime() - b.performedAt.getTime() ||
            a.sessionId.localeCompare(b.sessionId),
        )
        .slice(-6),
    ]),
  );
}
