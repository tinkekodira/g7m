/**
 * Wiring `wake-lock.ts` to the browser.
 *
 * Everything with a decision in it lives in the controller, which is tested.
 * This is the adapter: feature detection, the visibility listener, and the
 * two effects that tell the controller what is going on.
 *
 * ## Three ways, because the web only has one of them
 *
 * The Screen Wake Lock API needs a secure context, and it is missing entirely
 * from Safari before 16.4 and from every iOS WKWebView regardless of version.
 * So the native builds do not use it: they ask the system directly, through
 * `@capacitor-community/keep-awake`, which is the only thing that works on an
 * iPhone (ADR-0075). A browser with the API uses the API, with the controller
 * above handling everything the API gets wrong. Anything with neither lets the
 * screen sleep, as it always did.
 *
 * The native path needs no controller: the system flag is not taken away when
 * the app is backgrounded, and it is released when the workout ends or the
 * screen unmounts.
 */
import { useEffect, useRef } from 'react';
import {
  createWakeLockController,
  type WakeLockController,
  type WakeLockHandle,
} from './wake-lock.js';
import { isNative, keepScreenAwake } from './native/shell.js';
import { wakeLockBackend } from './native/shell-rules.js';

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
  const backend = wakeLockBackend({ native: isNative(), hasWebApi: screenWakeLock() !== null });

  // The phone's own flag. Asked for while the workout is open, given back when
  // it ends — including when the screen unmounts mid-workout, which is what
  // the cleanup is for.
  useEffect(() => {
    if (backend !== 'native') return;
    void keepScreenAwake(active);
    return () => {
      void keepScreenAwake(false);
    };
  }, [backend, active]);

  useEffect(() => {
    const api = screenWakeLock();
    if (backend !== 'web' || api === null) return;

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
  }, [backend]);

  // Runs after the effect above on the first commit, which is the order that
  // makes a workout already in progress get its lock on mount.
  useEffect(() => {
    controller.current?.setActive(active);
  }, [active]);
}
