import {
  AXIS_ROW,
  CANVAS_HEIGHT,
  COLLAR_SPRITE,
  PLATE_SPRITES,
  type BarSprite,
  type PlateSprite,
} from './sprite-geometry.js';

export interface PlacedImage {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface PlacedPlate extends PlacedImage {
  /** Index into `PLATE_SPRITES` / `PLATE_SLOTS` — which art and which colour. */
  readonly rank: number;
}

export interface BarLayout {
  /** The world x-extent from centre to the sleeve's outer tip. The viewBox half-width. */
  readonly halfWidth: number;
  readonly shaft: PlacedImage;
  readonly sleeve: PlacedImage;
  /** Innermost first — the order they were loaded, and the order to paint them. */
  readonly plates: readonly PlacedPlate[];
  readonly collar: PlacedImage;
}

/**
 * One side of a bar, in world pixels centred on the bar's middle.
 *
 * `ranks` is one side's plates, heaviest first — the same order `loadBar`
 * returns them in. Positions follow the manifest's own rule exactly: each
 * piece's anchor sits where the previous piece's anchor was, moved outward by
 * the previous piece's `advance`. The first plate anchors at the sleeve's own
 * `plate_start`, and the collar always follows the last piece placed —
 * whichever that is, plate or bare sleeve.
 */
export function layoutBar(bar: BarSprite, ranks: readonly number[]): BarLayout {
  const y = -AXIS_ROW;

  const shaft: PlacedImage = {
    x: -bar.shaftHalfLength - bar.shaftLocalAnchorX,
    y,
    width: bar.shaftWidth,
    height: bar.shaftHeight,
  };
  const sleeve: PlacedImage = {
    x: -bar.shaftHalfLength - bar.sleeveLocalAnchorX,
    y,
    width: bar.sleeveWidth,
    height: bar.sleeveHeight,
  };

  // World x of whichever anchor the next piece should butt against. Starts at
  // the sleeve's own plate_start, expressed in world coordinates.
  let nextAnchorX = -bar.shaftHalfLength - (bar.sleeveLocalAnchorX - bar.sleevePlateStartLocalX);

  const plates: PlacedPlate[] = ranks.map((rank) => {
    const sprite: PlateSprite | undefined = PLATE_SPRITES[rank];
    if (sprite === undefined) throw new RangeError(`No sprite for plate rank ${String(rank)}`);
    const placed: PlacedPlate = {
      x: nextAnchorX - sprite.anchorX,
      y,
      width: sprite.width,
      height: CANVAS_HEIGHT,
      rank,
    };
    nextAnchorX -= sprite.advance; // outward = more negative x
    return placed;
  });

  const collar: PlacedImage = {
    x: nextAnchorX - COLLAR_SPRITE.anchorX,
    y,
    width: COLLAR_SPRITE.width,
    height: CANVAS_HEIGHT,
  };

  const sleeveEndX = -bar.shaftHalfLength - (bar.sleeveLocalAnchorX - bar.sleeveLocalEndX);
  const halfWidth = Math.abs(sleeveEndX);

  return { halfWidth, shaft, sleeve, plates, collar };
}
