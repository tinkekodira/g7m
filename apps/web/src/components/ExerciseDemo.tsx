import { t } from '@g7m/i18n';
import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react';
import { colorTokens, lightColorTokens } from '@g7m/ui';
import { useReducedMotion } from '../lib/use-reduced-motion.js';
import { useThemeStore } from '../lib/use-theme.js';
import {
  demoFiles,
  demoPanel,
  demoView,
  exerciseDemo,
  type ExerciseDemo as Demo,
} from './exercise-demos.js';

/**
 * One rep of the exercise, on repeat, for the exercises that have a loop.
 * Everything else renders nothing, so its page is exactly what it was.
 *
 * ## The panel
 *
 * The loop plays in a square of its own, `bg-demo`, rather than straight on the
 * card. No card or page in the app is the colour a loop is rendered on, so
 * the panel is: `#1C1C1C` in the dark theme and `#F5F3EE` in the light one.
 * Each loop ships as one opaque MP4 per panel, and it fills its panel with no
 * edge. The panel also hides the cut in the contact shadow at the frame's
 * bottom and left edges, which on a bare card would be a hard line.
 *
 * Until ADR-0186 the light theme played a transparent animated WebP, about
 * twenty times the MP4's size. The 58 of them were 116 MB of a 166 MB build,
 * and the Android app bundles the whole build.
 *
 * Which file plays is decided from the panel's colour (`demoPanel`), not from
 * the theme's name, so a change to either token cannot put an opaque video on
 * the wrong background. A colour with no loop rendered on it shows nothing.
 *
 * ## Being a good citizen
 *
 * - **Lazy.** Nothing is fetched until the panel is within 200px of the
 *   screen. The MP4 then loads its poster and enough of itself to start. The
 *   service worker never precaches these (ADR-0102).
 * - **Off screen or tab hidden.** The video pauses, and plays again when it
 *   comes back.
 * - **Reduced motion.** The panel's first frame as a still, and no loop.
 * - **A file that fails.** The panel goes and the page is as it was before
 *   loops existed. There is no error state: the steps beside it are the
 *   real instructions, and a missing loop takes nothing away from them.
 */
export function ExerciseDemo({ slug, name }: { readonly slug: string; readonly name: string }) {
  const demo = exerciseDemo(slug);
  // Keyed by slug, so a file that failed on one exercise does not hide the
  // next one's loop when the screen is reused for it.
  return demo === null ? null : <DemoPlayer key={slug} demo={demo} name={name} />;
}

/** How far ahead of the screen the files start loading. */
const NEAR = '200px 0px';

function DemoPlayer({ demo, name }: { readonly demo: Demo; readonly name: string }) {
  const frame = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const theme = useThemeStore((state) => state.theme);
  const reducedMotion = useReducedMotion();
  const tabVisible = useTabVisible();
  const near = useInView(frame, NEAR);
  const onScreen = useInView(frame, '0px');
  // Once the poster and the video are in the page they stay, so scrolling
  // back up does not fetch them again.
  const [reached, setReached] = useState(false);
  const [failed, setFailed] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (near) setReached(true);
  }, [near]);

  const surface = theme === 'light' ? lightColorTokens['bg-demo'] : colorTokens['bg-demo'];
  const panel = demoPanel(surface);
  const files = panel === null ? null : demoFiles(demo, panel);
  const view = demoView(reducedMotion || paused);
  const playing = view === 'video' && onScreen && tabVisible;

  useEffect(() => {
    const element = video.current;
    if (element === null) return;
    if (playing) {
      // Rejected when the browser refuses (a power-saving mode, a data saver).
      // The poster stays up, which is a fine thing to be left with.
      element.play().catch(() => undefined);
    } else {
      // Also cancels `autoPlay` for a video that mounted just below the fold.
      element.pause();
    }
  }, [playing, reached, files?.video]);

  if (failed || files === null) return null;
  const fail = () => {
    setFailed(true);
  };

  return (
    <div ref={frame} className="exercise-demo mx-auto mb-4 w-full max-w-[360px]">
      <div
        // The figure holds no text, so the name says what it is and the media
        // inside is hidden from the accessibility tree.
        role="img"
        aria-label={`${name} demonstration`}
        // The column's width, square, and no wider than 360px: the 720px source
        // is then sharp on a 2x screen.
        className="aspect-square w-full overflow-hidden rounded-control bg-demo"
      >
        {reached && view === 'poster' && (
          <img
            src={files.poster}
            alt=""
            width={720}
            height={720}
            onError={fail}
            className="size-full object-contain"
          />
        )}
        {reached && view === 'video' && (
          <video
            // A theme switch swaps the file: a fresh element loads and plays it.
            key={files.video}
            ref={video}
            src={files.video}
            poster={files.poster}
            muted
            loop
            playsInline
            autoPlay
            preload="metadata"
            aria-hidden
            onError={fail}
            className="size-full object-contain"
          />
        )}
      </div>
      {!reducedMotion && (
        <button
          type="button"
          onClick={() => setPaused((value) => !value)}
          className="mt-1 min-h-tap w-full rounded-control text-sm font-medium text-accent hover:bg-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {paused ? t().library.detail.playDemo : t().library.detail.pauseDemo}
        </button>
      )}
    </div>
  );
}

/** Whether the element is within `rootMargin` of the screen, kept current. */
function useInView(target: RefObject<HTMLElement | null>, rootMargin: string): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const element = target.current;
    if (element === null) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) setInView(entry.isIntersecting);
      },
      { rootMargin },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [target, rootMargin]);
  return inView;
}

function useTabVisible(): boolean {
  return useSyncExternalStore(subscribeToVisibility, () => document.visibilityState === 'visible');
}

function subscribeToVisibility(onChange: () => void): () => void {
  document.addEventListener('visibilitychange', onChange);
  return () => {
    document.removeEventListener('visibilitychange', onChange);
  };
}
