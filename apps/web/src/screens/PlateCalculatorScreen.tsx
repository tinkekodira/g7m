import { useState } from 'react';
import {
  DUMBBELL_KG_KIT,
  DUMBBELL_LB_KIT,
  KG_KIT,
  LB_KIT,
  loadBar,
  plateLook,
  type PlateKit,
  type UnitSystem,
} from '@g7m/core';
import { Chip, Stepper } from '@g7m/ui';
import { HeaderLink } from '../components/HeaderLink.js';
import { PlateStack } from '../components/PlateStack.js';
import { useCatalogue } from '../lib/db/use-catalogue.js';

/**
 * What to put on the bar, as a picture.
 *
 * The arithmetic has been in `loadBar` since the logger needed it, and the
 * logger shows it as a line of text under a set. This is the same answer at the
 * size somebody uses it: type the weight, see the discs.
 *
 * It lives under Learn rather than in the logger because it is the thing you
 * reach for when you are *not* mid-set — setting up, or working out whether the
 * gym's dumbbells can even make the number you want. The logger already tells
 * you during a set, and neither should be the only one.
 *
 * ## Barbell or dumbbell
 *
 * The same greedy loading on a different kit. A dumbbell handle is a very short
 * bar that weighs a couple of kilograms, and the big plates do not fit on it —
 * so the interesting answer is often that the weight cannot be made at all,
 * which is exactly what somebody wants to know before they load it.
 */

type Equipment = 'barbell' | 'dumbbell';

const EQUIPMENT: readonly { readonly kind: Equipment; readonly label: string }[] = [
  { kind: 'barbell', label: 'Barbell' },
  { kind: 'dumbbell', label: 'Dumbbell' },
];

const NOUNS: Record<Equipment, string> = { barbell: 'bar', dumbbell: 'handle' };

/** Where the stepper starts, per kit, in that kit's own unit. */
const OPENING: Record<Equipment, { readonly kg: number; readonly lb: number }> = {
  barbell: { kg: 60, lb: 135 },
  dumbbell: { kg: 20, lb: 45 },
};

function kitFor(equipment: Equipment, unitSystem: UnitSystem): PlateKit {
  if (equipment === 'dumbbell') {
    return unitSystem === 'imperial' ? DUMBBELL_LB_KIT : DUMBBELL_KG_KIT;
  }
  return unitSystem === 'imperial' ? LB_KIT : KG_KIT;
}

export function PlateCalculatorScreen() {
  const profile = useCatalogue('profile', (r) => r.profile.current());
  const unitSystem: UnitSystem = profile.data?.unitSystem ?? 'metric';

  const [equipment, setEquipment] = useState<Equipment>('barbell');
  /** Null until a kit is known, then the opening weight for that kit. */
  const [weight, setWeight] = useState<number | null>(null);

  const kit = kitFor(equipment, unitSystem);
  const opening = OPENING[equipment][kit.unit];
  const target = weight ?? opening;

  // A bar only reaches weights the smallest plate can make in pairs, one plate
  // on each end, so that pair is the step. Anything finer would offer numbers
  // the kit cannot load.
  const smallest = kit.plates[kit.plates.length - 1] ?? 1.25;
  const step = smallest * 2;

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

      <div className="flex gap-2" role="group" aria-label="Equipment">
        {EQUIPMENT.map((option) => (
          <Chip
            key={option.kind}
            selected={equipment === option.kind}
            onClick={() => {
              setEquipment(option.kind);
              // Back to that kit's own opening weight. Carrying 140 kg over to
              // a dumbbell would show "lighter than nothing can make" as the
              // first thing the mode ever says.
              setWeight(null);
            }}
          >
            {option.label}
          </Chip>
        ))}
      </div>

      <section className="rounded-card border border-subtle bg-surface p-4">
        <Stepper
          label={equipment === 'barbell' ? 'Weight on the bar' : 'Weight of one dumbbell'}
          value={target}
          step={step}
          min={0}
          decimals={1}
          suffix={kit.unit}
          onChange={setWeight}
        />

        <div className="mt-4">
          <PlateStack loading={loading} unit={kit.unit} noun={NOUNS[equipment]} />
        </div>

        {loading.kind === 'plates' && (
          <>
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
                on a {trim(loading.bar)} {kit.unit} {NOUNS[equipment]}
              </span>
            </p>

            {/*
              The number the kit can actually make, where it is not the number
              asked for. On a barbell this never fires — the stepper moves in
              pairs of the smallest plate — but a dumbbell handle with no 1.25s
              under 2.5 misses constantly, and a rack has a 14 kg that a handle
              cannot build.
            */}
            {loading.short > 0 && (
              <p className="mt-2 rounded-control border border-warning/40 bg-warning/10 p-3 text-sm text-primary">
                A {NOUNS[equipment]} with these plates cannot make {trim(target)} {kit.unit}. The
                closest under it is{' '}
                <span className="numeric font-semibold">
                  {trim(loading.total)} {kit.unit}
                </span>
                , which is {trim(loading.short)} {kit.unit} short.
              </p>
            )}
          </>
        )}
      </section>

      <PlateKey kit={kit} />

      <p className="pb-4 text-xs text-muted">
        One end is drawn; the other is the same. The discs are at their real sizes relative to each
        other, but spread further apart along the bar than they really sit — four 25s at true
        thickness are one red smear.
      </p>
    </main>
  );
}

/**
 * The kit, as a row of discs.
 *
 * This is the Learn section, and the colour code is the thing worth learning:
 * once red-is-25 and blue-is-20 are known, a loaded bar is readable across the
 * room without counting anything. It doubles as the legend for the drawing
 * above, which is why it is a row of the real discs rather than a table.
 */
function PlateKey({ kit }: { readonly kit: PlateKit }) {
  return (
    <section className="rounded-card border border-subtle bg-surface p-4">
      <h2 className="text-base font-semibold text-primary">The colours</h2>
      <p className="mt-0.5 text-sm text-muted">
        The competition code, which is what is painted on the plates.
      </p>
      {/* The number is on the disc, so there is no caption under it. A row of
          discs with their weights on them is what the rack looks like; the same
          row with "25 kg" repeated underneath is a table pretending to be one,
          and it wrapped the smallest plate onto a line of its own. */}
      <ul className="mt-3 flex flex-wrap items-center gap-2">
        {kit.plates.map((size) => {
          const look = plateLook(size, kit.unit);
          // Real relative diameters, floored so the smallest still holds
          // "1.25" legibly, and capped so all seven fit one row on a phone.
          const px = Math.round(22 + (look.diameterMm / 450) * 16);
          return (
            <li key={size}>
              <span
                className="numeric flex items-center justify-center rounded-full border border-subtle text-[0.625rem] font-semibold"
                style={{
                  width: `${String(px)}px`,
                  height: `${String(px)}px`,
                  backgroundColor: look.colour,
                  color: look.ink,
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
