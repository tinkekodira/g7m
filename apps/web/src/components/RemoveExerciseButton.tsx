import { TrashIcon } from './icons.js';

/**
 * Remove, in the corner of an exercise card in the workout — lifting or
 * cardio.
 *
 * Bordered rather than a grey underline: the old one was the same weight and
 * colour as a caption, which on a screen whose other controls are all filled
 * or outlined read as a label rather than as something to press — the same
 * fault HeaderLink was built to fix. Red, with a bin, so it never passes for
 * just another control; it takes everything logged on the card with it.
 */
export function RemoveExerciseButton({
  disabled,
  onClick,
}: {
  readonly disabled: boolean;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex min-h-tap shrink-0 items-center gap-1.5 rounded-control border border-danger/60 bg-elevated px-3 text-sm font-medium text-destructive select-none active:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50"
    >
      <TrashIcon className="size-4" />
      Remove
    </button>
  );
}
