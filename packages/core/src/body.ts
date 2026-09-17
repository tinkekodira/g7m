/**
 * What the lifter is, and what the numbers say about where they are going.
 *
 * ADR-0032 put an append-only weight history behind `profiles.bodyweight_kg`
 * so that "is this working?" could be asked at all. This module is the reading
 * half of that: age, how overdue a weigh-in is, and the one number the goal
 * will eventually be judged against — kilograms per week.
 *
 * ## BMI, and the reason it is safe to show now
 *
 * ADR-0035 kept BMI out, because two lines of arithmetic that count muscle as
 * excess mass misread exactly the person this app is for: somebody six months
 * into a successful lean bulk, told by the app that coached them there that
 * they had moved from "normal" to "overweight".
 *
 * That objection was about the *verdict*, not the ratio. `bodyIndex` below
 * answers it by never quoting the textbook 18.5–25 at anybody. It works out the
 * range that band was meant to approximate for this particular body — older
 * people carry more mass healthily, and a body with more lean tissue on it
 * weighs more at the same amount of fat — and reports the ratio against that.
 * The lean bulk that used to trip the verdict now moves the range with it.
 *
 * ## What is still deliberately not here
 *
 * An estimated body-fat percentage. The obvious formula (Deurenberg) is BMI
 * with age and sex folded in, which makes it *the same measurement wearing a
 * disguise* — it inherits the muscle problem whole and then hides it behind a
 * decimal place that looks like it came from calipers. A trained 90 kg lifter
 * at 180 cm comes out near 30% fat, which is not merely wrong but the exact
 * wrong ADR-0035 was written about. A range that admits it is a range is the
 * honest shape for this.
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
 * Biological sex, for the rates the app quotes back at somebody.
 *
 * Used to state honest expectations — muscle is gained at roughly half the
 * absolute rate in women, so "expect 0.1 to 0.3 kg a week" is good advice for
 * one person and a setup for disappointment for another.
 *
 * Never an input to how much training is prescribed. Women do not need fewer
 * sets, lighter loads or shorter sessions, and `programming.ts` deliberately
 * does not import this. The inputs to a plan are the goal, the training age
 * and the days available; those are already there and this is not one of them.
 */
export const SEXES = ['male', 'female'] as const;
export type Sex = (typeof SEXES)[number];

export const SEX_LABELS: Record<Sex, string> = {
  male: 'Male',
  female: 'Female',
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

/** Nobody younger is being given a training program by this app. */
export const MIN_AGE = 13;
/** Above this it is a typo, not a lifter. */
export const MAX_AGE = 100;

/**
 * A date of birth from a `YYYY-MM-DD` field, or null if it is not one.
 *
 * Held in UTC on purpose. A date of birth is a date, not an instant, and
 * reading one back with local getters shifts it a day west of Greenwich —
 * which is a birthday greeting on the wrong day, and an age that flickers.
 *
 * Rejects the dates a regex alone would accept. `new Date(2001, 1, 31)` is
 * quietly the 3rd of March, so the parts are read back and compared: a day
 * that rolled over is a typo, not a date.
 */
export function parseBirthDate(text: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text.trim());
  if (match === null) return null;

  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));

  const survived =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return survived ? date : null;
}

/** A date of birth as the `YYYY-MM-DD` the column and the input both want. */
export function toDateOnly(date: Date): string {
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${String(date.getUTCFullYear())}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/**
 * Age in whole years, from a date of birth.
 *
 * The subtraction people reach for — this year minus that year — is wrong for
 * everybody who has not had their birthday yet, which is on average half of
 * them. That is a year of difference in the starting weights this feeds.
 */
export function ageFrom(birthDate: Date | null, on: Date): number | null {
  if (birthDate === null || Number.isNaN(birthDate.getTime())) return null;

  let age = on.getUTCFullYear() - birthDate.getUTCFullYear();
  const months = on.getUTCMonth() - birthDate.getUTCMonth();
  if (months < 0 || (months === 0 && on.getUTCDate() < birthDate.getUTCDate())) age -= 1;

  return age >= 0 && age <= 120 ? age : null;
}

/**
 * The textbook healthy band, and the one nothing here ever quotes unmodified.
 *
 * Kept as named constants because every adjustment below is expressed as a
 * movement away from them, and a reader should be able to see what is being
 * moved.
 */
export const BASE_HEALTHY_LOW = 18.5;
export const BASE_HEALTHY_HIGH = 25;

/**
 * How much the healthy band rises per year of age past this one.
 *
 * The published age-adjusted ranges (Andres) step in decades — 20–25 in your
 * late twenties, 24–29 past 65 — which is about a tenth of a point a year.
 * Interpolated rather than stepped, because a band that jumps on a birthday
 * tells somebody their body changed overnight.
 */
const AGE_PIVOT = 30;
const BAND_RISE_PER_YEAR = 0.1;
const MAX_AGE_RISE = 4;

/**
 * Extra kilograms-per-metre-squared allowed for the lean tissue a week of work
 * puts on, per day a week trained.
 *
 * Six days a week reaches 2.1, and a physical job adds up to another point on
 * top. That is the right order of magnitude: a trained man at a given body-fat
 * percentage carries roughly two to three points more BMI than an untrained one,
 * which is the whole reason the textbook band libels lifters.
 */
const LEAN_PER_TRAINING_DAY = 0.35;

/** What the week outside the gym is worth, on the same scale. */
const ACTIVITY_LEAN: Record<ActivityLevel, number> = {
  sedentary: 0,
  light: 0.2,
  moderate: 0.4,
  active: 0.7,
  very_active: 1,
};

/**
 * The most the band will ever stretch for lean mass, and the share of it a
 * female body is credited with.
 *
 * The 0.6 is the same fact `SEXES` above is documented with — muscle is carried
 * and gained at roughly half to two-thirds the absolute amount — applied to the
 * allowance rather than to the ratio. It widens the range somebody is judged
 * against; it never changes their number, and it never narrows the range below
 * the textbook one.
 */
const MAX_LEAN_ALLOWANCE = 3;
const FEMALE_LEAN_SHARE = 0.6;

/** Nothing above this is called healthy, whatever the adjustments add up to. */
const MAX_HEALTHY_HIGH = 30;

/** How far above the band counts as a little rather than a lot. */
const WELL_ABOVE_MARGIN = 5;

/** Heights and weights outside these are a typo, not a body. */
const MIN_HEIGHT_CM = 100;
const MAX_HEIGHT_CM = 250;

export type BodyBand = 'below' | 'healthy' | 'above' | 'well_above';

/** A fact that moved the healthy range away from the textbook one. */
export type BandAdjustment = 'age' | 'training' | 'activity';

export interface BodyIndexInput {
  readonly weightKg: number | null;
  readonly heightCm: number | null;
  readonly age: number | null;
  readonly sex: Sex | null;
  readonly activityLevel: ActivityLevel | null;
  /**
   * Days a week this person trains, from their goal.
   *
   * The goal rather than the session log, deliberately. `activityLevel` is
   * explicitly about the *other* twenty-three hours — a desk-job powerlifter
   * answers "sedentary" to it, truthfully — so an allowance built from activity
   * alone would give the least to the person who needs it most. This is the
   * field that knows somebody lifts.
   */
  readonly trainingDaysPerWeek: number | null;
}

export interface BodyIndex {
  /** Weight over height squared. The plain ratio, unadjusted, to one decimal. */
  readonly bmi: number;
  readonly band: BodyBand;
  /** The range this body was judged against, which is rarely 18.5–25. */
  readonly healthyLow: number;
  readonly healthyHigh: number;
  /** What moved the range, for a screen that has to say why it is not 18.5–25. */
  readonly adjustedFor: readonly BandAdjustment[];
}

/**
 * The body-mass ratio, and the healthy range for *this* body rather than for
 * the population average it was fitted to.
 *
 * Null without a weight and a height, because there is no ratio without them
 * and a zero would read as a measurement. Everything else is optional and only
 * ever widens the range: somebody who has answered nothing but the two
 * measurements gets the textbook band, which is the most pessimistic answer
 * this can give and the right default for somebody the app knows nothing about.
 *
 * The number itself is never adjusted. Inventing a "muscle-corrected BMI" would
 * produce a figure that agrees with no doctor, no chart and no other app, and it
 * would be a guess dressed as a measurement. The ratio is the ratio; what age,
 * sex and training change is what counts as healthy for the person holding it.
 */
export function bodyIndex(input: BodyIndexInput): BodyIndex | null {
  const { weightKg, heightCm } = input;
  if (weightKg === null || heightCm === null) return null;
  if (!Number.isFinite(weightKg) || weightKg <= 0) return null;
  if (!Number.isFinite(heightCm) || heightCm < MIN_HEIGHT_CM || heightCm > MAX_HEIGHT_CM) {
    return null;
  }

  const metres = heightCm / 100;
  const bmi = round1(weightKg / (metres * metres));

  const adjustedFor: BandAdjustment[] = [];

  const ageRise =
    input.age === null ? 0 : clamp((input.age - AGE_PIVOT) * BAND_RISE_PER_YEAR, 0, MAX_AGE_RISE);
  if (ageRise > 0) adjustedFor.push('age');

  // Clamped to the week, so a goal row saying it trains nine days a week
  // cannot buy a wider band than one that trains seven.
  const days = input.trainingDaysPerWeek === null ? 0 : clamp(input.trainingDaysPerWeek, 0, 7);
  const fromTraining = days * LEAN_PER_TRAINING_DAY;
  const fromActivity = input.activityLevel === null ? 0 : ACTIVITY_LEAN[input.activityLevel];
  const share = input.sex === 'female' ? FEMALE_LEAN_SHARE : 1;
  const lean = clamp((fromTraining + fromActivity) * share, 0, MAX_LEAN_ALLOWANCE);
  if (fromTraining > 0) adjustedFor.push('training');
  if (fromActivity > 0) adjustedFor.push('activity');

  // Age moves both ends: being light is its own risk later in life, which is
  // the half of the published adjustment people forget. Lean mass moves only
  // the top — carrying muscle is not a reason to need to weigh more.
  const healthyLow = round1(BASE_HEALTHY_LOW + ageRise);
  const healthyHigh = round1(Math.min(BASE_HEALTHY_HIGH + ageRise + lean, MAX_HEALTHY_HIGH));

  return { bmi, band: bandFor(bmi, healthyLow, healthyHigh), healthyLow, healthyHigh, adjustedFor };
}

function bandFor(bmi: number, low: number, high: number): BodyBand {
  if (bmi < low) return 'below';
  if (bmi <= high) return 'healthy';
  return bmi <= high + WELL_ABOVE_MARGIN ? 'above' : 'well_above';
}

function clamp(value: number, low: number, high: number): number {
  if (!Number.isFinite(value)) return low;
  return Math.min(Math.max(value, low), high);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
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
