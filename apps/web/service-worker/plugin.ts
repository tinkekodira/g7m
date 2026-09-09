/**
 * Builds `dist/sw.js` after the app bundle is written.
 *
 * The worker needs a list of the files to precache, and those filenames are
 * fingerprinted — they do not exist until the main build has finished. So this
 * runs in `closeBundle`, reads what was actually emitted, and compiles the
 * worker with that list and a content-derived build id substituted in.
 *
 * No Workbox. What is wanted here is a precache manifest and two caching
 * strategies, which is a hundred lines of `sw.ts` and a dependency-free build
 * step — against a library whose generated worker would be the least
 * inspectable code in the repository, on the one path where a mistake persists
 * on the user's device after the fix has shipped.
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { build, type Plugin, type ResolvedConfig } from 'vite';
import { precacheId, sha256, shouldPrecache, type PrecacheEntry } from './precache.js';
import { describeOverBudget, entryScript } from './budget.js';

export interface ServiceWorkerOptions {
  /** The worker's entry, relative to the Vite root. */
  readonly entry?: string;
}

export function serviceWorker(options: ServiceWorkerOptions = {}): Plugin {
  const entry = options.entry ?? 'service-worker/sw.ts';
  let config: ResolvedConfig;

  return {
    name: 'g7m:service-worker',
    // There is no worker in development: it would serve yesterday's modules
    // back to a dev server whose whole job is to serve today's.
    apply: 'build',

    configResolved(resolved) {
      config = resolved;
    },

    async closeBundle() {
      const outDir = path.resolve(config.root, config.build.outDir);
      const files = (await listFiles(outDir)).filter(shouldPrecache).sort();
      const entries: PrecacheEntry[] = await Promise.all(
        files.map(async (file) => ({
          path: file,
          sha256: sha256(await readFile(path.join(outDir, file))),
        })),
      );
      const buildId = precacheId(entries);

      /**
       * The entry chunk, checked rather than warned about.
       *
       * Vite prints a size warning on every build, which is the same as
       * printing none. This throws, because the failure it catches — a
       * dependency arriving in the entry through a module that only needed it
       * on one screen — is invisible in a diff and shows up as a slow first
       * load on somebody else's phone.
       */
      const entryFile = entryScript(await readFile(path.join(outDir, 'index.html'), 'utf8'));
      if (entryFile !== null) {
        const { size } = await stat(path.join(outDir, entryFile));
        const complaint = describeOverBudget(entryFile, size);
        if (complaint !== null) throw new Error(complaint);
      }

      await build({
        // Without this the nested build would load `vite.config.ts`, which
        // contains this plugin, which would start another nested build.
        configFile: false,
        logLevel: 'warn',
        root: config.root,
        define: {
          __PRECACHE__: JSON.stringify(files),
          __BUILD_ID__: JSON.stringify(buildId),
        },
        build: {
          outDir,
          // The app bundle is already sitting there.
          emptyOutDir: false,
          target: config.build.target,
          minify: config.build.minify,
          // A worker is registered by URL, so its filename cannot be hashed.
          // Library mode is the one way to ask Rollup for a fixed name.
          lib: { entry, name: 'g7mServiceWorker', formats: ['iife'], fileName: () => 'sw.js' },
          // Nothing steps through a service worker in a debugger, and the map
          // would be precached by the next build's manifest if it were emitted.
          sourcemap: false,
        },
      });

      config.logger.info(
        `\u001b[32m\u2713\u001b[0m service worker: sw.js, ${String(files.length)} files precached, build ${buildId}`,
      );
    },
  };
}

/** Every file under `root`, as POSIX-separated paths relative to it. */
async function listFiles(root: string, prefix = ''): Promise<string[]> {
  const found: string[] = [];
  for (const entry of await readdir(path.join(root, prefix), { withFileTypes: true })) {
    const relative = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
    if (entry.isDirectory()) found.push(...(await listFiles(root, relative)));
    else found.push(relative);
  }
  return found;
}
