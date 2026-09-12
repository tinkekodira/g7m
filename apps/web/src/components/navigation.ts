/**
 * The tab bar's five destinations, and which of them a screen belongs to.
 *
 * Home sits in the middle, where a thumb rests, with Progress and Profile
 * either side of it — the three somebody opens most. Learn and Settings take
 * the ends.
 *
 * Kept apart from the component so the mapping can be tested without a DOM:
 * it decides what the bar says about where you are, and a bar that lights the
 * wrong tab is worse than none.
 */

export const TABS = [
  { id: 'learn', path: '/learn', label: 'Learn' },
  { id: 'progress', path: '/progress', label: 'Progress' },
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
 * A screen deeper than a tab lights the tab it belongs under: one workout's
 * detail is part of Progress, the exercise library is part of Learn, and the
 * metrics and goal screens are part of Profile, which is where their numbers
 * are shown. Today's plan is opened from Home and lights Home.
 *
 * Null for the workout itself. The logger is a place you are *in* rather than
 * one you pass through, it pins its own bars to the bottom of the screen, and a
 * row of other destinations under a thumb mid-set is five ways to leave a
 * workout by accident.
 */
export function tabFor(pathname: string): TabId | null {
  const path = pathname.replace(/\/+$/, '') || '/';

  if (under(path, '/workout')) return null;
  if (path === '/' || under(path, '/plan')) return 'home';
  if (under(path, '/learn') || under(path, '/exercises')) return 'learn';
  if (under(path, '/progress')) return 'progress';
  if (under(path, '/profile') || under(path, '/you') || under(path, '/goal')) return 'profile';
  if (under(path, '/settings')) return 'settings';
  // Anything else is about to be sent home by the catch-all route.
  return 'home';
}

/** The path itself or anything below it — `/progress` and `/progress/session/1`, not `/progressive`. */
function under(path: string, root: string): boolean {
  return path === root || path.startsWith(`${root}/`);
}
