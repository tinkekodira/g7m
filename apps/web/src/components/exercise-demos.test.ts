import { describe, expect, it } from 'vitest';
import { colorTokens, lightColorTokens } from '@g7m/ui';
import { DEMO_BACKGROUND, demoFiles, demoPanel, demoView, exerciseDemo } from './exercise-demos.js';

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
  'triceps-dip',
  'ez-bar-curl',
  'incline-dumbbell-curl',
  'cable-curl',
  'cable-lat-pullover',
  'concentration-curl',
  'chest-supported-dumbbell-row',
  'kettlebell-deadlift',
  'kettlebell-swing',
  'overhead-triceps-extension',
  'machine-chest-press',
  'seated-row-machine',
  'hip-abduction-machine',
  'hip-adduction-machine',
  'pec-deck',
  't-bar-row',
  'leg-extension',
  'seated-leg-curl',
  'lying-leg-curl',
  'back-extension',
];

describe('exerciseDemo', () => {
  it('finds every exercise that has a loop, each with all four files', () => {
    for (const slug of WITH_LOOP) {
      const demo = exerciseDemo(slug);
      expect(demo, slug).not.toBeNull();
      expect(demo?.mp4).toMatch(new RegExp(`/${slug}\\.mp4$`));
      expect(demo?.lightMp4).toMatch(new RegExp(`/${slug}-light\\.mp4$`));
      expect(demo?.poster).toMatch(new RegExp(`/${slug}-poster\\.webp$`));
      expect(demo?.lightPoster).toMatch(new RegExp(`/${slug}-poster-light\\.webp$`));
    }
  });

  it('maps every file in the loop folder, so none ships unused', () => {
    // A loop copied in without its entry would be bundled and never shown.
    const files = Object.keys(
      import.meta.glob('../assets/demos/*', { query: '?url', eager: true }),
    );
    const slugs = new Set(
      files.map((file) => (file.split('/').pop() ?? file).replace(/(-poster)?(-light)?\.\w+$/, '')),
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

  it('gives the two dips different loops', () => {
    // The chest dip leans forward over the bars and the triceps dip stays
    // upright, so one file on both pages would show the wrong exercise on one.
    expect(exerciseDemo('triceps-dip')?.mp4).not.toBe(exerciseDemo('chest-dip')?.mp4);
  });

  it('gives the abductor and the adductor different loops', () => {
    // One machine, opposite directions.
    expect(exerciseDemo('hip-abduction-machine')?.mp4).not.toBe(
      exerciseDemo('hip-adduction-machine')?.mp4,
    );
  });

  it('gives the hammer curl its own loop, not the supinated curl', () => {
    // Same dumbbells, different grip: two movements, two loops.
    expect(exerciseDemo('hammer-curl')?.mp4).not.toBe(exerciseDemo('dumbbell-curl')?.mp4);
  });

  it('matches on the slug, not the display name', () => {
    expect(exerciseDemo('Barbell Back Squat')).toBeNull();
  });
});

describe('demoPanel', () => {
  it('chooses a set only on the exact colour it was rendered on, in any case', () => {
    expect(demoPanel('#1C1C1C')).toBe('dark');
    expect(demoPanel('#1c1c1c')).toBe('dark');
    expect(demoPanel('#F5F3EE')).toBe('light');
    expect(demoPanel(' #f5f3ee ')).toBe('light');
  });

  it('chooses nothing on any other colour, where an opaque file shows its square', () => {
    // The dark page and card are both within a few levels of the render
    // background, which is exactly the case that shows a faint square.
    for (const surface of ['#1f1e1d', '#262624', '#1c1c1d', '#ffffff', '#f5f3ef']) {
      expect(demoPanel(surface), surface).toBeNull();
    }
  });

  it('pins both theme panels to the colours the loops are rendered on', () => {
    // If a token drifts by a level, that theme loses its loop: this test says
    // so instead of the panel quietly going empty.
    expect(colorTokens['bg-demo']).toBe(DEMO_BACKGROUND.dark);
    expect(lightColorTokens['bg-demo']).toBe(DEMO_BACKGROUND.light);
    expect(demoPanel(colorTokens['bg-demo'])).toBe('dark');
    expect(demoPanel(lightColorTokens['bg-demo'])).toBe('light');
  });
});

describe('demoFiles', () => {
  const demo = exerciseDemo('barbell-back-squat');
  if (demo === null) throw new Error('The back squat has no loop.');

  it('gives the dark loop and poster on the dark panel', () => {
    expect(demoFiles(demo, 'dark')).toEqual({ video: demo.mp4, poster: demo.poster });
  });

  it('gives the light loop and poster on the light panel, never a dark square', () => {
    expect(demoFiles(demo, 'light')).toEqual({ video: demo.lightMp4, poster: demo.lightPoster });
  });
});

describe('demoView', () => {
  it('shows the poster, and no loop, when reduced motion is asked for', () => {
    expect(demoView(true)).toBe('poster');
  });

  it('plays the loop otherwise', () => {
    expect(demoView(false)).toBe('video');
  });
});
