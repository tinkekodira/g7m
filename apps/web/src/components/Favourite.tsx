import { Button } from '@g7m/ui';
import { StarIcon } from './icons.js';

/**
 * The star after a favourite's name in a list (ADR-0108).
 *
 * After the name, not before it, so a column of names still starts in one
 * line and the eye reads the name first. Gold, like the leaderboard's crown:
 * the one warm mark in a row of greys, and not the accent, which means "press
 * this". Screen readers hear "(favourite)" after the name, the way the tab
 * bar says "(needs attention)".
 */
export function FavouriteMark() {
  return (
    <>
      <StarIcon
        fill="currentColor"
        className="ml-1.5 inline size-4 shrink-0 align-[-2px] text-warning"
        data-testid="favourite-star"
      />
      <span className="sr-only">(favourite)</span>
    </>
  );
}

/**
 * Star or unstar the exercise on its own page.
 *
 * A toggle with one label, so a screen reader says "Favourite, pressed" or
 * "Favourite, not pressed" rather than reading a label that flips between an
 * action and a state. On screen the star fills and turns gold.
 */
export function FavouriteButton({
  favourite,
  disabled,
  onToggle,
}: {
  readonly favourite: boolean;
  readonly disabled: boolean;
  readonly onToggle: () => void;
}) {
  return (
    <Button
      variant="secondary"
      aria-pressed={favourite}
      disabled={disabled}
      onClick={onToggle}
      className="shrink-0"
    >
      <StarIcon
        fill={favourite ? 'currentColor' : 'none'}
        className={favourite ? 'size-5 text-warning' : 'size-5 text-muted'}
      />
      Favourite
    </Button>
  );
}
