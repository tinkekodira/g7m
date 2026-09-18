import { BAR_LOOK, MAX_PLATE_DIAMETER_MM, plateLook, type Loading } from '@g7m/core';

/**
 * The loaded bar, drawn as a bar.
 *
 * Both ends, mirrored, because a barbell is a thing somebody recognises at a
 * glance and half of one is a diagram. The plates are the app's own low-poly
 * models rebuilt as vector: faceted discs at their real relative diameters, in
 * the colours sampled off those models.
 *
 * ## Heaviest inside
 *
 * Big plates go on first, against the collar, and the small change goes outside
 * them. That is how a bar is loaded and how a loaded bar is read — the outermost
 * disc tells you what the last plate on was — so the drawing stacks them the
 * same way, decreasing outward from the middle.
 *
 * ## Vector, not the renders
 *
 * The models are one fixed image of one fixed loading; a calculator has to draw
 * any of several hundred. Rebuilding them as polygons composes, stays sharp at
 * any size, ships no megabytes, and keeps the facet count honest to the source.
 *
 * ## The one liberty taken
 *
 * Along the bar, thicknesses are multiplied by `SPREAD`. Real plates are about
 * nine times wider than they are thick, so at true scale four 25s stack into a
 * single red smear with three hairlines in it. Both scales stay *relative* — a
 * 25 is wider and thicker than a 10 in the right ratios — and only the
 * relationship between the two is stretched.
 */

/** How far thicknesses are exaggerated along the bar. See above. */
const SPREAD = 2;

/** Faces per disc. Low enough to read as faceted, high enough to read as round. */
const FACETS = 18;

/** Where the light is, in radians — up and slightly left, as on the models. */
const LIGHT_ANGLE = -Math.PI * 0.62;

/** Half the bare shaft between the two collars. Compressed from a real bar. */
const SHAFT_HALF_MM = 800;
/** How far the sleeve runs past the outermost plate. */
const END_CAP_MM = 150;

const SHAFT_RADIUS_MM = 26;
const SLEEVE_RADIUS_MM = 38;
const COLLAR_RADIUS_MM = 50;
const COLLAR_WIDTH_MM = 46;
/**
 * The hub, one size on every plate, because the sleeve it hangs on is one size.
 * Scaling it with the disc would draw a 1.25 with a hole a 25 could not use.
 */
const HUB_RADIUS_MM = 36;

/** Through the middle of every plate. Darker than any plate or sleeve tone. */
const HOLE = '#23232a';

/**
 * The dark edge every disc gets, as a share of its radius.
 *
 * Without it two 25s side by side are one red blob with a seam. This is the
 * single thing that makes a stack read as a count of plates.
 */
const RIM_SHARE = 0.075;

/** Vertical room, which the widest plate sets. */
const FRAME_HEIGHT_MM = MAX_PLATE_DIAMETER_MM + 60;
const AXIS_Y = FRAME_HEIGHT_MM / 2;

/**
 * The narrowest the drawing gets.
 *
 * Wide enough for four 25s a side — a 220 kg bar — so that below it one
 * millimetre is the same number of pixels whatever is loaded, and adding a plate
 * makes the stack longer rather than shrinking everything. Past that the frame
 * gives way rather than running the bar off the edge.
 */
const MIN_HALF_MM = SHAFT_HALF_MM + 4 * 25 * SPREAD + END_CAP_MM;

export function PlateStack({
  loading,
  unit,
}: {
  readonly loading: Loading;
  readonly unit: 'kg' | 'lb';
}) {
  const perSide = loading.kind === 'plates' ? loading.perSide : [];

  // Outward from the collar, heaviest first — the order they go on.
  let edge = SHAFT_HALF_MM;
  const placed = perSide.map((size) => {
    const look = plateLook(size, unit);
    const width = look.thicknessMm * SPREAD;
    const from = edge + width / 2;
    edge += width;
    return { size, look, from, width, radius: look.diameterMm / 2 };
  });

  const outermost = placed[placed.length - 1];
  const reach = outermost === undefined ? SHAFT_HALF_MM : outermost.from + outermost.radius;
  const half = Math.max(MIN_HALF_MM, reach + END_CAP_MM);

  return (
    // No height: the viewBox sets the aspect, so the bar takes the height it
    // needs at whatever width it is given.
    <svg
      viewBox={`${String(-half)} 0 ${String(half * 2)} ${String(FRAME_HEIGHT_MM)}`}
      className="w-full"
      role="img"
      aria-label={
        loading.kind === 'plates'
          ? `A bar loaded with ${placed.map((disc) => `${trim(disc.size)} ${unit}`).join(', ')} on each end`
          : `An empty ${trim(loading.bar)} ${unit} bar`
      }
    >
      <Bar half={half} />

      {/* Each end, innermost plate first so the smaller ones outside it land on
          top — which is the order they occlude each other on a real bar. */}
      {([-1, 1] as const).map((side) =>
        placed.map((disc, index) => (
          <Plate
            key={`${String(side)}-${String(index)}-${String(disc.size)}`}
            cx={disc.from * side}
            radius={disc.radius}
            thickness={disc.width}
            look={disc.look}
            side={side}
          />
        )),
      )}
    </svg>
  );
}

/**
 * The shaft, the two sleeves and the collars, as flat bands.
 *
 * A cylinder lit from above is three stripes — lit, face, shadow — and at this
 * size that is all a cylinder needs to be.
 */
function Bar({ half }: { readonly half: number }) {
  return (
    <g>
      <Rod half={half} radius={SLEEVE_RADIUS_MM} />
      <Rod half={SHAFT_HALF_MM} radius={SHAFT_RADIUS_MM} />
      {([-1, 1] as const).map((side) => (
        <Rod
          key={side}
          half={COLLAR_RADIUS_MM}
          radius={COLLAR_RADIUS_MM}
          // The collar the plates rest against, at the inner end of the sleeve.
          shift={(SHAFT_HALF_MM - COLLAR_WIDTH_MM / 2) * side}
          width={COLLAR_WIDTH_MM}
        />
      ))}
    </g>
  );
}

/** One horizontal cylinder: three bands, lit on top. */
function Rod({
  half,
  radius,
  shift = 0,
  width,
}: {
  readonly half: number;
  readonly radius: number;
  readonly shift?: number;
  readonly width?: number;
}) {
  const span = width ?? half * 2;
  const x = width === undefined ? -half : shift - width / 2;
  const bands = [
    { from: -radius, to: -radius * 0.35, fill: BAR_LOOK.lit },
    { from: -radius * 0.35, to: radius * 0.45, fill: BAR_LOOK.colour },
    { from: radius * 0.45, to: radius, fill: BAR_LOOK.shade },
  ];
  return (
    <g>
      {bands.map((band) => (
        <rect
          key={band.from}
          x={x}
          y={AXIS_Y + band.from}
          width={span}
          height={band.to - band.from}
          fill={band.fill}
        />
      ))}
    </g>
  );
}

/**
 * One plate: an edge band, a faceted face, and the hub it hangs on.
 *
 * The edge is the same polygon shifted toward the middle of the bar, so the
 * thickness shows on the side that stays visible when the next plate out covers
 * the rest of this one.
 */
function Plate({
  cx,
  radius,
  thickness,
  look,
  side,
}: {
  readonly cx: number;
  readonly radius: number;
  /** As drawn along the bar, spread included. */
  readonly thickness: number;
  readonly look: ReturnType<typeof plateLook>;
  /** -1 for the left end of the bar, 1 for the right. */
  readonly side: -1 | 1;
}) {
  const depth = Math.max(12, thickness * 0.5);
  return (
    <g>
      {/* The thickness, shown toward the middle of the bar — the side that stays
          visible once the next plate out covers the rest of this one. */}
      <polygon points={polygon(cx - depth * side, radius)} fill={look.shade} />
      {/* The whole disc in its dark tone, then the face inset into it. What is
          left around the edge is the rim, and it is what separates one plate
          from the next. */}
      <polygon points={polygon(cx, radius)} fill={look.shade} />
      {facets(cx, radius * (1 - RIM_SHARE)).map((facet) => (
        <polygon key={facet.key} points={facet.points} fill={mix(look, facet.light)} />
      ))}
      {/* The raised hub and the hole through it. Light ring, dark hole — the
          other way round it reads as a stud rather than a plate, and the dark
          hole is also what keeps a chrome 1.25 from merging into the sleeve. */}
      <polygon points={polygon(cx, HUB_RADIUS_MM)} fill={BAR_LOOK.lit} />
      <polygon points={polygon(cx, HUB_RADIUS_MM * 0.55)} fill={HOLE} />
    </g>
  );
}

/** A regular polygon, rotated half a step so a flat face sits on top. */
function polygon(cx: number, radius: number): string {
  const step = (Math.PI * 2) / FACETS;
  const points: string[] = [];
  for (let index = 0; index < FACETS; index += 1) {
    const angle = index * step + step / 2 - Math.PI / 2;
    points.push(
      `${String(round(cx + Math.cos(angle) * radius))},${String(round(AXIS_Y + Math.sin(angle) * radius))}`,
    );
  }
  return points.join(' ');
}

/**
 * The face, split into one triangle per facet.
 *
 * Each gets its own tone from how far it is turned toward the light, which is
 * what makes a flat polygon read as a solid object rather than a sticker. It is
 * also the honest way to draw a low-poly model: the facets are the model.
 */
function facets(cx: number, radius: number): { key: number; points: string; light: number }[] {
  const step = (Math.PI * 2) / FACETS;
  const out: { key: number; points: string; light: number }[] = [];
  for (let index = 0; index < FACETS; index += 1) {
    const start = index * step + step / 2 - Math.PI / 2;
    const end = start + step;
    const mid = start + step / 2;
    out.push({
      key: index,
      points: [
        `${String(round(cx))},${String(round(AXIS_Y))}`,
        `${String(round(cx + Math.cos(start) * radius))},${String(round(AXIS_Y + Math.sin(start) * radius))}`,
        `${String(round(cx + Math.cos(end) * radius))},${String(round(AXIS_Y + Math.sin(end) * radius))}`,
      ].join(' '),
      // 0 is turned fully away from the light, 1 fully toward it. Kept well
      // inside both ends: a plate is a flat disc catching light across its
      // facets, and the full range drew it as a ball instead.
      light: 0.34 + 0.32 * ((Math.cos(mid - LIGHT_ANGLE) + 1) / 2),
    });
  }
  return out;
}

/** The face colour, pulled toward the lit or the shaded tone. */
function mix(look: { colour: string; lit: string; shade: string }, light: number): string {
  if (light >= 0.5) return blend(look.colour, look.lit, (light - 0.5) * 2);
  return blend(look.colour, look.shade, (0.5 - light) * 2);
}

function blend(from: string, to: string, amount: number): string {
  const a = channels(from);
  const b = channels(to);
  const mixed = a.map((value, index) => Math.round(value + ((b[index] ?? value) - value) * amount));
  return `#${mixed.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function channels(hex: string): number[] {
  return [1, 3, 5].map((at) => Number.parseInt(hex.slice(at, at + 2), 16));
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

/** 25, 2.5, 1.25 — no trailing zeros on a plate. */
function trim(size: number): string {
  return String(Math.round(size * 100) / 100);
}
