/**
 * Which built files the worker precaches, and what the build is called.
 *
 * Build-time only — imported by `plugin.ts`, never by the worker or the app.
 */
import { createHash } from 'node:crypto';

/**
 * Everything in `dist` is precached except four kinds of file.
 *
 * Precaching the lot, rather than a hand-listed shell, is deliberate: the
 * PowerSync workers and the wa-sqlite WebAssembly binary are loaded lazily, so
 * a shell-only precache would give a cold start with no signal a working page
 * and a database that will not open. That is a worse failure than a large
 * install, and it is the exact scenario this app is for.
 */
export function shouldPrecache(file: string): boolean {
  // The worker cannot meaningfully cache itself: the browser fetches it
  // outside this cache, and a cached copy would be a worker that can never be
  // replaced. This is the line that stops a bad deploy being permanent.
  if (file === 'sw.js') return false;

  // Source maps are megabytes that only a debugger opens, and the debugger
  // has a network.
  if (file.endsWith('.map')) return false;

  // The anatomy model. Megabytes, optional, and only the Learn screen wants
  // it — precaching would put the whole download in front of the first paint
  // of a screen most people have not opened. It is also absent from most
  // builds, being licensed and uncommitted, which would make the build id
  // differ between a developer's machine and CI over a file neither needs at
  // install time. The Learn screen fetches it when opened and the runtime
  // cache keeps it from then on.
  if (file.startsWith('anatomy/')) return false;

  // `.nojekyll` and friends: hosting markers, zero bytes, no request ever
  // made for them.
  const name = file.split('/').pop() ?? file;
  return !name.startsWith('.');
}

export interface PrecacheEntry {
  /** Path relative to the output directory, POSIX separators. */
  readonly path: string;
  readonly sha256: string;
}

export function sha256(content: Uint8Array): string {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * A short id for this exact set of files and their exact contents.
 *
 * Content-derived rather than a timestamp or the commit sha, for one reason: a
 * rebuild that produces byte-identical output produces the same id, so the
 * worker's bytes do not change, so no device is told there is an update when
 * there is nothing to update to. A timestamp would prompt every user to reload
 * after every push, including the ones that only touched the README.
 *
 * It covers file contents, not just names, because most of `dist` is
 * fingerprinted by Vite but `manifest.webmanifest` and the icons are not.
 */
export function precacheId(entries: readonly PrecacheEntry[]): string {
  const hash = createHash('sha256');
  for (const entry of [...entries].sort((a, b) => a.path.localeCompare(b.path, 'en'))) {
    hash.update(`${entry.path}\u0000${entry.sha256}\n`);
  }
  // Twelve hex characters is 48 bits. The only thing a collision could cause
  // is a missed update prompt between two builds, which is not worth more.
  return hash.digest('hex').slice(0, 12);
}
