/**
 * A stylised body built from boxes, standing in for the licensed model.
 *
 * ADR-0009: the anatomy asset is fetched, never committed, and the repository
 * is public — so there is no model in the tree and there may not be one for a
 * while. Rather than block the whole Learn pillar on that, this provides
 * geometry that satisfies **the same naming contract** a real GLB has to
 * satisfy (`node-names.ts`), so everything built on top of it — raycasting,
 * selection, the exercise panel, the volume heat map in Phase 9 — is real code
 * exercised against real geometry.
 *
 * Swapping in a licensed model is then a change of `AnatomyModelSource` and
 * nothing else. If it were the other way round — viewer written against a
 * specific GLB — the swap would touch every file here.
 *
 * It is not anatomy. It is a mannequin with the right parts in roughly the
 * right places, which is enough to tap.
 */
import { meshNodeName, type Side } from './node-names.js';

/** Metres. A 1.8 m figure standing with its feet at y = 0. */
export interface BodyPart {
  readonly nodeName: string;
  readonly slug: string;
  readonly side: Side;
  /** Centre of the box. */
  readonly position: readonly [x: number, y: number, z: number];
  readonly size: readonly [width: number, height: number, depth: number];
  /** Radians about the z axis. Enough tilt to read as a limb rather than a post. */
  readonly tilt: number;
}

interface PartSpec {
  readonly slug: string;
  /** Null for a midline muscle. Otherwise the right-hand side's x offset. */
  readonly x: number | null;
  readonly y: number;
  readonly z: number;
  readonly size: readonly [number, number, number];
  readonly tilt?: number;
}

/**
 * Where each muscle sits on the mannequin.
 *
 * Positions are eyeballed, not measured, and z is the only part doing real
 * work: it puts each muscle on the front or the back so the figure reads
 * correctly when it is turned round, which is what the taxonomy's `region`
 * column is for. Everything paired is declared once, for the right-hand side,
 * and mirrored below — writing both halves by hand is how a body ends up with
 * two left biceps.
 */
const SPECS: readonly PartSpec[] = [
  // Chest and shoulders
  { slug: 'pec-major-clavicular', x: 0.09, y: 1.42, z: 0.1, size: [0.16, 0.07, 0.08] },
  { slug: 'pec-major-sternal', x: 0.09, y: 1.33, z: 0.1, size: [0.17, 0.11, 0.08] },
  { slug: 'anterior-deltoid', x: 0.21, y: 1.44, z: 0.07, size: [0.1, 0.12, 0.09] },
  { slug: 'lateral-deltoid', x: 0.24, y: 1.44, z: 0.0, size: [0.09, 0.13, 0.11] },
  { slug: 'posterior-deltoid', x: 0.21, y: 1.44, z: -0.07, size: [0.1, 0.12, 0.09] },

  // Arms
  { slug: 'biceps-brachii', x: 0.26, y: 1.25, z: 0.05, size: [0.09, 0.22, 0.08], tilt: 0.07 },
  { slug: 'brachialis', x: 0.27, y: 1.14, z: 0.04, size: [0.07, 0.1, 0.07], tilt: 0.07 },
  { slug: 'triceps-long-head', x: 0.25, y: 1.26, z: -0.06, size: [0.08, 0.22, 0.07], tilt: 0.07 },
  { slug: 'triceps-lateral-head', x: 0.3, y: 1.28, z: -0.04, size: [0.06, 0.18, 0.07], tilt: 0.07 },
  { slug: 'triceps-medial-head', x: 0.22, y: 1.19, z: -0.06, size: [0.06, 0.14, 0.06], tilt: 0.07 },
  { slug: 'brachioradialis', x: 0.3, y: 1.0, z: 0.04, size: [0.07, 0.18, 0.07], tilt: 0.05 },
  { slug: 'wrist-flexors', x: 0.31, y: 0.94, z: 0.06, size: [0.06, 0.16, 0.05], tilt: 0.05 },
  { slug: 'wrist-extensors', x: 0.33, y: 0.96, z: -0.03, size: [0.06, 0.16, 0.05], tilt: 0.05 },

  // Trunk, front
  { slug: 'rectus-abdominis', x: null, y: 1.15, z: 0.11, size: [0.19, 0.26, 0.06] },
  { slug: 'external-obliques', x: 0.14, y: 1.14, z: 0.07, size: [0.07, 0.24, 0.11] },
  { slug: 'serratus-anterior', x: 0.15, y: 1.26, z: 0.05, size: [0.06, 0.12, 0.12] },

  // Trunk, back
  { slug: 'upper-trapezius', x: 0.08, y: 1.52, z: -0.05, size: [0.14, 0.1, 0.09] },
  { slug: 'middle-trapezius', x: 0.08, y: 1.4, z: -0.11, size: [0.14, 0.12, 0.05] },
  { slug: 'lower-trapezius', x: 0.07, y: 1.28, z: -0.11, size: [0.12, 0.14, 0.05] },
  { slug: 'rhomboids', x: 0.09, y: 1.36, z: -0.09, size: [0.09, 0.12, 0.04] },
  { slug: 'latissimus-dorsi', x: 0.14, y: 1.24, z: -0.09, size: [0.14, 0.26, 0.07] },
  { slug: 'teres-major', x: 0.17, y: 1.36, z: -0.08, size: [0.08, 0.08, 0.06] },
  { slug: 'infraspinatus', x: 0.14, y: 1.4, z: -0.1, size: [0.1, 0.1, 0.05] },
  { slug: 'erector-spinae', x: null, y: 1.16, z: -0.11, size: [0.14, 0.32, 0.06] },

  // Hips and legs
  { slug: 'gluteus-maximus', x: 0.11, y: 0.95, z: -0.1, size: [0.18, 0.18, 0.11] },
  { slug: 'gluteus-medius', x: 0.16, y: 1.02, z: -0.04, size: [0.09, 0.11, 0.11] },
  { slug: 'rectus-femoris', x: 0.1, y: 0.72, z: 0.07, size: [0.11, 0.32, 0.08] },
  { slug: 'vastus-lateralis', x: 0.16, y: 0.74, z: 0.03, size: [0.07, 0.28, 0.11] },
  { slug: 'vastus-medialis', x: 0.06, y: 0.62, z: 0.06, size: [0.07, 0.18, 0.09] },
  { slug: 'hip-adductors', x: 0.05, y: 0.78, z: 0.02, size: [0.07, 0.28, 0.1] },
  { slug: 'biceps-femoris', x: 0.13, y: 0.72, z: -0.08, size: [0.09, 0.3, 0.08] },
  { slug: 'semitendinosus', x: 0.07, y: 0.72, z: -0.08, size: [0.07, 0.3, 0.07] },
  { slug: 'semimembranosus', x: 0.1, y: 0.68, z: -0.1, size: [0.07, 0.24, 0.05] },
  { slug: 'gastrocnemius', x: 0.1, y: 0.32, z: -0.06, size: [0.1, 0.22, 0.09] },
  { slug: 'soleus', x: 0.1, y: 0.22, z: -0.05, size: [0.09, 0.16, 0.08] },
  { slug: 'tibialis-anterior', x: 0.09, y: 0.3, z: 0.05, size: [0.06, 0.22, 0.06] },

  // Neck
  { slug: 'sternocleidomastoid', x: 0.04, y: 1.6, z: 0.05, size: [0.05, 0.1, 0.05] },
];

/**
 * The mannequin's non-muscle bulk: head, hands, feet.
 *
 * Deliberately not named like muscles, so `parseMuscleNode` rejects them and a
 * tap on the head selects nothing. They exist because a figure made only of
 * the muscles a lifter trains is a floating collection of slabs that nobody
 * can orient themselves on.
 */
export const BODY_FILLER: readonly Omit<BodyPart, 'slug' | 'side' | 'nodeName'>[] = [
  { position: [0, 1.72, 0], size: [0.17, 0.22, 0.2], tilt: 0 },
  { position: [0, 1.6, 0], size: [0.09, 0.09, 0.09], tilt: 0 },
  { position: [0.32, 0.83, 0.02], size: [0.08, 0.16, 0.05], tilt: 0 },
  { position: [-0.32, 0.83, 0.02], size: [0.08, 0.16, 0.05], tilt: 0 },
  { position: [0.1, 0.05, 0.04], size: [0.1, 0.08, 0.24], tilt: 0 },
  { position: [-0.1, 0.05, 0.04], size: [0.1, 0.08, 0.24], tilt: 0 },
];

/**
 * Every part of the body, both sides.
 *
 * Paired muscles are declared once and mirrored, which is the only way a body
 * does not end up with two left biceps. The tilt mirrors with the position,
 * or the arms lean the same way as each other.
 */
export function placeholderBodyParts(): BodyPart[] {
  const parts: BodyPart[] = [];

  for (const spec of SPECS) {
    if (spec.x === null) {
      parts.push({
        nodeName: meshNodeName(spec.slug, 'midline'),
        slug: spec.slug,
        side: 'midline',
        position: [0, spec.y, spec.z],
        size: spec.size,
        tilt: spec.tilt ?? 0,
      });
      continue;
    }

    // Right is +x, which is the viewer's left when the figure faces them —
    // the same way an anatomical model is described, from the body's own
    // point of view.
    parts.push({
      nodeName: meshNodeName(spec.slug, 'right'),
      slug: spec.slug,
      side: 'right',
      position: [spec.x, spec.y, spec.z],
      size: spec.size,
      tilt: spec.tilt ?? 0,
    });
    parts.push({
      nodeName: meshNodeName(spec.slug, 'left'),
      slug: spec.slug,
      side: 'left',
      position: [-spec.x, spec.y, spec.z],
      size: spec.size,
      tilt: -(spec.tilt ?? 0),
    });
  }

  return parts;
}

/** The slugs this body provides geometry for. */
export function placeholderSlugs(): string[] {
  return SPECS.map((spec) => spec.slug);
}
