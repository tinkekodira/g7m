/**
 * The local database, and when it is allowed to talk to the server.
 *
 * Opening it is cheap and works offline; connecting is what needs a session.
 * The two are deliberately separate calls, because the app has to be able to
 * read a workout in a basement with no signal and no valid token, and a design
 * that opens the database only once sync is available fails exactly there.
 *
 * ## Storage is asked for first
 *
 * `navigator.storage.persist()` runs before the database is opened, not after.
 * Unrequested origin storage is evictable — WebKit clears it after roughly
 * seven days of disuse, which for an app whose users may not train for a
 * fortnight is a data-loss bug rather than a housekeeping detail (ADR-0026).
 * Asking afterwards would leave a window in which the database exists and is
 * still evictable, and the Phase 2a measurement showed iOS does grant it when
 * asked.
 *
 * A refusal is not fatal and does not stop anything here. It means the synced
 * copy is the durable one, which the home screen already says in those words.
 */
import { PowerSyncDatabase, WASQLiteVFS } from '@powersync/web';
import { AppSchema } from '@g7m/db';
import { env } from '../env.js';
import { requestPersistenceOnce } from '../storage.js';
import { createConnector, type ConnectorEvents } from './connector.js';

/**
 * `OPFSCoopSyncVFS`, chosen by measurement rather than by default.
 *
 * The Phase 0 spike probed all four backends on a physical iPhone (iOS 18.7),
 * on WebView2, and on Chromium. Three passed everywhere. `OPFSWriteAheadVFS` —
 * the newest, and the fastest to write on desktop — **failed on WebKit**, which
 * is the one engine that is not optional: on iOS the app ships as a Home Screen
 * web app, so WebKit is the only engine it ever runs in (ADR-0026).
 *
 * `IDBBatchAtomicVFS` remains the fallback if OPFS is ever unavailable. It
 * passed too, at roughly half the write speed, which is affordable.
 */
const VFS = WASQLiteVFS.OPFSCoopSyncVFS;

/** Bumping this name discards every local database. Do not, casually. */
const DATABASE_FILE = 'g7m.db';

let database: PowerSyncDatabase | null = null;

/**
 * The one PowerSync database.
 *
 * A module singleton for the same reason the Supabase client is one: a second
 * instance means a second write queue over the same OPFS file, and two
 * processes disagreeing about what has been uploaded.
 */
export function getDatabase(): PowerSyncDatabase {
  database ??= new PowerSyncDatabase({
    schema: AppSchema,
    database: { dbFilename: DATABASE_FILE, vfs: VFS },
  });
  return database;
}

/** Whether a PowerSync instance is configured at all. */
export function isSyncConfigured(): boolean {
  return env.VITE_POWERSYNC_URL !== '';
}

/**
 * Open the local database, and ask for durable storage on the way past.
 *
 * Safe to call before sign-in and safe to call more than once. Does not connect.
 *
 * **The persistence request is started, not awaited.** It used to be awaited,
 * and that put an advisory browser API on the critical path of every read in
 * the app: a `navigator.storage` that never answers — Brave with shields up is
 * one — left this promise pending for ever, so every screen sat on "Loading"
 * with no error to show, because a promise that never settles is not something
 * a `catch` can see.
 *
 * Persistence asks the browser not to evict the database. It is worth asking
 * for and it is worth nothing to wait for: the answer changes what the Home
 * screen says about storage, and nothing else. `requestPersistenceOnce` caches
 * the promise, so whoever wants the answer still gets the same one.
 */
export async function openDatabase(): Promise<PowerSyncDatabase> {
  void requestPersistenceOnce();
  const db = getDatabase();
  await db.init();
  return db;
}

/**
 * Start syncing.
 *
 * Call once a session exists. Without a configured instance this is a no-op
 * rather than an error: the app is fully usable offline, and a missing
 * `VITE_POWERSYNC_URL` during development should not break the logger.
 */
export async function connectSync(events: ConnectorEvents = {}): Promise<boolean> {
  if (!isSyncConfigured()) return false;
  const db = await openDatabase();
  await db.connect(createConnector(events));
  return true;
}

/**
 * Stop syncing, keeping the local data.
 *
 * This is the sign-out path, and it deliberately does not clear anything. The
 * queue may still hold writes that belong to the user who is leaving, and
 * `disconnectAndClear()` would delete them along with everything else.
 */
export async function disconnectSync(): Promise<void> {
  if (database === null) return;
  await database.disconnect();
}

/**
 * Stop syncing and delete every local row.
 *
 * For switching accounts on a shared device, where leaving one user's training
 * history in another user's local database would be worse than the cost of a
 * full re-sync. Discards anything still queued, so it is not the ordinary
 * sign-out.
 */
export async function disconnectAndClear(): Promise<void> {
  if (database === null) return;
  await database.disconnectAndClear();
}
