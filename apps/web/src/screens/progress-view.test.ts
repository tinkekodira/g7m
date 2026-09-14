import { describe, expect, it } from 'vitest';
import { periodWindow, volumeBuckets, type VolumeBucket } from '@g7m/core';
import {
  PERIOD_OPTIONS,
  bucketName,
  captionFor,
  dateTile,
  describeComparison,
  describeWork,
  metricChartSummary,
  backFrom,
  chartPeriodLabel,
  chartPeriodPhrase,
  metricFrom,
  metricShort,
  metricTotal,
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

/** The bucket at an index, or a failed test rather than an `undefined` passed along. */
function at(buckets: readonly VolumeBucket[], index: number): VolumeBucket {
  const bucket = buckets[index];
  if (bucket === undefined) throw new Error(`no bucket at ${String(index)}`);
  return bucket;
}

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

describe('describeWork', () => {
  it('names sets and bouts apart', () => {
    expect(describeWork(5, 0)).toBe('5 sets');
    expect(describeWork(1, 0)).toBe('1 set');
    expect(describeWork(1, 1)).toBe('1 bout');
    expect(describeWork(6, 2)).toBe('4 sets · 2 bouts');
  });

  it('still says something for an empty workout', () => {
    expect(describeWork(0, 0)).toBe('0 sets');
  });
});

describe('the chart views', () => {
  it('reads the view from the URL, and falls back to weight lifted', () => {
    expect(metricFrom('sets')).toBe('sets');
    expect(metricFrom(null)).toBe('volume');
    expect(metricFrom('reps')).toBe('volume');
  });

  it('writes a column short and a total with its unit', () => {
    expect(metricShort('volume', 12400, 'metric')).toBe('12t');
    expect(metricShort('time', 95, 'metric')).toBe('1h 35m');
    expect(metricShort('calories', 1420, 'metric')).toBe('1.4k');
    expect(metricTotal('volume', 12400, 'metric')).toBe('12 t');
    expect(metricTotal('workouts', 1, 'metric')).toBe('1 workout');
    expect(metricTotal('sets', 54, 'metric')).toBe('54 sets');
    expect(metricTotal('calories', 1420, 'metric')).toBe('≈ 1,420 kcal');
  });

  it('reads the chart out in the chosen view’s own words', () => {
    const monday = new Date(2026, 8, 14);
    const tuesday = new Date(2026, 8, 15);
    const wednesday = new Date(2026, 8, 16);
    expect(
      metricChartSummary(
        [
          { start: monday, value: 2 },
          { start: tuesday, value: 0 },
          { start: wednesday, value: 1 },
        ],
        'workouts',
        'week',
        'metric',
      ),
    ).toBe(
      'Workouts by day, this week: Monday 2 workouts, Wednesday 1 workout. 3 workouts in total.',
    );
    expect(metricChartSummary([{ start: monday, value: 0 }], 'sets', 'month', 'metric')).toBe(
      'Sets by day, this month. Nothing logged.',
    );
  });
});

describe('stepping the chart back', () => {
  const now = new Date(2026, 8, 16, 15);
  const week = (start: Date) => {
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { start, end };
  };

  it('reads how far back from the URL, never past the first workout or into the future', () => {
    expect(backFrom(null, 5)).toBe(0);
    expect(backFrom('2', 5)).toBe(2);
    expect(backFrom('9', 5)).toBe(5);
    expect(backFrom('-1', 5)).toBe(0);
    expect(backFrom('1.5', 5)).toBe(0);
    expect(backFrom('two', 5)).toBe(0);
  });

  it('names a week as people do: this, last, then its dates', () => {
    expect(chartPeriodLabel('week', 0, week(new Date(2026, 8, 14)), now)).toBe('This week');
    expect(chartPeriodLabel('week', 1, week(new Date(2026, 8, 7)), now)).toBe('Last week');
    expect(chartPeriodLabel('week', 2, week(new Date(2026, 7, 31)), now)).toBe('31 Aug – 6 Sep');
    expect(chartPeriodLabel('week', 37, week(new Date(2025, 11, 29)), now)).toBe(
      '29 Dec 2025 – 4 Jan 2026',
    );
  });

  it('names a month by its name, with the year once it is another one', () => {
    const august = { start: new Date(2026, 7, 1), end: new Date(2026, 8, 1) };
    const december = { start: new Date(2025, 11, 1), end: new Date(2026, 0, 1) };
    expect(chartPeriodLabel('month', 0, august, now)).toBe('This month');
    expect(chartPeriodLabel('month', 1, august, now)).toBe('August');
    expect(chartPeriodLabel('month', 9, december, now)).toBe('December 2025');
    expect(chartPeriodPhrase('month', 1, august, now)).toBe('in August');
    expect(chartPeriodPhrase('week', 1, week(new Date(2026, 8, 7)), now)).toBe('last week');
    expect(chartPeriodPhrase('week', 0, week(new Date(2026, 8, 14)), now)).toBe('this week');
  });

  it('says which week the chart is of when read aloud', () => {
    expect(
      metricChartSummary(
        [{ start: new Date(2026, 8, 7), value: 1 }],
        'workouts',
        'week',
        'metric',
        'last week',
      ),
    ).toBe('Workouts by day, last week: Monday 1 workout. 1 workout in total.');
  });
});
