/**
 * Sync, in words a person can act on.
 *
 * Deliberately a separate module from `sync-store.ts`, which reaches the
 * database and through it the validated environment. Keeping the wording here
 * means it can be tested without a configured Supabase project, a PowerSync
 * instance, or a browser — and these strings are the part most worth testing,
 * because an offline-first app spends its life in states that look identical
 * from the outside:
 *
 *   · everything saved and uploaded,
 *   · everything saved and queued,
 *   · everything saved and permanently rejected.
 *
 * The first two are fine. The third is data the lifter believes they have and
 * does not. Telling them apart in plain language is the whole job.
 */
import type { DiscardedWrite } from '@g7m/db';

export type SyncPhase =
  /** No PowerSync instance configured. The app still works, locally. */
  | 'unconfigured'
  /** Local database not opened yet. */
  | 'idle'
  /** Opening the local database, or establishing the connection. */
  | 'connecting'
  /** Connected, and the server has been reached at least once. */
  | 'synced'
  /** Working from the local copy. Writes are queued, not lost. */
  | 'offline';

/**
 * What to tell the user, in their terms rather than the protocol's.
 *
 * Offline is the normal state for this app rather than a failure — it is built
 * for basements — so the wording reassures instead of alarming. The data
 * genuinely is safe.
 */
export function describeSyncPhase(phase: SyncPhase, lastSyncedAt: Date | null): string {
  switch (phase) {
    case 'unconfigured':
      return 'Sync is not set up. Your workouts are saved on this device only.';
    case 'idle':
      return 'Not started.';
    case 'connecting':
      return 'Connecting…';
    case 'synced':
      return 'Up to date with the server.';
    case 'offline':
      return lastSyncedAt === null
        ? 'Working offline. Your workouts are saved here and will sync when you reconnect.'
        : `Working offline since ${lastSyncedAt.toLocaleTimeString()}. Everything is saved here and will sync when you reconnect.`;
  }
}

/**
 * The one message that is genuinely bad news.
 *
 * Returns null when nothing was lost — including when a write was rejected as a
 * duplicate, which means it had already succeeded and reporting it would alarm
 * someone about a row sitting safely on the server.
 */
export function describeDiscarded(discarded: readonly DiscardedWrite[]): string | null {
  const lost = discarded.filter((entry) => !entry.alreadyApplied);
  if (lost.length === 0) return null;

  // A policy refusal is almost always a missing `user_id` — our bug, not bad
  // data — and calling it "invalid" would send someone looking for something
  // wrong with their workout.
  const permissions = lost.filter((entry) => entry.permissionDenied).length;
  const detail =
    permissions === lost.length
      ? 'The server refused them. This is a bug — please report it.'
      : 'They were rejected as invalid and will not be retried.';

  return (
    `${String(lost.length)} change${lost.length === 1 ? '' : 's'} on this device could not be ` +
    `saved to the server. ${detail}`
  );
}
