/**
 * The progress screen's words: what each period is called, what goes under a
 * column, and what a comparison says.
 *
 * The arithmetic is in core (`periods.ts`). This is the phrasing, kept out of
 * the component so the edges can be tested — the caption that is blank on
 * purpose, the comparison that must not point downwards on a Tuesday.
 */
import { formatNumber, t } from '@g7m/i18n';
import {
  formatMinutes,
  isChartMetric,
  type ChartMetric,
  type Comparison,
  type Period,
  type Span,
  type UnitSystem,
  type VolumeBucket,
} from '@g7m/core';
import { formatVolumeShort, formatWeightTotal } from '../components/chart-scale.js';
import type { Insight } from './home-copy.js';
import { dayMonth, monthName, monthShort, weekdayName, weekdayShort } from '../lib/date-words.js';

export const PERIOD_OPTIONS: readonly { readonly value: Period; readonly label: string }[] = (
  ['week', 'month', 'all'] as const
).map((value) => ({
  value,
  get label() {
    return t().progress.periods[value];
  },
}));

/** The URL's `?period=`, if it names one. Anything else is the default week. */
export function periodFrom(value: string | null): Period {
  return value === 'month' || value === 'all' ? value : 'week';
}

/**
 * The URL's `?back=`: how many weeks or months the chart has been stepped
 * back. Anything unreadable is now, and nothing goes past the first workout
 * (`max`) or into the future.
 */
export function backFrom(value: string | null, max: number): number {
  const steps = Number(value);
  if (value === null || !Number.isInteger(steps) || steps <= 0) return 0;
  return Math.min(steps, Math.max(0, max));
}

/**
 * What the chart's arrows sit either side of: "This week", "Last week",
 * "31 Aug – 6 Sep", "This month", "August", "December 2025".
 *
 * A week further back is named by its dates, because "three weeks ago" makes
 * somebody count; a month by its name, with the year once it is another one.
 */
export function chartPeriodLabel(period: Period, back: number, span: Span, now: Date): string {
  const words = t().progress.label;
  if (period === 'all') return words.allTime;
  if (period === 'week') {
    if (back === 0) return words.thisWeek;
    if (back === 1) return words.lastWeek;
    // The end is exclusive: the week's last day is the day before it.
    const last = new Date(span.end);
    last.setDate(last.getDate() - 1);
    const sameYear =
      span.start.getFullYear() === now.getFullYear() && last.getFullYear() === now.getFullYear();
    const day = (date: Date) =>
      sameYear ? dayMonth(date) : words.dayMonthYear(dayMonth(date), date.getFullYear());
    return words.range(day(span.start), day(last));
  }
  if (back === 0) return words.thisMonth;
  const name = monthName(span.start);
  return span.start.getFullYear() === now.getFullYear()
    ? name
    : words.monthYear(name, span.start.getFullYear());
}

/** The same, mid-sentence: "last week", "31 Aug – 6 Sep", "in August". */
export function chartPeriodPhrase(period: Period, back: number, span: Span, now: Date): string {
  if (back === 0 || period === 'all') return periodPhrase(period);
  const label = chartPeriodLabel(period, back, span, now);
  const phrase = t().progress.phrase;
  return period === 'week' ? (back === 1 ? phrase.lastWeek : label) : phrase.in(label);
}

/** Under a headline number: "this week", "this month", "all time". */
export function periodPhrase(period: Period): string {
  return t().progress.phrase.this[period];
}

/** What the current period is measured against, or null for all time. */
export function previousPhrase(period: Period): string | null {
  return period === 'all' ? null : (t().progress.phrase.previous[period] ?? null);
}

/**
 * Under a column.
 *
 * A week has room for every day. A month does not — thirty labels in a phone's
 * width is a grey smear — so it is labelled every seventh day from the 1st,
 * which keeps the numbers evenly spaced whatever day the month starts on.
 *
 * English, like the rest of the app outside the greeting (see greeting.ts).
 */
export function captionFor(bucket: Pick<VolumeBucket, 'start'>, period: Period): string {
  if (period === 'all') return monthShort(bucket.start);
  if (period === 'week') return weekdayShort(bucket.start);
  const day = bucket.start.getDate();
  return (day - 1) % 7 === 0 ? String(day) : '';
}

/** A column read aloud: "Monday", "8 September", "September 2026". */
export function bucketName(bucket: Pick<VolumeBucket, 'start'>, period: Period): string {
  const date = bucket.start;
  if (period === 'week') return weekdayName(date);
  if (period === 'month') return t().common.dates.dayMonth(date.getDate(), monthName(date));
  return t().progress.label.monthYear(monthName(date), date.getFullYear());
}

/**
 * What a workout was made of, in a list: "5 sets", "1 bout", "4 sets · 2 bouts".
 *
 * Bouts are named apart from sets because a treadmill session of one
 * 30-minute bout would otherwise read "1 set", which sounds like a warm-up.
 */
export function describeWork(setCount: number, boutCount: number): string {
  const sets = Math.max(0, setCount - boutCount);
  const parts: string[] = [];
  if (sets > 0 || boutCount === 0) parts.push(t().progress.work.sets(sets));
  if (boutCount > 0) parts.push(t().progress.work.bouts(boutCount));
  return parts.join(' · ');
}

/** A view the progress chart can show, as the dropdown lists it. */
export interface MetricOption {
  readonly value: ChartMetric;
  /** The chart's title, and the menu's item. */
  readonly label: string;
  /** Under the item in the menu: what choosing it shows. */
  readonly description: string;
  /** Under the chart's title: how the numbers are counted. */
  readonly caption: string;
}

/** In the menu's order: lifting, then showing up, then cardio. */
export const METRIC_OPTIONS: readonly MetricOption[] = (
  ['volume', 'sets', 'workouts', 'time', 'cardio', 'calories'] as const
).map((value) => ({
  value,
  get label() {
    return t().progress.metrics[value].label;
  },
  get description() {
    return t().progress.metrics[value].description;
  },
  get caption() {
    return t().progress.metrics[value].caption;
  },
}));

/** The view in the URL, or weight lifted — what the chart always showed. */
export function metricFrom(value: string | null): ChartMetric {
  return isChartMetric(value) ? value : 'volume';
}

export function metricOption(metric: ChartMetric): MetricOption {
  const found = METRIC_OPTIONS.find((option) => option.value === metric);
  if (found === undefined) throw new Error(`No chart view ${metric}`);
  return found;
}

/** A column's number, short enough for a phone's axis: `1.2t`, `12`, `45m`. */
export function metricShort(metric: ChartMetric, value: number, unitSystem: UnitSystem): string {
  switch (metric) {
    case 'volume':
      return formatVolumeShort(value, unitSystem);
    case 'time':
    case 'cardio':
      return formatMinutes(value);
    case 'calories':
      return value >= 1000
        ? t().progress.totals.thousand(
            formatNumber(value / 1000, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
          )
        : String(Math.round(value));
    case 'workouts':
    case 'sets':
      return String(Math.round(value));
  }
}

/** A total with its unit: `12.4 t`, `3 workouts`, `2h 5m`, `54 sets`, `≈ 1,420 kcal`. */
export function metricTotal(metric: ChartMetric, value: number, unitSystem: UnitSystem): string {
  const totals = t().progress.totals;
  const whole = Math.round(value);
  switch (metric) {
    case 'volume':
      return formatWeightTotal(value, unitSystem);
    case 'workouts':
      return totals.workouts(formatNumber(whole), whole);
    case 'sets':
      return totals.sets(formatNumber(whole), whole);
    case 'time':
    case 'cardio':
      return formatMinutes(value);
    case 'calories':
      return totals.calories(formatNumber(whole));
  }
}

/**
 * The chart for somebody who cannot see it: the view, the columns with
 * something in them, and the total. Seven days of which five are "nothing" is
 * a sentence that buries the two that matter.
 */
export function metricChartSummary(
  buckets: readonly { readonly start: Date; readonly value: number }[],
  metric: ChartMetric,
  period: Period,
  unitSystem: UnitSystem,
  /** Which week or month, when it is not this one: "last week", "in August". */
  when: string = periodPhrase(period),
): string {
  const { label } = metricOption(metric);
  const words = t().progress.summary;
  const scope = period === 'all' ? words.byMonth : words.byDay;
  const active = buckets.filter((bucket) => bucket.value > 0);
  if (active.length === 0) return words.nothing(label, scope, when);
  const total = buckets.reduce((sum, bucket) => sum + bucket.value, 0);
  const columns = active
    .map((bucket) =>
      words.column(bucketName(bucket, period), metricTotal(metric, bucket.value, unitSystem)),
    )
    .join(', ');
  return words.columns(label, scope, when, columns, metricTotal(metric, total, unitSystem));
}

export interface ComparisonLine {
  /** The number, or the word, on the right of a stat card. */
  readonly headline: string;
  /** Under it: "vs last week", "last week". */
  readonly detail: string;
  /** Only being ahead is coloured. A shortfall mid-week is not news. */
  readonly ahead: boolean;
}

/**
 * The right-hand side of a stat card, or null when there is nothing to say.
 *
 * "↑ 2 / vs last week" when this period is ahead. A shortfall shows last
 * week's number and nothing else — no arrow, no red — because on a Tuesday the
 * week is two days old and the gap is not a fact yet (see `comparePeriods`).
 */
export function describeComparison(
  comparison: Comparison,
  period: Period,
  format: (value: number) => string,
): ComparisonLine | null {
  const previous = previousPhrase(period);
  if (previous === null) return null;

  switch (comparison.kind) {
    case 'ahead':
      return {
        headline: `↑ ${format(comparison.by)}`,
        detail: t().progress.comparison.vs(previous),
        ahead: true,
      };
    case 'level':
      return {
        headline: t().progress.comparison.same,
        detail: t().progress.comparison.as(previous),
        ahead: false,
      };
    case 'behind':
      return { headline: format(comparison.previous), detail: previous, ahead: false };
    case 'none':
      return null;
  }
}

/**
 * "Mar 2026 / first workout", for all time, where there is nothing before it
 * to compare with — so the card says where all time begins instead.
 */
/** Within this many minutes of the month before reads as the same. */
const SAME_LENGTH = 5;

/**
 * What sits under the Active time chart on a month: the average workout, and
 * how it sits against the month before (ADR-0125). Null with nothing timed,
 * where the empty chart has already said it.
 *
 * Unlike the totals above it, an average is not still growing on the 3rd, so
 * it can be held against all of the month before without being unfair to it.
 */
export function describeAverageSession(
  average: number | null,
  previous: number | null,
  previousMonth: string,
): Insight | null {
  if (average === null) return null;
  const words = t().progress.average;
  const heading = words.heading(formatMinutes(average));
  if (previous === null) {
    return {
      heading,
      detail: words.first,
      tone: 'neutral',
      symbol: 'clock',
    };
  }
  const difference = average - previous;
  return {
    heading,
    detail:
      Math.abs(difference) < SAME_LENGTH
        ? words.same(previousMonth)
        : difference > 0
          ? words.longer(formatMinutes(Math.abs(difference)), previousMonth)
          : words.shorter(formatMinutes(Math.abs(difference)), previousMonth),
    tone: 'neutral',
    symbol: 'clock',
  };
}

export function sinceLine(firstAt: Date | null): ComparisonLine | null {
  if (firstAt === null) return null;
  return {
    headline: t().progress.since.at(monthShort(firstAt), firstAt.getFullYear()),
    detail: t().progress.since.first,
    ahead: false,
  };
}

/** The date tile beside a workout in the list: "12" over "SEP". */
export function dateTile(date: Date): { readonly day: string; readonly month: string } {
  return { day: String(date.getDate()), month: monthShort(date).toUpperCase() };
}
