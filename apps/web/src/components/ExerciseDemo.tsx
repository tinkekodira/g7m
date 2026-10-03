import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react';
import { colorTokens, lightColorTokens } from '@g7m/ui';
import { useThemeStore } from '../lib/use-theme.js';
import {
  demoFormat,
  demoPoster,
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
 * card. No surface in the app is the `#1C1C1C` the loops are rendered on: the
 * dark card is `#262624` and the page `#1f1e1d`, both close enough to look like
 * a match and far enough to show the MP4 as a faint square. So the panel is
 * that colour in the dark theme, and the MP4 fills it with no edge. In the
 * light theme the panel is the page colour and the transparent WebP plays on
 * it. The panel also gives the WebP somewhere to end: its contact shadow is
 * cut off at the frame's bottom and left edges, and on a bare card that cut
 * would be a hard line.
 *
 * Which file plays is decided from the panel's colour (`demoFormat`), not from
 * the theme's name, so a change to either token cannot put an opaque video on
 * the wrong background.
 *
 * ## Being a good citizen
 *
 * - **Lazy.** Nothing is fetched until the panel is within 200px of the
 *   screen. The MP4 then loads its poster and enough of itself to start. The
 *   service worker never precaches these (ADR-0102).
 * - **Off screen or tab hidden.** The video pauses, and plays again when it
 *   comes back. An animated WebP cannot be paused, so it is taken out of the
 *   page instead. The loop is seamless, so starting again from the top looks
 *   the same as resuming.
 * - **Reduced motion.** The first frame as a still, and no loop: the opaque
 *   poster on the dark panel, the transparent one on the light panel.
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

  useEffect(() => {
    if (near) setReached(true);
  }, [near]);

  const surface = theme === 'light' ? lightColorTokens['bg-demo'] : colorTokens['bg-demo'];
  const format = demoFormat(surface);
  const view = demoView(format, reducedMotion);
  const playing = view === 'mp4' && onScreen && tabVisible;

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
  }, [playing, reached]);

  if (failed) return null;
  const fail = () => {
    setFailed(true);
  };

  return (
    <div
      ref={frame}
      // The figure holds no text, so the name says what it is and the media
      // inside is hidden from the accessibility tree.
      role="img"
      aria-label={`${name} demonstration`}
      // The column's width, square, and no wider than 360px: the 720px source
      // is then sharp on a 2x screen.
      className="mx-auto mb-4 aspect-square w-full max-w-[360px] overflow-hidden rounded-control bg-demo"
    >
      {reached && view === 'poster' && (
        <img
          src={demoPoster(demo, format)}
          alt=""
          onError={fail}
          className="size-full object-contain"
        />
      )}
      {reached && view === 'mp4' && (
        <video
          ref={video}
          src={demo.mp4}
          poster={demo.poster}
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
      {view === 'webp' && near && tabVisible && (
        <img
          src={demo.webp}
          alt=""
          decoding="async"
          onError={fail}
          className="size-full object-contain"
        />
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

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/** The system setting, kept current: it can be switched with the page open. */
function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeToReducedMotion, () => matchMedia(REDUCED_MOTION).matches);
}

function subscribeToReducedMotion(onChange: () => void): () => void {
  const query = matchMedia(REDUCED_MOTION);
  query.addEventListener('change', onChange);
  return () => {
    query.removeEventListener('change', onChange);
  };
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
