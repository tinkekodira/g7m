import { describe, expect, it } from 'vitest';
import { anatomyUrl, bodyFor, modelFileFor } from './anatomy-model.js';

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

/**
 * Which body a profile is drawn on (ADR-0096).
 *
 * Only a profile that says female gets the female body. Nobody who has not
 * said is guessed at: they see the body the app has always shown.
 */
describe('bodyFor', () => {
  it('draws a female profile on the female body', () => {
    expect(bodyFor('female')).toBe('female');
  });

  it('draws a male profile on the male body', () => {
    expect(bodyFor('male')).toBe('male');
  });

  it('draws a profile that has not said on the male body', () => {
    expect(bodyFor(null)).toBe('male');
  });
});

/**
 * Reading the manifest, in every shape a deployed build can meet.
 *
 * The old form matters most: it is what every build before this one wrote,
 * and what a developer's checkout still has until they reinstall.
 */
describe('modelFileFor', () => {
  const male = 'body-dd8aa190.glb';
  const female = 'body-female-cd51615f.glb';

  describe('the old single-model form', () => {
    const manifest = { model: male, bytes: 3987456 };

    it('reads the one model as the male', () => {
      expect(modelFileFor(manifest, 'male')).toBe(male);
    });

    it('shows a female profile the male sculpt, as it did before there was a choice', () => {
      expect(modelFileFor(manifest, 'female')).toBe(male);
    });
  });

  describe('both bodies installed', () => {
    const manifest = {
      model: male,
      bytes: 3987456,
      bodies: { male: { model: male, bytes: 3987456 }, female: { model: female, bytes: 3957308 } },
    };

    it('gives each body its own file', () => {
      expect(modelFileFor(manifest, 'male')).toBe(male);
      expect(modelFileFor(manifest, 'female')).toBe(female);
    });
  });

  describe('the female missing', () => {
    const manifest = { model: male, bytes: 3987456, bodies: { male: { model: male } } };

    it('shows a female profile the male sculpt rather than the generated body', () => {
      expect(modelFileFor(manifest, 'female')).toBe(male);
    });

    it('leaves the male as he was', () => {
      expect(modelFileFor(manifest, 'male')).toBe(male);
    });
  });

  /**
   * Never the other way round. A male profile was never shown a female body,
   * so a build carrying only hers gives him the generated one, as before.
   */
  it('does not show a male profile the female body', () => {
    expect(modelFileFor({ bodies: { female: { model: female } } }, 'male')).toBeNull();
  });

  it('is null for a manifest naming nothing, which is the normal build', () => {
    for (const manifest of [null, 'index.html', {}, { model: '' }, { bodies: null }]) {
      expect(modelFileFor(manifest, 'male'), JSON.stringify(manifest)).toBeNull();
      expect(modelFileFor(manifest, 'female'), JSON.stringify(manifest)).toBeNull();
    }
  });
});
