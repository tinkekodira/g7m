import { t } from '@g7m/i18n';
import type { Repositories } from './repositories.js';
import { startRoutineWorkout } from './use-routines.js';

/**
 * Recheck local state at the moment of creation, including after a dialog wait.
 *
 * `gymId` is the gym chosen in the start dialog. Left out, the workout is at
 * wherever the lifter usually trains (`StartSessionInput.gymId`).
 */
export async function startWorkout(r: Repositories, routineId: string | null, gymId?: string) {
  const at = gymId === undefined ? {} : { gymId };
  const active = await r.sessions.active();
  if (active !== null) return { session: active, blank: false };
  const profile = await r.profile.current();
  const bodyweightKg = profile?.bodyweightKg ?? null;
  if (routineId !== null) {
    const routine = await r.routines.byId(routineId);
    if (routine === null || routine.exercises.length === 0)
      throw new Error(t().profile.data.routineGone);
    return {
      session: await startRoutineWorkout(r, { routine, bodyweightKg, ...at }),
      blank: false,
    };
  }
  return { session: await r.sessions.start({ bodyweightKg, ...at }), blank: true };
}
