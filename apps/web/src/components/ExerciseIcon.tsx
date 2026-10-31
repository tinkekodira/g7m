import { cx } from '@g7m/ui';
import { DumbbellIcon } from './icons.js';
import { exerciseIconArt } from './exercise-icon-art.js';

/**
 * The square in front of an exercise's name.
 *
 * Each catalogue exercise has its own illustration. These thumbnails are
 * independent of the equipment heroes on detail pages. Unknown exercises
 * keep the same square with the app's dumbbell glyph so row text still aligns.
 *
 * Ordinary artwork sits on a neutral elevated surface. Browse supplies its
 * meaningful muscle-category tint through the existing row styles.
 */

/** 56px, the size the Home tiles' squares are built from, one step up. */
const BOX = 'size-14';

export function ExerciseIcon({
  slug,
  className,
}: {
  /** The exercise's slug, which is what the map is keyed by. */
  readonly slug: string;
  readonly className?: string;
}) {
  const art = exerciseIconArt(slug);

  return (
    <span
      // Decorative: the exercise's name is immediately beside it and says the
      // same thing, as with every other icon in the app.
      aria-hidden
      className={cx(
        'flex shrink-0 items-center justify-center rounded-control bg-elevated p-1.5',
        BOX,
        className,
      )}
    >
      {art === null ? (
        <DumbbellIcon className="size-6 text-secondary" />
      ) : (
        // Contain the full pose and equipment without clipping either.
        <img src={art} alt="" width={56} height={56} className="size-full object-contain" />
      )}
    </span>
  );
}
