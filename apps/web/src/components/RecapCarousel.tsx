import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

/** Native scrolling keeps horizontal swipes and vertical card scrolling separate. */
export function RecapCarousel({
  cards,
}: {
  readonly cards: readonly {
    readonly title: string;
    readonly content: (active: boolean) => ReactNode;
  }[];
}) {
  const id = useId();
  const track = useRef<HTMLDivElement>(null);
  const dots = useRef<HTMLDivElement>(null);
  const current = useRef(0);
  const [active, setActive] = useState(0);

  useLayoutEffect(() => {
    const element = track.current;
    if (element === null) return;
    let width = element.clientWidth;
    const observer = new ResizeObserver(() => {
      // Address-bar and card-height changes must not interrupt a swipe.
      if (element.clientWidth === width) return;
      width = element.clientWidth;
      element.scrollTo({ left: current.current * width, behavior: 'instant' });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  function goTo(index: number) {
    const element = track.current;
    if (element === null) return;
    const reduced = globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches;
    element.scrollTo({
      left: index * element.clientWidth,
      behavior: reduced ? 'instant' : 'smooth',
    });
  }

  function handleKey(event: KeyboardEvent, index: number) {
    const next =
      event.key === 'ArrowRight'
        ? Math.min(cards.length - 1, index + 1)
        : event.key === 'ArrowLeft'
          ? Math.max(0, index - 1)
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? cards.length - 1
              : null;
    if (next === null) return;
    event.preventDefault();
    (dots.current?.children.item(next) as HTMLButtonElement | null)?.focus({ preventScroll: true });
    goTo(next);
  }

  return (
    <section
      aria-label="Workout recap"
      aria-roledescription="carousel"
      className="recap-carousel min-w-0"
    >
      <div
        ref={track}
        className="recap-track"
        onScroll={(event) => {
          const element = event.currentTarget;
          const index = Math.max(
            0,
            Math.min(cards.length - 1, Math.round(element.scrollLeft / element.clientWidth)),
          );
          current.current = index;
          setActive(index);
        }}
      >
        {cards.map((card, index) => (
          <div
            key={card.title}
            id={`${id}-${String(index)}`}
            role="group"
            aria-roledescription="slide"
            aria-label={`${String(index + 1)} of ${String(cards.length)}: ${card.title}`}
            inert={index !== active}
            aria-hidden={index !== active}
            className="recap-slide"
            tabIndex={index === active ? 0 : -1}
            onKeyDown={(event) => {
              if (event.target !== event.currentTarget) return;
              handleKey(event, active);
            }}
          >
            {card.content(index === active)}
          </div>
        ))}
      </div>
      <div ref={dots} className="flex justify-center" role="group" aria-label="Choose recap card">
        {cards.map((card, index) => (
          <button
            key={card.title}
            type="button"
            aria-label={`Show ${card.title}`}
            aria-controls={`${id}-${String(index)}`}
            aria-pressed={active === index}
            className="flex size-12 touch-manipulation items-center justify-center rounded-control hover:bg-elevated focus-visible:outline-2 focus-visible:outline-accent"
            onClick={() => goTo(index)}
            onKeyDown={(event) => handleKey(event, index)}
          >
            <span
              aria-hidden
              className={`h-2 rounded-full ${active === index ? 'w-6 bg-accent' : 'w-2 bg-strong'}`}
            />
          </button>
        ))}
      </div>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {String(active + 1)} of {String(cards.length)}: {cards[active]?.title}
      </p>
    </section>
  );
}
