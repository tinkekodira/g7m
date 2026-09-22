import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  PLATE_SLOTS,
  slotForValue,
  type BarId,
  type CalculatorUnit,
  type Loading,
} from '@g7m/core';
import barEzShaft from '../assets/plate-calculator/bar_ez_shaft.webp';
import barEzSleeveLeft from '../assets/plate-calculator/bar_ez_sleeve_left.webp';
import bar15Shaft from '../assets/plate-calculator/bar_15_shaft.webp';
import bar15SleeveLeft from '../assets/plate-calculator/bar_15_sleeve_left.webp';
import bar20Shaft from '../assets/plate-calculator/bar_20_shaft.webp';
import bar20SleeveLeft from '../assets/plate-calculator/bar_20_sleeve_left.webp';
import collarLeft from '../assets/plate-calculator/collar_left.webp';
import plate125 from '../assets/plate-calculator/plate_kg_1.25.webp';
import plate10 from '../assets/plate-calculator/plate_kg_10.webp';
import plate15 from '../assets/plate-calculator/plate_kg_15.webp';
import plate20 from '../assets/plate-calculator/plate_kg_20.webp';
import plate25 from '../assets/plate-calculator/plate_kg_25.webp';
import plate5 from '../assets/plate-calculator/plate_kg_5.webp';
import plate2Half from '../assets/plate-calculator/plate_kg_2.5.webp';
import { layoutBar, type PlacedPlate } from '../assets/plate-calculator/layout.js';
import { BAR_SPRITES, CANVAS_HEIGHT } from '../assets/plate-calculator/sprite-geometry.js';

/**
 * The loaded bar, drawn from g7m's own cartoon sprites.
 *
 * Composed rather than photographed: a shaft, a sleeve, some plates and a
 * collar, each blitted at the pixel anchor the render pipeline recorded for
 * it (`assets/plate-calculator/sprite-geometry.ts`, carried over from
 * `3d-models/plate-calculator/out/manifest.json`). The right half is the left
 * half mirrored — the sprites were only ever rendered from one side, on
 * purpose (see the manifest's own note on why the cheat is invisible).
 *
 * ## Not at real sizes any more
 *
 * The old renderer drew the plate models at their true relative diameters.
 * These sprites are cartoons built to one shared scale, chosen so seven of
 * them plus a collar exactly fill a sleeve — not so a 25 reads as visibly
 * thicker than a 20. The shape still tells heavy from light; it is no longer
 * a ruler.
 */

const BAR_IMAGES: Record<BarId, { readonly shaft: string; readonly sleeveLeft: string }> = {
  bar_20: { shaft: bar20Shaft, sleeveLeft: bar20SleeveLeft },
  bar_15: { shaft: bar15Shaft, sleeveLeft: bar15SleeveLeft },
  bar_ez: { shaft: barEzShaft, sleeveLeft: barEzSleeveLeft },
};

/** Heaviest first, matching `PLATE_SLOTS` — same rank as the sprite geometry. */
const PLATE_IMAGES: readonly string[] = [
  plate25,
  plate20,
  plate15,
  plate10,
  plate5,
  plate2Half,
  plate125,
];

/** Short and subtle — long enough to read as motion, short enough not to be waited for. */
const SLIDE_MS = 200;
/** How far outward a plate travels while entering or leaving, in world pixels. */
const SLIDE_OFFSET = 36;

export function PlateStack({
  loading,
  unit,
  bar,
  fits,
}: {
  readonly loading: Loading;
  readonly unit: CalculatorUnit;
  readonly bar: BarId;
  /** False when the plates would run off the end of the sleeve. */
  readonly fits: boolean;
}) {
  const perSide = loading.kind === 'plates' && fits ? loading.perSide : [];
  const ranks = perSide.map((value) => PLATE_SLOTS.indexOf(slotForValue(value, unit)));

  const sprite = BAR_SPRITES[bar];
  const images = BAR_IMAGES[bar];
  const layout = layoutBar(sprite, ranks);

  const label =
    loading.kind === 'plates' && fits
      ? `A bar loaded with ${perSide.map((size) => `${trim(size)} ${unit}`).join(', ')} on each end`
      : `An empty ${trim(loading.bar)} ${unit} bar`;

  return (
    <svg
      viewBox={`${String(-layout.halfWidth)} ${String(-CANVAS_HEIGHT / 2)} ${String(layout.halfWidth * 2)} ${String(CANVAS_HEIGHT)}`}
      className="w-full"
      role="img"
      aria-label={label}
    >
      <image
        href={images.shaft}
        x={layout.shaft.x}
        y={layout.shaft.y}
        width={layout.shaft.width}
        height={layout.shaft.height}
      />

      {(['left', 'right'] as const).map((side) => (
        <g key={side} transform={side === 'right' ? 'scale(-1 1)' : undefined}>
          <image
            href={images.sleeveLeft}
            x={layout.sleeve.x}
            y={layout.sleeve.y}
            width={layout.sleeve.width}
            height={layout.sleeve.height}
          />
          <PlateSide plates={layout.plates} />
          <image
            href={collarLeft}
            x={layout.collar.x}
            y={layout.collar.y}
            width={layout.collar.width}
            height={layout.collar.height}
          />
        </g>
      ))}
    </svg>
  );
}

/**
 * One side's plates, sliding on or off from the outer end of the sleeve.
 *
 * Positions come from the inside out, so a stepper nudge — which almost
 * always changes only the outer plates — animates just the ones that moved.
 * The common prefix (same rank at the same position as last render) is left
 * alone; anything past it is the part that changed, and is what gets a
 * transition, in either direction.
 */
function PlateSide({ plates }: { readonly plates: readonly PlacedPlate[] }) {
  const previous = useRef<readonly PlacedPlate[]>(plates);
  const [leaving, setLeaving] = useState<readonly (PlacedPlate & { readonly leaveId: number })[]>(
    [],
  );
  const nextLeaveId = useRef(0);
  const timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    const prior = previous.current;
    let common = 0;
    while (
      common < prior.length &&
      common < plates.length &&
      prior[common]?.rank === plates[common]?.rank
    ) {
      common += 1;
    }
    const dropped = prior.slice(common);
    if (dropped.length > 0) {
      const tagged = dropped.map((plate) => ({ ...plate, leaveId: nextLeaveId.current++ }));
      setLeaving((current) => [...current, ...tagged]);
      const ids = new Set(tagged.map((plate) => plate.leaveId));
      const timer = setTimeout(() => {
        setLeaving((current) => current.filter((plate) => !ids.has(plate.leaveId)));
        timers.current.delete(timer);
      }, SLIDE_MS);
      timers.current.add(timer);
    }
    previous.current = plates;
  }, [plates]);

  useEffect(
    () => () => {
      for (const timer of timers.current) clearTimeout(timer);
    },
    [],
  );

  return (
    <>
      {plates.map((plate, index) => (
        <SlidingImage
          key={`live-${String(index)}-${String(plate.rank)}`}
          plate={plate}
          direction="in"
        />
      ))}
      {leaving.map((plate) => (
        <SlidingImage key={`gone-${String(plate.leaveId)}`} plate={plate} direction="out" />
      ))}
    </>
  );
}

function SlidingImage({
  plate,
  direction,
}: {
  readonly plate: PlacedPlate;
  readonly direction: 'in' | 'out';
}) {
  // Entering starts offset and settles; leaving starts settled and offsets.
  // The reduced-motion media query in tokens.css zeroes the transition
  // duration globally, so this still ends in the right place instantly.
  const [settled, setSettled] = useState(direction === 'out');
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setSettled(direction === 'in');
    });
    return () => {
      cancelAnimationFrame(raf);
    };
    // Runs once per mount: a plate that is already settled never re-triggers,
    // and a plate that changes identity gets a new key and a fresh mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dx = settled ? 0 : -SLIDE_OFFSET;
  const style: CSSProperties = {
    // `px` is required here: a bare number is an invalid CSS length and the
    // whole `transform` declaration is dropped, leaving every plate pinned to
    // the SVG's local origin instead of its place on the bar. Inside an SVG,
    // `px` is one user unit — the same units every other coordinate here is
    // already in — not a physical pixel.
    transform: `translate(${String(plate.x + dx)}px, ${String(plate.y)}px)`,
    opacity: settled ? 1 : 0,
    transition: `transform ${String(SLIDE_MS)}ms ease-out, opacity ${String(SLIDE_MS)}ms ease-out`,
  };

  const image = PLATE_IMAGES[plate.rank];
  if (image === undefined) return null;

  return (
    <g style={style}>
      <image href={image} width={plate.width} height={plate.height} />
    </g>
  );
}

/** 25, 2.5, 1.25 — no trailing zeros on a plate. */
function trim(size: number): string {
  return String(Math.round(size * 100) / 100);
}
