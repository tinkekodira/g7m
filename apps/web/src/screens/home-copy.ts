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
import { formatNumber, t } from '@g7m/i18n';
import {
  type ActivityInsight,
  type BodyRegion,
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

export function describeWorkouts(insight: WorkoutsInsight): Insight {
  const words = t().home.insights.workouts;
  switch (insight.kind) {
    case 'start':
      return { ...words.start, tone: 'neutral', symbol: 'play' };
    case 'not_yet':
      return {
        heading: words.notYet.heading,
        detail: words.notYet.detail(insight.previousTotal),
        tone: 'neutral',
        symbol: 'play',
      };
    case 'first_month':
      return {
        heading: words.firstMonth.heading,
        detail: words.firstMonth.detail(insight.workouts),
        tone: 'good',
        symbol: 'up',
      };
    case 'ahead':
      return {
        heading: words.ahead.heading,
        detail: words.ahead.detail(insight.by),
        tone: 'good',
        symbol: 'up',
      };
    case 'level':
      return {
        heading: words.level.heading,
        detail: words.level.detail(insight.workouts),
        tone: 'neutral',
        symbol: 'target',
      };
    case 'behind':
      return {
        heading: words.behind.heading,
        detail: words.behind.detail(insight.by),
        tone: 'nudge',
        symbol: 'target',
      };
  }
}

export function describeMuscles(insight: MusclesInsight): Insight {
  const words = t().home.insights.muscles;
  switch (insight.kind) {
    case 'none':
      return { ...words.none, tone: 'neutral', symbol: 'play' };
    case 'early':
      return {
        heading: words.early.heading,
        detail: words.early.detail(insight.sets),
        tone: 'neutral',
        symbol: 'clock',
      };
    case 'neglected':
      return {
        heading: insight.atLeast
          ? words.neglected.atLeast(insight.region, insight.days)
          : words.neglected.exactly(insight.region, insight.days),
        detail: words.neglected.detail,
        tone: 'nudge',
        symbol: 'target',
      };
    case 'lopsided':
      return {
        heading: words.lopsided.heading(insight.region, Math.round(insight.share * 100)),
        detail: words.lopsided.detail,
        tone: 'nudge',
        symbol: 'target',
      };
    case 'balanced':
      return { ...words.balanced, tone: 'good', symbol: 'check' };
    case 'focused': {
      const [first, second] = insight.regions;
      const regions = [first, second].filter(
        (region): region is BodyRegion => region !== undefined,
      );
      return {
        heading: words.focused.heading(regions),
        detail: words.focused.detail,
        tone: 'neutral',
        symbol: 'target',
      };
    }
  }
}

export function describeActivity(insight: ActivityInsight): Insight {
  const words = t().home.insights.activity;
  switch (insight.kind) {
    case 'quiet':
      return { ...words.quiet, tone: 'neutral', symbol: 'play' };
    case 'stronger':
      return {
        heading: words.stronger.heading,
        detail: words.stronger.detail(insight.percent),
        tone: 'good',
        symbol: 'trophy',
      };
    case 'consistent':
      return {
        heading: words.consistent.heading,
        detail: words.consistent.detail(formatPerWeek(insight.perWeek)),
        tone: 'good',
        symbol: 'check',
      };
    case 'catch_up':
      return {
        heading: words.catchUp.heading(insight.by),
        detail: words.catchUp.detail,
        tone: 'nudge',
        symbol: 'target',
      };
    case 'steady':
      return { ...words.steady, tone: 'neutral', symbol: 'clock' };
  }
}

/** 2, 2.5, 3: a whole number without its ".0", with the language's decimal mark. */
export function formatPerWeek(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : formatNumber(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function describeRecords(
  insight: RecordsInsight,
  names: ReadonlyMap<string, string>,
  weight: (kg: number) => string,
): Insight {
  const words = t().home.insights.records;
  const name = (exerciseId: string): string => names.get(exerciseId) ?? words.oneLift;
  switch (insight.kind) {
    case 'none':
      return { ...words.none, tone: 'neutral', symbol: 'play' };
    case 'new':
      return {
        heading: words.new.heading(insight.count),
        detail: words.new.detail(name(insight.exerciseId)),
        tone: 'good',
        symbol: 'up',
      };
    case 'first':
      return {
        heading: words.first.heading,
        detail: words.first.detail(insight.count),
        tone: 'good',
        symbol: 'check',
      };
    case 'close':
      return {
        heading: words.close.heading(weight(insight.shortKg)),
        detail: words.close.detail(name(insight.exerciseId)),
        tone: 'nudge',
        symbol: 'target',
      };
    case 'holding':
      return { ...words.holding, tone: 'neutral', symbol: 'target' };
  }
}
