import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { Link } from 'react-router';
import { HomeIcon } from './icons.js';

/** The header link's independent hand-off, without changing the active session. */
export function FloatingHome({ anchor }: { readonly anchor: RefObject<HTMLDivElement | null> }) {
  const position = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useLayoutEffect(() => {
    const target = anchor.current;
    const fixed = position.current;
    if (target === null || fixed === null) return;
    let observer: IntersectionObserver | undefined;
    let top = 0;
    const updateVisibility = () => {
      setVisible(target.getBoundingClientRect().bottom <= top);
    };
    const observe = () => {
      observer?.disconnect();
      top = fixed.getBoundingClientRect().top;
      updateVisibility();
      observer = new IntersectionObserver(updateVisibility, {
        rootMargin: `-${String(top)}px 0px 0px 0px`,
        threshold: 0,
      });
      observer.observe(target);
    };
    observe();
    // Programmatic jumps can skip the observer's visible area altogether.
    window.addEventListener('scroll', updateVisibility, { passive: true });
    window.addEventListener('resize', observe);
    window.addEventListener('pageshow', observe);
    return () => {
      observer?.disconnect();
      window.removeEventListener('scroll', updateVisibility);
      window.removeEventListener('resize', observe);
      window.removeEventListener('pageshow', observe);
    };
  }, [anchor]);
  return (
    <div
      ref={position}
      className="workout-home-position"
      data-visible={visible}
      aria-hidden={!visible}
      inert={!visible}
    >
      <Link
        to="/"
        aria-label="Go home"
        className="workout-home focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <HomeIcon className="size-5" />
      </Link>
    </div>
  );
}
