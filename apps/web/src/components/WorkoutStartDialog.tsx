import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { Routine } from '@g7m/db';
import { Button } from '@g7m/ui';
import { useRoutines } from '../lib/db/use-routines.js';

export default function WorkoutStartDialog({
  busy,
  error,
  onStart,
  onClose,
}: {
  readonly busy: boolean;
  readonly error: string | null;
  readonly onStart: (routineId: string | null, skip: boolean) => void;
  readonly onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useId();
  const hint = useId();
  const [skip, setSkip] = useState(false);
  const routines = useRoutines();

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    node.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      node.close();
      document.body.style.overflow = overflow;
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-labelledby={heading}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input:not(:disabled)',
          ),
        ).filter((control) => !control.closest('[inert]'));
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-sheet border border-subtle bg-surface p-0 text-primary shadow-floating backdrop:bg-base/70 backdrop:backdrop-blur-sm"
    >
      <div className="flex max-h-[90dvh] flex-col">
        <header className="flex shrink-0 items-center justify-between gap-3 px-5 pt-4 pb-3">
          <h2 id={heading} className="text-xl font-semibold">
            Start a workout
          </h2>
          <Button variant="ghost" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
        </header>
        <section
          aria-label="Your routines"
          className="min-h-0 overflow-y-auto overscroll-contain px-5 pb-4"
        >
          <h3 className="mb-2 text-base font-medium text-primary">Choose a routine</h3>
          {routines.loading && routines.data === null ? (
            <p role="status" className="text-sm text-muted">
              Loading routines…
            </p>
          ) : routines.error !== null ? (
            <p role="alert" className="text-sm text-destructive">
              {routines.error}
            </p>
          ) : routines.data?.length === 0 ? (
            <p className="text-sm text-secondary">
              No routines yet. Finish a workout and save it as a routine to use it here next time.
            </p>
          ) : (
            <RoutinePages routines={routines.data ?? []} busy={busy} onStart={onStart} />
          )}
        </section>
        <div className="shrink-0 border-t border-subtle px-5 pt-4 pb-5">
          {error !== null && (
            <p role="alert" className="mb-3 text-sm text-destructive">
              {error}
            </p>
          )}
          <Button fullWidth disabled={busy} onClick={() => onStart(null, skip)}>
            {busy ? 'Setting it up…' : 'Start a blank workout'}
          </Button>
          <label className="mt-3 flex min-h-tap cursor-pointer items-center gap-3 text-base font-medium text-primary">
            <input
              type="checkbox"
              name="skip-workout-start-options"
              checked={skip}
              disabled={busy}
              aria-describedby={hint}
              onChange={(event) => setSkip(event.target.checked)}
              className="size-5 shrink-0 accent-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            />
            Do not show this again
          </label>
          <p id={hint} className="pl-8 text-sm text-secondary">
            Always start blank workouts. Change this in Settings.
          </p>
        </div>
      </div>
    </dialog>
  );
}

/** Full-width pages keep at most three routines visible, with native touch scrolling. */
function RoutinePages({
  routines,
  busy,
  onStart,
}: {
  readonly routines: readonly Routine[];
  readonly busy: boolean;
  readonly onStart: (routineId: string, skip: boolean) => void;
}) {
  const id = useId();
  const track = useRef<HTMLDivElement>(null);
  const dots = useRef<HTMLDivElement>(null);
  const current = useRef(0);
  const trackWidth = useRef(0);
  const [page, setPage] = useState(0);
  const pages = Array.from({ length: Math.ceil(routines.length / 3) }, (_, index) =>
    routines.slice(index * 3, index * 3 + 3),
  );
  const active = Math.min(page, Math.max(0, pages.length - 1));

  useLayoutEffect(() => {
    const element = track.current;
    if (!element) return;
    current.current = Math.min(current.current, Math.max(0, pages.length - 1));
    setPage(current.current);
    const align = () =>
      element.scrollTo({ left: current.current * element.clientWidth, behavior: 'instant' });
    align();
    trackWidth.current = element.clientWidth;
    const observer = new ResizeObserver(() => {
      if (element.clientWidth === trackWidth.current) return;
      trackWidth.current = element.clientWidth;
      align();
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [pages.length]);

  function goTo(index: number) {
    const element = track.current;
    if (!element) return;
    element.scrollTo({
      left: index * element.clientWidth,
      behavior: globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
  }

  function handleKey(event: KeyboardEvent, index: number) {
    const next =
      event.key === 'ArrowRight'
        ? Math.min(pages.length - 1, index + 1)
        : event.key === 'ArrowLeft'
          ? Math.max(0, index - 1)
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? pages.length - 1
              : null;
    if (next === null) return;
    event.preventDefault();
    (dots.current?.children.item(next) as HTMLButtonElement | null)?.focus({ preventScroll: true });
    goTo(next);
  }

  return (
    <div role="group" aria-label="Saved routines" aria-roledescription="carousel">
      <div
        ref={track}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
        onScroll={(event) => {
          const element = event.currentTarget;
          // A resize can emit scroll before ResizeObserver realigns the current page.
          if (element.clientWidth !== trackWidth.current || element.clientWidth === 0) return;
          const index = Math.max(
            0,
            Math.min(pages.length - 1, Math.round(element.scrollLeft / element.clientWidth)),
          );
          current.current = index;
          setPage(index);
        }}
      >
        {pages.map((routines, index) => (
          <div
            key={index}
            id={`${id}-${String(index)}`}
            role="group"
            aria-roledescription="slide"
            aria-label={`Routine page ${String(index + 1)} of ${String(pages.length)}`}
            inert={index !== active}
            aria-hidden={index !== active}
            className="w-full min-w-0 shrink-0 snap-start snap-always p-0.5"
          >
            <ul className="flex flex-col gap-2">
              {routines.map((routine) => (
                <li
                  key={routine.id}
                  className="flex items-center gap-3 rounded-card border border-subtle bg-elevated p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium break-words">{routine.name}</p>
                    <p className="text-sm text-muted">
                      {routine.exerciseCount}{' '}
                      {routine.exerciseCount === 1 ? 'exercise' : 'exercises'}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    aria-label={`Start ${routine.name}`}
                    disabled={busy || routine.exerciseCount === 0}
                    onClick={() => onStart(routine.id, false)}
                  >
                    Start
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {pages.length > 1 && (
        <>
          <div
            ref={dots}
            role="group"
            aria-label="Choose routine page"
            className="mt-1 flex flex-wrap justify-center"
          >
            {pages.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Show routine page ${String(index + 1)} of ${String(pages.length)}`}
                aria-controls={`${id}-${String(index)}`}
                aria-pressed={active === index}
                className="flex size-12 touch-manipulation items-center justify-center rounded-control hover:bg-elevated focus-visible:outline-2 focus-visible:outline-accent"
                onClick={() => goTo(index)}
                onKeyDown={(event) => handleKey(event, index)}
              >
                <span
                  aria-hidden
                  className={`size-1.5 rounded-full ${active === index ? 'bg-accent' : 'bg-strong'}`}
                />
              </button>
            ))}
          </div>
          <p className="sr-only" aria-live="polite" aria-atomic="true">
            Routine page {String(active + 1)} of {String(pages.length)}
          </p>
        </>
      )}
    </div>
  );
}
