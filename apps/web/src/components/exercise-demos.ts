import backSquatMp4 from '../assets/demos/barbell-back-squat.mp4';
import backSquatWebp from '../assets/demos/barbell-back-squat.webp';
import backSquatPoster from '../assets/demos/barbell-back-squat-poster.webp';
import benchPressMp4 from '../assets/demos/barbell-bench-press.mp4';
import benchPressWebp from '../assets/demos/barbell-bench-press.webp';
import benchPressPoster from '../assets/demos/barbell-bench-press-poster.webp';

/**
 * The demonstration loops, by exercise slug: a clay mannequin doing one rep in
 * the same kit as the exercise's icon.
 *
 * Rendered in `3d-models/mannequin` with the icons' camera, lights and render
 * settings, and copied here byte for byte. Each loop is one rep, 2.6 s at
 * 15 fps, and seamless: the last frame leads into the first.
 *
 * Unlike `equipment-art.ts` this is one entry per exercise, not per piece of
 * kit: a loop shows a movement, and two exercises on one bench are two
 * different movements. Adding one is three files in `assets/demos/` and one
 * entry here.
 *
 * The files sit under `assets/demos/` for a reason beyond tidiness: Vite emits
 * them to the same folder in `dist`, and the service worker leaves that folder
 * out of its precache (ADR-0102). They are fetched when an exercise's page
 * scrolls one into view, never at install.
 */
export interface ExerciseDemo {
  /** H.264, 720px square, opaque on `DEMO_MP4_BACKGROUND`. About 180 KB. */
  readonly mp4: string;
  /** Animated WebP, 720px square, transparent with a contact shadow. 2.2–2.7 MB. */
  readonly webp: string;
  /** The first frame, opaque on `DEMO_MP4_BACKGROUND`. About 20 KB. */
  readonly poster: string;
}

const DEMOS: Readonly<Record<string, ExerciseDemo>> = {
  'barbell-back-squat': { mp4: backSquatMp4, webp: backSquatWebp, poster: backSquatPoster },
  'barbell-bench-press': { mp4: benchPressMp4, webp: benchPressWebp, poster: benchPressPoster },
};

/** This exercise's loop, or null if it has none. */
export function exerciseDemo(slug: string): ExerciseDemo | null {
  return DEMOS[slug] ?? null;
}

/**
 * What the MP4 and the poster are rendered on: `UI_BG` in 3d-models'
 * render_common, the icon contact sheet's background.
 */
export const DEMO_MP4_BACKGROUND = '#1c1c1c';

export type DemoFormat = 'mp4' | 'webp';

/**
 * Which file to play on a surface of this colour.
 *
 * The MP4 is about a twelfth of the WebP's size, but it is opaque. On any
 * colour but its own its background shows as a square, so it plays only on an
 * exact match and the transparent WebP plays everywhere else. Exact, because
 * near-black differences of a few levels show as a visible edge on an OLED
 * phone.
 */
export function demoFormat(surface: string): DemoFormat {
  return surface.trim().toLowerCase() === DEMO_MP4_BACKGROUND ? 'mp4' : 'webp';
}

export type DemoView = DemoFormat | 'poster';

/**
 * What the player shows: a loop in the right format, or the still frame when
 * the system asks for reduced motion. A figure squatting on repeat is exactly
 * the motion that setting is there to stop, so it gets the still.
 */
export function demoView(format: DemoFormat, reducedMotion: boolean): DemoView {
  return reducedMotion ? 'poster' : format;
}
