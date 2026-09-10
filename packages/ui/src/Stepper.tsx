import { useEffect, useId, useRef, useState } from 'react';
import { cx } from './cx.js';
import { repeatDelay } from './hold-repeat.js';
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
 *
 * ## Holding a button repeats it
 *
 * Twenty-five taps to take a set of reps from 5 to 30 is the kind of thing an
 * app makes somebody do once before they stop logging accessories properly.
 * The schedule — wait, then accelerate to a floor — is in `hold-repeat.ts`.
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

  /**
   * The current value, readable from inside a running timer.
   *
   * A held button repeats from a `setTimeout`, and the closure it runs in was
   * built on the render that started the hold. Reading `value` there would add
   * the step to the same starting number for ever: hold `+` on 50 and every
   * repeat sets 52.5.
   */
  const latest = useRef(value);
  latest.current = value;

  /**
   * One step in a direction. True if the number actually moved.
   *
   * The answer is what stops a hold at the end of the range rather than
   * spinning against the limit — the button also goes disabled there, but a
   * timer already running does not care.
   */
  const stepBy = (direction: 1 | -1): boolean => {
    const next = clamp(round(latest.current + direction * step, decimals));
    if (next === latest.current) return false;

    setDraft(null);
    onChange(next);
    return true;
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
          onStep={() => stepBy(-1)}
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
          onStep={() => stepBy(1)}
        >
          +
        </StepButton>
      </div>
    </div>
  );
}

/**
 * A step button that keeps stepping while it is held.
 *
 * Pointer events do the holding and `click` is left for the keyboard: Enter
 * and Space on a focused button fire a click and no pointer events at all, so
 * dropping `onClick` would make the stepper mouse-only. A press therefore sets
 * a flag that the click handler consumes, or every touch would step twice.
 *
 * Stepping on `pointerdown` rather than on release is also what makes it feel
 * immediate on a phone, where `click` waits for the finger to lift.
 */
function StepButton({
  label,
  disabled,
  onStep,
  children,
}: {
  readonly label: string;
  readonly disabled: boolean;
  /** Steps once. False when the value is already at the end of its range. */
  readonly onStep: () => boolean;
  readonly children: string;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeats = useRef(0);
  /** Set by a press, consumed by the click that follows it. */
  const pressed = useRef(false);

  const stop = (): void => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    repeats.current = 0;
  };

  // A finger still down when the screen unmounts would otherwise leave a timer
  // stepping a number nobody is looking at.
  useEffect(() => stop, []);

  const queue = (): void => {
    timer.current = setTimeout(() => {
      repeats.current += 1;
      if (onStep()) queue();
      else stop();
    }, repeatDelay(repeats.current));
  };

  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onPointerDown={() => {
        pressed.current = true;
        if (onStep()) queue();
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      // A long press on a touchscreen otherwise offers to copy the button.
      onContextMenu={(event) => {
        event.preventDefault();
      }}
      onClick={() => {
        // Already handled by the press, unless this came from a keyboard.
        if (pressed.current) pressed.current = false;
        else onStep();
      }}
      className={cx(
        'flex size-tap shrink-0 items-center justify-center',
        'text-xl text-secondary select-none',
        // Without this a hold drags the page on a touchscreen instead.
        'touch-none',
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
