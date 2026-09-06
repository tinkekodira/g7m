import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from './cx.js';

export interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-pressed'> {
  /** Whether this chip is currently on. */
  readonly selected: boolean;
  readonly children: ReactNode;
}

/**
 * A filter toggle.
 *
 * A `button` with `aria-pressed`, not a checkbox and not a link. That is what a
 * screen reader needs to say "Chest, pressed" rather than reading a row of
 * words with no state, and it is the one part of a filter row that is easy to
 * get wrong and impossible to notice by looking.
 *
 * Still clears the 48px tap target from Brief §8 despite reading as a small
 * control: these sit in a scrolling row under a thumb, which is the worst case
 * for a near-miss.
 */
export function Chip({ selected, className, type = 'button', children, ...rest }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cx(
        'inline-flex min-h-tap shrink-0 items-center justify-center',
        'rounded-full px-4 text-sm font-medium whitespace-nowrap select-none',
        'transition-colors duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        selected
          ? 'bg-accent text-on-accent'
          : 'bg-elevated text-secondary border border-subtle hover:border-strong active:bg-surface',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
