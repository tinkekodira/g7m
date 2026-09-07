import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Chip, KitSlider, TextField, type KitPosition } from '@g7m/ui';
import type { Exercise } from '@g7m/db';
import { HeaderLink } from '../components/HeaderLink.js';
import { useCatalogue, useWrite } from '../lib/db/use-catalogue.js';
import {
  NO_FILTERS,
  hasFilters,
  readFilters,
  toExerciseFilter,
  toggleEquipment,
  writeFilters,
  type LibraryFilters,
} from './library-filters.js';

/**
 * The exercise library.
 *
 * Reads entirely from the device. There is no loading spinner tied to a
 * network request anywhere on this screen, and turning the phone to airplane
 * mode changes nothing about it — which is the point of everything in Phase 2.
 */
export function ExerciseLibraryScreen() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { write, busy } = useWrite();
  const filters = readFilters(params);
  const [equipmentOpen, setEquipmentOpen] = useState(filters.equipment.length > 0);

  /**
   * Reached from "Add an exercise" inside a workout.
   *
   * The same screen rather than a second picker: search and filters are the
   * whole reason this list is usable, and maintaining two of them would mean
   * fixing every bug twice.
   */
  const adding = params.get('add') === '1';

  /**
   * Replace rather than push.
   *
   * Typing into the search box would otherwise write one history entry per
   * keystroke, and the back button would spend eleven presses spelling
   * "deadlift" backwards before it left the screen.
   */
  const update = (next: LibraryFilters): void => {
    const written = writeFilters(next);
    // Carried across every filter change. Without this, typing one character
    // into the search box drops you out of add mode and back into browsing,
    // which is a maddening thing to have happen mid-workout.
    if (adding) written.set('add', '1');
    setParams(written, { replace: true });
  };

  const addToWorkout = (exercise: Exercise): void => {
    void (async () => {
      const session = await write((r) => r.sessions.active());
      if (session == null) return;
      await write((r) => r.sessions.addExercise(session.id, exercise.id));
      await navigate('/workout');
    })();
  };

  const taxonomy = useCatalogue('taxonomy', async (repositories) => {
    const [groups, equipment] = await Promise.all([
      repositories.muscles.groups(),
      repositories.equipment.list(),
    ]);
    return { groups, equipment };
  });

  const groupIdBySlug = useMemo(
    () => new Map((taxonomy.data?.groups ?? []).map((group) => [group.slug, group.id])),
    [taxonomy.data],
  );
  const equipmentIdBySlug = useMemo(
    () => new Map((taxonomy.data?.equipment ?? []).map((item) => [item.slug, item.id])),
    [taxonomy.data],
  );

  /**
   * The query waits for the taxonomy, because the URL carries slugs and the
   * repository takes ids. Running it early would filter by nothing and then
   * visibly re-filter a moment later.
   */
  const ready = taxonomy.data !== null;
  const criteria = toExerciseFilter(filters, groupIdBySlug, equipmentIdBySlug);
  const key = ready ? `${JSON.stringify(criteria)}|${filters.query}` : 'waiting';

  const results = useCatalogue(key, async (repositories) => {
    if (!ready) return null;
    const [exercises, muscles] = await Promise.all([
      repositories.exercises.browse(criteria, filters.query),
      repositories.exercises.primaryMuscleNames(),
    ]);
    return { exercises, muscles };
  });

  const error = taxonomy.error ?? results.error;
  const loading = taxonomy.loading || results.loading || !ready;
  const exercises = results.data?.exercises ?? [];

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-4 px-4 pt-safe-top pb-safe-bottom">
      <header className="flex items-baseline justify-between gap-4 pt-6 pb-2">
        <h1 className="text-2xl font-semibold text-primary">
          {adding ? 'Add an exercise' : 'Exercises'}
        </h1>
        <HeaderLink to={adding ? '/workout' : '/'}>{adding ? 'Back' : 'Home'}</HeaderLink>
      </header>

      <TextField
        label="Search"
        type="search"
        inputMode="search"
        autoCapitalize="none"
        autoCorrect="off"
        placeholder="Squat, bench, row…"
        value={filters.query}
        onChange={(event) => {
          update({ ...filters, query: event.target.value });
        }}
      />

      {/* Above the muscle chips, because it is the coarser question — where
          you are training decides most of the list before any muscle does. */}
      <KitSlider
        value={filters.kit ?? 'both'}
        onChange={(position: KitPosition) => {
          update({ ...filters, kit: position === 'both' ? null : position });
        }}
      />

      {/* A scrolling row rather than a wrapping grid: one thumb-swipe reaches
          every group, and the list below never moves down as chips wrap. */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Chip
          selected={filters.muscleGroup === null}
          onClick={() => {
            update({ ...filters, muscleGroup: null });
          }}
        >
          All
        </Chip>
        {(taxonomy.data?.groups ?? []).map((group) => (
          <Chip
            key={group.id}
            selected={filters.muscleGroup === group.slug}
            onClick={() => {
              // Tapping the selected group again clears it, which is what a
              // single-select row of chips has to do to be usable at all.
              const next = filters.muscleGroup === group.slug ? null : group.slug;
              update({ ...filters, muscleGroup: next });
            }}
          >
            {group.name}
          </Chip>
        ))}
      </div>

      <section className="rounded-card bg-surface">
        <button
          type="button"
          className="flex min-h-tap w-full items-center justify-between px-4 text-left"
          aria-expanded={equipmentOpen}
          onClick={() => {
            setEquipmentOpen((open) => !open);
          }}
        >
          <span className="text-sm font-medium text-primary">
            Equipment
            {filters.equipment.length > 0 && (
              <span className="text-secondary"> · {filters.equipment.length} selected</span>
            )}
          </span>
          <span aria-hidden className="text-muted">
            {equipmentOpen ? '−' : '+'}
          </span>
        </button>

        {equipmentOpen && (
          <div className="flex flex-wrap gap-2 px-4 pb-4">
            {(taxonomy.data?.equipment ?? []).map((item) => (
              <Chip
                key={item.id}
                selected={filters.equipment.includes(item.slug)}
                onClick={() => {
                  update(toggleEquipment(filters, item.slug));
                }}
              >
                {item.name}
              </Chip>
            ))}
            {/* Says what selecting nothing means, because the alternative
                reading — "show me exercises needing no equipment" — is a real
                one, and the list would look broken to anyone holding it. */}
            <p className="mt-1 w-full text-xs text-muted">
              Nothing selected shows everything. Selecting some shows only what you could do with
              exactly those — every piece an exercise needs has to be ticked.
            </p>
          </div>
        )}
      </section>

      {error !== null ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <>
          <p className="text-sm text-secondary" aria-live="polite">
            {exercises.length === 1 ? '1 exercise' : `${String(exercises.length)} exercises`}
          </p>

          {exercises.length === 0 ? (
            <EmptyLibrary
              filtered={hasFilters(filters)}
              onClear={() => {
                update(NO_FILTERS);
              }}
            />
          ) : (
            <ul className="flex flex-col gap-2 pb-6">
              {exercises.map((exercise) => (
                <li key={exercise.id}>
                  <ExerciseRow
                    exercise={exercise}
                    muscle={results.data?.muscles.get(exercise.id) ?? null}
                    onAdd={
                      adding
                        ? () => {
                            addToWorkout(exercise);
                          }
                        : null
                    }
                    busy={busy}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}

function ExerciseRow({
  exercise,
  muscle,
  onAdd,
  busy,
}: {
  readonly exercise: Exercise;
  readonly muscle: string | null;
  /** Non-null while picking an exercise for a workout in progress. */
  readonly onAdd: (() => void) | null;
  readonly busy: boolean;
}) {
  const detail = [muscle, exercise.mechanic === 'compound' ? 'Compound' : 'Isolation']
    .filter((part): part is string => part !== null)
    .join(' · ');

  const body = (
    <>
      <span className="text-base font-medium text-primary">{exercise.name}</span>
      <span className="text-sm text-secondary">{detail}</span>
    </>
  );

  // A button, not a link, when the tap adds rather than navigates. The
  // difference matters to a screen reader and to anyone who long-presses
  // expecting "open in new tab" to mean something.
  if (onAdd !== null) {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={onAdd}
        className="flex min-h-tap w-full flex-col justify-center rounded-card bg-surface px-4 py-3 text-left active:bg-elevated disabled:opacity-60"
      >
        {body}
      </button>
    );
  }

  return (
    <Link
      to={`/exercises/${exercise.slug}`}
      className="flex min-h-tap flex-col justify-center rounded-card bg-surface px-4 py-3 active:bg-elevated"
    >
      {body}
    </Link>
  );
}

/**
 * Two different empty states, because they have different causes and only one
 * of them has an action.
 *
 * An empty catalogue on a fresh install means sync has not delivered it yet —
 * telling that person to "try a different search" would be nonsense.
 */
function EmptyLibrary({
  filtered,
  onClear,
}: {
  readonly filtered: boolean;
  readonly onClear: () => void;
}) {
  if (!filtered) {
    return (
      <p className="max-w-prose py-6 text-sm text-secondary">
        No exercises on this device yet. They arrive with the first sync — open the app once with a
        connection and they stay for good.
      </p>
    );
  }
  return (
    <div className="flex flex-col items-start gap-3 py-6">
      <p className="max-w-prose text-sm text-secondary">Nothing matches all of those filters.</p>
      <button
        type="button"
        onClick={onClear}
        className="min-h-tap text-sm text-accent underline-offset-4 hover:underline"
      >
        Clear filters
      </button>
    </div>
  );
}
