/**
 * The two pages anyone can open without an account: the privacy policy and
 * how to delete an account. Both app stores link to them. ADR-0189.
 *
 * They are matched here, above the auth gate, rather than as routes inside
 * it, because the router only exists for a signed-in user (ADR-0034). A store
 * reviewer, or somebody who uninstalled the app and wants their data gone,
 * arrives signed out, possibly offline, possibly before the session has even
 * been read — and must still see the page, not the sign-in form.
 *
 * Hash URLs like everything else: GitHub Pages has no rewrites, so a real path
 * such as `/g7m/privacy` is a 404 before any JavaScript runs, while
 * `/g7m/#/privacy` is `index.html` from the server, and from the service
 * worker when offline.
 */
import { useSyncExternalStore } from 'react';

export type PublicPage = 'privacy' | 'delete-account';

/**
 * The links to them, as relative fragments, so they work under `/g7m/`, at a
 * development server's root and inside the native shells alike.
 *
 * Plain `href`s on purpose, never `navigate()`: the HashRouter changes the URL
 * with `pushState`, which fires no event, so this module would not notice.
 * Following a link fires `hashchange`.
 */
export const PUBLIC_PAGE_HREF: Readonly<Record<PublicPage, string>> = {
  privacy: '#/privacy',
  'delete-account': '#/delete-account',
};

/** The `id` of the delete-account panel in Settings, and the query that scrolls to it. */
export const DELETE_ACCOUNT_SECTION = 'delete-account';
export const DELETE_ACCOUNT_SETTINGS_HREF = `#/settings?section=${DELETE_ACCOUNT_SECTION}`;

/** Which public page a `location.hash` is, if any. A query string or a trailing slash is allowed. */
export function publicPageFor(hash: string): PublicPage | null {
  const path = (hash.startsWith('#') ? hash.slice(1) : hash).split('?')[0] ?? '';
  const trimmed = path.replace(/\/+$/, '');
  if (trimmed === '/privacy') return 'privacy';
  if (trimmed === '/delete-account') return 'delete-account';
  return null;
}

function subscribe(onChange: () => void): () => void {
  globalThis.addEventListener('hashchange', onChange);
  globalThis.addEventListener('popstate', onChange);
  return () => {
    globalThis.removeEventListener('hashchange', onChange);
    globalThis.removeEventListener('popstate', onChange);
  };
}

function snapshot(): PublicPage | null {
  return publicPageFor(globalThis.location.hash);
}

/** The public page the address bar is on now, following links and the back button. */
export function usePublicPage(): PublicPage | null {
  return useSyncExternalStore(subscribe, snapshot, () => null);
}
