import type { UnitSystem } from '@g7m/core';
import { readWeight } from '../../screens/edit-profile.js';
import { useWrite } from './use-catalogue.js';

/**
 * Logging a weight, wherever it is asked for: Profile's sheet and the Edit
 * screen's weight card. Resolves to what went wrong, or null once it is saved.
 */
export function useLogWeight(unitSystem: UnitSystem) {
  const { write, busy } = useWrite();

  async function log(text: string): Promise<string | null> {
    const read = readWeight(text, unitSystem);
    if ('problem' in read) return read.problem;
    const saved = await write(async (r) => {
      await r.bodyMetrics.record({ weightKg: read.value });
      // `profiles.bodyweight_kg` stays the current value the logger reads at
      // the start of a session, so a pull-up gets attributed real load. The
      // history is `body_metrics`; the working number is still there.
      await r.profile.update({ bodyweightKg: read.value });
      return true;
    });
    return saved === null ? 'That did not save. Try again.' : null;
  }

  return { log, busy };
}
