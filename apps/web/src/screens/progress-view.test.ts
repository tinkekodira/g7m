import { describe, expect, it } from 'vitest';
import { periodWindow, volumeBuckets, type VolumeBucket } from '@g7m/core';
import {
  PERIOD_OPTIONS,
  bucketName,
  captionFor,
  chartSummary,
  dateTile,
  describeComparison,
  periodFrom,
  periodPhrase,
  previousPhrase,
  sinceLine,
} from './progress-view.js';

function local(year: number, month: number, day: number, hour = 12): Date {
  return new Date(year, month - 1, day, hour);
}

const WEDNESDAY = local(2026, 9, 9, 15);
const week = volumeBuckets(periodWindow('week', WEDNESDAY), [], WEDNESDAY);
const month = volumeBuckets(periodWindow('month', WEDNESDAY), [], WEDNESDAY);

function withVolume(bucket: VolumeBucket, volumeKg: number): VolumeBucket {
  return { ...bucket, volumeKg, sessions: 1 };
}

/** The bucket at an index, or a failed test rather than an `undefined` passed along. */
function at(buckets: readonly VolumeBucket[], index: number): VolumeBucket {
  const bucket = buckets[index];
  if (bucket === undefined) throw new Error(`no bucket at ${String(index)}`);
  return bucket;
}

const kg = (value: number): string => `${String(value)} kg`;

describe('PERIOD_OPTIONS and periodFrom', () => {
  it('offers the three views, weekly first', () => {
    expect(PERIOD_OPTIONS.map((option) => option.label)).toEqual(['Weekly', 'Monthly', 'All time']);
  });

  it('reads a period from the URL, and defaults anything else to the week', () => {
    expect(periodFrom('month')).toBe('month');
    expect(periodFrom('all')).toBe('all');
    expect(periodFrom('week')).toBe('week');
    expect(periodFrom(null)).toBe('week');
    expect(periodFrom('fortnight')).toBe('week');
  });
});

describe('phrases', () => {
  it('names each period and the one before it', () => {
    expect(periodPhrase('week')).toBe('this week');
    expect(periodPhrase('month')).toBe('this month');
    expect(periodPhrase('all')).toBe('all time');
    expect(previousPhrase('week')).toBe('last week');
    expect(previousPhrase('month')).toBe('last month');
    expect(previousPhrase('all')).toBeNull();
  });
});

describe('captionFor', () => {
  it('labels every day of a week', () => {
    expect(week.map((bucket) => captionFor(bucket, 'week'))).toEqual([
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
      'Sun',
    ]);
  });

  /** Thirty labels across a phone is a grey smear. */
  it('labels a month every seventh day from the first', () => {
    const labelled = month
      .map((bucket) => captionFor(bucket, 'month'))
      .filter((caption) => caption !== '');
    expect(labelled).toEqual(['1', '8', '15', '22', '29']);
  });

  it('labels all time by month', () => {
    const all = volumeBuckets(periodWindow('all', WEDNESDAY, 1, local(2026, 7, 1)), [], WEDNESDAY);
    expect(all.map((bucket) => captionFor(bucket, 'all'))).toEqual(['Jul', 'Aug', 'Sep']);
  });
});

describe('bucketName', () => {
  it('reads a column out in full', () => {
    expect(bucketName(at(week, 0), 'week')).toBe('Monday');
    expect(bucketName(at(month, 7), 'month')).toBe('8 September');
    const all = volumeBuckets(periodWindow('all', WEDNESDAY), [], WEDNESDAY);
    expect(bucketName(at(all, 0), 'all')).toBe('September 2026');
  });
});

describe('chartSummary', () => {
  it('reads out only the days with training in them, and the total', () => {
    const buckets = week.map((bucket, index) =>
      index === 0 ? withVolume(bucket, 1000) : index === 2 ? withVolume(bucket, 600) : bucket,
    );
    expect(chartSummary(buckets, 'week', kg)).toBe(
      'Volume by day, this week: Monday 1000 kg, Wednesday 600 kg. 1600 kg in total.',
    );
  });

  it('says plainly when there is nothing yet', () => {
    expect(chartSummary(week, 'week', kg)).toBe('Volume by day, this week. Nothing logged yet.');
  });
});

describe('describeComparison', () => {
  const count = (value: number): string => String(value);

  it('states being ahead, with an arrow', () => {
    expect(describeComparison({ kind: 'ahead', by: 2 }, 'week', count)).toEqual({
      headline: '↑ 2',
      detail: 'vs last week',
      ahead: true,
    });
  });

  it('states being level', () => {
    expect(describeComparison({ kind: 'level' }, 'month', count)).toEqual({
      headline: 'Same',
      detail: 'as last month',
      ahead: false,
    });
  });

  /**
   * On a Tuesday the week is two days old. No arrow, no colour — only last
   * week's number to read against.
   */
  it('gives a shortfall last week’s number and no direction', () => {
    const line = describeComparison({ kind: 'behind', previous: 4 }, 'week', count);
    expect(line).toEqual({ headline: '4', detail: 'last week', ahead: false });
    expect(line?.headline).not.toMatch(/↓|-|−/);
  });

  it('has nothing to say for all time, or with nothing to compare', () => {
    expect(describeComparison({ kind: 'ahead', by: 3 }, 'all', count)).toBeNull();
    expect(describeComparison({ kind: 'none' }, 'week', count)).toBeNull();
  });
});

describe('sinceLine', () => {
  it('says where all time begins', () => {
    expect(sinceLine(local(2026, 3, 14))).toEqual({
      headline: 'Mar 2026',
      detail: 'first workout',
      ahead: false,
    });
    expect(sinceLine(null)).toBeNull();
  });
});

describe('dateTile', () => {
  it('is the day over a short month', () => {
    expect(dateTile(local(2026, 9, 12))).toEqual({ day: '12', month: 'SEP' });
  });
});
