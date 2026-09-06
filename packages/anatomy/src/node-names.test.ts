import { describe, expect, it } from 'vitest';
import { checkModelContract, meshNodeName, meshNodeNames, parseMuscleNode } from './node-names.js';

describe('meshNodeName', () => {
  it('follows the convention the seed migration documents', () => {
    expect(meshNodeName('biceps-brachii', 'left')).toBe('muscle_biceps-brachii_l');
    expect(meshNodeName('biceps-brachii', 'right')).toBe('muscle_biceps-brachii_r');
    expect(meshNodeName('rectus-abdominis', 'midline')).toBe('muscle_rectus-abdominis');
  });

  it('gives both sides for a paired muscle and one for a midline muscle', () => {
    expect(meshNodeNames('latissimus-dorsi', true)).toEqual([
      'muscle_latissimus-dorsi_l',
      'muscle_latissimus-dorsi_r',
    ]);
    expect(meshNodeNames('erector-spinae', false)).toEqual(['muscle_erector-spinae']);
  });
});

describe('parseMuscleNode', () => {
  it('round-trips every name it produces', () => {
    for (const slug of ['biceps-brachii', 'pec-major-sternal', 'triceps-long-head']) {
      for (const side of ['left', 'right', 'midline'] as const) {
        expect(parseMuscleNode(meshNodeName(slug, side))).toEqual({ slug, side });
      }
    }
  });

  /**
   * A GLB keeps whatever case the artist typed, and half of them capitalise.
   */
  it('does not care about case or stray whitespace', () => {
    expect(parseMuscleNode('  Muscle_Biceps-Brachii_L  ')).toEqual({
      slug: 'biceps-brachii',
      side: 'left',
    });
  });

  /**
   * A real anatomy model has bones, organs, skin and lights in it. A raycast
   * that hit the ribcage must not resolve to the nearest plausible muscle.
   */
  it('is null for anything that is not one of ours', () => {
    for (const name of ['Skeleton_ribcage', 'Armature', 'Light', 'skin', '']) {
      expect(parseMuscleNode(name), name).toBeNull();
    }
  });

  it('is null for the bare prefix with no slug after it', () => {
    expect(parseMuscleNode('muscle_')).toBeNull();
  });

  it('does not mistake a slug ending in l or r for a side', () => {
    // `_l` and `_r`, not `l` and `r`. A muscle called `pectoral` would
    // otherwise parse as a left-side `pectora`.
    expect(parseMuscleNode('muscle_pectoral')).toEqual({ slug: 'pectoral', side: 'midline' });
  });
});

describe('checkModelContract', () => {
  const slugs = ['biceps-brachii', 'latissimus-dorsi', 'rectus-abdominis'];
  const taxonomy = { all: slugs, selectable: slugs };

  it('is clean when every muscle has geometry', () => {
    expect(
      checkModelContract(taxonomy, [
        'muscle_biceps-brachii_l',
        'muscle_biceps-brachii_r',
        'muscle_latissimus-dorsi_l',
        'muscle_latissimus-dorsi_r',
        'muscle_rectus-abdominis',
        'Skeleton',
      ]),
    ).toEqual({ missing: [], unknown: [] });
  });

  /**
   * A muscle with no mesh is a part of the body that cannot be tapped, and it
   * raises nothing at all — it just quietly does not respond.
   */
  it('names the muscles a model forgot', () => {
    const report = checkModelContract(taxonomy, ['muscle_biceps-brachii_l']);
    expect(report.missing).toEqual(['latissimus-dorsi', 'rectus-abdominis']);
  });

  it('accepts one side as evidence the muscle exists', () => {
    // Half a muscle is a modelling bug worth knowing about, but it is not the
    // same failure as a muscle that cannot be selected at all.
    const report = checkModelContract({ all: ['biceps-brachii'], selectable: ['biceps-brachii'] }, [
      'muscle_biceps-brachii_r',
    ]);
    expect(report.missing).toEqual([]);
  });

  /**
   * The other direction, and just as silent: a mesh that highlights when
   * tapped and then shows an empty exercise list.
   */
  it('names geometry the taxonomy has never heard of', () => {
    const report = checkModelContract(taxonomy, [
      'muscle_biceps-brachii_l',
      'muscle_latissimus-dorsi_l',
      'muscle_rectus-abdominis',
      'muscle_psoas-major_l',
      'muscle_psoas-major_r',
    ]);
    expect(report.unknown).toEqual(['psoas-major']);
  });

  it('reports an unknown muscle once, not once per side', () => {
    const report = checkModelContract({ all: [], selectable: [] }, [
      'muscle_psoas-major_l',
      'muscle_psoas-major_r',
    ]);
    expect(report.unknown).toEqual(['psoas-major']);
  });

  /**
   * The taxonomy carries muscles nobody programs for — `sternocleidomastoid`
   * today — and a real model will contain geometry for them. Flagging that as
   * unknown would make every correct model fail the check.
   */
  it('accepts geometry for a known muscle that is not selectable', () => {
    const report = checkModelContract(
      { all: ['biceps-brachii', 'sternocleidomastoid'], selectable: ['biceps-brachii'] },
      ['muscle_biceps-brachii_l', 'muscle_sternocleidomastoid_l'],
    );
    expect(report).toEqual({ missing: [], unknown: [] });
  });

  it('ignores everything that is not named like a muscle', () => {
    const report = checkModelContract({ all: [], selectable: [] }, [
      'Skeleton_ribcage',
      'Camera',
      'Light',
    ]);
    expect(report).toEqual({ missing: [], unknown: [] });
  });
});
