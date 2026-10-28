import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Button } from '@g7m/ui';
import { useTourStore } from '../lib/app-tour.js';

const STOPS = [
  {
    route: '/',
    target: 'workout',
    title: 'Start a workout',
    text: 'Ready to train? Start your workout here, or return to a session already in progress.',
  },
  {
    route: '/',
    target: 'progress',
    title: 'Progress & history',
    text: 'Open Progress from Home to review your training and revisit past workouts.',
  },
  {
    route: '/',
    target: 'exercises',
    title: 'Exercise library',
    text: 'Browse exercises from Home to search the full library and find coaching for each movement.',
  },
  {
    route: '/learn',
    target: 'body',
    title: 'Your interactive 3D body',
    text: 'Find the 3D body in Learn. Tap a muscle to discover exercises that train it.',
  },
  {
    route: '/friends',
    target: 'friends',
    title: 'Train with friends',
    text: 'Add friends here, compare your training, and challenge each other.',
  },
] as const;

interface Placement {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  readonly cardTop: number;
}

export default function TourOverlay() {
  const [index, setIndex] = useState(0);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const stop = STOPS[index] ?? STOPS[0];
  function onClose() {
    // Route transitions may commit after the dialog closes. Focus Home when both are ready.
    const observer = new MutationObserver(focusHome);
    const timeout = window.setTimeout(() => observer.disconnect(), 5000);
    function focusHome() {
      const home = document.querySelector<HTMLElement>('[data-tour-home]');
      if (!home || document.querySelector('.app-tour-dialog[open]')) return;
      home.focus({ preventScroll: true });
      observer.disconnect();
      clearTimeout(timeout);
    }
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['open'],
    });
    useTourStore.getState().close();
    void navigate('/', { replace: true });
    requestAnimationFrame(focusHome);
  }

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    node.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      node.close();
      document.body.style.overflow = overflow;
    };
  }, []);

  useEffect(() => {
    heading.current?.focus();
    setPlacement(null);
    let target: HTMLElement | null = null;
    let scrolled = false;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (location.pathname !== stop.route) return;
        target = document.querySelector<HTMLElement>(`[data-tour="${stop.target}"]`);
        if (!target || !card.current) return;
        if (stop.target === 'body' && !target.querySelector('canvas')) return;
        resize.observe(target);
        const height = window.innerHeight;
        const width = window.innerWidth;
        const cardHeight = card.current.getBoundingClientRect().height;
        const rect = target.getBoundingClientRect();
        if (!scrolled) {
          scrolled = true;
          // Leave room for the explanation, including on short phone screens.
          window.scrollBy({
            top: rect.top - Math.max(20, (height - cardHeight - rect.height - 48) / 2),
            behavior: 'instant',
          });
          update();
          return;
        }
        const top = Math.max(12, rect.top - 6);
        let bottom = Math.min(height - 12, rect.bottom + 6);
        const below = bottom + 16;
        let cardTop: number;
        if (below + cardHeight <= height - 16) cardTop = below;
        else if (top - cardHeight - 16 >= 16) cardTop = top - cardHeight - 16;
        else {
          cardTop = Math.max(16, height - cardHeight - 16);
          // On short screens, spotlight the visible portion of the body above the card.
          bottom = Math.min(bottom, cardTop - 16);
        }
        setPlacement({
          left: Math.max(8, rect.left - 6),
          top,
          width: Math.min(width - 16, rect.width + 12),
          height: Math.max(0, bottom - top),
          cardTop,
        });
      });
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.body, { childList: true, subtree: true });
    const resize = new ResizeObserver(update);
    if (card.current) resize.observe(card.current);
    const resized = () => {
      scrolled = false;
      update();
    };
    window.addEventListener('resize', resized);
    window.addEventListener('scroll', update, true);
    return () => {
      observer.disconnect();
      resize.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resized);
      window.removeEventListener('scroll', update, true);
    };
  }, [stop, location.pathname]);

  function move(next: number) {
    const destination = STOPS[next];
    if (!destination) return;
    setPlacement(null);
    setIndex(next);
    void navigate(destination.route, { replace: true });
  }

  return (
    <dialog
      ref={dialog}
      className="app-tour-dialog"
      aria-labelledby="tour-heading"
      aria-describedby="tour-description"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      {placement !== null && (
        <div
          aria-hidden="true"
          className="app-tour-highlight"
          style={{
            left: placement.left,
            top: placement.top,
            width: placement.width,
            height: placement.height,
          }}
        />
      )}
      <div
        ref={card}
        className="app-tour-card rounded-sheet border border-subtle bg-surface p-5 text-primary shadow-floating"
        style={
          placement === null
            ? undefined
            : {
                top: `max(${String(placement.cardTop)}px, env(safe-area-inset-top))`,
                bottom: 'auto',
              }
        }
      >
        <div className="flex items-center justify-between gap-3">
          <p className="numeric text-sm text-secondary" aria-live="polite">
            {index + 1} of {STOPS.length}
          </p>
          <Button variant="ghost" onClick={onClose}>
            Skip tour
          </Button>
        </div>
        <h2
          ref={heading}
          tabIndex={-1}
          id="tour-heading"
          className="mt-1 text-xl font-semibold focus-visible:outline-2 focus-visible:outline-accent"
        >
          {stop.title}
        </h2>
        <p id="tour-description" className="mt-2 text-sm leading-relaxed text-secondary">
          {stop.text}
        </p>
        {placement === null && (
          <p role="status" className="mt-2 text-sm text-muted">
            Opening this stop… You can continue or skip.
          </p>
        )}
        <div className="mt-4 flex justify-between gap-3">
          <Button variant="secondary" disabled={index === 0} onClick={() => move(index - 1)}>
            Back
          </Button>
          <Button onClick={() => (index === STOPS.length - 1 ? onClose() : move(index + 1))}>
            {index === STOPS.length - 1 ? 'Finish tour' : 'Next'}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
