import { useEffect } from 'react';
import { Button } from '@g7m/ui';

/**
 * A few seconds to take back a deletion.
 *
 * Removing a set or an exercise used to be instant and permanent. Discarding a
 * whole workout asks first; deleting one exercise out of it did not — and the
 * Remove button was recently made more visible, which makes a mis-tap likelier
 * rather than rarer.
 *
 * A confirm dialog was the obvious fix and the wrong one. It would ask on every
 * removal, including the deliberate ones, and put a modal between a lifter and
 * a list they are tidying mid-workout. This asks nothing and offers a way back.
 *
 * Only one at a time. Removing twice in a row leaves the first deletion done —
 * the row is already gone from the database by then, not merely hidden — and
 * offers an undo for the second. That is the standard behaviour and it is worth
 * being explicit about: this is a short grace period, not a history.
 */

/**
 * Longer than the usual four or five. This is a way back from deleting
 * something, and a lifter mid-set is not watching the bottom of the screen.
 */
export const UNDO_SECONDS = 7;

export function UndoToast({
  token,
  message,
  onUndo,
  onExpire,
}: {
  /**
   * Changes when a different removal happens. The timer restarts with it —
   * without that, a second deletion would inherit whatever was left of the
   * first one's clock.
   */
  readonly token: number;
  readonly message: string;
  readonly onUndo: () => void;
  readonly onExpire: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onExpire, UNDO_SECONDS * 1000);
    return () => {
      clearTimeout(timer);
    };
  }, [token, onExpire]);

  return (
    // `polite`, not `assertive`: it interrupts nothing, and the removal it
    // describes has already happened.
    <div role="status" aria-live="polite" className="border-t border-subtle bg-elevated">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-3">
        <p className="min-w-0 text-sm text-secondary">{message}</p>
        <Button variant="secondary" onClick={onUndo}>
          Undo
        </Button>
      </div>
    </div>
  );
}
