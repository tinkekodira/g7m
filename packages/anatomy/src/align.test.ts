import { describe, expect, it } from 'vitest';
import {
  SCULPT_ARMS,
  alignToSculpt,
  isArmNode,
  shiftOutward,
  type ArmAlignment,
  type SourcePart,
} from './align.js';
import type { MeshData } from './geometry/tube.js';

/** Round numbers, so an expectation reads as the thing being asserted. */
const SIMPLE: ArmAlignment = { shoulderY: 1.4, wristY: 0.9, shiftX: 0.1, shiftZ: 0.02 };

function meshAt(positions: number[]): MeshData {
  const count = positions.length / 3;
  return {
    positions: Float32Array.from(positions),
    normals: new Float32Array(positions.length),
    uvs: new Float32Array(count * 2),
    tendon: new Float32Array(count),
    indices: new Uint32Array([0, 1, 2]),
  };
}

function xs(positions: Float32Array): number[] {
  const out: number[] = [];
  for (let v = 0; v * 3 < positions.length; v += 1) out.push(positions[v * 3]!);
  return out;
}

describe('isArmNode', () => {
  it('knows the muscles that hang off the shoulder, both sides', () => {
    expect(isArmNode('muscle_biceps-brachii_r')).toBe(true);
    expect(isArmNode('muscle_wrist-extensors_l')).toBe(true);
    expect(isArmNode('muscle_triceps-long-head_r')).toBe(true);
    expect(isArmNode('skin_hand_l')).toBe(true);
  });

  /**
   * The deltoids are shoulder, not arm. They sit above the ramp, they were
   * inside the claim radius all along, and moving them would break the one
   * part of the arm that never needed fixing.
   */
  it('leaves the shoulder and the trunk out of it', () => {
    expect(isArmNode('muscle_lateral-deltoid_r')).toBe(false);
    expect(isArmNode('muscle_posterior-deltoid_r')).toBe(false);
    expect(isArmNode('muscle_latissimus-dorsi_r')).toBe(false);
    expect(isArmNode('skin_head')).toBe(false);
  });
});

describe('shiftOutward', () => {
  it('leaves the shoulder where the deltoid is', () => {
    const shoulder = Float32Array.from([0.2, 1.45, -0.02]);
    expect([...shiftOutward(shoulder, SIMPLE)]).toEqual([...shoulder]);
  });

  it('moves the wrist out by the full shift', () => {
    const [x, y, z] = shiftOutward(Float32Array.from([0.232, 0.9, 0.016]), SIMPLE);
    expect(x).toBeCloseTo(0.332, 6);
    expect(y).toBeCloseTo(0.9, 6);
    expect(z).toBeCloseTo(0.036, 6);
  });

  it('keeps the full shift below the wrist, where the fingers are', () => {
    expect(shiftOutward(Float32Array.from([0.24, 0.75, 0]), SIMPLE)[0]).toBeCloseTo(0.34, 6);
  });

  /**
   * The point of ramping rather than translating. A rigid shift would pull the
   * shoulder off the deltoid to put the hand right; this pivots the arm, which
   * is the difference between the two poses.
   */
  it('ramps between the two, so the arm pivots rather than slides', () => {
    const arm = Float32Array.from([0.2, 1.4, 0, 0.2, 1.275, 0, 0.2, 1.15, 0, 0.2, 0.9, 0]);
    const moved = xs(shiftOutward(arm, SIMPLE));

    expect(moved[0]).toBeCloseTo(0.2, 6);
    expect(moved[1]).toBeCloseTo(0.225, 6);
    expect(moved[2]).toBeCloseTo(0.25, 6);
    expect(moved[3]).toBeCloseTo(0.3, 6);
  });

  /**
   * Both arms from one rule. Writing the sides separately is how a body ends
   * up with one arm registered and the other not.
   */
  it('moves both arms away from the body, not both the same way', () => {
    const moved = xs(shiftOutward(Float32Array.from([0.232, 0.9, 0, -0.232, 0.9, 0]), SIMPLE));
    expect(moved[0]).toBeCloseTo(0.332, 6);
    expect(moved[1]).toBeCloseTo(-0.332, 6);
  });

  it('does not touch the positions it was given', () => {
    const original = Float32Array.from([0.232, 0.9, 0.016]);
    const before = [...original];
    shiftOutward(original, SIMPLE);
    expect([...original]).toEqual(before);
  });

  it('keeps every vertex, in order', () => {
    const mesh = Float32Array.from([0.1, 1.2, 0, 0.232, 0.9, 0, 0.05, 0.4, 0]);
    const moved = shiftOutward(mesh, SIMPLE);
    expect(moved.length).toBe(mesh.length);
    expect(moved[1]).toBeCloseTo(1.2, 6);
    expect(moved[7]).toBeCloseTo(0.4, 6);
  });

  it('survives a degenerate span rather than dividing by zero', () => {
    const flat: ArmAlignment = { ...SIMPLE, shoulderY: 1, wristY: 1 };
    const moved = shiftOutward(Float32Array.from([0.232, 0.9, 0, 0.232, 1.1, 0]), flat);
    expect(Number.isNaN(moved[0])).toBe(false);
    expect(moved[0]).toBeCloseTo(0.332, 6);
    // Above the shoulder line, so it stays put.
    expect(moved[3]).toBeCloseTo(0.232, 6);
  });
});

describe('alignToSculpt', () => {
  const forearm: SourcePart = {
    nodeName: 'muscle_wrist-extensors_r',
    mesh: meshAt([0.23, 0.9, 0]),
  };
  const lat: SourcePart = {
    nodeName: 'muscle_latissimus-dorsi_r',
    mesh: meshAt([0.19, 1.2, -0.1]),
  };

  it('moves the arm out and leaves everything else exactly as it was', () => {
    const [moved, still] = alignToSculpt([forearm, lat], SIMPLE);

    expect(moved?.mesh.positions[0]).toBeCloseTo(0.33, 6);
    // Identity, not just equality: an untouched part should not be copied.
    expect(still).toBe(lat);
  });

  it('keeps the names, so the cloud still knows what it is looking at', () => {
    expect(alignToSculpt([forearm, lat], SIMPLE).map((part) => part.nodeName)).toEqual([
      'muscle_wrist-extensors_r',
      'muscle_latissimus-dorsi_r',
    ]);
  });

  /**
   * `cloudFrom` reads the tendon weight to decide what may claim skin, and it
   * reads it per vertex by index. A shift that dropped or reordered it would
   * put the deltoid back on the humerus.
   */
  it('carries the tendon weights through, in step with the vertices', () => {
    const part: SourcePart = {
      nodeName: 'muscle_biceps-brachii_r',
      mesh: { ...meshAt([0.2, 1.2, 0, 0.2, 1.0, 0]), tendon: Float32Array.from([0.1, 0.8]) },
    };
    const tendon = alignToSculpt([part], SIMPLE)[0]?.mesh.tendon;

    expect(tendon?.length).toBe(2);
    expect(tendon?.[0]).toBeCloseTo(0.1, 6);
    expect(tendon?.[1]).toBeCloseTo(0.8, 6);
  });

  /**
   * The measured numbers, guarded.
   *
   * These came off the fitted sculpt band by band. If someone re-fits it at a
   * different scale, or swaps the sculpt, this is the assumption that has
   * quietly stopped being true — and the arms go back to being labelled by
   * whichever muscle the flood reaches them with first.
   */
  it('carries the shift measured off the sculpt', () => {
    expect(SCULPT_ARMS.shiftX).toBeGreaterThan(0.05);
    expect(SCULPT_ARMS.shoulderY).toBeGreaterThan(SCULPT_ARMS.wristY);
  });
});
