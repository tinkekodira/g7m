/**
 * Swept tubes with a varying cross-section — the primitive the whole body is
 * built from.
 *
 * ## Why everything is one primitive
 *
 * A muscle belly, a forearm, a skull and a foot are all the same shape problem:
 * a closed surface swept along a path, whose thickness changes as it goes. Once
 * that exists, an anatomy atlas is a list of paths and profiles rather than a
 * pile of special cases, and the thing that makes a body look like a body —
 * consistent form language — comes for free.
 *
 * ## Why not `THREE.TubeGeometry`
 *
 * Two reasons, and the first is the important one.
 *
 * **Constant radius.** A tube of even thickness is a sausage. Real muscle is
 * fusiform: tendon at each end, a belly that swells in the middle, and the
 * silhouette that produces is most of what makes anatomy read as anatomy.
 *
 * **Frenet frames.** Three's tube uses them, and they roll violently at
 * inflection points — a muscle curving around the ribcage would twist through
 * ninety degrees mid-belly for no reason visible in the path. The frames below
 * are parallel-transported instead: each one is the previous one rotated by the
 * minimum amount that keeps it perpendicular to the path. No roll, ever.
 *
 * Also worth having: elliptical cross-sections, because no muscle is round, and
 * per-vertex tendon weights, because the white at the ends of a muscle is what
 * stops it looking like a painted worm.
 */
import { add, cross, dot, lerp, normalize, scale, sub, type Vec3 } from './vec3.js';

/** A path through space. Two points is a straight line; more is a curve. */
export type Path = readonly Vec3[];

export interface TubeProfile {
  /** Half-width across the frame's normal axis, at the belly. */
  readonly width: number;
  /** Half-depth across the frame's binormal axis, at the belly. */
  readonly depth: number;
  /**
   * Where along the path the belly is thickest, 0 to 1.
   *
   * Rarely 0.5. Most muscles are thickest nearer their origin — a biceps
   * bunches high and runs to a long thin tendon at the elbow — and getting
   * this right is the difference between a limb that looks anatomical and one
   * that looks inflated.
   */
  readonly bellyAt: number;
  /** Fraction of the path that is tendon at the start and at the end. */
  readonly tendon: readonly [start: number, end: number];
  /** How thin the tendon is relative to the belly, 0 to 1. */
  readonly tendonThickness: number;
  /**
   * Explicit radius multipliers along the path, overriding the fusiform curve.
   *
   * For the shapes that are not muscles: a torso is wide at the chest, narrow
   * at the waist and wide again at the hips, and no amount of belly-and-tendon
   * describes that. Sampled with linear interpolation.
   */
  readonly silhouette?: readonly number[];
}

export interface TubeSpec {
  readonly path: Path;
  readonly profile: TubeProfile;
  /** Rings along the path. More for anything that curves. */
  readonly segments: number;
  /** Points around each ring. Eight reads as round at this scale. */
  readonly radial: number;
  /**
   * Rotation of the cross-section about the path, in radians.
   *
   * A flat muscle laid on a curved body has to be turned to lie against it —
   * the lats are wide across the back and thin front-to-back, and which way
   * "wide" points changes as the path climbs from the pelvis to the armpit.
   */
  readonly twist?: number;
}

/** Everything three.js needs, as flat arrays it can adopt without copying. */
export interface MeshData {
  readonly positions: Float32Array;
  readonly normals: Float32Array;
  readonly uvs: Float32Array;
  /** 0 at the belly, 1 at a tendon. Drives colour in the material. */
  readonly tendon: Float32Array;
  readonly indices: Uint32Array;
}

/**
 * Centripetal Catmull-Rom through the control points.
 *
 * Centripetal rather than uniform (the α = 0.5 exponent below) because uniform
 * Catmull-Rom overshoots and self-intersects when control points are unevenly
 * spaced — which they always are here, since anatomical landmarks are where
 * bones put them and not where a curve solver would like them.
 */
function catmullRom(points: Path, t: number): Vec3 {
  const first = points[0];
  if (first === undefined) return [0, 0, 0];
  if (points.length === 1) return first;
  if (points.length === 2) {
    return lerp(first, points[1] ?? first, t);
  }

  const spans = points.length - 1;
  const scaled = Math.min(Math.max(t, 0), 1) * spans;
  const index = Math.min(Math.floor(scaled), spans - 1);
  const local = scaled - index;

  // Duplicate the ends rather than wrapping: a muscle is not a loop, and
  // wrapping would bend its origin toward its insertion.
  const p0 = points[Math.max(index - 1, 0)] ?? first;
  const p1 = points[index] ?? first;
  const p2 = points[index + 1] ?? first;
  const p3 = points[Math.min(index + 2, points.length - 1)] ?? first;

  return centripetal(p0, p1, p2, p3, local);
}

function centripetal(p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3, t: number): Vec3 {
  const knot = (a: Vec3, b: Vec3, previous: number): number =>
    previous + Math.max(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) ** 0.5, 1e-4);

  const t0 = 0;
  const t1 = knot(p0, p1, t0);
  const t2 = knot(p1, p2, t1);
  const t3 = knot(p2, p3, t2);
  const at = t1 + (t2 - t1) * t;

  const remap = (a: Vec3, b: Vec3, ta: number, tb: number): Vec3 =>
    lerp(a, b, tb - ta === 0 ? 0 : (at - ta) / (tb - ta));

  const a1 = remap(p0, p1, t0, t1);
  const a2 = remap(p1, p2, t1, t2);
  const a3 = remap(p2, p3, t2, t3);
  const b1 = lerp(a1, a2, t2 - t0 === 0 ? 0 : (at - t0) / (t2 - t0));
  const b2 = lerp(a2, a3, t3 - t1 === 0 ? 0 : (at - t1) / (t3 - t1));
  return lerp(b1, b2, t2 - t1 === 0 ? 0 : (at - t1) / (t2 - t1));
}

/**
 * How thick the tube is at `t`, and how much of that is tendon.
 *
 * The fusiform curve is a raised cosine between the tendon ends and the belly,
 * which gives a silhouette that leaves the tendon smoothly rather than the
 * kink a linear taper produces — and a kink at exactly the point somebody is
 * looking for the shape of a muscle.
 */
export function profileAt(
  profile: TubeProfile,
  t: number,
): { readonly radius: number; readonly tendon: number } {
  if (profile.silhouette !== undefined && profile.silhouette.length > 1) {
    return { radius: sampleSilhouette(profile.silhouette, t), tendon: 0 };
  }

  const [startTendon, endTendon] = profile.tendon;
  const thin = profile.tendonThickness;
  const belly = Math.min(Math.max(profile.bellyAt, 0.02), 0.98);

  // Tendon weight: 1 inside the tendon zone, easing to 0 by the belly.
  const tendonWeight =
    t <= belly ? falloff(t, startTendon, belly) : falloff(1 - t, endTendon, 1 - belly);

  // Raised cosine from tendon thickness up to 1 at the belly.
  const rise = 0.5 - 0.5 * Math.cos((1 - tendonWeight) * Math.PI);
  return { radius: thin + (1 - thin) * rise, tendon: tendonWeight };
}

/** 1 up to `flat`, easing to 0 by `to`. */
function falloff(t: number, flat: number, to: number): number {
  if (t <= flat) return 1;
  if (t >= to || to <= flat) return 0;
  return 1 - (t - flat) / (to - flat);
}

function sampleSilhouette(silhouette: readonly number[], t: number): number {
  const spans = silhouette.length - 1;
  const scaled = Math.min(Math.max(t, 0), 1) * spans;
  const index = Math.min(Math.floor(scaled), spans - 1);
  const a = silhouette[index] ?? 1;
  const b = silhouette[index + 1] ?? a;
  return a + (b - a) * (scaled - index);
}

/**
 * Frames that do not roll.
 *
 * Parallel transport: start with any frame perpendicular to the path, and at
 * each step rotate the previous frame by exactly the rotation that took the
 * previous tangent to this one. The frame therefore never spins about the path
 * unless the path itself does, which is the property Frenet frames lack and
 * the reason a Frenet-framed muscle wrings itself out at an inflection point.
 */
function transportFrames(
  tangents: readonly Vec3[],
  seed: Vec3,
): { normals: Vec3[]; binormals: Vec3[] } {
  const normals: Vec3[] = [];
  const binormals: Vec3[] = [];

  const first = tangents[0] ?? [0, 1, 0];
  // Any vector not parallel to the tangent will do; prefer the caller's, so a
  // flat muscle can be told which way "wide" points at its origin.
  let reference = seed;
  if (Math.abs(dot(normalize(reference), first)) > 0.99) {
    reference = Math.abs(first[1]) > 0.9 ? [0, 0, 1] : [0, 1, 0];
  }
  let normal = normalize(cross(cross(first, reference), first));

  for (let i = 0; i < tangents.length; i++) {
    const tangent = tangents[i] ?? first;
    if (i > 0) {
      const previous = tangents[i - 1] ?? tangent;
      const axis = cross(previous, tangent);
      const sine = Math.hypot(axis[0], axis[1], axis[2]);
      if (sine > 1e-8) {
        const angle = Math.atan2(sine, dot(previous, tangent));
        normal = rotateAbout(normal, normalize(axis), angle);
      }
    }
    // Re-orthogonalise every step; floating point drift accumulates over
    // twenty-four rings into a visibly skewed cross-section.
    normal = normalize(cross(cross(tangent, normal), tangent), normal);
    normals.push(normal);
    binormals.push(normalize(cross(tangent, normal)));
  }

  return { normals, binormals };
}

/** Rodrigues' rotation. */
function rotateAbout(v: Vec3, axis: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return add(add(scale(v, c), scale(cross(axis, v), s)), scale(axis, dot(axis, v) * (1 - c)));
}

/**
 * Sweep a closed elliptical cross-section along a path.
 *
 * The ends are capped with a single centre vertex fanned to the last ring,
 * rather than left open — an open tube shows its inside surface the moment the
 * camera moves, and unlit black holes in a muscle read as damage.
 */
/** How far a cap bulges past its ring, as a fraction of the ring's radius. */
const CAP_ROUNDNESS = 0.42;

export function buildTube(spec: TubeSpec): MeshData {
  const { path, profile, segments, radial } = spec;
  const rings = Math.max(2, segments) + 1;
  const around = Math.max(3, radial);
  const twist = spec.twist ?? 0;

  const points: Vec3[] = [];
  for (let i = 0; i < rings; i++) points.push(catmullRom(path, i / (rings - 1)));

  const tangents: Vec3[] = [];
  for (let i = 0; i < rings; i++) {
    const before = points[Math.max(i - 1, 0)] ?? [0, 0, 0];
    const after = points[Math.min(i + 1, rings - 1)] ?? before;
    tangents.push(normalize(sub(after, before)));
  }

  // Seed the frame with world up unless the path is itself vertical, so a
  // vertical muscle's "width" axis still points across the body.
  const { normals, binormals } = transportFrames(tangents, [1, 0, 0]);

  const vertexCount = rings * (around + 1) + 2;
  const positions = new Float32Array(vertexCount * 3);
  const outward = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const tendonWeights = new Float32Array(vertexCount);

  let v = 0;
  for (let i = 0; i < rings; i++) {
    const t = i / (rings - 1);
    const { radius, tendon } = profileAt(profile, t);
    const centre = points[i] ?? [0, 0, 0];
    const n = normals[i] ?? [1, 0, 0];
    const b = binormals[i] ?? [0, 0, 1];
    const halfWidth = profile.width * radius;
    const halfDepth = profile.depth * radius;

    // The seam vertex is duplicated so the UV can run 0 to 1 without the last
    // quad spanning the whole texture backwards.
    for (let j = 0; j <= around; j++) {
      const angle = (j / around) * Math.PI * 2 + twist;
      const cosine = Math.cos(angle);
      const sine = Math.sin(angle);

      const offset = add(scale(n, halfWidth * cosine), scale(b, halfDepth * sine));
      const point = add(centre, offset);
      // The normal of an ellipse is not the direction to the surface: the
      // axes divide rather than multiply. Getting this wrong lights a flat
      // muscle as though it were round, which is most of the tell.
      const surface = normalize(
        add(
          scale(n, cosine / Math.max(halfWidth, 1e-5)),
          scale(b, sine / Math.max(halfDepth, 1e-5)),
        ),
      );

      positions.set(point, v * 3);
      outward.set(surface, v * 3);
      uvs[v * 2] = j / around;
      uvs[v * 2 + 1] = t;
      tendonWeights[v] = tendon;
      v++;
    }
  }

  // Two cap centres, pushed a little beyond the end rings so the fan is not
  // flat — a flat cap catches light as a disc and reads as a cut end. Only a
  // little: pushed far, a rounded end becomes a point, which on a skull is the
  // difference between a head and a bullet.
  const capStart = v;
  const startPoint = points[0] ?? [0, 0, 0];
  const startTangent = tangents[0] ?? [0, 1, 0];
  const startRadius =
    profileAt(profile, 0).radius * Math.min(profile.width, profile.depth) * CAP_ROUNDNESS;
  writeCap(
    positions,
    outward,
    uvs,
    tendonWeights,
    v,
    sub(startPoint, scale(startTangent, startRadius)),
    scale(startTangent, -1),
    profileAt(profile, 0).tendon,
    0,
  );
  v++;

  const capEnd = v;
  const endPoint = points[rings - 1] ?? [0, 0, 0];
  const endTangent = tangents[rings - 1] ?? [0, 1, 0];
  const endRadius =
    profileAt(profile, 1).radius * Math.min(profile.width, profile.depth) * CAP_ROUNDNESS;
  writeCap(
    positions,
    outward,
    uvs,
    tendonWeights,
    v,
    add(endPoint, scale(endTangent, endRadius)),
    endTangent,
    profileAt(profile, 1).tendon,
    1,
  );
  v++;

  const quads = (rings - 1) * around;
  const indices = new Uint32Array(quads * 6 + around * 6);
  let k = 0;
  for (let i = 0; i < rings - 1; i++) {
    for (let j = 0; j < around; j++) {
      const a = i * (around + 1) + j;
      const b = a + 1;
      const c = a + (around + 1);
      const d = c + 1;
      indices[k++] = a;
      indices[k++] = c;
      indices[k++] = b;
      indices[k++] = b;
      indices[k++] = c;
      indices[k++] = d;
    }
  }
  for (let j = 0; j < around; j++) {
    indices[k++] = capStart;
    indices[k++] = j;
    indices[k++] = j + 1;
  }
  const lastRing = (rings - 1) * (around + 1);
  for (let j = 0; j < around; j++) {
    indices[k++] = capEnd;
    indices[k++] = lastRing + j + 1;
    indices[k++] = lastRing + j;
  }

  return {
    positions,
    normals: outward,
    uvs,
    tendon: tendonWeights,
    indices: indices.subarray(0, k),
  };
}

function writeCap(
  positions: Float32Array,
  normals: Float32Array,
  uvs: Float32Array,
  tendon: Float32Array,
  index: number,
  point: Vec3,
  normal: Vec3,
  tendonWeight: number,
  v: number,
): void {
  positions.set(point, index * 3);
  normals.set(normal, index * 3);
  uvs[index * 2] = 0.5;
  uvs[index * 2 + 1] = v;
  tendon[index] = tendonWeight;
}

/**
 * One geometry out of several.
 *
 * A muscle is drawn as a bundle of fascicles — see `atlas.ts` — and every one
 * of them being its own mesh would mean four hundred draw calls for a body
 * that currently costs eighty. Merged, a muscle is one mesh, one material and
 * one raycast target, which is also what makes tapping it work.
 */
export function mergeMeshes(parts: readonly MeshData[]): MeshData {
  let vertices = 0;
  let indexCount = 0;
  for (const part of parts) {
    vertices += part.tendon.length;
    indexCount += part.indices.length;
  }

  const positions = new Float32Array(vertices * 3);
  const normals = new Float32Array(vertices * 3);
  const uvs = new Float32Array(vertices * 2);
  const tendon = new Float32Array(vertices);
  const indices = new Uint32Array(indexCount);

  let vertexOffset = 0;
  let indexOffset = 0;
  for (const part of parts) {
    positions.set(part.positions, vertexOffset * 3);
    normals.set(part.normals, vertexOffset * 3);
    uvs.set(part.uvs, vertexOffset * 2);
    tendon.set(part.tendon, vertexOffset);
    for (let i = 0; i < part.indices.length; i++) {
      indices[indexOffset + i] = (part.indices[i] ?? 0) + vertexOffset;
    }
    vertexOffset += part.tendon.length;
    indexOffset += part.indices.length;
  }

  return { positions, normals, uvs, tendon, indices };
}
