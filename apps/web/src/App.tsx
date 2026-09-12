import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router';
import { useAuthStore } from './auth/auth-store.js';
import { SignInScreen } from './auth/SignInScreen.js';
import { ResetPasswordScreen } from './auth/ResetPasswordScreen.js';
import { HomeScreen } from './screens/HomeScreen.js';
import { ExerciseLibraryScreen } from './screens/ExerciseLibraryScreen.js';
import { ExerciseDetailScreen } from './screens/ExerciseDetailScreen.js';
import { WorkoutScreen } from './screens/WorkoutScreen.js';
import { LearnScreen } from './screens/LearnScreen.js';
import { ProgressScreen } from './screens/ProgressScreen.js';
import { MetricsScreen } from './screens/MetricsScreen.js';
import { GoalScreen } from './screens/GoalScreen.js';
import { PlanScreen } from './screens/PlanScreen.js';
import { SessionDetailScreen } from './screens/SessionDetailScreen.js';
import { ExerciseTrendScreen } from './screens/ExerciseTrendScreen.js';
import { WelcomeScreen } from './screens/WelcomeScreen.js';
import { ProfileScreen } from './screens/ProfileScreen.js';
import { SettingsScreen } from './screens/SettingsScreen.js';
import { CalendarScreen } from './screens/CalendarScreen.js';
import { TabLayout } from './components/TabLayout.js';
import { useCatalogue } from './lib/db/use-catalogue.js';
import { useSyncStore } from './lib/powersync/sync-store.js';
import { UpdateBanner } from './components/UpdateBanner.js';

/**
 * The auth gate.
 *
 * The router is mounted inside the gate, not around it. See ADR-0034: a
 * HashRouter owns `location.hash`, and the signed-out half of the app is
 * exactly where an auth callback can arrive carrying one.
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
   * Started here rather than in a screen because it has to survive navigation:
   * a sync connection that restarted on every route change would re-download
   * buckets for no reason and lose queued uploads to the churn.
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

  return (
    <>
      {/* Recovery sits between the two, not inside either. It is a live
          session that must not reach the app, and not a signed-out state that
          could show the form the user has just proved they cannot get past. */}
      {status === 'signed-in' ? (
        <SignedIn />
      ) : status === 'recovering' ? (
        <ResetPasswordScreen />
      ) : (
        <SignInScreen />
      )}
      {/* Outside both the auth branch and the router, on purpose. A build can
          go stale on the sign-in screen too — and that is the screen someone is
          stuck on when it does — and an update prompt that depended on a route
          matching would vanish on exactly the URL that needed fixing. */}
      <UpdateBanner />
    </>
  );
}

/**
 * Every route in the app, all of them behind the auth gate.
 *
 * `HashRouter` rather than `BrowserRouter`, for two independent reasons that
 * happen to agree — the WebView custom schemes from ADR-0013 and the relative
 * asset base from ADR-0027. ADR-0034 has the argument.
 */
function SignedIn() {
  return (
    <HashRouter>
      <Gate />
    </HashRouter>
  );
}

/**
 * The new-account questions, or the app. Never both, and never a redirect
 * between them.
 *
 * The obvious shape for this is a guard that redirects to `/welcome`, and it
 * has a race that is invisible until it bites. `useCatalogue` deliberately does
 * not report `loading` on a re-read — flashing a spinner over data that is
 * already on screen is worse than useless — so for a moment after the flow
 * writes `onboarded_at`, a guard still holds the old row saying it is null. It
 * would send somebody who had just answered the last question back to the
 * first one.
 *
 * Swapping which routes exist has no such moment. When the re-read lands the
 * app's routes are simply what is mounted, and the welcome URL falls through
 * to the catch-all that already sends unknown paths home.
 *
 * **Fails open.** Onboarding shows only when there is a profile row that says
 * the questions are unanswered. A row that has not synced yet reads as null,
 * and treating that as "not onboarded" would offer a returning user a flow
 * whose writes have nothing to write to — and on a device that never gets a
 * connection, lock them out of an app that is supposed to work offline. Being
 * asked a moment late is the cheaper mistake.
 */
function Gate() {
  const profile = useCatalogue('profile', (r) => r.profile.current());
  const asking = profile.data !== null && profile.data.onboardedAt === null;

  return asking ? <WelcomeRoutes /> : <AppRoutes />;
}

/**
 * While the questions are unanswered, they are the only thing there is.
 *
 * Anything that is not a step lands on `WelcomeScreen` without one, which is
 * how it knows to resume at the first question still needing an answer.
 */
function WelcomeRoutes() {
  return (
    <Routes>
      <Route path="/welcome/:step" element={<WelcomeScreen />} />
      <Route path="*" element={<WelcomeScreen />} />
    </Routes>
  );
}

/**
 * The app's screens, all but one under the tab bar.
 *
 * The workout is the exception. It is somewhere you are *in* rather than
 * somewhere you pass through, it pins its own bars — rest timer, undo, "still
 * training?" — to the bottom of the screen, and five other destinations under
 * a thumb mid-set are five ways to leave a workout by accident. Its header
 * link and Finish are the ways out.
 */
function AppRoutes() {
  return (
    <Routes>
      <Route element={<TabLayout />}>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/learn" element={<LearnScreen />} />
        <Route path="/progress" element={<ProgressScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/exercises" element={<ExerciseLibraryScreen />} />
        <Route path="/exercises/:slug" element={<ExerciseDetailScreen />} />
        <Route path="/you" element={<MetricsScreen />} />
        <Route path="/goal" element={<GoalScreen />} />
        <Route path="/plan" element={<PlanScreen />} />
        <Route path="/calendar" element={<CalendarScreen />} />
        <Route path="/progress/session/:sessionId" element={<SessionDetailScreen />} />
        <Route path="/progress/exercise/:exerciseId" element={<ExerciseTrendScreen />} />
      </Route>
      <Route path="/workout" element={<WorkoutScreen />} />
      {/* A leftover auth fragment, a bookmark from a build that named
            routes differently, a typo — and `/welcome/goal`, one render after
            the last question is answered. Home is a better answer than a blank
            page, and `replace` keeps the bad URL out of the back button. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
