import { useId, useState } from 'react';
import { cx } from './cx.js';
import { displayed, typed } from './number-field.js';

export interface StepperProps {
  readonly label: string;
  readonly value: number;
  readonly step: number;
  readonly min?: number;
  readonly max?: number;
  /** Digits after the point. Weights need one, reps need none. */
  readonly decimals?: number;
  readonly suffix?: string;
  readonly disabled?: boolean;
  readonly onChange: (value: number) => void;
}

/**
 * A number with a minus and a plus, and the number itself editable.
 *
 * Both halves are needed and neither is enough. Tapping `+` five times to go
 * from 100 to 112.5 is absurd, and so is opening a keyboard to add one rep
 * with a bar in your other hand. So the buttons do the common change and the
 * field does the uncommon one.
 *
 * `inputMode="decimal"` rather than `type="number"`: a number input on iOS
 * brings up a keypad with no decimal point in several locales, and it silently
 * clears itself when the value is momentarily unparseable — which is every
 * keystroke of "0.5" after the first.
 *
 * ## While it has focus, the field belongs to the typist
 *
 * It used to be controlled straight from the number, and so could not be typed
 * into. Entering `5` put 5 in the parent, which came back as `"5.0"` — a
 * different string from the one in the box, so React rewrote the field and
 * dropped the caret at the end. The next digit made `"5.00"`, which parses to
 * 5, which renders `"5.0"`. The field could not reach 50.
 *
 * So a keystroke starts a draft, the draft is what shows, and it is cleared on
 * blur — and by the buttons, which are an edit from the other direction and
 * have to win. `number-field.ts` holds the rules and the tests.
 */
export function Stepper({
  label,
  value,
  step,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  decimals = 0,
  suffix,
  disabled = false,
  onChange,
}: StepperProps) {
  const id = useId();

  /** The typist's own text, while they are typing. Null the rest of the time. */
  const [draft, setDraft] = useState<string | null>(null);

  const clamp = (next: number): number => Math.min(max, Math.max(min, next));

  /** A change from the buttons, which also ends any draft the field is holding. */
  const commit = (next: number): void => {
    setDraft(null);
    onChange(clamp(round(next, decimals)));
  };

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-muted">
        {label}
        {suffix !== undefined && <span className="text-muted"> ({suffix})</span>}
      </label>

      <div className="flex items-stretch rounded-control border border-subtle bg-input">
        <StepButton
          label={`Decrease ${label}`}
          disabled={disabled || value <= min}
          onClick={() => {
            commit(value - step);
          }}
        >
          −
        </StepButton>

        <input
          id={id}
          inputMode="decimal"
          disabled={disabled}
          // Selected on focus, because the field is almost always being
          // replaced rather than edited — nobody moves the caret to change
          // 100 to 105 with one hand.
          onFocus={(event) => {
            event.target.select();
          }}
          value={displayed(draft, value, decimals)}
          onChange={(event) => {
            const next = typed(event.target.value, min, max);
            setDraft(next.draft);
            // Null while the box is empty or the number half-written, which
            // leaves the value alone rather than reporting NaN or a zero
            // nobody asked for.
            if (next.value !== null) onChange(next.value);
          }}
          // Formatting happens here and nowhere else: 5 becomes 5.0 when the
          // field is done being typed in, not while it is.
          onBlur={() => {
            setDraft(null);
          }}
          className={cx(
            'numeric min-w-0 flex-1 bg-transparent text-center text-lg text-primary',
            'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent',
            'disabled:text-muted',
          )}
        />

        <StepButton
          label={`Increase ${label}`}
          disabled={disabled || value >= max}
          onClick={() => {
            commit(value + step);
          }}
        >
          +
        </StepButton>
      </div>
    </div>
  );
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  readonly label: string;
  readonly disabled: boolean;
  readonly onClick: () => void;
  readonly children: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'flex size-tap shrink-0 items-center justify-center',
        'text-xl text-secondary select-none',
        'active:bg-elevated disabled:text-muted',
        'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent',
      )}
    >
      {children}
    </button>
  );
}

/** 2.5 + 2.5 is 5, not 5.000000000000001, which would render as typed. */
function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
