/**
 * What the Edit screen and Profile's weigh-in accept, separated from the
 * markup that asks for it.
 *
 * Each reader turns what was typed into the value that is stored, or into the
 * sentence that says why it cannot be. They used to live inside the screen's
 * save handlers, one per Save button; the screen now saves everything at once
 * and Profile logs a weight without opening it, so both read the same rules.
 */
import { t } from '@g7m/i18n';
import {
  MAX_AGE,
  MIN_AGE,
  ageFrom,
  fromDisplayHeight,
  fromDisplayWeight,
  parseBirthDate,
  type UnitSystem,
} from '@g7m/core';

export type Read<T> = { readonly value: T } | { readonly problem: string };

/** A comma is a decimal point on half the keyboards this is typed on. */
function decimal(text: string): number {
  const trimmed = text.trim().replace(',', '.');
  return trimmed === '' ? Number.NaN : Number(trimmed);
}

/** A weight in the person's unit, as the kilograms stored. */
export function readWeight(text: string, unitSystem: UnitSystem): Read<number> {
  const typed = decimal(text);
  if (!Number.isFinite(typed) || typed <= 0) return { problem: t().profile.editProblems.weight };
  const kg = fromDisplayWeight(typed, unitSystem);
  // Mirrors the CHECK on the column. Caught here so the person sees why,
  // rather than at upload where the row would be discarded silently.
  if (kg <= 0 || kg >= 1000) return { problem: t().profile.editProblems.range };
  return { value: kg };
}

/** A height in the person's unit, as the centimetres stored. */
export function readHeight(text: string, unitSystem: UnitSystem): Read<number> {
  const unit = unitSystem === 'imperial' ? 'in' : 'cm';
  const typed = decimal(text);
  const cm = Number.isFinite(typed) ? fromDisplayHeight(typed, unitSystem) : Number.NaN;
  if (!Number.isFinite(cm) || cm <= 50 || cm >= 300)
    return { problem: t().profile.editProblems.height(unit) };
  return { value: cm };
}

/** The day somebody was born, from a date field, within the ages the app is for. */
export function readBirthDate(text: string, now: Date): Read<Date> {
  const born = parseBirthDate(text);
  const age = ageFrom(born, now);
  if (born === null || age === null || age < MIN_AGE || age > MAX_AGE) {
    return {
      problem: t().profile.editProblems.born(MIN_AGE, MAX_AGE),
    };
  }
  return { value: born };
}

/**
 * Whether a field has been changed from what is stored.
 *
 * A field nobody has touched holds null and shows the stored value. One that
 * was touched and put back exactly as it was is not a change either, so Save
 * does not light up for it.
 */
export function isEdited(draft: string | null, stored: string): boolean {
  return draft !== null && draft.trim() !== stored.trim();
}
