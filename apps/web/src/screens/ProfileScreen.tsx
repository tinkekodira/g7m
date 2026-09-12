import { Suspense, lazy, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { heatRampFor, placeholderBodyParts } from '@g7m/anatomy';
import {
  GOAL_LABELS,
  firstName,
  personalRecords,
  toDisplayWeight,
  type UnitSystem,
} from '@g7m/core';
import { cx } from '@g7m/ui';
import { Avatar } from '../components/Avatar.js';
import { ChevronRightIcon, PencilIcon, TrophyIcon } from '../components/icons.js';
import { useSculptedBody } from '../lib/anatomy-model.js';
import { useCatalogue } from '../lib/db/use-catalogue.js';
import {
  HEATMAP_WEEKS,
  SESSIONS_BEFORE_ADVICE,
  useNeglected,
  useTrainingHeat,
} from '../lib/db/use-trained-body.js';
import { bestLifts, profileStats, type BestLift } from './profile-view.js';

/**
 * Loaded on demand, as on Learn. three.js is the largest thing the app ships,
 * and this chunk is shared with Learn's, so whichever screen opens first pays
 * for it once.
 */
const AnatomyViewer = lazy(() =>
  import('@g7m/anatomy').then((module) => ({ default: module.AnatomyViewer })),
);

/** Lifts listed before "Show all". */
const BESTS_SHOWN = 6;

/** Nothing is selected here — the figures are pictures, not controls. */
const ignore = (): void => undefined;

const VIEWS = [
  { view: 'front', label: 'Front' },
  { view: 'back', label: 'Back' },
] as const;

/**
 * Your profile: who you are, and what your training has made of it.
 *
 * The numbers the You screen collects, read-only, with Edit going there to
 * change them. Below them the body, coloured by the last four weeks — what
 * gets trained most, and by what stays grey, what does not — and the heaviest
 * thing lifted on each exercise.
 *
 * Achievements are a placeholder, on purpose and visibly so: the button is
 * here so the screen has its final shape, and it says it is coming rather
 * than opening onto nothing.
 */
export function ProfileScreen() {
  const now = useMemo(() => new Date(), []);

  const profile = useCatalogue('profile', (r) => r.profile.current());
  const metrics = useCatalogue('body-metrics-current', (r) => r.bodyMetrics.current());
  const goal = useCatalogue('goal-current', (r) => r.goals.current());
  const bests = useCatalogue('profile-bests', async (r) => {
    // All time. The old list on Progress was the last twelve weeks and had to
    // say so; a profile's bests mean best ever.
    const [sets, trained] = await Promise.all([
      r.history.completedSets(),
      r.history.trainedExercises(),
    ]);
    return bestLifts(
      personalRecords(sets),
      new Map(trained.map((entry) => [entry.exerciseId, entry.name])),
    );
  });

  const unitSystem: UnitSystem = profile.data?.unitSystem ?? 'metric';
  const name = firstName(profile.data?.displayName ?? null);
  const fullName = profile.data?.displayName ?? null;

  const tiles = profileStats(
    {
      unitSystem,
      weightKg: metrics.data?.weightKg ?? null,
      weightAt: metrics.data?.weightAt ?? null,
      heightCm: metrics.data?.heightCm ?? null,
      birthDate: profile.data?.birthDate ?? null,
      sex: profile.data?.sex ?? null,
      activityLevel: metrics.data?.activityLevel ?? null,
      goal:
        goal.data === null ? null : { goal: goal.data.goal, daysPerWeek: goal.data.daysPerWeek },
      country: profile.data?.country ?? null,
    },
    now,
  );

  const error = profile.error ?? metrics.error ?? goal.error;

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-4 px-4 pt-safe-top pb-safe-bottom">
      <header className="flex items-center justify-between gap-3 pt-6">
        <h1 className="text-2xl font-semibold text-primary">Your profile</h1>
        <Link
          to="/you"
          className="inline-flex min-h-tap items-center gap-2 rounded-full border border-subtle bg-elevated px-4 text-sm font-medium text-primary active:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <PencilIcon className="size-4" />
          Edit
        </Link>
      </header>

      {error !== null && (
        <p role="alert" className="rounded-card bg-surface p-4 text-sm text-danger">
          {error}
        </p>
      )}

      <section className="flex items-center gap-4 rounded-card border border-subtle bg-surface p-4">
        <Avatar name={name} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-xl font-semibold text-primary">
            {fullName ?? 'Add your name'}
          </p>
          <p className="mt-0.5 text-sm text-secondary">
            {goal.data === null
              ? 'No goal chosen yet'
              : `${GOAL_LABELS[goal.data.goal]} · ${String(goal.data.daysPerWeek)} days a week`}
          </p>
        </div>
      </section>

      <section aria-labelledby="profile-numbers">
        <h2 id="profile-numbers" className="mb-2 text-lg font-semibold text-primary">
          Your numbers
        </h2>
        <dl className="grid grid-cols-2 gap-3">
          {tiles.map((tile, index) => (
            <div
              key={tile.key}
              // An odd tile out at the end takes the whole row rather than
              // leaving a hole beside it.
              className="rise rounded-card border border-subtle bg-surface p-3 [&:last-child:nth-child(odd)]:col-span-2"
              style={{ animationDelay: `${String(index * 30)}ms` }}
            >
              <dt className="text-xs font-medium text-muted">{tile.label}</dt>
              <dd className="mt-1">
                {tile.value === null ? (
                  <Link
                    to="/you"
                    className="text-sm text-secondary underline-offset-4 hover:underline"
                  >
                    Not set — add it
                  </Link>
                ) : (
                  <span className="numeric block text-base font-semibold text-primary">
                    {tile.value}
                  </span>
                )}
                {tile.detail !== undefined && (
                  <span className="block text-xs text-muted">{tile.detail}</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Not clickable yet, and it says so. A button that opened onto an empty
          screen would be a promise broken on the first tap. */}
      <button
        type="button"
        disabled
        className="flex min-h-tap w-full cursor-not-allowed items-center gap-3 rounded-card border border-dashed border-strong bg-surface px-4 py-3 text-left"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-warning/15 text-warning">
          <TrophyIcon className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-medium text-primary">Achievements</span>
          <span className="block text-xs text-muted">Milestones from your training</span>
        </span>
        <span className="shrink-0 rounded-full bg-elevated px-3 py-1 text-xs font-medium text-secondary">
          Coming soon
        </span>
      </button>

      <TrainingBody now={now} />

      <BestLifts lifts={bests.data} loading={bests.loading} unitSystem={unitSystem} />

      <p className="py-4 text-xs text-muted">
        Educational content, not medical advice. These numbers shape a training plan, nothing more.
      </p>
    </main>
  );
}

/**
 * The body, front and back, coloured by four weeks of training.
 *
 * Hot is what gets the most work. Grey is what gets little or none — the
 * "what should I be doing more" half, which the list underneath turns into
 * something to do about it, from the same function that builds tomorrow's
 * session.
 *
 * Two still pictures rather than one figure to turn. The muscles people most
 * often leave behind — lats, glutes, hamstrings — are all on the back, and a
 * single figure facing forward hides exactly those until somebody thinks to
 * spin it. Still, too, because a model that can be dragged claims every touch
 * that lands on it, and this one sits in the middle of a page that scrolls.
 * Learn is where the body is turned and explored.
 */
function TrainingBody({ now }: { readonly now: Date }) {
  const heat = useTrainingHeat(now, true);
  const neglected = useNeglected(now, true);
  const sculpted = useSculptedBody();
  const generated = useMemo(() => placeholderBodyParts(), []);
  const parts = sculpted.parts ?? generated;

  // The viewer colours only what the taxonomy lets it select — anything else
  // is drawn as resting skin — so the heat needs the real list even though
  // nothing here can be tapped.
  const taxonomy = useCatalogue('muscles-selectable', (r) => r.muscles.selectable());
  const selectableSlugs = useMemo(
    () => (taxonomy.data ?? []).map((muscle) => muscle.slug),
    [taxonomy.data],
  );

  return (
    <section className="overflow-hidden rounded-card border border-subtle bg-surface">
      <div className="p-4 pb-2">
        <h2 className="text-lg font-semibold text-primary">Your training</h2>
        <p className="mt-0.5 text-sm text-muted">
          The last {String(HEATMAP_WEEKS)} weeks, on your body.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-px bg-subtle">
        {VIEWS.map(({ view, label }) => (
          <figure key={view} className="m-0 bg-[#17161a]">
            {/* The same wait as Learn: nothing drawn until it is known which
                body to draw, so the generated one never flashes before the
                sculpt. */}
            {sculpted.loading || taxonomy.loading ? (
              <ModelPlaceholder />
            ) : (
              <Suspense fallback={<ModelPlaceholder />}>
                <AnatomyViewer
                  className="h-80 w-full"
                  parts={parts}
                  closedSurface={sculpted.parts !== null}
                  selectableSlugs={selectableSlugs}
                  selectedSlug={null}
                  onSelect={ignore}
                  mode="heatmap"
                  view={view}
                  interactive={false}
                  {...(heat.data === null ? {} : { intensity: heat.data.intensity })}
                />
              </Suspense>
            )}
            <figcaption className="pb-2 text-center text-xs font-medium text-muted">
              {label}
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="flex flex-col gap-4 p-4">
        {/* The key, in the colours the body is actually painted with. */}
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>Less</span>
          <span
            aria-hidden
            className="h-2 flex-1 rounded-full"
            style={{
              background: `linear-gradient(to right, ${heatRampFor(sculpted.parts !== null).join(', ')})`,
            }}
          />
          <span>More</span>
        </div>

        {heat.loading ? (
          <p className="text-sm text-muted">Working out what you have trained…</p>
        ) : heat.data?.trained !== true ? (
          <p className="text-sm text-secondary">
            Nothing logged in the last {String(HEATMAP_WEEKS)} weeks yet. Finish a workout and it
            shows up here.
          </p>
        ) : (
          <div>
            <h3 className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">
              Trained most
            </h3>
            <ul className="flex flex-wrap gap-2">
              {heat.data.top.map((muscle) => (
                <li
                  key={muscle.slug}
                  className="rounded-full bg-accent/15 px-3 py-1.5 text-sm font-medium text-accent"
                >
                  {muscle.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h3 className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">
            Worth adding
          </h3>
          {neglected.data === null ? (
            <p className="text-sm text-secondary">
              {neglected.loading
                ? 'Looking at your week…'
                : `After ${String(SESSIONS_BEFORE_ADVICE)} workouts this names what is falling behind, and one exercise for each.`}
            </p>
          ) : neglected.data.length === 0 ? (
            <p className="text-sm text-secondary">Nothing is behind its weekly target right now.</p>
          ) : (
            <ul className="flex flex-col">
              {neglected.data.map((suggestion) => (
                <li
                  key={suggestion.exerciseId}
                  className="flex items-baseline justify-between gap-3 border-b border-subtle py-2 last:border-b-0"
                >
                  <span className="min-w-0 text-sm text-primary">{suggestion.name}</span>
                  <span className="numeric shrink-0 text-xs text-muted">
                    {suggestion.group} · {suggestion.setsBehind} sets behind
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function ModelPlaceholder() {
  return (
    <div className="flex h-80 items-center justify-center">
      <p className="text-sm text-muted">Loading…</p>
    </div>
  );
}

function BestLifts({
  lifts,
  loading,
  unitSystem,
}: {
  readonly lifts: readonly BestLift[] | null;
  readonly loading: boolean;
  readonly unitSystem: UnitSystem;
}) {
  const [all, setAll] = useState(false);
  const shown = lifts === null ? [] : all ? lifts : lifts.slice(0, BESTS_SHOWN);

  return (
    <section className="rounded-card border border-subtle bg-surface p-4">
      <h2 className="text-lg font-semibold text-primary">Best lifts</h2>
      <p className="mt-0.5 mb-2 text-xs text-muted">
        The heaviest you have moved on each exercise. Bodyweight lifts count your bodyweight too.
      </p>

      {loading && lifts === null ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="text-sm text-muted">Nothing measurable yet.</p>
      ) : (
        <ul className="flex flex-col">
          {shown.map((lift) => {
            const load = toDisplayWeight(lift.valueKg, unitSystem);
            return (
              <li key={lift.exerciseId} className="border-b border-subtle last:border-b-0">
                <Link
                  to={`/progress/exercise/${lift.exerciseId}`}
                  className="flex min-h-tap items-center gap-3 py-2 active:opacity-80"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-primary">
                      {lift.name}
                    </span>
                    <span className="block text-xs text-muted">
                      {lift.achievedAt.toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </span>
                  <span className="numeric shrink-0 text-base font-semibold text-primary">
                    {String(load.value)} {load.unit}
                  </span>
                  <ChevronRightIcon className="size-5 shrink-0 text-muted" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {lifts !== null && lifts.length > BESTS_SHOWN && (
        <button
          type="button"
          onClick={() => {
            setAll((previous) => !previous);
          }}
          className={cx(
            'mt-2 min-h-tap w-full rounded-control text-sm font-medium text-accent active:bg-elevated',
          )}
        >
          {all ? 'Show fewer' : `Show all ${String(lifts.length)}`}
        </button>
      )}
    </section>
  );
}
