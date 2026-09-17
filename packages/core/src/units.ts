/**
 * Weight units.
 *
 * Brief §5: every weight is stored in kilograms as `numeric(6,2)`. Conversion
 * to pounds happens at the display layer and nowhere else. Mixing units in
 * storage is how you end up with a user whose 1RM is 225 kg.
 */

export type UnitSystem = 'metric' | 'imperial';

/** Exact by international definition, not an approximation. */
export const KG_PER_LB = 0.45359237;

/** Default stepper increments (Brief §8). Configurable per user later. */
export const DEFAULT_INCREMENT_KG = 2.5;
export const DEFAULT_INCREMENT_LB = 5;

/** The smallest plate step we bother representing: matches numeric(6,2). */
const STORAGE_PRECISION = 2;

export interface DisplayWeight {
  /** Rounded for display in the user's own unit. */
  readonly value: number;
  readonly unit: 'kg' | 'lb';
}

/** Round to `decimals` places, correcting for float representation error. */
function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  // The +Number.EPSILON nudge stops 1.005 -> 1.00 style off-by-one-cent errors.
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB;
}

export function lbToKg(lb: number): number {
  return lb * KG_PER_LB;
}

/**
 * Snap a weight to the nearest usable increment — what the +/- steppers do.
 * `increment` must be positive; a zero or negative increment has no meaningful
 * answer, so it throws rather than silently returning NaN or looping.
 */
export function roundToIncrement(value: number, increment: number): number {
  if (!Number.isFinite(increment) || increment <= 0) {
    throw new RangeError(`increment must be a positive finite number, got ${increment}`);
  }
  return round(Math.round(value / increment) * increment, STORAGE_PRECISION);
}

/**
 * Convert a stored kilogram value into what the user should see.
 *
 * Imperial users get whole-ish pounds (1 decimal), metric users get the 0.25 kg
 * resolution that microplates make real. Neither rounding ever writes back to
 * storage — this is display only.
 */
export function toDisplayWeight(kg: number, unitSystem: UnitSystem): DisplayWeight {
  if (unitSystem === 'imperial') {
    return { value: round(kgToLb(kg), 1), unit: 'lb' };
  }
  return { value: round(kg, STORAGE_PRECISION), unit: 'kg' };
}

/**
 * Convert what the user typed back into the kilograms we store.
 * Rounded to storage precision so `numeric(6,2)` never truncates behind us.
 */
export function fromDisplayWeight(value: number, unitSystem: UnitSystem): number {
  const kg = unitSystem === 'imperial' ? lbToKg(value) : value;
  return round(kg, STORAGE_PRECISION);
}

/** Exact by international definition, like `KG_PER_LB`. */
export const CM_PER_INCH = 2.54;

export interface DisplayHeight {
  readonly value: number;
  readonly unit: 'cm' | 'in';
}

export function cmToInches(cm: number): number {
  return cm / CM_PER_INCH;
}

export function inchesToCm(inches: number): number {
  return inches * CM_PER_INCH;
}

/**
 * Height, in whichever unit the user thinks in.
 *
 * Inches rather than feet-and-inches, and the difference is worth naming: a
 * single number round-trips through one input, and `5'11"` needs two fields
 * plus a rule for what 5 feet 13 inches means. Whole inches, because half an
 * inch of height changes no plan this app will ever write.
 */
export function toDisplayHeight(cm: number, unitSystem: UnitSystem): DisplayHeight {
  if (unitSystem === 'imperial') {
    return { value: round(cmToInches(cm), 0), unit: 'in' };
  }
  return { value: round(cm, 1), unit: 'cm' };
}

export function fromDisplayHeight(value: number, unitSystem: UnitSystem): number {
  const cm = unitSystem === 'imperial' ? inchesToCm(value) : value;
  // `numeric(5,1)`, matching the body_metrics column.
  return round(cm, 1);
}

/** The stepper increment for a unit system, expressed in kilograms. */
export function incrementKgFor(unitSystem: UnitSystem): number {
  return unitSystem === 'imperial' ? round(lbToKg(DEFAULT_INCREMENT_LB), 4) : DEFAULT_INCREMENT_KG;
}

/**
 * How much a dumbbell goes up by, in kilograms. Two ladders, not one.
 *
 * A rack is not a continuum. Most metric racks run 2, 4, 6, 8 … and then, from
 * the teens up, half-kilo sizes appear: 12.5, 15, 17.5, 20. Whichever ladder a
 * lifter is on, the next dumbbell along is the one they want — so 14 steps to
 * 16, and 12.5 steps to 15. A fixed 2.5 would offer 16.5 kg, which no rack has.
 *
 * Pounds have one ladder, in fives, which is `DEFAULT_INCREMENT_LB` already.
 */
export const DUMBBELL_INCREMENT_KG = 2;
export const DUMBBELL_HALF_INCREMENT_KG = 2.5;

export function dumbbellIncrementKg(currentKg: number): number {
  if (!Number.isFinite(currentKg)) return DUMBBELL_INCREMENT_KG;

  // Which ladder is this weight on? Only the even whole numbers belong to the
  // 2 / 4 / 6 one. A half — 12.5, 17.5 — is plainly the other, and so is an
  // odd whole number: 15 is a rung of 12.5 / 15 / 17.5 and appears nowhere on
  // a rack counting in twos. Anything else typed in (12.3) steps by two.
  const half = Math.abs(currentKg * 2 - Math.round(currentKg * 2)) < 1e-9;
  if (!half) return DUMBBELL_INCREMENT_KG;

  const whole = Math.abs(currentKg - Math.round(currentKg)) < 1e-9;
  if (!whole) return DUMBBELL_HALF_INCREMENT_KG;
  return Math.round(currentKg) % 2 === 0 ? DUMBBELL_INCREMENT_KG : DUMBBELL_HALF_INCREMENT_KG;
}

/**
 * The step for one exercise's weight field, in kilograms.
 *
 * Everything that is not a dumbbell keeps the plate-sized step it had: a
 * barbell goes up by the smallest pair of plates, and a machine's stack is its
 * own business.
 */
export function weightStepKg(input: {
  readonly dumbbell: boolean;
  readonly currentKg: number;
  readonly unitSystem: UnitSystem;
}): number {
  if (!input.dumbbell || input.unitSystem === 'imperial') return incrementKgFor(input.unitSystem);
  return dumbbellIncrementKg(input.currentKg);
}
