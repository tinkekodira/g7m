/**
 * Persistent storage.
 *
 * The Phase 0 spike found `navigator.storage.persisted()` returning `false` on
 * Chromium, WebView2 and WebKit — but the harness only ever *queried* it. That
 * is "nobody asked", not "the browser refused", and the difference decides
 * whether a workout history survives.
 *
 * Unrequested origin storage is evictable. WebKit clears it after roughly seven
 * days of disuse, which for an app whose users may not train for a fortnight is
 * a data-loss bug waiting to happen. So: ask, at startup, before PowerSync
 * opens a database into it.
 *
 * See DECISIONS.md ADR-0026.
 */

export type PersistenceState =
  /** The browser guarantees the data until the user clears it explicitly. */
  | 'granted'
  /** Asked and refused. Data is evictable — the app must expect to lose it. */
  | 'denied'
  /** No Storage API. Old engine, or a non-secure context. */
  | 'unsupported'
  /** The call threw. Some engines throw in private browsing. */
  | 'error';

export interface PersistenceReport {
  readonly state: PersistenceState;
  /** Bytes the origin is allowed, when the engine will say. */
  readonly quotaBytes: number | null;
  readonly usageBytes: number | null;
}

/**
 * Request persistent storage, or confirm we already have it.
 *
 * Idempotent and cheap to call more than once: if permission is already
 * granted, this returns without prompting anything.
 *
 * `storage` is injectable so the decision logic can be tested without a
 * browser — the branches here are exactly the ones that are painful to
 * reproduce by hand.
 */
export async function ensurePersistentStorage(
  storage: StorageManager | undefined = globalThis.navigator?.storage,
): Promise<PersistenceReport> {
  if (storage === undefined || typeof storage.persist !== 'function') {
    return { state: 'unsupported', quotaBytes: null, usageBytes: null };
  }

  let quotaBytes: number | null = null;
  let usageBytes: number | null = null;
  try {
    const estimate = await storage.estimate();
    quotaBytes = estimate.quota ?? null;
    usageBytes = estimate.usage ?? null;
  } catch {
    // An unavailable estimate says nothing about persistence. Carry on.
  }

  try {
    // Checking first matters: `persist()` can re-prompt on some engines, and
    // there is nothing to gain by asking for what we already hold.
    if (await storage.persisted()) {
      return { state: 'granted', quotaBytes, usageBytes };
    }
    const granted = await storage.persist();
    return { state: granted ? 'granted' : 'denied', quotaBytes, usageBytes };
  } catch {
    return { state: 'error', quotaBytes, usageBytes };
  }
}

const MEGABYTE = 1024 * 1024;

export function formatBytes(bytes: number | null): string {
  if (bytes === null) return 'unknown';
  if (bytes < MEGABYTE) return `${String(Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 * MEGABYTE) return `${String(Math.round(bytes / MEGABYTE))} MB`;
  return `${(bytes / (1024 * MEGABYTE)).toFixed(1)} GB`;
}

/** What to tell the user, in their terms rather than the spec's. */
export function describePersistence(state: PersistenceState): string {
  switch (state) {
    case 'granted':
      return 'Your workouts are stored permanently on this device.';
    case 'denied':
      return (
        'This device may clear your offline data if storage runs low or ' +
        'you do not open the app for a while. Sign in stays available, so ' +
        'nothing already synced is lost.'
      );
    case 'unsupported':
      return 'This browser cannot guarantee offline storage.';
    case 'error':
      return 'Could not check offline storage on this device.';
  }
}

/**
 * The app-wide request, made exactly once.
 *
 * Both the UI and (from Phase 2) the PowerSync bootstrap need the answer, and
 * neither should trigger a second permission check. Whoever asks first starts
 * it; everyone else awaits the same promise.
 */
let pending: Promise<PersistenceReport> | null = null;

export function requestPersistenceOnce(): Promise<PersistenceReport> {
  pending ??= ensurePersistentStorage();
  return pending;
}
