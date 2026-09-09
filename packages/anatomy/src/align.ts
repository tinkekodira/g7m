/**
 * Reaching the sculpt's arms with the atlas's.
 *
 * `fit.py` scales the sculpt to 1.8 m and stands it on the floor, which is
 * enough for a torso and not enough for a limb. The two figures stand
 * differently: the atlas's arms hang close to the body, and the sculpt's are
 * held out in the wide stance a bodybuilding sculpt is posed in. At the
 * shoulder the two agree to within a couple of centimetres. At the wrist the
 * sculpt's arm is 14 cm further out.
 *
 * `maxDistance` is 6 cm. So from about the elbow down there was nothing within
 * reach to claim any of it, and every vertex of both forearms and both hands
 * was assigned by the flood instead — which spreads along the surface and gives
 * each vertex to whichever label arrives first. The wrist extensors arrived
 * first and took 5534 vertices including the palm and every finger; the wrist
 * flexors, on the other side of the same forearm, got 86.
 *
 * None of that was a labelling fault. Two bodies in different poses cannot be
 * compared by distance, and no amount of tuning the atlas fixes a registration
 * problem — the earlier attempts at exactly that are in ADR-0045.
 *
 * ## The source moves, not the sculpt
 *
 * The obvious version of this moves the sculpt's arms *in* to the atlas. It
 * works, and it is wrong: the sculpt is a much wider figure, so an arm brought
 * in far enough to meet the atlas's lands on the sculpt's own hip. Measured, it
 * put the gluteus maximus and the latissimus dorsi out at x 0.36 — claiming
 * skin on a forearm, which is worse than the fault being fixed.
 *
 * Moving the atlas's arm *out* instead cannot collide with anything. It travels
 * into the empty space where the sculpt's arm is; the atlas's own hip stays
 * where it was, fifteen centimetres away from anything it might wrongly claim.
 *
 * Nothing here touches what is exported. This is the point cloud that gets
 * measured against, and pass four cuts the sculpt exactly as the artist posed
 * it.
 */
import type { MeshData } from './geometry/tube.js';

/** Anything with a name and a mesh: a muscle part, or a bare skin form. */
export interface SourcePart {
  readonly nodeName: string;
  readonly mesh: MeshData;
}

/**
 * How far the sculpt's arms hang outside the atlas's, and over what span.
 *
 * Distances in metres in the atlas frame: a 1.8 m figure, feet on y = 0, +x
 * the figure's own right.
 */
export interface ArmAlignment {
  /** Above this nothing moves, because at the shoulder the two already agree. */
  readonly shoulderY: number;
  /** At and below this the shift is at full strength. */
  readonly wristY: number;
  /** Outward shift at the wrist. */
  readonly shiftX: number;
  /** Backward shift at the wrist. The sculpt's forearms hang behind the atlas's. */
  readonly shiftZ: number;
}

/**
 * Measured off the fitted sculpt, band by band, against the atlas's own arm.
 *
 * Surface against surface rather than axis against axis, which is what the
 * claim radius actually sees. The deltoids are inside 6 cm as they stand and
 * always labelled correctly, so the shift starts at nothing where they are.
 */
export const SCULPT_ARMS: ArmAlignment = {
  shoulderY: 1.4,
  wristY: 0.9,
  shiftX: 0.1,
  // Negative, and that sign is the whole of it. The sculpt's forearm sits
  // behind the atlas's — at the elbow its front face is at z 0.017 and the
  // atlas's wrist flexors are at 0.018 to 0.056. Shifted the wrong way they
  // stood outside the arm entirely and claimed nothing at all, while the
  // extensors on the far side took the whole forearm.
  shiftZ: -0.045,
};

/**
 * The parts that hang off the shoulder, by slug.
 *
 * Named rather than found by position. A coordinate test would have to
 * separate an arm from a torso on a figure where the obliques reach x 0.146
 * and the biceps starts at 0.148, and it would be one bad threshold away from
 * moving half a lat into the forearm. The arm is a list of eight muscles and a
 * hand; there is no reason to infer it.
 *
 * The deltoids are deliberately not here. They are shoulder rather than arm,
 * they sit above the ramp, and they were never the problem.
 */
const ARM_SLUGS: readonly string[] = [
  'biceps-brachii',
  'brachialis',
  'triceps-long-head',
  'triceps-lateral-head',
  'triceps-medial-head',
  'brachioradialis',
  'wrist-flexors',
  'wrist-extensors',
];

const ARM_NODES: ReadonlySet<string> = new Set([
  ...ARM_SLUGS.flatMap((slug) => [`muscle_${slug}_l`, `muscle_${slug}_r`]),
  'skin_hand_l',
  'skin_hand_r',
]);

/** Whether this node travels with the arm. */
export function isArmNode(nodeName: string): boolean {
  return ARM_NODES.has(nodeName.trim().toLowerCase());
}

/**
 * The same parts, with the arm ones moved out to where the sculpt's arms are.
 *
 * Returns new meshes for the parts that move and passes the rest through
 * untouched, so nothing is copied that does not need to be.
 */
export function alignToSculpt(
  parts: readonly SourcePart[],
  alignment: ArmAlignment = SCULPT_ARMS,
): SourcePart[] {
  return parts.map((part) =>
    isArmNode(part.nodeName)
      ? { ...part, mesh: { ...part.mesh, positions: shiftOutward(part.mesh.positions, alignment) } }
      : part,
  );
}

/**
 * Positions moved away from the midline, ramping down the arm.
 *
 * The ramp is what makes this a pose change rather than a translation: nothing
 * moves at the shoulder, so the arm pivots outward roughly the way it is
 * actually held. Applied on the sign of x so both arms move away from the
 * body rather than both moving the same way.
 */
export function shiftOutward(positions: Float32Array, alignment: ArmAlignment): Float32Array {
  const { shoulderY, wristY, shiftX, shiftZ } = alignment;
  const span = shoulderY - wristY;
  const moved = Float32Array.from(positions);

  for (let v = 0; v * 3 + 2 < moved.length; v += 1) {
    const y = moved[v * 3 + 1]!;

    // A degenerate span would divide by zero; treat it as "everything below
    // the shoulder is wrist".
    const t =
      span <= 0 ? (y < shoulderY ? 1 : 0) : Math.min(1, Math.max(0, (shoulderY - y) / span));
    if (t <= 0) continue;

    const x = moved[v * 3]!;
    moved[v * 3] = x + Math.sign(x) * shiftX * t;
    moved[v * 3 + 2] = moved[v * 3 + 2]! + shiftZ * t;
  }

  return moved;
}
