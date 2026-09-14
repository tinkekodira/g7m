import type { ReactNode } from 'react';

/**
 * A round arrow for stepping through time: the calendar's months, the
 * progress chart's weeks and months. A full tap target, with the icon small
 * inside it, and faded rather than hidden at the end of the line, so the
 * header does not shift when it runs out.
 */
export function StepArrow({
  label,
  disabled,
  onClick,
  children,
}: {
  readonly label: string;
  readonly disabled: boolean;
  readonly onClick: () => void;
  readonly children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-tap shrink-0 items-center justify-center rounded-full text-secondary select-none enabled:active:bg-elevated disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
    >
      {children}
    </button>
  );
}
