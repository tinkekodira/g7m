import type { ComponentType } from 'react';
import { Link, useLocation } from 'react-router';
import { cx } from '@g7m/ui';
import { TABS, tabFor, type TabId } from './navigation.js';
import {
  HomeIcon,
  LearnIcon,
  ProfileIcon,
  ProgressIcon,
  SettingsIcon,
  type IconProps,
} from './icons.js';

const ICONS: Record<TabId, ComponentType<IconProps>> = {
  learn: LearnIcon,
  progress: ProgressIcon,
  home: HomeIcon,
  profile: ProfileIcon,
  settings: SettingsIcon,
};

/**
 * The bar along the bottom of every screen but the workout.
 *
 * The tab you are on is the accent colour with a pill behind its icon, and the
 * pill *moves* between tabs rather than jumping, so the eye follows the change
 * instead of hunting for it. Everything else is muted: one lit tab reads at a
 * glance, five competing ones do not.
 *
 * Links, not buttons, so a long-press, the back gesture and a screen reader's
 * link list all behave as they should, and `aria-current="page"` says which one
 * is here.
 *
 * `data-tab-bar` is what the stylesheet keys on to lift anything else pinned
 * to the bottom — the update banner — clear of it. See styles.css.
 */
export function TabBar({ alert = false }: { readonly alert?: boolean }) {
  const { pathname } = useLocation();
  const active = tabFor(pathname);
  const index = TABS.findIndex((tab) => tab.id === active);

  return (
    <nav
      data-tab-bar
      aria-label="Main"
      className="pb-safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-subtle bg-base/90 backdrop-blur-md"
    >
      <div className="relative mx-auto max-w-2xl">
        {index >= 0 && (
          <span
            aria-hidden
            className="pointer-events-none absolute top-2 left-0 flex w-1/5 justify-center transition-transform duration-300 ease-out"
            style={{ transform: `translateX(${String(index * 100)}%)` }}
          >
            <span className="h-8 w-14 rounded-full bg-accent-subtle" />
          </span>
        )}

        <ul className="grid grid-cols-5">
          {TABS.map((tab) => {
            const Icon = ICONS[tab.id];
            const here = tab.id === active;
            const flagged = tab.id === 'settings' && alert;

            return (
              <li key={tab.id}>
                <Link
                  to={tab.path}
                  aria-current={here ? 'page' : undefined}
                  // A tab tapped while you are already on it goes back to the
                  // top, which is what every phone has taught people to expect.
                  onClick={(event) => {
                    if (pathname !== tab.path) return;
                    event.preventDefault();
                    const reduced =
                      globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
                    globalThis.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
                  }}
                  className={cx(
                    'relative flex h-16 flex-col items-center gap-0.5 pt-2 text-xs font-medium select-none',
                    'transition-colors duration-200',
                    'focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-accent',
                    here ? 'text-accent' : 'text-muted hover:text-secondary',
                  )}
                >
                  <span className="relative flex h-8 w-14 items-center justify-center">
                    <Icon className="size-6" />
                    {flagged && (
                      <span className="absolute top-0.5 right-3 size-2.5 rounded-full bg-danger ring-2 ring-base" />
                    )}
                  </span>
                  <span>{tab.label}</span>
                  {flagged && <span className="sr-only">(needs attention)</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
