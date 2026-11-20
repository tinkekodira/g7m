/**
 * Where somebody trains, for the screens that ask. ADR-0178.
 *
 * `asking` is the one flag the pickers read: on only for somebody who has said
 * they train at more than one gym *and* has more than one to choose between.
 * With a single gym named there is nothing to choose, so nothing is shown.
 */
import type { Gym } from '@g7m/db';
import { useCatalogue, type QueryState } from './use-catalogue.js';

export interface GymsState {
  /** The switch in Settings. */
  readonly enabled: boolean;
  /** The gyms still in use, in the lifter's order. */
  readonly gyms: readonly Gym[];
  /** Where the last workout was, or the first gym. Null with no gyms. */
  readonly lastUsed: string | null;
  /** Whether a picker has anything to offer. */
  readonly asking: boolean;
}

export function useGyms(): QueryState<GymsState> {
  return useCatalogue('gyms', async (r) => {
    const [profile, gyms, lastUsed] = await Promise.all([
      r.profile.current(),
      r.gyms.list(),
      r.gyms.lastUsed(),
    ]);
    const enabled = profile?.multipleGyms ?? false;
    return { enabled, gyms, lastUsed, asking: enabled && gyms.length > 1 };
  });
}
