/**
 * Deletes the web build's source maps from the copy inside a native project.
 *
 * Runs as Capacitor's `capacitor:copy:after` hook (package.json), so every
 * `cap sync` and `cap copy` does it — local or CI, Android or iOS — without
 * anybody remembering a flag. Capacitor sets `CAPACITOR_PLATFORM_NAME`.
 *
 * The web build keeps its maps on purpose: they are how bundle size is
 * measured (ADR-0078). In the app they are ~15 MB nobody's phone ever opens, the same
 * reasoning that keeps them out of the service worker's precache
 * (`apps/web/service-worker/precache.ts`). Deleting them is safe for the same
 * reason: nothing the app runs asks for a `.map`. See ADR-0187.
 */
import { readdir, rm, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Where `cap copy` puts the web build, per platform. */
const PUBLIC_DIRS = {
  android: join(root, 'android', 'app', 'src', 'main', 'assets', 'public'),
  ios: join(root, 'ios', 'App', 'App', 'public'),
};

const platform = process.env.CAPACITOR_PLATFORM_NAME;
const dir = PUBLIC_DIRS[platform];

// `cap copy web` has no native copy to clean.
if (dir === undefined) process.exit(0);

// Loud rather than silent: if Capacitor ever moves this folder, the maps
// would quietly ship again.
await stat(dir).catch(() => {
  console.error(`strip-source-maps: ${dir} does not exist after cap copy ${platform}`);
  process.exit(1);
});

let files = 0;
let bytes = 0;
const entries = await readdir(dir, { recursive: true, withFileTypes: true });
for (const entry of entries) {
  if (!entry.isFile() || !entry.name.endsWith('.map')) continue;
  const file = join(entry.parentPath, entry.name);
  bytes += (await stat(file)).size;
  await rm(file);
  files += 1;
}

console.log(
  `strip-source-maps: removed ${String(files)} .map files (${(bytes / 1048576).toFixed(1)} MB) from ${platform}`,
);
