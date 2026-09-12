import { useRef } from 'react';
import { cx } from './cx.js';

export interface SegmentedOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

export interface SegmentedControlProps<T extends string> {
  readonly options: readonly SegmentedOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  /** Names the group for a screen reader — "Period", "Weight unit". */
  readonly label: string;
  readonly disabled?: boolean;
  readonly className?: string;
}

/**
 * One of a few, side by side, with the choice sliding between them.
 *
 * A radio group, not a row of buttons: the options are mutually exclusive and
 * a screen reader should say "Weekly, radio button, 1 of 3, checked". That
 * brings the keyboard contract with it — one tab stop for the group, arrows to
 * move within it — which is what `tabIndex` and `onKeyDown` are doing.
 *
 * The highlight is one element that moves, rather than a background on
 * whichever option is chosen. Swapping backgrounds reads as a flicker; moving
 * one reads as the choice travelling, which is what happened. Reduced motion
 * flattens the transition like everything else (tokens.css).
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  disabled = false,
  className,
}: SegmentedControlProps<T>) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const chosen = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  const move = (to: number): void => {
    const index = (to + options.length) % options.length;
    const option = options[index];
    if (option === undefined) return;
    onChange(option.value);
    buttons.current[index]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-disabled={disabled || undefined}
      className={cx('relative flex rounded-full border border-subtle bg-input p-1', className)}
    >
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 rounded-full bg-accent transition-transform duration-300 ease-out"
        style={{
          width: `calc((100% - 0.5rem) / ${String(options.length)})`,
          transform: `translateX(${String(chosen * 100)}%)`,
        }}
      />
      {options.map((option, index) => {
        const selected = index === chosen;
        return (
          <button
            key={option.value}
            ref={(element) => {
              buttons.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            disabled={disabled}
            onClick={() => {
              onChange(option.value);
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                event.preventDefault();
                move(index + 1);
              } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                event.preventDefault();
                move(index - 1);
              }
            }}
            className={cx(
              'relative z-10 flex min-h-tap flex-1 items-center justify-center rounded-full px-3',
              'text-sm font-medium whitespace-nowrap select-none transition-colors duration-200',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
              'disabled:cursor-not-allowed',
              selected ? 'text-on-accent' : 'text-secondary hover:text-primary',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
