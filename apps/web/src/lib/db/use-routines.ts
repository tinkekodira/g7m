/**
 * Saved workouts, for the screens that show and start them.
 *
 * The repository is the door to the rows; this is the wiring — the reads the
 * screens share, and the one function that turns a routine into a workout in
 * progress.
 */
import { naturalLoadType, nextSetTemplate, type SetTemplate } from '@g7m/core';
import type { Routine, RoutineDetail, WorkoutSession } from '@g7m/db';
import { useCatalogue } from './use-catalogue.js';
import type { Repositories } from './repositories.js';

/** Every routine, most recently trained first. */
export function useRoutines() {
  return useCatalogue<readonly Routine[]>('routines', (r) => r.routines.list());
}

/** One routine and its movements, with the exercise names filled in. */
export interface RoutineView {
  readonly detail: RoutineDetail;
  /** Exercise id to display name, for the movements this routine holds. */
  readonly names: ReadonlyMap<string, string>;
}

export function useRoutine(routineId: string) {
  return useCatalogue<RoutineView | null>(`routine:${routineId}`, async (r) => {
    const detail = await r.routines.byId(routineId);
    if (detail === null) return null;

    const names = new Map<string, string>();
    for (const movement of detail.exercises) {
      const exercise = await r.exercises.byId(movement.exerciseId);
      names.set(movement.exerciseId, exercise?.name ?? 'Unknown exercise');
    }
    return { detail, names };
  });
}

/**
 * Start a workout from a routine.
 *
 * The routine says which movements, how many sets and what rep range. It does
 * **not** say what weight — that comes from the prefill engine reading what was
 * actually lifted last time, which is the same path a generated session and a
 * hand-built one take. A routine that stored its weights would still be
 * offering last January's numbers next January.
 *
 * `lastPerformance` excludes the session being built, so the sets written here
 * cannot become their own baseline.
 */
export async function startRoutineWorkout(
  repositories: Repositories,
  input: {
    readonly routine: RoutineDetail;
    readonly bodyweightKg: number | null;
    readonly now?: Date;
  },
): Promise<WorkoutSession> {
  const { routine, exercises } = {
    routine: input.routine.routine,
    exercises: input.routine.exercises,
  };

  const session = await repositories.sessions.start({
    source: 'routine',
    routineId: routine.id,
    name: routine.name,
    bodyweightKg: input.bodyweightKg,
  });

  for (const movement of exercises) {
    const slot = await repositories.sessions.addExercise(session.id, movement.exerciseId);

    const [previous, equipment] = await Promise.all([
      repositories.sessions.lastPerformance(movement.exerciseId, session.id),
      repositories.exercises.equipmentFor(movement.exerciseId),
    ]);
    const loadType = naturalLoadType(equipment.map((item) => item.category));

    // Built one at a time through the same prefill the logger uses, so an
    // ascending scheme comes back ascending rather than flattened to one
    // weight repeated `targetSets` times.
    const written: SetTemplate[] = [];
    for (let index = 0; index < movement.targetSets; index++) {
      const template = nextSetTemplate({
        current: written,
        previous,
        repLow: movement.targetRepLow,
        loadType,
      });
      await repositories.sessions.addSet(slot.id, {
        weightKg: template.weightKg,
        reps: template.reps,
        loadType: template.loadType,
        setType: 'working',
      });
      written.push(template);
    }
  }

  // What orders the routines list, so the one trained today is the one offered
  // first tomorrow.
  await repositories.routines.markPerformed(routine.id, input.now ?? new Date());

  return session;
}
