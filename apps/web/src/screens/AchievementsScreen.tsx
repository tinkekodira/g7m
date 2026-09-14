import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import {
  ACHIEVEMENT_CATEGORIES,
  type Achievement,
  type AchievementCategory,
  type UnitSystem,
} from '@g7m/core';
import { cx } from '@g7m/ui';
import { HeaderLink } from '../components/HeaderLink.js';
import { AchievementMedal } from '../components/AchievementMedal.js';
import { CATEGORY_FILL } from '../components/achievement-tones.js';
import { CalendarIcon, CheckIcon } from '../components/icons.js';
import { useAchievements } from '../lib/db/use-achievements.js';
import {
  CATEGORY_TITLES,
  earnedCount,
  earnedWords,
  latestEarned,
  nextChanceWords,
  shortDate,
  progressFraction,
  progressWords,
} from './achievements-view.js';

/**
 * Every achievement, as a grid of badges. ADR-0072.
 *
 * Earned ones in colour with the day they were earned; the rest greyed out
 * with a bar showing how close they are, or, for the ones only a date can
 * give, when that date next comes round. Four groups and the one secret,
 * each in the catalogue's order so a ladder reads from the bottom rung up.
 *
 * Opened from Profile, or from the banner that announced a badge — in which
 * case the address names it (`?badge=gym-rat`) and the screen scrolls to it
 * and points it out once.
 */
export function AchievementsScreen() {
  const state = useAchievements();
  const [params] = useSearchParams();
  const spotlight = params.get('badge');
  const now = useMemo(() => new Date(), []);

  const list = state.data?.list ?? null;
  const unitSystem = state.data?.unitSystem ?? 'metric';

  // Scrolled to once it is on screen. Centred, so it is not left under the
  // header or behind the tab bar.
  const loaded = list !== null;
  useEffect(() => {
    if (!loaded || spotlight === null) return;
    document
      .getElementById(`badge-${spotlight}`)
      ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [loaded, spotlight]);

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-5 px-4 pt-safe-top pb-safe-bottom">
      <header className="flex items-start justify-between gap-3 pt-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-primary">Achievements</h1>
          <p className="mt-1 text-sm text-secondary">Milestones from your training.</p>
        </div>
        <HeaderLink to="/profile">Profile</HeaderLink>
      </header>

      {state.error !== null && <p className="text-sm text-danger">{state.error}</p>}
      {list === null ? (
        state.loading && <p className="text-sm text-muted">Loading…</p>
      ) : (
        <>
          <Overview list={list} now={now} />
          {ACHIEVEMENT_CATEGORIES.map((category) => (
            <Category
              key={category}
              category={category}
              list={list.filter((each) => each.category === category)}
              unitSystem={unitSystem}
              spotlight={spotlight}
              now={now}
            />
          ))}
        </>
      )}

      <p className="py-4 text-xs text-muted">
        Worked out from your training log, so past workouts count and a deleted set takes its badge
        with it.
      </p>
    </main>
  );
}

/** How many of them, as a number and a bar, and the last few earned. */
function Overview({ list, now }: { readonly list: readonly Achievement[]; readonly now: Date }) {
  const { earned, total } = earnedCount(list);
  const recent = [...list]
    .filter((each) => each.earnedAt !== null)
    .sort((a, b) => (b.earnedAt?.getTime() ?? 0) - (a.earnedAt?.getTime() ?? 0))
    .slice(0, 5);
  const latest = latestEarned(list);
  const latestAt = latest?.earnedAt ?? null;

  return (
    <section className="rise rounded-card border border-subtle bg-surface p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm text-secondary">
          <span className="numeric text-3xl font-bold text-primary">{earned}</span>
          <span className="numeric text-lg text-muted"> / {total}</span>
          <span className="sr-only"> achievements earned</span>
        </p>
        <p className="text-xs text-muted">{earned === 0 ? 'None yet' : 'earned'}</p>
      </div>
      <Bar fraction={total === 0 ? 0 : earned / total} fill="bg-accent" className="mt-3 h-2" />
      {latest !== null && latestAt !== null && (
        <div className="mt-4 flex items-center gap-3">
          <div className="flex -space-x-2">
            {recent.map((each) => (
              <AchievementMedal
                key={each.key}
                achievement={each}
                size="sm"
                className="ring-2 ring-surface"
              />
            ))}
          </div>
          <p className="min-w-0 text-xs text-muted">
            Latest: <span className="font-semibold text-primary">{latest.name}</span>, earned{' '}
            {shortDate(latestAt, now)}
          </p>
        </div>
      )}
    </section>
  );
}

function Category({
  category,
  list,
  unitSystem,
  spotlight,
  now,
}: {
  readonly category: AchievementCategory;
  readonly list: readonly Achievement[];
  readonly unitSystem: UnitSystem;
  readonly spotlight: string | null;
  readonly now: Date;
}) {
  const { title, detail } = CATEGORY_TITLES[category];
  const { earned, total } = earnedCount(list);
  return (
    <section aria-labelledby={`category-${category}`}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <h2 id={`category-${category}`} className="text-lg font-semibold text-primary">
            {title}
          </h2>
          <p className="text-xs text-muted">{detail}</p>
        </div>
        <p className="numeric shrink-0 text-sm text-secondary">
          {earned} / {total}
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {list.map((each) => (
          <Badge
            key={each.key}
            achievement={each}
            unitSystem={unitSystem}
            spotlight={each.key === spotlight}
            now={now}
          />
        ))}
      </ul>
    </section>
  );
}

/**
 * One badge: the medal, the name that stands out, a line on what it takes,
 * and underneath either when it was earned or how close it is.
 */
function Badge({
  achievement,
  unitSystem,
  spotlight,
  now,
}: {
  readonly achievement: Achievement;
  readonly unitSystem: UnitSystem;
  readonly spotlight: boolean;
  readonly now: Date;
}) {
  const earned = achievement.earnedAt !== null;
  const hidden = achievement.secret && !earned;
  const name = hidden ? 'Secret achievement' : achievement.name;
  const description = hidden ? 'Keep training. It will find you.' : achievement.description;

  return (
    <li
      id={`badge-${achievement.key}`}
      aria-label={`${name}. ${description}.`}
      className={cx(
        'flex flex-col items-center gap-2 rounded-card border bg-surface px-3 pt-4 pb-3 text-center',
        earned ? 'border-subtle' : 'border-dashed border-subtle',
        spotlight && 'spotlight',
      )}
    >
      <AchievementMedal achievement={achievement} />
      <div className="min-w-0">
        <p
          className={cx(
            'text-[15px] leading-tight font-extrabold tracking-tight',
            earned ? 'text-primary' : 'text-secondary',
          )}
        >
          {name}
        </p>
        <p className="mt-1 text-xs leading-snug text-muted">{description}</p>
      </div>
      <div className="mt-auto w-full pt-1">
        <Status achievement={achievement} unitSystem={unitSystem} now={now} />
      </div>
    </li>
  );
}

function Status({
  achievement,
  unitSystem,
  now,
}: {
  readonly achievement: Achievement;
  readonly unitSystem: UnitSystem;
  readonly now: Date;
}) {
  if (achievement.earnedAt !== null) {
    return (
      <p className="flex items-center justify-center gap-1 text-xs font-medium text-success">
        <CheckIcon aria-hidden className="size-4" />
        {earnedWords(achievement.earnedAt, now)}
      </p>
    );
  }
  if (achievement.progress !== null) {
    return (
      <div>
        <Bar
          fraction={progressFraction(achievement.progress)}
          fill={CATEGORY_FILL[achievement.category]}
          className="h-1.5"
        />
        <p className="numeric mt-1 text-[11px] text-muted">
          {progressWords(achievement.progress, unitSystem)}
        </p>
      </div>
    );
  }
  if (achievement.nextChance !== null) {
    return (
      <p className="flex items-center justify-center gap-1 text-[11px] text-muted">
        <CalendarIcon aria-hidden className="size-3.5" />
        {nextChanceWords(achievement.nextChance, now)}
      </p>
    );
  }
  return <p className="text-[11px] text-muted">Not yet</p>;
}

function Bar({
  fraction,
  fill,
  className,
}: {
  readonly fraction: number;
  readonly fill: string;
  readonly className?: string;
}) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(fraction * 100)}
      className={cx('w-full overflow-hidden rounded-full bg-elevated', className)}
    >
      <div
        className={cx('h-full rounded-full transition-[width] duration-500', fill)}
        // A sliver rather than nothing once there is any progress at all, so
        // "one workout of fifty" still shows a start.
        style={{ width: fraction === 0 ? '0%' : `${String(Math.max(4, fraction * 100))}%` }}
      />
    </div>
  );
}
