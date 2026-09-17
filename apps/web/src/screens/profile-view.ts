/**
 * What the profile screen says about somebody, as data.
 *
 * The numbers are the ones the You screen collects — weight, height, age,
 * activity, goal — shown here as a read-only summary with a way through to
 * edit them. Assembled outside the component so the unit handling and the
 * blanks can be tested: a profile is mostly blanks for the first week, and
 * each one should say so rather than print "null cm".
 */
import { monthName } from '../lib/date-words.js';
import {
  ACTIVITY_LABELS,
  GOAL_LABELS,
  SEX_LABELS,
  ageFrom,
  bodyIndex,
  describeWhen,
  toDisplayHeight,
  toDisplayWeight,
  type ActivityLevel,
  type BodyBand,
  type BodyIndex,
  type PersonalRecord,
  type Sex,
  type TrainingGoal,
  type UnitSystem,
} from '@g7m/core';

export interface StatTile {
  readonly key: string;
  readonly label: string;
  /** What to show, or null for "not set yet". */
  readonly value: string | null;
  /** A line under the value — how old a weight is, how many days a week. */
  readonly detail?: string;
  /** Colour for the detail line, where the detail is a verdict rather than a fact. */
  readonly tone?: 'good' | 'caution';
}

export interface ProfileFacts {
  readonly unitSystem: UnitSystem;
  readonly weightKg: number | null;
  readonly weightAt: Date | null;
  readonly heightCm: number | null;
  readonly birthDate: Date | null;
  readonly sex: Sex | null;
  readonly activityLevel: ActivityLevel | null;
  /** From the goal, so the band knows this is somebody who lifts. */
  readonly trainingDaysPerWeek: number | null;
  /**
   * Whether the goal row has been read yet, as opposed to read and empty.
   *
   * Without this the tile computes a band from a goal that has not arrived,
   * and the first frame tells a lifter they are above their range before
   * correcting itself a moment later. A blank that fills in is fine; a verdict
   * that changes its mind is not. The goal card guards itself the same way.
   */
  readonly goalRead?: boolean;
}

/**
 * The tiles, in the order somebody scans for them.
 *
 * BMI comes last on purpose, after the five facts it is worked out from. The
 * reader meets weight, height, age, activity and sex, and then the thing they
 * add up to — which is also the order in which the last tile becomes
 * trustworthy, because each blank above it widens the band it is judged against.
 *
 * Where somebody is from used to have a tile here. The flag beside their name
 * says it already, and a country is not one of somebody's numbers (ADR-0080).
 */
export function profileStats(facts: ProfileFacts, now: Date): StatTile[] {
  const weight = facts.weightKg === null ? null : toDisplayWeight(facts.weightKg, facts.unitSystem);
  const height = facts.heightCm === null ? null : toDisplayHeight(facts.heightCm, facts.unitSystem);
  const age = ageFrom(facts.birthDate, now);

  return [
    {
      key: 'weight',
      label: 'Weight',
      value: weight === null ? null : `${String(weight.value)} ${weight.unit}`,
      ...(facts.weightAt === null ? {} : { detail: describeWhen(facts.weightAt, now) }),
    },
    {
      key: 'height',
      label: 'Height',
      value: height === null ? null : `${String(height.value)} ${height.unit}`,
    },
    { key: 'age', label: 'Age', value: age === null ? null : String(age) },
    {
      key: 'activity',
      label: 'Outside the gym',
      value: facts.activityLevel === null ? null : ACTIVITY_LABELS[facts.activityLevel],
    },
    { key: 'sex', label: 'Sex', value: facts.sex === null ? null : SEX_LABELS[facts.sex] },
    bmiTile(indexFor(facts, now)),
  ];
}

/** The body index for these facts, or null while anything it needs is missing. */
export function indexFor(facts: ProfileFacts, now: Date): BodyIndex | null {
  if (facts.goalRead === false) return null;
  return bodyIndex({
    weightKg: facts.weightKg,
    heightCm: facts.heightCm,
    age: ageFrom(facts.birthDate, now),
    sex: facts.sex,
    activityLevel: facts.activityLevel,
    trainingDaysPerWeek: facts.trainingDaysPerWeek,
  });
}

/** How each band reads on a tile. Short, because the range sits beside it. */
const BAND_WORDS: Record<BodyBand, string> = {
  below: 'Below range',
  healthy: 'Healthy',
  above: 'Above range',
  well_above: 'Well above',
};

/**
 * BMI, and the band it was judged against — never the textbook one unquoted.
 *
 * The range is printed next to the verdict rather than left implicit, because
 * "Healthy" against an invisible band is the app asking to be trusted, and
 * "Healthy · 18.5–27.5" is the app showing its working. It is also the only way
 * somebody notices the band widening as they fill the rest of the screen in.
 */
function bmiTile(index: BodyIndex | null): StatTile {
  if (index === null) return { key: 'bmi', label: 'BMI', value: null };
  return {
    key: 'bmi',
    label: 'BMI',
    value: index.bmi.toFixed(1),
    detail: `${BAND_WORDS[index.band]} · ${trim(index.healthyLow)}–${trim(index.healthyHigh)}`,
    tone: index.band === 'healthy' ? 'good' : 'caution',
  };
}

/** 27.5 stays 27.5; 25.0 becomes 25, because a band is not a measurement. */
function trim(value: number): string {
  return String(Math.round(value * 10) / 10);
}

/**
 * The line under the numbers, explaining why the band is not 18.5–25.
 *
 * Two versions, and which one shows is the point. A profile with nothing on it
 * gets the standard band and an invitation to make it fit; a profile that has
 * been filled in gets told what moved it. Without this the widened range looks
 * like the app being loose with the arithmetic, and ADR-0035's objection would
 * be answered in the code and nowhere the user can see.
 */
export function bmiNote(index: BodyIndex | null): string | null {
  if (index === null) return null;
  if (index.adjustedFor.length === 0) {
    return 'That is the standard range. Fill in your age and how many days a week you train and it is set for your body instead.';
  }
  // "Moves with" rather than "is set from", which would claim a sex nobody has
  // given. All three shift the band; which of them have been answered is the
  // reader's business, and the band beside the verdict already shows the result.
  return 'Your range moves with your age, your sex and how much you train. Plain BMI counts muscle as excess weight, so 18.5–25 is the wrong band for somebody who lifts.';
}

export interface BestLift {
  readonly exerciseId: string;
  readonly name: string;
  readonly valueKg: number;
  readonly achievedAt: Date;
}

/**
 * The heaviest weight moved on each exercise, heaviest first.
 *
 * One line per exercise. The records hold three kinds each, and all three in a
 * list reads as a spreadsheet; the heaviest is the one people quote.
 *
 * Heaviest first rather than alphabetical: the top of the list is then the
 * lifts somebody is proudest of, which is what a profile is for. Ties go by
 * name so the order never shuffles between visits.
 */
export function bestLifts(
  records: readonly PersonalRecord[],
  names: ReadonlyMap<string, string>,
): BestLift[] {
  return records
    .filter((record) => record.recordType === 'max_weight' && record.value > 0)
    .map((record) => ({
      exerciseId: record.exerciseId,
      name: names.get(record.exerciseId) ?? 'Unknown exercise',
      valueKg: record.value,
      achievedAt: record.achievedAt,
    }))
    .sort((a, b) => b.valueKg - a.valueKg || a.name.localeCompare(b.name, 'en'));
}

export interface GoalCardLine {
  readonly title: string;
  readonly detail: string;
}

/**
 * The goal card on Profile: the goal, and how it is being kept — "3 days a
 * week · since 3 September". The year only when it is not this one.
 *
 * Its own card rather than a tile among the numbers, because it is the one
 * thing on the page that decides what the app builds, and the one most likely
 * to be changed (ADR-0071).
 */
export function goalCardLine(
  goal: {
    readonly goal: TrainingGoal;
    readonly daysPerWeek: number;
    readonly startedAt: Date;
  },
  now: Date,
): GoalCardLine {
  const days = `${String(goal.daysPerWeek)} ${goal.daysPerWeek === 1 ? 'day' : 'days'} a week`;
  const date = `${String(goal.startedAt.getDate())} ${monthName(goal.startedAt)}`;
  const year =
    goal.startedAt.getFullYear() === now.getFullYear()
      ? ''
      : ` ${String(goal.startedAt.getFullYear())}`;
  return { title: GOAL_LABELS[goal.goal], detail: `${days} · since ${date}${year}` };
}
