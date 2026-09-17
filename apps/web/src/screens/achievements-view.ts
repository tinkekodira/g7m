/**
 * The words around achievements: progress in the lifter's units, when one was
 * earned, when a date badge next comes round, and which new ones get a banner.
 *
 * Kept apart from the screen so it can be tested without a browser — the
 * rules for what counts live in `@g7m/core`'s `achievements`, and this is
 * only how they are said. ADR-0072.
 */
import {
  daysBetween,
  kgToLb,
  METRES_PER_MILE,
  type Achievement,
  type AchievementCategory,
  type AchievementProgress,
  type UnitSystem,
} from '@g7m/core';
import { MONTHS_SHORT, weekdayName } from '../lib/date-words.js';

export const CATEGORY_TITLES: Readonly<
  Record<AchievementCategory, { readonly title: string; readonly detail: string }>
> = {
  milestones: { title: 'Milestones', detail: 'Workouts, records and tonnes' },
  strength: { title: 'Strength clubs', detail: 'Plates on the bar, and your own bodyweight' },
  consistency: { title: 'Consistency', detail: 'Showing up, week after week' },
  cardio: { title: 'Cardio & variety', detail: 'Machines, distance and new ground' },
  secret: { title: 'Secret', detail: 'There is one. It finds you.' },
};

const FEET_PER_METRE = 1 / 0.3048;

function whole(value: number): string {
  return Math.round(value).toLocaleString('en-GB');
}

/** One decimal while it matters, none once the number is big. */
function tenths(value: number): string {
  return value.toLocaleString('en-GB', { maximumFractionDigits: value < 100 ? 1 : 0 });
}

/**
 * How far along, as the bar's caption: `97.5 / 100 kg`, `7 / 10 workouts`.
 *
 * The target is always a round number in the lifter's units, because the
 * badge was built that way; the progress towards it is rounded to the
 * precision anybody would say it in.
 */
export function progressWords(progress: AchievementProgress, unitSystem: UnitSystem): string {
  const { current, target } = progress;
  const imperial = unitSystem === 'imperial';
  const count = (singular: string, plural: string) =>
    `${whole(current)} / ${whole(target)} ${target === 1 ? singular : plural}`;

  switch (progress.unit) {
    case 'workouts':
      return count('workout', 'workouts');
    case 'records':
      return count('record', 'records');
    case 'reps':
      return count('rep', 'reps');
    case 'weeks':
      return count('week', 'weeks');
    case 'days':
      return count('day', 'days');
    case 'machines':
      return count('machine', 'machines');
    case 'exercises':
      return count('exercise', 'exercises');
    case 'groups':
      return count('muscle group', 'muscle groups');
    case 'kcal':
      return `${whole(current)} / ${whole(target)} kcal`;
    case 'weight': {
      if (imperial) return `${whole(kgToLb(current))} / ${whole(kgToLb(target))} lb`;
      return `${tenths(Math.round(current * 10) / 10)} / ${tenths(target)} kg`;
    }
    case 'volume': {
      // Tonnes, or US tons of 2,000 lb: the unit the badge is written in.
      const tons = (kg: number) => (imperial ? kgToLb(kg) / 2000 : kg / 1000);
      return `${tenths(tons(current))} / ${whole(tons(target))} ${imperial ? 'tons' : 't'}`;
    }
    case 'distance': {
      // A rower speaks metres, whatever else the lifter uses.
      if (target <= 2000) return `${whole(current)} / ${whole(target)} m`;
      if (imperial) {
        return `${tenths(current / METRES_PER_MILE)} / ${whole(target / METRES_PER_MILE)} mi`;
      }
      return `${tenths(current / 1000)} / ${tenths(target / 1000)} km`;
    }
    case 'climb':
      return imperial
        ? `${whole(current * FEET_PER_METRE)} / ${whole(target * FEET_PER_METRE)} ft`
        : `${whole(current)} / ${whole(target)} m`;
  }
}

/** How full the bar is, 0 to 1. */
export function progressFraction(progress: AchievementProgress): number {
  if (!(progress.target > 0)) return 0;
  return Math.min(1, Math.max(0, progress.current / progress.target));
}

/** `3 Sep`, or `3 Sep 2025` when it was another year. */
export function shortDate(date: Date, now: Date): string {
  const base = `${String(date.getDate())} ${MONTHS_SHORT[date.getMonth()] ?? ''}`;
  return date.getFullYear() === now.getFullYear() ? base : `${base} ${String(date.getFullYear())}`;
}

export function earnedWords(date: Date, now: Date): string {
  return `Earned ${shortDate(date, now)}`;
}

/** `today`, `tomorrow`, `Saturday`, `25 Dec`, `29 Feb 2028`: short enough for one line. */
export function nextChanceWords(date: Date, now: Date): string {
  const days = daysBetween(now, date);
  if (days <= 0) return 'Next chance: today';
  if (days === 1) return 'Next chance: tomorrow';
  if (days < 7) return `Next chance: ${weekdayName(date)}`;
  return `Next chance: ${shortDate(date, now)}`;
}

/**
 * A category's badges in the order they are worth looking at: earned first,
 * then whatever is closest to being earned, then the rest.
 *
 * The catalogue's own order is a ladder — one plate, two plates, three — which
 * reads well on a shelf and badly on a screen where the earned ones are
 * scattered through it. Sorting by how close each is puts the next one to go
 * for near the top, and the five-hundredth workout at the bottom where it
 * belongs.
 *
 * Badges with nothing to measure (a date, a first cardio session) sort after
 * the ones with a bar, and ties keep the catalogue's order, so a ladder still
 * reads bottom rung up.
 */
export function inDisplayOrder(list: readonly Achievement[]): Achievement[] {
  // One number to sort on: earned above everything, then how full the bar is,
  // then the unmeasurable ones. Array.prototype.sort is stable, so equal
  // scores keep the catalogue's order.
  const score = (each: Achievement): number => {
    if (each.earnedAt !== null) return 2;
    return each.progress === null ? 0 : progressFraction(each.progress);
  };
  return [...list].sort((a, b) => score(b) - score(a));
}

/** `14 of 52 earned`. */
export function earnedCount(list: readonly Achievement[]): { earned: number; total: number } {
  return { earned: list.filter((each) => each.earnedAt !== null).length, total: list.length };
}

/** The most recently earned, for the Profile button. */
export function latestEarned(list: readonly Achievement[]): Achievement | null {
  let latest: Achievement | null = null;
  for (const each of list) {
    if (each.earnedAt === null) continue;
    if (latest?.earnedAt == null || each.earnedAt > latest.earnedAt) latest = each;
  }
  return latest;
}

/** At most this many banners in a row; the rest are folded into the summary. */
export const MAX_LOUD = 3;

/** An achievement is news for this long after the workout that earned it. */
const FRESH_MS = 24 * 60 * 60 * 1000;

export interface Celebrations {
  /** A banner each, with the confetti: earned just now. */
  readonly loud: readonly Achievement[];
  /** One quiet banner for all of them: earned by training done before. */
  readonly quiet: readonly Achievement[];
}

/**
 * Which newly earned achievements get a banner of their own, and which are
 * gathered into one quiet line.
 *
 * Loud when it just happened: earned in the last day, or earned while the app
 * was open (not among `earnedWhenOpened`). Quiet when it is news only to the
 * app — past workouts on the first launch after achievements arrived, or a
 * badge added in a later version for something done months ago. A year of
 * training does not deserve fifty banners in a row, and the confetti means
 * less every time it is spent on something that happened in March.
 *
 * `earnedWhenOpened` is null on the first look, before the app knows.
 */
export function celebrationsFor(input: {
  readonly list: readonly Achievement[];
  readonly seen: ReadonlySet<string>;
  readonly earnedWhenOpened: ReadonlySet<string> | null;
  readonly now: Date;
}): Celebrations {
  const fresh: Achievement[] = [];
  const old: Achievement[] = [];
  for (const each of input.list) {
    if (each.earnedAt === null || input.seen.has(each.key)) continue;
    const justNow =
      (input.earnedWhenOpened !== null && !input.earnedWhenOpened.has(each.key)) ||
      input.now.getTime() - each.earnedAt.getTime() <= FRESH_MS;
    (justNow ? fresh : old).push(each);
  }
  return {
    loud: fresh.slice(0, MAX_LOUD),
    quiet: [...fresh.slice(MAX_LOUD), ...old],
  };
}

/** The quiet banner's two lines. */
export function quietSummary(
  quiet: readonly Achievement[],
  now: Date,
): { title: string; detail: string } {
  const [only] = quiet;
  if (quiet.length === 1 && only?.earnedAt != null) {
    return { title: only.name, detail: `${earnedWords(only.earnedAt, now)} · tap to see it` };
  }
  return {
    title: `${String(quiet.length)} achievements earned`,
    detail: 'From workouts you logged before · tap to see them',
  };
}
