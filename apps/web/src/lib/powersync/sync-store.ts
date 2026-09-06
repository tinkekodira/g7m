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
import type { SyncPhase } from './sync-messages.js';

/**
 * The wording lives in `sync-messages.ts`, which imports nothing.
 *
 * This module reaches the database and through it the validated environment, so
 * anything importing it needs a configured project — which the strings should
 * not. Re-exported here so call sites still have one import.
 */
export { describeDiscarded, describeSyncPhase, type SyncPhase } from './sync-messages.js';

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
