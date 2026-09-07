/**
 * Keeping the screen on while a workout is open.
 *
 * A phone set down on a bench locks after thirty seconds, and the next set is
 * logged with a passcode and chalky hands. The Screen Wake Lock API fixes it in
 * about ten lines — and then those ten lines are wrong, because the lock is not
 * a flag you set once.
 *
 * ## What actually goes wrong
 *
 * The browser takes the lock back whenever the page stops being visible: tab
 * switch, app backgrounded, screen off. It does not give it back on return.
 * A naive implementation therefore works until the first phone call and never
 * again for the rest of the session, which is exactly the workout where it
 * mattered. So visibility has to be tracked and the lock re-requested.
 *
 * And `request()` is async. If the workout ends — or the app is backgrounded —
 * while the browser is still deciding, the lock arrives for a screen nobody is
 * looking at and is never released. The screen then stays on until the battery
 * is flat.
 *
 * Both of those are state-machine bugs rather than API bugs, which is why this
 * is a plain controller with no DOM in it: `wake-lock.test.ts` can drive every
 * ordering, including the ones that need a lock to arrive late.
 */

/** The part of `WakeLockSentinel` this needs, so the controller stays testable. */
export interface WakeLockHandle {
  release: () => Promise<void>;
  addEventListener: (type: 'release', listener: () => void) => void;
}

/**
 * Asks for a lock. Resolves to null when refused — which is routine, not
 * exceptional: a backgrounded page and a phone below its low-battery threshold
 * are both refusals, and neither is worth telling the lifter about.
 */
export type RequestWakeLock = () => Promise<WakeLockHandle | null>;

export interface WakeLockController {
  /** Whether anything on screen wants the display kept awake. */
  setActive: (active: boolean) => void;
  /** Whether the page is being looked at. */
  setVisible: (visible: boolean) => void;
  /** Give the lock back and refuse any that is still in flight. */
  dispose: () => void;
  /** For tests and for nothing else. */
  readonly held: () => boolean;
}

export function createWakeLockController(request: RequestWakeLock): WakeLockController {
  let active = false;
  // Assumed true: a controller created while the page is hidden is a case that
  // resolves itself on the first `visibilitychange`, and assuming false would
  // mean never asking on a browser that fires no initial event.
  let visible = true;
  let disposed = false;
  let handle: WakeLockHandle | null = null;
  let inFlight = false;

  function wanted(): boolean {
    return active && visible && !disposed;
  }

  function sync(): void {
    if (wanted()) {
      // One request at a time. Two locks would need two releases, and the
      // second reference is the one that keeps a dark screen lit.
      if (handle !== null || inFlight) return;
      inFlight = true;
      void request().then(
        (granted) => {
          inFlight = false;
          if (granted === null) return;
          if (!wanted()) {
            // Arrived for a workout that has already ended. Hand it straight
            // back rather than holding a lock nothing on screen asked for.
            void granted.release().catch(noop);
            return;
          }
          handle = granted;
          // The browser releases it by itself when the page is hidden, and a
          // spent sentinel cannot be reused — so forget it, or the next
          // `sync` sees a handle it holds and never asks again.
          granted.addEventListener('release', () => {
            if (handle === granted) handle = null;
          });
        },
        () => {
          inFlight = false;
        },
      );
      return;
    }

    const held = handle;
    if (held === null) return;
    handle = null;
    void held.release().catch(noop);
  }

  return {
    setActive(next: boolean) {
      if (active === next) return;
      active = next;
      sync();
    },
    setVisible(next: boolean) {
      if (visible === next) return;
      visible = next;
      sync();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      sync();
    },
    held: () => handle !== null,
  };
}

function noop(): void {
  /* A refused release is a lock the browser has already taken back. */
}
