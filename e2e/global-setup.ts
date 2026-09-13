import { startFakeBackend } from './fake-backend/server.js';
import { BACKEND_PORT } from './tests/support/urls.js';

/**
 * Start the fake backend for the whole run, and stop it after.
 *
 * Fresh every run — the migrations apply in about a second — so no test can
 * depend on what an earlier run left behind. Within a run, tests keep out of
 * each other's way by each signing up a user of their own.
 */
export default async function globalSetup(): Promise<() => Promise<void>> {
  const backend = await startFakeBackend(BACKEND_PORT);
  return () => backend.close();
}
