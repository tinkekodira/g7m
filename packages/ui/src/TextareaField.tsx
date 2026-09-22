import { useId, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cx } from './cx.js';

export interface TextareaFieldProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'id'
> {
  readonly label: string;
  /** Shown under the field, and announced to screen readers. */
  readonly error?: string | undefined;
  /** Quiet guidance, replaced by `error` when there is one. */
  readonly hint?: ReactNode;
}

/**
 * A labelled multi-line text input — `TextField`'s sibling for anything
 * longer than one line.
 */
export function TextareaField({
  label,
  error,
  hint,
  className,
  rows = 4,
  ...rest
}: TextareaFieldProps) {
  const id = useId();
  const describedBy =
    error !== undefined ? `${id}-error` : hint !== undefined ? `${id}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-secondary">
        {label}
      </label>

      <textarea
        id={id}
        rows={rows}
        aria-invalid={error !== undefined}
        aria-describedby={describedBy}
        className={cx(
          'w-full resize-none rounded-control bg-input px-3 py-2.5',
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
