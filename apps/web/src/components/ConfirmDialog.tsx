import { useEffect, useId, useRef } from 'react';
import { Button } from '@g7m/ui';

/**
 * "Are you sure?", in the app rather than the browser's own box.
 *
 * For a destructive button that is easy to hit by accident — the exercise
 * card's Remove sits right where a thumb lands while scrolling back through
 * the workout. The browser's `confirm()` would do the asking, but on an
 * installed iPhone app it is a grey system sheet headed with the site's
 * address, and it cannot say which button is the dangerous one.
 *
 * Focus starts on Cancel, so a stray Enter or a second accidental tap keeps
 * things as they were. Escape and the backdrop cancel too.
 */
export function ConfirmDialog({
  title,
  detail,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  readonly title: string;
  readonly detail: string;
  readonly confirmLabel: string;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}) {
  const titleId = useId();
  const detailId = useId();
  const card = useRef<HTMLDivElement>(null);
  useEffect(() => {
    card.current?.querySelector('button')?.focus();
  }, []);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={detailId}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onCancel();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Tapping outside cancels. Hidden from assistive tech, which has the
          real Cancel and Escape; two buttons called Cancel is one too many. */}
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        onClick={onCancel}
        className="absolute inset-0 bg-base/70 backdrop-blur-sm"
      />
      <div
        ref={card}
        className="popup relative w-full max-w-sm rounded-card border border-subtle bg-surface p-5 shadow-floating"
      >
        <h2 id={titleId} className="text-xl font-semibold text-primary">
          {title}
        </h2>
        <p id={detailId} className="mt-2 text-sm text-secondary">
          {detail}
        </p>
        {/* Cancel first in the source, so it is the one that takes focus. */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
