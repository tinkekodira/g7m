/**
 * How long the lifter has in the gym today, as chosen on today's plan.
 *
 * The coach pairs exercises into supersets only when the plan will not fit
 * this (ADR-0112). "No limit", the default, plans exactly as before.
 *
 * Kept on this device, the way the rest times are (`rest-settings.ts`), and
 * for the same reason: a profile column would need a migration and a
 * sync-rules redeploy before the app could write it. It is also the honest
 * home for it — how long somebody has is a fact about today, and the last
 * answer is only a guess at the next one.
 */

export const SESSION_TIME_STORAGE_KEY = 'g7m.time-today';

/** The choices on the plan, in minutes. */
export const SESSION_MINUTES = [30, 45, 60, 90] as const;
export type SessionMinutes = (typeof SESSION_MINUTES)[number];

/** The subset of `Storage` this needs, so the tests can hand it a map. */
export type TimeStorage = Pick<Storage, 'getItem' | 'setItem'>;

/** The stored choice, or null for no limit — including when nothing was stored. */
export function readSessionMinutes(
  storage: TimeStorage | undefined = globalThis.localStorage,
): SessionMinutes | null {
  try {
    const raw = storage?.getItem(SESSION_TIME_STORAGE_KEY);
    if (raw === null || raw === undefined) return null;
    const parsed: unknown = JSON.parse(raw);
    return SESSION_MINUTES.find((minutes) => minutes === parsed) ?? null;
  } catch {
    // Private browsing, a full disk, or something else's junk under the key.
    // No limit is what the plan did before there was a choice.
    return null;
  }
}

export function writeSessionMinutes(
  minutes: SessionMinutes | null,
  storage: TimeStorage | undefined = globalThis.localStorage,
): void {
  try {
    storage?.setItem(SESSION_TIME_STORAGE_KEY, JSON.stringify(minutes));
  } catch {
    // Not remembered for next time, which costs one tap then.
  }
}
