import { useLayoutEffect, useRef, useState } from 'react';
import { cx } from './cx.js';

export interface SegmentedOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

/**
 * `solid` fills the choice with the accent: the control is the screen's main
 * input. `quiet` tints it instead, for a form whose one solid accent block is
 * the button that sends it (the challenge card). Quiet is also 48px tall over
 * all rather than 58, so it lines up with a Button beside it.
 */
export type SegmentedVariant = 'solid' | 'quiet';

export interface SegmentedControlProps<T extends string> {
  readonly options: readonly SegmentedOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  /** Names the group for a screen reader — "Period", "Weight unit". */
  readonly label: string;
  readonly disabled?: boolean;
  readonly variant?: SegmentedVariant;
  readonly className?: string;
}

/** Where the highlight sits, measured from the chosen option's own box. */
interface Indicator {
  readonly left: number;
  readonly width: number;
}

const trackClasses: Record<SegmentedVariant, string> = {
  solid: 'rounded-full border border-subtle bg-input',
  // Concentric with the highlight: its radius plus the 4px it is inset by.
  quiet: 'rounded-[calc(var(--radius-control)+4px)] bg-input',
};

const indicatorClasses: Record<SegmentedVariant, string> = {
  solid: 'rounded-full bg-accent',
  quiet: 'rounded-control bg-accent-subtle ring-1 ring-accent/60 ring-inset',
};

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
 *
 * It takes its place and width from the chosen option itself. Options share
 * the track equally while their labels fit, but a label wider than its share
 * ("Workouts" in a quarter of a phone) widens its option, and a highlight
 * sized as 1/n of the track then spilled past the label.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  disabled = false,
  variant = 'solid',
  className,
}: SegmentedControlProps<T>) {
  const track = useRef<HTMLDivElement | null>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState<Indicator | null>(null);
  const chosen = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  useLayoutEffect(() => {
    const measure = (): void => {
      const button = buttons.current[chosen];
      // Nothing laid out (a test DOM, a hidden tab): keep the even split.
      if (button === null || button === undefined || button.offsetWidth === 0) return;
      setIndicator({ left: button.offsetLeft, width: button.offsetWidth });
    };
    measure();
    if (typeof ResizeObserver === 'undefined' || track.current === null) return;
    // The width changes with the screen and when a font arrives late.
    const observer = new ResizeObserver(measure);
    observer.observe(track.current);
    return () => {
      observer.disconnect();
    };
  }, [chosen, options.length]);

  const move = (to: number): void => {
    const index = (to + options.length) % options.length;
    const option = options[index];
    if (option === undefined) return;
    onChange(option.value);
    buttons.current[index]?.focus();
  };

  const quiet = variant === 'quiet';

  return (
    <div
      ref={track}
      role="radiogroup"
      aria-label={label}
      aria-disabled={disabled || undefined}
      className={cx('relative flex p-1', trackClasses[variant], className)}
    >
      <span
        aria-hidden
        className={cx(
          'absolute inset-y-1 left-0 transition-[transform,width] duration-300 ease-out',
          indicatorClasses[variant],
        )}
        style={
          indicator === null
            ? {
                width: `calc((100% - 0.5rem) / ${String(options.length)})`,
                transform: `translateX(calc(0.25rem + ${String(chosen * 100)}%))`,
              }
            : { width: indicator.width, transform: `translateX(${String(indicator.left)}px)` }
        }
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
              'relative z-10 flex flex-1 items-center justify-center px-1',
              'text-sm font-medium whitespace-nowrap select-none transition-colors duration-200',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
              'disabled:cursor-not-allowed',
              quiet
                ? // 40px drawn, 48px to the finger: the hit area reaches over
                  // the track's 4px padding above and below (Brief §8).
                  "min-h-10 rounded-control before:absolute before:inset-x-0 before:-inset-y-1 before:content-['']"
                : 'min-h-tap rounded-full',
              selected
                ? quiet
                  ? 'text-primary'
                  : 'text-on-accent'
                : quiet
                  ? 'text-muted hover:text-secondary'
                  : 'text-secondary hover:text-primary',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
