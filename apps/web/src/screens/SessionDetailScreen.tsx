import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { workoutTitle } from '@g7m/core';
import { HeaderLink } from '../components/HeaderLink.js';
import { SessionBody } from '../components/SessionBody.js';
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

  const state = useCatalogue(`session:${sessionId}`, async (repositories) => {
    const session = await repositories.sessions.byId(sessionId);
    if (session === null) return null;

    const [profile, entries, work] = await Promise.all([
      repositories.profile.current(),
      repositories.sessions.exercisesFor(sessionId),
      repositories.history.primaryWork(sessionId),
    ]);

    const blocks = await Promise.all(
      entries.map(async (entry) => {
        const [exercise, sets] = await Promise.all([
          repositories.exercises.byId(entry.exerciseId),
          repositories.sessions.setsFor(entry.id),
        ]);
        return { entry, exercise, sets };
      }),
    );

    const bouts = blocks
      .filter((block) => block.exercise?.cardioKind != null)
      .reduce((sum, block) => sum + block.sets.filter((set) => set.isCompleted).length, 0);
    // The same name the history list gave it, so the row and the page agree.
    const title = session.name ?? workoutTitle(work.get(sessionId) ?? [], bouts);

    return { session, profile, blocks, title };
  });

  const data = state.data;

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-4 px-4 pt-safe-top pb-safe-bottom">
      <header className="flex items-baseline justify-between gap-4 pt-6 pb-2">
        <h1 className="text-2xl font-semibold text-primary">{data?.title ?? 'Workout'}</h1>
        <HeaderLink to="/progress">Progress</HeaderLink>
      </header>

      {state.error !== null ? (
        <p role="alert" className="text-sm text-danger">
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
          <SessionBody
            startedAt={data.session.startedAt}
            bodyweightKg={data.session.bodyweightKg}
            unitSystem={data.profile?.unitSystem ?? 'metric'}
            blocks={data.blocks}
          />
          <KeepAsRoutine
            sessionId={sessionId}
            suggestion={data.session.name ?? ''}
            /* Nothing to template from a session with nothing ticked in it. */
            enabled={data.blocks.some((block) =>
              block.sets.some((set) => set.isCompleted && set.setType !== 'warmup'),
            )}
          />
          <DeleteWorkout sessionId={sessionId} />
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

  if (!enabled) return null;

  return (
    <section className="rounded-card border border-subtle bg-surface p-4">
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
            <p role="alert" className="mt-2 text-sm text-danger">
              {error}
            </p>
          )}
        </>
      ) : (
        <>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              setOpen(true);
            }}
          >
            Save as a routine
          </Button>
          <p className="mt-2 text-xs text-muted">
            Keeps the movements and rep ranges, so you can start this session again in one tap.
          </p>
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
    <div className="py-4">
      <Button
        variant="danger"
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
        <TrashIcon className="size-5" />
        Delete workout
      </Button>
      {error !== null && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
