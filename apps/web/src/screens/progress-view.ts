/**
 * The progress screen's words: what each period is called, what goes under a
 * column, and what a comparison says.
 *
 * The arithmetic is in core (`periods.ts`). This is the phrasing, kept out of
 * the component so the edges can be tested — the caption that is blank on
 * purpose, the comparison that must not point downwards on a Tuesday.
 */
import type { Comparison, Period, VolumeBucket } from '@g7m/core';
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
export function captionFor(bucket: VolumeBucket, period: Period): string {
  if (period === 'all') return monthShort(bucket.start);
  if (period === 'week') return weekdayShort(bucket.start);
  const day = bucket.start.getDate();
  return (day - 1) % 7 === 0 ? String(day) : '';
}

/** A column read aloud: "Monday", "8 September", "September 2026". */
export function bucketName(bucket: VolumeBucket, period: Period): string {
  const date = bucket.start;
  if (period === 'week') return weekdayName(date);
  if (period === 'month') return `${String(date.getDate())} ${monthName(date)}`;
  return `${monthName(date)} ${String(date.getFullYear())}`;
}

/**
 * The chart for somebody who cannot see it.
 *
 * Only the columns with something in them are read out. Seven days of which
 * five are "nothing" is a sentence that buries the two that matter, and the
 * count of workouts already says how many there were.
 */
export function chartSummary(
  buckets: readonly VolumeBucket[],
  period: Period,
  format: (kg: number) => string,
): string {
  const trained = buckets.filter((bucket) => bucket.volumeKg > 0);
  const scope = period === 'all' ? 'by month' : 'by day';

  if (trained.length === 0) {
    return `Volume ${scope}, ${periodPhrase(period)}. Nothing logged yet.`;
  }

  const total = buckets.reduce((sum, bucket) => sum + bucket.volumeKg, 0);
  const days = trained
    .map((bucket) => `${bucketName(bucket, period)} ${format(bucket.volumeKg)}`)
    .join(', ');
  return `Volume ${scope}, ${periodPhrase(period)}: ${days}. ${format(total)} in total.`;
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
