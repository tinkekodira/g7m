import { Suspense, useLayoutEffect } from 'react';
import { NavigationType, Outlet, useLocation, useMatch, useNavigationType } from 'react-router';
import { TabBar } from './TabBar.js';
import { RouteBoundary } from './ErrorBoundary.js';
import { ScreenFallback } from './ScreenFallback.js';
import { isAlarming, useSyncAlarm } from '../lib/powersync/use-sync-alarm.js';

/**
 * Shared screens, with a full-screen exception for saved-workout recaps.
 *
 * The padding is the bar's height, so the last card on a screen can always be
 * scrolled clear of it. The safe area under the bar is already in each
 * screen's own bottom padding.
 */
export function TabLayout() {
  useScrollToTop();
  const alarm = useSyncAlarm();
  const recap = useMatch('/progress/session/:sessionId') !== null;

  return (
    <>
      <div className={recap ? undefined : 'pb-16'}>
        {/* Tabbed routes keep their navigation while loading or recovering
            from an error (ADR-0078). Recaps use the full height and their own
            Done action instead. */}
        <RouteBoundary>
          <Suspense fallback={<ScreenFallback />}>
            <Outlet />
          </Suspense>
        </RouteBoundary>
      </div>
      {!recap && <TabBar alert={isAlarming(alarm)} />}
    </>
  );
}

/**
 * A new screen starts at its top.
 *
 * One document scrolls for every route, so without this, switching from a
 * Progress screen scrolled to its workout list landed on Home scrolled just as
 * far — the top half of Home out of sight and no sign it was there. Before
 * paint, so the old position is never drawn.
 *
 * Going *back* is left alone. Returning from a workout's detail to the list it
 * was opened from should find the list where it was left.
 */
function useScrollToTop(): void {
  const { pathname } = useLocation();
  const navigation = useNavigationType();

  useLayoutEffect(() => {
    if (navigation === NavigationType.Pop) return;
    globalThis.scrollTo(0, 0);
  }, [pathname, navigation]);
}
