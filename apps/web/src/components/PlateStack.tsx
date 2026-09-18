import { BAR_LOOK, type Loading, type PlateKit } from '@g7m/core';
import plate25 from '../assets/plates/25kg.png';
import plate20 from '../assets/plates/20kg.png';
import plate15 from '../assets/plates/15kg.png';
import plate10 from '../assets/plates/10kg.png';
import plate5 from '../assets/plates/5kg.png';
import plate2 from '../assets/plates/2.5kg.png';
import plate1 from '../assets/plates/1.25kg.png';

/**
 * The loaded bar, drawn with g7m's own plate models.
 *
 * Both ends, mirrored, because a barbell is a thing somebody recognises at a
 * glance and half of one is a diagram.
 *
 * ## Seen from the side, not the front
 *
 * The models are rendered edge-on: a plate is a tall narrow disc with its rim
 * facing you, which is what a plate on a bar actually looks like from where you
 * stand. Drawing them as circles facing the camera — which is what this did
 * before — turns a barbell into an axle with two wheels on it.
 *
 * ## Heaviest inside
 *
 * Big plates go on first, against the collar, and the small change goes outside
 * them. That is how a bar is loaded and how a loaded bar is read: the outermost
 * disc tells you what the last plate on was.
 *
 * ## One ladder of art, taken by rank
 *
 * The models are the metric set. A pound kit has six plates to the metric
 * seven, so it takes the same ladder from the top — a 45 wears the 25's art, a
 * 35 the 20's. The colours in `plateLook` are ranked the same way, so the key
 * under the bar always names what is drawn on it.
 */

/**
 * The seven models, heaviest first, with where things sit inside each
 * 1024-square render as fractions of it.
 *
 * Indexed by a plate's rank in its kit. Measured off the files rather than
 * guessed, because two of these decide whether the drawing is a barbell or a
 * pile:
 *
 * - `hole` is where the sleeve passes through, and it is right of centre by the
 *   width of the rim — by a different amount on every plate. Centring the
 *   images instead hangs each one off the bar by its own error.
 * - `rim` is the modelled thickness, and the distance to advance for the next
 *   plate. Stacking by it is what makes the plates sit against each other the
 *   way the render does, at true scale. No exaggeration is needed now: the flat
 *   discs this replaced had to have their thicknesses multiplied by five before
 *   they read at all.
 *
 * `height` is the plate's diameter in the square, which sets the scale and
 * keeps every plate true to the others.
 */
const MODELS = [
  { art: plate25, hole: 0.5674, rim: 0.1338, height: 0.9395 },
  { art: plate20, hole: 0.5576, rim: 0.1143, height: 0.9395 },
  { art: plate15, hole: 0.5488, rim: 0.0967, height: 0.8359 },
  { art: plate10, hole: 0.5391, rim: 0.0781, height: 0.6797 },
  { art: plate5, hole: 0.5342, rim: 0.0684, height: 0.4766 },
  { art: plate2, hole: 0.5273, rim: 0.0547, height: 0.3965 },
  { art: plate1, hole: 0.5215, rim: 0.042, height: 0.334 },
] as const;

/** The widest model, and the one everything else is scaled against. */
const WIDEST = MODELS[0];

/** What the widest plate stands, which everything else is scaled against. */
const PLATE_DIAMETER = 450;
/** So the widest plate comes out `PLATE_DIAMETER` tall inside its square. */
const BOX = PLATE_DIAMETER / WIDEST.height;

/** Half the bare shaft between the two collars. Compressed from a real bar. */
const SHAFT_HALF = 470;
/** Loading zone per end. Long enough for six 25s, which is more bar than anybody racks. */
const SLEEVE = 400;
/** The stub past the sleeve. */
const END_CAP = 60;

const HALF = SHAFT_HALF + SLEEVE + END_CAP;
const FRAME_HEIGHT = BOX;
const AXIS_Y = FRAME_HEIGHT / 2;

const SHAFT_RADIUS = 22;
const SLEEVE_RADIUS = 30;
const COLLAR_RADIUS = 48;
const COLLAR_WIDTH = 42;

export function PlateStack({
  loading,
  kit,
}: {
  readonly loading: Loading;
  readonly kit: PlateKit;
}) {
  const perSide = loading.kind === 'plates' ? loading.perSide : [];

  // Outward from the collar, heaviest first — the order they go on. Each plate
  // sits one thickness further out than the one before it.
  let out = SHAFT_HALF;
  const placed = perSide.map((size) => {
    // By rank, so a pound kit's 45 wears the 25's art. A size the kit does not
    // list cannot reach here, but the widest model is the safe stand-in.
    const model = MODELS[kit.plates.indexOf(size)] ?? WIDEST;
    out += model.rim * BOX;
    return { size, model, at: out };
  });

  return (
    // No height: the viewBox sets the aspect, so the bar takes the height it
    // needs at whatever width it is given.
    <svg
      viewBox={`${String(-HALF)} 0 ${String(HALF * 2)} ${String(FRAME_HEIGHT)}`}
      className="w-full"
      role="img"
      aria-label={
        loading.kind === 'plates'
          ? `A bar loaded with ${placed.map((disc) => `${trim(disc.size)} ${kit.unit}`).join(', ')} on each end`
          : `An empty ${trim(loading.bar)} ${kit.unit} bar`
      }
    >
      <Bar />

      {/*
        The right end as rendered, the left end mirrored.

        The models all face right, so they belong on the right sleeve. Flipping
        the whole group is what puts them on the left one — reusing them
        unflipped would light both ends from opposite sides and read as two
        different bars bolted together.
      */}
      {([1, -1] as const).map((side) => (
        <g key={side} {...(side === -1 ? { transform: 'scale(-1 1)' } : {})}>
          {/* Innermost first, so each smaller plate outside it lands on top —
              the order they occlude each other on a real bar. */}
          {placed.map((disc, index) => (
            <image
              key={`${String(index)}-${String(disc.size)}`}
              href={disc.model.art}
              x={disc.at - disc.model.hole * BOX}
              y={AXIS_Y - BOX / 2}
              width={BOX}
              height={BOX}
            />
          ))}
        </g>
      ))}
    </svg>
  );
}

/**
 * The shaft, the two sleeves and the collars.
 *
 * Vector rather than the bar model, because this one has to be any length: the
 * plates cover most of the sleeve and what shows past them changes with every
 * weight. A cylinder lit from above is three stripes, and at this size that is
 * all a cylinder needs to be.
 */
function Bar() {
  return (
    <g>
      <Rod from={-HALF} to={HALF} radius={SLEEVE_RADIUS} />
      <Rod from={-SHAFT_HALF} to={SHAFT_HALF} radius={SHAFT_RADIUS} />
      {([-1, 1] as const).map((side) => (
        <Rod
          key={side}
          from={SHAFT_HALF * side - (COLLAR_WIDTH / 2) * side}
          to={SHAFT_HALF * side + (COLLAR_WIDTH / 2) * side}
          radius={COLLAR_RADIUS}
        />
      ))}
    </g>
  );
}

/** One horizontal cylinder: three bands, lit on top. */
function Rod({
  from,
  to,
  radius,
}: {
  readonly from: number;
  readonly to: number;
  readonly radius: number;
}) {
  const x = Math.min(from, to);
  const width = Math.abs(to - from);
  const bands = [
    { at: -radius, to: -radius * 0.3, fill: BAR_LOOK.lit },
    { at: -radius * 0.3, to: radius * 0.45, fill: BAR_LOOK.colour },
    { at: radius * 0.45, to: radius, fill: BAR_LOOK.shade },
  ];
  return (
    <g>
      {bands.map((band) => (
        <rect
          key={band.at}
          x={x}
          y={AXIS_Y + band.at}
          width={width}
          height={band.to - band.at}
          fill={band.fill}
        />
      ))}
    </g>
  );
}

/** 25, 2.5, 1.25 — no trailing zeros on a plate. */
function trim(size: number): string {
  return String(Math.round(size * 100) / 100);
}
