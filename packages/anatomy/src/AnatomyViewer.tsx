import { useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import { BufferAttribute, BufferGeometry, Color, type Mesh } from 'three';
import type { MeshData } from './geometry/tube.js';
import { bodyForms, type BodyPart } from './placeholder-body.js';

/**
 * The 3D model. Spin it, tap a muscle.
 *
 * One component with a `mode`, not two components and not two models — the
 * heat map is the same body with different colours on it, and building a
 * second viewer for that is how the two drift until one highlights a muscle
 * the other cannot select.
 *
 * It knows nothing about the database. Parts in, a slug out. That is what lets
 * the same component render a licensed GLB later without any change above it:
 * only the source of `parts` moves.
 *
 * ## Why the colour is per vertex
 *
 * Every muscle arrives with a tendon weight on each vertex — 0 in the belly,
 * 1 where it has narrowed to tendon. Blending toward bone-white on that weight
 * is what stops a muscle looking like a painted worm, and it costs one
 * attribute rather than a texture, a UV unwrap and a second material.
 *
 * It is also what makes selection readable. A selected muscle keeps its tendon
 * ends; only the belly lifts, so the shape stays legible instead of turning
 * into a flat orange blob.
 */

const PALETTE = {
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
   * mannequin dipped in paint. This is the clay the reference renders used,
   * which is what a body looks like with the light on it.
   */
  skin: '#c08a72',
  skinInert: '#93796b',
  skinHeat: ['#6f6058', '#946a52', '#b8774b', '#d9854e', '#f2a463'] as const,
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
  /**
   * The parts form a closed skin rather than a bundle of separate muscles.
   *
   * Two things follow. The bones and the core are not drawn, because there is
   * no gap for them to show through and they would sit on top of a solid body
   * instead — a clavicle laid across the chest, kneecaps over the knees. And
   * the resting colours change: see `PALETTE.skin`.
   */
  readonly closedSurface?: boolean;
  readonly className?: string;
}

export function AnatomyViewer({
  parts,
  selectableSlugs,
  selectedSlug,
  onSelect,
  mode = 'explore',
  intensity,
  closedSurface = false,
  className,
}: AnatomyViewerProps) {
  const selectable = useMemo(() => new Set(selectableSlugs), [selectableSlugs]);
  const forms = useMemo(() => bodyForms(), []);

  return (
    <div className={className}>
      <Canvas
        // Capped rather than left at the device's own ratio: a modern phone
        // reports 3, which triples the pixels shaded and costs battery for a
        // difference nobody can see on a 6 cm figure.
        dpr={[1, 2]}
        camera={{ position: [0, 1.15, 2.6], fov: 38 }}
        shadows={false}
        // A tap that hits nothing is a deselect. Without this the only way out
        // of a selection is to find another muscle, which on a phone means
        // hitting a 2 cm target on purpose.
        onPointerMissed={() => {
          onSelect(null);
        }}
      >
        <color attach="background" args={['#17161a']} />

        {/*
          Three lights and a bounce, which is the whole difference between
          "3D model" and "render".

          Key from the front and above right, warm. Fill from the left, cool
          and weak, so the shadowed side is readable without being flat. Rim
          from behind and above, bright, which draws the bright edge along the
          silhouette that separates the figure from the background — and it is
          the rim that makes muscle bellies read as round.
        */}
        <hemisphereLight args={['#8899bb', '#3a2c28', 0.55]} />
        <directionalLight position={[2.4, 3.2, 2.8]} intensity={2.1} color="#fff2e6" />
        <directionalLight position={[-3, 1.4, 1.6]} intensity={0.55} color="#9fb4d8" />
        <directionalLight position={[-1.2, 3.4, -3.2]} intensity={1.5} color="#ffd9c2" />

        {/* Skipped for a closed skin: nothing can be seen through it, so
            these would sit on top of the body rather than inside it. */}
        {!closedSurface &&
          forms.map((form, index) => (
            <GeneratedMesh
              key={`form-${String(index)}`}
              mesh={form.mesh}
              color={form.tone === 'bone' ? PALETTE.bone : PALETTE.core}
              tendonColor={form.tone === 'bone' ? PALETTE.bone : PALETTE.core}
              roughness={form.tone === 'bone' ? 0.62 : 0.9}
            />
          ))}

        {parts.map((part) => {
          const isSelectable = selectable.has(part.slug);
          const isSelected = part.slug === selectedSlug;
          return (
            <GeneratedMesh
              key={part.nodeName}
              mesh={part.mesh}
              color={colourFor({ part, isSelectable, isSelected, mode, intensity, closedSurface })}
              // Skin carries no tendon weight, so the blend does nothing; the
              // resting colour keeps a stray weight from washing it out.
              tendonColor={closedSurface ? PALETTE.skin : PALETTE.tendon}
              roughness={0.52}
              emissive={isSelected ? PALETTE.selected : undefined}
              onClick={
                isSelectable
                  ? (event) => {
                      // Otherwise the click passes through to every mesh
                      // behind it and the last one wins, which from the front
                      // means selecting something on the back.
                      event.stopPropagation();
                      onSelect(isSelected ? null : part.slug);
                    }
                  : undefined
              }
            />
          );
        })}

        {/* Grounds the figure. Without it a body floats in a void, and the
            eye reads floating as "unfinished" long before it reads it as
            "no floor". */}
        <ContactShadows
          position={[0, 0.001, 0]}
          scale={2.4}
          blur={2.6}
          opacity={0.55}
          far={1.2}
          resolution={512}
          color="#000000"
        />

        <OrbitControls
          // No panning: the figure is the whole subject, and a dragged-off
          // model on a phone is a screen nobody can recover without a reload.
          enablePan={false}
          minDistance={1.2}
          maxDistance={4}
          target={[0, 1.02, 0]}
          enableDamping
          dampingFactor={0.08}
          // Stops the camera going under the floor and looking up at the model
          // from beneath, which is disorienting and shows nothing.
          minPolarAngle={0.35}
          maxPolarAngle={Math.PI / 2 + 0.3}
        />
      </Canvas>
    </div>
  );
}

/**
 * One generated geometry, uploaded once and coloured per vertex.
 *
 * The attributes are built in a layout effect rather than in a memo so the
 * geometry object is stable across re-renders — a new `BufferGeometry` on
 * every colour change would re-upload every vertex to the GPU to alter a
 * uniform, which on a phone is the difference between a smooth drag and a
 * stutter every time a muscle is tapped.
 */
function GeneratedMesh({
  mesh,
  color,
  tendonColor,
  roughness,
  emissive,
  onClick,
}: {
  readonly mesh: MeshData;
  readonly color: string;
  readonly tendonColor: string;
  readonly roughness: number;
  readonly emissive?: string | undefined;
  readonly onClick?: ((event: { stopPropagation: () => void }) => void) | undefined;
}) {
  const ref = useRef<Mesh>(null);

  const geometry = useMemo(() => {
    const built = new BufferGeometry();
    built.setAttribute('position', new BufferAttribute(mesh.positions, 3));
    built.setAttribute('normal', new BufferAttribute(mesh.normals, 3));
    built.setAttribute('uv', new BufferAttribute(mesh.uvs, 2));
    built.setAttribute('color', new BufferAttribute(new Float32Array(mesh.tendon.length * 3), 3));
    built.setIndex(new BufferAttribute(mesh.indices, 1));
    built.computeBoundingSphere();
    return built;
  }, [mesh]);

  // Recoloured in place. Only the colour attribute is rewritten, and only when
  // the colour actually changes.
  useLayoutEffect(() => {
    const attribute = geometry.getAttribute('color');
    if (!(attribute instanceof BufferAttribute)) return;

    const belly = new Color(color);
    const tendon = new Color(tendonColor);
    const array = attribute.array as Float32Array;

    for (let i = 0; i < mesh.tendon.length; i++) {
      // Eased rather than linear: a straight blend puts half the muscle in a
      // washed-out middle tone, where the real transition from red belly to
      // white tendon happens over a couple of centimetres.
      const weight = smooth(mesh.tendon[i] ?? 0);
      array[i * 3] = belly.r + (tendon.r - belly.r) * weight;
      array[i * 3 + 1] = belly.g + (tendon.g - belly.g) * weight;
      array[i * 3 + 2] = belly.b + (tendon.b - belly.b) * weight;
    }
    attribute.needsUpdate = true;
  }, [geometry, mesh, color, tendonColor]);

  return (
    <mesh ref={ref} geometry={geometry} {...(onClick === undefined ? {} : { onClick })}>
      <meshStandardMaterial
        vertexColors
        roughness={roughness}
        metalness={0.02}
        {...(emissive === undefined
          ? {}
          : { emissive: new Color(emissive), emissiveIntensity: 0.42 })}
      />
    </mesh>
  );
}

/** Smoothstep. Keeps the belly red and the tendon white, with a short blend. */
function smooth(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return clamped * clamped * (3 - 2 * clamped);
}

function colourFor({
  part,
  isSelectable,
  isSelected,
  mode,
  intensity,
  closedSurface,
}: {
  part: BodyPart;
  isSelectable: boolean;
  isSelected: boolean;
  mode: AnatomyMode;
  intensity: ReadonlyMap<string, number> | undefined;
  closedSurface: boolean;
}): string {
  if (isSelected) return PALETTE.selected;

  const inert = closedSurface ? PALETTE.skinInert : PALETTE.inert;
  if (!isSelectable) return inert;

  if (mode === 'heatmap') {
    const ramp = closedSurface ? PALETTE.skinHeat : PALETTE.heat;
    const value = intensity?.get(part.slug) ?? 0;
    const step = Math.min(ramp.length - 1, Math.max(0, Math.round(value * (ramp.length - 1))));
    return ramp[step] ?? inert;
  }

  return closedSurface ? PALETTE.skin : PALETTE.muscle;
}
