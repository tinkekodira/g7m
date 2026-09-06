/**
 * Registering the worker, and noticing when it has a replacement waiting.
 *
 * The browser half of the deploy problem. `service-worker/sw.ts` makes sure a
 * new build can be *fetched*; this makes sure the app finds out one exists
 * without the user force-quitting it.
 *
 * The trigger is visibility, not a timer. An iOS Home Screen app spends most of
 * its life suspended, so an interval fires when nobody is looking and not when
 * they come back; `visibilitychange` fires exactly on the return.
 */
import { isUpdateReady, shouldCheckForUpdate } from './updates.js';

/** The worker that has installed and is waiting for permission to take over. */
let waiting: ServiceWorker | null = null;
let registration: ServiceWorkerRegistration | null = null;
let lastCheckedAt: number | null = null;
/** Set only by `applyUpdate`, so a first install never reloads the page. */
let updateRequested = false;
let reloading = false;

function isSupported(): boolean {
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
}

/**
 * Register, then watch. Returns a function that stops watching.
 *
 * Registration itself is not undone on cleanup: React StrictMode mounts twice
 * in development, and unregistering between the two would leave the app with no
 * worker. `register` is idempotent for the same URL and scope, so calling it
 * twice is free.
 */
export function watchForUpdates(onUpdateReady: () => void): () => void {
  // No worker in development. Vite's dev server exists to serve modules that
  // have just changed, and a cache in front of it is only ever wrong.
  if (!import.meta.env.PROD || !isSupported()) return () => undefined;

  const container = navigator.serviceWorker;
  let stopped = false;

  const announce = (worker: ServiceWorker): void => {
    waiting = worker;
    if (!stopped) onUpdateReady();
  };

  const onControllerChange = (): void => {
    // Only reload when the user asked for it. This event also fires on a first
    // install, when `clients.claim()` takes over a page that is working fine.
    if (!updateRequested || reloading) return;
    reloading = true;
    window.location.reload();
  };

  const onVisibilityChange = (): void => {
    if (document.visibilityState !== 'visible') return;
    const now = Date.now();
    if (!shouldCheckForUpdate(lastCheckedAt, now)) return;
    lastCheckedAt = now;
    // Rejects when offline, which is not news worth logging in this app.
    void registration?.update().catch(() => undefined);
  };

  container.addEventListener('controllerchange', onControllerChange);
  document.addEventListener('visibilitychange', onVisibilityChange);

  void container
    .register(new URL('sw.js', document.baseURI).href, {
      /**
       * Never satisfy an update check from the HTTP cache.
       *
       * GitHub Pages serves everything with `max-age=600`. The default
       * (`imports`) already bypasses it for the worker script itself, but being
       * explicit costs nothing and covers anything the worker imports later —
       * and a stale answer here defeats the entire mechanism silently.
       */
      updateViaCache: 'none',
    })
    .then(
      (reg) => {
        registration = reg;
        if (stopped) return;

        // Installed while the app was closed, on a previous visit.
        if (reg.waiting !== null && container.controller !== null) announce(reg.waiting);

        reg.addEventListener('updatefound', () => {
          const installing = reg.installing;
          if (installing === null) return;
          installing.addEventListener('statechange', () => {
            if (isUpdateReady(installing.state, container.controller !== null)) {
              announce(installing);
            }
          });
        });
      },
      (error: unknown) => {
        // A failed registration must not stop the app. It means no offline
        // cold start and no update prompt, not a broken screen.
        console.warn('[sw] registration failed', error);
      },
    );

  return () => {
    stopped = true;
    container.removeEventListener('controllerchange', onControllerChange);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}

/**
 * Take the update: tell the waiting worker to activate, and reload when it has.
 *
 * The reload happens in `controllerchange` rather than here, because reloading
 * before the new worker controls the page would just re-serve the old build
 * from the old worker and look like the button did nothing.
 */
export function applyUpdate(): void {
  if (waiting === null) {
    // Nothing waiting — the update arrived some other way, or the prompt is
    // stale. A plain reload is still the right response to "Reload".
    window.location.reload();
    return;
  }
  updateRequested = true;
  waiting.postMessage({ type: 'reload' });
}
