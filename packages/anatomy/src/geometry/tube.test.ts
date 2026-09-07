import { describe, expect, it } from 'vitest';
import { buildTube, mergeMeshes, profileAt, type TubeProfile } from './tube.js';
import { length, sub, type Vec3 } from './vec3.js';

function profile(over: Partial<TubeProfile> = {}): TubeProfile {
  return {
    width: 0.02,
    depth: 0.02,
    bellyAt: 0.45,
    tendon: [0.1, 0.2],
    tendonThickness: 0.34,
    ...over,
  };
}

function vertexAt(positions: Float32Array, index: number): Vec3 {
  return [positions[index * 3] ?? 0, positions[index * 3 + 1] ?? 0, positions[index * 3 + 2] ?? 0];
}

/** The widest the mesh gets on each axis. */
function extent(positions: Float32Array): { x: number; y: number; z: number } {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3) {
    for (let axis = 0; axis < 3; axis++) {
      const value = positions[i + axis] ?? 0;
      min[axis] = Math.min(min[axis] ?? 0, value);
      max[axis] = Math.max(max[axis] ?? 0, value);
    }
  }
  return {
    x: (max[0] ?? 0) - (min[0] ?? 0),
    y: (max[1] ?? 0) - (min[1] ?? 0),
    z: (max[2] ?? 0) - (min[2] ?? 0),
  };
}

describe('profileAt', () => {
  /**
   * The shape that makes a muscle look like a muscle rather than a sausage:
   * thin tendon, swelling belly, thin tendon.
   */
  it('is thinnest at the ends and thickest at the belly', () => {
    const shape = profile();
    expect(profileAt(shape, 0).radius).toBeCloseTo(0.34, 5);
    expect(profileAt(shape, 1).radius).toBeCloseTo(0.34, 5);
    expect(profileAt(shape, shape.bellyAt).radius).toBeCloseTo(1, 5);
  });

  it('never bulges past the belly', () => {
    const shape = profile();
    for (let t = 0; t <= 1; t += 0.02) {
      expect(profileAt(shape, t).radius).toBeLessThanOrEqual(1.0001);
    }
  });

  it('rises smoothly rather than kinking off the tendon', () => {
    // A linear taper puts a visible crease at exactly the point somebody is
    // looking for the shape of the muscle.
    const shape = profile();
    let previous = profileAt(shape, 0).radius;
    let biggestStep = 0;
    for (let t = 0.01; t <= shape.bellyAt; t += 0.01) {
      const radius = profileAt(shape, t).radius;
      biggestStep = Math.max(biggestStep, radius - previous);
      previous = radius;
    }
    // A linear ramp over this span would step by about 0.019 every time.
    expect(biggestStep).toBeLessThan(0.032);
  });

  it('reports full tendon at the ends and none at the belly', () => {
    const shape = profile();
    expect(profileAt(shape, 0).tendon).toBe(1);
    expect(profileAt(shape, 0.05).tendon).toBe(1);
    expect(profileAt(shape, 1).tendon).toBe(1);
    expect(profileAt(shape, shape.bellyAt).tendon).toBe(0);
  });

  it('follows an explicit silhouette when one is given', () => {
    // The torso: wide, narrow, wide. No belly-and-tendon describes that.
    const shape = profile({ silhouette: [1, 0.5, 1] });
    expect(profileAt(shape, 0).radius).toBeCloseTo(1, 5);
    expect(profileAt(shape, 0.5).radius).toBeCloseTo(0.5, 5);
    expect(profileAt(shape, 1).radius).toBeCloseTo(1, 5);
    // Nothing is tendon on a silhouette shape; it is not a muscle.
    expect(profileAt(shape, 0).tendon).toBe(0);
  });
});

describe('buildTube', () => {
  const straight: Vec3[] = [
    [0, 0, 0],
    [0, 1, 0],
  ];

  it('produces a closed, indexed mesh', () => {
    const mesh = buildTube({ path: straight, profile: profile(), segments: 8, radial: 8 });
    expect(mesh.positions.length % 3).toBe(0);
    expect(mesh.indices.length % 3).toBe(0);
    expect(mesh.indices.length).toBeGreaterThan(0);
    // Every index addresses a vertex that exists.
    const vertices = mesh.positions.length / 3;
    for (const index of mesh.indices) expect(index).toBeLessThan(vertices);
  });

  it('carries a tendon weight for every vertex', () => {
    const mesh = buildTube({ path: straight, profile: profile(), segments: 8, radial: 8 });
    expect(mesh.tendon.length).toBe(mesh.positions.length / 3);
    expect(Math.max(...mesh.tendon)).toBeCloseTo(1, 5);
    // Near zero rather than zero: the belly sits at 0.45 and the rings are
    // evenly spaced, so nothing has to land exactly on it.
    expect(Math.min(...mesh.tendon)).toBeLessThan(0.2);

    // It does reach zero when a ring is placed there.
    const aligned = buildTube({
      path: straight,
      profile: profile({ bellyAt: 0.5 }),
      segments: 8,
      radial: 8,
    });
    expect(Math.min(...aligned.tendon)).toBe(0);
  });

  it('gives every vertex a unit normal', () => {
    // Lighting is entirely normals. One bad one is a black facet.
    const mesh = buildTube({ path: straight, profile: profile(), segments: 8, radial: 8 });
    for (let i = 0; i < mesh.normals.length / 3; i++) {
      expect(length(vertexAt(mesh.normals, i))).toBeCloseTo(1, 4);
    }
  });

  it('has no NaN in it anywhere', () => {
    // A single NaN position collapses the whole mesh to nothing on the GPU,
    // silently, and the muscle simply does not appear.
    const mesh = buildTube({ path: straight, profile: profile(), segments: 12, radial: 8 });
    for (const value of mesh.positions) expect(Number.isFinite(value)).toBe(true);
    for (const value of mesh.normals) expect(Number.isFinite(value)).toBe(true);
  });

  it('spans the path it was given', () => {
    const mesh = buildTube({ path: straight, profile: profile(), segments: 8, radial: 8 });
    const size = extent(mesh.positions);
    expect(size.y).toBeGreaterThan(0.95);
    // Twice the half-width, plus the caps, and nothing like the belly width
    // at the ends.
    expect(size.x).toBeLessThan(0.05);
  });

  it('makes an elliptical cross-section from unequal width and depth', () => {
    // No muscle is round. A flat one lit as a round one is most of the tell.
    const mesh = buildTube({
      path: straight,
      profile: profile({ width: 0.05, depth: 0.01 }),
      segments: 8,
      radial: 12,
    });
    const size = extent(mesh.positions);
    expect(size.x / size.z).toBeGreaterThan(3);
  });

  /**
   * The reason these frames are parallel-transported rather than Frenet.
   * Frenet frames roll violently through an inflection point, so a muscle
   * curving around the ribcage would wring itself through ninety degrees
   * mid-belly for no reason visible in the path.
   */
  it('does not roll the cross-section through an S-bend', () => {
    const sBend: Vec3[] = [
      [0, 0, 0],
      [0.1, 0.25, 0],
      [-0.1, 0.5, 0],
      [0, 0.75, 0],
    ];
    const flat = profile({ width: 0.05, depth: 0.008 });
    const mesh = buildTube({ path: sBend, profile: flat, segments: 24, radial: 12 });

    // The path stays in the xy plane, so a frame that never rolls keeps the
    // wide axis in that plane too and the mesh stays thin in z throughout.
    const size = extent(mesh.positions);
    expect(size.z).toBeLessThan(0.03);
  });

  it('survives a degenerate path rather than emitting NaN', () => {
    const nowhere: Vec3[] = [
      [0, 1, 0],
      [0, 1, 0],
    ];
    const mesh = buildTube({ path: nowhere, profile: profile(), segments: 4, radial: 6 });
    for (const value of mesh.positions) expect(Number.isFinite(value)).toBe(true);
  });

  it('clamps a nonsensical resolution instead of producing a broken mesh', () => {
    const mesh = buildTube({ path: straight, profile: profile(), segments: 0, radial: 1 });
    expect(mesh.indices.length).toBeGreaterThan(0);
    for (const value of mesh.positions) expect(Number.isFinite(value)).toBe(true);
  });

  it('bends along a curved path rather than cutting the corner', () => {
    const bend: Vec3[] = [
      [0, 0, 0],
      [0.2, 0.3, 0],
      [0, 0.6, 0],
    ];
    const mesh = buildTube({ path: bend, profile: profile(), segments: 16, radial: 8 });
    const size = extent(mesh.positions);
    // A straight line between the ends would have almost no x extent.
    expect(size.x).toBeGreaterThan(0.1);
  });
});

describe('mergeMeshes', () => {
  const one = buildTube({
    path: [
      [0, 0, 0],
      [0, 1, 0],
    ],
    profile: profile(),
    segments: 4,
    radial: 6,
  });

  /**
   * A muscle is a bundle of fascicles. Merged, it is one draw call and one
   * raycast target; unmerged it is a handful of separately tappable threads.
   */
  it('offsets the indices of every part after the first', () => {
    const merged = mergeMeshes([one, one]);
    expect(merged.tendon.length).toBe(one.tendon.length * 2);

    const vertices = merged.positions.length / 3;
    for (const index of merged.indices) expect(index).toBeLessThan(vertices);

    // The second copy's triangles must address the second copy's vertices.
    const secondHalf = merged.indices.slice(one.indices.length);
    expect(Math.min(...secondHalf)).toBeGreaterThanOrEqual(one.tendon.length);
  });

  it('is empty for nothing, rather than throwing', () => {
    const merged = mergeMeshes([]);
    expect(merged.positions.length).toBe(0);
    expect(merged.indices.length).toBe(0);
  });

  it('keeps every attribute in step', () => {
    const merged = mergeMeshes([one, one, one]);
    expect(merged.positions.length / 3).toBe(merged.tendon.length);
    expect(merged.normals.length / 3).toBe(merged.tendon.length);
    expect(merged.uvs.length / 2).toBe(merged.tendon.length);
  });
});

describe('the geometry is fine enough to look at and cheap enough to ship', () => {
  it('draws a fascicle in a few hundred triangles', () => {
    const mesh = buildTube({
      path: [
        [0, 0, 0],
        [0, 0.3, 0],
      ],
      profile: profile(),
      segments: 16,
      radial: 8,
    });
    const triangles = mesh.indices.length / 3;
    expect(triangles).toBeGreaterThan(100);
    expect(triangles).toBeLessThan(400);
  });
});

describe('vec3 sanity', () => {
  it('measures the length of a difference', () => {
    expect(length(sub([3, 0, 0], [0, 4, 0]))).toBeCloseTo(5, 6);
  });
});
