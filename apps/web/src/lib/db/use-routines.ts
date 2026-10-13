/**
 * Saved workouts, for the screens that show and start them.
 *
 * The repository is the door to the rows; this is the wiring — the reads the
 * screens share, and the one function that turns a routine into a workout in
 * progress.
 */
import { loadTypeForEquipment, nextSetTemplate, workoutUnits, type SetTemplate } from '@g7m/core';
import type { Routine, RoutineDetail, RoutineExercise, WorkoutSession } from '@g7m/db';
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
  const routine = input.routine.routine;

  const session = await repositories.sessions.start({
    source: 'routine',
    routineId: routine.id,
    name: routine.name,
    bodyweightKg: input.bodyweightKg,
  });
  await writeMovements(repositories, session.id, input.routine.exercises);

  // What orders the routines list, so the one trained today is the one offered
  // first tomorrow.
  await repositories.routines.markPerformed(routine.id, input.now ?? new Date());

  return session;
}

/** A movement as a workout is built from it, whoever's routine it is. */
type Movement = Pick<RoutineExercise, 'exerciseId' | 'targetSets' | 'targetRepLow' | 'supersetId'>;

/**
 * "Do this routine" on a friend's page (ADR-0117): their movements, sets and
 * rep ranges, your weights, by the same path as one of your own.
 *
 * `manual`, not `routine`: the routine is not yours, so there is no row of
 * yours for the session to point at or to mark as trained.
 */
export async function startFriendRoutineWorkout(
  repositories: Repositories,
  input: {
    readonly name: string;
    readonly movements: readonly Movement[];
    readonly bodyweightKg: number | null;
  },
): Promise<WorkoutSession> {
  const session = await repositories.sessions.start({
    source: 'manual',
    name: input.name,
    bodyweightKg: input.bodyweightKg,
  });
  await writeMovements(repositories, session.id, input.movements);
  return session;
}

async function writeMovements(
  repositories: Repositories,
  sessionId: string,
  movements: readonly Movement[],
): Promise<void> {
  // A routine's superset starts as a superset: its movements go in together,
  // sharing a new id of the session's own (ADR-0112).
  const slots: { movement: Movement; id: string }[] = [];
  for (const unit of workoutUnits(movements, (movement) => movement.supersetId)) {
    const members = unit.kind === 'single' ? [unit.item] : unit.members;
    const added = await repositories.sessions.addExercises(
      sessionId,
      members.map((movement) => movement.exerciseId),
      { superset: unit.kind === 'superset' },
    );
    for (const [index, movement] of members.entries()) {
      const entry = added[index];
      if (entry !== undefined) slots.push({ movement, id: entry.id });
    }
  }

  for (const { movement, id: slotId } of slots) {
    const [previous, equipment] = await Promise.all([
      repositories.sessions.lastPerformance(movement.exerciseId, sessionId),
      repositories.exercises.equipmentFor(movement.exerciseId),
    ]);
    const loadType = loadTypeForEquipment(equipment);

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
      await repositories.sessions.addSet(slotId, {
        weightKg: template.weightKg,
        reps: template.reps,
        loadType: template.loadType,
        setType: 'working',
      });
      written.push(template);
    }
  }
}
