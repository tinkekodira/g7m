/**
 * Two small facts about the workout in progress that belong to the device.
 *
 * **When "still training?" was last answered**, so that answering it survives
 * a reload — and so the watcher that closes abandoned workouts (ADR-0077) can
 * see an answer given on a screen it is not part of.
 *
 * **Which workout the app finished by itself**, so the next launch can say so
 * once and then stop. Neither is training data: they are about this phone's
 * last few minutes, they are worthless on another device, and syncing them
 * would mean a column and a migration for something that expires within the
 * hour. Local storage is exactly the right size of memory for both.
 */

export const SNOOZE_STORAGE_KEY = 'g7m.stillTraining';
export const AUTO_FINISH_STORAGE_KEY = 'g7m.autoFinished';

/** The subset of `Storage` this needs, so the tests can hand it a map. */
export type NoticeStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function read(storage: NoticeStorage | undefined, key: string): string | null {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    // Private browsing, or a WebView with storage switched off.
    return null;
  }
}

function write(storage: NoticeStorage | undefined, key: string, value: string | null): void {
  try {
    if (value === null) storage?.removeItem(key);
    else storage?.setItem(key, value);
  } catch {
    // Nothing here is worth an error. The prompt asks again; the notice is lost.
  }
}

/**
 * When the open workout was last answered for — or null if it was another
 * workout that was answered, which is the same as never for this one.
 */
export function readSnoozedAt(
  sessionId: string,
  storage: NoticeStorage | undefined = globalThis.localStorage,
): Date | null {
  const stored = read(storage, SNOOZE_STORAGE_KEY);
  if (stored === null) return null;
  const [id, at] = stored.split('|');
  if (id !== sessionId || at === undefined) return null;
  const when = new Date(at);
  return Number.isNaN(when.getTime()) ? null : when;
}

export function writeSnoozedAt(
  sessionId: string,
  at: Date,
  storage: NoticeStorage | undefined = globalThis.localStorage,
): void {
  write(storage, SNOOZE_STORAGE_KEY, `${sessionId}|${at.toISOString()}`);
}

/** The workout the app closed by itself and has not owned up to yet. */
export function readAutoFinished(
  storage: NoticeStorage | undefined = globalThis.localStorage,
): string | null {
  const stored = read(storage, AUTO_FINISH_STORAGE_KEY);
  return stored === null || stored === '' ? null : stored;
}

export function writeAutoFinished(
  sessionId: string,
  storage: NoticeStorage | undefined = globalThis.localStorage,
): void {
  write(storage, AUTO_FINISH_STORAGE_KEY, sessionId);
}

export function clearAutoFinished(
  storage: NoticeStorage | undefined = globalThis.localStorage,
): void {
  write(storage, AUTO_FINISH_STORAGE_KEY, null);
}
