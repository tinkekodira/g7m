import { describe, expect, it } from 'vitest';
import { colorTokens, lightColorTokens } from '@g7m/ui';
import {
  DEMO_MP4_BACKGROUND,
  demoFormat,
  demoPoster,
  demoView,
  exerciseDemo,
} from './exercise-demos.js';

/** Every exercise with a loop, by the catalogue's slug. */
const WITH_LOOP = [
  'barbell-back-squat',
  'barbell-bench-press',
  'conventional-deadlift',
  'romanian-deadlift',
  'barbell-row',
  'barbell-curl',
  'overhead-press',
  'dumbbell-bench-press',
  'dumbbell-curl',
  'lateral-raise',
  'push-up',
  'pull-up',
  'chin-up',
  'lat-pulldown',
  'leg-press',
  'hammer-curl',
  'rear-delt-fly',
  'close-grip-bench-press',
  'incline-dumbbell-press',
  'hanging-leg-raise',
  'barbell-front-squat',
  'incline-barbell-press',
  'trap-bar-deadlift',
  'goblet-squat',
  'skull-crusher',
  'dumbbell-pullover',
  'barbell-hip-thrust',
  'bulgarian-split-squat',
  'cable-fly',
  'cable-woodchop',
  'chest-dip',
  'face-pull',
  'hack-squat',
  'plank',
  'single-arm-dumbbell-row',
  'standing-calf-raise',
  'straight-arm-pulldown',
  'triceps-pushdown',
];

describe('exerciseDemo', () => {
  it('finds every exercise that has a loop, each with all four files', () => {
    for (const slug of WITH_LOOP) {
      const demo = exerciseDemo(slug);
      expect(demo, slug).not.toBeNull();
      expect(demo?.mp4).toMatch(new RegExp(`/${slug}\\.mp4$`));
      expect(demo?.webp).toMatch(new RegExp(`/${slug}\\.webp$`));
      expect(demo?.poster).toMatch(new RegExp(`/${slug}-poster\\.webp$`));
      expect(demo?.transparentPoster).toMatch(new RegExp(`/${slug}-poster-transparent\\.webp$`));
    }
  });

  it('maps every file in the loop folder, so none ships unused', () => {
    // A loop copied in without its entry would be bundled and never shown.
    const files = Object.keys(
      import.meta.glob('../assets/demos/*', { query: '?url', eager: true }),
    );
    const slugs = new Set(
      files.map((file) =>
        (file.split('/').pop() ?? file).replace(/(-poster(-transparent)?)?\.\w+$/, ''),
      ),
    );
    expect([...slugs].sort()).toEqual([...WITH_LOOP].sort());
    expect(files).toHaveLength(WITH_LOOP.length * 4);
  });

  it('gives null for an exercise with no loop, so its page stays as it was', () => {
    expect(exerciseDemo('air-bike')).toBeNull();
    // 3d-models' loop is a standing press; this row is the seated one, with a
    // bench in its kit and "sit with back support" as its first step.
    expect(exerciseDemo('dumbbell-shoulder-press')).toBeNull();
    expect(exerciseDemo('')).toBeNull();
  });

  it('gives the chest dip its loop and leaves the triceps dip without one', () => {
    // The loop leans forward over the bars. The triceps dip is done upright,
    // so the same file on its page would show the other exercise.
    expect(exerciseDemo('chest-dip')).not.toBeNull();
    expect(exerciseDemo('triceps-dip')).toBeNull();
  });

  it('gives the hammer curl its own loop, not the supinated curl', () => {
    // Same dumbbells, different grip: two movements, two loops.
    expect(exerciseDemo('hammer-curl')?.webp).not.toBe(exerciseDemo('dumbbell-curl')?.webp);
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

describe('demoPoster', () => {
  const demo = exerciseDemo('barbell-back-squat');
  if (demo === null) throw new Error('The back squat has no loop.');

  it('gives the opaque poster on the colour it was rendered on', () => {
    expect(demoPoster(demo, demoFormat(colorTokens['bg-demo']))).toBe(demo.poster);
  });

  it('gives the transparent one anywhere else, so it is never a dark square', () => {
    expect(demoPoster(demo, demoFormat(lightColorTokens['bg-demo']))).toBe(demo.transparentPoster);
    expect(demoPoster(demo, 'webp')).toBe(demo.transparentPoster);
  });
});
