import { useEffect, useId, useState, type FormEvent } from 'react';
import { describeWhen, toDisplayWeight, type UnitSystem } from '@g7m/core';
import { Button, TextField } from '@g7m/ui';
import { useLogWeight } from '../lib/db/use-log-weight.js';
import { ScaleIcon } from './icons.js';

/**
 * Today's weight, from Profile, without going through Edit.
 *
 * Tapping the weight on Profile opens this from the bottom of the screen, where
 * the thumb already is, with the keyboard up and the last weight in the field
 * and selected. Typing replaces it; somebody who weighs the same taps Save.
 * Saving closes it, and the tile it came from shows the new number.
 */
export function WeighInSheet({
  unitSystem,
  currentKg,
  weightAt,
  now,
  onClose,
}: {
  readonly unitSystem: UnitSystem;
  readonly currentKg: number | null;
  readonly weightAt: Date | null;
  readonly now: Date;
  readonly onClose: () => void;
}) {
  const headingId = useId();
  const { log, busy } = useLogWeight(unitSystem);
  const shown = currentKg === null ? null : toDisplayWeight(currentKg, unitSystem);
  const unit = unitSystem === 'imperial' ? 'lb' : 'kg';
  const [draft, setDraft] = useState(shown === null ? '' : String(shown.value));
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    globalThis.addEventListener('keydown', onKey);
    return () => {
      globalThis.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  async function submit(event: FormEvent): Promise<void> {
    event.preventDefault();
    const failed = await log(draft);
    if (failed === null) onClose();
    else setProblem(failed);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="popup relative flex w-full max-w-2xl flex-col gap-5 rounded-t-sheet border-t border-subtle bg-surface px-5 pt-5 pb-safe-bottom shadow-floating"
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-card bg-accent/15 text-accent"
          >
            <ScaleIcon className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id={headingId} className="text-xl leading-7 font-semibold text-primary">
              Log your weight
            </h2>
            <p className="text-sm text-muted">
              {shown === null || weightAt === null
                ? 'The first point on your trend.'
                : `Last ${String(shown.value)} ${shown.unit} · ${describeWhen(weightAt, now)}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-tap shrink-0 items-center rounded-control px-3 text-sm font-medium text-secondary active:bg-elevated focus-visible:outline-2 focus-visible:outline-accent"
          >
            Cancel
          </button>
        </div>

        <form
          className="flex flex-col gap-4 pb-4"
          onSubmit={(event) => {
            void submit(event);
          }}
        >
          <TextField
            label={`Today’s weight (${unit})`}
            inputMode="decimal"
            enterKeyHint="done"
            autoComplete="off"
            // Opened by a tap, so the keyboard may come up with it; the last
            // weight is selected, so typing replaces it.
            autoFocus
            onFocus={(event) => {
              event.currentTarget.select();
            }}
            value={draft}
            error={problem ?? undefined}
            onChange={(event) => {
              setDraft(event.target.value);
              setProblem(null);
            }}
            className="numeric text-xl"
          />
          <Button type="submit" size="lg" fullWidth disabled={busy || draft.trim() === ''}>
            Save weight
          </Button>
        </form>
      </section>
    </div>
  );
}
