/**
 * The service worker.
 *
 * It exists for two reasons, in this order:
 *
 * 1. **A deploy has to actually arrive.** GitHub Pages serves the shell with
 *    `Cache-Control: max-age=600`, and an iOS Home Screen app resumes from
 *    memory rather than reloading — so a new build could sit on the server for
 *    hours while the phone showed the old one, and the only reliable fix was to
 *    force-quit the app. Now the page is fetched with the HTTP cache bypassed,
 *    and the app is told when a new worker is waiting.
 *
 * 2. **A cold start with no signal has to work.** Without a worker, opening the
 *    app in a basement after the browser has dropped it from memory is a blank
 *    screen: the local database is full of the user's sets and there is no code
 *    to read it with. That is not an offline-first app.
 *
 * Bundled by `plugin.ts` into `dist/sw.js`, which substitutes the two constants
 * below. Nothing here is imported by the app.
 */
import { cacheName, isImmutable, staleCaches, strategyFor } from './policy.js';

/** Every file in `dist` worth precaching, relative to the scope. */
declare const __PRECACHE__: readonly string[];
/** A hash of those files and their contents. Changes only when they do. */
declare const __BUILD_ID__: string;

// `self` is typed as a plain worker global. Casting once, here, is cleaner than
// redeclaring the global and colliding with the DOM lib the app is built with.
const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE = cacheName(__BUILD_ID__);
const SCOPE = sw.registration.scope;
/** Every navigation falls back to this one document — the app is a SPA. */
const SHELL = new URL('index.html', SCOPE).href;

sw.addEventListener('install', (event) => {
  event.waitUntil(precache());
});

sw.addEventListener('activate', (event) => {
  event.waitUntil(takeOver());
});

/**
 * The app asking to be updated now.
 *
 * `skipWaiting` is deliberately not called on install. A worker that activates
 * the moment it downloads swaps the assets under a running page — which, in a
 * logger, can mean the JavaScript chunk that was about to save a set is gone.
 * The new build waits until the user taps Reload.
 */
sw.addEventListener('message', (event) => {
  const data: unknown = event.data;
  if (typeof data === 'object' && data !== null && (data as { type?: unknown }).type === 'reload') {
    void sw.skipWaiting();
  }
});

sw.addEventListener('fetch', (event) => {
  const { request } = event;
  const strategy = strategyFor(
    { method: request.method, url: request.url, isNavigation: request.mode === 'navigate' },
    SCOPE,
  );

  // Not calling respondWith at all is the correct way to stay out of it: the
  // browser handles the request exactly as it would with no worker installed.
  if (strategy === 'passthrough') return;

  event.respondWith(strategy === 'network-first' ? shell(request) : asset(request));
});

async function precache(): Promise<void> {
  const cache = await caches.open(CACHE);
  // Opened before anything is fetched: most of an update is files this device
  // already has, byte for byte, under the same fingerprinted names.
  const previous = await Promise.all(
    staleCaches(await caches.keys(), CACHE).map((name) => caches.open(name)),
  );
  await Promise.all(__PRECACHE__.map((path) => store(cache, previous, path)));
}

async function store(cache: Cache, previous: readonly Cache[], path: string): Promise<void> {
  const url = new URL(path, SCOPE).href;

  if (isImmutable(path)) {
    for (const old of previous) {
      const carried = await old.match(url);
      if (carried !== undefined) {
        await cache.put(url, carried);
        return;
      }
    }
  }

  try {
    // `no-store`, because the point of installing is to hold the *new* build.
    // Filling this from the HTTP cache would precache the version being
    // replaced and make the update a no-op — which is the bug this worker was
    // written to fix, reintroduced one layer down.
    const response = await fetch(url, { cache: 'no-store' });
    if (response.ok) await cache.put(url, response);
  } catch (error) {
    // One unreachable file must not fail the install. `cache.addAll` is
    // all-or-nothing, so a single 404 there would leave the user with no worker
    // at all — and the runtime cache below fills the gap on first use anyway.
    console.warn('[sw] could not precache', path, error);
  }
}

async function takeOver(): Promise<void> {
  const names = await caches.keys();
  await Promise.all(staleCaches(names, CACHE).map((name) => caches.delete(name)));
  await sw.clients.claim();
}

/** The document: network, then the cached copy. */
async function shell(request: Request): Promise<Response> {
  try {
    // Bypassing the HTTP cache here is the whole first half of this file. Ten
    // minutes of `max-age` on the shell is what made a deploy invisible.
    const response = await fetch(request.url, { cache: 'no-store', credentials: 'same-origin' });
    if (response.ok) {
      const cache = await caches.open(CACHE);
      await cache.put(SHELL, response.clone());
      // A redirected response cannot be handed back for a navigation — the
      // browser rejects it outright — so it is copied into a plain one.
      return response.redirected ? clean(response) : response;
    }
    return response;
  } catch {
    const cached = await caches.match(SHELL, { cacheName: CACHE });
    if (cached !== undefined) return cached;
    // No network and nothing cached: the first ever load, offline. Say so in
    // words, because the alternative is the browser's own error page claiming
    // the site does not exist.
    return new Response('g7m is not available offline until it has loaded once.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

/** Everything else under the scope: cache, then network. */
async function asset(request: Request): Promise<Response> {
  const cached = await caches.match(request, { cacheName: CACHE });
  if (cached !== undefined) return cached;

  const response = await fetch(request);
  // Only a complete, same-origin 200 is worth storing. A 206 is one slice of a
  // video and a cached slice would be served as if it were the whole file.
  if (response.status === 200 && response.type === 'basic') {
    const cache = await caches.open(CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

function clean(response: Response): Response {
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
