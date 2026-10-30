import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { loadWorkoutRecap } from '../lib/db/workout-recap.js';
import { WorkoutRecap } from '../components/WorkoutRecap.js';
import { HeaderLink } from '../components/HeaderLink.js';
import { TrashIcon } from '../components/icons.js';
import { Button, TextField } from '@g7m/ui';
import { useCatalogue, useWrite } from '../lib/db/use-catalogue.js';

/**
 * One workout, as it was logged.
 *
 * Read-only on purpose. Editing a finished session is a real feature and a
 * separate one — it needs to decide what happens to a personal record set by a
 * set that is later deleted, and that question deserves more than a pencil
 * icon added here because there was room for it.
 */
export function SessionDetailScreen() {
  const { sessionId = '' } = useParams();

  const location = useLocation();
  const navigation = location.state as { workoutFinished?: boolean; afterwards?: string } | null;
  const fresh = navigation?.workoutFinished === true;
  const afterwards = navigation?.afterwards ?? '/';
  const state = useCatalogue(`session:${sessionId}`, (r) => loadWorkoutRecap(r, sessionId));

  const data = state.data;

  return (
    <main className="recap-screen mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 pt-safe-top">
      <header className="flex shrink-0 items-baseline justify-between gap-4 pt-4 pb-1">
        <h1 className="min-w-0 text-2xl font-semibold break-words text-primary">
          {fresh ? 'Workout saved' : (data?.title ?? 'Workout')}
        </h1>
        {!fresh && <HeaderLink to="/progress">Progress</HeaderLink>}
      </header>

      {state.error !== null ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : state.loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : data === null ? (
        <p className="max-w-prose text-sm text-secondary">
          That workout is not on this device. It may not have synced yet, or it may have been
          discarded.
        </p>
      ) : (
        <>
          <WorkoutRecap key={sessionId} data={data} />
          <div
            className="recap-actions grid shrink-0 grid-cols-2 gap-2 pb-3"
            aria-label="Workout actions"
            role="group"
          >
            <Link
              to={fresh ? afterwards : '/progress'}
              className="col-span-2 flex min-h-tap items-center justify-center rounded-control bg-accent px-4 font-medium text-on-accent hover:bg-accent-hover active:bg-accent-pressed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Done
            </Link>
            <KeepAsRoutine
              sessionId={sessionId}
              suggestion={data.session.name ?? ''}
              enabled={data.blocks.some((block) =>
                block.sets.some((set) => set.isCompleted && set.setType !== 'warmup'),
              )}
            />
            <DeleteWorkout sessionId={sessionId} />
          </div>
        </>
      )}
    </main>
  );
}

/**
 * Turn a workout that already happened into a routine.
 *
 * The other half of the offer made when a workout is finished, for the session
 * somebody said "not this one" to and then trained twice more. Opens closed:
 * this screen is read to see what was done, and a name box on it by default
 * would be a form in the way of that.
 */
function KeepAsRoutine({
  sessionId,
  suggestion,
  enabled,
}: {
  readonly sessionId: string;
  readonly suggestion: string;
  readonly enabled: boolean;
}) {
  const navigate = useNavigate();
  const { write, busy, error } = useWrite();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(suggestion);

  return (
    <section className={open ? 'col-span-2' : 'min-w-0'}>
      {open ? (
        <>
          <h2 className="mb-3 text-base font-semibold text-primary">Name the routine</h2>
          <TextField
            label="Routine name"
            value={name}
            placeholder="Push Day"
            onChange={(event) => {
              setName(event.target.value);
            }}
          />
          <div className="mt-3 flex flex-wrap gap-3">
            <Button
              disabled={busy || name.trim() === ''}
              onClick={() => {
                void write((r) => r.routines.createFromSession({ sessionId, name })).then(
                  (saved) => {
                    if (saved !== null) void navigate('/routines');
                  },
                );
              }}
            >
              Save
            </Button>
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setOpen(false);
              }}
            >
              Cancel
            </Button>
          </div>
          {error !== null && (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </>
      ) : (
        <>
          <Button
            variant="secondary"
            className="px-2 text-sm"
            disabled={!enabled}
            fullWidth
            onClick={() => {
              setOpen(true);
            }}
          >
            Save as a routine
          </Button>
        </>
      )}
    </section>
  );
}

/**
 * Delete this workout for good.
 *
 * At the bottom of the screen, after everything else, so it cannot be hit
 * reaching for something above it. Deletes the session and every exercise and
 * set logged under it (`SessionRepository.discard`, the same call the
 * in-progress workout screen uses to abandon a session) — nothing about that
 * call is specific to a session still in progress. Every number that could
 * mention this workout (Progress, the calendar, an exercise's estimated 1RM,
 * streaks, achievements) is computed fresh from the sessions on the device
 * rather than cached, so none of it needs separate cleanup — see DECISIONS.md.
 */
function DeleteWorkout({ sessionId }: { readonly sessionId: string }) {
  const navigate = useNavigate();
  const { write, busy, error } = useWrite();

  return (
    <div>
      <Button
        variant="danger-outline"
        fullWidth
        className="px-2 text-sm"
        disabled={busy}
        onClick={() => {
          if (!globalThis.confirm("Delete this workout? This can't be undone.")) return;
          void write((r) => r.sessions.discard(sessionId)).then((result) => {
            // Null means the write failed and its error is already set below —
            // leaving means the error message goes with it, unread.
            if (result !== null) void navigate(-1);
          });
        }}
      >
        <TrashIcon className="hidden size-4 shrink-0 sm:block" />
        Delete workout
      </Button>
      {error !== null && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
