/**
 * "Online now" and "Last seen 2h ago", from this side: telling the server the
 * app is open.
 *
 * Once when the app opens, again whenever it comes back to the foreground, and
 * every few minutes while it stays there — but never more often than that.
 * "Online" means active in the last five minutes, so a lifter with the app
 * open between sets must be heard from at least that often or they would
 * flicker to "Last seen 6 min ago" mid-workout; anything more often is writes
 * for nothing. The server refuses anything faster anyway (`touch_last_active`).
 *
 * Not through PowerSync: it lives on `friend_profiles`, which is not synced,
 * so it costs no sync traffic and cannot collide with a profile edit made on
 * another device (ADR-0105). Offline it simply does not happen, which is the
 * truth — somebody with no signal is not online.
 */
import { useEffect } from 'react';
import { touchLastActive } from './api.js';

/** Under the five-minute "online" window, so an open app never lapses out of it. */
export const PRESENCE_INTERVAL_MS = 4 * 60 * 1000;

/** Whether enough time has passed since the last write to send another. */
export function presenceDue(lastSentAt: number | null, now: number): boolean {
  return lastSentAt === null || now - lastSentAt >= PRESENCE_INTERVAL_MS;
}

let lastSentAt: number | null = null;

function report(): void {
  if (globalThis.document.visibilityState !== 'visible') return;
  if (!globalThis.navigator.onLine) return;
  const now = Date.now();
  if (!presenceDue(lastSentAt, now)) return;
  lastSentAt = now;
  touchLastActive().catch((cause: unknown) => {
    // Presence is a nicety. A failure costs a friend an out-of-date "last
    // seen", and is retried at the next foreground or tick.
    lastSentAt = null;
    console.warn('Could not record that the app is open.', cause);
  });
}

export function usePresence(): void {
  useEffect(() => {
    report();
    const onVisible = () => {
      report();
    };
    globalThis.document.addEventListener('visibilitychange', onVisible);
    globalThis.addEventListener('online', onVisible);
    const timer = setInterval(report, PRESENCE_INTERVAL_MS);
    return () => {
      globalThis.document.removeEventListener('visibilitychange', onVisible);
      globalThis.removeEventListener('online', onVisible);
      clearInterval(timer);
    };
  }, []);
}
