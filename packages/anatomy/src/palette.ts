/**
 * The viewer's colours, in a module of their own.
 *
 * Separate from `AnatomyViewer.tsx` so a screen can draw a legend in the
 * viewer's own colours without importing the viewer. That file reaches
 * three.js and the react-three renderer at the top, and a static import of it
 * from a screen puts all of that into the first chunk every user downloads —
 * the mistake `anatomy-model.ts` records making once already. This file
 * imports nothing.
 */

/**
 * Skin with nothing to say about it.
 *
 * One colour, used as the resting tone in `explore` and as the cold end of the
 * heat ramp, because in both modes it means the same thing: this part of the
 * body is not what you are being shown. Two shades a few degrees apart said
 * that twice and made the figure look like two different bodies depending on
 * which chip was selected.
 *
 * Grey rather than the warmer clay it used to be. The resting colour is a
 * background — the whole job of both modes is that some of the figure is lit
 * and the rest is not — and pulling the red out of it widens the gap to the
 * orange without making the body any darker.
 */
export const RESTING_SKIN = '#6f6058';

/**
 * The heat map's hot end, least trained first.
 *
 * Yellow to red, getting more saturated as it goes, rather than the old run
 * of browns into a peach. Those sat within a few shades of the skin they were
 * painted on, so the figure read as one warm body with smudges instead of a
 * map: which muscles got the work was there, but you had to look for it. Now
 * a lightly trained muscle is a dull yellow, clearly not skin, and the
 * hardest-worked are a red that nothing else on the screen uses.
 */
const HOT = ['#bfa45a', '#e0b43c', '#ee8a2c', '#ec5226', '#e3161d'] as const;

export const PALETTE = {
  /** Resting muscle. Deep enough that the selection has somewhere to go. */
  muscle: '#a3453a',
  /** Muscles the taxonomy does not let you select. Present, not interactive. */
  inert: '#5c4a45',
  selected: '#f0663f',
  /** Tendon and aponeurosis, blended in on the tendon weight. */
  tendon: '#e6ddc9',
  /** Skull, hands, feet. Bone, and the reason a figure reads front from back. */
  bone: '#ded4bf',
  /** The bulk under the muscles, so gaps show body rather than background. */
  core: '#6d4a41',
  /** Heat map, cold to hot. The hot steps are `HOT`, from the untrained colour. */
  heat: ['#5c4a45', ...HOT] as const,

  /**
   * The same three colours again, for a sculpted skin.
   *
   * A closed surface is a different object from a bundle of muscle bellies and
   * cannot be painted like one. The deep red above is a muscle seen with the
   * skin taken off; put it on the skin itself and the figure reads as a
   * mannequin dipped in paint.
   *
   * Both start from `RESTING_SKIN`, which is the point: an unselected muscle
   * and an untrained one are the same statement, and they should not be two
   * colours.
   */
  skin: RESTING_SKIN,
  skinHeat: [RESTING_SKIN, ...HOT] as const,
};

/**
 * The value below which a muscle counts as untrained and stays skin.
 *
 * Stabilisers are credited a sliver of every heavy lift (`volumeByMuscle`),
 * so after a month of squats the abs carry a few percent of the peak. Painting that yellow would light the whole figure and leave nothing
 * grey to read against.
 */
export const HEAT_FLOOR = 0.05;

/**
 * The colour for a muscle's share of the hardest-worked one's volume.
 *
 * Anything trained gets a hot colour, however little: rounding to the nearest
 * step used to send everything under an eighth of the peak back to skin, so a
 * muscle somebody did work read exactly like one they never touched. The rest
 * of the range is split evenly across the hot steps, and only the top fifth
 * is the full red.
 */
export function heatColour(value: number, closedSurface: boolean): string {
  const ramp = heatRampFor(closedSurface);
  if (!(value >= HEAT_FLOOR)) return ramp[0] ?? RESTING_SKIN;
  const hot = ramp.length - 1;
  const step = Math.min(hot, 1 + Math.floor(Math.min(1, value) * hot));
  return ramp[step] ?? RESTING_SKIN;
}

/**
 * The colours a heat map runs through, coldest first, for a legend drawn
 * outside the canvas. The same arrays the viewer paints with, so the key can
 * never disagree with the body it explains.
 */
export function heatRampFor(closedSurface: boolean): readonly string[] {
  return closedSurface ? PALETTE.skinHeat : PALETTE.heat;
}
