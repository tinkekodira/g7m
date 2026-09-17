import { type ComponentType, type LazyExoticComponent, lazy } from 'react';

/**
 * A screen that arrives in its own file, and can be sent for early.
 *
 * Every screen but Home is loaded on demand (ADR-0078). The entry chunk is
 * what a phone downloads and parses before it can draw anything, and putting
 * fifteen screens in it meant paying for the calendar, the exercise library
 * and the achievements grid in order to look at Home.
 *
 * `preload` is the other half of that bargain. Splitting a screen out makes
 * the *first* paint cheaper and the *first tap* on a tab more expensive, which
 * would be a bad trade on its own — the tab bar is meant to feel instant. So
 * the screens behind the tab bar are fetched during the first idle moment
 * after the app is up, and are in memory long before a thumb reaches them.
 *
 * Nothing here is a network request on a phone that has the app installed: the
 * service worker precaches every built file, so these come out of the cache.
 * What is being deferred is the parsing and evaluating, which is the part a
 * slow phone actually feels.
 */
export type LazyScreen = LazyExoticComponent<ComponentType> & {
  /** Start fetching now, ignoring the result. Safe to call repeatedly. */
  readonly preload: () => void;
};

/**
 * `React.lazy` for a module that exports its screen by name.
 *
 * The app has no default exports — a named export is what makes a screen
 * findable by search and renameable by a tool — so every one of these needs
 * the same three-line adapter. This is that adapter, once.
 */
export function lazyScreen<Name extends string>(
  load: () => Promise<Record<Name, ComponentType>>,
  name: Name,
): LazyScreen {
  const component = lazy(async () => ({ default: (await load())[name] }));

  return Object.assign(component, {
    preload: () => {
      // A warm-up that fails is not an error worth reporting: the module is
      // fetched again when the screen is actually opened, and *that* failure
      // reaches the crash screen, which knows to offer a reload. Swallowing it
      // here only means the tap is as slow as it would have been anyway.
      void load().catch(() => undefined);
    },
  });
}

/**
 * Fetch these once the app has nothing better to do.
 *
 * Idle rather than immediate, because the first seconds after launch are spent
 * opening the database, restoring the session and starting sync — all of which
 * the person is waiting on, and none of which should queue behind five screens
 * nobody has asked for yet.
 *
 * `requestIdleCallback` is still missing from Safari, which is most of this
 * app's users, so the fallback is not a rare path: it is the iPhone path. A
 * timeout is a blunter instrument but it is aiming at the same moment.
 */
export function preloadWhenIdle(screens: readonly LazyScreen[], delayMs = 2_000): () => void {
  const run = (): void => {
    for (const screen of screens) screen.preload();
  };

  const idle = globalThis.requestIdleCallback as typeof globalThis.requestIdleCallback | undefined;
  if (typeof idle === 'function') {
    const handle = idle(run, { timeout: delayMs * 2 });
    return () => {
      globalThis.cancelIdleCallback(handle);
    };
  }

  const timer = setTimeout(run, delayMs);
  return () => {
    clearTimeout(timer);
  };
}
