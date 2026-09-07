/**
 * What the lifter is, and what the numbers say about where they are going.
 *
 * ADR-0032 put an append-only weight history behind `profiles.bodyweight_kg`
 * so that "is this working?" could be asked at all. This module is the reading
 * half of that: age, how overdue a weigh-in is, and the one number the goal
 * will eventually be judged against — kilograms per week.
 *
 * ## What is deliberately not here
 *
 * BMI. It is two lines of arithmetic and the obvious thing to put on a screen
 * that already holds a height and a weight, and it would be actively harmful
 * here: it counts muscle as excess mass, so it misreads exactly the person
 * this app is for. Somebody who has spent six months adding muscle would be
 * told they had moved from "normal" to "overweight" by the same app that
 * coached them into it. The trend below answers the question BMI gets reached
 * for — am I going the right way — without the false verdict.
 *
 * Calorie and macro estimates are also absent, and that is scope rather than
 * scepticism: g7m writes training plans, not diets.
 */
import { daysBetween } from './week.js';

/**
 * How hard the week is outside the gym.
 *
 * Lives here rather than beside the table because the plan generator will need
 * it: "lose fat" implies a different week for a labourer than for somebody at
 * a desk, and that judgement is domain logic. `@g7m/db` re-exports these so
 * the repository can go on validating what it writes.
 */
export const ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'active', 'very_active'] as const;
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary',
  light: 'Lightly active',
  moderate: 'Moderately active',
  active: 'Active',
  very_active: 'Very active',
};

/**
 * What each level means, in the terms somebody would use about their own week.
 *
 * Phrased as jobs and habits rather than as "exercises 1-3 times a week",
 * because the question is about the other twenty-three hours. A gym-goer with
 * a desk job is sedentary here, and that is not a criticism — their training
 * is already counted, by the session log.
 */
export const ACTIVITY_DESCRIPTIONS: Record<ActivityLevel, string> = {
  sedentary: 'Desk job, driving, little walking',
  light: 'On your feet for part of the day',
  moderate: 'Walking or standing most of the day',
  active: 'Physical job, or a lot of walking',
  very_active: 'Heavy manual work, or a second sport',
};

/**
 * Age from a birth year alone, which is all `profiles.birth_year` holds.
 *
 * Accurate to within a year, deliberately: no training plan turns on whether
 * somebody is 34 or 35, and a full birth date is more personal data than this
 * app has a reason to hold. Returns null rather than a plausible-looking
 * number when the year is missing or impossible.
 */
export function ageOn(birthYear: number | null, on: Date): number | null {
  if (birthYear === null || !Number.isInteger(birthYear)) return null;
  const age = on.getFullYear() - birthYear;
  return age >= 0 && age <= 120 ? age : null;
}

/** One reading from the scale. Oldest first, wherever a series is passed. */
export interface WeighIn {
  readonly at: Date;
  readonly weightKg: number;
}

/** "At least once a week" (ADR-0032), counted in elapsed days. */
export const WEIGH_IN_DUE_DAYS = 7;
/** Past this it is worth saying more plainly, but still only once. */
export const WEIGH_IN_OVERDUE_DAYS = 14;

export type WeighInState = 'never' | 'fresh' | 'due' | 'overdue';

export interface WeighInStatus {
  readonly state: WeighInState;
  /** Days since the last weigh-in; null when there has never been one. */
  readonly days: number | null;
}

/**
 * Whether to ask for a weight.
 *
 * Elapsed days rather than calendar weeks. The calendar version suggests
 * itself first and is wrong: it fires on Monday morning at somebody who stood
 * on the scale on Sunday night, asking them to do it twice in fourteen hours
 * to satisfy a boundary they cannot see.
 *
 * A future timestamp reads as fresh. It means a clock is wrong somewhere, and
 * a wrong clock is not a reason to nag.
 */
export function weighInStatus(lastAt: Date | null, now: Date): WeighInStatus {
  if (lastAt === null) return { state: 'never', days: null };

  const days = daysBetween(lastAt, now);
  if (days < 0) return { state: 'fresh', days: 0 };
  if (days >= WEIGH_IN_OVERDUE_DAYS) return { state: 'overdue', days };
  if (days >= WEIGH_IN_DUE_DAYS) return { state: 'due', days };
  return { state: 'fresh', days };
}

/**
 * The shortest span over which a weekly rate means anything.
 *
 * Bodyweight moves a kilogram or two on water, salt, and what time you last
 * ate. Across ten days that noise is most of the signal, and a rate
 * extrapolated from it will confidently report gaining four kilos a month.
 * Two weeks is also the point at which the two windows below stop overlapping.
 */
export const MIN_TREND_DAYS = 14;

/** How much of each end of the series is averaged together. */
const TREND_WINDOW_DAYS = 7;

export interface WeightTrend {
  /** The most recent reading, unsmoothed — what the scale actually said. */
  readonly latestKg: number;
  /** Averaged ends, so one heavy Sunday does not become the story. */
  readonly startKg: number;
  readonly endKg: number;
  readonly changeKg: number;
  /** Null until there is enough time between the ends to divide by. */
  readonly perWeekKg: number | null;
  readonly spanDays: number;
  readonly samples: number;
}

/**
 * What the weight has been doing.
 *
 * Both ends are averaged over a week rather than read off as single points.
 * Endpoint-to-endpoint is the tempting version, and it hands the whole answer
 * to two arbitrary mornings: weigh in dehydrated after a long Friday session,
 * then again after a big Sunday lunch, and a perfectly successful cut reports
 * as a gain.
 *
 * `perWeekKg` stays null below `MIN_TREND_DAYS`, where the windows would
 * overlap and the same readings would sit on both sides of the subtraction. A
 * screen showing nothing there is telling the truth; one showing a number is
 * not.
 */
export function weightTrend(series: readonly WeighIn[]): WeightTrend | null {
  const points = [...series]
    .filter((point) => Number.isFinite(point.weightKg) && point.weightKg > 0)
    .sort((a, b) => a.at.getTime() - b.at.getTime());

  const first = points[0];
  const last = points[points.length - 1];
  if (first === undefined || last === undefined) return null;

  const spanDays = daysBetween(first.at, last.at);
  const startKg = meanWithin(points, first.at, 'after');
  const endKg = meanWithin(points, last.at, 'before');
  const changeKg = round2(endKg - startKg);

  return {
    latestKg: last.weightKg,
    startKg: round2(startKg),
    endKg: round2(endKg),
    changeKg,
    perWeekKg: spanDays >= MIN_TREND_DAYS ? round2((changeKg / spanDays) * 7) : null,
    spanDays,
    samples: points.length,
  };
}

/** Mean of the readings within a window on one side of `anchor`. */
function meanWithin(points: readonly WeighIn[], anchor: Date, side: 'before' | 'after'): number {
  const inWindow = points.filter((point) => {
    const distance =
      side === 'after' ? daysBetween(anchor, point.at) : daysBetween(point.at, anchor);
    return distance >= 0 && distance <= TREND_WINDOW_DAYS;
  });
  // `anchor` is itself one of the points, so this is never an empty average.
  const total = inWindow.reduce((sum, point) => sum + point.weightKg, 0);
  return total / inWindow.length;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
