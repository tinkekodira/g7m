import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cx } from './cx.js';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  readonly label: string;
  /** Shown under the field, and announced to screen readers. */
  readonly error?: string | undefined;
  /** Quiet guidance, replaced by `error` when there is one. */
  readonly hint?: ReactNode;
}

/**
 * A labelled text input.
 *
 * The label is always rendered, never a placeholder standing in for one — a
 * placeholder disappears the moment someone starts typing, which is exactly
 * when they are most likely to have forgotten which field they are in.
 */
export function TextField({ label, error, hint, className, ...rest }: TextFieldProps) {
  const id = useId();
  const describedBy =
    error !== undefined ? `${id}-error` : hint !== undefined ? `${id}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-secondary">
        {label}
      </label>

      <input
        id={id}
        aria-invalid={error !== undefined}
        aria-describedby={describedBy}
        className={cx(
          'min-h-tap w-full rounded-control bg-input px-3',
          'border text-base text-primary placeholder:text-muted',
          'transition-colors duration-150',
          'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent',
          'disabled:cursor-not-allowed disabled:text-muted',
          error === undefined ? 'border-subtle focus:border-strong' : 'border-danger',
          className,
        )}
        {...rest}
      />

      {error !== undefined && (
        <p id={`${id}-error`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {error === undefined && hint !== undefined && (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
