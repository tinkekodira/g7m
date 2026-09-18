import { MAX_PLATE_DIAMETER_MM, plateLook, type Loading } from '@g7m/core';

/**
 * One side of a loaded bar, drawn.
 *
 * Coloured discs at the sizes they really are: a 25 is a wide red disc, a 1.25 a
 * small chrome one, and the difference between them is the difference you see on
 * the bar. "Each side: 25 · 15 · 1.25" is the same information and has to be
 * read; this is recognised, which is what makes it useful at the rack with a
 * heart rate up.
 *
 * ## The one liberty taken
 *
 * Along the bar, thicknesses are multiplied by `SPREAD`. Real plates are about
 * nine times wider than they are thick, so at true scale four 25s stack into a
 * single red smear with three hairlines in it. Both scales stay *relative* — a
 * 25 is wider and thicker than a 10 in the right ratios — and only the
 * relationship between the two is stretched. Said out loud on the screen, so
 * nobody measures anything off it.
 *
 * One side, because the other is the same one. Drawing both halves doubles the
 * width for no information and invites the reading that the list is the total.
 */

/** How far thicknesses are exaggerated along the bar. See above. */
const SPREAD = 5;

/** Bar before the first plate, and the collar past the last. */
const SHAFT_MM = 210;
const COLLAR_MM = 70;

/** Room under the widest disc for the numbers. */
const LABEL_BAND_MM = 150;

const AXIS_Y = MAX_PLATE_DIAMETER_MM / 2;
const SHAFT_HALF_MM = 19;

/**
 * The frame the drawing is laid out in, which is fixed rather than fitted.
 *
 * A box that hugged its contents would rescale on every step of the weight — a
 * lone 5 kg drawn as large as four 25s, and a plate that grows as you take
 * weight off. Fixing it keeps one millimetre the same number of pixels whatever
 * is loaded, so adding a plate makes the stack longer instead of making
 * everything else smaller.
 *
 * Wide enough for a bar somebody would need a spotter for; a heavier one
 * extends it rather than overflowing. A dumbbell gets its own narrower frame,
 * because its plates stop at 10 kg and a barbell's frame would draw a handle as
 * a speck in the corner.
 */
const FRAME_WIDTH_MM = { bar: 1500, handle: 820 } as const;
const FRAME_HEIGHT_MM = MAX_PLATE_DIAMETER_MM + LABEL_BAND_MM;

/** One baseline for every number, under the widest disc there can be. */
const LABEL_BASELINE = MAX_PLATE_DIAMETER_MM + 68;

export function PlateStack({
  loading,
  unit,
  /** What the bare bar is called when there is nothing on it. */
  noun,
}: {
  readonly loading: Loading;
  readonly unit: 'kg' | 'lb';
  readonly noun: string;
}) {
  if (loading.kind !== 'plates') {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-card border border-subtle bg-elevated px-4">
        <BareBar />
        <p className="text-center text-sm text-secondary">
          {loading.kind === 'bar_only'
            ? `Just the ${noun} — ${plate(loading.bar)} ${unit}, nothing on it.`
            : `Lighter than the ${noun} on its own, which is ${plate(loading.bar)} ${unit}.`}
        </p>
      </div>
    );
  }

  const discs = loading.perSide.map((size) => ({ size, ...plateLook(size, unit) }));

  // Centres along the bar. Each plate's face rests against the one before it,
  // so its centre is half its own (spread) thickness past the last face.
  let face = SHAFT_MM;
  const placed = discs.map((disc) => {
    const spread = disc.thicknessMm * SPREAD;
    const centre = face + spread / 2;
    face += spread;
    return { ...disc, centre, radius: disc.diameterMm / 2 };
  });

  const last = placed[placed.length - 1];
  const content = Math.max(face + COLLAR_MM, (last?.centre ?? 0) + (last?.radius ?? 0) + COLLAR_MM);
  const frame = noun === 'handle' ? FRAME_WIDTH_MM.handle : FRAME_WIDTH_MM.bar;
  const width = Math.max(frame, content);

  return (
    // No height: the viewBox sets the aspect, so the drawing keeps one scale and
    // simply takes the height it needs at whatever width it is given.
    <svg
      viewBox={`0 0 ${String(width)} ${String(FRAME_HEIGHT_MM)}`}
      className="w-full"
      role="img"
      aria-label={`One side of the ${noun}: ${placed
        .map((disc) => `${plate(disc.size)} ${unit}`)
        .join(', ')}`}
    >
      {/* The bar itself, behind everything, running off the left edge — the
          rest of it is the half this drawing is not showing. */}
      <rect
        x={0}
        y={AXIS_Y - SHAFT_HALF_MM}
        width={width}
        height={SHAFT_HALF_MM * 2}
        rx={SHAFT_HALF_MM}
        fill="var(--color-muted)"
        opacity={0.55}
      />

      {placed.map((disc, index) => (
        // Position, because the same plate size appears more than once.
        <g key={`${String(index)}-${String(disc.size)}`}>
          <circle
            cx={disc.centre}
            cy={AXIS_Y}
            r={disc.radius}
            fill={disc.colour}
            // An outline, or a white 5 kg disappears into a light background and
            // two touching reds read as one wide plate.
            stroke="var(--color-subtle)"
            strokeWidth={5}
          />
          {/* The hole, so a disc reads as a plate rather than a dot. */}
          <circle
            cx={disc.centre}
            cy={AXIS_Y}
            r={SHAFT_HALF_MM + 6}
            fill="var(--color-muted)"
            opacity={0.55}
          />
          {/* The weight, under the crescent that is actually visible — the
              plate after this one covers the middle. One baseline for all of
              them: following each disc's own edge draws a staircase. */}
          <text
            x={visibleCentre(placed, index)}
            y={LABEL_BASELINE}
            textAnchor="middle"
            // The page's ink, not the plate's: these sit below the disc now,
            // on the card, where a plate's white-on-red would vanish.
            fill="var(--color-primary)"
            fontSize={62}
            fontWeight={600}
          >
            {plate(disc.size)}
          </text>
        </g>
      ))}

      {/* The collar that holds them on. */}
      <rect
        x={face + 12}
        y={AXIS_Y - 42}
        width={38}
        height={84}
        rx={12}
        fill="var(--color-muted)"
        opacity={0.8}
      />
    </svg>
  );
}

/**
 * Where a plate's number goes: the middle of the part of it you can still see.
 *
 * The next plate along covers this one from its own left edge rightwards, so the
 * visible crescent runs from this disc's left edge to that one's. Centred
 * labels without this sit underneath the neighbour and vanish.
 */
function visibleCentre(
  placed: readonly { readonly centre: number; readonly radius: number }[],
  index: number,
): number {
  const disc = placed[index];
  if (disc === undefined) return 0;
  const next = placed[index + 1];
  const left = disc.centre - disc.radius;
  const right = next === undefined ? disc.centre + disc.radius : next.centre - next.radius;
  // A neighbour wide enough to cover this disc entirely leaves nothing to aim
  // at; fall back to its own left edge rather than off the front of the plate.
  return right <= left ? left + disc.radius / 3 : (left + right) / 2;
}

/** A bar with nothing on it, for the two loadings that have no plates. */
function BareBar() {
  return (
    <svg viewBox="0 0 400 80" className="h-10 w-40" aria-hidden>
      <rect x={0} y={30} width={400} height={20} rx={10} fill="var(--color-muted)" opacity={0.55} />
      <rect x={330} y={16} width={22} height={48} rx={7} fill="var(--color-muted)" opacity={0.8} />
    </svg>
  );
}

/** 25, 2.5, 1.25 — no trailing zeros on a plate. */
function plate(size: number): string {
  return String(Math.round(size * 100) / 100);
}
