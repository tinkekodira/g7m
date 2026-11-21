/**
 * The words around taking your data away and deleting your account.
 *
 * Kept apart from the code that does either, so the wording — which is most of
 * what these two features are, from the outside — is tested without a
 * database, a network or a browser.
 */
import { formatList, formatNumber, t } from '@g7m/i18n';

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
    return t().settings.data.empty;
  }
  const words = t().settings.data;
  const parts = [
    counts.workouts > 0 ? words.workouts(formatNumber(counts.workouts), counts.workouts) : null,
    counts.sets > 0 ? words.sets(formatNumber(counts.sets), counts.sets) : null,
    counts.weighIns > 0 ? words.weighIns(formatNumber(counts.weighIns), counts.weighIns) : null,
  ].filter((part): part is string => part !== null);
  return words.holds(formatList(parts));
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
    return t().settings.data.notSynced;
  }
  return null;
}

/** The word to type before an account can be deleted, in the language on screen. */
export function deleteConfirmationWord(): string {
  return t().settings.deletion.word;
}

/**
 * Whether what was typed is the word.
 *
 * Forgiving of case and stray spaces: a phone keyboard capitalises the first
 * letter and adds a space after a word on its own, and the point of the step
 * is to be deliberate, not to be exact. The English word is always accepted
 * too: somebody who learned the gesture in English should not be refused for
 * typing it.
 */
export function confirmsDeletion(typed: string): boolean {
  const word = typed.trim().toLocaleUpperCase();
  return word === deleteConfirmationWord().toLocaleUpperCase() || word === 'DELETE';
}

/** What a failed deletion says. Nothing has been deleted in any of these cases. */
export function describeDeletionError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('failed to fetch') || m.includes('networkerror') || m.includes('load failed')) {
    return t().settings.deletion.unreachable;
  }
  if (m.includes('jwt expired') || m.includes('not signed in')) {
    return t().settings.deletion.expired;
  }
  return t().settings.deletion.failed(message);
}

/** Shown on the sign-in screen once it is done. */
export function accountDeletedNotice(): string {
  return t().settings.deletion.deleted;
}
