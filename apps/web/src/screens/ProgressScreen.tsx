import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import {
  DEFAULT_WEEK_START,
  averageSession,
  cardioTotalsWithin,
  chartBuckets,
  comparePeriods,
  formatDistance,
  describeWhen,
  formatMinutes,
  periodWindow,
  periodsBack,
  shiftWindow,
  startOfDay,
  totalsWithin,
  trainingMinutes,
  workoutTitle,
  type ChartMetric,
  type Period,
  type UnitSystem,
  type WeekStart,
} from '@g7m/core';
import type { SessionSummary } from '@g7m/db';
import { SegmentedControl, cx } from '@g7m/ui';
import { ColumnChart } from '../components/Charts.js';
import { InsightRow } from '../components/InsightRow.js';
import { Panel } from '../components/Panel.js';
import { StatValue } from '../components/StatValue.js';
import { HeaderLink } from '../components/HeaderLink.js';
import {
  ArrowUpIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardIcon,
  ClockIcon,
  DumbbellIcon,
  FlameIcon,
  HeartIcon,
} from '../components/icons.js';
import { ViewPicker, type ViewOption } from '../components/ViewPicker.js';
import { StepArrow } from '../components/StepArrow.js';
import { ReviewCard } from '../components/ReviewCard.js';
import { prefersReducedMotion } from '../lib/use-reduced-motion.js';
import { REVIEW_ANCHOR, REVIEW_PARAM } from './review-copy.js';
import { useCatalogue } from '../lib/db/use-catalogue.js';
import { readChartMetric, writeChartMetric } from '../lib/chart-preference.js';
import { monthName } from '../lib/date-words.js';
import { useTrainingReview } from '../lib/db/use-review.js';
import {
  PERIOD_OPTIONS,
  backFrom,
  captionFor,
  chartPeriodLabel,
  chartPeriodPhrase,
  dateTile,
  describeAverageSession,
  describeWork,
  metricChartSummary,
  metricFrom,
  metricOption,
  metricShort,
  metricTotal,
  METRIC_OPTIONS,
  describeComparison,
  periodFrom,
  periodPhrase,
  sinceLine,
  type ComparisonLine,
} from './progress-view.js';

/** The dropdown's items: the views, each with its icon. */
const VIEW_ICONS: Readonly<Record<ChartMetric, ReactNode>> = {
  volume: <DumbbellIcon className="size-5" />,
  sets: <ClipboardIcon className="size-5" />,
  workouts: <CalendarIcon className="size-5" />,
  time: <ClockIcon className="size-5" />,
  cardio: <HeartIcon className="size-5" />,
  calories: <FlameIcon className="size-5" />,
};

const VIEW_OPTIONS: readonly ViewOption<ChartMetric>[] = METRIC_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
  description: option.description,
  icon: VIEW_ICONS[option.value],
}));

/** Workouts listed before "Show all". Enough to see the last fortnight or so. */
const RECENT_SHOWN = 5;

/**
 * Progress: this week, this month, or all of it.
 *
 * Reads only finished sessions, so nothing here moves while somebody is
 * mid-workout — a day's column growing under you as you train reads as a bug
 * even when the arithmetic is right.
 *
 * Everything the three views need is read once, when the screen opens, and
 * each view is arithmetic over it. Switching between them is then instant,
 * which is the difference between a control somebody flicks through and one
 * they tap once and wait on.
 *
 * Bests used to live here and moved to Profile, beside the rest of what
 * somebody is — this screen is about what they have been doing.
 */
export function ProgressScreen() {
  const now = useMemo(() => new Date(), []);
  const review = useTrainingReview(now);

  // In the URL like every other filter (ADR-0034), so the back button returns
  // to the view that was showing rather than resetting to the week.
  const [params, setParams] = useSearchParams();
  const period = periodFrom(params.get('period'));
  // The address first, then what was chosen last time the app was open: a
  // Home Screen app swiped out of the switcher comes back to `/` with no
  // query on it, and used to land on weight lifted whatever was picked.
  const metric = metricFrom(params.get('chart') ?? readChartMetric());
  const backParam = params.get('back');
  // Opened from Home's note: go to the review it was a line from. Read once,
  // so changing the period afterwards does not keep pulling the page back.
  const [toReview] = useState(() => params.get(REVIEW_PARAM) === 'review');
  // Defaults left out of the address, so an untouched screen has a clean one.
  const writeParams = (nextPeriod: Period, nextMetric: ChartMetric, nextBack: number): void => {
    writeChartMetric(nextMetric);
    setParams(
      {
        ...(nextPeriod === 'week' ? {} : { period: nextPeriod }),
        ...(nextMetric === 'volume' ? {} : { chart: nextMetric }),
        ...(nextBack === 0 ? {} : { back: String(nextBack) }),
      },
      { replace: true },
    );
  };
  // A new period starts from now: three weeks back is not three months back.
  const choose = (next: Period): void => {
    writeParams(next, metric, 0);
  };

  const state = useCatalogue(`progress-${startOfDay(now).toISOString()}`, async (r) => {
    const profile = await r.profile.current();
    const weekStartsOn = (profile?.weekStartsOn ?? DEFAULT_WEEK_START) as WeekStart;

    // Every counted workout, because all time has to count all of them. Each
    // is one aggregated row; a year of training is a couple of hundred.
    const summaries = await r.history.sessionSummaries(null);
    const firstAt = summaries.at(-1)?.startedAt ?? null;

    // Every set: the chart's arrows go back as far as the first workout, and
    // stepping through weeks should be arithmetic, not a read per tap. A year
    // of training is a few thousand small rows (ADR-0073).
    const sets = await r.history.completedSets();
    // Every bout ever: small rows, and all time needs all of them (ADR-0069).
    const bouts = await r.history.completedBouts();
    return {
      weekStartsOn,
      unitSystem: profile?.unitSystem ?? 'metric',
      summaries,
      firstAt,
      sets,
      bouts,
    };
  });

  // Down to the review once it, and everything above it, is drawn: scrolled
  // earlier, the charts arriving above would push it back off the screen.
  const reviewShown = review.data?.review != null;
  const ready = reviewShown && state.data !== null;
  useEffect(() => {
    if (!toReview || !ready) return;
    document
      .getElementById(REVIEW_ANCHOR)
      ?.scrollIntoView({ block: 'start', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [toReview, ready]);

  const view = useMemo(() => {
    if (state.data === null) return null;
    const { weekStartsOn, summaries, firstAt, sets, bouts } = state.data;

    const window = periodWindow(period, now, weekStartsOn, firstAt);
    const current = totalsWithin(summaries, window.current);
    const previous = window.previous === null ? null : totalsWithin(summaries, window.previous);

    // Whichever view the dropdown chose, over the columns of whichever week or
    // month the arrows are on. The cards above stay on this one.
    const maxBack = periodsBack(period, now, weekStartsOn, firstAt);
    const back = backFrom(backParam, maxBack);
    const chartWindow = shiftWindow(window, back);
    const chart = chartBuckets(metric, chartWindow, { sets, sessions: summaries, bouts }, now);

    const cardioNow = cardioTotalsWithin(bouts, window.current);
    const cardioBefore =
      window.previous === null ? null : cardioTotalsWithin(bouts, window.previous);

    return {
      window,
      current,
      workouts: comparePeriods(current.workouts, previous?.workouts ?? null),
      minutes: comparePeriods(current.minutes, previous?.minutes ?? null),
      chart,
      back,
      maxBack,
      chartLabel: chartPeriodLabel(period, back, chartWindow.chart, now),
      chartPhrase: chartPeriodPhrase(period, back, chartWindow.chart, now),
      // What the chart draws — all time is the last twelve months of columns.
      chartTotal: chart.reduce((sum, bucket) => sum + bucket.value, 0),
      // Under Active time on a month, the average workout in the month the
      // arrows are on, against the one before it (ADR-0125). Where Home's
      // fifth card used to say it.
      average:
        period === 'month' && metric === 'time'
          ? describeAverageSession(
              averageSession(summaries, chartWindow.current),
              chartWindow.previous === null
                ? null
                : averageSession(summaries, chartWindow.previous),
              chartWindow.previous === null ? '' : monthName(chartWindow.previous.start),
            )
          : null,
      cardio: {
        totals: cardioNow,
        minutes: comparePeriods(cardioNow.minutes, cardioBefore?.minutes ?? null),
      },
    };
  }, [state.data, period, metric, backParam, now]);

  const unitSystem = state.data?.unitSystem ?? 'metric';
  const since = period === 'all' ? sinceLine(state.data?.firstAt ?? null) : null;

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-4 px-4 pt-safe-top pb-safe-bottom">
      {/* A way back, now that Progress is a tile on Home rather than a tab
          of its own (ADR-0105). */}
      <header className="flex items-baseline justify-between gap-4 pt-6">
        <h1 className="text-2xl font-semibold text-primary">Progress</h1>
        <HeaderLink to="/">Home</HeaderLink>
      </header>

      <SegmentedControl label="Period" options={PERIOD_OPTIONS} value={period} onChange={choose} />

      {state.error !== null ? (
        <p
          role="alert"
          className="rounded-sheet border border-subtle bg-surface p-4 text-sm text-destructive"
        >
          {state.error}
        </p>
      ) : state.loading || view === null || state.data === null ? (
        <ProgressSkeleton />
      ) : state.data.summaries.length === 0 ? (
        <Panel eyebrow="Progress" title="Nothing here yet">
          <p className="mt-1 text-sm text-secondary">
            Finish a workout and it shows up here. The charts count completed sessions, so the one
            you are part-way through counts once you tap Finish.
          </p>
        </Panel>
      ) : (
        <>
          {/* The two numbers somebody opens this screen for, side by side in
              one card rather than a card each (ADR-0124). */}
          {/* No period in the title: the control above and the chart's own label
              below already say which week, and a third "This week" is noise. */}
          <Panel tone="hero" title="Your training">
            <div className="mt-4 grid grid-cols-2">
              <Headline
                label="Total workouts"
                value={String(view.current.workouts)}
                side={since ?? describeComparison(view.workouts, period, String)}
                first
              />
              <Headline
                label="Active time"
                value={formatMinutes(view.current.minutes)}
                side={since ?? describeComparison(view.minutes, period, formatMinutes)}
              />
            </div>
          </Panel>

          <Panel
            tone="hero"
            label="Chart"
            header={
              <ViewPicker
                label="Chart view"
                value={metric}
                options={VIEW_OPTIONS}
                onChange={(next) => {
                  writeParams(period, next, view.back);
                }}
              />
            }
            aside={
              <>
                <StatValue
                  text={metricTotal(metric, view.chartTotal, unitSystem)}
                  size="text-xl leading-7"
                />
                {/* Which week or month is said once, between the arrows; all
                    time has no arrows, so it is said here. */}
                {period === 'all' && (
                  <span className="block text-xs text-muted">
                    {view.window.clipped ? 'in the last 12 months' : 'all time'}
                  </span>
                )}
              </>
            }
          >
            {period !== 'all' && (
              <PeriodStepper
                period={period}
                label={view.chartLabel}
                back={view.back}
                maxBack={view.maxBack}
                onStep={(next) => {
                  writeParams(period, metric, next);
                }}
              />
            )}
            <p className="mt-2 mb-4 text-xs text-muted">
              {metricOption(metric).caption}
              {period === 'all' ? ' One column a month.' : ' One column a day.'}
            </p>
            <SwipeToStep
              enabled={period !== 'all'}
              onStep={(direction) => {
                const next = view.back + (direction === 'earlier' ? 1 : -1);
                if (next >= 0 && next <= view.maxBack) writeParams(period, metric, next);
              }}
            >
              <ColumnChart
                data={view.chart.map((bucket) => ({
                  key: bucket.key,
                  value: bucket.value,
                  caption: captionFor(bucket, period),
                  // A day is trained or it is not. A month in progress is
                  // partial, and drawn lighter so it does not read as a slump.
                  inProgress: period === 'all' && bucket.inProgress,
                  future: bucket.future,
                  highlight: period !== 'all' && bucket.inProgress,
                }))}
                format={(value) => metricShort(metric, value, unitSystem)}
                summary={metricChartSummary(
                  view.chart,
                  metric,
                  period,
                  unitSystem,
                  period === 'all' ? undefined : view.chartPhrase,
                )}
              />
            </SwipeToStep>
            {view.average !== null && <InsightRow insight={view.average} className="rise mt-4" />}
          </Panel>

          {/* Only once there is cardio to show: a lifter who never gets on a
              machine should not scroll past a card of zeros. */}
          {state.data.bouts.length > 0 && (
            <CardioSection
              period={period}
              unitSystem={unitSystem}
              minutes={view.cardio.totals.minutes}
              distanceM={view.cardio.totals.distanceM}
              kcal={view.cardio.totals.kcal}
              comparison={
                period === 'all'
                  ? null
                  : describeComparison(view.cardio.minutes, period, formatMinutes)
              }
            />
          )}

          {review.data?.review != null && (
            <ReviewCard
              observations={review.data.review.observations}
              links={review.data.links}
              unitSystem={review.data.unitSystem}
              arrived={toReview}
            />
          )}

          <RecentWorkouts summaries={state.data.summaries} now={now} />
        </>
      )}
    </main>
  );
}

/**
 * The arrows either side of which week or month the chart is on, as the
 * calendar steps through months. Back as far as the first workout, forward as
 * far as now; "Back to this week" once it is more than a tap away. ADR-0073.
 */
function PeriodStepper({
  period,
  label,
  back,
  maxBack,
  onStep,
}: {
  readonly period: Exclude<Period, 'all'>;
  readonly label: string;
  readonly back: number;
  readonly maxBack: number;
  readonly onStep: (back: number) => void;
}) {
  const unit = period === 'week' ? 'week' : 'month';
  return (
    <div className="mt-2 flex items-center gap-1">
      <StepArrow
        label={`Previous ${unit}`}
        disabled={back >= maxBack}
        onClick={() => {
          onStep(back + 1);
        }}
      >
        <ChevronLeftIcon className="size-5" />
      </StepArrow>
      <div className="min-w-0 flex-1 text-center">
        <p aria-live="polite" className="numeric text-sm font-semibold text-primary">
          {label}
        </p>
        {back > 1 && (
          <button
            type="button"
            onClick={() => {
              onStep(0);
            }}
            className="text-xs font-medium text-accent underline-offset-2 active:underline"
          >
            Back to this {unit}
          </button>
        )}
      </div>
      <StepArrow
        label={`Next ${unit}`}
        disabled={back <= 0}
        onClick={() => {
          onStep(back - 1);
        }}
      >
        <ChevronRightIcon className="size-5" />
      </StepArrow>
    </div>
  );
}

/**
 * A sideways swipe across the chart steps it, as a thumb expects on a phone:
 * right to left is later, left to right earlier, the way a page turns.
 *
 * Only a swipe that is mostly sideways and long enough to mean it, and only
 * sideways: `touch-pan-y` leaves the page's own vertical scrolling to the
 * browser and hands the horizontal movement here.
 */
function SwipeToStep({
  enabled,
  onStep,
  children,
}: {
  readonly enabled: boolean;
  readonly onStep: (direction: 'earlier' | 'later') => void;
  readonly children: ReactNode;
}) {
  const start = useRef<{ x: number; y: number } | null>(null);
  if (!enabled) return <>{children}</>;
  return (
    <div
      className="touch-pan-y"
      onPointerDown={(event) => {
        start.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerUp={(event) => {
        const from = start.current;
        start.current = null;
        if (from === null) return;
        const dx = event.clientX - from.x;
        const dy = event.clientY - from.y;
        if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
        onStep(dx > 0 ? 'earlier' : 'later');
      }}
      onPointerCancel={() => {
        start.current = null;
      }}
    >
      {children}
    </div>
  );
}

/**
 * Cardio for the period, in three numbers: time on the machines, distance and
 * calories, with how the time compares. ADR-0069.
 *
 * Its minutes and calories by day are views of the chart above (ADR-0071),
 * so this card keeps the totals rather than drawing a second chart.
 */
function CardioSection({
  period,
  unitSystem,
  minutes,
  distanceM,
  kcal,
  comparison,
}: {
  readonly period: Period;
  readonly unitSystem: UnitSystem;
  readonly minutes: number;
  readonly distanceM: number;
  readonly kcal: number;
  readonly comparison: ComparisonLine | null;
}) {
  const unit = unitSystem === 'imperial' ? 'mi' : 'km';
  return (
    <Panel
      eyebrow={capitalised(periodPhrase(period))}
      title="Cardio"
      aside={comparison === null ? undefined : <Compared line={comparison} />}
    >
      <div className="mt-3 grid grid-cols-3">
        <CardioFigure label="Time" value={minutes > 0 ? formatMinutes(minutes) : '—'} />
        <CardioFigure
          label="Distance"
          value={distanceM > 0 ? formatDistance(distanceM, unit) : '—'}
        />
        <CardioFigure
          label="Calories"
          value={kcal > 0 ? `≈ ${kcal.toLocaleString('en-GB')}` : '—'}
          unit={kcal > 0 ? 'kcal' : undefined}
          last
        />
      </div>
    </Panel>
  );
}

function capitalised(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * One of cardio's three numbers. Its own text, not `StatValue`: "≈ 760" and
 * "10 km" are read as written, the unit for calories on a line of its own.
 */
function CardioFigure({
  label,
  value,
  unit,
  last = false,
}: {
  readonly label: string;
  readonly value: string;
  readonly unit?: string | undefined;
  readonly last?: boolean;
}) {
  return (
    <div className={cx('min-w-0 px-3 first:pl-0', !last && 'border-r border-subtle/70')}>
      <p className="text-xs leading-4 text-muted">{label}</p>
      <p className="numeric mt-1 truncate text-lg leading-6 font-bold text-primary">{value}</p>
      {unit !== undefined && <p className="text-xs text-muted">{unit}</p>}
    </div>
  );
}

/**
 * One of the two headline numbers: the label, the figure with its units a
 * size down (as on Home), and how it compares.
 */
function Headline({
  label,
  value,
  side,
  first = false,
}: {
  readonly label: string;
  readonly value: string;
  readonly side: ComparisonLine | null;
  readonly first?: boolean;
}) {
  return (
    <div className={cx('min-w-0', first ? 'border-r border-subtle/70 pr-3' : 'pl-4')}>
      <h3 className="text-xs leading-4 text-muted">{label}</h3>
      <p className="numeric mt-1">
        <StatValue text={value} size="text-3xl leading-9" />
      </p>
      {side !== null && <Compared line={side} />}
    </div>
  );
}

/**
 * How a number compares: green with an arrow when ahead, and otherwise only
 * last time's figure, without a direction. A shortfall mid-week is not news
 * (`comparePeriods`).
 */
function Compared({ line }: { readonly line: ComparisonLine }) {
  if (line.ahead) {
    return (
      <p className="numeric mt-0.5 flex items-center gap-0.5 text-xs leading-4 font-medium text-success">
        <ArrowUpIcon aria-hidden className="size-3" strokeWidth={2.4} />
        {line.headline.replace(/^↑\s*/, '')}
        <span className="ml-1 font-normal text-muted">{line.detail}</span>
      </p>
    );
  }
  return (
    <p className="numeric mt-0.5 text-xs leading-4 text-muted">
      <span className="font-medium text-secondary">{line.headline}</span> {line.detail}
    </p>
  );
}

/** The screen's own shape while its numbers are read: the two cards to come. */
function ProgressSkeleton() {
  return (
    <div aria-busy aria-label="Loading" className="flex flex-col gap-4">
      <div className="h-40 animate-pulse rounded-sheet border border-subtle bg-surface" />
      <div className="h-80 animate-pulse rounded-sheet border border-subtle bg-surface" />
    </div>
  );
}

function RecentWorkouts({
  summaries,
  now,
}: {
  readonly summaries: readonly SessionSummary[];
  readonly now: Date;
}) {
  const [all, setAll] = useState(false);
  const shown = all ? summaries : summaries.slice(0, RECENT_SHOWN);

  return (
    <Panel title="Recent workouts">
      <ul className="mt-1 flex flex-col">
        {shown.map((summary) => (
          <li key={summary.sessionId} className="border-b border-subtle last:border-b-0">
            <SessionRow summary={summary} now={now} />
          </li>
        ))}
      </ul>
      {summaries.length > RECENT_SHOWN && (
        <button
          type="button"
          onClick={() => {
            setAll((previous) => !previous);
          }}
          className="mt-2 min-h-tap w-full rounded-control text-sm font-medium text-accent active:bg-elevated"
        >
          {all ? 'Show fewer' : `Show all ${String(summaries.length)}`}
        </button>
      )}
    </Panel>
  );
}

function SessionRow({ summary, now }: { readonly summary: SessionSummary; readonly now: Date }) {
  // From the sets, not from how long the workout was open. See `trainingMinutes`.
  const minutes = trainingMinutes([summary.firstSetAt, summary.lastSetAt]);
  const tile = dateTile(summary.startedAt);

  return (
    <Link
      to={`/progress/session/${summary.sessionId}`}
      className="flex min-h-tap items-center gap-3 py-3 active:opacity-80"
    >
      <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-card bg-base/60 leading-none">
        <span className="numeric text-base font-semibold text-primary">{tile.day}</span>
        <span className="mt-0.5 text-[10px] font-medium tracking-wide text-muted">
          {tile.month}
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-medium text-primary">
          {summary.name ?? workoutTitle(summary.work, summary.boutCount)}
        </span>
        <span className="numeric block text-xs text-muted">
          {describeWhen(summary.startedAt, now)} ·{' '}
          {describeWork(summary.setCount, summary.boutCount)}
          {minutes !== null && ` · ${String(minutes)} min`}
        </span>
      </span>
      <ChevronRightIcon className="size-5 shrink-0 text-muted" />
    </Link>
  );
}
