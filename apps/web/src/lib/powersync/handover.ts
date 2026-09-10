/**
 * Handing the device to a different account.
 *
 * Signing out used to do neither of the two things it has to, and the second
 * one costs data.
 *
 * **The write queue is not per user.** PowerSync keeps one local database and
 * one CRUD queue for whoever is signed in. A set logged as one account and not
 * yet uploaded is still in that queue when the next account signs in — and it
 * is then uploaded with *their* token. Postgres refuses it, because the row
 * carries a `user_id` that is not theirs, and row level security is doing
 * exactly its job. `classifyUploadError` reads a 42501 as permanent, which it
 * is, so the batch is completed and the write is thrown away for good.
 *
 * The first account comes back to a device that has been re-synced from the
 * server, and whatever never made it up there is gone from both.
 *
 * **So the queue is drained before anything is cleared.** If it drains, the
 * local database is wiped and the next account starts on an empty device — no
 * leftovers, and no queue that can be uploaded under the wrong name. If it
 * cannot be drained, nothing is wiped and the user is told: unsent work on a
 * device is recoverable by signing back in with a connection, and unsent work
 * that has been deleted is not.
 */

/** What a sign-out did with the local database. */
export type Handover =
  /** The queue was empty or emptied, so the device was wiped for the next account. */
  | { readonly state: 'cleared' }
  /** Writes have not reached the server, so the device was left as it was. */
  | { readonly state: 'kept'; readonly pending: number };

export interface DrainOptions {
  /** Give up after this long and report what is left. */
  readonly timeoutMs: number;
  readonly pollMs: number;
  readonly sleep: (ms: number) => Promise<void>;
  /** Milliseconds from any fixed origin. Injected so a test needs no clock. */
  readonly now: () => number;
}

export const DRAIN_TIMEOUT_MS = 8000;
export const DRAIN_POLL_MS = 250;

/**
 * Wait for the upload queue to empty, and report what is left if it does not.
 *
 * Polling rather than watching the status: `SyncStatus` says whether an upload
 * is *in flight*, which is false both when the queue is empty and when it is
 * full and failing. The count is the question being asked.
 *
 * Returns 0 when the queue drained. Any other number is the size of what has
 * not reached the server, and the caller must not delete it.
 */
export async function drainQueue(
  pending: () => Promise<number>,
  options: DrainOptions,
): Promise<number> {
  const started = options.now();

  let left = await pending();
  while (left > 0) {
    // Checked after the read, so an already-empty queue costs no delay at all
    // and a sign-out with nothing outstanding is instant.
    if (options.now() - started >= options.timeoutMs) return left;

    await options.sleep(options.pollMs);
    left = await pending();
  }

  return 0;
}
