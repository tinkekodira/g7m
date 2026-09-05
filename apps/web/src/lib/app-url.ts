/**
 * Where the app lives, as an absolute URL.
 *
 * `location.origin` is not it. The app is served from a subpath on GitHub Pages
 * — `https://tinkekodira.github.io/g7m/` — and origin drops the path entirely,
 * so an OAuth round trip using it comes back to the wrong place.
 *
 * The failure mode is worse than a 404, because Supabase does not simply error
 * on an unlisted `redirectTo`: it silently falls back to the project's
 * `site_url`. With `site_url` pointing at a dev server, an iPhone finishing
 * Google sign-in was sent to `http://localhost:5173` and reported "Safari
 * can't open the page because it couldn't connect to the server" — a message
 * that says nothing about redirect allow-lists.
 */

/**
 * The directory URL of the current page, always ending in a slash.
 *
 * `href` is injectable so the cases can be tested; production passes the real
 * location.
 */
export function appBaseUrl(href: string = globalThis.location?.href ?? '/'): string {
  const url = new URL(href, 'http://localhost');
  url.hash = '';
  url.search = '';
  // Strip any trailing filename: /g7m/index.html is the same app as /g7m/.
  if (!url.pathname.endsWith('/')) {
    url.pathname = url.pathname.replace(/[^/]*$/, '');
  }
  return url.href;
}
