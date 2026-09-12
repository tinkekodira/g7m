import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from './cx.js';

export interface SwitchProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onChange' | 'role' | 'aria-checked' | 'children'
> {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  /** What the setting is called. The whole row is the control, so this names it. */
  readonly label: ReactNode;
  /** One line under the name, for what it does. */
  readonly description?: ReactNode;
  /** Drawn before the label. Decorative. */
  readonly icon?: ReactNode;
}

/**
 * An on/off setting, as a whole row.
 *
 * The row is the button rather than the little track at its end. A 52 × 32
 * pill is under the 48px tap target from Brief §8 in one direction and easy to
 * miss in the other; a row is neither, and it is how every settings screen on
 * a phone already behaves.
 *
 * `role="switch"` with `aria-checked`, so a screen reader says "Dark mode,
 * switch, on" rather than reading a button with no state.
 */
export function Switch({
  checked,
  onChange,
  label,
  description,
  icon,
  className,
  disabled,
  type = 'button',
  ...rest
}: SwitchProps) {
  return (
    <button
      type={type}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => {
        onChange(!checked);
      }}
      className={cx(
        'flex min-h-tap w-full items-center gap-3 rounded-control text-left select-none',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...rest}
    >
      {icon}
      <span className="min-w-0 flex-1">
        <span className="block text-base font-medium text-primary">{label}</span>
        {description !== undefined && (
          <span className="mt-0.5 block text-sm text-muted">{description}</span>
        )}
      </span>
      <span
        aria-hidden
        className={cx(
          'relative inline-flex h-8 w-13 shrink-0 items-center rounded-full',
          'transition-colors duration-200 ease-out',
          checked ? 'bg-accent' : 'bg-strong',
        )}
      >
        <span
          className={cx(
            'inline-block size-6 rounded-full bg-primary shadow-sm',
            'transition-transform duration-200 ease-out',
            checked ? 'translate-x-6' : 'translate-x-1',
          )}
        />
      </span>
    </button>
  );
}
