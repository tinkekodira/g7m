import { describe, expect, it } from 'vitest';
import { cloudFrom, transferLabels, type SourceCloud, type TargetMesh } from './label-transfer.js';
import type { MeshData } from './geometry/tube.js';

function mesh(positions: number[], tendon?: number[]): MeshData {
  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(positions.length),
    uvs: new Float32Array((positions.length / 3) * 2),
    tendon: Float32Array.from(tendon ?? new Array<number>(positions.length / 3).fill(0)),
    indices: new Uint32Array(),
  };
}

/** A strip of vertices in a line, each joined to the next by a degenerate face. */
function strip(count: number, spacing: number): TargetMesh {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) positions[i * 3] = i * spacing;

  const indices: number[] = [];
  for (let i = 0; i + 2 < count; i += 1) indices.push(i, i + 1, i + 2);
  return { positions, indices: new Uint32Array(indices) };
}

const twoBlobs: SourceCloud = cloudFrom([
  { nodeName: 'muscle_left_r', mesh: mesh([0, 0, 0]) },
  { nodeName: 'muscle_right_r', mesh: mesh([1, 0, 0]) },
]);

describe('cloudFrom', () => {
  it('keeps every point and remembers which part it came from', () => {
    const cloud = cloudFrom([
      { nodeName: 'a', mesh: mesh([0, 0, 0, 1, 1, 1]) },
      { nodeName: 'b', mesh: mesh([2, 2, 2]) },
    ]);
    expect(cloud.names).toEqual(['a', 'b']);
    expect([...cloud.label]).toEqual([0, 0, 1]);
    expect(cloud.positions.length).toBe(9);
  });

  /**
   * The setting that gave the bicep back. The deltoid's insertion runs a third
   * of the way down the humerus, and on a sculpt whose arm is 8 cm thicker
   * than the atlas's, that cord of tendon vertices was the nearest thing to
   * the whole front of the upper arm.
   */
  it('can leave the tendons out, because skin belongs to the belly', () => {
    const part = {
      nodeName: 'muscle_a_r',
      mesh: mesh([0, 0, 0, 1, 0, 0, 2, 0, 0], [0, 0.5, 1]),
    };

    expect(cloudFrom([part]).label.length).toBe(3);
    expect(cloudFrom([part], { maxTendon: 1 }).label.length).toBe(3);
    expect(cloudFrom([part], { maxTendon: 0.4 }).label.length).toBe(1);
    expect(cloudFrom([part], { maxTendon: 0.5 }).label.length).toBe(2);
  });

  it('keeps the name of a part the tendon filter emptied', () => {
    // Otherwise the label indices shift under the caller and every vertex in
    // the model silently changes muscle.
    const cloud = cloudFrom(
      [
        { nodeName: 'all-tendon', mesh: mesh([0, 0, 0], [1]) },
        { nodeName: 'belly', mesh: mesh([1, 0, 0], [0]) },
      ],
      { maxTendon: 0.4 },
    );
    expect(cloud.names).toEqual(['all-tendon', 'belly']);
    expect([...cloud.label]).toEqual([1]);
  });

  it('keeps every vertex of a part that carries no tendon data', () => {
    const bare = cloudFrom([{ nodeName: 'a', mesh: mesh([0, 0, 0, 1, 0, 0]) }], { maxTendon: 0 });
    expect(bare.label.length).toBe(2);
  });

  it('copes with a part that has no geometry', () => {
    const cloud = cloudFrom([{ nodeName: 'empty', mesh: mesh([]) }]);
    expect(cloud.names).toEqual(['empty']);
    expect(cloud.label.length).toBe(0);
  });
});

describe('transferLabels', () => {
  it('gives each vertex the nearest muscle', () => {
    const target: TargetMesh = {
      positions: new Float32Array([0.1, 0, 0, 0.9, 0, 0]),
      indices: new Uint32Array(),
    };
    const labels = transferLabels(target, twoBlobs, { maxDistance: 0.5, smoothingPasses: 0 });
    expect([...labels]).toEqual([0, 1]);
  });

  /**
   * The confetti this file exists to prevent. One vertex in the middle of a
   * region picking up a different label makes the highlight flicker as a
   * finger moves across it.
   */
  it('votes out a single-vertex island', () => {
    const target = strip(9, 0.01);
    const labels = Int32Array.from([0, 0, 0, 0, 1, 0, 0, 0, 0]);
    // Everything is inside the radius of blob 0 except the speckle, which is
    // planted by putting a source point right on top of that one vertex.
    const source = cloudFrom([
      {
        nodeName: 'a',
        mesh: mesh([
          0, 0, 0, 0.01, 0, 0, 0.02, 0, 0, 0.03, 0, 0, 0.05, 0, 0, 0.06, 0, 0, 0.07, 0, 0, 0.08, 0,
          0,
        ]),
      },
      { nodeName: 'b', mesh: mesh([0.04, 0, 0]) },
    ]);

    const rough = transferLabels(target, source, { maxDistance: 0.005, smoothingPasses: 0 });
    expect([...rough]).toEqual([...labels]);

    const smoothed = transferLabels(target, source, { maxDistance: 0.005, smoothingPasses: 2 });
    expect([...smoothed]).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  /**
   * A real border has both sides winning their own half, so it has to survive
   * what kills an island.
   */
  it('keeps a border between two large regions', () => {
    const target = strip(10, 0.01);
    const source = cloudFrom([
      { nodeName: 'a', mesh: mesh([0, 0, 0, 0.01, 0, 0, 0.02, 0, 0, 0.03, 0, 0, 0.04, 0, 0]) },
      { nodeName: 'b', mesh: mesh([0.05, 0, 0, 0.06, 0, 0, 0.07, 0, 0, 0.08, 0, 0, 0.09, 0, 0]) },
    ]);
    const labels = transferLabels(target, source, { maxDistance: 0.005, smoothingPasses: 3 });
    expect([...labels]).toEqual([0, 0, 0, 0, 0, 1, 1, 1, 1, 1]);
  });

  /**
   * A raycast that falls through an unlabelled hole selects nothing, which
   * reads as a model that does not work rather than as a gap in the data.
   */
  it('leaves nothing unlabelled that is attached to anything', () => {
    const target = strip(20, 0.01);
    // Only the first vertex is within reach; the rest are far beyond it.
    const source = cloudFrom([{ nodeName: 'a', mesh: mesh([0, 0, 0]) }]);
    const labels = transferLabels(target, source, { maxDistance: 0.005, smoothingPasses: 0 });
    expect([...labels].every((label) => label === 0)).toBe(true);
  });

  /**
   * Along the surface, not through it. Straight-line spreading would let one
   * inner thigh claim the other, and a hand claim the hip it rests against.
   */
  it('floods along the surface rather than through the air', () => {
    // Two separate strips. The near one is labelled; the far one is not
    // connected to it, and sits closer in space than its own labelled end.
    const positions = new Float32Array([
      0, 0, 0, 0.01, 0, 0, 0.02, 0, 0, 0.011, 0.001, 0, 0.5, 0, 0,
    ]);
    const target: TargetMesh = { positions, indices: new Uint32Array([0, 1, 2, 3, 4, 4]) };
    const source = cloudFrom([
      { nodeName: 'near', mesh: mesh([0, 0, 0]) },
      { nodeName: 'far', mesh: mesh([0.5, 0, 0]) },
    ]);
    const labels = transferLabels(target, source, { maxDistance: 0.005, smoothingPasses: 0 });
    // Vertex 3 sits beside vertex 1 in space but is joined only to vertex 4.
    expect(labels[3]).toBe(1);
    expect(labels[0]).toBe(0);
  });

  it('does not depend on how the mesh happens to be numbered', () => {
    const source = cloudFrom([
      { nodeName: 'a', mesh: mesh([0, 0, 0, 0.01, 0, 0, 0.02, 0, 0]) },
      { nodeName: 'b', mesh: mesh([0.03, 0, 0, 0.04, 0, 0]) },
    ]);
    const forwards = strip(5, 0.01);
    const first = transferLabels(forwards, source, { maxDistance: 0.005, smoothingPasses: 2 });
    const second = transferLabels(forwards, source, { maxDistance: 0.005, smoothingPasses: 2 });
    expect([...first]).toEqual([...second]);
  });

  it('answers -1 everywhere when there is nothing to label with', () => {
    const target = strip(4, 0.01);
    const empty = cloudFrom([]);
    const labels = transferLabels(target, empty, { maxDistance: 0.01, smoothingPasses: 2 });
    expect([...labels]).toEqual([-1, -1, -1, -1]);
  });

  it('handles a mesh with no faces at all', () => {
    const target: TargetMesh = {
      positions: new Float32Array([0.1, 0, 0]),
      indices: new Uint32Array(),
    };
    const labels = transferLabels(target, twoBlobs, { maxDistance: 0.5, smoothingPasses: 2 });
    expect([...labels]).toEqual([0]);
  });
});
