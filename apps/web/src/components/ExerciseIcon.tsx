import { cx } from '@g7m/ui';
import { DumbbellIcon } from './icons.js';
import { equipmentArt } from './equipment-art.js';

/**
 * The square in front of an exercise's name.
 *
 * The art comes from `equipment-art.ts`, which the exercise's own page reads
 * too — one table, so a bench cannot have a square here and no hero there.
 *
 * ## Everything gets a container
 *
 * Fifty-three exercises are in the catalogue and one of them has a render, so
 * for a long while most rows will be the fallback. That fallback is the same
 * square with the app's own dumbbell glyph in it rather than a gap, because a
 * list where some rows indent and others do not reads as broken rather than as
 * incomplete. Every row keeps the same left edge from the first icon to the
 * last.
 *
 * ## The tint
 *
 * `bg-accent/15`, the same wash the Home tiles use for their accent tone.
 *
 * Decided by rendering all three candidates rather than by reasoning about
 * them, and the reasoning would have got it wrong. `bg-elevated` and white at
 * 8% are both a little lighter than the card and both lose the bench: the frame
 * is neutral black and grey, so against a neutral ground it separates by
 * luminance alone and the legs and base sink into it. The accent wash is warm,
 * so the same neutral frame separates by hue as well and holds its whole
 * silhouette — feet included.
 *
 * The cost is that accent is the app's "this one matters" colour, and here it
 * is on every row of a list of fifty-three. That is worth paying: on this
 * screen every row *is* the same kind of thing, so nothing is being
 * over-emphasised relative to its neighbours, and the tint is doing a legibility
 * job rather than a signalling one.
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
  const art = equipmentArt(slug);

  return (
    <span
      // Decorative: the exercise's name is immediately beside it and says the
      // same thing, as with every other icon in the app.
      aria-hidden
      className={cx(
        'flex shrink-0 items-center justify-center rounded-control bg-accent/15 p-1.5',
        BOX,
        className,
      )}
    >
      {art === null ? (
        <DumbbellIcon className="size-6 text-secondary" />
      ) : (
        // Contained, never cropped: these are renders of real objects and a
        // bench with its feet cut off is worse than a smaller bench.
        <img src={art.icon} alt="" className="size-full object-contain" />
      )}
    </span>
  );
}
