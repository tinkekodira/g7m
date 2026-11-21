import { t } from '@g7m/i18n';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { planMove, workoutUnits, type MoveTarget } from '@g7m/core';
import type { RoutineExercise } from '@g7m/db';
import { Button, TextField, cx } from '@g7m/ui';
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
 *
 * A superset moves as a block, with its own arrows on its frame, and the
 * arrows on its movements move them only within it (ADR-0112).
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
    if (!globalThis.confirm(t().profile.routine.confirmDelete)) return;
    await write((r) => r.routines.remove(routineId));
    void navigate('/routines');
  }

  /**
   * Move something one place: a movement, a whole superset, or a movement
   * within its superset. `planMove` works out the fewest rows to re-key.
   */
  async function move(target: MoveTarget, direction: -1 | 1): Promise<void> {
    const writes = planMove(view?.detail.exercises ?? [], target, direction);
    if (writes.length === 0) return;
    await write((r) => r.routines.reorder(writes));
  }

  if (state.loading && view === null) {
    return (
      <Shell>
        <p className="text-sm text-muted">{t().common.loading}</p>
      </Shell>
    );
  }

  if (view === null) {
    return (
      <Shell>
        <p className="max-w-prose text-sm text-secondary">{t().profile.routine.notOnDevice}</p>
      </Shell>
    );
  }

  const { detail, names } = view;
  const units = workoutUnits(detail.exercises, (movement) => movement.supersetId);

  return (
    <Shell>
      <header className="flex items-start justify-between gap-3 pt-6 pb-2">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold text-primary">{detail.routine.name}</h1>
          <p className="numeric mt-1 text-sm text-secondary">
            {t().profile.routinesScreen.exercises(detail.exercises.length)}
          </p>
        </div>
        <HeaderLink to="/routines">{t().profile.routine.routines}</HeaderLink>
      </header>

      {(state.error ?? error) !== null && (
        <p role="alert" className="rounded-card bg-surface p-4 text-sm text-destructive">
          {state.error ?? error}
        </p>
      )}

      {renaming ? (
        <section className="rounded-card border border-subtle bg-surface p-4">
          <TextField
            label={t().profile.routinesScreen.name}
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
              {t().common.save}
            </Button>
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setRenaming(false);
                setDraft('');
              }}
            >
              {t().common.cancel}
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
          {t().profile.routine.rename}
        </button>
      )}

      {detail.exercises.length === 0 ? (
        <p className="rounded-card border border-subtle bg-surface p-4 text-sm text-secondary">
          {t().profile.routine.empty}
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {units.map((unit, index) => {
            const label = String(index + 1);
            const first = index === 0;
            const last = index === units.length - 1;
            if (unit.kind === 'single') {
              const movement = unit.item;
              const name = names.get(movement.exerciseId) ?? t().profile.unknownExercise;
              return (
                <li key={movement.id}>
                  <MovementRow
                    movement={movement}
                    name={name}
                    label={label}
                    upDisabled={busy || first}
                    downDisabled={busy || last}
                    busy={busy}
                    onMove={(direction) => {
                      void move({ unit: index }, direction);
                    }}
                    onRemove={() => {
                      void write((r) => r.routines.removeExercise(movement.id));
                    }}
                  />
                </li>
              );
            }
            return (
              <li key={unit.supersetId}>
                <section
                  aria-label={t().profile.routine.superset}
                  className="flex flex-col gap-2 rounded-card border-l-4 border-subtle pl-2"
                >
                  <div className="flex items-center gap-1 pl-2">
                    <p className="flex-1 text-xs font-semibold tracking-wide text-accent uppercase">
                      {t().profile.routine.supersetLabel(label)}
                    </p>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        void write((r) => r.routines.ungroup(routineId, unit.supersetId));
                      }}
                      className="min-h-tap px-2 text-xs text-muted underline-offset-4 hover:underline"
                    >
                      {t().profile.routine.ungroup}
                    </button>
                    <IconButton
                      label={t().profile.routine.moveSupersetUp}
                      disabled={busy || first}
                      onClick={() => {
                        void move({ unit: index }, -1);
                      }}
                    >
                      <ArrowUpIcon className="size-5" />
                    </IconButton>
                    <IconButton
                      label={t().profile.routine.moveSupersetDown}
                      disabled={busy || last}
                      onClick={() => {
                        void move({ unit: index }, 1);
                      }}
                    >
                      <ChevronDownIcon className="size-5" />
                    </IconButton>
                  </div>
                  {unit.members.map((movement, position) => (
                    <MovementRow
                      key={movement.id}
                      movement={movement}
                      name={names.get(movement.exerciseId) ?? t().profile.unknownExercise}
                      label={`${label}${String.fromCharCode(97 + position)}`}
                      upDisabled={busy || position === 0}
                      downDisabled={busy || position === unit.members.length - 1}
                      busy={busy}
                      onMove={(direction) => {
                        void move({ member: movement.id }, direction);
                      }}
                      onRemove={() => {
                        void write((r) => r.routines.removeExercise(movement.id));
                      }}
                    />
                  ))}
                </section>
              </li>
            );
          })}
        </ol>
      )}

      <Link
        to={`/exercises?routine=${routineId}`}
        className="flex min-h-tap items-center justify-center rounded-card border border-dashed border-strong text-sm text-secondary active:bg-surface"
      >
        {t().profile.routine.addExercise}
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
          {t().profile.routine.delete}
        </Button>
        <p className="mt-2 text-xs text-muted">{t().profile.routine.deleteHint}</p>
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
  label,
  upDisabled,
  downDisabled,
  busy,
  onMove,
  onRemove,
}: {
  readonly movement: RoutineExercise;
  readonly name: string;
  /** "3", or "3a" for the first movement of the third thing, a superset. */
  readonly label: string;
  readonly upDisabled: boolean;
  readonly downDisabled: boolean;
  readonly busy: boolean;
  readonly onMove: (direction: -1 | 1) => void;
  readonly onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-card border border-subtle bg-surface p-3">
      <span className="numeric w-6 shrink-0 text-center text-sm text-muted">{label}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-medium text-primary">{name}</span>
        <span className="numeric block text-xs text-muted">
          {movement.targetSets} × {movement.targetRepLow}
          {movement.targetRepHigh > movement.targetRepLow && `–${String(movement.targetRepHigh)}`}
        </span>
      </span>

      <div className="flex shrink-0 items-center gap-1">
        <IconButton
          label={t().profile.routine.moveUp(name)}
          disabled={upDisabled}
          onClick={() => {
            onMove(-1);
          }}
        >
          <ArrowUpIcon className="size-5" />
        </IconButton>
        <IconButton
          label={t().profile.routine.moveDown(name)}
          disabled={downDisabled}
          onClick={() => {
            onMove(1);
          }}
        >
          <ChevronDownIcon className="size-5" />
        </IconButton>
        <IconButton
          label={t().profile.routine.remove(name)}
          danger
          disabled={busy}
          onClick={onRemove}
        >
          <TrashIcon className="size-5" />
        </IconButton>
      </div>
    </div>
  );
}

function IconButton({
  label,
  danger = false,
  disabled,
  onClick,
  children,
}: {
  readonly label: string;
  /** Red, for the one that takes something away. */
  readonly danger?: boolean;
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
      className={cx(
        'flex size-tap items-center justify-center rounded-control active:bg-elevated focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent disabled:text-muted/40',
        danger ? 'text-destructive' : 'text-secondary',
      )}
    >
      {children}
    </button>
  );
}
