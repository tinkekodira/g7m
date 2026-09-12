/**
 * What the profile screen says about somebody, as data.
 *
 * The numbers are the ones the You screen collects — weight, height, age,
 * activity, goal — shown here as a read-only summary with a way through to
 * edit them. Assembled outside the component so the unit handling and the
 * blanks can be tested: a profile is mostly blanks for the first week, and
 * each one should say so rather than print "null cm".
 */
import {
  ACTIVITY_LABELS,
  GOAL_LABELS,
  SEX_LABELS,
  ageFrom,
  countryName,
  describeWhen,
  toDisplayHeight,
  toDisplayWeight,
  type ActivityLevel,
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
}

export interface ProfileFacts {
  readonly unitSystem: UnitSystem;
  readonly weightKg: number | null;
  readonly weightAt: Date | null;
  readonly heightCm: number | null;
  readonly birthDate: Date | null;
  readonly sex: Sex | null;
  readonly activityLevel: ActivityLevel | null;
  readonly goal: { readonly goal: TrainingGoal; readonly daysPerWeek: number } | null;
  readonly country: string | null;
}

/**
 * The tiles, in the order somebody scans for them: body first, then what they
 * are training for, then the rest.
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
      key: 'goal',
      label: 'Goal',
      value: facts.goal === null ? null : GOAL_LABELS[facts.goal.goal],
      ...(facts.goal === null
        ? {}
        : {
            detail: `${String(facts.goal.daysPerWeek)} ${facts.goal.daysPerWeek === 1 ? 'day' : 'days'} a week`,
          }),
    },
    {
      key: 'activity',
      label: 'Outside the gym',
      value: facts.activityLevel === null ? null : ACTIVITY_LABELS[facts.activityLevel],
    },
    { key: 'sex', label: 'Sex', value: facts.sex === null ? null : SEX_LABELS[facts.sex] },
    {
      key: 'country',
      label: 'From',
      value: facts.country === null ? null : countryName(facts.country),
    },
  ];
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
