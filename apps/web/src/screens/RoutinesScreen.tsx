import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { describeWhen } from '@g7m/core';
import type { Routine } from '@g7m/db';
import { Button, TextField } from '@g7m/ui';
import { HeaderLink } from '../components/HeaderLink.js';
import { ChevronRightIcon, ClipboardIcon, PlayIcon } from '../components/icons.js';
import { useCatalogue, useWrite } from '../lib/db/use-catalogue.js';
import { startRoutineWorkout, useRoutines } from '../lib/db/use-routines.js';

/**
 * The workouts somebody has saved, newest-trained first.
 *
 * Every row starts the thing it names — that is what the list is opened for —
 * and the name itself opens the routine to change it. Two targets rather than
 * one, because "train this" and "edit this" are opposite intentions and a
 * single tap cannot mean both.
 */
export function RoutinesScreen() {
  const navigate = useNavigate();
  const state = useRoutines();
  const { write, busy, error } = useWrite();
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');

  const open = useCatalogue('routines-open-session', (r) => r.sessions.active());
  const hasOpenWorkout = open.data !== null;

  const routines = state.data ?? [];

  async function start(routineId: string): Promise<void> {
    const detail = await write((r) => r.routines.byId(routineId));
    if (detail === null || detail === undefined) return;

    const profile = await write((r) => r.profile.current());
    const started = await write((r) =>
      startRoutineWorkout(r, { routine: detail, bodyweightKg: profile?.bodyweightKg ?? null }),
    );
    if (started !== null) void navigate('/workout');
  }

  async function createEmpty(): Promise<void> {
    const created = await write((r) => r.routines.create({ name }));
    if (created === null) return;
    setNaming(false);
    setName('');
    void navigate(`/routines/${created.id}`);
  }

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-4 px-4 pt-safe-top pb-safe-bottom">
      <header className="flex items-baseline justify-between gap-4 pt-6 pb-2">
        <h1 className="text-2xl font-semibold text-primary">Your routines</h1>
        <HeaderLink to="/">Home</HeaderLink>
      </header>

      {(state.error ?? error) !== null && (
        <p role="alert" className="rounded-card bg-surface p-4 text-sm text-danger">
          {state.error ?? error}
        </p>
      )}

      {state.loading && state.data === null ? (
        <p className="rounded-card bg-surface p-4 text-sm text-muted">Loading…</p>
      ) : routines.length === 0 ? (
        <Empty />
      ) : (
        <ul className="flex flex-col gap-2">
          {routines.map((routine) => (
            <li key={routine.id}>
              <RoutineRow
                routine={routine}
                busy={busy}
                blocked={hasOpenWorkout}
                onStart={() => {
                  void start(routine.id);
                }}
              />
            </li>
          ))}
        </ul>
      )}

      {/* A workout already running is the one reason Start does nothing, so it
          is said once here rather than on every row. */}
      {hasOpenWorkout && routines.length > 0 && (
        <p className="text-sm text-muted">
          Finish the workout you have open before starting a routine.{' '}
          <Link
            to="/workout"
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            Open it
          </Link>
        </p>
      )}

      {naming ? (
        <section className="rounded-card border border-subtle bg-surface p-4">
          <h2 className="mb-2 text-base font-semibold text-primary">Name the routine</h2>
          <TextField
            label="Name"
            value={name}
            placeholder="Push Day"
            onChange={(event) => {
              setName(event.target.value);
            }}
          />
          <div className="mt-3 flex gap-3">
            <Button
              disabled={busy || name.trim() === ''}
              onClick={() => {
                void createEmpty();
              }}
            >
              Create
            </Button>
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setNaming(false);
                setName('');
              }}
            >
              Cancel
            </Button>
          </div>
        </section>
      ) : (
        <button
          type="button"
          onClick={() => {
            setNaming(true);
          }}
          className="flex min-h-tap items-center justify-center rounded-card border border-dashed border-strong text-sm text-secondary active:bg-surface"
        >
          + Build a routine from scratch
        </button>
      )}

      <p className="py-4 text-xs text-muted">
        A routine remembers the movements and the rep ranges, not the weights. Those come from what
        you lifted last time, so a routine never goes stale.
      </p>
    </main>
  );
}

function RoutineRow({
  routine,
  busy,
  blocked,
  onStart,
}: {
  readonly routine: Routine;
  readonly busy: boolean;
  readonly blocked: boolean;
  readonly onStart: () => void;
}) {
  return (
    <div className="flex items-stretch gap-2 rounded-card border border-subtle bg-surface">
      <Link
        to={`/routines/${routine.id}`}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-l-card px-4 py-3 active:bg-elevated focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
      >
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent"
        >
          <ClipboardIcon className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-medium text-primary">{routine.name}</span>
          <span className="numeric block text-xs text-muted">
            {routine.exerciseCount === 1
              ? '1 exercise'
              : `${String(routine.exerciseCount)} exercises`}
            {routine.lastPerformedAt !== null &&
              ` · ${describeWhen(routine.lastPerformedAt, new Date()).toLowerCase()}`}
          </span>
        </span>
        <ChevronRightIcon aria-hidden className="size-5 shrink-0 text-muted" />
      </Link>

      <button
        type="button"
        aria-label={`Start ${routine.name}`}
        disabled={busy || blocked || routine.exerciseCount === 0}
        onClick={onStart}
        className="flex w-16 shrink-0 items-center justify-center rounded-r-card border-l border-subtle text-accent active:bg-elevated focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent disabled:text-muted"
      >
        <PlayIcon className="size-6" />
      </button>
    </div>
  );
}

function Empty() {
  return (
    <section className="rounded-card border border-subtle bg-surface p-4">
      <h2 className="text-lg font-semibold text-primary">Nothing saved yet</h2>
      <p className="mt-1 max-w-prose text-sm text-secondary">
        Finish a workout and you will be offered the chance to keep it as a routine — that is the
        easiest way to make one, because you have just built it. You can also start from an empty
        one below, or save any past workout from its page in Progress.
      </p>
    </section>
  );
}
