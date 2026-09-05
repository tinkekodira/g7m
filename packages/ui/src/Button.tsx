import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from './cx.js';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  /** Stretch to the container. Used for the primary action in a bottom sheet. */
  readonly fullWidth?: boolean;
  readonly children: ReactNode;
}

/**
 * Every size clears the 48x48px minimum tap target from Brief §8. That is a
 * floor, not a default — there is no `sm`, because a small button in a gym is
 * a missed tap with a barbell in your other hand.
 */
const sizeClasses: Record<ButtonSize, string> = {
  md: 'min-h-tap px-4 text-base',
  lg: 'min-h-14 px-6 text-lg',
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-on-accent hover:bg-accent-hover active:bg-accent-pressed ' +
    'disabled:bg-strong disabled:text-muted',
  secondary:
    'bg-elevated text-primary border border-subtle hover:border-strong ' +
    'active:bg-surface disabled:text-muted',
  ghost: 'bg-transparent text-secondary hover:bg-elevated active:bg-surface disabled:text-muted',
  danger:
    'bg-danger text-on-accent hover:brightness-110 active:brightness-95 disabled:bg-strong disabled:text-muted',
};

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex items-center justify-center gap-2',
        'rounded-control font-medium select-none',
        'transition-colors duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        'disabled:cursor-not-allowed',
        sizeClasses[size],
        variantClasses[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
