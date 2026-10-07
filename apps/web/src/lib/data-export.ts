/**
 * Making the "Download your data" file.
 *
 * The rows come from the repository (`AccountRepository.exportData`), the
 * account from the sign-in, and what the device knows about sync from
 * PowerSync — then it is one JSON document, indented so it can be read in a
 * text editor as well as by a program. See ADR-0064.
 */
import type { User } from '@supabase/supabase-js';
import { buildAccountExport } from '@g7m/db';
import { getRepositories } from './db/repositories.js';
import { getDatabase, isSyncConfigured } from './powersync/database.js';
import { useSyncStore } from './powersync/sync-store.js';
import { exportFileName } from './save-file.js';
import { describeExportCaveat, describeExportContents } from './account-words.js';
import { fetchOverview } from './friends/api.js';

export interface PreparedExport {
  readonly file: File;
  /** What is in it, in words. */
  readonly contents: string;
  /** Why it might not be everything, when it might not. */
  readonly caveat: string | null;
}

export async function prepareExport(user: User): Promise<PreparedExport> {
  const repositories = await getRepositories(user.id);
  const data = await repositories.account.exportData();

  const database = getDatabase();
  const pendingChanges = (await database.getUploadQueueStats()).count;
  const lastSyncedAt = useSyncStore.getState().lastSyncedAt;
  const now = new Date();

  const document = buildAccountExport({
    data,
    account: {
      id: user.id,
      email: user.email ?? null,
      createdAt: user.created_at,
      signInMethods: signInMethods(user),
    },
    device: { pendingChanges, lastSyncedAt: lastSyncedAt?.toISOString() ?? null },
    exportedAt: now,
  });

  const friends = await friendsSection();
  const file = new File([JSON.stringify({ ...document, friends }, null, 2)], exportFileName(now), {
    type: 'application/json',
  });

  const caveats = [
    describeExportCaveat({
      syncConfigured: isSyncConfigured(),
      hasSynced: database.currentStatus.hasSynced === true,
    }),
    friends === null
      ? 'Your friend code and friends list need a connection, so they were left out.'
      : null,
  ].filter((caveat): caveat is string => caveat !== null);

  return {
    file,
    contents: describeExportContents({
      workouts: data.tables.workout_sessions.length,
      sets: data.tables.session_sets.length,
      weighIns: data.tables.body_metrics.filter((row) => row['weight_kg'] !== null).length,
    }),
    caveat: caveats.length === 0 ? null : caveats.join(' '),
  };
}

/**
 * Your friend code, whether you share, your friends and the requests waiting
 * for you — the one part of the file that is not on the device (ADR-0105),
 * so it is fetched, and left out with a word of explanation when it cannot
 * be. Their names only: what your friends logged is theirs to export.
 */
async function friendsSection(): Promise<Record<string, unknown> | null> {
  if (!globalThis.navigator.onLine) return null;
  try {
    const overview = await fetchOverview();
    return {
      friendCode: overview.me?.code ?? null,
      shareTrainingWithFriends: overview.me?.sharing ?? null,
      friends: overview.friends.map((friend) => ({
        name: friend.name,
        sharingWithYou: friend.sharing,
      })),
      requestsWaiting: overview.requests.map((request) => ({
        name: request.name,
        requestedAt: request.requestedAt.toISOString(),
      })),
    };
  } catch (cause: unknown) {
    console.warn('Could not add friends to the export.', cause);
    return null;
  }
}

/** `['google']`, `['email']` — how this account signs in, from what GoTrue recorded. */
function signInMethods(user: User): string[] {
  const providers: unknown = user.app_metadata.providers;
  if (Array.isArray(providers)) {
    return providers.filter((value): value is string => typeof value === 'string');
  }
  const provider: unknown = user.app_metadata.provider;
  return typeof provider === 'string' ? [provider] : [];
}
