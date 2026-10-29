import { useEffect, useId, useRef, useState } from 'react';
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
        const controls = event.currentTarget.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled)',
        );
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
            <p role="alert" className="text-sm text-danger">
              {routines.error}
            </p>
          ) : routines.data?.length === 0 ? (
            <p className="text-sm text-secondary">
              No routines yet. Finish a workout and save it as a routine to use it here next time.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {routines.data?.map((routine) => (
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
          )}
        </section>
        <div className="shrink-0 border-t border-subtle px-5 pt-4 pb-5">
          {error !== null && (
            <p role="alert" className="mb-3 text-sm text-danger">
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
