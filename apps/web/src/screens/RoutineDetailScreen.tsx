import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import type { RoutineExercise } from '@g7m/db';
import { Button, TextField } from '@g7m/ui';
import { HeaderLink } from '../components/HeaderLink.js';
import { ChevronDownIcon, ArrowUpIcon, TrashIcon } from '../components/icons.js';
import { useWrite } from '../lib/db/use-catalogue.js';
import { useRoutine } from '../lib/db/use-routines.js';

/**
 * One routine, and the ways to change it.
 *
 * Rename, reorder, add and remove — everything except the weights, which a
 * routine deliberately does not hold, and the rep ranges, which come from the
 * catalogue's own recommendation for each lift.
 *
 * Reordering is two buttons rather than a drag. A drag handle on a list inside
 * a scrolling page is the single most fragile interaction on a touchscreen,
 * and "up" and "down" are unambiguous with one thumb and a bar in the other
 * hand. Each press writes one row, because `order_key` is fractional.
 */
export function RoutineDetailScreen() {
  const { routineId = '' } = useParams();
  const navigate = useNavigate();
  const state = useRoutine(routineId);
  const { write, busy, error } = useWrite();

  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState('');

  const view = state.data;

  async function rename(): Promise<void> {
    if (draft.trim() === '') return;
    await write((r) => r.routines.rename(routineId, draft));
    setRenaming(false);
    setDraft('');
  }

  async function remove(): Promise<void> {
    if (!globalThis.confirm('Delete this routine? The workouts you did with it are kept.')) return;
    await write((r) => r.routines.remove(routineId));
    void navigate('/routines');
  }

  /**
   * Move one movement one place, by asking for a key between its new
   * neighbours. Nulls are the ends of the list.
   */
  async function move(index: number, direction: -1 | 1): Promise<void> {
    const list = view?.detail.exercises ?? [];
    const moving = list[index];
    if (moving === undefined) return;

    const target = index + direction;
    if (target < 0 || target >= list.length) return;

    const [beforeKey, afterKey] =
      direction === -1
        ? [list[target - 1]?.orderKey ?? null, list[target]?.orderKey ?? null]
        : [list[target]?.orderKey ?? null, list[target + 1]?.orderKey ?? null];

    await write((r) => r.routines.move(moving.id, beforeKey, afterKey));
  }

  if (state.loading && view === null) {
    return (
      <Shell>
        <p className="text-sm text-muted">Loading…</p>
      </Shell>
    );
  }

  if (view === null) {
    return (
      <Shell>
        <p className="max-w-prose text-sm text-secondary">
          That routine is not on this device. It may have been deleted, or it may not have synced
          yet.
        </p>
      </Shell>
    );
  }

  const { detail, names } = view;

  return (
    <Shell>
      <header className="flex items-start justify-between gap-3 pt-6 pb-2">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold text-primary">{detail.routine.name}</h1>
          <p className="numeric mt-1 text-sm text-secondary">
            {detail.exercises.length === 1
              ? '1 exercise'
              : `${String(detail.exercises.length)} exercises`}
          </p>
        </div>
        <HeaderLink to="/routines">Routines</HeaderLink>
      </header>

      {(state.error ?? error) !== null && (
        <p role="alert" className="rounded-card bg-surface p-4 text-sm text-danger">
          {state.error ?? error}
        </p>
      )}

      {renaming ? (
        <section className="rounded-card border border-subtle bg-surface p-4">
          <TextField
            label="Name"
            value={draft}
            placeholder={detail.routine.name}
            onChange={(event) => {
              setDraft(event.target.value);
            }}
          />
          <div className="mt-3 flex gap-3">
            <Button
              disabled={busy || draft.trim() === ''}
              onClick={() => {
                void rename();
              }}
            >
              Save
            </Button>
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setRenaming(false);
                setDraft('');
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
            setRenaming(true);
            setDraft(detail.routine.name);
          }}
          className="self-start text-sm font-medium text-accent underline-offset-4 hover:underline"
        >
          Rename
        </button>
      )}

      {detail.exercises.length === 0 ? (
        <p className="rounded-card border border-subtle bg-surface p-4 text-sm text-secondary">
          Nothing in it yet. Add the movements you want and they will be written into every workout
          you start from it.
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {detail.exercises.map((movement, index) => (
            <li key={movement.id}>
              <MovementRow
                movement={movement}
                name={names.get(movement.exerciseId) ?? 'Unknown exercise'}
                index={index}
                total={detail.exercises.length}
                busy={busy}
                onMove={(direction) => {
                  void move(index, direction);
                }}
                onRemove={() => {
                  void write((r) => r.routines.removeExercise(movement.id));
                }}
              />
            </li>
          ))}
        </ol>
      )}

      <Link
        to={`/exercises?routine=${routineId}`}
        className="flex min-h-tap items-center justify-center rounded-card border border-dashed border-strong text-sm text-secondary active:bg-surface"
      >
        + Add an exercise
      </Link>

      <div className="py-4">
        <Button
          variant="danger"
          disabled={busy}
          onClick={() => {
            void remove();
          }}
        >
          <TrashIcon className="size-5" />
          Delete this routine
        </Button>
        <p className="mt-2 text-xs text-muted">
          The workouts you have already done with it are kept — they happened.
        </p>
      </div>
    </Shell>
  );
}

function Shell({ children }: { readonly children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-4 px-4 pt-safe-top pb-safe-bottom">
      {children}
    </main>
  );
}

function MovementRow({
  movement,
  name,
  index,
  total,
  busy,
  onMove,
  onRemove,
}: {
  readonly movement: RoutineExercise;
  readonly name: string;
  readonly index: number;
  readonly total: number;
  readonly busy: boolean;
  readonly onMove: (direction: -1 | 1) => void;
  readonly onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-card border border-subtle bg-surface p-3">
      <span className="numeric w-5 shrink-0 text-center text-sm text-muted">{index + 1}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-medium text-primary">{name}</span>
        <span className="numeric block text-xs text-muted">
          {movement.targetSets} × {movement.targetRepLow}
          {movement.targetRepHigh > movement.targetRepLow && `–${String(movement.targetRepHigh)}`}
        </span>
      </span>

      <div className="flex shrink-0 items-center gap-1">
        <IconButton
          label={`Move ${name} up`}
          disabled={busy || index === 0}
          onClick={() => {
            onMove(-1);
          }}
        >
          <ArrowUpIcon className="size-5" />
        </IconButton>
        <IconButton
          label={`Move ${name} down`}
          disabled={busy || index === total - 1}
          onClick={() => {
            onMove(1);
          }}
        >
          <ChevronDownIcon className="size-5" />
        </IconButton>
        <IconButton label={`Remove ${name}`} disabled={busy} onClick={onRemove}>
          <TrashIcon className="size-5" />
        </IconButton>
      </div>
    </div>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  readonly label: string;
  readonly disabled: boolean;
  readonly onClick: () => void;
  readonly children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-tap items-center justify-center rounded-control text-secondary active:bg-elevated focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent disabled:text-muted/40"
    >
      {children}
    </button>
  );
}
