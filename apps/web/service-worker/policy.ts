/**
 * What the service worker does with a request, and which caches it may delete.
 *
 * Split out of `sw.ts` because a service worker is close to untestable in
 * place — it needs a registration, a real origin and an install lifecycle — and
 * because getting this wrong is unusually expensive. A worker that caches the
 * wrong thing keeps serving it after the mistake is fixed, on a device that is
 * not in the room.
 */

export type Strategy =
  /** Ask the network, fall back to the cached copy. For the page itself. */
  | 'network-first'
  /** Serve the cached copy, fetch and cache on a miss. For hashed assets. */
  | 'cache-first'
  /** Do not intervene at all. For everything that is not ours. */
  | 'passthrough';

/** The parts of a `Request` the decision actually depends on. */
export interface RequestFacts {
  readonly method: string;
  readonly url: string;
  /** `request.mode === 'navigate'` — the browser asking for a document. */
  readonly isNavigation: boolean;
}

/**
 * `scope` is `registration.scope`: the absolute URL of the directory the worker
 * controls, with a trailing slash. On GitHub Pages that is
 * `https://user.github.io/g7m/`, in development `http://localhost:5173/`.
 */
export function strategyFor(request: RequestFacts, scope: string): Strategy {
  // A POST is a write. Replaying one from a cache would be a bug with
  // consequences; there is no version of this worker that should touch them.
  if (request.method !== 'GET') return 'passthrough';

  /**
   * Everything outside the scope goes straight to the network, untouched.
   *
   * This is the important line in the file. Supabase auth, PostgREST and the
   * PowerSync sync stream all run over GET at times, and a cached token
   * response or a cached sync checkpoint would be a correctness failure that
   * looks like a sync bug for weeks. PowerSync has its own durable store; it
   * does not want help.
   */
  if (!request.url.startsWith(scope)) return 'passthrough';

  // The document. Network-first because a stale shell is exactly the bug this
  // worker exists to fix, and because it is one small request.
  if (request.isNavigation) return 'network-first';

  // Everything else under the scope is a build artefact. Vite fingerprints the
  // ones that change, so a hit is always the right answer and never stale.
  return 'cache-first';
}

/**
 * Whether a built file at this path can be trusted to be the same bytes as the
 * file that was at that path in a previous build.
 *
 * True for everything Vite emits into `assets/`, because it fingerprints those
 * names with a hash of their contents — a matching path is therefore matching
 * bytes, and a new build can copy them out of the old cache instead of
 * fetching them again.
 *
 * That is not a micro-optimisation here. Four wa-sqlite WebAssembly binaries
 * account for about eight of this app's nine megabytes and change only when
 * the library is upgraded, so refetching them on every deploy would mean an
 * eight megabyte download, over cellular, to ship a fixed label.
 *
 * False for `index.html`, `manifest.webmanifest` and the icons, which keep
 * their names across builds and so have to be fetched to be trusted.
 */
export function isImmutable(path: string): boolean {
  return path.startsWith('assets/');
}

/**
 * Caches this worker owns. Anything else in `caches` belongs to someone else.
 */
const CACHE_PREFIX = 'g7m-app-';

export function cacheName(buildId: string): string {
  return `${CACHE_PREFIX}${buildId}`;
}

/**
 * The caches an activating worker should delete: its own, from older builds.
 *
 * Deliberately not "everything except the current one". `caches` is shared
 * across the whole origin, and clearing it wholesale would take out anything a
 * library stores there with it.
 */
export function staleCaches(existing: readonly string[], keep: string): string[] {
  return existing.filter((name) => name.startsWith(CACHE_PREFIX) && name !== keep);
}
