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
 * One family, from a muted clay to a coral red, with the colour getting
 * richer rather than changing. Picked in OKLCH: lightness climbs a little
 * (0.54 to 0.63), hue turns from the skin's 50° to 27°, and chroma goes from
 * 0.06 to 0.20, rising late, so a middling muscle is terracotta and only the
 * hardest-worked are properly red. An even rise made everything trained look
 * the same red once the lights were on it.
 *
 * It replaced a yellow-to-red ramp that swung the hue 60° and went up in
 * lightness to the orange and back down to the red. Neighbouring muscles
 * jumped in both, so the figure looked like it had been painted in patches.
 * Before that it was browns into a peach, so close to the skin that a trained
 * muscle had to be looked for; the lightest step here is kept clearly redder
 * than the skin for that reason.
 */
const HOT = ['#8c654f', '#9b674d', '#b16445', '#cc5b3f', '#e94740'] as const;

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
 * so after a month of squats the abs carry a few percent of the peak. Painting
 * that would light the whole figure and leave nothing grey to read against.
 */
export const HEAT_FLOOR = 0.05;

/**
 * The colour for a muscle's share of the hardest-worked one's volume.
 *
 * Anything trained gets a hot colour, however little: rounding to the nearest
 * step used to send everything under an eighth of the peak back to skin, so a
 * muscle somebody did work read exactly like one they never touched.
 *
 * From the floor up the value slides along the hot steps, blending between
 * the two either side of it, rather than snapping to one. Two muscles with
 * nearly the same volume are then nearly the same colour, where steps put a
 * hard edge between them that said more about rounding than training.
 */
export function heatColour(value: number, closedSurface: boolean): string {
  const ramp = heatRampFor(closedSurface);
  if (!(value >= HEAT_FLOOR)) return ramp[0] ?? RESTING_SKIN;
  const hot = ramp.slice(1);
  const position = ((Math.min(1, value) - HEAT_FLOOR) / (1 - HEAT_FLOOR)) * (hot.length - 1);
  const below = Math.floor(position);
  const from = hot[below] ?? RESTING_SKIN;
  return mix(from, hot[below + 1] ?? from, position - below);
}

/** Two `#rrggbb` colours, `t` of the way from the first to the second. */
function mix(from: string, to: string, t: number): string {
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  let out = '#';
  for (let i = 0; i < 3; i += 1) {
    const value = Math.round(channel(from, i) + (channel(to, i) - channel(from, i)) * t);
    out += value.toString(16).padStart(2, '0');
  }
  return out;
}

/**
 * The colours a heat map runs through, coldest first, for a legend drawn
 * outside the canvas. The same arrays the viewer paints with, so the key can
 * never disagree with the body it explains.
 */
export function heatRampFor(closedSurface: boolean): readonly string[] {
  return closedSurface ? PALETTE.skinHeat : PALETTE.heat;
}
