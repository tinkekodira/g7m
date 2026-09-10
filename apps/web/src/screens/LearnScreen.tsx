import { Suspense, lazy, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { checkModelContract, placeholderBodyParts, type AnatomyMode } from '@g7m/anatomy';
import { useSculptedBody } from '../lib/anatomy-model.js';
import { Chip } from '@g7m/ui';
import {
  DEFAULT_WEEK_START,
  prescriptionFor,
  recentWeeks,
  relativeVolume,
  startOfDay,
  suggestForNeglected,
  volumeByMuscle,
} from '@g7m/core';
import type { Exercise, Muscle } from '@g7m/db';
import { HeaderLink } from '../components/HeaderLink.js';
import { useCatalogue } from '../lib/db/use-catalogue.js';
import { sectionsFor, type MuscleSections } from './muscle-exercises.js';

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
  readonly sections: MuscleSections;
}

/** Four weeks. Long enough to include a full training split, short enough to be current. */
const HEATMAP_WEEKS = 4;

/**
 * Sessions before the app offers an opinion about what is missing.
 *
 * A cold shoulder after two workouts is not a gap in somebody's training, it
 * is a Tuesday.
 */
const SESSIONS_BEFORE_ADVICE = 5;

export function LearnScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const [mode, setMode] = useState<AnatomyMode>('explore');
  const now = useMemo(() => new Date(), []);

  const generated = useMemo(() => placeholderBodyParts(), []);
  const sculpted = useSculptedBody();

  // Falls back without comment. Most checkouts have no model — it is licensed
  // and the repository is public — and the generated body is a complete one.
  const parts = sculpted.parts ?? generated;

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
      // Whatever is on screen, which is now all of it. The five muscles a
      // closed skin has no room for are marked unselectable in the taxonomy
      // rather than kept behind a second body, so they are not geometry that
      // is missing — they are not offered.
      parts.map((part) => part.nodeName),
    );
  }, [taxonomy.data, parts]);

  const detail = useCatalogue<MuscleDetail | null>(
    `muscle:${selected ?? ''}`,
    async (repositories) => {
      if (selected === null) return null;
      const muscle = await repositories.muscles.bySlug(selected);
      if (muscle === null) return null;

      /**
       * Both roles, because a supporting muscle is a real answer.
       *
       * Asking only for prime movers left eleven of the thirty-seven muscles
       * in the taxonomy as dead ends — the rhomboids among them, which eight
       * exercises work and none work first.
       */
      const [primary, secondary] = await Promise.all([
        repositories.exercises.forMuscle(muscle.id, 'primary'),
        repositories.exercises.forMuscle(muscle.id, 'secondary'),
      ]);

      return { muscle, sections: sectionsFor(primary, secondary) };
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

  /**
   * What to do about the muscles the heat map shows cold.
   *
   * The map answers "what have I trained" and stops there, which leaves the
   * more useful half of the question — so what do I add — as an exercise for
   * the reader. Scored by the same function that picks tomorrow's session, so
   * the suggestion here and the exercise there agree.
   *
   * Silent below five sessions. A cold shoulder after two workouts is not a
   * gap in somebody's training, it is a Tuesday.
   */
  const todo = useCatalogue(`todo:${mode}`, async (repositories) => {
    if (mode !== 'heatmap') return null;

    const [profile, goal, sessions] = await Promise.all([
      repositories.profile.current(),
      repositories.goals.current(),
      repositories.history.sessionSummaries(SESSIONS_BEFORE_ADVICE + 1),
    ]);
    if (sessions.length < SESSIONS_BEFORE_ADVICE) return null;

    const since = startOfDay(now);
    since.setDate(since.getDate() - 7);

    const [catalogue, history, setsThisWeekByGroup] = await Promise.all([
      repositories.planner.candidates(),
      repositories.planner.lastPerformances(since),
      repositories.planner.setsByGroupSince(since),
    ]);

    const prescription = prescriptionFor(
      goal?.goal ?? 'build_muscle',
      profile?.experienceLevel ?? null,
    );

    return suggestForNeglected({
      catalogue,
      history,
      setsThisWeekByGroup,
      weeklyTarget: prescription.weeklySetsPerGroup,
      now,
    });
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

      {/*
        The catalogue decides what a tap can select, so without it the model
        spins beautifully and answers nothing.

        Said out loud because every other symptom points the wrong way: the
        body renders, the heat map runs, and the only sign is that clicking
        does nothing — which reads as a broken model rather than as an empty
        table. The same sentence the exercise library uses, for the same rows.
      */}
      {/*
        Loading is a third state and it looked exactly like the second one.
        A catalogue that never arrives and a catalogue that arrived empty both
        showed nothing at all, so "tapping does nothing" had two possible
        causes and no way to tell them apart from the screen.
      */}
      {taxonomy.loading && (
        <p className="rounded-card bg-surface p-3 text-sm text-secondary">
          Loading the muscle catalogue…
        </p>
      )}

      {!taxonomy.loading && taxonomy.error === null && selectableSlugs.length === 0 && (
        <p className="rounded-card bg-surface p-3 text-sm text-secondary">
          No muscles on this device yet, so nothing on the model can be tapped. They arrive with the
          first sync — open the app once with a connection and they stay for good.
        </p>
      )}

      {/* Development-time honesty. A model that is missing muscles renders
          perfectly and simply ignores taps on the parts it lacks. */}
      {report !== null &&
        selectableSlugs.length > 0 &&
        (report.missing.length > 0 || report.unknown.length > 0) && (
          <p className="rounded-card bg-surface p-3 text-xs text-muted">
            {report.missing.length > 0 &&
              `${String(report.missing.length)} muscles have no geometry and cannot be tapped. `}
            {report.unknown.length > 0 &&
              `${String(report.unknown.length)} shapes match no muscle in the catalogue.`}
          </p>
        )}

      {/*
        Counts, in development only.
        
        Three numbers that between them explain every way a tap can do
        nothing: no muscles to select, no shapes to select them on, or the two
        not matching. Working that out from the outside took a round trip and
        a guess; it is one line here.
      */}
      {import.meta.env.DEV && (
        <p className="numeric text-xs text-muted">
          {String(selectableSlugs.length)} selectable · {String(parts.length)} shapes ·{' '}
          {report === null
            ? 'catalogue not read yet'
            : `${String(report.missing.length)} missing, ${String(report.unknown.length)} unknown`}
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
            // A sculpted skin is closed, so the bones and the core underneath
            // it have nothing to show through and would sit on top instead.
            closedSurface={sculpted.parts !== null}
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

      {mode === 'heatmap' && todo.data !== null && todo.data.length > 0 && (
        <section className="rounded-card bg-surface p-4">
          <h2 className="text-lg font-semibold text-primary">Worth adding</h2>
          <p className="mt-1 mb-3 text-sm text-muted">
            The groups furthest behind their weekly target, and one thing that trains each.
          </p>
          <ul className="flex flex-col">
            {todo.data.map((suggestion, index) => (
              <li
                key={suggestion.exerciseId}
                className="rise flex items-baseline justify-between gap-3 border-b border-subtle py-2 last:border-b-0"
                style={{ animationDelay: `${String(index * 45)}ms` }}
              >
                <span className="min-w-0 text-sm text-primary">{suggestion.name}</span>
                <span className="numeric shrink-0 text-xs text-muted">
                  {suggestion.group} · {suggestion.setsBehind} sets behind
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Which body is on screen, said out loud rather than left to be worked
          out. It was still claiming to be a placeholder after the real model
          had loaded, which is the kind of line nobody rereads. */}
      <p className="text-xs text-muted">
        {sculpted.parts === null
          ? 'The figure is generated from origins and insertions — the licensed anatomy model is not in this build. Everything else on this screen is real.'
          : 'A sculpted body, divided between the muscles that reach the skin.'}
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

  const { muscle, sections } = detail;

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

      {sections.empty ? (
        <p className="text-sm text-muted">Nothing in the catalogue trains this yet.</p>
      ) : (
        <>
          {/* Compound first, and split rather than ranked: they are different
              kinds of answer to "what trains this", not better and worse. */}
          <ExerciseGroup title="Compound" exercises={sections.compound} />
          <ExerciseGroup title="Isolation" exercises={sections.isolation} />
          {/* A third section rather than more rows under the first two. These
              work the muscle without being the point of the lift, and merging
              them in would rank a face pull alongside a row for the rhomboids. */}
          <ExerciseGroup
            title="Also worked"
            hint="Worked here as a supporting muscle rather than the main one."
            exercises={sections.also}
          />
        </>
      )}
    </section>
  );
}

function ExerciseGroup({
  title,
  hint,
  exercises,
}: {
  readonly title: string;
  /** One line under the heading, where the heading alone does not say enough. */
  readonly hint?: string;
  readonly exercises: readonly Exercise[];
}) {
  if (exercises.length === 0) return null;
  return (
    <div className="mb-4 last:mb-0">
      <h3 className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">{title}</h3>
      {hint !== undefined && <p className="mb-2 text-xs text-muted">{hint}</p>}
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
