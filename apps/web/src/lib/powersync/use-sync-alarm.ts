/**
 * The two things about sync worth interrupting somebody for.
 *
 * The sync panel used to sit on Home, and moving it to Settings would have
 * moved its two alarms somewhere nobody looks — which is the one place they
 * must never be. So the panel moved and the alarms did not: this hook is what
 * Home's banner and the Settings tab's dot both read, and the full story stays
 * on the Settings screen.
 *
 *   lost    writes the server refused for good. Data on this phone that will
 *           never reach anywhere else, which is the worst news the app has.
 *   error   sync is failing for a reason beyond "no signal" — a rejected
 *           login, a missing service. Nothing is lost yet; nothing is syncing.
 *
 * An ordinary offline spell is neither. `describeSyncError` already returns
 * null for it, so a phone in a basement shows no alarm, which is right.
 */
import { useMemo } from 'react';
import { describeDiscarded, describeSyncError, useSyncStore } from './sync-store.js';

export interface SyncAlarm {
  readonly lost: string | null;
  readonly error: string | null;
}

export function useSyncAlarm(): SyncAlarm {
  const discarded = useSyncStore((s) => s.discarded);
  const connectionError = useSyncStore((s) => s.connectionError);

  return useMemo(
    () => ({
      lost: describeDiscarded(discarded),
      error: describeSyncError(connectionError ?? undefined),
    }),
    [discarded, connectionError],
  );
}

/** Whether there is anything at all to raise. */
export function isAlarming(alarm: SyncAlarm): boolean {
  return alarm.lost !== null || alarm.error !== null;
}
