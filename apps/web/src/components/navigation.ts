/**
 * The tab bar's five destinations, and which of them a screen belongs to.
 *
 * Home sits in the middle, where a thumb rests, with Friends and Profile
 * either side of it. Learn and Settings take the ends. Progress is a tile on
 * Home rather than a tab: it is read after a workout, from the screen a
 * workout ends on, and the bar's slot went to the one destination that is not
 * reachable from anywhere else (ADR-0105).
 *
 * Kept apart from the component so the mapping can be tested without a DOM:
 * it decides what the bar says about where you are, and a bar that lights the
 * wrong tab is worse than none.
 */

export const TABS = [
  { id: 'learn', path: '/learn', label: 'Learn' },
  { id: 'friends', path: '/friends', label: 'Friends' },
  { id: 'home', path: '/', label: 'Home' },
  { id: 'profile', path: '/profile', label: 'Profile' },
  { id: 'settings', path: '/settings', label: 'Settings' },
] as const;

export type Tab = (typeof TABS)[number];
export type TabId = Tab['id'];

/**
 * Which tab a screen belongs to, so the bar still says where you are two taps
 * in.
 *
 * A screen deeper than a tab lights the tab it belongs under: the exercise
 * library is part of Learn, a friend's page and their workouts are part of
 * Friends, and the metrics and goal screens are part of Profile, which is
 * where their numbers are shown. Today's plan, the calendar, the routines and
 * Progress are opened from Home and light Home — Progress included, now that
 * it is a tile there rather than a tab, along with every workout and chart
 * under it.
 *
 * Null for the workout itself. The logger is a place you are *in* rather than
 * one you pass through, it pins its own bars to the bottom of the screen, and a
 * row of other destinations under a thumb mid-set is five ways to leave a
 * workout by accident.
 */
export function tabFor(pathname: string): TabId | null {
  const path = pathname.replace(/\/+$/, '') || '/';

  if (under(path, '/workout')) return null;
  if (
    path === '/' ||
    under(path, '/plan') ||
    under(path, '/calendar') ||
    under(path, '/routines') ||
    under(path, '/progress')
  ) {
    return 'home';
  }
  if (under(path, '/learn') || under(path, '/exercises')) return 'learn';
  if (under(path, '/friends')) return 'friends';
  if (
    under(path, '/profile') ||
    under(path, '/you') ||
    under(path, '/goal') ||
    under(path, '/achievements')
  ) {
    return 'profile';
  }
  if (under(path, '/settings')) return 'settings';
  // Anything else is about to be sent home by the catch-all route.
  return 'home';
}

/** The path itself or anything below it — `/progress` and `/progress/session/1`, not `/progressive`. */
function under(path: string, root: string): boolean {
  return path === root || path.startsWith(`${root}/`);
}
