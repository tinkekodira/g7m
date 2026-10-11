import { PLATE_SLOTS, PLATE_SLOT_LOOK, slotValue, type CalculatorUnit } from '@g7m/core';
import { usePlateSettingsStore } from '../lib/use-plate-settings.js';

/**
 * Which plates this gym has, one button per plate, kept on this device
 * (`use-plate-settings.ts`).
 *
 * Shown in two places — under the plate calculator, and in Settings — and both
 * read and write the same store, so a plate unticked in one is unticked in the
 * other the moment it is tapped.
 *
 * Stored per colour so it survives a switch between kg and lb — deselecting
 * red removes the 25 kg plate here and the 55 lb plate there, with nothing
 * to migrate. At least one plate has to stay selected, since a calculator
 * with none has nothing to say; the store already refuses to clear the last
 * one, and the hint below explains why a tap did nothing.
 */
export function PlatePicker({ unit }: { readonly unit: CalculatorUnit }) {
  const availableSlots = usePlateSettingsStore((s) => s.availableSlots);
  const toggleSlot = usePlateSettingsStore((s) => s.toggleSlot);
  const atMinimum = availableSlots.size <= 1;

  return (
    <>
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
    </>
  );
}

/** 25, 2.5, 1.25 — no trailing zeros on a plate. */
function trim(size: number): string {
  return String(Math.round(size * 100) / 100);
}
