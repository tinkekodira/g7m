import type { Repositories } from './repositories.js';
import { startRoutineWorkout } from './use-routines.js';

/** Recheck local state at the moment of creation, including after a dialog wait. */
export async function startWorkout(r: Repositories, routineId: string | null) {
  const active = await r.sessions.active();
  if (active !== null) return { session: active, blank: false };
  const profile = await r.profile.current();
  const bodyweightKg = profile?.bodyweightKg ?? null;
  if (routineId !== null) {
    const routine = await r.routines.byId(routineId);
    if (routine === null || routine.exercises.length === 0)
      throw new Error('This routine is no longer available or has no exercises.');
    return { session: await startRoutineWorkout(r, { routine, bodyweightKg }), blank: false };
  }
  return { session: await r.sessions.start({ bodyweightKg }), blank: true };
}
