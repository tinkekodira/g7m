import { useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import {
  DEFAULT_WEEK_START,
  PERIODS,
  comparePeriods,
  describeWhen,
  formatMinutes,
  periodWindow,
  startOfDay,
  totalsWithin,
  trainingMinutes,
  volumeBuckets,
  type Period,
  type WeekStart,
} from '@g7m/core';
import type { SessionSummary } from '@g7m/db';
import { SegmentedControl, cx } from '@g7m/ui';
import { ColumnChart } from '../components/Charts.js';
import { formatVolumeShort, formatWeightTotal } from '../components/chart-scale.js';
import { ChevronRightIcon, ClockIcon, FlameIcon } from '../components/icons.js';
import { ReviewCard } from '../components/ReviewCard.js';
import { useCatalogue } from '../lib/db/use-catalogue.js';
import { useTrainingReview } from '../lib/db/use-review.js';
import {
  PERIOD_OPTIONS,
  captionFor,
  chartSummary,
  dateTile,
  describeComparison,
  periodFrom,
  periodPhrase,
  sinceLine,
  type ComparisonLine,
} from './progress-view.js';

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
  const choose = (next: Period): void => {
    setParams(next === 'week' ? {} : { period: next }, { replace: true });
  };

  const state = useCatalogue(`progress-${startOfDay(now).toISOString()}`, async (r) => {
    const profile = await r.profile.current();
    const weekStartsOn = (profile?.weekStartsOn ?? DEFAULT_WEEK_START) as WeekStart;

    // Every counted workout, because all time has to count all of them. Each
    // is one aggregated row; a year of training is a couple of hundred.
    const summaries = await r.history.sessionSummaries(null);
    const firstAt = summaries.at(-1)?.startedAt ?? null;

    // Sets as far back as any of the three views reaches — the month before
    // this one, or the start of the all-time chart — so no view needs a read
    // of its own.
    const earliest = PERIODS.map((each) => {
      const window = periodWindow(each, now, weekStartsOn, firstAt);
      return window.previous?.start ?? window.chart.start;
    }).reduce((a, b) => (a < b ? a : b));

    const sets = await r.history.completedSets({ from: earliest });
    return {
      weekStartsOn,
      unitSystem: profile?.unitSystem ?? 'metric',
      summaries,
      firstAt,
      sets,
    };
  });

  const view = useMemo(() => {
    if (state.data === null) return null;
    const { weekStartsOn, summaries, firstAt, sets } = state.data;

    const window = periodWindow(period, now, weekStartsOn, firstAt);
    const buckets = volumeBuckets(window, sets, now);
    const current = totalsWithin(summaries, window.current);
    const previous = window.previous === null ? null : totalsWithin(summaries, window.previous);

    return {
      window,
      buckets,
      current,
      workouts: comparePeriods(current.workouts, previous?.workouts ?? null),
      minutes: comparePeriods(current.minutes, previous?.minutes ?? null),
      volumeKg: buckets.reduce((sum, bucket) => sum + bucket.volumeKg, 0),
    };
  }, [state.data, period, now]);

  const unitSystem = state.data?.unitSystem ?? 'metric';
  const short = (kg: number): string => formatVolumeShort(kg, unitSystem);
  const total = (kg: number): string => formatWeightTotal(kg, unitSystem);
  const since = period === 'all' ? sinceLine(state.data?.firstAt ?? null) : null;

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-4 px-4 pt-safe-top pb-safe-bottom">
      <header className="pt-6">
        <h1 className="text-2xl font-semibold text-primary">Progress</h1>
      </header>

      <SegmentedControl label="Period" options={PERIOD_OPTIONS} value={period} onChange={choose} />

      {state.error !== null ? (
        <p role="alert" className="rounded-card bg-surface p-4 text-sm text-danger">
          {state.error}
        </p>
      ) : state.loading || view === null || state.data === null ? (
        <p className="rounded-card bg-surface p-4 text-sm text-muted">Loading…</p>
      ) : state.data.summaries.length === 0 ? (
        <p className="rounded-card border border-subtle bg-surface p-4 text-sm text-secondary">
          Nothing here yet. Finish a workout and it will show up — the charts need completed
          sessions, so the one you are part-way through does not count until you tap Finish.
        </p>
      ) : (
        <>
          <StatCard
            icon={<FlameIcon className="size-6" />}
            tone="accent"
            title="Total workouts"
            value={String(view.current.workouts)}
            caption={periodPhrase(period)}
            side={since ?? describeComparison(view.workouts, period, String)}
          />
          <StatCard
            icon={<ClockIcon className="size-6" />}
            tone="success"
            title="Active time"
            value={formatMinutes(view.current.minutes)}
            caption={periodPhrase(period)}
            side={since ?? describeComparison(view.minutes, period, formatMinutes)}
          />

          <section className="rounded-card border border-subtle bg-surface p-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-semibold text-primary">Volume</h2>
              <span className="numeric text-sm text-secondary">
                {total(view.volumeKg)}{' '}
                <span className="text-muted">
                  {period === 'all' && view.window.clipped
                    ? 'in the last 12 months'
                    : periodPhrase(period)}
                </span>
              </span>
            </div>
            <p className="mt-1 mb-4 text-xs text-muted">
              Weight times reps, over every working set.
              {period === 'all' ? ' One column a month.' : ' One column a day.'}
            </p>
            <ColumnChart
              data={view.buckets.map((bucket) => ({
                key: bucket.key,
                value: bucket.volumeKg,
                caption: captionFor(bucket, period),
                // A day is trained or it is not. A month in progress is
                // partial, and drawn lighter so it does not read as a slump.
                inProgress: period === 'all' && bucket.inProgress,
                future: bucket.future,
                highlight: period !== 'all' && bucket.inProgress,
              }))}
              format={short}
              summary={chartSummary(view.buckets, period, total)}
            />
          </section>

          {review.data?.review != null && (
            <ReviewCard
              observations={review.data.review.observations}
              links={review.data.links}
              unitSystem={review.data.unitSystem}
            />
          )}

          <RecentWorkouts summaries={state.data.summaries} now={now} />
        </>
      )}
    </main>
  );
}

const TONES = {
  accent: 'bg-accent/15 text-accent',
  success: 'bg-success/15 text-success',
} as const;

/** One headline number, what it covers, and how it compares. */
function StatCard({
  icon,
  tone,
  title,
  value,
  caption,
  side,
}: {
  readonly icon: ReactNode;
  readonly tone: keyof typeof TONES;
  readonly title: string;
  readonly value: string;
  readonly caption: string;
  readonly side: ComparisonLine | null;
}) {
  return (
    <section className="rise flex items-center gap-4 rounded-card border border-subtle bg-surface p-4">
      <span
        aria-hidden
        className={cx(
          'flex size-12 shrink-0 items-center justify-center rounded-full',
          TONES[tone],
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-medium text-secondary">{title}</h2>
        <p className="numeric text-2xl font-bold text-primary">{value}</p>
        <p className="text-xs text-muted">{caption}</p>
      </div>
      {side !== null && (
        <div className="shrink-0 text-right">
          <p
            className={cx(
              'numeric text-sm font-semibold',
              side.ahead ? 'text-success' : 'text-secondary',
            )}
          >
            {side.headline}
          </p>
          <p className="text-xs text-muted">{side.detail}</p>
        </div>
      )}
    </section>
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
    <section className="rounded-card border border-subtle bg-surface p-4">
      <h2 className="mb-1 text-lg font-semibold text-primary">Recent workouts</h2>
      <ul className="flex flex-col">
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
    </section>
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
      <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-control bg-elevated leading-none">
        <span className="numeric text-base font-semibold text-primary">{tile.day}</span>
        <span className="mt-0.5 text-[10px] font-medium tracking-wide text-muted">
          {tile.month}
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-medium text-primary">
          {summary.name ?? 'Workout'}
        </span>
        <span className="numeric block text-xs text-muted">
          {describeWhen(summary.startedAt, now)} · {summary.setCount}{' '}
          {summary.setCount === 1 ? 'set' : 'sets'}
          {minutes !== null && ` · ${String(minutes)} min`}
        </span>
      </span>
      <ChevronRightIcon className="size-5 shrink-0 text-muted" />
    </Link>
  );
}
