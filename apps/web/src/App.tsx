import { useEffect } from 'react';
import { useAuthStore } from './auth/auth-store.js';
import { SignInScreen } from './auth/SignInScreen.js';
import { HomeScreen } from './screens/HomeScreen.js';
import { useSyncStore } from './lib/powersync/sync-store.js';

/**
 * The auth gate.
 *
 * There is deliberately no router yet. One gate and one screen do not need
 * route matching, and React Router lands in Phase 3 alongside the first real
 * navigation — with the WebView caveat from DECISIONS.md ADR-0013 to check.
 */
export function App() {
  const status = useAuthStore((s) => s.status);
  const initialize = useAuthStore((s) => s.initialize);
  const startSync = useSyncStore((s) => s.start);
  const stopSync = useSyncStore((s) => s.stop);

  // Returning the unsubscribe matters: StrictMode runs this twice in
  // development, and a leaked listener means every auth event handled twice.
  useEffect(() => initialize(), [initialize]);

  /**
   * Sync follows the session, not the screen.
   *
   * Started here rather than in HomeScreen because it must survive navigation
   * once Phase 3 adds routes — a sync connection that restarts on every screen
   * change would re-download buckets for no reason and lose queued uploads to
   * the churn.
   *
   * Sign-out disconnects but deliberately does not clear: the queue can still
   * hold writes belonging to the user who is leaving.
   */
  useEffect(() => {
    if (status !== 'signed-in') return;

    let stopped = false;
    let unsubscribe: (() => void) | null = null;

    void startSync().then(
      (listener) => {
        // The effect may have been torn down while connecting.
        if (stopped) {
          listener();
          void stopSync();
          return;
        }
        unsubscribe = listener;
      },
      (error: unknown) => {
        // Sync failing must never stop the app rendering. Everything below
        // works from the local database, which is the entire point.
        console.error('Could not start sync', error);
      },
    );

    return () => {
      stopped = true;
      unsubscribe?.();
      void stopSync();
    };
  }, [status, startSync, stopSync]);

  if (status === 'loading') {
    return (
      <main className="flex min-h-full items-center justify-center px-4">
        {/* No spinner. Restoring a session from storage is near-instant, and a
            spinner that flashes for 40ms reads as jank rather than progress. */}
        <p className="text-sm text-muted">Loading…</p>
      </main>
    );
  }

  return status === 'signed-in' ? <HomeScreen /> : <SignInScreen />;
}
