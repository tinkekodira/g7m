import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { Link } from 'react-router';
import {
  BODY_REGIONS,
  REGION_LABELS,
  activityInsight,
  formatMinutes,
  musclesInsight,
  percentChange,
  workoutsInsight,
  type MonthFigure,
  type MonthStats,
  type UnitSystem,
} from '@g7m/core';
import { cx } from '@g7m/ui';
import type { QueryState } from '../lib/db/use-catalogue.js';
import type { HomeStats } from '../lib/db/use-month-stats.js';
import { monthName, monthShort } from '../lib/date-words.js';
import { buzz } from '../lib/haptics.js';
import { prefersReducedMotion } from '../lib/use-reduced-motion.js';
import {
  describeActivity,
  describeMuscles,
  describeWorkouts,
  formatPerWeek,
  type Insight,
  type InsightSymbol,
} from '../screens/home-copy.js';
import { MonthLine, RegionRing, type Motion } from './Charts.js';
import { formatWeightTotal } from './chart-scale.js';
import { REGION_DOT } from './region-colours.js';
import { StatSkeleton } from './StatSkeleton.js';
import {
  ArrowUpIcon,
  BodyIcon,
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  FlameIcon,
  PlayIcon,
  TargetIcon,
  TrendIcon,
  TrophyIcon,
  type IconProps,
} from './icons.js';

/**
 * The top of Home: this month, as three cards side by side (ADR-0120).
 *
 * Most people never press "Start workout" on the generated plan, so the most
 * valuable place on the first screen goes to what everybody has — their own
 * training, added up. Three cards in a row that swipes, so the section stays
 * one card tall and Quick access stays on the first screen of an iPhone SE.
 *
 * Every number is read from the log (`useMonthStats`), and every card says one
 * thing underneath it in words, worked out from the same numbers.
 *
 * A fourth card is one entry in `CARDS` and one component: the shell, the
 * carousel, the page marker and the arrival are all shared.
 */

/** Where every card leads: Progress, already on this month. */
const PROGRESS_THIS_MONTH = '/progress?period=month';

interface CardEntry {
  readonly key: string;
  /** For the carousel's slide label: "Muscle groups, 2 of 3". */
  readonly name: string;
  readonly render: (home: HomeStats, motion: Motion) => ReactNode;
}

const CARDS: readonly CardEntry[] = [
  {
    key: 'workouts',
    name: 'Workouts',
    render: (home, motion) => <WorkoutsCard stats={home.stats} motion={motion} />,
  },
  {
    key: 'muscles',
    name: 'Muscle groups',
    render: (home, motion) => <MusclesCard stats={home.stats} motion={motion} />,
  },
  {
    key: 'activity',
    name: 'Strength and activity',
    render: (home, motion) => (
      <ActivityCard stats={home.stats} unitSystem={home.unitSystem} motion={motion} />
    ),
  },
];

/**
 * Whether the cards have already arrived once since the app opened.
 *
 * The drawing-in is a welcome, not a show. It plays the first time Home opens
 * and not when somebody comes back to it from Calendar ten seconds later.
 */
let arrived = false;

export function StatsHero({
  month,
  after,
}: {
  readonly month: QueryState<HomeStats>;
  /** Shown under the page marker, part of the same block: the coach's note. */
  readonly after?: ReactNode;
}) {
  const home = month.data;

  if (home === null) {
    // A failed read is not worth an error on the first screen: the same
    // numbers are on Progress, which says so properly.
    if (month.error !== null) return after ?? null;
    return (
      <section aria-label="This month" aria-busy className="flex flex-col gap-3">
        <StatSkeleton />
        {after}
      </section>
    );
  }

  if (!home.hasHistory) {
    return (
      <section aria-label="This month" className="flex flex-col gap-3">
        <FirstWorkoutCard stats={home.stats} />
        {after}
      </section>
    );
  }

  return (
    <section aria-label="This month" className="flex flex-col">
      <Carousel cards={CARDS} home={home} />
      {after !== undefined && after !== null && <div className="mt-1">{after}</div>}
    </section>
  );
}

/** The gap between cards, in pixels. Matches `gap-3`. */
const CARD_GAP = 12;

function Carousel({
  cards,
  home,
}: {
  readonly cards: readonly CardEntry[];
  readonly home: HomeStats;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  // Decided once, on the first render: under Reduce Motion, or on a second
  // visit, everything is simply there.
  const [intro] = useState(() => !arrived && !prefersReducedMotion());
  const [seen, setSeen] = useState<ReadonlySet<number>>(() => new Set([0]));

  useEffect(() => {
    arrived = true;
  }, []);

  function onScroll(): void {
    const element = scroller.current;
    const first = element?.firstElementChild;
    if (element === null || !(first instanceof HTMLElement)) return;
    const step = first.offsetWidth + CARD_GAP;
    const index = Math.min(cards.length - 1, Math.max(0, Math.round(element.scrollLeft / step)));
    if (index === active) return;
    setActive(index);
    setSeen((before) => (before.has(index) ? before : new Set([...before, index])));
    // The same light tap a phone gives a picker landing on a value.
    buzz('tick');
  }

  return (
    <>
      <div
        ref={scroller}
        onScroll={onScroll}
        aria-roledescription="carousel"
        aria-label="This month"
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-pl-4 gap-3 overflow-x-auto overscroll-x-contain pl-4"
      >
        {cards.map((card, index) => (
          <div
            key={card.key}
            role="group"
            aria-roledescription="slide"
            aria-label={`${card.name}, ${String(index + 1)} of ${String(cards.length)}`}
            // Narrower than the screen by enough to show the next card's
            // edge: the only hint a swipe needs.
            className="flex w-[calc(100%-1.75rem)] shrink-0 snap-start"
          >
            {card.render(home, !intro ? 'still' : seen.has(index) ? 'play' : 'wait')}
          </div>
        ))}
        {/* The right-hand padding, which an overflowing flex row drops. */}
        <div aria-hidden className="w-1 shrink-0" />
      </div>

      {/* Which card this is. Not buttons: swiping is the way across, each card
          is reachable by keyboard as a link, and three dots too small to hit
          would be three targets that fail the 48px rule. */}
      <div aria-hidden className="flex h-6 items-center justify-center gap-1.5">
        {cards.map((card, index) => (
          <span
            key={card.key}
            className={cx(
              'h-1.5 rounded-full transition-[width,background-color] duration-300 ease-out',
              index === active ? 'w-5 bg-accent' : 'w-1.5 bg-strong',
            )}
          />
        ))}
      </div>
    </>
  );
}

// --- The shell -------------------------------------------------------------

/**
 * The frame every month card shares: a name, a headline figure, the chart, and
 * a line saying what it means.
 *
 * The whole card is one link to Progress on this month, where the same numbers
 * can be stepped back through. One target, as big as the card, rather than a
 * chevron to aim for; it presses in slightly so a tap is felt to have landed.
 */
function StatCard({
  label,
  icon: Icon,
  eyebrow,
  title,
  figure,
  insight,
  children,
}: {
  /** The card read aloud, in one sentence: what a screen reader announces for the link. */
  readonly label: string;
  readonly icon: ComponentType<IconProps>;
  readonly eyebrow: string;
  readonly title: string;
  readonly figure: ReactNode;
  readonly insight: Insight;
  readonly children: ReactNode;
}) {
  return (
    <Link
      to={PROGRESS_THIS_MONTH}
      aria-label={label}
      className={cx(
        'relative isolate flex min-h-[18.5rem] w-full flex-col overflow-hidden rounded-sheet border border-accent/20 bg-surface p-4',
        'transition-transform duration-150 ease-out select-none active:scale-[0.985]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
      )}
    >
      <div aria-hidden className="stat-glow pointer-events-none absolute inset-0 -z-10" />

      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-card bg-accent/15 text-accent"
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-[11px] leading-4 font-semibold tracking-[0.08em] text-muted uppercase">
            {eyebrow}
          </p>
          <p className="text-lg leading-6 font-semibold text-primary">{title}</p>
        </div>
        <div className="shrink-0 pt-0.5 text-right">{figure}</div>
      </div>

      <div className="mt-4 flex min-h-0 flex-1 flex-col">{children}</div>

      <InsightRow insight={insight} />
    </Link>
  );
}

const SYMBOLS: Record<InsightSymbol, ComponentType<IconProps>> = {
  up: ArrowUpIcon,
  trophy: TrophyIcon,
  check: CheckIcon,
  target: TargetIcon,
  play: PlayIcon,
  clock: ClockIcon,
};

/**
 * What the numbers mean, sunk into the card's floor.
 *
 * Tone is carried by the mark on the left — the accent when it is going well,
 * plain when it is a nudge or just how things stand. Never red: being behind
 * on the 13th is not an error, and a red line on the first screen would read
 * as one.
 */
function InsightRow({ insight }: { readonly insight: Insight }) {
  const Symbol = SYMBOLS[insight.symbol];
  return (
    <div className="mt-4 flex items-center gap-3 rounded-card bg-base/70 px-3 py-2.5">
      <span
        aria-hidden
        className={cx(
          'flex size-8 shrink-0 items-center justify-center rounded-full',
          insight.tone === 'good' ? 'bg-accent/15 text-accent' : 'bg-elevated text-secondary',
        )}
      >
        <Symbol className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm leading-5 font-semibold text-primary">
          {insight.heading}
        </span>
        <span className="block text-xs leading-4 text-secondary">{insight.detail}</span>
      </span>
      <ChevronRightIcon aria-hidden className="size-4 shrink-0 text-muted" />
    </div>
  );
}

/** A headline figure: the number large, what it counts small beneath. */
function Figure({ value, caption }: { readonly value: string; readonly caption: string }) {
  return (
    <>
      <span className="numeric block text-2xl leading-7 font-bold text-primary">{value}</span>
      <span className="block text-xs text-muted">{caption}</span>
    </>
  );
}

// --- The cards -------------------------------------------------------------

function WorkoutsCard({ stats, motion }: { readonly stats: MonthStats; readonly motion: Motion }) {
  const insight = describeWorkouts(workoutsInsight(stats));
  const shown = Math.round(useCountUp(stats.workouts.current, motion));
  const current = monthName(stats.month.start);
  const previous = monthName(stats.previousMonth.start);
  const total = stats.workouts.current;

  return (
    <StatCard
      label={`Workouts this month: ${String(total)} completed. ${insight.heading}. ${insight.detail}`}
      icon={TrendIcon}
      eyebrow="Your workouts"
      title="This month"
      figure={<Figure value={String(shown)} caption="completed" />}
      insight={insight}
    >
      <MonthLine
        current={stats.cumulative}
        previous={stats.previousCumulative}
        days={stats.daysInMonth}
        monthLabel={monthShort(stats.month.start)}
        currentName={current}
        previousName={previous}
        showPrevious={stats.previousTotal > 0}
        summary={`${String(total)} workouts in ${current} so far, against ${String(stats.workouts.previous)} by this day in ${previous}.`}
        motion={motion}
      />
    </StatCard>
  );
}

function MusclesCard({ stats, motion }: { readonly stats: MonthStats; readonly motion: Motion }) {
  const insight = describeMuscles(musclesInsight(stats));
  const sets = Math.round(useCountUp(stats.regionSets, motion));
  const trained = stats.regions.length;
  // The legend reads largest first; the ring keeps its fixed order, so each
  // region keeps its colour and its place.
  const legend =
    trained === 0
      ? BODY_REGIONS.map((region) => ({ region, share: 0 }))
      : [...stats.regions].sort((a, b) => b.share - a.share);
  const percent = (share: number): string => `${String(Math.round(share * 100))}%`;

  return (
    <StatCard
      label={`Muscle groups this month: ${String(stats.regionSets)} ${stats.regionSets === 1 ? 'set' : 'sets'} across ${String(trained)} ${trained === 1 ? 'group' : 'groups'}. ${insight.heading}. ${insight.detail}`}
      icon={BodyIcon}
      eyebrow="Muscle groups"
      title="This month"
      figure={<Figure value={String(trained)} caption={trained === 1 ? 'group' : 'groups'} />}
      insight={insight}
    >
      <div className="flex flex-1 items-center gap-5">
        <RegionRing
          slices={stats.regions.map((share) => ({
            key: share.region,
            value: share.sets,
            color: `var(--region-${share.region})`,
          }))}
          summary={
            trained === 0
              ? 'No sets this month yet.'
              : stats.regions
                  .map((share) => `${REGION_LABELS[share.region]} ${percent(share.share)}`)
                  .join(', ')
          }
          center={
            <>
              <span className="numeric text-2xl leading-7 font-bold text-primary">{sets}</span>
              <span className="text-xs text-muted">{stats.regionSets === 1 ? 'set' : 'sets'}</span>
            </>
          }
          motion={motion}
        />
        <ul aria-hidden className="flex min-w-0 flex-1 flex-col gap-1.5">
          {legend.map(({ region, share }) => (
            <li key={region} className="flex items-center gap-2 text-sm leading-5">
              <span
                className={cx(
                  'size-2 shrink-0 rounded-full',
                  REGION_DOT[region],
                  trained === 0 && 'opacity-35',
                )}
              />
              <span
                className={cx(
                  'min-w-0 flex-1 truncate',
                  trained === 0 ? 'text-muted' : 'text-secondary',
                )}
              >
                {REGION_LABELS[region]}
              </span>
              <span className="numeric font-medium text-primary">
                {trained === 0 ? '–' : percent(share)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </StatCard>
  );
}

function ActivityCard({
  stats,
  unitSystem,
  motion,
}: {
  readonly stats: MonthStats;
  readonly unitSystem: UnitSystem;
  readonly motion: Motion;
}) {
  const insight = describeActivity(activityInsight(stats));
  const workouts = Math.round(useCountUp(stats.workouts.current, motion));
  const minutes = useCountUp(stats.minutes.current, motion);
  const perWeek = useCountUp(stats.perWeek.current, motion);
  const volume = useCountUp(stats.volumeKg.current, motion);
  const through = Math.min(stats.day, stats.daysInPreviousMonth);
  const range = `${monthShort(stats.previousMonth.start)} 1–${String(through)}`;

  // Nothing last month to measure against: every cell would say "none then".
  const first = stats.previousTotal === 0 && stats.workouts.previous === 0;
  const time = formatMinutes(stats.minutes.current);
  const lifted = formatWeightTotal(stats.volumeKg.current, unitSystem);

  return (
    <StatCard
      label={`Strength and activity this month: ${String(stats.workouts.current)} ${stats.workouts.current === 1 ? 'workout' : 'workouts'}, ${time} training, ${formatPerWeek(stats.perWeek.current)} a week, ${lifted} lifted. Compared with ${range}. ${insight.heading}. ${insight.detail}`}
      icon={FlameIcon}
      eyebrow="Strength & activity"
      title="This month"
      figure={
        first ? (
          <span className="block text-xs leading-4 font-medium text-secondary">First month</span>
        ) : (
          <>
            <span className="block text-[11px] leading-4 text-muted">Compared with</span>
            <span className="numeric block text-xs leading-4 font-medium text-secondary">
              {range}
            </span>
          </>
        )
      }
      insight={insight}
    >
      <dl className="grid flex-1 grid-cols-2 content-center">
        <Stat label="Workouts" corner="top-left">
          <Value parts={[[String(workouts), '']]} />
          <Delta figure={stats.workouts} as="count" first={first} />
        </Stat>
        <Stat label="Training time" corner="top-right">
          <Value parts={minuteParts(minutes)} />
          <Delta figure={stats.minutes} as="percent" first={first} />
        </Stat>
        <Stat label="Per week" corner="bottom-left">
          <Value parts={[[formatPerWeek(Math.round(perWeek * 10) / 10), '']]} />
          <Delta figure={stats.perWeek} as="decimal" first={first} />
        </Stat>
        <Stat label="Volume lifted" corner="bottom-right">
          <Value parts={[weightParts(formatWeightTotal(volume, unitSystem))]} />
          <Delta figure={stats.volumeKg} as="percent" first={first} />
        </Stat>
      </dl>
    </StatCard>
  );
}

/** One quarter of the activity grid, with a hairline on its inner edges. */
function Stat({
  label,
  corner,
  children,
}: {
  readonly label: string;
  readonly corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  readonly children: ReactNode;
}) {
  return (
    <div
      className={cx(
        'min-w-0 py-2.5',
        corner.endsWith('left') ? 'border-r border-subtle/70 pr-3' : 'pl-4',
        corner.startsWith('top') && 'border-b border-subtle/70',
      )}
    >
      <dt className="text-xs leading-4 text-muted">{label}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  );
}

/** A value with its units a size down: "4h 32m", "12.4 t". */
function Value({ parts }: { readonly parts: readonly (readonly [string, string])[] }) {
  return (
    <span className="numeric block text-2xl leading-7 font-bold whitespace-nowrap text-primary">
      {parts.map(([number, unit], index) => (
        <span key={`${String(index)}-${unit}`}>
          {index > 0 && ' '}
          {number}
          {unit !== '' && <span className="ml-px text-sm font-semibold text-muted">{unit}</span>}
        </span>
      ))}
    </span>
  );
}

function minuteParts(minutes: number): [string, string][] {
  const parts = [...formatMinutes(minutes).matchAll(/(\d+)([hm])/g)].map(
    (match): [string, string] => [match[1] ?? '', match[2] ?? ''],
  );
  return parts.length === 0 ? [['0', 'm']] : parts;
}

/** "850 kg" into its number and unit. */
function weightParts(text: string): [string, string] {
  const space = text.lastIndexOf(' ');
  return space === -1 ? [text, ''] : [text.slice(0, space), text.slice(space + 1)];
}

/**
 * This month against last month to the same day.
 *
 * Green and an arrow up when it is more; muted and an arrow down when it is
 * less. Less is not drawn in red: it is a fact about a month still running,
 * not something that went wrong.
 */
function Delta({
  figure,
  as,
  first,
}: {
  readonly figure: MonthFigure;
  readonly as: 'count' | 'percent' | 'decimal';
  /** No last month to compare with at all. */
  readonly first: boolean;
}) {
  const { current, previous } = figure;
  const quiet = 'mt-0.5 block text-xs leading-4 text-muted';

  // Said once, in the card's corner, rather than under every number.
  if (first) return null;
  if (current === previous) return <span className={quiet}>Same as last month</span>;
  if (as === 'percent' && previous === 0) return <span className={quiet}>None last month</span>;

  const up = current > previous;
  const difference = Math.abs(current - previous);
  const amount =
    as === 'count'
      ? String(difference)
      : as === 'decimal'
        ? formatPerWeek(Math.round(difference * 10) / 10)
        : `${String(Math.abs(percentChange(current, previous) ?? 0))}%`;

  return (
    <span
      className={cx(
        'numeric mt-0.5 flex items-center gap-0.5 text-xs leading-4 font-medium',
        up ? 'text-success' : 'text-muted',
      )}
    >
      <ArrowUpIcon aria-hidden className={cx('size-3', !up && 'rotate-180')} strokeWidth={2.4} />
      <span className="sr-only">{up ? 'up' : 'down'}</span>
      {amount}
    </span>
  );
}

// --- Other states ----------------------------------------------------------

/**
 * Somebody who has never finished a workout.
 *
 * Not three cards of zeros: a flat line and an empty ring say "you have done
 * nothing" three times over. One card instead — the month's axis with a dot on
 * today, where the line will start — and the way to start it.
 */
function FirstWorkoutCard({ stats }: { readonly stats: MonthStats }) {
  const ticks = [1, 8, 15, 22, stats.daysInMonth];
  // The middle of each day, as on the month's line.
  const at = (day: number): string =>
    `${String(((day - 0.5) / Math.max(1, stats.daysInMonth)) * 100)}%`;

  return (
    <div className="relative isolate overflow-hidden rounded-sheet border border-accent/20 bg-surface p-4">
      <div aria-hidden className="stat-glow pointer-events-none absolute inset-0 -z-10" />
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-card bg-accent/15 text-accent"
        >
          <TrendIcon className="size-5" />
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-[11px] leading-4 font-semibold tracking-[0.08em] text-muted uppercase">
            Your month
          </p>
          <p className="text-lg leading-6 font-semibold text-primary">
            {monthName(stats.month.start)}
          </p>
        </div>
      </div>

      <div aria-hidden className="relative mt-6 mr-1 ml-1 h-12">
        <div className="absolute inset-x-0 bottom-0 border-t border-subtle" />
        <div className="absolute inset-x-0 top-0 border-t border-subtle/40" />
        <span className="absolute bottom-0 size-0" style={{ left: at(stats.day) }}>
          <span className="absolute size-7 -translate-1/2 rounded-full bg-accent/15" />
          <span className="absolute size-2.5 -translate-1/2 rounded-full bg-accent ring-2 ring-surface" />
          <span className="absolute bottom-3 -translate-x-1/2 text-[10px] font-medium whitespace-nowrap text-secondary">
            Today
          </span>
        </span>
      </div>
      <div aria-hidden className="relative mt-2 mr-1 ml-1 h-3">
        {ticks.map((day, index) => (
          <span
            key={day}
            className={cx(
              'numeric absolute top-0 text-[10px] leading-none whitespace-nowrap text-muted',
              index === 0
                ? ''
                : index === ticks.length - 1
                  ? '-translate-x-full'
                  : '-translate-x-1/2',
            )}
            style={{ left: at(day) }}
          >
            {index === 0 ? `${monthShort(stats.month.start)} 1` : day}
          </span>
        ))}
      </div>

      <h2 className="mt-5 text-xl leading-7 font-bold text-primary">
        Your first workout starts the chart
      </h2>
      <p className="mt-1 text-sm text-secondary">
        Log one and this fills in: how often you train, which muscles you work and how much you
        lift, month by month.
      </p>
      <Link
        to="/workout"
        onClick={() => {
          buzz('tick');
        }}
        className={cx(
          'mt-4 inline-flex min-h-12 items-center gap-2 rounded-full bg-accent pr-6 pl-5 text-base font-medium text-on-accent select-none',
          'transition-[background-color,transform] duration-150 hover:bg-accent-hover active:scale-[0.97] active:bg-accent-pressed',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        )}
      >
        <PlayIcon className="size-4" />
        Log a workout
      </Link>
    </div>
  );
}

// --- Motion ----------------------------------------------------------------

/**
 * A number counting up to its value as its card arrives.
 *
 * From where it was, not from zero, when the value changes later — a sync
 * landing while Home is open moves 11 to 12, it does not replay 0 to 12.
 */
function useCountUp(target: number, motion: Motion, duration = 600): number {
  const [value, setValue] = useState(motion === 'still' ? target : 0);
  const from = useRef(motion === 'still' ? target : 0);

  useEffect(() => {
    if (motion === 'wait') return;
    if (motion === 'still' || prefersReducedMotion()) {
      from.current = target;
      setValue(target);
      return;
    }
    const start = performance.now();
    const origin = from.current;
    let frame = 0;
    const tick = (time: number): void => {
      const progress = Math.min(1, (time - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      const next = origin + (target - origin) * eased;
      from.current = next;
      setValue(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [target, motion, duration]);

  return value;
}
