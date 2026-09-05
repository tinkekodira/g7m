import { useEffect } from 'react';
import { useAuthStore } from './auth/auth-store.js';
import { SignInScreen } from './auth/SignInScreen.js';
import { HomeScreen } from './screens/HomeScreen.js';

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

  // Returning the unsubscribe matters: StrictMode runs this twice in
  // development, and a leaked listener means every auth event handled twice.
  useEffect(() => initialize(), [initialize]);

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
