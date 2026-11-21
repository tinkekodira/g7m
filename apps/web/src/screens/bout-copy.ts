/**
 * The words around a cardio bout: what the fields are called on each machine,
 * what a finished bout says in one line, and where its calories came from.
 *
 * Pure, so the wording is tested without a screen. The numbers themselves are
 * @g7m/core's (`cardio.ts`).
 */
import { formatNumber, t } from '@g7m/i18n';
import {
  boutCalories,
  boutPace,
  distanceUnitFor,
  formatDistance,
  formatDuration,
  speedUnitFor,
  type Bout,
  type BoutField,
  type CalorieMethod,
  type Calories,
  type CardioKind,
  type UnitSystem,
} from '@g7m/core';

/** The label on a bout field, with its unit where it has one. */
export function fieldLabel(field: BoutField, kind: CardioKind, unitSystem: UnitSystem): string {
  switch (field) {
    case 'distance':
      return t().workout.cardio.fields.distance(distanceUnitFor(kind, unitSystem));
    case 'speed':
      return t().workout.cardio.fields.speed(speedUnitFor(unitSystem));
    case 'incline':
      return t().workout.cardio.fields.incline;
    case 'level':
      return t().workout.cardio.fields.level;
    case 'watts':
      return t().workout.cardio.fields.watts;
    case 'floors':
      return t().workout.cardio.fields.floors;
  }
}

/**
 * Where a calorie figure came from, said under it.
 *
 * The rough one names what would make it better, because the fix is one field
 * away and nobody would guess which.
 */
export function describeCalorieSource(method: CalorieMethod, kind: CardioKind): string {
  switch (method) {
    case 'machine':
      return t().workout.cardio.sources.machine;
    case 'treadmill':
      return t().workout.cardio.sources.treadmill;
    case 'power':
      return t().workout.cardio.sources.power;
    case 'pace':
      return t().workout.cardio.sources.pace;
    case 'stairs':
      return t().workout.cardio.sources.stairs;
    case 'met':
      return t().workout.cardio.sources.met(t().workout.cardio.better[kind]);
  }
}

/**
 * One bout in one line: "25:00 · 5.2 km · 5:00 /km · ≈ 320 kcal".
 *
 * What the workout's summary lists for a machine, in the order a display
 * would: time first, because every bout has it.
 */
export function boutSummary(
  kind: CardioKind,
  bout: Bout,
  unitSystem: UnitSystem,
  bodyweightKg: number | null,
): string {
  const parts: string[] = [];
  if (bout.durationSeconds !== null) parts.push(formatDuration(bout.durationSeconds));
  if (bout.distanceM !== null) {
    parts.push(formatDistance(bout.distanceM, distanceUnitFor(kind, unitSystem)));
  }
  if (bout.floors !== null) parts.push(t().workout.cardio.floors(bout.floors));
  const pace = boutPace(kind, bout, unitSystem);
  if (pace !== null) parts.push(pace);
  const calories = boutCalories(kind, bout, bodyweightKg);
  if (calories !== null) parts.push(caloriesText(calories));
  return parts.length === 0 ? t().workout.cardio.nothing : parts.join(' · ');
}

/** "≈ 320 kcal" for an estimate, "320 kcal" for the machine's own figure. */
export function caloriesText(calories: Calories): string {
  const figure = `${formatNumber(calories.kcal)} kcal`;
  return calories.method === 'machine' ? figure : `≈ ${figure}`;
}

/**
 * A typed number, or null for an empty box, or 'invalid'.
 *
 * Three answers rather than two: an empty box means "not recorded" and clears
 * the field, while "5,,2" is a typo that must not quietly clear it.
 */
export function parseNumberField(text: string): number | null | 'invalid' {
  const trimmed = text.trim().replace(',', '.');
  if (trimmed === '') return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : 'invalid';
}
