import { describe, expect, it } from 'vitest';
import { BufferAttribute, BufferGeometry, Group, Mesh, Object3D } from 'three';
import { partsFromObject } from './model-source.js';

function triangle(): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    'position',
    new BufferAttribute(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), 3),
  );
  geometry.setAttribute(
    'normal',
    new BufferAttribute(new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]), 3),
  );
  geometry.setIndex(new BufferAttribute(new Uint16Array([0, 1, 2]), 1));
  return geometry;
}

function muscle(name: string): Mesh {
  const mesh = new Mesh(triangle());
  mesh.name = name;
  return mesh;
}

describe('partsFromObject', () => {
  it('reads a muscle node into a body part', () => {
    const root = new Group();
    root.add(muscle('muscle_biceps-brachii_r'));

    const parts = partsFromObject(root);
    expect(parts).toHaveLength(1);
    expect(parts[0]?.slug).toBe('biceps-brachii');
    expect(parts[0]?.side).toBe('right');
    expect(parts[0]?.nodeName).toBe('muscle_biceps-brachii_r');
    expect(parts[0]?.mesh.positions.length).toBe(9);
    expect([...(parts[0]?.mesh.indices ?? [])]).toEqual([0, 1, 2]);
  });

  /**
   * A real anatomy model carries bones, organs, a skin, lights and cameras
   * alongside the muscles. A raycast that hit the ribcage must not resolve to
   * the nearest plausible slug.
   */
  it('ignores everything that is not named like a muscle', () => {
    const root = new Group();
    root.add(muscle('muscle_biceps-brachii_r'));
    root.add(muscle('skeleton_humerus'));
    root.add(muscle('Camera'));
    root.add(new Object3D());

    expect(partsFromObject(root).map((part) => part.slug)).toEqual(['biceps-brachii']);
  });

  it('accepts the capitals an exporter leaves behind', () => {
    const root = new Group();
    root.add(muscle('Muscle_Biceps-Brachii_L'));

    const parts = partsFromObject(root);
    expect(parts[0]?.nodeName).toBe('muscle_biceps-brachii_l');
    expect(parts[0]?.side).toBe('left');
  });

  /**
   * Ours has no transforms. The next model might put the parts under a scaled
   * or rotated parent, and a body that loads at a tenth of its size with every
   * muscle still in the right place relative to the others is a bug that looks
   * like a camera problem.
   */
  it('bakes the world transform into the positions', () => {
    const root = new Group();
    root.scale.setScalar(2);
    const arm = new Group();
    arm.position.set(10, 0, 0);
    arm.add(muscle('muscle_biceps-brachii_r'));
    root.add(arm);

    const parts = partsFromObject(root);
    // (1, 0, 0) in the mesh, offset by 10 and then doubled.
    expect(parts[0]?.mesh.positions[3]).toBeCloseTo(22, 5);
  });

  it('numbers the vertices of an unindexed mesh', () => {
    const geometry = triangle();
    geometry.setIndex(null);
    const mesh = new Mesh(geometry);
    mesh.name = 'muscle_soleus_r';

    const root = new Group();
    root.add(mesh);
    expect([...(partsFromObject(root)[0]?.mesh.indices ?? [])]).toEqual([0, 1, 2]);
  });

  it('derives normals when the file has none', () => {
    const geometry = triangle();
    geometry.deleteAttribute('normal');
    const mesh = new Mesh(geometry);
    mesh.name = 'muscle_soleus_r';

    const root = new Group();
    root.add(mesh);
    const normals = partsFromObject(root)[0]?.mesh.normals;
    expect(normals?.length).toBe(9);
    // The triangle lies in the xy plane, so every normal points along z.
    expect(Math.abs(normals?.[2] ?? 0)).toBeCloseTo(1, 5);
  });

  /**
   * A sculpted skin has no tendons on it — it is skin. Zero everywhere is the
   * right answer rather than a missing feature, and the viewer's blend simply
   * does nothing.
   */
  it('gives every vertex a tendon weight of zero', () => {
    const root = new Group();
    root.add(muscle('muscle_biceps-brachii_r'));

    const part = partsFromObject(root)[0];
    expect(part?.mesh.tendon.length).toBe(3);
    expect([...(part?.mesh.tendon ?? [])].every((weight) => weight === 0)).toBe(true);
    expect(part?.deep).toBe(false);
  });

  it('finds nothing in an empty scene', () => {
    expect(partsFromObject(new Group())).toEqual([]);
  });
});
