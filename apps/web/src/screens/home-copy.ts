/**
 * What Home's month cards say underneath their numbers.
 *
 * `@g7m/core` decides which thing is worth saying (`workoutsInsight` and the
 * rest); this decides the words. Kept apart for the same reason as
 * `review-copy.ts`: the choice is tested on numbers, the sentences are read
 * here in one place, and neither has to change for the other.
 *
 * The voice is the app's: plain, specific, a number where there is one. No
 * exclamation marks and no cheering. "3 more workouts than at this point last
 * month" is the encouragement — it is true, and it is theirs.
 */
import {
  REGION_LABELS,
  formatMinutes,
  type ActivityInsight,
  type BodyRegion,
  type DurationInsight,
  type MusclesInsight,
  type RecordsInsight,
  type WorkoutsInsight,
} from '@g7m/core';
import type { Line } from './review-copy.js';

/**
 * How an insight reads at a glance.
 *
 *   good     going well, and worth saying so
 *   nudge    something to do about it
 *   neutral  how things stand, or nothing yet
 */
export type InsightTone = 'good' | 'nudge' | 'neutral';

export type InsightSymbol = 'up' | 'trophy' | 'check' | 'target' | 'play' | 'clock';

export interface Insight extends Line {
  readonly tone: InsightTone;
  readonly symbol: InsightSymbol;
}

function plural(count: number, one: string, many = `${one}s`): string {
  return `${String(count)} ${count === 1 ? one : many}`;
}

/** "Legs haven't", "Back hasn't": the region names that end in s are plural. */
function regionHasnt(region: BodyRegion): string {
  const word = REGION_LABELS[region];
  return `${word} ${word.endsWith('s') ? 'haven’t' : 'hasn’t'}`;
}

export function describeWorkouts(insight: WorkoutsInsight): Insight {
  switch (insight.kind) {
    case 'start':
      return {
        heading: 'Your month starts with one workout',
        detail: 'Log a session and this line starts to climb.',
        tone: 'neutral',
        symbol: 'play',
      };
    case 'not_yet':
      return {
        heading: 'Nothing logged yet this month',
        detail: `Last month you did ${plural(insight.previousTotal, 'workout')}. Today is a good day to start.`,
        tone: 'neutral',
        symbol: 'play',
      };
    case 'first_month':
      return {
        heading: 'Your first month is under way',
        detail: `${plural(insight.workouts, 'workout')} so far. Next month has this one to beat.`,
        tone: 'good',
        symbol: 'up',
      };
    case 'ahead':
      return {
        heading: 'You’re on a roll',
        detail: `${plural(insight.by, 'more workout', 'more workouts')} than at this point last month.`,
        tone: 'good',
        symbol: 'up',
      };
    case 'level':
      return {
        heading: 'Level with last month',
        detail: `${plural(insight.workouts, 'workout')}, the same as by this day last month.`,
        tone: 'neutral',
        symbol: 'target',
      };
    case 'behind':
      return {
        heading: 'A little behind last month',
        detail: `${plural(insight.by, 'workout')} short of where you were by this day.`,
        tone: 'nudge',
        symbol: 'target',
      };
  }
}

export function describeMuscles(insight: MusclesInsight): Insight {
  switch (insight.kind) {
    case 'none':
      return {
        heading: 'No sets logged this month yet',
        detail: 'Every set you log shows up here, by muscle group.',
        tone: 'neutral',
        symbol: 'play',
      };
    case 'early':
      return {
        heading: 'The picture is filling in',
        detail: `${plural(insight.sets, 'set')} so far. A few more workouts and the balance shows.`,
        tone: 'neutral',
        symbol: 'clock',
      };
    case 'neglected':
      return {
        heading: insight.atLeast
          ? `${REGION_LABELS[insight.region]}: nothing in ${String(insight.days)} days`
          : `${regionHasnt(insight.region)} been trained in ${String(insight.days)} days`,
        detail: 'Worth a place in your next workout.',
        tone: 'nudge',
        symbol: 'target',
      };
    case 'lopsided':
      return {
        heading: `${REGION_LABELS[insight.region]} took ${String(Math.round(insight.share * 100))}% of your sets`,
        detail: 'Spreading the work keeps the rest from falling behind.',
        tone: 'nudge',
        symbol: 'target',
      };
    case 'balanced':
      return {
        heading: 'Well balanced',
        detail: 'You’re training every major muscle group this month.',
        tone: 'good',
        symbol: 'check',
      };
    case 'focused': {
      const [first, second] = insight.regions;
      const names = [first, second]
        .filter((region): region is BodyRegion => region !== undefined)
        .map((region) => REGION_LABELS[region].toLowerCase());
      return {
        heading: `Mostly ${names.join(' and ')} so far`,
        detail: 'The rest get their turn as the month goes on.',
        tone: 'neutral',
        symbol: 'target',
      };
    }
  }
}

export function describeActivity(insight: ActivityInsight): Insight {
  switch (insight.kind) {
    case 'quiet':
      return {
        heading: 'Your month is waiting',
        detail: 'Time, volume and pace show up after your first workout.',
        tone: 'neutral',
        symbol: 'play',
      };
    case 'stronger':
      return {
        heading: 'You’re lifting more',
        detail: `${String(insight.percent)}% more weight moved than at this point last month.`,
        tone: 'good',
        symbol: 'trophy',
      };
    case 'consistent':
      return {
        heading: 'Great consistency',
        detail: `About ${formatPerWeek(insight.perWeek)} a week. You’re showing up, and it shows.`,
        tone: 'good',
        symbol: 'check',
      };
    case 'catch_up':
      return {
        heading:
          insight.by === 1
            ? 'One workout closes the gap'
            : `${String(insight.by)} workouts to catch up`,
        detail: 'Behind last month’s pace by this day, with time to make it up.',
        tone: 'nudge',
        symbol: 'target',
      };
    case 'steady':
      return {
        heading: 'A steady month',
        detail: 'Keep it going and the trend will show here.',
        tone: 'neutral',
        symbol: 'clock',
      };
  }
}

/** 2, 2.5, 3: a whole number without its ".0". */
export function formatPerWeek(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

/** Within this many minutes of last month's average reads as the same. */
const SAME_LENGTH = 5;

export function describeDuration(insight: DurationInsight): Insight {
  if (insight.kind === 'none') {
    return {
      heading: 'No timed workouts yet this month',
      detail: 'Time runs from your first ticked set to your last.',
      tone: 'neutral',
      symbol: 'clock',
    };
  }
  const heading = `Average session ${formatMinutes(insight.minutes)}`;
  if (insight.previous === null) {
    return {
      heading,
      detail: 'From your first ticked set to your last, each workout this month.',
      tone: 'neutral',
      symbol: 'clock',
    };
  }
  const difference = insight.minutes - insight.previous;
  return {
    heading,
    detail:
      Math.abs(difference) < SAME_LENGTH
        ? 'About the same as last month by this day.'
        : `${formatMinutes(Math.abs(difference))} ${difference > 0 ? 'longer' : 'shorter'} than last month’s average.`,
    tone: 'neutral',
    symbol: 'clock',
  };
}

export function describeRecords(
  insight: RecordsInsight,
  names: ReadonlyMap<string, string>,
  weight: (kg: number) => string,
): Insight {
  const name = (exerciseId: string): string => names.get(exerciseId) ?? 'One lift';
  switch (insight.kind) {
    case 'none':
      return {
        heading: 'No lifts logged this month yet',
        detail: 'Your heaviest sets this month show up here, against your best.',
        tone: 'neutral',
        symbol: 'play',
      };
    case 'new':
      return {
        heading:
          insight.count === 1
            ? 'A new personal best'
            : `${String(insight.count)} new personal bests`,
        detail: `${name(insight.exerciseId)} is heavier than ever. You’re getting stronger.`,
        tone: 'good',
        symbol: 'up',
      };
    case 'first':
      return {
        heading: 'Your first bests are set',
        detail: `${String(insight.count)} ${insight.count === 1 ? 'lift' : 'lifts'} to beat from here. Go heavier and they show up as new records.`,
        tone: 'good',
        symbol: 'check',
      };
    case 'close':
      return {
        heading: `${weight(insight.shortKg)} off your best`,
        detail: `${name(insight.exerciseId)} is nearly there. One good day puts it on the board.`,
        tone: 'nudge',
        symbol: 'target',
      };
    case 'holding':
      return {
        heading: 'Your bests still stand',
        detail: 'A heavier set on any lift this month shows up here.',
        tone: 'neutral',
        symbol: 'target',
      };
  }
}
