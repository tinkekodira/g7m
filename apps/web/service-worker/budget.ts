/**
 * A ceiling on the first chunk every user downloads.
 *
 * Build-time only — imported by `plugin.ts`, never by the worker or the app.
 *
 * This exists because a 627 KB regression shipped without anyone noticing.
 * `three` was pulled into the entry by a module that only needed it on one
 * screen, the entry went from 915 KB to 1.5 MB, and the only signal was a Vite
 * warning in a wall of build output that says the same thing on every build.
 *
 * A number that fails the build is the difference between a warning and a
 * check. The limit has headroom over today's size rather than being pinned to
 * it: this is here to catch a dependency arriving in the wrong chunk, not to
 * argue about ten kilobytes.
 */

/** Roughly 20% above where the entry sits today. */
export const ENTRY_BUDGET_BYTES = 1_000_000;

/**
 * The module entry from a built `index.html`.
 *
 * Null when there is no module script, which is not this file's problem to
 * report — a build with no entry has gone wrong somewhere louder.
 */
export function entryScript(html: string): string | null {
  // Vite emits `<script type="module" crossorigin src="./assets/index-HASH.js">`.
  // Attribute order is not guaranteed, so the src is found on its own and the
  // module-ness checked separately.
  for (const tag of html.match(/<script\b[^>]*>/g) ?? []) {
    if (!tag.includes('type="module"')) continue;
    const src = /src="([^"]+)"/.exec(tag)?.[1];
    if (src !== undefined) return src.replace(/^\.?\//, '');
  }
  return null;
}

/**
 * What to say when the entry is too big, or null when it is not.
 *
 * Returns the message rather than throwing so the caller decides how loud to
 * be, and so this can be tested without catching anything.
 */
export function describeOverBudget(
  file: string,
  bytes: number,
  limit = ENTRY_BUDGET_BYTES,
): string | null {
  if (bytes <= limit) return null;

  const kb = (value: number): string => `${String(Math.round(value / 1024))} KB`;
  return (
    `The entry chunk ${file} is ${kb(bytes)}, over the ${kb(limit)} budget.\n` +
    'Something large is being imported by a module the entry can reach. A ' +
    'dependency only one screen needs — three.js, a chart library, a PDF ' +
    'writer — belongs behind a dynamic import, not a static one.\n' +
    'If the growth is genuine, raise ENTRY_BUDGET_BYTES deliberately and say ' +
    'why in the commit.'
  );
}
