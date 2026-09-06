/**
 * Sync, as something the user can see.
 *
 * An offline-first app spends most of its life in states that look identical
 * from the outside: everything saved and uploaded, everything saved and
 * queued, and everything saved but permanently rejected. The first two are
 * fine. The third is data the lifter believes they have and does not.
 *
 * So this store exists to make the difference visible, and it is deliberately
 * more interested in what went wrong than in what went right.
 */
import { create } from 'zustand';
import type { DiscardedWrite } from '@g7m/db';
import { connectSync, disconnectSync, isSyncConfigured, openDatabase } from './database.js';

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

interface SyncStore {
  readonly phase: SyncPhase;
  /** True while rows are moving in either direction. */
  readonly busy: boolean;
  readonly lastSyncedAt: Date | null;
  /**
   * Writes that can never succeed and were dropped so the queue could drain.
   *
   * Each one, unless it was already on the server, is a row that exists on this
   * device and never will anywhere else. Kept in memory rather than merely
   * logged, because the point is to say so.
   */
  readonly discarded: readonly DiscardedWrite[];
  /** The most recent upload summary, in words. */
  readonly lastMessage: string | null;

  /** Open the database and start syncing. Returns an unsubscribe function. */
  start: () => Promise<() => void>;
  stop: () => Promise<void>;
  dismissDiscarded: () => void;
}

export const useSyncStore = create<SyncStore>((set, get) => ({
  phase: isSyncConfigured() ? 'idle' : 'unconfigured',
  busy: false,
  lastSyncedAt: null,
  discarded: [],
  lastMessage: null,

  start: async () => {
    if (!isSyncConfigured()) {
      // Still open the database: the app is usable offline whether or not a
      // sync instance exists, and refusing to would make a missing environment
      // variable look like a broken app.
      await openDatabase();
      set({ phase: 'unconfigured' });
      return () => undefined;
    }

    set({ phase: 'connecting' });
    const database = await openDatabase();

    const listener = database.registerListener({
      statusChanged: (status) => {
        set({
          phase: status.connected ? 'synced' : status.connecting ? 'connecting' : 'offline',
          busy: status.downloading || status.uploading,
          lastSyncedAt: status.lastSyncedAt ?? get().lastSyncedAt,
        });
      },
    });

    await connectSync({
      onDiscarded: (entry) => {
        set((state) => ({ discarded: [...state.discarded, entry] }));
      },
      onUploaded: (summary) => {
        set({ lastMessage: summary });
      },
    });

    return listener;
  },

  stop: async () => {
    await disconnectSync();
    set({ phase: 'offline', busy: false });
  },

  dismissDiscarded: () => {
    set({ discarded: [] });
  },
}));

/** What to tell the user, in their terms rather than the protocol's. */
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
 * duplicate, which means it had already succeeded.
 */
export function describeDiscarded(discarded: readonly DiscardedWrite[]): string | null {
  const lost = discarded.filter((entry) => !entry.alreadyApplied);
  if (lost.length === 0) return null;

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
