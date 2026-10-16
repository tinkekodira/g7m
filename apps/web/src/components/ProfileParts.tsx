import { Suspense, lazy, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { heatRampFor, placeholderBodyParts } from '@g7m/anatomy';
import { toDisplayWeight, type Achievement, type UnitSystem } from '@g7m/core';
import { cx } from '@g7m/ui';
import { AchievementMedal } from './AchievementMedal.js';
import { PlaceLaurel } from './PlaceLaurel.js';
import { ChevronRightIcon, CrownIcon, TrophyIcon } from './icons.js';
import { useSculptedBody, type BodyKind } from '../lib/anatomy-model.js';
import { useCatalogue } from '../lib/db/use-catalogue.js';
import type { TrainingHeat } from '../lib/db/use-trained-body.js';
import { useStageColor } from '../lib/use-theme.js';
import { BEST_LIFTS_ANCHOR, type BestLift } from '../screens/profile-view.js';
import { Panel } from './Panel.js';

/**
 * The cards a profile is made of — the achievements button, the body coloured
 * by training, the best lifts — drawn the same for your own profile and a
 * friend's (ADR-0117). Each takes its data rather than reading it, because
 * yours comes from this phone and a friend's from the server.
 *
 * In Home's shell (ADR-0126): the large corner, labels in Home's small
 * capitals, and the best lifts as the one hero card, the place Home's
 * records card leads to.
 */

const EYEBROW = 'text-[11px] leading-4 font-semibold tracking-[0.08em] text-muted uppercase';

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
/** How many of the best lifts get a metal: gold, silver, bronze. */
const PODIUM = 3;

/** Nothing is selected here — the figures are pictures, not controls. */
const ignore = (): void => undefined;

const VIEWS = [
  { view: 'front', label: 'Front' },
  { view: 'back', label: 'Back' },
] as const;

/**
 * The way into the achievements, with a line under the name and the last
 * three earned on it, so the collection is visible without opening it.
 */
export function AchievementsCard({
  to,
  list,
  line,
}: {
  readonly to: string;
  readonly list: readonly Achievement[];
  readonly line: string;
}) {
  const recent = list
    .filter((each) => each.earnedAt !== null)
    .sort((a, b) => (b.earnedAt?.getTime() ?? 0) - (a.earnedAt?.getTime() ?? 0))
    .slice(0, 3);

  return (
    <Link
      to={to}
      viewTransition
      className="flex min-h-tap w-full items-center gap-3 rounded-sheet border border-subtle bg-surface px-4 py-3 text-left transition-transform duration-150 ease-out active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-card bg-warning/15 text-warning">
        <TrophyIcon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-medium text-primary">Achievements</span>
        <span className="block truncate text-xs text-muted">{line}</span>
      </span>
      {recent.length > 0 && (
        <span className="flex shrink-0 -space-x-2" aria-hidden>
          {recent.map((each) => (
            <AchievementMedal
              key={each.key}
              achievement={each}
              size="sm"
              className="ring-2 ring-surface"
            />
          ))}
        </span>
      )}
      <ChevronRightIcon aria-hidden className="size-5 shrink-0 text-muted" />
    </Link>
  );
}

/**
 * The body, front and back, coloured by four weeks of training.
 *
 * Hot is what gets the most work. Grey is what gets little or none.
 *
 * Two still pictures rather than one figure to turn. The muscles people most
 * often leave behind — lats, glutes, hamstrings — are all on the back, and a
 * single figure facing forward hides exactly those until somebody thinks to
 * spin it. Still, too, because a model that can be dragged claims every touch
 * that lands on it, and this one sits in the middle of a page that scrolls.
 * Learn is where the body is turned and explored.
 *
 * `children` goes under "Trained most": on your own profile, what is worth
 * adding.
 */
export function TrainingBodyCard({
  title,
  subtitle,
  body,
  heat,
  heatLoading,
  loadingText,
  emptyText,
  children,
}: {
  readonly title: string;
  readonly subtitle: string;
  /** Which body to draw; null until that is known, so the wrong one never flashes. */
  readonly body: BodyKind | null;
  readonly heat: TrainingHeat | null;
  readonly heatLoading: boolean;
  readonly loadingText: string;
  readonly emptyText: string;
  readonly children?: ReactNode;
}) {
  const sculpted = useSculptedBody(body);
  const generated = useMemo(() => placeholderBodyParts(), []);
  const parts = sculpted.parts ?? generated;
  const stage = useStageColor();

  // The viewer colours only what the taxonomy lets it select — anything else
  // is drawn as resting skin — so the heat needs the real list even though
  // nothing here can be tapped.
  const taxonomy = useCatalogue('muscles-selectable', (r) => r.muscles.selectable());
  const selectableSlugs = useMemo(
    () => (taxonomy.data ?? []).map((muscle) => muscle.slug),
    [taxonomy.data],
  );

  return (
    <section className="overflow-hidden rounded-sheet border border-subtle bg-surface">
      <div className="p-4 pb-3">
        <h2 className="text-lg leading-6 font-semibold text-primary">{title}</h2>
        <p className="mt-0.5 text-sm text-muted">{subtitle}</p>
      </div>

      <div className="grid grid-cols-2 gap-px bg-subtle">
        {VIEWS.map(({ view, label }) => (
          <figure key={view} className="m-0 bg-stage">
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
                  background={stage}
                  {...(heat === null ? {} : { intensity: heat.intensity })}
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

        {heatLoading && heat === null ? (
          <p className="text-sm text-muted">{loadingText}</p>
        ) : heat?.trained !== true ? (
          <p className="text-sm text-secondary">{emptyText}</p>
        ) : (
          heat.top.length > 0 && (
            <div>
              <h3 className={cx('mb-2', EYEBROW)}>Trained most</h3>
              <ul className="flex flex-wrap gap-2">
                {heat.top.map((muscle) => (
                  <li
                    key={muscle.slug}
                    className="rounded-full bg-accent/15 px-3 py-1.5 text-sm font-medium text-accent"
                  >
                    {muscle.name}
                  </li>
                ))}
              </ul>
            </div>
          )
        )}

        {children}
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

/**
 * The heaviest weight on each exercise, heaviest first, the top three in
 * gold, silver and bronze.
 */
export function BestLiftsCard({
  lifts,
  loading,
  unitSystem,
  description,
  linkTo,
  arrived = false,
}: {
  readonly lifts: readonly BestLift[] | null;
  readonly loading: boolean;
  readonly unitSystem: UnitSystem;
  readonly description: string;
  /** Where a row goes when tapped. */
  readonly linkTo: (lift: BestLift) => string;
  /** Arrived at from Home's records card: anchored, and pointed out once. */
  readonly arrived?: boolean;
}) {
  const [all, setAll] = useState(false);
  const shown = lifts === null ? [] : all ? lifts : lifts.slice(0, BESTS_SHOWN);

  return (
    <Panel
      tone="hero"
      eyebrow="Personal records"
      title="Best lifts"
      aside={
        lifts !== null &&
        lifts.length > 0 && (
          <>
            <span className="numeric block text-2xl leading-7 font-bold text-primary">
              {lifts.length}
            </span>
            <span className="block text-xs text-muted">
              {lifts.length === 1 ? 'exercise' : 'exercises'}
            </span>
          </>
        )
      }
      {...(arrived ? { id: BEST_LIFTS_ANCHOR } : {})}
      className={cx('scroll-mt-4', arrived && 'spotlight')}
    >
      <p className="mt-1 mb-2 text-xs text-muted">{description}</p>

      {loading && lifts === null ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="text-sm text-muted">Nothing measurable yet.</p>
      ) : (
        <ul className="flex flex-col">
          {shown.map((lift, index) => {
            const load = toDisplayWeight(lift.valueKg, unitSystem);
            // The list comes heaviest first, so the first three are the podium.
            const place = index < PODIUM ? index + 1 : undefined;
            return (
              <li
                key={lift.exerciseId}
                className={cx(
                  'border-b border-subtle last:border-b-0',
                  place !== undefined && `podium-row relative podium-${String(place)}`,
                )}
              >
                <Link
                  to={linkTo(lift)}
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
                  <span
                    className={cx(
                      'numeric flex shrink-0 items-center gap-1.5',
                      place === 1 ? 'text-lg font-bold' : 'text-base font-semibold',
                      place === undefined ? 'text-primary' : 'podium-ink',
                    )}
                  >
                    {place === 1 && <CrownIcon className="size-4 shrink-0 podium-badge" />}
                    <span className="flex items-baseline">
                      <span className={cx(place === 1 && 'podium-gleam')}>
                        {String(load.value)}
                      </span>
                      {/* The unit a size down, as on Home, and beside the gleam
                          rather than inside it. Inside, it inherited the gleam's
                          transparent ink, and Safari leaves a child with its own
                          opacity out of the text clip, so first place lost its
                          "kg" on iPhones. The space is real text, so it still
                          reads "60 kg". */}
                      <span
                        className={cx(
                          'text-xs font-semibold whitespace-pre',
                          place === undefined ? 'text-muted' : 'podium-unit',
                        )}
                      >
                        {` ${load.unit}`}
                      </span>
                    </span>
                  </span>
                  {/* One width for chevron and laurel, so every weight ends
                      on the same line down the card. */}
                  <span className="flex w-8 shrink-0 justify-end">
                    {place === undefined ? (
                      <ChevronRightIcon className="size-5 text-muted" />
                    ) : (
                      <PlaceLaurel place={place} />
                    )}
                  </span>
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
          className="mt-4 min-h-tap w-full rounded-control text-sm font-medium text-accent active:bg-elevated"
        >
          {all ? 'Show fewer' : `Show all ${String(lifts.length)}`}
        </button>
      )}
    </Panel>
  );
}
