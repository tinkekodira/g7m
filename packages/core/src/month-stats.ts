/**
 * This month so far, against last month to the same day: the numbers Home
 * opens with (ADR-0120).
 *
 * ## Against the same day, never the whole of last month
 *
 * On the 13th, this month has had thirteen days and last month had thirty.
 * "4 workouts, down from 11" is arithmetically right and a lie about the
 * training, and it would be said to everybody for the first three weeks of
 * every month. `comparePeriods` dodges that by refusing to state a shortfall.
 * Here there is room for a better answer: compare the 1st to the 13th with the
 * 1st to the 13th. Then a smaller number really is behind, and an arrow can
 * say so.
 *
 * ## Six regions, not fourteen groups
 *
 * The catalogue has fourteen muscle groups, which is right for the generator
 * and far too many for a ring on a phone: past six or seven slices the colours
 * stop being tellable apart. The regions are the six somebody would name when
 * asked what they trained: legs, arms, shoulders, back, chest, core.
 *
 * `BODY_REGIONS` is also the order round the ring, and that order is the
 * colour order: warm and cool alternate, so no two neighbours are confused by
 * a colour-blind reader. The palette was validated in that order, so do not
 * re-sort it.
 */
import { countsAsSet, countsTowardVolume, setVolumeKg } from './load.js';
import { startOfMonth, type SessionTimes, type Span } from './periods.js';
import { trainingMinutes, type HistoricalSet } from './progress.js';

export const BODY_REGIONS = ['legs', 'arms', 'shoulders', 'back', 'chest', 'core'] as const;
export type BodyRegion = (typeof BODY_REGIONS)[number];

export const REGION_LABELS: Record<BodyRegion, string> = {
  legs: 'Legs',
  arms: 'Arms',
  shoulders: 'Shoulders',
  back: 'Back',
  chest: 'Chest',
  core: 'Core',
};

/**
 * Which region each muscle group belongs to.
 *
 * Traps and neck go with the back: shrugs and neck work are pulled with the
 * upper back in every program that names them, and neither is common enough
 * to earn a slice of its own.
 */
const REGION_OF_GROUP: Readonly<Record<string, BodyRegion>> = {
  chest: 'chest',
  back: 'back',
  traps: 'back',
  neck: 'back',
  shoulders: 'shoulders',
  biceps: 'arms',
  triceps: 'arms',
  forearms: 'arms',
  core: 'core',
  quads: 'legs',
  hamstrings: 'legs',
  glutes: 'legs',
  calves: 'legs',
  adductors: 'legs',
};

/** The region a muscle group rolls up into, or null for a slug nobody mapped. */
export function regionOf(groupSlug: string): BodyRegion | null {
  return REGION_OF_GROUP[groupSlug] ?? null;
}

/** A figure this month so far, and last month up to the same day. */
export interface MonthFigure {
  readonly current: number;
  readonly previous: number;
}

export interface RegionShare {
  readonly region: BodyRegion;
  /** Sets, fractional where one exercise trains two regions. */
  readonly sets: number;
  /** Of every set this month, 0 to 1. */
  readonly share: number;
}

export interface MonthStats {
  readonly month: Span;
  readonly previousMonth: Span;
  /** Today's day of the month, from 1. */
  readonly day: number;
  readonly daysInMonth: number;
  readonly daysInPreviousMonth: number;
  /** Workouts done by the end of each day, from the 1st to today. */
  readonly cumulative: readonly number[];
  /** The same for every day of last month. */
  readonly previousCumulative: readonly number[];
  /** All of last month, for "last month you did 9". */
  readonly previousTotal: number;
  readonly workouts: MonthFigure;
  /** Training minutes, first ticked set to last. See `trainingMinutes`. */
  readonly minutes: MonthFigure;
  /** Weight times reps over working sets, drops included. */
  readonly volumeKg: MonthFigure;
  /** Workouts per week, to one decimal. */
  readonly perWeek: MonthFigure;
  readonly sets: MonthFigure;
  /** This month's sets by region, in `BODY_REGIONS` order, regions with none left out. */
  readonly regions: readonly RegionShare[];
  /** The sets `regions` adds up to. */
  readonly regionSets: number;
  /**
   * Whole days since each region last had a set, or null when it had none in
   * the history read (which reaches back to the start of last month).
   */
  readonly daysSince: Readonly<Record<BodyRegion, number | null>>;
  /**
   * Whole days since the earliest set in the history read, or null for none.
   *
   * What a null in `daysSince` means depends on it: somebody who started
   * logging on Monday has not "missed legs for a month", they have not got
   * to legs yet.
   */
  readonly historyDays: number | null;
}

export interface MonthStatsInput {
  /** Finished workouts. Anything outside the two months is ignored. */
  readonly sessions: readonly SessionTimes[];
  /** Completed lifting sets, from the start of last month at least. */
  readonly sets: readonly HistoricalSet[];
  /** Each exercise's primary muscle groups. See `HistoryRepository.groupsByExercise`. */
  readonly groupsByExercise: ReadonlyMap<string, readonly string[]>;
  readonly now: Date;
}

/** Where to start reading history from so that `monthStats` has all it needs. */
export function monthStatsSince(now: Date): Date {
  const start = startOfMonth(now);
  return new Date(start.getFullYear(), start.getMonth() - 1, 1);
}

const DAY_MS = 86_400_000;

export function monthStats({ sessions, sets, groupsByExercise, now }: MonthStatsInput): MonthStats {
  const start = startOfMonth(now);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
  const previousStart = new Date(start.getFullYear(), start.getMonth() - 1, 1);
  const day = now.getDate();
  const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
  const daysInPreviousMonth = new Date(start.getFullYear(), start.getMonth(), 0).getDate();

  // The end of the same day last month. The 31st against a 30-day month is
  // against all of it, never a day spilling into this month.
  const sameDay = new Date(previousStart.getFullYear(), previousStart.getMonth(), day + 1);
  const previousCutoff = sameDay < start ? sameDay : start;

  const inSpan = (at: Date, from: Date, to: Date): boolean => {
    const time = at.getTime();
    return !Number.isNaN(time) && time >= from.getTime() && time < to.getTime();
  };
  const isCurrent = (at: Date): boolean => inSpan(at, start, end);
  const isPrevious = (at: Date): boolean => inSpan(at, previousStart, previousCutoff);

  // --- Workouts and time -----------------------------------------------------
  const currentDays = new Array<number>(daysInMonth).fill(0);
  const previousDays = new Array<number>(daysInPreviousMonth).fill(0);
  const workouts = { current: 0, previous: 0 };
  const minutes = { current: 0, previous: 0 };

  for (const session of sessions) {
    const at = session.startedAt;
    const spent = trainingMinutes([session.firstSetAt, session.lastSetAt]) ?? 0;
    if (isCurrent(at)) {
      currentDays[at.getDate() - 1] = (currentDays[at.getDate() - 1] ?? 0) + 1;
      workouts.current += 1;
      minutes.current += spent;
    } else if (inSpan(at, previousStart, start)) {
      previousDays[at.getDate() - 1] = (previousDays[at.getDate() - 1] ?? 0) + 1;
      if (isPrevious(at)) {
        workouts.previous += 1;
        minutes.previous += spent;
      }
    }
  }

  // --- Sets, volume and regions -------------------------------------------
  const volume = { current: 0, previous: 0 };
  const setCount = { current: 0, previous: 0 };
  const byRegion = new Map<BodyRegion, number>();
  const lastTrained = new Map<BodyRegion, number>();
  let earliest = Infinity;

  for (const set of sets) {
    const at = set.performedAt;
    const current = isCurrent(at);
    const previous = isPrevious(at);

    if (countsTowardVolume(set)) {
      const kg = setVolumeKg(set, set.bodyweightKg) ?? 0;
      if (current) volume.current += kg;
      if (previous) volume.previous += kg;
    }
    if (!countsAsSet(set)) continue;
    if (at.getTime() < earliest) earliest = at.getTime();
    if (current) setCount.current += 1;
    if (previous) setCount.previous += 1;

    const regions = regionsOf(groupsByExercise.get(set.exerciseId) ?? []);
    for (const region of regions) {
      const time = at.getTime();
      if (time <= now.getTime() && time > (lastTrained.get(region) ?? -Infinity)) {
        lastTrained.set(region, time);
      }
      // A squat is one set, not one for quads and another for glutes: an
      // exercise that trains two regions gives each half of it, so the ring
      // adds up to the sets that were actually done.
      if (current) byRegion.set(region, (byRegion.get(region) ?? 0) + 1 / regions.length);
    }
  }

  const regionSets = [...byRegion.values()].reduce((sum, value) => sum + value, 0);
  const regions = BODY_REGIONS.filter((region) => (byRegion.get(region) ?? 0) > 0).map((region) => {
    const count = byRegion.get(region) ?? 0;
    return { region, sets: round1(count), share: regionSets > 0 ? count / regionSets : 0 };
  });

  const today = startOfDayTime(now);
  const daysSince = Object.fromEntries(
    BODY_REGIONS.map((region) => {
      const last = lastTrained.get(region);
      return [
        region,
        last === undefined ? null : Math.round((today - startOfDayTime(new Date(last))) / DAY_MS),
      ];
    }),
  ) as Record<BodyRegion, number | null>;

  // A week at least: two workouts on the 2nd are not seven a week.
  const weeks = Math.max(day, 7) / 7;

  return {
    month: { start, end },
    previousMonth: { start: previousStart, end: start },
    day,
    daysInMonth,
    daysInPreviousMonth,
    cumulative: runningTotal(currentDays).slice(0, day),
    previousCumulative: runningTotal(previousDays),
    previousTotal: previousDays.reduce((sum, value) => sum + value, 0),
    workouts,
    minutes: { current: Math.round(minutes.current), previous: Math.round(minutes.previous) },
    volumeKg: { current: Math.round(volume.current), previous: Math.round(volume.previous) },
    perWeek: {
      current: round1(workouts.current / weeks),
      previous: round1(workouts.previous / weeks),
    },
    sets: setCount,
    regions,
    regionSets: Math.round(regionSets),
    daysSince,
    historyDays: Number.isFinite(earliest)
      ? Math.round((today - startOfDayTime(new Date(earliest))) / DAY_MS)
      : null,
  };
}

function regionsOf(groups: readonly string[]): BodyRegion[] {
  const regions: BodyRegion[] = [];
  for (const group of groups) {
    const region = regionOf(group);
    if (region !== null && !regions.includes(region)) regions.push(region);
  }
  return regions;
}

function runningTotal(values: readonly number[]): number[] {
  let sum = 0;
  return values.map((value) => (sum += value));
}

function startOfDayTime(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

// --- What each card says underneath -----------------------------------------
//
// Kinds with their numbers, not sentences: the words are the screen's to
// choose (`home-insights.ts`), and these are what is tested.

export type WorkoutsInsight =
  /** Nothing this month or last. A first month, waiting to start. */
  | { readonly kind: 'start' }
  /** Nothing yet this month, but last month had some. */
  | { readonly kind: 'not_yet'; readonly previousTotal: number }
  /** Training this month and none last month to compare with. */
  | { readonly kind: 'first_month'; readonly workouts: number }
  | { readonly kind: 'ahead'; readonly by: number }
  | { readonly kind: 'level'; readonly workouts: number }
  | { readonly kind: 'behind'; readonly by: number };

export function workoutsInsight(stats: MonthStats): WorkoutsInsight {
  const { current, previous } = stats.workouts;
  if (current === 0) {
    return stats.previousTotal > 0
      ? { kind: 'not_yet', previousTotal: stats.previousTotal }
      : { kind: 'start' };
  }
  if (stats.previousTotal === 0) return { kind: 'first_month', workouts: current };
  if (current > previous) return { kind: 'ahead', by: current - previous };
  if (current === previous) return { kind: 'level', workouts: current };
  return { kind: 'behind', by: previous - current };
}

/** The regions whose absence is worth a word. Arms and core get worked by everything else. */
const MAJOR_REGIONS: readonly BodyRegion[] = ['legs', 'back', 'chest', 'shoulders'];

/** Two weeks without a region before it is called out. */
export const NEGLECTED_AFTER_DAYS = 14;

/**
 * More than this share of the sets in one region is worth a word.
 *
 * Not a half: legs are the biggest region and a squat, a bench and a
 * deadlift — as plain a full-body program as there is — gives them exactly
 * that. Telling that lifter their training is lopsided would be wrong.
 */
const LOPSIDED_SHARE = 0.55;

/** Too few sets to say anything about balance. */
const FEW_SETS = 8;

export type MusclesInsight =
  | { readonly kind: 'none' }
  | { readonly kind: 'early'; readonly sets: number }
  /** `atLeast`: not in the history read at all, so it has been `days` or longer. */
  | {
      readonly kind: 'neglected';
      readonly region: BodyRegion;
      readonly days: number;
      readonly atLeast: boolean;
    }
  | { readonly kind: 'lopsided'; readonly region: BodyRegion; readonly share: number }
  | { readonly kind: 'balanced' }
  | { readonly kind: 'focused'; readonly regions: readonly BodyRegion[] };

export function musclesInsight(stats: MonthStats): MusclesInsight {
  if (stats.regionSets === 0) return { kind: 'none' };

  // The longest-missed major region, first: it is the one thing on this card
  // somebody can act on today.
  let neglected: { region: BodyRegion; days: number; atLeast: boolean } | null = null;
  for (const region of MAJOR_REGIONS) {
    const known = stats.daysSince[region];
    // Never trained in the history read: as long ago as that history goes.
    const days = known ?? stats.historyDays ?? 0;
    if (days < NEGLECTED_AFTER_DAYS) continue;
    if (neglected === null || days > neglected.days) {
      neglected = { region, days, atLeast: known === null };
    }
  }
  // Early in the month there is not much to be balanced yet, but a region
  // untouched for two weeks is still untouched.
  if (neglected !== null) return { kind: 'neglected', ...neglected };

  if (stats.regionSets < FEW_SETS) return { kind: 'early', sets: stats.regionSets };

  const top = [...stats.regions].sort((a, b) => b.share - a.share)[0];
  if (top !== undefined && top.share > LOPSIDED_SHARE) {
    return { kind: 'lopsided', region: top.region, share: top.share };
  }

  const trained = new Set(stats.regions.filter((r) => r.share >= 0.05).map((r) => r.region));
  if (MAJOR_REGIONS.every((region) => trained.has(region))) return { kind: 'balanced' };

  return {
    kind: 'focused',
    regions: [...stats.regions]
      .sort((a, b) => b.share - a.share)
      .slice(0, 2)
      .map((r) => r.region),
  };
}

export type ActivityInsight =
  | { readonly kind: 'quiet' }
  /** Lifting at least a tenth more than at this point last month. */
  | { readonly kind: 'stronger'; readonly percent: number }
  /** At or past last month's pace, and twice a week or more. */
  | { readonly kind: 'consistent'; readonly perWeek: number }
  | { readonly kind: 'catch_up'; readonly by: number }
  | { readonly kind: 'steady' };

export function activityInsight(stats: MonthStats): ActivityInsight {
  const { workouts, volumeKg, perWeek } = stats;
  if (workouts.current === 0) return { kind: 'quiet' };

  const percent = percentChange(volumeKg.current, volumeKg.previous);
  if (percent !== null && percent >= 10 && workouts.current >= workouts.previous) {
    return { kind: 'stronger', percent };
  }
  if (workouts.current >= workouts.previous && perWeek.current >= 2) {
    return { kind: 'consistent', perWeek: perWeek.current };
  }
  if (workouts.current < workouts.previous) {
    return { kind: 'catch_up', by: workouts.previous - workouts.current };
  }
  return { kind: 'steady' };
}

/**
 * The change from `previous` to `current` as a whole percentage, or null when
 * there is nothing to measure against: "up ∞%" is not a number anybody can use.
 */
export function percentChange(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}
