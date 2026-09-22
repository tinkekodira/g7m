/**
 * The plate calculator's own kit: which plates a gym might have, and which
 * bar the lifter is loading them on.
 *
 * Deliberately separate from `plates.ts`. That file backs the workout logger's
 * inline "Each side: 25 · 15 · 1.25" line and the warm-up ramp, both of which
 * assume the standard rack — every plate, one 20 kg (or 45 lb) bar — because
 * guessing a lighter kit mid-set is worse than assuming the common one. The
 * calculator is the opposite case: it exists to answer "what can *my* gym
 * make", so it needs a kit that can shrink, and three bars instead of one.
 *
 * ## Slots, not numbers
 *
 * A gym's rack is a set of colours before it is a set of numbers — nobody
 * says "I'm missing the 25", they say "there's no red plate on this rack".
 * `PlateSlot` is that colour, and it is what gets stored: deselecting red
 * removes the 25 kg plate in kg mode and the 55 lb plate in lb mode, with one
 * flip of `unitSystem` and no migration of the stored choice.
 *
 * The kilogram ladder matches the international plate code — red 25, blue 20,
 * yellow 15, green 10 — down to black, dark grey and light grey for the small
 * change, which is also the ladder `plates.ts` already draws its colours from.
 * The pound ladder is a new one for this screen alone: 55/45/35/25/10/5/2.5,
 * which is what the sprites' seven-rank art stands for once the legend calls
 * it pounds instead of kilograms, not `plates.ts`'s six-plate 45 lb kit built
 * for a different bar.
 */

import { loadBar, type Loading, type PlateKit } from './plates.js';

export const PLATE_SLOTS = [
  'red',
  'blue',
  'yellow',
  'green',
  'black',
  'darkGrey',
  'lightGrey',
] as const;

/** Heaviest first — the order the sprites are ranked in, and the order plates load. */
export type PlateSlot = (typeof PLATE_SLOTS)[number];

export type CalculatorUnit = 'kg' | 'lb';

/** What each slot weighs, in each unit. Independent ladders, not a conversion. */
const SLOT_KG: Readonly<Record<PlateSlot, number>> = {
  red: 25,
  blue: 20,
  yellow: 15,
  green: 10,
  black: 5,
  darkGrey: 2.5,
  lightGrey: 1.25,
};

const SLOT_LB: Readonly<Record<PlateSlot, number>> = {
  red: 55,
  blue: 45,
  yellow: 35,
  green: 25,
  black: 10,
  darkGrey: 5,
  lightGrey: 2.5,
};

/** The real diameter each slot's disc is modelled at, in millimetres. Cast iron, graduated. */
export const PLATE_DIAMETER_MM: Readonly<Record<PlateSlot, number>> = {
  red: 450,
  blue: 406,
  yellow: 364,
  green: 322,
  black: 282,
  darkGrey: 244,
  lightGrey: 208,
};

/**
 * The real thickness each slot's disc is modelled at, in millimetres.
 *
 * These are what the sprites are built to, and what `sleeveFitsMm` sums
 * against a bar's loadable sleeve — the two can never disagree, because both
 * come from the same asset manifest (`3d-models/plate-calculator/out`).
 */
export const PLATE_THICKNESS_MM: Readonly<Record<PlateSlot, number>> = {
  red: 76,
  blue: 68,
  yellow: 61,
  green: 54,
  black: 48,
  darkGrey: 42,
  lightGrey: 36,
};

/** Visual only — a collar never adds weight, but one is always drawn. */
export const COLLAR_THICKNESS_MM = 30;

export interface PlateSlotLook {
  readonly colour: string;
  readonly lit: string;
  readonly shade: string;
  readonly ink: string;
}

const LIGHT_INK = '#faf9f5';
const DARK_INK = '#26241f';

/** Sampled off the same models the sprites were rendered from (`sizes.md`). */
export const PLATE_SLOT_LOOK: Readonly<Record<PlateSlot, PlateSlotLook>> = {
  red: { colour: '#de3b2c', lit: '#ea5347', shade: '#b32e22', ink: LIGHT_INK },
  blue: { colour: '#1d5fc4', lit: '#3a76d6', shade: '#164a96', ink: LIGHT_INK },
  yellow: { colour: '#f2c31c', lit: '#f6d454', shade: '#c79a16', ink: DARK_INK },
  green: { colour: '#24a63e', lit: '#3abf55', shade: '#1b7d2f', ink: LIGHT_INK },
  black: { colour: '#2b2b31', lit: '#434349', shade: '#1c1c20', ink: LIGHT_INK },
  darkGrey: { colour: '#5c636b', lit: '#747b83', shade: '#454b52', ink: LIGHT_INK },
  lightGrey: { colour: '#aeb5bd', lit: '#c7ccd2', shade: '#8b929a', ink: DARK_INK },
};

/** A plate's value in the given unit. */
export function slotValue(slot: PlateSlot, unit: CalculatorUnit): number {
  return unit === 'kg' ? SLOT_KG[slot] : SLOT_LB[slot];
}

const VALUE_TO_SLOT_KG = new Map<number, PlateSlot>(
  PLATE_SLOTS.map((slot) => [SLOT_KG[slot], slot]),
);
const VALUE_TO_SLOT_LB = new Map<number, PlateSlot>(
  PLATE_SLOTS.map((slot) => [SLOT_LB[slot], slot]),
);

/** The slot a loaded plate's value belongs to. Every value `loadBar` can return has one. */
export function slotForValue(value: number, unit: CalculatorUnit): PlateSlot {
  const found = (unit === 'kg' ? VALUE_TO_SLOT_KG : VALUE_TO_SLOT_LB).get(value);
  if (found === undefined) {
    throw new RangeError(
      `No plate slot for ${String(value)} ${unit} — not one of this kit's plates.`,
    );
  }
  return found;
}

export type BarId = 'bar_20' | 'bar_15' | 'bar_ez';
export const BAR_IDS: readonly BarId[] = ['bar_20', 'bar_15', 'bar_ez'];

export interface BarSpec {
  readonly id: BarId;
  readonly label: string;
  /** Fixed bars carry their own weight; the EZ bar's is user-set, see `EzBarWeight`. */
  readonly weightKg: number | null;
  readonly weightLb: number | null;
  /** How much sleeve there is to load, per side, in millimetres. From the manifest. */
  readonly sleeveUsableMm: number;
}

export const BAR_SPECS: Readonly<Record<BarId, BarSpec>> = {
  bar_20: { id: 'bar_20', label: '20 kg barbell', weightKg: 20, weightLb: 45, sleeveUsableMm: 415 },
  bar_15: { id: 'bar_15', label: '15 kg barbell', weightKg: 15, weightLb: 35, sleeveUsableMm: 320 },
  bar_ez: {
    id: 'bar_ez',
    label: 'EZ curl bar',
    weightKg: null,
    weightLb: null,
    sleeveUsableMm: 215,
  },
};

/** Where the EZ bar's weight starts, until the lifter corrects it for their own gym's bar. */
export const EZ_BAR_DEFAULT_KG = 10;
export const EZ_BAR_DEFAULT_LB = 20;

/** A bar's weight in the given unit — fixed for the two Olympic bars, editable for the EZ bar. */
export function barWeight(bar: BarId, unit: CalculatorUnit, ezBarWeight: EzBarWeight): number {
  const spec = BAR_SPECS[bar];
  const fixed = unit === 'kg' ? spec.weightKg : spec.weightLb;
  if (fixed !== null) return fixed;
  return unit === 'kg' ? ezBarWeight.kg : ezBarWeight.lb;
}

/** The EZ bar's own weight, kept as two independent numbers like every other bar's. */
export interface EzBarWeight {
  readonly kg: number;
  readonly lb: number;
}

export const DEFAULT_EZ_BAR_WEIGHT: EzBarWeight = { kg: EZ_BAR_DEFAULT_KG, lb: EZ_BAR_DEFAULT_LB };

/** Every slot, selected. What a fully stocked gym has. */
export const ALL_PLATE_SLOTS: ReadonlySet<PlateSlot> = new Set(PLATE_SLOTS);

/**
 * Add or remove one slot from a selection, refusing to empty it.
 *
 * The calculator needs at least one plate to say anything at all, so the last
 * one standing does not toggle off — the caller shows a hint instead of a
 * blank rack.
 */
export function toggleSlot(
  selected: ReadonlySet<PlateSlot>,
  slot: PlateSlot,
): ReadonlySet<PlateSlot> {
  const has = selected.has(slot);
  if (!has) return new Set(selected).add(slot);
  if (selected.size <= 1) return selected;
  const next = new Set(selected);
  next.delete(slot);
  return next;
}

/**
 * The kit to load, from a bar and which slots this gym has.
 *
 * Shaped exactly like `PlateKit` from `plates.ts`, so `loadBar` — already
 * tested against the standard rack — works unchanged against a gym missing
 * some plates.
 */
export function calculatorKit(input: {
  readonly unit: CalculatorUnit;
  readonly bar: BarId;
  readonly ezBarWeight: EzBarWeight;
  readonly availableSlots: ReadonlySet<PlateSlot>;
}): PlateKit {
  const plates = PLATE_SLOTS.filter((slot) => input.availableSlots.has(slot)).map((slot) =>
    slotValue(slot, input.unit),
  );
  return {
    unit: input.unit,
    bar: barWeight(input.bar, input.unit, input.ezBarWeight),
    plates,
  };
}

/**
 * What to put on each side, from a target weight — the calculator's own
 * entry point, wrapping `loadBar` with this screen's kit-building.
 */
export function loadCalculatorBar(
  target: number,
  input: {
    readonly unit: CalculatorUnit;
    readonly bar: BarId;
    readonly ezBarWeight: EzBarWeight;
    readonly availableSlots: ReadonlySet<PlateSlot>;
  },
): Loading {
  return loadBar(target, calculatorKit(input));
}

/**
 * Whether one side's plates, plus the collar that always sits outside them,
 * fit the bar's loadable sleeve.
 *
 * Millimetres, not pixels — this is a fact about the equipment the sprites
 * were built from (see `sizes.md`), so it holds regardless of how large the
 * card draws the bar. A `false` here is what tells the screen to show a
 * message instead of a drawing that runs off the end of the sleeve.
 */
export function sleeveFits(perSide: readonly number[], unit: CalculatorUnit, bar: BarId): boolean {
  const platesMm = perSide.reduce(
    (sum, value) => sum + PLATE_THICKNESS_MM[slotForValue(value, unit)],
    0,
  );
  return platesMm + COLLAR_THICKNESS_MM <= BAR_SPECS[bar].sleeveUsableMm + 1e-6;
}
