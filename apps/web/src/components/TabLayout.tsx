import { useLayoutEffect } from 'react';
import { NavigationType, Outlet, useLocation, useNavigationType } from 'react-router';
import { TabBar } from './TabBar.js';
import { isAlarming, useSyncAlarm } from '../lib/powersync/use-sync-alarm.js';

/**
 * Every screen with the tab bar under it.
 *
 * The padding is the bar's height, so the last card on a screen can always be
 * scrolled clear of it. The safe area under the bar is already in each
 * screen's own bottom padding.
 */
export function TabLayout() {
  useScrollToTop();
  const alarm = useSyncAlarm();

  return (
    <>
      <div className="pb-16">
        <Outlet />
      </div>
      <TabBar alert={isAlarming(alarm)} />
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
