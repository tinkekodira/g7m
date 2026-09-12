import { useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import { BufferAttribute, BufferGeometry, Color, type Mesh } from 'three';
import type { MeshData } from './geometry/tube.js';
import { bodyForms, type BodyPart } from './placeholder-body.js';
import { PALETTE } from './palette.js';

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

export type AnatomyMode = 'explore' | 'heatmap';

/** Which side of the body the camera starts on. */
export type AnatomyView = 'front' | 'back';

/** Where the camera looks: the middle of the figure, a little below the chest. */
const TARGET = [0, 1.02, 0] as const;
const CAMERA_HEIGHT = 1.15;
const CAMERA_DISTANCE = 2.6;

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
  /** Front by default. The back is where the lats, glutes and hamstrings are. */
  readonly view?: AnatomyView;
  /**
   * Whether the figure can be turned and tapped.
   *
   * Off, it is a picture: no orbit controls, no hit-testing, and no pointer
   * events at all, so a touch passes through to the page. That is what lets a
   * figure sit inside a screen that scrolls — orbit controls claim every touch
   * that starts on the canvas, and a model in the middle of a long page would
   * otherwise trap the thumb that is trying to scroll past it. It also renders
   * on demand rather than sixty times a second, since nothing moves.
   */
  readonly interactive?: boolean;
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
  view = 'front',
  interactive = true,
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
        camera={{
          position: [0, CAMERA_HEIGHT, view === 'back' ? -CAMERA_DISTANCE : CAMERA_DISTANCE],
          fov: 38,
        }}
        shadows={false}
        frameloop={interactive ? 'always' : 'demand'}
        {...(interactive ? {} : { style: { pointerEvents: 'none' } })}
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
                isSelectable && interactive
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

        {interactive ? (
          <OrbitControls
            // No panning: the figure is the whole subject, and a dragged-off
            // model on a phone is a screen nobody can recover without a reload.
            enablePan={false}
            minDistance={1.2}
            maxDistance={4}
            target={[...TARGET]}
            enableDamping
            dampingFactor={0.08}
            // Stops the camera going under the floor and looking up at the model
            // from beneath, which is disorienting and shows nothing.
            minPolarAngle={0.35}
            maxPolarAngle={Math.PI / 2 + 0.3}
          />
        ) : (
          <LookAt />
        )}
      </Canvas>
    </div>
  );
}

/**
 * Aim the camera at the figure, for a view with no orbit controls to do it.
 *
 * The controls are what point the camera at the target in the interactive
 * viewer. Without them a camera keeps its default heading, straight down its
 * own axis — which from the front is near enough, and from behind is looking
 * away from the body at the background.
 */
function LookAt() {
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);

  useLayoutEffect(() => {
    camera.lookAt(TARGET[0], TARGET[1], TARGET[2]);
    invalidate();
  }, [camera, invalidate]);

  return null;
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
  // A picture renders on demand, so a recolour has to ask for the frame that
  // shows it. Free in the interactive viewer, which draws every frame anyway.
  const invalidate = useThree((state) => state.invalidate);

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
    invalidate();
  }, [geometry, mesh, color, tendonColor, invalidate]);

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

  const ramp = closedSurface ? PALETTE.skinHeat : PALETTE.heat;

  /**
   * Not selectable, which means two different things on the two bodies.
   *
   * On the generated one it is a muscle the taxonomy carries and nobody
   * programs for, and `inert` says so by being visibly duller than the rest.
   *
   * On a sculpted skin it is a head, a hand, a foot or the groin: skin over no
   * muscle at all. That is not a muscle to play down, it is the body — so it
   * takes the body's own resting colour, and goes cold with everything else on
   * the heat map. A figure whose hands are a different shade from its arms
   * looks like it is wearing gloves.
   */
  if (!isSelectable) {
    if (!closedSurface) return PALETTE.inert;
    return mode === 'heatmap' ? (ramp[0] ?? PALETTE.skin) : PALETTE.skin;
  }

  if (mode === 'heatmap') {
    const value = intensity?.get(part.slug) ?? 0;
    const step = Math.min(ramp.length - 1, Math.max(0, Math.round(value * (ramp.length - 1))));
    return ramp[step] ?? PALETTE.inert;
  }

  return closedSurface ? PALETTE.skin : PALETTE.muscle;
}
