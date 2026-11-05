import { useEffect, useRef } from 'react';
import { useAuthStore } from '../../auth/auth-store.js';
import { useCatalogue } from '../db/use-catalogue.js';
import { reportWorkoutPresence } from './api.js';
import { PRESENCE_INTERVAL_MS } from './use-presence.js';

/** Open live workout + a renewable five-minute lease, independent of sync. */
export function useWorkoutPresence(): void {
  const owner = useAuthStore((state) => state.session?.user.id ?? null);
  const active = useCatalogue(`workout-presence:${owner ?? ''}`, async (repositories) => {
    const session = await repositories.sessions.active();
    return { owner, sessionId: session?.source === 'past' ? null : (session?.id ?? null) };
  });
  // Undefined means the local read has not succeeded. Do not clear a status
  // on the strength of a loading/error state.
  const desired = useRef<string | null | undefined>(undefined);
  desired.current =
    active.loading || active.error !== null || active.data?.owner !== owner
      ? undefined
      : active.data.sessionId;
  const send = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (owner === null) return;
    let cancelled = false;
    let previous: string | null = null;
    let lastSentAt = 0;
    let chain = Promise.resolve();
    const report = (force = false) => {
      // Serialize transitions: a slow start must not arrive after Finish.
      chain = chain
        .then(async () => {
          if (cancelled || document.visibilityState !== 'visible' || !navigator.onLine) return;
          const sessionId = desired.current;
          if (sessionId === undefined) return;
          if (!force && sessionId === previous && Date.now() - lastSentAt < PRESENCE_INTERVAL_MS)
            return;
          if (previous !== null && previous !== sessionId) {
            await reportWorkoutPresence(previous, false);
            previous = null;
          }
          if (cancelled) return;
          if (sessionId !== null) await reportWorkoutPresence(sessionId, true);
          previous = sessionId;
          lastSentAt = Date.now();
        })
        .catch((cause: unknown) => {
          console.warn('Could not share workout status.', cause);
        });
    };
    send.current = report;
    const onVisible = () => report();
    const onPreference = () => report(true);
    document.addEventListener('visibilitychange', onVisible);
    globalThis.addEventListener('online', onVisible);
    globalThis.addEventListener('workout-status-sharing-changed', onPreference);
    const timer = setInterval(onVisible, PRESENCE_INTERVAL_MS);
    report();
    return () => {
      cancelled = true;
      send.current = null;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      globalThis.removeEventListener('online', onVisible);
      globalThis.removeEventListener('workout-status-sharing-changed', onPreference);
    };
  }, [owner]);

  useEffect(() => send.current?.(), [owner, active.data, active.loading, active.error]);
}
