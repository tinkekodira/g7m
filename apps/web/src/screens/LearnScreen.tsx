import { Suspense, lazy, useMemo, useState } from 'react';
import { BodySkeleton, ExerciseRowsSkeleton } from '../components/ContentSkeletons.js';
import { LoadingScope } from '../components/LoadingScope.js';
import { Link, useSearchParams } from 'react-router';
import { checkModelContract, placeholderBodyParts, type AnatomyMode } from '@g7m/anatomy';
import { useSculptedBody } from '../lib/anatomy-model.js';
import { useProfileBody } from '../lib/db/use-profile-body.js';
import { FavouriteMark } from '../components/Favourite.js';
import { ExerciseIcon } from '../components/ExerciseIcon.js';
import { ChevronRightIcon, DumbbellIcon } from '../components/icons.js';
import { SegmentedControl } from '@g7m/ui';
import type { Exercise, Muscle } from '@g7m/db';
import { useCatalogue } from '../lib/db/use-catalogue.js';
import { HEATMAP_WEEKS, useNeglected, useTrainingHeat } from '../lib/db/use-trained-body.js';
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

/** The two ways to look at the body, on Progress's pill (ADR-0128). */
const MODES = [
  { value: 'explore', label: 'Explore' },
  { value: 'heatmap', label: 'What I have trained' },
] as const satisfies readonly { value: AnatomyMode; label: string }[];

interface MuscleDetail {
  readonly muscle: Muscle;
  readonly sections: MuscleSections;
  /** Slugs of the starred exercises, for the star after each name. */
  readonly favourites: ReadonlySet<string>;
}

export function LearnScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  // `?view=heatmap` opens on the trained body: the way Home's muscle card
  // comes in (ADR-0123). Read once; the switch on screen takes over after.
  const [params] = useSearchParams();
  const [mode, setMode] = useState<AnatomyMode>(() =>
    params.get('view') === 'heatmap' ? 'heatmap' : 'explore',
  );
  const now = useMemo(() => new Date(), []);

  const generated = useMemo(() => placeholderBodyParts(), []);
  // The body that matches the profile, and nothing until the profile has said.
  const sculpted = useSculptedBody(useProfileBody());

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
      const [primary, secondary, profile] = await Promise.all([
        repositories.exercises.forMuscle(muscle.id, 'primary'),
        repositories.exercises.forMuscle(muscle.id, 'secondary'),
        repositories.profile.current(),
      ]);

      const favourites = new Set(profile?.favouriteExercises ?? []);
      return { muscle, sections: sectionsFor(primary, secondary, favourites), favourites };
    },
  );

  const selectableSlugs = useMemo(
    () => (taxonomy.data?.selectable ?? []).map((muscle) => muscle.slug),
    [taxonomy.data],
  );

  /**
   * Volume per muscle over the last four weeks, and what to add about the cold
   * ones. Only fetched in heat-map mode — see `use-trained-body.ts`, which
   * Profile reads too, so the two bodies agree.
   */
  const heat = useTrainingHeat(now, mode === 'heatmap');
  const todo = useNeglected(now, mode === 'heatmap');
  const suggestionSlugs = useCatalogue(`learn:slugs:${mode}`, async (r) =>
    mode === 'heatmap'
      ? new Map((await r.exercises.list()).map((exercise) => [exercise.id, exercise.slug]))
      : null,
  );

  return (
    <main className="learn-screen">
      {/* The tool goes in the header's own slot rather than a card in the
          column. Learn's one job is the body, and a row above it pushing the
          figure down would make the calculator the first thing on a screen
          about anatomy — but tucked away at the bottom nobody would find it. */}
      <header className="learn-header">
        <div className="min-w-0">
          <h1 className="learn-title">Learn</h1>
          <p className="mt-1 text-sm text-secondary">
            {mode === 'heatmap'
              ? `What you have trained, over ${String(HEATMAP_WEEKS)} weeks.`
              : 'Tap a muscle to see what trains it.'}
          </p>
        </div>
        <Link to="/learn/plates" viewTransition className="learn-plates">
          <DumbbellIcon className="size-4" />
          Plates
        </Link>
      </header>

      {taxonomy.error !== null && (
        <p
          role="alert"
          className="rounded-sheet border border-subtle bg-surface p-4 text-sm text-destructive"
        >
          {taxonomy.error}
        </p>
      )}

      {/*
        The catalogue decides what a tap can select, so without it the model
        spins beautifully and answers nothing — and every other symptom points
        the wrong way: the body renders, the heat map runs, and the only sign is
        that tapping does nothing, which reads as a broken model rather than as
        an empty table.

        Only the state somebody can act on is said out loud now. "Loading the
        muscle catalogue…" was a third banner for a second that the model's own
        placeholder already covers, and the two development-only readouts were
        three paragraphs of diagnostics above the thing the screen is for.
      */}
      {!taxonomy.loading && taxonomy.error === null && selectableSlugs.length === 0 && (
        <p className="rounded-sheet border border-subtle bg-surface p-4 text-sm text-secondary">
          No muscles on this device yet, so nothing on the model can be tapped. They arrive with the
          first sync — open the app once with a connection and they stay for good.
        </p>
      )}

      {/*
        Development-time honesty, in one line instead of three paragraphs.

        Between them these numbers explain every way a tap can do nothing: no
        muscles to select, no shapes to select them on, or the two not matching.
        A model missing geometry renders perfectly and silently ignores taps on
        the parts it lacks, so nothing else on the screen would say.
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
          highlighted a muscle the other could not select. On the pill
          Progress and Friends switch with, so the main switch on every tab
          looks the same (ADR-0128). */}
      <SegmentedControl
        label="Body view"
        options={MODES}
        value={mode}
        onChange={(next) => {
          setMode(next);
          setSelected(null);
        }}
      />

      <div className="learn-explorer">
        <div className="learn-body-column">
          <div data-tour="body" className="learn-body-stage">
            <div aria-hidden className="learn-body-backdrop" />
            {/* Wait for the profile's model before showing the procedural fallback. */}
            {sculpted.loading ? (
              <ModelPlaceholder />
            ) : (
              <Suspense fallback={<ModelPlaceholder />}>
                <AnatomyViewer
                  className="learn-body-viewer"
                  cameraDistance={4}
                  parts={parts}
                  // A sculpted skin is closed, so the bones and the core underneath
                  // it have nothing to show through and would sit on top instead.
                  closedSurface={sculpted.parts !== null}
                  background={null}
                  selectableSlugs={selectableSlugs}
                  selectedSlug={selected}
                  onSelect={setSelected}
                  mode={mode}
                  {...(heat.data === null ? {} : { intensity: heat.data.intensity })}
                />
              </Suspense>
            )}
          </div>
          <p className="learn-body-hint">Drag to turn. Tap a muscle.</p>
          <select
            aria-label="Choose a muscle"
            className="learn-muscle-select"
            value={selected ?? ''}
            onChange={(event) => setSelected(event.target.value || null)}
          >
            <option value="">Choose a muscle</option>
            {taxonomy.data?.selectable.map((muscle) => (
              <option key={muscle.slug} value={muscle.slug}>
                {muscle.commonName}
              </option>
            ))}
          </select>
        </div>

        {/* Only this pane scrolls: the real, interactive body stays beside its answer. */}
        <section
          key={`${mode}:${selected ?? ''}`}
          className="learn-results"
          aria-label="Muscle exercises"
          tabIndex={0}
          onKeyDown={(event) => {
            // Mobile Chromium does not reliably route native Home/End scrolling
            // to this nested pane. Handle its own keys without taking over child controls.
            if (
              event.target !== event.currentTarget ||
              event.altKey ||
              event.ctrlKey ||
              event.metaKey ||
              event.shiftKey ||
              (event.key !== 'Home' && event.key !== 'End')
            )
              return;
            event.preventDefault();
            event.currentTarget.scrollTo({
              top: event.key === 'Home' ? 0 : event.currentTarget.scrollHeight,
              behavior: 'instant',
            });
          }}
        >
          {/* Selection changes only the answer pane, never the viewer or its camera. */}
          {selected !== null && (
            <LoadingScope key={selected}>
              {detail.error !== null ? (
                <p role="alert" className="text-sm text-destructive">
                  {detail.error}
                </p>
              ) : (
                <MusclePanel
                  detail={detail.data}
                  loading={detail.loading}
                  onClear={() => {
                    setSelected(null);
                  }}
                />
              )}
            </LoadingScope>
          )}

          {selected === null && mode === 'explore' && (
            <div className="learn-empty">
              <h2 className="learn-section-title">Explore muscles</h2>
              <p>Tap the body or choose a muscle to find exercises.</p>
              <Link to="/exercises" className="learn-browse-link">
                Browse all exercises
              </Link>
            </div>
          )}

          {mode === 'heatmap' && todo.data !== null && todo.data.length > 0 && (
            <section aria-labelledby="learn-worth-adding" className="learn-suggestions">
              <h2 id="learn-worth-adding" className="learn-section-title">
                Worth adding
              </h2>
              <p className="mb-2 text-xs text-muted">Last {HEATMAP_WEEKS} weeks</p>
              <p className="mb-3 text-sm text-secondary">
                The groups furthest behind their weekly target, and one thing that trains each.
              </p>
              <ul className="flex flex-col">
                {todo.data.map((suggestion) => (
                  <li key={suggestion.exerciseId}>
                    <ExerciseRow
                      slug={suggestionSlugs.data?.get(suggestion.exerciseId) ?? null}
                      name={suggestion.name}
                      note={`${suggestion.group} · ${String(suggestion.setsBehind)} sets behind`}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {mode === 'heatmap' && (
            <p className="learn-heat-note">
              {heat.error ??
                todo.error ??
                suggestionSlugs.error ??
                (heat.loading
                  ? 'Working out what you have trained…'
                  : heat.data?.trained === true
                    ? 'Colour is volume relative to your hardest-worked muscle — what you trained most, not whether you trained enough.'
                    : 'Nothing logged in the last four weeks yet. Finish a workout and it shows up here.')}
            </p>
          )}
        </section>
      </div>

      {/* Which body is on screen, said out loud rather than left to be worked
          out. It was still claiming to be a placeholder after the real model
          had loaded, which is the kind of line nobody rereads. A footnote, at
          the foot: it is worth knowing once and never again. */}
      <p className="learn-model-note">
        {sculpted.parts === null
          ? 'The figure is generated from origins and insertions — the licensed anatomy model is not in this build. Everything else on this screen is real.'
          : 'A sculpted body, divided between the muscles that reach the skin.'}
      </p>
    </main>
  );
}

/** The same waiting state whether the chunk or the model is still coming. */
function ModelPlaceholder() {
  return <BodySkeleton className="learn-body-viewer" />;
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
    return <ExerciseRowsSkeleton />;
  }
  if (detail === null) {
    return (
      <p className="rounded-sheet border border-subtle bg-surface p-4 text-sm text-secondary">
        That muscle is not in the catalogue on this device yet.
      </p>
    );
  }

  const { muscle, sections, favourites } = detail;

  return (
    <section aria-labelledby="learn-muscle-title" className="learn-muscle-panel">
      <header className="learn-muscle-header">
        <div className="min-w-0">
          <h2 id="learn-muscle-title" className="learn-muscle-title" aria-live="polite">
            {muscle.commonName}
          </h2>
          <p className="learn-latin-name">{muscle.latinName}</p>
        </div>
        <button type="button" onClick={onClear} className="learn-clear">
          Clear
        </button>
      </header>

      {sections.empty ? (
        <p className="text-sm text-muted">Nothing in the catalogue trains this yet.</p>
      ) : (
        <>
          {/* Compound first, and split rather than ranked: they are different
              kinds of answer to "what trains this", not better and worse. */}
          <ExerciseGroup title="Compound" exercises={sections.compound} favourites={favourites} />
          <ExerciseGroup title="Isolation" exercises={sections.isolation} favourites={favourites} />
          {/* A third section rather than more rows under the first two. These
              work the muscle without being the point of the lift, and merging
              them in would rank a face pull alongside a row for the rhomboids. */}
          <ExerciseGroup
            title="Also worked"
            hint="Worked here as a supporting muscle rather than the main one."
            exercises={sections.also}
            favourites={favourites}
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
  favourites,
}: {
  readonly title: string;
  /** One line under the heading, where the heading alone does not say enough. */
  readonly hint?: string;
  readonly exercises: readonly Exercise[];
  readonly favourites: ReadonlySet<string>;
}) {
  if (exercises.length === 0) return null;
  return (
    <div className="learn-exercise-group">
      <h3 className="learn-group-title">{title}</h3>
      {hint !== undefined && <p className="mb-2 text-xs text-muted">{hint}</p>}
      <ul>
        {exercises.map((exercise) => (
          <li key={exercise.id}>
            <ExerciseRow
              slug={exercise.slug}
              name={exercise.name}
              favourite={favourites.has(exercise.slug)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Shared illustration and hit target for muscle answers and heatmap suggestions. */
function ExerciseRow({
  slug,
  name,
  favourite = false,
  note,
}: {
  readonly slug: string | null;
  readonly name: string;
  readonly favourite?: boolean;
  readonly note?: string;
}) {
  const content = (
    <>
      <ExerciseIcon slug={slug ?? ''} className="learn-exercise-icon" />
      <span className="learn-exercise-copy">
        <span className="learn-exercise-name">
          {name}
          {favourite && <FavouriteMark />}
        </span>
        {note !== undefined && <span className="learn-exercise-note numeric">{note}</span>}
      </span>
      {slug !== null && <ChevronRightIcon className="learn-exercise-chevron" />}
    </>
  );
  return slug === null ? (
    <div className="learn-exercise-row">{content}</div>
  ) : (
    <Link to={`/exercises/${slug}`} className="learn-exercise-row">
      {content}
    </Link>
  );
}
