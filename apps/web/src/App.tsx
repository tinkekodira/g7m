import { Suspense, lazy, useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router';
import { useAuthStore } from './auth/auth-store.js';
import { SignInScreen } from './auth/SignInScreen.js';
import { ResetPasswordScreen } from './auth/ResetPasswordScreen.js';
import { HomeScreen } from './screens/HomeScreen.js';
import { TabLayout } from './components/TabLayout.js';
import { ScreenFallback } from './components/ScreenFallback.js';
import { useCatalogue } from './lib/db/use-catalogue.js';
import { useSyncStore } from './lib/powersync/sync-store.js';
import { UpdateBanner } from './components/UpdateBanner.js';
import { RouteBoundary } from './components/ErrorBoundary.js';
import { useNativeShell } from './lib/native/use-native-shell.js';
import { lazyScreen, preloadWhenIdle } from './lib/lazy-screen.js';

/**
 * Every screen but Home, in a file of its own. ADR-0078.
 *
 * Home is the exception because it is where the app opens: loading it on
 * demand would put a fetch between the splash screen and the first thing
 * anybody sees, to save bytes on the one screen that always needs them.
 *
 * Everything else is deferred and then quietly fetched back — see
 * `preloadWhenIdle` below and the note in `lazy-screen.ts`. The point is not to
 * download less over a phone's life; it is to download and *parse* less before
 * the first paint.
 */
const ExerciseLibraryScreen = lazyScreen(
  () => import('./screens/ExerciseLibraryScreen.js'),
  'ExerciseLibraryScreen',
);
const ExerciseDetailScreen = lazyScreen(
  () => import('./screens/ExerciseDetailScreen.js'),
  'ExerciseDetailScreen',
);
const WorkoutScreen = lazyScreen(() => import('./screens/WorkoutScreen.js'), 'WorkoutScreen');
const LearnScreen = lazyScreen(() => import('./screens/LearnScreen.js'), 'LearnScreen');
const ProgressScreen = lazyScreen(() => import('./screens/ProgressScreen.js'), 'ProgressScreen');
const MetricsScreen = lazyScreen(() => import('./screens/MetricsScreen.js'), 'MetricsScreen');
const GoalScreen = lazyScreen(() => import('./screens/GoalScreen.js'), 'GoalScreen');
const PlanScreen = lazyScreen(() => import('./screens/PlanScreen.js'), 'PlanScreen');
const SessionDetailScreen = lazyScreen(
  () => import('./screens/SessionDetailScreen.js'),
  'SessionDetailScreen',
);
const ExerciseTrendScreen = lazyScreen(
  () => import('./screens/ExerciseTrendScreen.js'),
  'ExerciseTrendScreen',
);
const WelcomeScreen = lazyScreen(() => import('./screens/WelcomeScreen.js'), 'WelcomeScreen');
const ProfileScreen = lazyScreen(() => import('./screens/ProfileScreen.js'), 'ProfileScreen');
const SettingsScreen = lazyScreen(() => import('./screens/SettingsScreen.js'), 'SettingsScreen');
const CalendarScreen = lazyScreen(() => import('./screens/CalendarScreen.js'), 'CalendarScreen');
const AchievementsScreen = lazyScreen(
  () => import('./screens/AchievementsScreen.js'),
  'AchievementsScreen',
);
const RoutinesScreen = lazyScreen(() => import('./screens/RoutinesScreen.js'), 'RoutinesScreen');
const RoutineDetailScreen = lazyScreen(
  () => import('./screens/RoutineDetailScreen.js'),
  'RoutineDetailScreen',
);

/**
 * The screens worth having ready before they are asked for: the four other
 * tabs, and the workout.
 *
 * The workout is in the list despite not being a tab because it is what the
 * app is for, and because the tap that opens it is usually made standing at a
 * rack. The rest — the calendar, a single exercise, the achievements grid —
 * are opened deliberately, from a screen that is already up, and load fast
 * enough on demand.
 */
const WARM = [LearnScreen, ProgressScreen, ProfileScreen, SettingsScreen, WorkoutScreen];

/**
 * The two watchers that run everywhere, also loaded on demand.
 *
 * Neither draws anything most of the time, and neither is urgent: a badge
 * announced a quarter of a second into the app's life is a badge announced on
 * time, and a workout abandoned an hour ago can be closed a moment after
 * launch as easily as during it. What they cost in the entry chunk is real,
 * though — the achievements catalogue alone is 15 KB and grows with every
 * badge added, which is exactly the kind of weight that should not sit in
 * front of the first paint.
 */
const AchievementCelebrations = lazy(async () => ({
  default: (await import('./components/AchievementBanner.js')).AchievementCelebrations,
}));
const AbandonedWorkoutWatcher = lazy(async () => ({
  default: (await import('./components/AbandonedWorkout.js')).AbandonedWorkoutWatcher,
}));

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

  // The status bar, the splash screen and Android's back button, in the native
  // builds only (ADR-0074). The splash goes once the session is known, which is
  // the first moment there is a screen worth showing.
  useNativeShell(status !== 'loading');

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
    <Suspense fallback={<ScreenFallback />}>
      <Routes>
        <Route path="/welcome/:step" element={<WelcomeScreen />} />
        <Route path="*" element={<WelcomeScreen />} />
      </Routes>
    </Suspense>
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
  // The other tabs and the workout, fetched during the first quiet moment so
  // that the bar at the bottom stays as instant as it looks. ADR-0078.
  useEffect(() => preloadWhenIdle(WARM), []);

  return (
    <>
      <AppScreens />
      {/* No fallback: there is nothing to show while these load, and a
          placeholder would be a placeholder for a banner that usually never
          appears. */}
      <Suspense fallback={null}>
        {/* Beside the routes rather than in one, so a badge earned mid-set is
            announced on the workout screen, where it was earned. ADR-0072. */}
        <AchievementCelebrations />
        {/* Likewise: the commonest way a workout is abandoned is the app being
            closed with it open, and then nothing on the workout screen is
            running to notice. ADR-0077. */}
        <AbandonedWorkoutWatcher />
      </Suspense>
    </>
  );
}

function AppScreens() {
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
        <Route path="/achievements" element={<AchievementsScreen />} />
        <Route path="/routines" element={<RoutinesScreen />} />
        <Route path="/routines/:routineId" element={<RoutineDetailScreen />} />
        <Route path="/progress/session/:sessionId" element={<SessionDetailScreen />} />
        <Route path="/progress/exercise/:exerciseId" element={<ExerciseTrendScreen />} />
      </Route>
      {/* Its own boundary and its own fallback: the workout is the one screen
          outside the tab layout, so there is no shell around it to put either
          in. */}
      <Route
        path="/workout"
        element={
          <RouteBoundary>
            <Suspense fallback={<ScreenFallback />}>
              <WorkoutScreen />
            </Suspense>
          </RouteBoundary>
        }
      />
      {/* A leftover auth fragment, a bookmark from a build that named
            routes differently, a typo — and `/welcome/goal`, one render after
            the last question is answered. Home is a better answer than a blank
            page, and `replace` keeps the bad URL out of the back button. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
