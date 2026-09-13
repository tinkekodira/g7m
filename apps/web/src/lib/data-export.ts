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

  const file = new File([JSON.stringify(document, null, 2)], exportFileName(now), {
    type: 'application/json',
  });

  return {
    file,
    contents: describeExportContents({
      workouts: data.tables.workout_sessions.length,
      sets: data.tables.session_sets.length,
      weighIns: data.tables.body_metrics.filter((row) => row['weight_kg'] !== null).length,
    }),
    caveat: describeExportCaveat({
      syncConfigured: isSyncConfigured(),
      hasSynced: database.currentStatus.hasSynced === true,
    }),
  };
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
