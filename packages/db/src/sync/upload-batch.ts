/**
 * Draining the local write queue.
 *
 * PowerSync hands back a batch of queued changes and one callback,
 * `complete()`, which throws the batch away. Everything hinges on when that is
 * called:
 *
 *   · **Call it while something still needed retrying** and those writes are
 *     gone. Not queued, not logged — gone.
 *   · **Never call it** and the queue never drains. The head entry is retried
 *     forever and every write behind it waits, silently, for good.
 *
 * So this function has exactly one job: decide, for a whole batch, whether the
 * queue may be cleared. It throws if anything is worth another attempt — which
 * is how the caller knows not to complete — and returns a report otherwise.
 *
 * The batch is not atomic, and cannot be. PostgREST has no transaction across
 * separate requests, so a batch that fails halfway has already applied its
 * first half. Throwing re-sends the whole batch, which is safe only because
 * every write it produces is idempotent: PUT is an upsert on `id`, PATCH sets
 * named columns to fixed values, DELETE is a no-op the second time. That is not
 * an incidental property of `planWrite` — it is the reason it is shaped that
 * way.
 */
import { isMissingOwner, planWrite, type PlannedWrite, type QueuedChange } from './apply-crud.js';
import {
  classifyUploadError,
  isAlreadyApplied,
  isPermissionDenied,
  type UploadError,
} from './upload-outcome.js';

/** Performs one write. Resolves to the error, or null on success. */
export type WriteExecutor = (write: PlannedWrite) => Promise<UploadError | null>;

export interface DiscardedWrite {
  readonly write: PlannedWrite;
  readonly error: UploadError;
  /** True when the row was already on the server — nothing was actually lost. */
  readonly alreadyApplied: boolean;
  /** True when a policy refused it. Almost always a missing `user_id`. */
  readonly permissionDenied: boolean;
}

export interface UploadReport {
  /** Writes the server accepted. */
  readonly applied: number;
  /** Changes that meant no write at all — a PATCH of only server-owned columns. */
  readonly skipped: number;
  /**
   * Writes that can never succeed and were dropped so the queue could drain.
   *
   * Non-empty is a bug report, not a warning: except for `alreadyApplied`, each
   * one is a row that exists on the device and will never reach the server.
   */
  readonly discarded: readonly DiscardedWrite[];
}

/**
 * Thrown when at least one write is worth retrying.
 *
 * The caller must let this escape without completing the batch. PowerSync waits
 * its configured interval and hands the same changes back.
 */
export class RetryableUploadError extends Error {
  readonly write: PlannedWrite;
  /**
   * Named `failure` rather than `cause`, which `Error` already defines as
   * `unknown` — shadowing it would either lose this type or need an `override`
   * that quietly widens it at every call site.
   */
  readonly failure: UploadError;

  constructor(write: PlannedWrite, failure: UploadError) {
    super(
      `Upload of ${write.kind} on ${write.table} will be retried: ` +
        `${failure.message ?? failure.code ?? 'unknown error'}`,
    );
    this.name = 'RetryableUploadError';
    this.write = write;
    this.failure = failure;
  }
}

export interface UploadBatchOptions {
  /** Tables with no `user_id`, so the owner check does not apply to them. */
  readonly referenceTables?: readonly string[];
  /**
   * Called for each write that is dropped, before the queue is cleared.
   *
   * The queue has to drain or everything behind it stalls, so dropping is the
   * only option — but it is the one moment at which a permanently lost write
   * can still be reported, so it gets a hook rather than a console line.
   */
  readonly onDiscarded?: (discarded: DiscardedWrite) => void;
}

/**
 * Apply every change in a batch.
 *
 * Resolves when the queue may be cleared — including when writes were dropped,
 * because a dropped write is one that will never succeed and the alternative is
 * a queue that never moves again.
 *
 * Rejects with {@link RetryableUploadError} the moment something is worth
 * another attempt. Stopping there rather than pressing on is deliberate: the
 * changes are ordered, and applying later ones over a gap risks a child row
 * arriving before its parent, which the composite foreign keys would refuse.
 */
export async function uploadBatch(
  changes: readonly QueuedChange[],
  execute: WriteExecutor,
  options: UploadBatchOptions = {},
): Promise<UploadReport> {
  const referenceTables = options.referenceTables ?? [];
  const discarded: DiscardedWrite[] = [];
  let applied = 0;
  let skipped = 0;

  for (const change of changes) {
    const write = planWrite(change);
    if (write === null) {
      skipped += 1;
      continue;
    }

    // Checked before the request rather than after the rejection, because the
    // server's answer for this case is a permanent refusal — which means the
    // write would be discarded and the row silently stranded on the device.
    if (isMissingOwner(write, referenceTables)) {
      const failure: DiscardedWrite = {
        write,
        error: {
          code: '42501',
          message:
            `Refusing to upload ${write.kind} on ${write.table} with no user_id: ` +
            'row level security would reject it permanently. This is a bug in the ' +
            'repository layer that created the row.',
        },
        alreadyApplied: false,
        permissionDenied: true,
      };
      discarded.push(failure);
      options.onDiscarded?.(failure);
      continue;
    }

    const error = await execute(write);
    if (error === null) {
      applied += 1;
      continue;
    }

    if (classifyUploadError(error) === 'retry') throw new RetryableUploadError(write, error);

    const failure: DiscardedWrite = {
      write,
      error,
      alreadyApplied: isAlreadyApplied(error),
      permissionDenied: isPermissionDenied(error),
    };
    discarded.push(failure);
    options.onDiscarded?.(failure);
  }

  return { applied, skipped, discarded };
}

/**
 * A one-line summary of a batch, for the sync status panel.
 *
 * Written for someone standing in a gym, so it leads with whether anything was
 * lost rather than with how much succeeded.
 */
export function describeUploadReport(report: UploadReport): string {
  const lost = report.discarded.filter((entry) => !entry.alreadyApplied);
  if (lost.length > 0) {
    const tables = [...new Set(lost.map((entry) => entry.write.table))].join(', ');
    return (
      `${String(lost.length)} change${lost.length === 1 ? '' : 's'} could not be saved to the ` +
      `server (${tables}) and ${lost.length === 1 ? 'was' : 'were'} skipped. ` +
      'Everything else synced.'
    );
  }
  if (report.applied === 0) return 'Nothing to sync.';
  return `Synced ${String(report.applied)} change${report.applied === 1 ? '' : 's'}.`;
}
