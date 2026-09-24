import { describe, expect, it } from 'vitest';
import { BufferAttribute, BufferGeometry, Group, Mesh, ShaderLib } from 'three';
import { partsFromObject } from './model-source.js';
import { createRegionMaterial, parseRegionExtras, regionMapFrom } from './region-map.js';

const EXTRAS = {
  image: 0,
  size: 2048,
  idStep: 3,
  maxDistance: 8,
  names: ['muscle_biceps-brachii_r', 'Muscle_Biceps-Brachii_L', 'skin_head'],
};

function triangle(): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    'position',
    new BufferAttribute(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), 3),
  );
  geometry.setAttribute('uv', new BufferAttribute(new Float32Array([0, 0, 1, 0, 0, 1]), 2));
  geometry.setIndex(new BufferAttribute(new Uint16Array([0, 1, 2]), 1));
  return geometry;
}

function node(name: string): Mesh {
  const mesh = new Mesh(triangle());
  mesh.name = name;
  return mesh;
}

describe('parseRegionExtras', () => {
  it('reads what regions.py writes', () => {
    expect(parseRegionExtras(EXTRAS)).toEqual(EXTRAS);
  });

  /**
   * Every model built before the map existed has no extras at all, and must
   * load exactly as it did — highlighted by piece, not refused.
   */
  it('is null for a model without a map', () => {
    expect(parseRegionExtras(undefined)).toBeNull();
    expect(parseRegionExtras({})).toBeNull();
    expect(parseRegionExtras({ ...EXTRAS, names: 'muscle_biceps-brachii_r' })).toBeNull();
    expect(parseRegionExtras({ ...EXTRAS, size: '2048' })).toBeNull();
  });

  /** Red is one byte: 86 regions at a step of 3 would wrap round to region 0. */
  it('refuses more regions than the red channel can hold', () => {
    const names = Array.from({ length: 86 }, (_, i) => `muscle_m${String(i)}_r`);
    expect(parseRegionExtras({ ...EXTRAS, names })).toBeNull();
  });
});

describe('partsFromObject with a region map', () => {
  const map = regionMapFrom(EXTRAS, {});

  it('gives each part its index in the map, whatever the capitals', () => {
    const root = new Group();
    root.add(node('muscle_biceps-brachii_r'));
    root.add(node('muscle_biceps-brachii_l'));

    const parts = partsFromObject(root, map);
    expect(parts.map((part) => part.region?.index)).toEqual([0, 1]);
    expect(parts[0]?.region?.map).toBe(map);
  });

  it('leaves a part the map does not name without a region', () => {
    const root = new Group();
    root.add(node('muscle_triceps-long-head_r'));

    expect(partsFromObject(root, map)[0]?.region).toBeUndefined();
  });

  it('carries the UVs the map is read through', () => {
    const root = new Group();
    root.add(node('muscle_biceps-brachii_r'));

    expect([...(partsFromObject(root, map)[0]?.mesh.uvs ?? [])]).toEqual([0, 0, 1, 0, 0, 1]);
  });

  it('gives no part a region when there is no map', () => {
    const root = new Group();
    root.add(node('muscle_biceps-brachii_r'));

    expect(partsFromObject(root)[0]?.region).toBeUndefined();
  });
});

describe('createRegionMaterial', () => {
  /**
   * The material works by replacing lines in three's own shader. If an
   * upgrade renames a chunk, `replace` finds nothing, throws nothing, and every
   * highlight on the sculpted body silently disappears. This is the alarm.
   */
  it('patches the lines of the standard shader it depends on', () => {
    const { material, dispose } = createRegionMaterial(regionMapFrom(EXTRAS, {}));
    const shader = {
      uniforms: {} as Record<string, unknown>,
      vertexShader: ShaderLib.standard.vertexShader,
      fragmentShader: ShaderLib.standard.fragmentShader,
    };
    (material.onBeforeCompile as unknown as (s: typeof shader) => void)(shader);

    expect(shader.vertexShader).toContain('vG7mUv = uv;');
    expect(shader.fragmentShader).toContain('diffuseColor.rgb = g7mLook.rgb;');
    expect(shader.fragmentShader).toContain('totalEmissiveRadiance = g7mLook.rgb * g7mLook.a;');
    expect(Object.keys(shader.uniforms)).toEqual(
      expect.arrayContaining(['g7mRegions', 'g7mColours', 'g7mIdScale', 'g7mMaxDistance']),
    );
    dispose();
  });
});
