/**
 * Three-component vector maths, as plain tuples.
 *
 * Deliberately not `THREE.Vector3`. Everything under `geometry/` runs in a
 * plain Node process under Vitest with no WebGL and no DOM, which is what lets
 * the shape of a muscle be asserted in a unit test rather than looked at. The
 * output is typed arrays that three.js consumes directly, so nothing is paid
 * twice.
 *
 * Tuples rather than objects because a muscle is a few hundred of these and
 * the arithmetic below runs a few hundred thousand times when the body is
 * built. Allocation is the whole cost here.
 */

export type Vec3 = readonly [x: number, y: number, z: number];

export function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function scale(a: Vec3, k: number): Vec3 {
  return [a[0] * k, a[1] * k, a[2] * k];
}

export function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

export function length(a: Vec3): number {
  return Math.hypot(a[0], a[1], a[2]);
}

/** Unit vector, or `fallback` when there is no direction to normalise. */
export function normalize(a: Vec3, fallback: Vec3 = [0, 1, 0]): Vec3 {
  const len = length(a);
  return len < 1e-9 ? fallback : [a[0] / len, a[1] / len, a[2] / len];
}

export function lerp(a: Vec3, b: Vec3, t: number): Vec3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** Mirror across the sagittal plane — the body's own left/right. */
export function mirrorX(a: Vec3): Vec3 {
  return [-a[0], a[1], a[2]];
}

export function distance(a: Vec3, b: Vec3): number {
  return length(sub(a, b));
}
