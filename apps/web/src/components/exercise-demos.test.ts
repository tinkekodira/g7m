import { describe, expect, it } from 'vitest';
import { colorTokens, lightColorTokens } from '@g7m/ui';
import { DEMO_MP4_BACKGROUND, demoFormat, demoView, exerciseDemo } from './exercise-demos.js';

describe('exerciseDemo', () => {
  it('finds the back squat and the bench press, each with all three files', () => {
    for (const slug of ['barbell-back-squat', 'barbell-bench-press']) {
      const demo = exerciseDemo(slug);
      expect(demo, slug).not.toBeNull();
      expect(demo?.mp4).toMatch(new RegExp(`${slug}\\.mp4$`));
      expect(demo?.webp).toMatch(new RegExp(`${slug}\\.webp$`));
      expect(demo?.poster).toMatch(new RegExp(`${slug}-poster\\.webp$`));
    }
  });

  it('gives null for an exercise with no loop, so its page stays as it was', () => {
    expect(exerciseDemo('air-bike')).toBeNull();
    // Same kit as the bench press, different movement: no borrowed loop.
    expect(exerciseDemo('close-grip-bench-press')).toBeNull();
    expect(exerciseDemo('')).toBeNull();
  });

  it('matches on the slug, not the display name', () => {
    expect(exerciseDemo('Barbell Back Squat')).toBeNull();
  });
});

describe('demoFormat', () => {
  it('plays the MP4 on the exact colour it was rendered on, in any case', () => {
    expect(demoFormat('#1C1C1C')).toBe('mp4');
    expect(demoFormat('#1c1c1c')).toBe('mp4');
  });

  it('plays the transparent WebP on anything else', () => {
    // The dark page and card are both within a few levels of the render
    // background, which is exactly the case that shows a faint square.
    for (const surface of ['#1f1e1d', '#262624', '#1c1c1d', '#ffffff', '#f5f3ee']) {
      expect(demoFormat(surface), surface).toBe('webp');
    }
  });

  it('plays the MP4 in the dark theme and the WebP in the light one', () => {
    // The panel's token is what makes the dark theme an MP4 surface. If it
    // drifts by a level, every dark-theme view silently becomes a 2.5 MB WebP.
    expect(colorTokens['bg-demo']).toBe(DEMO_MP4_BACKGROUND);
    expect(demoFormat(colorTokens['bg-demo'])).toBe('mp4');
    expect(demoFormat(lightColorTokens['bg-demo'])).toBe('webp');
  });
});

describe('demoView', () => {
  it('shows the poster, and no loop, when reduced motion is asked for', () => {
    expect(demoView('mp4', true)).toBe('poster');
    expect(demoView('webp', true)).toBe('poster');
  });

  it('plays the chosen format otherwise', () => {
    expect(demoView('mp4', false)).toBe('mp4');
    expect(demoView('webp', false)).toBe('webp');
  });
});
