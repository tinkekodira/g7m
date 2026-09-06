import { Suspense, lazy, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { checkModelContract, placeholderBodyParts, type AnatomyMode } from '@g7m/anatomy';
import { Chip } from '@g7m/ui';
import { DEFAULT_WEEK_START, recentWeeks, relativeVolume, volumeByMuscle } from '@g7m/core';
import type { Exercise, Muscle } from '@g7m/db';
import { HeaderLink } from '../components/HeaderLink.js';
import { useCatalogue } from '../lib/db/use-catalogue.js';

/**
 * Learn: the body, and what trains each part of it.
 *
 * The viewer is loaded on demand. three.js and its react bindings are the
 * largest thing this app will ever ship — several hundred kilobytes — and a
 * lifter who only ever logs sets should not download a 3D engine to do it.
 * `lazy` puts it in its own chunk that only this route pulls in.
 */
const AnatomyViewer = lazy(() =>
  import('@g7m/anatomy').then((module) => ({ default: module.AnatomyViewer })),
);

interface MuscleDetail {
  readonly muscle: Muscle;
  readonly compound: readonly Exercise[];
  readonly isolation: readonly Exercise[];
}

/** Four weeks. Long enough to include a full training split, short enough to be current. */
const HEATMAP_WEEKS = 4;

export function LearnScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const [mode, setMode] = useState<AnatomyMode>('explore');
  const now = useMemo(() => new Date(), []);

  const parts = useMemo(() => placeholderBodyParts(), []);

  const taxonomy = useCatalogue('muscles', async (repositories) => {
    const [all, selectable] = await Promise.all([
      repositories.muscles.list(),
      repositories.muscles.selectable(),
    ]);
    return { all, selectable };
  });

  /**
   * The model checked against the taxonomy, at load.
   *
   * Both halves of a mismatch are otherwise silent: a muscle with no geometry
   * is a part of the body that does not respond to a tap, and geometry with no
   * muscle highlights and then shows an empty list. Neither raises anything,
   * and both read as "the model is broken".
   */
  const report = useMemo(() => {
    if (taxonomy.data === null) return null;
    return checkModelContract(
      {
        all: taxonomy.data.all.map((muscle) => muscle.slug),
        selectable: taxonomy.data.selectable.map((muscle) => muscle.slug),
      },
      parts.map((part) => part.nodeName),
    );
  }, [taxonomy.data, parts]);

  const detail = useCatalogue<MuscleDetail | null>(
    `muscle:${selected ?? ''}`,
    async (repositories) => {
      if (selected === null) return null;
      const muscle = await repositories.muscles.bySlug(selected);
      if (muscle === null) return null;

      const exercises = await repositories.exercises.forMuscle(muscle.id, 'primary');
      return {
        muscle,
        compound: exercises.filter((exercise) => exercise.mechanic === 'compound'),
        isolation: exercises.filter((exercise) => exercise.mechanic === 'isolation'),
      };
    },
  );

  const selectableSlugs = useMemo(
    () => (taxonomy.data?.selectable ?? []).map((muscle) => muscle.slug),
    [taxonomy.data],
  );

  /**
   * Volume per muscle over the last four weeks, keyed by slug for the viewer.
   *
   * Only fetched in heat-map mode. It reads a month of training and joins the
   * whole `exercise_muscles` table, which is not work to do for somebody who
   * opened this screen to look at where their lats are.
   */
  const heat = useCatalogue(`heat:${mode}`, async (repositories) => {
    if (mode !== 'heatmap') return null;

    const weeks = recentWeeks(now, HEATMAP_WEEKS, DEFAULT_WEEK_START);
    const [sets, shares, muscles] = await Promise.all([
      repositories.history.completedSets({ from: weeks[0] ?? now }),
      repositories.history.muscleShares(),
      repositories.muscles.list(),
    ]);

    // The viewer knows muscles by slug; everything below it uses ids.
    const slugById = new Map(muscles.map((muscle) => [muscle.id, muscle.slug]));
    const byId = relativeVolume(volumeByMuscle(sets, shares));

    const bySlug = new Map<string, number>();
    for (const [muscleId, value] of byId) {
      const slug = slugById.get(muscleId);
      if (slug !== undefined) bySlug.set(slug, value);
    }
    return { intensity: bySlug, trained: sets.length > 0 };
  });

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-4 px-4 pt-safe-top pb-safe-bottom">
      <header className="flex items-baseline justify-between gap-4 pt-6 pb-2">
        <h1 className="text-2xl font-semibold text-primary">Learn</h1>
        <HeaderLink to="/">Home</HeaderLink>
      </header>

      {taxonomy.error !== null && (
        <p role="alert" className="text-sm text-danger">
          {taxonomy.error}
        </p>
      )}

      {/* Development-time honesty. A model that is missing muscles renders
          perfectly and simply ignores taps on the parts it lacks. */}
      {report !== null && (report.missing.length > 0 || report.unknown.length > 0) && (
        <p className="rounded-card bg-surface p-3 text-xs text-muted">
          {report.missing.length > 0 &&
            `${String(report.missing.length)} muscles have no geometry and cannot be tapped. `}
          {report.unknown.length > 0 &&
            `${String(report.unknown.length)} shapes match no muscle in the catalogue.`}
        </p>
      )}

      {/* Two modes, one model. The heat map is the same body with different
          colours on it — a second viewer for it would drift until one
          highlighted a muscle the other could not select. */}
      <div className="flex gap-2">
        <Chip
          selected={mode === 'explore'}
          onClick={() => {
            setMode('explore');
          }}
        >
          Explore
        </Chip>
        <Chip
          selected={mode === 'heatmap'}
          onClick={() => {
            setMode('heatmap');
          }}
        >
          What I have trained
        </Chip>
      </div>

      <div className="overflow-hidden rounded-card bg-elevated">
        <Suspense
          fallback={
            <div className="flex h-[52vh] items-center justify-center">
              <p className="text-sm text-muted">Loading the model…</p>
            </div>
          }
        >
          <AnatomyViewer
            className="h-[52vh] w-full touch-none"
            parts={parts}
            selectableSlugs={selectableSlugs}
            selectedSlug={selected}
            onSelect={setSelected}
            mode={mode}
            {...(heat.data === null ? {} : { intensity: heat.data.intensity })}
          />
        </Suspense>
      </div>

      {mode === 'heatmap' ? (
        <p className="text-sm text-secondary">
          {heat.loading
            ? 'Working out what you have trained…'
            : heat.data?.trained === true
              ? `Colour is volume over the last ${String(HEATMAP_WEEKS)} weeks, relative to your hardest-worked muscle. It answers what you trained most, not whether you trained enough.`
              : 'Nothing logged in the last four weeks yet. Finish a workout and it will show up here.'}
        </p>
      ) : (
        <p className="text-sm text-secondary">
          Drag to turn the figure. Tap a muscle to see what trains it.
        </p>
      )}

      {/* A stand-in, and said out loud rather than left to be worked out. */}
      <p className="text-xs text-muted">
        The figure is a placeholder built from blocks — the licensed anatomy model is not in this
        build. Everything else on this screen is real.
      </p>

      {selected !== null && (
        <MusclePanel
          detail={detail.data}
          loading={detail.loading}
          onClear={() => {
            setSelected(null);
          }}
        />
      )}
    </main>
  );
}

function MusclePanel({
  detail,
  loading,
  onClear,
}: {
  readonly detail: MuscleDetail | null;
  readonly loading: boolean;
  readonly onClear: () => void;
}) {
  if (loading && detail === null) {
    return <p className="text-sm text-muted">Loading…</p>;
  }
  if (detail === null) {
    return (
      <p className="rounded-card bg-surface p-4 text-sm text-secondary">
        That muscle is not in the catalogue on this device yet.
      </p>
    );
  }

  const { muscle, compound, isolation } = detail;
  const total = compound.length + isolation.length;

  return (
    <section className="rounded-card bg-surface p-4">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold text-primary">{muscle.commonName}</h2>
        <button
          type="button"
          onClick={onClear}
          className="min-h-tap text-xs text-muted underline-offset-4 hover:underline"
        >
          Clear
        </button>
      </div>
      {/* The Latin name is the reason this is Learn and not just a filter. */}
      <p className="mb-4 text-sm text-secondary italic">{muscle.latinName}</p>

      {total === 0 ? (
        <p className="text-sm text-muted">Nothing in the catalogue trains this as a prime mover.</p>
      ) : (
        <>
          {/* Compound first, and split rather than ranked: they are different
              kinds of answer to "what trains this", not better and worse. */}
          <ExerciseGroup title="Compound" exercises={compound} />
          <ExerciseGroup title="Isolation" exercises={isolation} />
        </>
      )}
    </section>
  );
}

function ExerciseGroup({
  title,
  exercises,
}: {
  readonly title: string;
  readonly exercises: readonly Exercise[];
}) {
  if (exercises.length === 0) return null;
  return (
    <div className="mb-4 last:mb-0">
      <h3 className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">{title}</h3>
      <ul className="flex flex-col gap-1">
        {exercises.map((exercise) => (
          <li key={exercise.id}>
            <Link
              to={`/exercises/${exercise.slug}`}
              className="flex min-h-tap items-center rounded-control px-2 text-base text-primary active:bg-elevated"
            >
              {exercise.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
