import { useId, type ReactNode } from 'react';
import { cx } from '@g7m/ui';

/**
 * A section of a screen in Home's card shell (ADR-0124): the large corner,
 * a small label over a title, and room on the right for a figure.
 *
 * All cards share neutral surfaces and borders. Primary actions and selected
 * controls carry the accent; the existing tone prop remains source-compatible.
 */
export function Panel({
  eyebrow,
  title,
  header,
  aside,
  id,
  className,
  label,
  children,
}: {
  /** The small uppercase line over the title. Left out when the title says it all. */
  readonly eyebrow?: string;
  /** The title, as the section's heading. Or `header` instead, with `label`. */
  readonly title?: ReactNode;
  /**
   * A header that is not a heading: the chart's view picker, which is a
   * button, and a button inside a heading is read out as neither.
   */
  readonly header?: ReactNode;
  /** The section's name, read out, when `header` replaces the title. */
  readonly label?: string;
  /** The figure or control on the right of the title. */
  readonly aside?: ReactNode;
  readonly tone?: 'hero' | 'quiet';
  readonly id?: string;
  readonly className?: string;
  readonly children: ReactNode;
}) {
  const heading = useId();
  return (
    <section
      id={id}
      aria-labelledby={title === undefined ? undefined : heading}
      aria-label={title === undefined ? label : undefined}
      className={cx(
        // Not overflow-hidden: the chart's view picker opens a menu below the
        // card, and clipping would cut it off. The card must not clip its menu.
        'relative isolate rounded-sheet border bg-surface p-4',
        'border-subtle',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {header}
          {eyebrow !== undefined && (
            <p className="text-[11px] leading-4 font-semibold tracking-[0.08em] text-muted uppercase">
              {eyebrow}
            </p>
          )}
          {title !== undefined && (
            <h2 id={heading} className="text-lg leading-6 font-semibold text-primary">
              {title}
            </h2>
          )}
        </div>
        {aside !== undefined && <div className="shrink-0 text-right">{aside}</div>}
      </div>
      {children}
    </section>
  );
}
