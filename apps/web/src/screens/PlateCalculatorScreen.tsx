import { useState } from 'react';
import { KG_KIT, LB_KIT, loadBar, plateLook, type PlateKit, type UnitSystem } from '@g7m/core';
import { Stepper } from '@g7m/ui';
import { HeaderLink } from '../components/HeaderLink.js';
import { PlateStack } from '../components/PlateStack.js';
import { useCatalogue } from '../lib/db/use-catalogue.js';

/**
 * What to put on the bar, as a picture of the bar.
 *
 * The arithmetic has been in `loadBar` since the logger needed it, and the
 * logger shows it as a line of text under a set. This is the same answer at the
 * size somebody uses it: type the weight, see the bar.
 *
 * It lives under Learn rather than in the logger because it is the thing you
 * reach for when you are *not* mid-set — setting up, or settling an argument
 * about what 142.5 looks like. The logger already tells you during a set.
 *
 * ## Barbells only
 *
 * A loadable dumbbell was here and is gone. Almost nobody trains on one: a rack
 * of fixed dumbbells needs no calculator, and a screen offering a mode that
 * answers a question nobody asked costs every user a decision on the way in.
 */

/** Where the stepper opens, in each kit's own unit. */
const OPENING = { kg: 60, lb: 135 } as const;

export function PlateCalculatorScreen() {
  const profile = useCatalogue('profile', (r) => r.profile.current());
  const unitSystem: UnitSystem = profile.data?.unitSystem ?? 'metric';
  const kit: PlateKit = unitSystem === 'imperial' ? LB_KIT : KG_KIT;

  /** Null until the kit is known, then whatever was typed. */
  const [weight, setWeight] = useState<number | null>(null);
  const target = weight ?? OPENING[kit.unit];

  // A bar only reaches weights the smallest plate can make in pairs, one plate
  // on each end, so that pair is the step. Anything finer would offer numbers
  // the kit cannot load.
  const smallest = kit.plates[kit.plates.length - 1] ?? 1.25;
  const loading = loadBar(target, kit);

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
          suffix={kit.unit}
          onChange={setWeight}
        />

        {/* Edge to edge inside the card. A barbell is a wide object and every
            millimetre of width is a millimetre of plate. */}
        <div className="-mx-4 mt-4">
          <PlateStack loading={loading} unit={kit.unit} />
        </div>

        {loading.kind === 'plates' ? (
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
              on a {trim(loading.bar)} {kit.unit} bar
            </span>
          </p>
        ) : (
          <p className="mt-3 text-sm text-secondary">
            {loading.kind === 'bar_only'
              ? `Just the bar — ${trim(loading.bar)} ${kit.unit}, nothing on it.`
              : `Lighter than the bar on its own, which is ${trim(loading.bar)} ${kit.unit}.`}
          </p>
        )}
      </section>

      <PlateKey kit={kit} />

      <p className="pb-4 text-xs text-muted">
        The discs are at their real sizes relative to each other, but spread further apart along the
        bar than they really sit — four 25s at true thickness are one red smear.
      </p>
    </main>
  );
}

/**
 * The kit, as a row of discs.
 *
 * This is the Learn section, and the colour code is the thing worth learning:
 * once red-is-25 and blue-is-20 are known, a loaded bar is readable across the
 * room without counting anything. It doubles as the legend for the bar above,
 * which is why it is a row of the real discs rather than a table.
 */
function PlateKey({ kit }: { readonly kit: PlateKit }) {
  return (
    <section className="rounded-card border border-subtle bg-surface p-4">
      <h2 className="text-base font-semibold text-primary">The colours</h2>
      <p className="mt-0.5 text-sm text-muted">Which disc is which, on the bar and on the rack.</p>
      <ul className="mt-3 flex flex-wrap items-center gap-2">
        {kit.plates.map((size) => {
          const look = plateLook(size, kit.unit);
          // Real relative diameters, floored so the smallest still holds
          // "1.25" legibly, and capped so all seven fit one row on a phone.
          const px = Math.round(22 + (look.diameterMm / 450) * 16);
          return (
            <li key={size}>
              <span
                className="numeric flex items-center justify-center rounded-full text-[0.625rem] font-semibold"
                style={{
                  width: `${String(px)}px`,
                  height: `${String(px)}px`,
                  backgroundColor: look.colour,
                  color: look.ink,
                  // The plates' own darker tone, so a black 5 still has an edge
                  // against a dark page and a chrome one against a light page.
                  boxShadow: `inset 0 0 0 1px ${look.shade}`,
                }}
              >
                {trim(size)}
                <span className="sr-only"> {kit.unit}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** 25, 2.5, 1.25 — no trailing zeros on a plate. */
function trim(size: number): string {
  return String(Math.round(size * 100) / 100);
}
