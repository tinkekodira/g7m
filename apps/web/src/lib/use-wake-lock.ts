/**
 * Wiring `wake-lock.ts` to the browser.
 *
 * Everything with a decision in it lives in the controller, which is tested.
 * This is the adapter: feature detection, the visibility listener, and the
 * two effects that tell the controller what is going on.
 *
 * ## Where it does nothing
 *
 * The Screen Wake Lock API needs a secure context, and it is missing entirely
 * from Safari before 16.4 and from every iOS WKWebView regardless of version —
 * which includes the Capacitor build on iPhone. The hook detects that and does
 * nothing at all, because the alternative is a promise that rejects on every
 * workout. On iOS the screen still sleeps; that is a gap to close with a native
 * plugin, not something to paper over here.
 */
import { useEffect, useRef } from 'react';
import {
  createWakeLockController,
  type WakeLockController,
  type WakeLockHandle,
} from './wake-lock.js';

interface WakeLockApi {
  readonly request: (type: 'screen') => Promise<WakeLockHandle>;
}

function screenWakeLock(): WakeLockApi | null {
  if (typeof navigator === 'undefined') return null;
  const api = (navigator as unknown as { wakeLock?: WakeLockApi }).wakeLock;
  return typeof api?.request === 'function' ? api : null;
}

/** Keep the display awake for as long as `active` stays true. */
export function useWakeLock(active: boolean): void {
  const controller = useRef<WakeLockController | null>(null);

  useEffect(() => {
    const api = screenWakeLock();
    if (api === null) return;

    const created = createWakeLockController(async () => {
      try {
        return await api.request('screen');
      } catch {
        // Refused rather than broken: a backgrounded page, or a battery below
        // the threshold where the browser stops honouring this at all.
        return null;
      }
    });
    controller.current = created;

    const onVisibility = (): void => {
      created.setVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', onVisibility);
    onVisibility();

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      created.dispose();
      controller.current = null;
    };
  }, []);

  // Runs after the effect above on the first commit, which is the order that
  // makes a workout already in progress get its lock on mount.
  useEffect(() => {
    controller.current?.setActive(active);
  }, [active]);
}
