import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { BodyPart } from './placeholder-body.js';
import { BODY_FILLER } from './placeholder-body.js';

/**
 * The 3D model. Spin it, tap a muscle.
 *
 * One component with a `mode`, not two components and not two models — the
 * heat map in Phase 9 is the same body with different colours on it, and
 * building a second viewer for that is how the two drift until one of them
 * highlights a muscle the other cannot select.
 *
 * It knows nothing about the database. Parts in, a slug out. That is what
 * lets the same component render a licensed GLB later without any change
 * above it: only the source of `parts` moves.
 */

const COLOURS = {
  /** Resting muscle. Desaturated, so the selection has somewhere to go. */
  muscle: '#8c4a42',
  /** Muscles the taxonomy does not let you select. Present, not interactive. */
  inert: '#4a4340',
  selected: '#e2725b',
  /** Head, hands, feet. Not anatomy, just something to orient on. */
  filler: '#3a3532',
  /** Heat map, cold to hot. Matches the ramp in @g7m/ui. */
  heat: ['#3a3532', '#6b4a3f', '#a35a44', '#e2725b', '#f4a261'] as const,
};

export type AnatomyMode = 'explore' | 'heatmap';

export interface AnatomyViewerProps {
  readonly parts: readonly BodyPart[];
  /** Slugs a tap may select. Everything else renders but does not respond. */
  readonly selectableSlugs: readonly string[];
  readonly selectedSlug: string | null;
  readonly onSelect: (slug: string | null) => void;
  readonly mode?: AnatomyMode;
  /** Slug to 0–1, for `mode: 'heatmap'`. Absent means cold. */
  readonly intensity?: ReadonlyMap<string, number>;
  readonly className?: string;
}

export function AnatomyViewer({
  parts,
  selectableSlugs,
  selectedSlug,
  onSelect,
  mode = 'explore',
  intensity,
  className,
}: AnatomyViewerProps) {
  const selectable = useMemo(() => new Set(selectableSlugs), [selectableSlugs]);

  return (
    <div className={className}>
      <Canvas
        // Capped rather than left at the device's own ratio: a modern phone
        // reports 3, which triples the pixels shaded for a figure made of
        // eighty boxes and costs battery for no visible gain.
        dpr={[1, 2]}
        camera={{ position: [0, 1.1, 3.2], fov: 40 }}
        // A tap that hits nothing is a deselect. Without this the only way out
        // of a selection is to find another muscle, which on a phone means
        // hitting a 2 cm target on purpose.
        onPointerMissed={() => {
          onSelect(null);
        }}
      >
        <color attach="background" args={['#1f1e1d']} />
        <ambientLight intensity={0.9} />
        <directionalLight position={[2, 4, 3]} intensity={1.4} />
        {/* From behind, so the figure does not vanish into the background
            when it is turned round. */}
        <directionalLight position={[-2, 3, -4]} intensity={0.6} />

        {parts.map((part) => {
          const isSelectable = selectable.has(part.slug);
          const isSelected = part.slug === selectedSlug;
          return (
            <mesh
              key={part.nodeName}
              position={[...part.position]}
              rotation={[0, 0, part.tilt]}
              onClick={(event) => {
                if (!isSelectable) return;
                // Otherwise the click passes through to every mesh behind it
                // and the last one wins, which from the front means selecting
                // something on the back.
                event.stopPropagation();
                onSelect(isSelected ? null : part.slug);
              }}
            >
              <boxGeometry args={[...part.size]} />
              <meshStandardMaterial
                color={colourFor({ part, isSelectable, isSelected, mode, intensity })}
                roughness={0.75}
              />
            </mesh>
          );
        })}

        {BODY_FILLER.map((filler, index) => (
          <mesh
            key={`filler-${String(index)}`}
            position={[...filler.position]}
            rotation={[0, 0, filler.tilt]}
          >
            <boxGeometry args={[...filler.size]} />
            <meshStandardMaterial color={COLOURS.filler} roughness={0.9} />
          </mesh>
        ))}

        <OrbitControls
          // No panning: the figure is the whole subject, and a dragged-off
          // model on a phone is a screen nobody can recover without a reload.
          enablePan={false}
          minDistance={1.6}
          maxDistance={5}
          target={[0, 1, 0]}
          // Stops the camera going under the floor and looking up at the
          // model from beneath, which is disorienting and shows nothing.
          minPolarAngle={0.4}
          maxPolarAngle={Math.PI / 2 + 0.35}
        />
      </Canvas>
    </div>
  );
}

function colourFor({
  part,
  isSelectable,
  isSelected,
  mode,
  intensity,
}: {
  part: BodyPart;
  isSelectable: boolean;
  isSelected: boolean;
  mode: AnatomyMode;
  intensity: ReadonlyMap<string, number> | undefined;
}): string {
  if (isSelected) return COLOURS.selected;
  if (!isSelectable) return COLOURS.inert;

  if (mode === 'heatmap') {
    const value = intensity?.get(part.slug) ?? 0;
    const step = Math.min(
      COLOURS.heat.length - 1,
      Math.max(0, Math.round(value * (COLOURS.heat.length - 1))),
    );
    return COLOURS.heat[step] ?? COLOURS.inert;
  }

  return COLOURS.muscle;
}
