/**
 * Where each sprite sits, in pixels — carried over from
 * `3d-models/plate-calculator/out/manifest.json`.
 *
 * Layout constants, not domain facts, which is why they live beside the
 * sprites rather than in `@g7m/core`: `plate-calculator.ts` in core knows a
 * plate is 76 mm thick because that is true of the equipment; this file knows
 * it is 73.15 px wide in the render because that is true of one specific set
 * of images. A re-render at a different scale changes this file and nothing
 * else.
 *
 * Every sprite shares one canvas height (480) and one bar-axis row (240), so
 * every piece is drawn at the same y — see `how_to_stack` in the manifest.
 * World coordinates here are centred on the bar's middle (x = 0, y = 0 on the
 * axis), which is what makes the right half a plain horizontal mirror of the
 * left.
 */

export const CANVAS_HEIGHT = 480;
export const AXIS_ROW = 240;

export interface PlateSprite {
  readonly width: number;
  /** Where the bar axis crosses this plate's INNER edge, in the image's own pixels. */
  readonly anchorX: number;
  /** How far outward the next piece goes, in pixels — this plate's modelled thickness. */
  readonly advance: number;
}

/** Heaviest first, matching `PLATE_SLOTS` in `@g7m/core` — same rank, same art. */
export const PLATE_SPRITES: readonly PlateSprite[] = [
  { width: 198, anchorX: 135.57, advance: 73.15 }, // red   / 25 kg  / 55 lb
  { width: 180, anchorX: 122.72, advance: 65.45 }, // blue  / 20 kg  / 45 lb
  { width: 162, anchorX: 110.35, advance: 58.71 }, // yellow/ 15 kg  / 35 lb
  { width: 144, anchorX: 97.99, advance: 51.97 }, // green / 10 kg  / 25 lb
  { width: 128, anchorX: 87.1, advance: 46.2 }, // black / 5 kg   / 10 lb
  { width: 112, anchorX: 76.21, advance: 40.42 }, // darkGrey/2.5kg/5 lb
  { width: 96, anchorX: 65.32, advance: 34.65 }, // lightGrey/1.25kg/2.5lb
];

export const COLLAR_SPRITE: PlateSprite = { width: 68, anchorX: 54.89, advance: 28.87 };

export interface BarSprite {
  readonly shaftWidth: number;
  readonly shaftHeight: number;
  /** Half the shaft's own length — anchor to right_anchor, halved. */
  readonly shaftHalfLength: number;
  /** The shaft image's anchor, in its own local pixels (both ends are symmetric). */
  readonly shaftLocalAnchorX: number;
  readonly sleeveWidth: number;
  readonly sleeveHeight: number;
  /** The sleeve's anchor, in its own local pixels — butts the shaft's end. */
  readonly sleeveLocalAnchorX: number;
  /** Where the sleeve's own local pixels put the first (heaviest) plate. */
  readonly sleevePlateStartLocalX: number;
  /** The outer tip of the sleeve, in its own local pixels. */
  readonly sleeveLocalEndX: number;
}

export const BAR_SPRITES: Record<'bar_20' | 'bar_15' | 'bar_ez', BarSprite> = {
  bar_20: {
    shaftWidth: 1286,
    shaftHeight: 480,
    shaftHalfLength: 635.22,
    shaftLocalAnchorX: 7.78,
    sleeveWidth: 444,
    sleeveHeight: 480,
    sleeveLocalAnchorX: 431.75,
    sleevePlateStartLocalX: 407.69,
    sleeveLocalEndX: 8.27,
  },
  bar_15: {
    shaftWidth: 1286,
    shaftHeight: 480,
    shaftHalfLength: 635.22,
    shaftLocalAnchorX: 7.78,
    sleeveWidth: 352,
    sleeveHeight: 480,
    sleeveLocalAnchorX: 340.04,
    sleevePlateStartLocalX: 315.98,
    sleeveLocalEndX: 7.99,
  },
  bar_ez: {
    shaftWidth: 708,
    shaftHeight: 480,
    shaftHalfLength: 346.485,
    shaftLocalAnchorX: 7.52,
    sleeveWidth: 250,
    sleeveHeight: 480,
    sleeveLocalAnchorX: 238.51,
    sleevePlateStartLocalX: 214.45,
    sleeveLocalEndX: 7.52,
  },
};
