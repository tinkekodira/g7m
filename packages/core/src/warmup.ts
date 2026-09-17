/**
 * The ramp up to a working weight.
 *
 * Nobody's first set of the day is their heaviest, and nobody wants to type
 * four more rows to say so. Given the weight the working sets are already
 * prefilled at, this works out the ladder to get there — and rounds every rung
 * to something the gym can actually produce, which is the part a lifter cannot
 * do in their head between sets.
 *
 * Pure, and separate from the screen that offers it, because the scheme is the
 * arguable part. `set_type = 'warmup'` has been in the schema, the partial
 * index, the prefill rules and three screens' rendering since the start; this
 * is the thing that was missing in front of all of it.
 *
 * ## The ladder shortens as the weight comes down
 *
 * A fixed 40/55/70/85% ladder is right at 140 kg and absurd at 40 kg, where
 * 40% is 16 kg — lighter than the empty bar it would be loaded onto. So the
 * number of rungs comes from how far the working weight actually is above the
 * lightest thing that can be lifted: four rungs for a bar with five plates a
 * side, none at all for a weight barely above the bar.
 *
 * ## What it will not do
 *
 * No ramp for a plain bodyweight set, an assisted one, or a cardio bout. A
 * percentage of "your own bodyweight" is not a weight anybody can load, and
 * the honest warm-up for a pull-up is a different feature — reps, bands, or a
 * lighter movement — rather than this one with a bad answer in it.
 */
import { LOAD_TYPES, type LoadType, type SetType } from './load.js';
import { KG_KIT, LB_KIT, type PlateKit } from './plates.js';
import type { SetTemplate } from './prefill.js';
import { fromDisplayWeight, toDisplayWeight, weightStepKg, type UnitSystem } from './units.js';

/**
 * The rungs, as a share of the working weight, and how many reps each gets.
 *
 * Heavier rungs get fewer reps: the point of the last one is to feel the
 * weight, not to spend anything on it. Ordered lightest first, which is the
 * order they are lifted in.
 */
const LADDERS: Readonly<Record<number, readonly { fraction: number; reps: number }[]>> = {
  0: [],
  1: [{ fraction: 0.6, reps: 5 }],
  2: [
    { fraction: 0.45, reps: 8 },
    { fraction: 0.7, reps: 3 },
  ],
  3: [
    { fraction: 0.4, reps: 8 },
    { fraction: 0.6, reps: 5 },
    { fraction: 0.8, reps: 3 },
  ],
  4: [
    { fraction: 0.4, reps: 8 },
    { fraction: 0.55, reps: 5 },
    { fraction: 0.7, reps: 3 },
    { fraction: 0.85, reps: 2 },
  ],
};

/** The most rungs this will ever propose, and the length of the longest ladder. */
export const MAX_WARMUP_SETS = 5;

/** Reps on the empty bar, where there is one. Movement, not work. */
export const EMPTY_BAR_REPS = 8;

/**
 * How many rungs a working weight is worth, from how many times the floor it
 * is.
 *
 * The floor is the empty bar for a barbell and the smallest step otherwise, so
 * "three times the floor" means roughly the same amount of ramping to do
 * whichever it is. The thresholds are conventional rather than derived — they
 * are where a ladder starts to feel too long or too short — and they are here
 * as one table so that changing an opinion is changing a number.
 */
export function warmupRungs(ratio: number): number {
  if (!Number.isFinite(ratio) || ratio < 1.35) return 0;
  if (ratio < 1.9) return 1;
  if (ratio < 2.75) return 2;
  if (ratio < 4) return 3;
  return 4;
}

export interface WarmupInput {
  /** The weight the working sets are set to, in kilograms. */
  readonly workingKg: number;
  /** What the weight field means. Only `external` gets a ramp. */
  readonly loadType: LoadType;
  /** Done on a standard barbell, so the ramp starts at the empty bar. */
  readonly barbell: boolean;
  /** Loaded with dumbbells, so the rungs land on sizes a rack has. */
  readonly dumbbell: boolean;
  readonly unitSystem: UnitSystem;
}

/**
 * The warm-up sets to put in front of the working ones, lightest first.
 *
 * Empty when there is nothing worth ramping — a weight close to the bar, a
 * load type with no weight to take a percentage of, or a number that is not a
 * weight at all. An empty list is a real answer here, and the caller is
 * expected to hide the button rather than add nothing.
 */
export function warmupSets(input: WarmupInput): SetTemplate[] {
  if (!canWarmUp(input.loadType)) return [];
  const { workingKg, barbell, dumbbell, unitSystem } = input;
  if (!Number.isFinite(workingKg) || workingKg <= 0) return [];

  /**
   * Worked out in the unit the lifter sees, and converted back once at the end.
   *
   * A plate kit is expressed in its own unit — `LB_KIT.bar` is 45 *pounds*,
   * not 45 kilograms — so doing this arithmetic in storage units silently
   * ramps an imperial lifter to a 45 kg bar. Staying in display units is also
   * what keeps every rung on a loading that exists, because the plates are
   * whole numbers there and awkward fractions here.
   */
  const working = toDisplayWeight(workingKg, unitSystem).value;
  const kit = barbell ? plateKit(unitSystem) : null;
  const step =
    kit === null
      ? toDisplayWeight(weightStepKg({ dumbbell, currentKg: workingKg, unitSystem }), unitSystem)
          .value
      : (kit.plates[kit.plates.length - 1] ?? 1.25) * 2;
  // What the lightest lift on this equipment weighs. The bar is a real floor —
  // nothing lighter can go on it — where a dumbbell's is only the smallest
  // rung of its rack.
  const floor = kit === null ? step : kit.bar;
  if (!(step > 0) || working <= floor) return [];

  const rungs = LADDERS[warmupRungs(working / floor)] ?? [];

  const sets: SetTemplate[] = [];
  // The bar itself, where there is one and the ladder is long enough to mean
  // somebody is lifting something worth walking up to.
  if (kit !== null && rungs.length > 0) {
    sets.push(template(kit.bar, EMPTY_BAR_REPS, unitSystem));
  }

  let previous = kit === null ? 0 : kit.bar;
  for (const rung of rungs) {
    const weight = roundToLoadable(working * rung.fraction, { floor, step, hasBar: kit !== null });
    // Rungs collapse into each other once rounded, and a ladder with the same
    // weight twice reads as a bug. Anything that has not cleared the rung
    // below it, or has reached the working weight, is not a warm-up.
    if (weight <= previous || weight >= working) continue;
    sets.push(template(weight, rung.reps, unitSystem));
    previous = weight;
  }

  return sets;
}

/** Whether a ramp means anything for this load type. */
export function canWarmUp(loadType: LoadType): boolean {
  return loadType === 'external';
}

/** Every load type, so a caller can be exhaustive about the ones left out. */
export const WARMUP_LOAD_TYPES: readonly LoadType[] = LOAD_TYPES.filter(canWarmUp);

const WARMUP: SetType = 'warmup';

/** A rung, taken from the unit it was worked out in back into storage. */
function template(displayWeight: number, reps: number, unitSystem: UnitSystem): SetTemplate {
  return {
    weightKg: fromDisplayWeight(displayWeight, unitSystem),
    reps,
    loadType: 'external',
    setType: WARMUP,
  };
}

function plateKit(unitSystem: UnitSystem): PlateKit {
  return unitSystem === 'imperial' ? LB_KIT : KG_KIT;
}

/**
 * The nearest weight this equipment can actually be set to, at or below the
 * one asked for.
 *
 * Down rather than to the nearest, on purpose: a warm-up rounded up can land
 * heavier than intended, and the whole ladder exists to arrive at the working
 * weight fresh. Rounding down is never the wrong direction for a warm-up.
 *
 * A barbell moves in pairs of the smallest plate — one plate on each end —
 * which is why the step is doubled. A dumbbell moves by its rack's own ladder,
 * and everything else by the stepper's increment, which is what a machine's
 * stack is approximated by anyway.
 */
export function roundToLoadable(
  target: number,
  equipment: {
    /** The lightest thing that can be lifted: the bar, or the smallest step. */
    readonly floor: number;
    /** What the equipment moves by — a pair of the smallest plate, or a rack rung. */
    readonly step: number;
    /** A bar is a floor to build up from; a rack is a ladder from nothing. */
    readonly hasBar: boolean;
  },
): number {
  const { floor, step, hasBar } = equipment;
  if (!(step > 0)) return round2(target);

  if (hasBar) {
    const overBar = target - floor;
    if (overBar <= 0) return round2(floor);
    return round2(floor + Math.floor(overBar / step + 1e-9) * step);
  }

  return round2(Math.max(step, Math.floor(target / step + 1e-9) * step));
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
