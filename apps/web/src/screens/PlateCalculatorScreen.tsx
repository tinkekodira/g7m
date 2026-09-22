import { useState } from 'react';
import {
  BAR_IDS,
  PLATE_SLOTS,
  PLATE_SLOT_LOOK,
  barWeight,
  calculatorKit,
  loadCalculatorBar,
  sleeveFits,
  slotValue,
  type BarId,
  type CalculatorUnit,
  type EzBarWeight,
  type Loading,
  type PlateSlot,
  type UnitSystem,
} from '@g7m/core';
import { Stepper } from '@g7m/ui';
import { HeaderLink } from '../components/HeaderLink.js';
import { PlateStack } from '../components/PlateStack.js';
import { useCatalogue } from '../lib/db/use-catalogue.js';
import { usePlateSettingsStore } from '../lib/use-plate-settings.js';

/**
 * What to put on the bar, as a picture of the bar.
 *
 * The arithmetic has been in `loadBar` since the logger needed it, and the
 * logger shows it as a line of text under a set. This is the same answer at
 * the size somebody uses it: type the weight, see the bar.
 *
 * It lives under Learn rather than in the logger because it is the thing you
 * reach for when you are *not* mid-set — setting up, or settling an argument
 * about what 142.5 looks like. The logger already tells you during a set.
 *
 * ## Its own kit, not the logger's
 *
 * The logger assumes the standard rack, because guessing a lighter one
 * mid-set is worse than assuming the common one. This screen is the opposite
 * case — the calculator's whole job is to answer for a gym that is missing
 * something — so it carries its own bar and plate choices
 * (`@g7m/core`'s `plate-calculator.ts`), remembered on this device the same
 * way the theme is.
 *
 * ## Barbells only
 *
 * A loadable dumbbell was here and is gone. Almost nobody trains on one: a
 * rack of fixed dumbbells needs no calculator, and a screen offering a mode
 * that answers a question nobody asked costs every user a decision on the
 * way in.
 */

/** Where the stepper opens, in each unit. */
const OPENING: Record<CalculatorUnit, number> = { kg: 60, lb: 135 };

export function PlateCalculatorScreen() {
  const profile = useCatalogue('profile', (r) => r.profile.current());
  const unitSystem: UnitSystem = profile.data?.unitSystem ?? 'metric';
  const unit: CalculatorUnit = unitSystem === 'imperial' ? 'lb' : 'kg';

  const availableSlots = usePlateSettingsStore((s) => s.availableSlots);
  const ezBarWeightKg = usePlateSettingsStore((s) => s.ezBarWeightKg);
  const ezBarWeightLb = usePlateSettingsStore((s) => s.ezBarWeightLb);
  const setEzBarWeightKg = usePlateSettingsStore((s) => s.setEzBarWeightKg);
  const setEzBarWeightLb = usePlateSettingsStore((s) => s.setEzBarWeightLb);
  const ezBarWeight: EzBarWeight = { kg: ezBarWeightKg, lb: ezBarWeightLb };

  const [bar, setBar] = useState<BarId>('bar_20');

  /** Null until something was typed, then whatever it was. */
  const [weight, setWeight] = useState<number | null>(null);
  const target = weight ?? OPENING[unit];

  const kit = calculatorKit({ unit, bar, ezBarWeight, availableSlots });
  // A bar only reaches weights the smallest available plate can make in
  // pairs, one plate on each end, so that pair is the step. Anything finer
  // would offer numbers this gym's kit cannot load.
  const smallest = kit.plates[kit.plates.length - 1] ?? slotValue('lightGrey', unit);
  const loading: Loading = loadCalculatorBar(target, { unit, bar, ezBarWeight, availableSlots });
  const fits = loading.kind !== 'plates' || sleeveFits(loading.perSide, unit, bar);

  const hiddenCount = PLATE_SLOTS.length - availableSlots.size;

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-4 px-4 pt-safe-top pb-safe-bottom">
      <header className="flex items-start justify-between gap-3 pt-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-primary">Plate calculator</h1>
          <p className="mt-1 text-sm text-secondary">
            What goes on each end, at the sizes you will recognise.
          </p>
        </div>
        <HeaderLink to="/learn">Learn</HeaderLink>
      </header>

      <section className="rounded-card border border-subtle bg-surface p-4">
        <Stepper
          label="Weight on the bar"
          value={target}
          step={smallest * 2}
          min={0}
          decimals={1}
          suffix={unit}
          onChange={setWeight}
        />

        {/* Edge to edge inside the card. A barbell is a wide object and every
            millimetre of width is a millimetre of plate. */}
        <div className="-mx-4 mt-4">
          <PlateStack loading={loading} unit={unit} bar={bar} fits={fits} />
        </div>

        <BarPicker bar={bar} unit={unit} ezBarWeight={ezBarWeight} onChange={setBar} />

        {bar === 'bar_ez' && (
          <div className="mt-3">
            <Stepper
              label="This gym's EZ bar weighs"
              value={unit === 'kg' ? ezBarWeightKg : ezBarWeightLb}
              step={unit === 'kg' ? 0.5 : 1}
              min={1}
              max={50}
              decimals={unit === 'kg' ? 1 : 0}
              suffix={unit}
              onChange={unit === 'kg' ? setEzBarWeightKg : setEzBarWeightLb}
            />
          </div>
        )}

        <LoadingSummary loading={loading} unit={unit} fits={fits} />
      </section>

      <PlateKey availableSlots={availableSlots} unit={unit} />

      {hiddenCount > 0 && (
        <p className="text-sm text-secondary">
          {hiddenCount === 1 ? 'One plate is' : `${String(hiddenCount)} plates are`} hidden because
          your gym doesn&rsquo;t have {hiddenCount === 1 ? 'it' : 'them'}.{' '}
          <a
            href="#available-plates"
            className="font-medium text-accent underline underline-offset-2"
          >
            Change which plates your gym has
          </a>
          .
        </p>
      )}

      <p className="pb-4 text-xs text-muted">
        One end is drawn and mirrored; the other is the same. The plates are drawn to one shared
        cartoon scale rather than their real sizes, stacked the way they go on — biggest against the
        collar, small change outside. The collar is shown for shape; it doesn&rsquo;t add to the
        weight.
      </p>

      <AvailablePlates unit={unit} />
    </main>
  );
}

/** 20 kg / 15 kg / EZ bar, in the current unit. */
function BarPicker({
  bar,
  unit,
  ezBarWeight,
  onChange,
}: {
  readonly bar: BarId;
  readonly unit: CalculatorUnit;
  readonly ezBarWeight: EzBarWeight;
  readonly onChange: (bar: BarId) => void;
}) {
  return (
    <div className="mt-3" role="radiogroup" aria-label="Bar">
      <ul className="flex flex-wrap gap-2">
        {BAR_IDS.map((id) => {
          const selected = id === bar;
          const label =
            id === 'bar_ez' ? 'EZ bar' : `${trim(barWeight(id, unit, ezBarWeight))} ${unit}`;
          return (
            <li key={id}>
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  onChange(id);
                }}
                className={`min-h-tap rounded-full border px-4 text-sm font-medium transition-colors duration-150 ${
                  selected
                    ? 'border-accent bg-accent text-on-accent'
                    : 'border-subtle bg-elevated text-secondary hover:text-primary'
                }`}
              >
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** "Each end: 25 · 15" or why there is nothing to draw. */
function LoadingSummary({
  loading,
  unit,
  fits,
}: {
  readonly loading: Loading;
  readonly unit: CalculatorUnit;
  readonly fits: boolean;
}) {
  if (loading.kind === 'plates' && !fits) {
    return (
      <p className="mt-3 text-sm text-warning">
        That&rsquo;s more plate than this bar&rsquo;s sleeve can hold. Try fewer plates, a lighter
        weight, or a longer bar.
      </p>
    );
  }

  if (loading.kind !== 'plates') {
    return (
      <p className="mt-3 text-sm text-secondary">
        {loading.kind === 'bar_only'
          ? `Just the bar — ${trim(loading.bar)} ${unit}, nothing on it.`
          : `Lighter than the bar on its own, which is ${trim(loading.bar)} ${unit}.`}
      </p>
    );
  }

  return (
    <p className="mt-3 flex flex-wrap items-center gap-1.5 text-sm text-secondary">
      <span className="font-medium text-primary">Each end</span>
      {loading.perSide.map((size, index) => (
        <span
          key={`${String(index)}-${String(size)}`}
          className="numeric rounded-full border border-subtle bg-elevated px-2.5 py-0.5 font-medium text-primary"
        >
          {trim(size)}
        </span>
      ))}
      <span className="text-muted">
        on a {trim(loading.bar)} {unit} bar
        {loading.short > 0 &&
          ` — the closest these plates make is ${trim(loading.total)} ${unit}, ${trim(loading.short)} ${unit} short`}
      </span>
    </p>
  );
}

/**
 * The kit, as a row of discs — only the plates this gym actually has.
 *
 * This is the Learn section, and the colour code is the thing worth
 * learning: once red-is-25 and blue-is-20 are known, a loaded bar is
 * readable across the room without counting anything. It doubles as the
 * legend for the bar above, which is why a deselected plate disappears from
 * here too — a key naming a colour that never appears on this gym's bar
 * would be worse than no key.
 */
function PlateKey({
  availableSlots,
  unit,
}: {
  readonly availableSlots: ReadonlySet<PlateSlot>;
  readonly unit: CalculatorUnit;
}) {
  const slots = PLATE_SLOTS.filter((slot) => availableSlots.has(slot));

  return (
    <section className="rounded-card border border-subtle bg-surface p-4">
      <h2 className="text-base font-semibold text-primary">The colours</h2>
      <p className="mt-0.5 text-sm text-muted">Which disc is which, on the bar and on the rack.</p>
      <ul className="mt-3 flex flex-wrap items-center gap-2">
        {slots.map((slot) => {
          const look = PLATE_SLOT_LOOK[slot];
          const size = slotValue(slot, unit);
          return (
            <li key={slot}>
              <span
                className="numeric flex size-9 items-center justify-center rounded-full text-[0.625rem] font-semibold"
                style={{
                  backgroundColor: look.colour,
                  color: look.ink,
                  // The plate's own darker tone, so a black 5 still has an
                  // edge against a dark page and a light grey one against a
                  // light page.
                  boxShadow: `inset 0 0 0 1px ${look.shade}`,
                }}
              >
                {trim(size)}
                <span className="sr-only"> {unit}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * Which plates this gym has, kept on this device (`use-plate-settings.ts`).
 *
 * Stored per colour so it survives a switch between kg and lb — deselecting
 * red removes the 25 kg plate here and the 55 lb plate there, with nothing
 * to migrate. At least one plate has to stay selected, since a calculator
 * with none has nothing to say; the store already refuses to clear the last
 * one, and the hint below explains why a tap did nothing.
 */
function AvailablePlates({ unit }: { readonly unit: CalculatorUnit }) {
  const availableSlots = usePlateSettingsStore((s) => s.availableSlots);
  const toggleSlot = usePlateSettingsStore((s) => s.toggleSlot);
  const atMinimum = availableSlots.size <= 1;

  return (
    <section
      id="available-plates"
      className="scroll-mt-4 rounded-card border border-subtle bg-surface p-4"
    >
      <h2 className="text-base font-semibold text-primary">Available plates</h2>
      <p className="mt-0.5 text-sm text-muted">
        Which plates this gym has. A deselected plate is left out of the bar, the maths and the
        colours above.
      </p>
      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PLATE_SLOTS.map((slot) => {
          const selected = availableSlots.has(slot);
          const look = PLATE_SLOT_LOOK[slot];
          const size = slotValue(slot, unit);
          return (
            <li key={slot}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  toggleSlot(slot);
                }}
                className={`flex min-h-tap w-full items-center gap-2 rounded-control border px-3 text-left transition-opacity duration-150 ${
                  selected ? 'border-subtle bg-elevated' : 'border-subtle bg-input opacity-45'
                }`}
              >
                <span
                  aria-hidden
                  className="numeric flex size-7 shrink-0 items-center justify-center rounded-full text-[0.55rem] font-semibold"
                  style={{
                    backgroundColor: look.colour,
                    color: look.ink,
                    boxShadow: `inset 0 0 0 1px ${look.shade}`,
                  }}
                >
                  {trim(size)}
                </span>
                <span className="min-w-0 flex-1 text-sm font-medium text-primary">
                  {trim(size)} {unit}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {atMinimum && (
        <p role="status" className="mt-3 text-sm text-warning">
          Keep at least one plate selected.
        </p>
      )}
    </section>
  );
}

/** 25, 2.5, 1.25 — no trailing zeros on a plate. */
function trim(size: number): string {
  return String(Math.round(size * 100) / 100);
}
