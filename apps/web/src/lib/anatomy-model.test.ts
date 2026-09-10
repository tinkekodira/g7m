import { describe, expect, it } from 'vitest';
import { anatomyUrl } from './anatomy-model.js';

/**
 * Where the model is asked for.
 *
 * This was `/anatomy/body.glb` — a leading slash, which is right on a dev
 * server at the domain root and wrong everywhere the app actually ships. On
 * GitHub Pages it lives under `/g7m/`, so the root-relative path asked
 * `github.io/anatomy/body.glb` for a file that is under `/g7m/`. The Learn
 * screen then fell back to the generated body exactly as designed, and the
 * only symptom was "the model is not on my phone".
 *
 * Untestable through a browser here, and one line to check directly. The same
 * reason `base` is `./` in the Vite config (ADR-0027).
 */
describe('anatomyUrl', () => {
  it('resolves under the path the app is served from', () => {
    expect(anatomyUrl('anatomy/manifest.json', 'https://user.github.io/g7m/')).toBe(
      'https://user.github.io/g7m/anatomy/manifest.json',
    );
  });

  it('still works at the root, which is where development runs', () => {
    expect(anatomyUrl('anatomy/manifest.json', 'http://localhost:5173/')).toBe(
      'http://localhost:5173/anatomy/manifest.json',
    );
  });

  /**
   * `document.baseURI` on a hash route is the whole URL, fragment included.
   * Resolving against it has to land beside the page, not inside the fragment.
   */
  it('ignores the hash route the app is sitting on', () => {
    expect(anatomyUrl('anatomy/body-0d6f675d.glb', 'https://user.github.io/g7m/#/learn')).toBe(
      'https://user.github.io/g7m/anatomy/body-0d6f675d.glb',
    );
  });

  it('resolves a document URL that names index.html to the directory', () => {
    expect(anatomyUrl('anatomy/manifest.json', 'https://user.github.io/g7m/index.html')).toBe(
      'https://user.github.io/g7m/anatomy/manifest.json',
    );
  });
});
