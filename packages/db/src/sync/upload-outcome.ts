/**
 * What to do when a local write will not go up.
 *
 * This is the most dangerous decision in the sync layer, and it is dangerous in
 * both directions.
 *
 * PowerSync queues every local change and hands them back in order. Whatever
 * the queue cannot clear stays at the head of it, so:
 *
 *   · **Discard something retryable** and the write is gone. The set is on the
 *     device, the lifter saw it save, and it never reaches the server. The
 *     phone is then quietly the only copy — until it is reinstalled.
 *
 *   · **Retry something permanent** and the queue jams. A row that violates a
 *     constraint will violate it again on every attempt, forever, and every
 *     write made after it is stuck behind it. The app keeps working offline,
 *     nothing errors, and sync silently stops for good. This is the worse
 *     failure: it is invisible, and it grows.
 *
 * So the question is never "did it fail" but "will trying again ever help".
 * Deciding that from an error message is guesswork; deciding it from a Postgres
 * error code is not, which is why this reads `code` first and only falls back
 * to the message.
 *
 * See DECISIONS.md ADR-0017 for the conflict semantics this serves.
 */

export type UploadOutcome =
  /** Worth another attempt. Keep the entry queued; do not complete the batch. */
  | 'retry'
  /**
   * Will never succeed. Drop this entry and let the queue drain, or everything
   * behind it is stuck too. The row stays on the device; the discrepancy is
   * reported rather than swallowed.
   */
  | 'discard';

/** The shape both PostgREST and GoTrue errors happen to share. */
export interface UploadError {
  readonly message?: string | undefined;
  /** Postgres SQLSTATE, or a PostgREST code like `PGRST301`. */
  readonly code?: string | undefined;
  readonly details?: string | undefined;
  /** HTTP status, when the client surfaces one. */
  readonly status?: number | undefined;
}

/**
 * Postgres error classes that mean the data itself is wrong.
 *
 * Retrying cannot change any of these, because nothing about the row will be
 * different next time:
 *
 *   22  data exception — a number out of range, a bad timestamp
 *   23  integrity constraint violation — check, not-null, foreign key, unique
 *   42  syntax error or access rule violation — includes 42501, which is what
 *       row level security returns when a policy refuses the write
 */
const PERMANENT_SQLSTATE_CLASSES = ['22', '23', '42'];

/**
 * The exception inside class 23.
 *
 * A unique violation on a re-sent insert is not a broken row — it is the same
 * row arriving twice, because the first attempt succeeded and the
 * acknowledgement was lost. Treating it as permanent is correct (retrying will
 * fail identically), and the caller should treat it as success rather than as
 * data loss. `isAlreadyApplied` below is how it tells the difference.
 */
const UNIQUE_VIOLATION = '23505';

/** PostgREST codes that describe a broken connection rather than a broken row. */
const RETRYABLE_POSTGREST_CODES = [
  /** JWT expired. The client refreshes and the next attempt carries a new one. */
  'PGRST301',
  /** Could not connect to the database. */
  'PGRST000',
];

const RETRYABLE_MESSAGE_FRAGMENTS = [
  'failed to fetch',
  'networkerror',
  'network request failed',
  'timeout',
  'timed out',
  'econnreset',
  'socket hang up',
  'service unavailable',
  'bad gateway',
  'too many requests',
];

function normalise(error: UploadError): { code: string; message: string } {
  return {
    code: (error.code ?? '').toUpperCase(),
    message: (error.message ?? '').toLowerCase(),
  };
}

/**
 * Whether this failure means the row is already on the server.
 *
 * Distinguished from other permanent failures because the outcome is different
 * for the user: nothing was lost, so nothing should be reported. It is the
 * expected result of retrying an insert whose acknowledgement went missing.
 */
export function isAlreadyApplied(error: UploadError): boolean {
  const { code, message } = normalise(error);
  if (code === UNIQUE_VIOLATION) return true;
  return message.includes('duplicate key value');
}

/**
 * Whether a permanent failure was the server refusing, rather than the data
 * being malformed.
 *
 * Worth separating because it means something quite specific: the row does not
 * belong to the signed-in user, or a policy says they may not write it. That is
 * either a bug in the repository layer — a missing `user_id` on an insert is the
 * usual cause — or a session that has changed identity underneath the queue.
 * Both are worth surfacing loudly rather than filing under "bad row".
 */
export function isPermissionDenied(error: UploadError): boolean {
  const { code, message } = normalise(error);
  if (code === '42501') return true;
  if (error.status === 401 || error.status === 403) return true;
  return message.includes('row-level security') || message.includes('permission denied');
}

/**
 * Whether trying this write again could ever succeed.
 *
 * The default is `retry`. An unrecognised failure is far more likely to be a
 * network the author did not anticipate than a permanently broken row, and the
 * cost of guessing wrong that way is a stalled queue somebody notices — rather
 * than a deleted set nobody does.
 */
export function classifyUploadError(error: UploadError): UploadOutcome {
  const { code, message } = normalise(error);

  if (RETRYABLE_POSTGREST_CODES.includes(code)) return 'retry';

  // A five-digit SQLSTATE. Anything the server evaluated far enough to reject
  // on its own terms will not evaluate differently next time.
  if (/^[0-9A-Z]{5}$/.test(code) && PERMANENT_SQLSTATE_CLASSES.includes(code.slice(0, 2))) {
    return 'discard';
  }

  if (error.status !== undefined) {
    // 408 and 429 are the client being asked to wait, not to stop.
    if (error.status === 408 || error.status === 429) return 'retry';
    if (error.status >= 500) return 'retry';
    // 401 is worth one more attempt: the token may simply have expired, and the
    // Supabase client refreshes it before the next request goes out.
    if (error.status === 401) return 'retry';
    if (error.status >= 400) return 'discard';
  }

  if (RETRYABLE_MESSAGE_FRAGMENTS.some((fragment) => message.includes(fragment))) return 'retry';

  return 'retry';
}
