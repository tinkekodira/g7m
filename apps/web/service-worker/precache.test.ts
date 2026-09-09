import { describe, expect, it } from 'vitest';
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
