import { existsSync } from 'node:fs';
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
