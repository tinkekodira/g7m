import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { resolveConfig } from 'vite';

/**
 * The blank page.
 *
 * `env.ts` validates the environment at module load and throws a clear message
 * when a key is missing — which is the right design, and it meant that pointing
 * Vite at the wrong directory produced an app that mounted nothing at all.
 *
 * It hid for months because CI never reads a file: the values arrive as
 * `process.env` from repository secrets, which Vite picks up whatever `envDir`
 * says. So every deployed build worked, every check passed, and only `pnpm dev`
 * was broken — on a repository where nobody had yet needed to run it.
 *
 * Asked of Vite rather than read off the config object, for two reasons. It is
 * the resolved value that decides where the files are read from, defaults and
 * all. And `vite.config.ts` belongs to `tsconfig.node.json` rather than to the
 * app's own project, so importing it from `src` needs that project built first
 * — which it is on a machine that has run the build, and is not in CI.
 *
 * Asserting against `.env.example` rather than `.env.local`: the example is
 * committed and the real one is not, so this has to hold on a fresh clone and
 * in CI as well as on a machine that is configured.
 */
describe('vite config', () => {
  it('looks for environment files where the README says to put them', async () => {
    const appRoot = fileURLToPath(new URL('..', import.meta.url));
    const config = await resolveConfig({ root: appRoot }, 'serve', 'development', 'development');

    // `false` is a valid setting and means "read no environment files at all",
    // which fails the same way and is worth naming separately.
    const envDir = config.envDir;
    if (envDir === false) throw new Error('envDir is false, so no environment file is read.');

    expect(
      existsSync(join(envDir, '.env.example')),
      `Vite reads environment files from ${envDir}, which has no .env.example. ` +
        'Unset, `envDir` defaults to apps/web and the app starts with no environment at all.',
    ).toBe(true);
  });
});

/**
 * The database that never opened.
 *
 * `@powersync/web` starts SQLite from `lib/worker/client.js` with
 * `new SharedWorker(new URL('./worker.js', import.meta.url))`, where the worker
 * is that file's own sibling. Vite's dependency optimizer flattens a package
 * into a single file under `node_modules/.vite/deps/`, so `import.meta.url`
 * becomes that directory instead and the browser asks for a `worker.js` that
 * esbuild never copied there.
 *
 * The worker never starts, `db.init()` never settles, and every screen waits on
 * a database nobody is opening. Nothing is raised: a promise that never settles
 * is not something a `catch` can see, so the app shows "Loading" for ever and
 * the only trace is one line in the dev server log.
 *
 * The same shape as the blank page above, and for the same reason — the
 * optimizer has no part in `vite build`, so every check stayed green while
 * `pnpm dev` could not open a database at all.
 */
describe('dependency optimizer', () => {
  const appRoot = fileURLToPath(new URL('..', import.meta.url));

  /** Package, the module that reaches for a file beside itself, and that file. */
  const RELATIVE_ASSETS = [
    ['@powersync/web', 'lib/worker/client.js', 'lib/worker/worker.js'],
    ['@journeyapps/wa-sqlite', 'dist/wa-sqlite-async.mjs', 'dist/wa-sqlite-async.wasm'],
  ] as const;

  it('leaves the packages that load their own assets alone', async () => {
    const config = await resolveConfig({ root: appRoot }, 'serve', 'development', 'development');
    const exclude = config.optimizeDeps.exclude ?? [];

    for (const [name] of RELATIVE_ASSETS) {
      expect(
        exclude,
        `${name} would be pre-bundled, and the file it loads relative to its own ` +
          'module would be looked for in .vite/deps, where nothing put it.',
      ).toContain(name);
    }
  });

  /**
   * The premise, rather than the workaround.
   *
   * If either package stops reaching for a file beside itself — a bundled
   * worker entry, an inlined wasm — then the exclusion above is inherited
   * rather than reasoned, and it is worth finding out which before keeping it.
   */
  it('is excluding them for a reason that still holds', () => {
    for (const [name, loader, asset] of RELATIVE_ASSETS) {
      const source = readFileSync(join(appRoot, 'node_modules', name, loader), 'utf8');
      expect(
        source,
        `${name}/${loader} no longer resolves anything against its own URL.`,
      ).toContain('import.meta.url');

      expect(
        existsSync(join(appRoot, 'node_modules', name, asset)),
        `${name} no longer ships ${asset} beside ${loader}.`,
      ).toBe(true);
    }
  });
});
