import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { countryName, firstName, levelFor, personalRecords, type UnitSystem } from '@g7m/core';
import { cx } from '@g7m/ui';
import { Avatar } from '../components/Avatar.js';
import { Panel } from '../components/Panel.js';
import { StatValue } from '../components/StatValue.js';
import { AchievementsCard, BestLiftsCard, TrainingBodyCard } from '../components/ProfileParts.js';
import { ChevronRightIcon, ClipboardIcon, PencilIcon, TargetIcon } from '../components/icons.js';
import { useProfileBody } from '../lib/db/use-profile-body.js';
import { prefersReducedMotion } from '../lib/use-reduced-motion.js';
import { Flag } from '../components/Flag.js';
import { useCatalogue } from '../lib/db/use-catalogue.js';
import { useAchievements } from '../lib/db/use-achievements.js';
import { earnedCount, latestEarned } from './achievements-view.js';
import {
  HEATMAP_WEEKS,
  SESSIONS_BEFORE_ADVICE,
  useNeglected,
  useTrainingHeat,
} from '../lib/db/use-trained-body.js';
import {
  BEST_LIFTS_ANCHOR,
  BEST_LIFTS_PARAM,
  bestLifts,
  bmiNote,
  goalCardLine,
  indexFor,
  profileStats,
} from './profile-view.js';
import type { Goal } from '@g7m/db';

/**
 * How a tile's second line is coloured.
 *
 * Only the BMI tile carries a verdict rather than a fact, and it is the one
 * line on the page worth reading at a glance. Everything else stays grey —
 * colouring every detail line would leave the one that means something with
 * nothing to stand out against.
 */
const TONES = {
  plain: 'text-muted',
  good: 'text-success',
  caution: 'text-warning',
} as const;

/**
 * Your profile: who you are, and what your training has made of it.
 *
 * The numbers the You screen collects, read-only, with Edit going there to
 * change them. Below them the body, coloured by the last four weeks — what
 * gets trained most, and by what stays grey, what does not — and the heaviest
 * thing lifted on each exercise.
 *
 * Achievements sit between the numbers and the body: how many are earned,
 * the latest few, and the way into the whole collection (ADR-0072).
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

  // Opened from Home's records card: down to the best lifts once they, and
  // the body above them, are drawn (ADR-0123). Read once, like the review on
  // Progress, so nothing pulls the page back later.
  const [params] = useSearchParams();
  const [toBests] = useState(() => params.get(BEST_LIFTS_PARAM) === 'bests');
  const bestsReady = bests.data !== null;
  useEffect(() => {
    if (!toBests || !bestsReady) return;
    document
      .getElementById(BEST_LIFTS_ANCHOR)
      ?.scrollIntoView({ block: 'start', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [toBests, bestsReady]);

  const unitSystem: UnitSystem = profile.data?.unitSystem ?? 'metric';
  const name = firstName(profile.data?.displayName ?? null);
  const fullName = profile.data?.displayName ?? null;

  const facts = {
    unitSystem,
    weightKg: metrics.data?.weightKg ?? null,
    weightAt: metrics.data?.weightAt ?? null,
    heightCm: metrics.data?.heightCm ?? null,
    birthDate: profile.data?.birthDate ?? null,
    sex: profile.data?.sex ?? null,
    activityLevel: metrics.data?.activityLevel ?? null,
    // The band widens for somebody who trains, so it waits for the goal rather
    // than judging them against the untrained one for a frame first.
    trainingDaysPerWeek: goal.data?.daysPerWeek ?? null,
    goalRead: !(goal.loading && goal.data === null),
  };
  const tiles = profileStats(facts, now);
  const note = bmiNote(indexFor(facts, now));

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

      {/* Who, and what for, in one card: the screen's hero, the way the month
          is Home's (ADR-0126). The goal is a block inside it rather than a
          card of its own, so the two read as one person. */}
      <Panel tone="hero" label="You">
        <div className="flex items-center gap-4">
          <Avatar name={name} size="lg" />
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-2xl leading-8 font-bold text-primary">
              {fullName ?? 'Add your name'}
            </p>
            {profile.data?.country != null && (
              <>
                <Flag code={profile.data.country} className="shrink-0 text-xl" />
                {/* The flag is decorative and hidden, and it is now the only place
                    the country appears — so the name of it has to be said
                    somewhere a screen reader will reach. */}
                <span className="sr-only">{countryName(profile.data.country)}</span>
              </>
            )}
          </div>
        </div>

        <LevelLine />

        <GoalCard goal={goal.data} loading={goal.loading} now={now} />
      </Panel>

      {/* One card of figures on a hairline grid, as Home's activity card, rather
          than six boxes of their own. */}
      <Panel title="Your numbers">
        <dl className="mt-2 grid grid-cols-2">
          {tiles.map((tile, index) => {
            const left = index % 2 === 0;
            // An odd tile out at the end takes the whole row rather than
            // leaving a hole beside it.
            const alone = left && index === tiles.length - 1;
            return (
              <div
                key={tile.key}
                className={cx(
                  'min-w-0 py-3',
                  alone && 'col-span-2',
                  left && !alone && 'border-r border-subtle/70 pr-3',
                  !left && 'pl-4',
                  index >= 2 && 'border-t border-subtle/70',
                )}
              >
                <dt className="text-xs text-muted">{tile.label}</dt>
                <dd className="mt-0.5">
                  {tile.value === null ? (
                    <Link
                      to="/you"
                      className="text-sm text-secondary underline-offset-4 hover:underline"
                    >
                      Not set — add it
                    </Link>
                  ) : /\d/.test(tile.value) ? (
                    <StatValue text={tile.value} size="text-xl leading-7" />
                  ) : (
                    <span className="block truncate text-lg leading-7 font-bold text-primary">
                      {tile.value}
                    </span>
                  )}
                  {tile.detail !== undefined && (
                    <span className={cx('block text-xs', TONES[tile.tone ?? 'plain'])}>
                      {tile.detail}
                    </span>
                  )}
                </dd>
              </div>
            );
          })}
        </dl>

        {/* Why the band under BMI is not the 18.5–25 everybody has seen. Left
            unsaid, a widened range reads as loose arithmetic. */}
        {note !== null && (
          <p className="mt-2 border-t border-subtle/70 pt-3 text-xs text-muted">{note}</p>
        )}
      </Panel>

      <AchievementsLink />

      <RoutinesLink />

      <TrainingBody now={now} />

      <BestLiftsCard
        lifts={bests.data}
        loading={bests.loading}
        unitSystem={unitSystem}
        description="The heaviest you have moved on each exercise. Bodyweight lifts count your bodyweight too."
        linkTo={(lift) => `/progress/exercise/${lift.exerciseId}`}
        arrived={toBests}
      />

      <p className="py-4 text-xs text-muted">
        Educational content, not medical advice. These numbers shape a training plan, nothing more.
      </p>
    </main>
  );
}

/**
 * The way into Achievements, with the count and the last three earned on it,
 * so the collection is visible from Profile without opening it.
 */
function AchievementsLink() {
  const state = useAchievements();
  const list = state.data?.list ?? [];
  const { earned, total } = earnedCount(list);
  const latest = latestEarned(list);

  return (
    <AchievementsCard
      to="/achievements"
      list={list}
      line={
        state.data === null
          ? 'Milestones from your training'
          : latest === null
            ? `${String(total)} to earn. Your first workout is the first.`
            : `${String(earned)} of ${String(total)} earned`
      }
    />
  );
}

/**
 * Your level, and how far into it: one quiet line and a hairline, part of who
 * you are rather than a game laid over the page. ADR-0132.
 *
 * The XP is read in the same pass as the achievements, from the same log, so
 * a badge and the XP it is worth arrive together. Nothing until then: a level
 * 1 flashed at somebody on level 30 reads as a lost level.
 */
function LevelLine() {
  const state = useAchievements();
  if (state.data?.ready !== true) return null;
  const { level, xpIntoLevel, xpForLevel, progress } = levelFor(state.data.xp);
  const xp = (value: number) => value.toLocaleString('en-GB');

  return (
    <div className="rise mt-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="flex items-baseline gap-2">
          <span className="text-[11px] leading-4 font-semibold tracking-[0.08em] text-muted uppercase">
            Level
          </span>
          <span className="numeric text-lg leading-6 font-semibold text-primary">{level}</span>
        </p>
        <p className="numeric text-xs text-muted">
          <span className="text-secondary">{xp(xpIntoLevel)}</span> / {xp(xpForLevel)} XP
        </p>
      </div>
      <div
        role="progressbar"
        aria-label={`Level ${String(level)}: ${xp(xpIntoLevel)} of ${xp(xpForLevel)} XP to level ${String(level + 1)}`}
        aria-valuemin={0}
        aria-valuemax={xpForLevel}
        aria-valuenow={xpIntoLevel}
        className="mt-2 h-1 w-full overflow-hidden rounded-full bg-base/70"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: `${String(progress * 100)}%` }}
        />
      </div>
    </div>
  );
}

/**
 * The way into the saved routines, from the screen that holds everything else
 * somebody has accumulated.
 *
 * Home carries them too, in the quick access tiles, but only once one exists —
 * that tile is the shortcut. This is the permanent address, so somebody who
 * has just deleted their last routine still has somewhere to make another.
 */
function RoutinesLink() {
  const state = useCatalogue('routines', (r) => r.routines.list());
  const routines = state.data ?? [];
  const names = routines
    .slice(0, 3)
    .map((routine) => routine.name)
    .join(' · ');

  return (
    <Link
      to="/routines"
      viewTransition
      className="flex min-h-tap w-full items-center gap-3 rounded-sheet border border-subtle bg-surface px-4 py-3 text-left transition-transform duration-150 ease-out active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-card bg-accent/15 text-accent">
        <ClipboardIcon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-medium text-primary">Your routines</span>
        <span className="block truncate text-xs text-muted">
          {state.data === null
            ? 'Workouts you have saved'
            : routines.length === 0
              ? 'Save a workout and it becomes one'
              : names}
        </span>
      </span>
      {routines.length > 0 && (
        <span className="numeric shrink-0 text-sm text-secondary">{routines.length}</span>
      )}
      <ChevronRightIcon aria-hidden className="size-5 shrink-0 text-muted" />
    </Link>
  );
}

/**
 * What the training is for, where it can be seen and changed.
 *
 * It used to be one grey line under the name, and changing it meant Edit, then
 * scrolling past every measurement to a link at the bottom. It is the one
 * setting that decides what the app builds, so it gets a card of its own near
 * the top, all of it one target, with the button saying what the tap does.
 * Without a goal the card asks for one instead. ADR-0071.
 */
function GoalCard({
  goal,
  loading,
  now,
}: {
  readonly goal: Goal | null;
  readonly loading: boolean;
  readonly now: Date;
}) {
  // Nothing rather than "choose a goal" while the row is still being read:
  // flashing the invitation at somebody who has a goal reads as a lost goal.
  if (loading && goal === null) return null;
  const line = goal === null ? null : goalCardLine(goal, now);

  return (
    <Link
      to="/goal"
      state={{ from: '/profile' }}
      viewTransition
      className="rise mt-4 flex items-center gap-3 rounded-card bg-base/70 p-3 transition-transform duration-150 ease-out active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-card bg-accent/15 text-accent"
      >
        <TargetIcon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] leading-4 font-semibold tracking-[0.08em] text-muted uppercase">
          Your goal
        </span>
        <span className="block text-base leading-6 font-semibold text-primary">
          {line?.title ?? 'Choose what you are training for'}
        </span>
        <span className="block text-xs text-muted">
          {line?.detail ?? 'It decides the workout Home writes for you.'}
        </span>
      </span>
      <span className="shrink-0 rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-on-accent">
        {goal === null ? 'Choose' : 'Change'}
      </span>
    </Link>
  );
}

/**
 * Your body, coloured by the last four weeks, and what to do about what stays
 * grey: the list underneath turns it into something to add, from the same
 * function that builds tomorrow's session.
 */
function TrainingBody({ now }: { readonly now: Date }) {
  const heat = useTrainingHeat(now, true);
  const neglected = useNeglected(now, true);

  return (
    <TrainingBodyCard
      title="Your training"
      subtitle={`The last ${String(HEATMAP_WEEKS)} weeks, on your body.`}
      // The body that matches the profile, and nothing until the profile has said.
      body={useProfileBody()}
      heat={heat.data}
      heatLoading={heat.loading}
      loadingText="Working out what you have trained…"
      emptyText={`Nothing logged in the last ${String(HEATMAP_WEEKS)} weeks yet. Finish a workout and it shows up here.`}
    >
      <div>
        <h3 className="mb-2 text-[11px] leading-4 font-semibold tracking-[0.08em] text-muted uppercase">
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
    </TrainingBodyCard>
  );
}
