import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { resolveConfig } from 'vite';
import { precacheId, sha256, shouldPrecache, type PrecacheEntry } from './precache.js';

function entry(path: string, content: string): PrecacheEntry {
  return { path, sha256: sha256(new TextEncoder().encode(content)) };
}

describe('shouldPrecache', () => {
  /**
   * The one file whose absence must not change the build id. It is licensed
   * and uncommitted, so a developer's machine has it and CI does not — and a
   * precache manifest that differs between them would tell every device there
   * is an update on every deploy.
   */
  it('leaves the anatomy model out', () => {
    expect(shouldPrecache('anatomy/body.glb')).toBe(false);
  });

  /**
   * Megabytes per exercise, wanted only by whoever scrolls to one. Precached,
   * they would be downloaded at install by everyone, on every new loop.
   */
  it('leaves the exercise demonstration loops out', () => {
    for (const file of [
      'assets/demos/barbell-back-squat-Bq3kT9xA.mp4',
      'assets/demos/barbell-back-squat-Cw81pLmZ.webp',
      'assets/demos/barbell-back-squat-poster-D0aHf2Qe.webp',
    ]) {
      expect(shouldPrecache(file), file).toBe(false);
    }
    // Only that folder: the equipment heroes are WebPs too, and stay.
    expect(shouldPrecache('assets/bench-press-hero-Dk2PqA1x.webp')).toBe(true);
  });

  it('takes the shell, the assets and the icons', () => {
    for (const file of [
      'index.html',
      'assets/index-CPghq-kv.js',
      'assets/index-CPghq-kv.css',
      'assets/wa-sqlite-async-BhK2.wasm',
      'manifest.webmanifest',
      'icon-512.png',
    ]) {
      expect(shouldPrecache(file), file).toBe(true);
    }
  });

  it('never precaches the worker itself', () => {
    // A cached worker is a worker that cannot be replaced, which would make a
    // bad deploy permanent on every device that installed it.
    expect(shouldPrecache('sw.js')).toBe(false);
  });

  it('skips source maps and hosting markers', () => {
    expect(shouldPrecache('assets/index-CPghq-kv.js.map')).toBe(false);
    expect(shouldPrecache('.nojekyll')).toBe(false);
  });
});

describe('precacheId', () => {
  it('is the same for the same files with the same contents', () => {
    const build = () => [entry('index.html', '<html>'), entry('assets/a.js', 'console.log(1)')];
    expect(precacheId(build())).toBe(precacheId(build()));
  });

  it('does not depend on the order the files were listed in', () => {
    const a = entry('index.html', '<html>');
    const b = entry('assets/a.js', 'x');
    expect(precacheId([a, b])).toBe(precacheId([b, a]));
  });

  it('changes when a file\u2019s contents change, even at the same path', () => {
    // The case that matters: `manifest.webmanifest` and the icons keep their
    // names across builds, so a name-only id would miss an edit to them.
    const before = [entry('manifest.webmanifest', '{"name":"g7m"}')];
    const after = [entry('manifest.webmanifest', '{"name":"g7m2"}')];
    expect(precacheId(before)).not.toBe(precacheId(after));
  });

  it('changes when a file is added or removed', () => {
    const one = [entry('index.html', '<html>')];
    const two = [...one, entry('icon-192.png', 'png')];
    expect(precacheId(one)).not.toBe(precacheId(two));
  });

  it('is short enough to read in a cache name', () => {
    expect(precacheId([entry('index.html', '<html>')])).toMatch(/^[0-9a-f]{12}$/);
  });
});

/**
 * The demonstration loops, kept out of the install (ADR-0102).
 *
 * `shouldPrecache` leaves out `assets/demos/`, and it is `vite.config.ts` that
 * puts the loops there. Each half is harmless alone and the pair is the point:
 * rename the folder on one side and every loop is downloaded at install again,
 * with nothing failing. Here rather than beside the other config tests in
 * `src/`, because this file is in the same TypeScript project as the config
 * and the precache, and a test in `src/` importing either only typechecks on a
 * machine that has already built that project.
 */
describe('the demonstration loops', () => {
  const appRoot = fileURLToPath(new URL('..', import.meta.url));

  async function builtName(originalFileName: string): Promise<string> {
    const config = await resolveConfig({ root: appRoot }, 'build', 'production', 'production');
    const output = config.build.rollupOptions.output;
    const name = (Array.isArray(output) ? output[0] : output)?.assetFileNames;
    if (typeof name !== 'function') throw new Error('assetFileNames is not a function.');
    const file = originalFileName.split('/').pop() ?? originalFileName;
    return name({
      type: 'asset',
      name: file,
      names: [file],
      originalFileName,
      originalFileNames: [originalFileName],
      source: new Uint8Array(),
    })
      .replace('[name]', file.replace(/\.[^.]+$/, ''))
      .replace('[hash]', 'Bq3kT9xA')
      .replace('[extname]', file.replace(/^[^.]+/, ''));
  }

  it('are built into a folder the precache leaves out', async () => {
    for (const source of [
      'src/assets/demos/barbell-back-squat.mp4',
      'src/assets/demos/barbell-back-squat.webp',
      'src/assets/demos/barbell-back-squat-poster.webp',
    ]) {
      const built = await builtName(source);
      expect(built, source).toMatch(/^assets\/demos\/barbell-back-squat/);
      expect(shouldPrecache(built), built).toBe(false);
    }
  });

  it('leave every other asset where it was, and precached', async () => {
    const built = await builtName('src/assets/equipment/bench-press-hero.webp');
    expect(built).toBe('assets/bench-press-hero-Bq3kT9xA.webp');
    expect(shouldPrecache(built)).toBe(true);
  });
});
