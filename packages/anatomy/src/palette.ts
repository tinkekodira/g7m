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
  /** Heat map, cold to hot. */
  heat: ['#5c4a45', '#8a4a3c', '#bd5a3f', '#e2725b', '#f6b06a'] as const,

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
  skinHeat: [RESTING_SKIN, '#946a52', '#b8774b', '#d9854e', '#f2a463'] as const,
};

/**
 * The colours a heat map runs through, coldest first, for a legend drawn
 * outside the canvas. The same arrays the viewer paints with, so the key can
 * never disagree with the body it explains.
 */
export function heatRampFor(closedSurface: boolean): readonly string[] {
  return closedSurface ? PALETTE.skinHeat : PALETTE.heat;
}
