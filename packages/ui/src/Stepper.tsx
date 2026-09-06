import { useId } from 'react';
import { cx } from './cx.js';

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

  const clamp = (next: number): number => Math.min(max, Math.max(min, next));
  const show = (n: number): string => n.toFixed(decimals);

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
            onChange(clamp(round(value - step, decimals)));
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
          value={show(value)}
          onChange={(event) => {
            const parsed = Number(event.target.value.replace(',', '.'));
            // An unparseable value leaves the number alone rather than
            // becoming NaN, which would render as "NaN" and save as 0.
            if (Number.isFinite(parsed)) onChange(clamp(parsed));
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
            onChange(clamp(round(value + step, decimals)));
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
