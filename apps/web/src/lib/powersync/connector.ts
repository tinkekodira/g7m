/**
 * The bridge between PowerSync and Supabase.
 *
 * PowerSync reads from Postgres directly, through a replication slot, but it
 * does not write. Local changes come back to this connector and go up through
 * PostgREST like any other request — which is what puts them back under row
 * level security. Downloads bypass RLS and are gated by the sync rules; uploads
 * do not and are gated by RLS. Both halves are enforced, by different things,
 * and it is worth knowing which is which when something is refused.
 *
 * The decisions this file does not make live in `@g7m/db`: what a queued change
 * means as a write, and whether a failure is worth retrying. Both are pure and
 * tested there. What is left here is the part that genuinely needs a client, a
 * network and a signed-in user — and is therefore the part that cannot be
 * tested without them.
 */
import type {
  PowerSyncBackendConnector,
  CrudEntry,
  AbstractPowerSyncDatabase,
} from '@powersync/web';
import {
  REFERENCE_TABLE_NAMES,
  RetryableUploadError,
  describeUploadReport,
  uploadBatch,
  type CrudOperation,
  type DiscardedWrite,
  type PlannedWrite,
  type QueuedChange,
  type UploadError,
} from '@g7m/db';
import { supabase } from '../supabase.js';
import { env } from '../env.js';

/**
 * PostgREST puts the HTTP status somewhere the typed error does not reach.
 *
 * The status matters — it is how a 503 is told from a 400 — so it is pulled off
 * whatever the client actually attached, defensively, rather than assumed.
 */
function statusOf(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const status = (error as { status?: unknown }).status;
  return typeof status === 'number' ? status : undefined;
}

function toUploadError(error: {
  message?: string;
  code?: string;
  details?: string | null;
}): UploadError {
  return {
    message: error.message,
    code: error.code,
    details: error.details ?? undefined,
    status: statusOf(error),
  };
}

/**
 * Performs one planned write.
 *
 * `upsert` rather than `insert` for a PUT, so that re-sending a write whose
 * acknowledgement was lost is a no-op instead of a permanent duplicate-key
 * failure. That is the property the whole retry strategy rests on.
 */
async function executeWrite(write: PlannedWrite): Promise<UploadError | null> {
  const table = supabase.from(write.table);

  switch (write.kind) {
    case 'upsert': {
      const { error } = await table.upsert(write.row, { onConflict: 'id' });
      return error === null ? null : toUploadError(error);
    }
    case 'update': {
      const { error } = await table.update(write.changes).eq('id', write.id);
      return error === null ? null : toUploadError(error);
    }
    case 'delete': {
      const { error } = await table.delete().eq('id', write.id);
      return error === null ? null : toUploadError(error);
    }
  }
}

/** PowerSync's `UpdateType` is a string enum; this narrows it without importing it. */
function toOperation(op: string): CrudOperation {
  if (op === 'PUT' || op === 'PATCH' || op === 'DELETE') return op;
  throw new Error(`Unknown PowerSync operation: ${op}`);
}

function toQueuedChange(entry: CrudEntry): QueuedChange {
  return {
    op: toOperation(String(entry.op)),
    table: entry.table,
    id: entry.id,
    opData: entry.opData,
  };
}

export interface ConnectorEvents {
  /**
   * A write that will never succeed, dropped so the queue could drain.
   *
   * Except when `alreadyApplied`, this is a row that exists on the device and
   * will never reach the server — the one moment it can still be reported.
   */
  readonly onDiscarded?: (discarded: DiscardedWrite) => void;
  /** A batch finished. `report` is safe to show a user. */
  readonly onUploaded?: (summary: string) => void;
}

export function createConnector(events: ConnectorEvents = {}): PowerSyncBackendConnector {
  return {
    /**
     * The Supabase access token, fetched fresh every time.
     *
     * `getSession()` refreshes it when it is close to expiry, so this must not
     * be cached — a cached token is one that expires mid-sync and takes the
     * connection down until something else happens to reconnect.
     *
     * Returning null means "not signed in", which is a normal state and stops
     * the sync stream quietly. Throwing means "could not tell", which makes
     * PowerSync retry. Confusing the two either spins on a signed-out app or
     * gives up on a flaky network.
     */
    fetchCredentials: async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error !== null) {
        // Not a sign-out. Let PowerSync retry rather than tearing down sync
        // because a token refresh happened to hit a bad network.
        throw new Error(`Could not read the session: ${error.message}`);
      }
      const session = data.session;
      if (session === null) return null;

      return {
        endpoint: env.VITE_POWERSYNC_URL,
        token: session.access_token,
        // `expires_at` is in seconds. Telling PowerSync when the token dies
        // lets it refresh ahead of time instead of after a failure.
        ...(session.expires_at === undefined
          ? {}
          : { expiresAt: new Date(session.expires_at * 1000) }),
      };
    },

    /**
     * Push the local write queue to Supabase.
     *
     * `complete()` throws the batch away, so it is called only when nothing is
     * left worth retrying. `uploadBatch` throws in that case and this lets the
     * throw escape — which is precisely how PowerSync is told to try again.
     */
    uploadData: async (database: AbstractPowerSyncDatabase) => {
      const batch = await database.getCrudBatch();
      if (batch === null) return;

      const report = await uploadBatch(batch.crud.map(toQueuedChange), executeWrite, {
        referenceTables: REFERENCE_TABLE_NAMES,
        ...(events.onDiscarded === undefined ? {} : { onDiscarded: events.onDiscarded }),
      });

      // Reached only when every change either succeeded or can never succeed.
      await batch.complete();
      events.onUploaded?.(describeUploadReport(report));
    },
  };
}

export { RetryableUploadError };
