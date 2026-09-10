/**
 * Which account the local database belongs to.
 *
 * There is one SQLite file, `g7m.db`, and every account that signs in on this
 * device shares it. PowerSync keeps its bucket checkpoints in there too — its
 * record of what it has already downloaded — and those are meaningless across a
 * change of identity. Left in place they are worse than meaningless: the next
 * sign-in can believe it already holds data it has never seen, and simply not
 * ask for it. Training that is safe on the server never comes back down.
 *
 * `handOverDevice` clears on sign-out, which handles the tidy path. This is the
 * other one — a session that expired, an app reinstalled mid-flight, a
 * sign-out that never ran — and it heals a device that is *already* in that
 * state rather than requiring a clean sign-out first.
 *
 * ## It only ever acts on positive knowledge
 *
 * Clearing when the owner is *unknown* would destroy unsent writes every time
 * storage was wiped or a browser arrived with no record. So an unknown owner
 * is claimed, not acted on. Only a recorded owner that differs from the
 * arriving one is grounds for clearing anything.
 */

/** Where the owner is recorded. Deliberately outside the database it guards. */
export const OWNER_KEY = 'g7m.database-owner';

export type Claim =
  /** Same account as last time, or the first this device has seen. Nothing done. */
  | { readonly action: 'keep' }
  /** A different account. The local database must be cleared before syncing. */
  | { readonly action: 'clear'; readonly previous: string };

/**
 * What to do about a database whose recorded owner is `previous`.
 *
 * Pure, so the rule can be tested without a browser: the storage read, the
 * write and the clearing all happen in the caller.
 */
export function claimFor(previous: string | null, arriving: string): Claim {
  // Nothing signed in yet. Not a change of owner, and not a reason to touch a
  // database that may be holding somebody's unsent sets.
  if (arriving === '') return { action: 'keep' };

  // No record. Could be a first run or wiped storage; either way there is no
  // evidence of a different owner, and clearing on a guess costs data.
  if (previous === null || previous === '') return { action: 'keep' };

  if (previous === arriving) return { action: 'keep' };

  return { action: 'clear', previous };
}
