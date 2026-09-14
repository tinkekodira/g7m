/**
 * The progress screen's words: what each period is called, what goes under a
 * column, and what a comparison says.
 *
 * The arithmetic is in core (`periods.ts`). This is the phrasing, kept out of
 * the component so the edges can be tested — the caption that is blank on
 * purpose, the comparison that must not point downwards on a Tuesday.
 */
import {
  formatMinutes,
  isChartMetric,
  type ChartMetric,
  type Comparison,
  type Period,
  type UnitSystem,
  type VolumeBucket,
} from '@g7m/core';
import { formatVolumeShort, formatWeightTotal } from '../components/chart-scale.js';
import { monthName, monthShort, weekdayName, weekdayShort } from '../lib/date-words.js';

export const PERIOD_OPTIONS = [
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'all', label: 'All time' },
] as const satisfies readonly { value: Period; label: string }[];

/** The URL's `?period=`, if it names one. Anything else is the default week. */
export function periodFrom(value: string | null): Period {
  return value === 'month' || value === 'all' ? value : 'week';
}

/** Under a headline number: "this week", "this month", "all time". */
export function periodPhrase(period: Period): string {
  switch (period) {
    case 'week':
      return 'this week';
    case 'month':
      return 'this month';
    case 'all':
      return 'all time';
  }
}

/** What the current period is measured against, or null for all time. */
export function previousPhrase(period: Period): string | null {
  switch (period) {
    case 'week':
      return 'last week';
    case 'month':
      return 'last month';
    case 'all':
      return null;
  }
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
  if (period === 'month') return `${String(date.getDate())} ${monthName(date)}`;
  return `${monthName(date)} ${String(date.getFullYear())}`;
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
  if (sets > 0 || boutCount === 0) parts.push(`${String(sets)} ${sets === 1 ? 'set' : 'sets'}`);
  if (boutCount > 0) parts.push(`${String(boutCount)} ${boutCount === 1 ? 'bout' : 'bouts'}`);
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
export const METRIC_OPTIONS: readonly MetricOption[] = [
  {
    value: 'volume',
    label: 'Weight lifted',
    description: 'Weight times reps',
    caption: 'Weight times reps, over every working set.',
  },
  {
    value: 'sets',
    label: 'Sets',
    description: 'Working sets, warm-ups left out',
    caption: 'Working sets, warm-ups left out.',
  },
  {
    value: 'workouts',
    label: 'Workouts',
    description: 'How many you finished',
    caption: 'Workouts finished.',
  },
  {
    value: 'time',
    label: 'Active time',
    description: 'Training time, cardio included',
    caption: 'Time training, first set to last, cardio included.',
  },
  {
    value: 'cardio',
    label: 'Cardio time',
    description: 'Minutes on the machines',
    caption: 'Time on the cardio machines.',
  },
  {
    value: 'calories',
    label: 'Calories',
    description: 'Burned on cardio',
    caption: 'From cardio: the machine’s figure, or the estimate.',
  },
];

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
      return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(Math.round(value));
    case 'workouts':
    case 'sets':
      return String(Math.round(value));
  }
}

/** A total with its unit: `12.4 t`, `3 workouts`, `2h 5m`, `54 sets`, `≈ 1,420 kcal`. */
export function metricTotal(metric: ChartMetric, value: number, unitSystem: UnitSystem): string {
  const count = (singular: string, plural: string) =>
    `${Math.round(value).toLocaleString('en-GB')} ${Math.round(value) === 1 ? singular : plural}`;
  switch (metric) {
    case 'volume':
      return formatWeightTotal(value, unitSystem);
    case 'workouts':
      return count('workout', 'workouts');
    case 'sets':
      return count('set', 'sets');
    case 'time':
    case 'cardio':
      return formatMinutes(value);
    case 'calories':
      return `≈ ${Math.round(value).toLocaleString('en-GB')} kcal`;
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
): string {
  const { label } = metricOption(metric);
  const scope = period === 'all' ? 'by month' : 'by day';
  const active = buckets.filter((bucket) => bucket.value > 0);
  if (active.length === 0) return `${label} ${scope}, ${periodPhrase(period)}. Nothing logged yet.`;
  const total = buckets.reduce((sum, bucket) => sum + bucket.value, 0);
  const columns = active
    .map(
      (bucket) => `${bucketName(bucket, period)} ${metricTotal(metric, bucket.value, unitSystem)}`,
    )
    .join(', ');
  return `${label} ${scope}, ${periodPhrase(period)}: ${columns}. ${metricTotal(metric, total, unitSystem)} in total.`;
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
      return { headline: `↑ ${format(comparison.by)}`, detail: `vs ${previous}`, ahead: true };
    case 'level':
      return { headline: 'Same', detail: `as ${previous}`, ahead: false };
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
export function sinceLine(firstAt: Date | null): ComparisonLine | null {
  if (firstAt === null) return null;
  return {
    headline: `${monthShort(firstAt)} ${String(firstAt.getFullYear())}`,
    detail: 'first workout',
    ahead: false,
  };
}

/** The date tile beside a workout in the list: "12" over "SEP". */
export function dateTile(date: Date): { readonly day: string; readonly month: string } {
  return { day: String(date.getDate()), month: monthShort(date).toUpperCase() };
}
