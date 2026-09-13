/**
 * The words around taking your data away and deleting your account.
 *
 * Kept apart from the code that does either, so the wording — which is most of
 * what these two features are, from the outside — is tested without a
 * database, a network or a browser.
 */

export interface ExportCounts {
  readonly workouts: number;
  readonly sets: number;
  readonly weighIns: number;
}

/**
 * What went into the file, said after it is made.
 *
 * Counts rather than a bare "done", because the first question anybody has
 * about an export is whether it has their stuff in it.
 */
export function describeExportContents(counts: ExportCounts): string {
  if (counts.workouts === 0 && counts.weighIns === 0) {
    return 'Nothing is logged yet, so the file holds your profile and your answers to the welcome questions.';
  }
  const parts = [
    plural(counts.workouts, 'workout'),
    plural(counts.sets, 'set'),
    plural(counts.weighIns, 'weigh-in'),
  ].filter((part) => !part.startsWith('0 '));
  return `It holds ${joinWords(parts)}.`;
}

/**
 * Why the file might not be everything, when it might not.
 *
 * The export reads this device. A device that has never finished its first
 * download holds only part of somebody's history — a new phone, say — and a
 * file that silently leaves out a year of training is worse than no file.
 * Changes not yet uploaded are the opposite case: they are in the file and not
 * on the server, which is worth knowing and is not a problem.
 */
export function describeExportCaveat(state: {
  readonly syncConfigured: boolean;
  readonly hasSynced: boolean;
}): string | null {
  if (state.syncConfigured && !state.hasSynced) {
    return 'This device has not finished downloading your history yet, so older workouts may be missing. Connect, wait for sync to finish, and download again.';
  }
  return null;
}

/** The word to type before an account can be deleted. */
export const DELETE_CONFIRMATION_WORD = 'DELETE';

/**
 * Whether what was typed is the word.
 *
 * Forgiving of case and stray spaces: a phone keyboard capitalises the first
 * letter and adds a space after a word on its own, and the point of the step
 * is to be deliberate, not to be exact.
 */
export function confirmsDeletion(typed: string): boolean {
  return typed.trim().toUpperCase() === DELETE_CONFIRMATION_WORD;
}

/** What a failed deletion says. Nothing has been deleted in any of these cases. */
export function describeDeletionError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('failed to fetch') || m.includes('networkerror') || m.includes('load failed')) {
    return 'Could not reach the server, so nothing was deleted. Your account has to be deleted there, not just on this device — try again with a connection.';
  }
  if (m.includes('jwt expired') || m.includes('not signed in')) {
    return 'Your session has expired, so nothing was deleted. Sign out and back in, then try again.';
  }
  return `Nothing was deleted: ${message}`;
}

/** Shown on the sign-in screen once it is done. */
export const ACCOUNT_DELETED_NOTICE =
  'Your account has been deleted, along with everything in it, from the server and from this device.';

function plural(count: number, noun: string): string {
  return `${count.toLocaleString('en-GB')} ${noun}${count === 1 ? '' : 's'}`;
}

function joinWords(parts: readonly string[]): string {
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} and ${parts.at(-1) ?? ''}`;
}
