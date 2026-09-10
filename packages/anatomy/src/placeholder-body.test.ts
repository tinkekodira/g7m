import { describe, expect, it } from 'vitest';
import { MUSCLES } from './atlas.js';
import {
  bodyForms,
  placeholderBodyParts,
  placeholderSlugs,
  type BodyPart,
} from './placeholder-body.js';
import { parseMuscleNode } from './node-names.js';

const parts = placeholderBodyParts();
const forms = bodyForms();

interface Bounds {
  readonly min: readonly [number, number, number];
  readonly max: readonly [number, number, number];
}

function bounds(positions: Float32Array): Bounds {
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3) {
    for (let axis = 0; axis < 3; axis++) {
      const value = positions[i + axis] ?? 0;
      min[axis] = Math.min(min[axis] ?? 0, value);
      max[axis] = Math.max(max[axis] ?? 0, value);
    }
  }
  return { min, max };
}

function find(slug: string, side: 'right' | 'left' | 'midline'): BodyPart {
  const part = parts.find((entry) => entry.slug === slug && entry.side === side);
  if (part === undefined) throw new Error(`No ${side} ${slug}`);
  return part;
}

describe('the atlas', () => {
  it('names every muscle once', () => {
    const slugs = placeholderSlugs();
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('gives every muscle an origin and an insertion at least', () => {
    for (const spec of MUSCLES) {
      expect(spec.lines.length, spec.slug).toBeGreaterThanOrEqual(2);
      expect(spec.fascicles, spec.slug).toBeGreaterThanOrEqual(1);
    }
  });

  it('covers the body rather than one region of it', () => {
    // A body missing its legs is a torso, and it is the kind of gap that is
    // obvious on screen and invisible in a list of slugs.
    const regions = parts.map((part) => bounds(part.mesh.positions).min[1]);
    expect(Math.min(...regions)).toBeLessThan(0.2);
    expect(Math.max(...regions)).toBeGreaterThan(1.4);
  });
});

describe('every part is real geometry', () => {
  it('produces triangles for all of them', () => {
    for (const part of parts) {
      expect(part.mesh.indices.length, part.nodeName).toBeGreaterThan(0);
      expect(part.mesh.positions.length, part.nodeName).toBeGreaterThan(0);
    }
  });

  /**
   * One NaN collapses a whole mesh to nothing on the GPU, silently, and the
   * muscle simply does not appear. Nothing in the viewer would report it.
   *
   * Scanned and asserted once rather than asserted per float: the body is
   * half a million numbers, and half a million `expect` calls is thirty
   * seconds of test runner doing bookkeeping.
   */
  it('contains no NaN anywhere in the body', () => {
    const broken: string[] = [];
    for (const part of [...parts, ...forms]) {
      const name = 'nodeName' in part ? part.nodeName : `form (${part.tone})`;
      for (const value of part.mesh.positions) {
        if (!Number.isFinite(value)) broken.push(`${name} position`);
      }
      for (const value of part.mesh.normals) {
        if (!Number.isFinite(value)) broken.push(`${name} normal`);
      }
    }
    expect(broken).toEqual([]);
  });

  it('addresses only vertices that exist', () => {
    const dangling: string[] = [];
    for (const part of parts) {
      const vertices = part.mesh.positions.length / 3;
      for (const index of part.mesh.indices) {
        if (index >= vertices) dangling.push(`${part.nodeName}: ${String(index)}`);
      }
    }
    expect(dangling).toEqual([]);
  });

  it('carries a tendon weight per vertex, for the colour blend', () => {
    for (const part of parts) {
      expect(part.mesh.tendon.length, part.nodeName).toBe(part.mesh.positions.length / 3);
    }
  });
});

describe('the figure has the proportions of a person', () => {
  it('stands on the floor and is about 1.8 m tall', () => {
    const all = [...parts, ...forms].map((part) => bounds(part.mesh.positions));
    const lowest = Math.min(...all.map((box) => box.min[1]));
    const highest = Math.max(...all.map((box) => box.max[1]));

    expect(lowest).toBeGreaterThan(-0.02);
    expect(highest).toBeGreaterThan(1.7);
    expect(highest).toBeLessThan(1.9);
  });

  it('is no wider than a person', () => {
    const all = [...parts, ...forms].map((box) => bounds(box.mesh.positions));
    const widest = Math.max(...all.map((box) => Math.max(Math.abs(box.min[0]), box.max[0])));
    // Shoulders and hands, not a crucifix. The arms hang.
    expect(widest).toBeLessThan(0.32);
  });

  it('is no deeper than a person', () => {
    const all = [...parts, ...forms].map((box) => bounds(box.mesh.positions));
    const deepest = Math.max(...all.map((box) => Math.max(Math.abs(box.min[2]), box.max[2])));
    // The foot is the front-most thing on a standing figure.
    expect(deepest).toBeLessThan(0.2);
  });

  it('puts the chest above the navel and the navel above the knee', () => {
    const centre = (slug: string): number => {
      const box = bounds(find(slug, 'right').mesh.positions);
      return (box.min[1] + box.max[1]) / 2;
    };
    expect(centre('pec-major-sternal')).toBeGreaterThan(centre('external-obliques'));
    expect(centre('external-obliques')).toBeGreaterThan(centre('rectus-femoris'));
    expect(centre('rectus-femoris')).toBeGreaterThan(centre('gastrocnemius'));
  });
});

describe('front and back', () => {
  /**
   * What the taxonomy's `region` column is for. A body whose lats are on the
   * front reads as correct until it is turned round.
   */
  const centreZ = (slug: string): number => {
    const box = bounds(find(slug, 'right').mesh.positions);
    return (box.min[2] + box.max[2]) / 2;
  };

  it('puts the chest and quads at the front', () => {
    expect(centreZ('pec-major-sternal')).toBeGreaterThan(0);
    expect(centreZ('rectus-abdominis')).toBeGreaterThan(0);
    expect(centreZ('rectus-femoris')).toBeGreaterThan(0);
  });

  it('puts the lats, glutes and hamstrings at the back', () => {
    expect(centreZ('latissimus-dorsi')).toBeLessThan(0);
    expect(centreZ('gluteus-maximus')).toBeLessThan(0);
    expect(centreZ('biceps-femoris')).toBeLessThan(0);
    expect(centreZ('triceps-long-head')).toBeLessThan(0);
  });

  it('puts the biceps in front of the triceps', () => {
    expect(centreZ('biceps-brachii')).toBeGreaterThan(centreZ('triceps-long-head'));
  });

  it('puts the vastus lateralis outside the vastus medialis', () => {
    const x = (slug: string): number => {
      const box = bounds(find(slug, 'right').mesh.positions);
      return (box.min[0] + box.max[0]) / 2;
    };
    expect(x('vastus-lateralis')).toBeGreaterThan(x('vastus-medialis'));
  });
});

describe('both sides', () => {
  /**
   * Paired muscles are declared once and mirrored, which is the only way a
   * body does not end up with two left biceps.
   */
  it('mirrors a paired muscle exactly', () => {
    const right = bounds(find('biceps-brachii', 'right').mesh.positions);
    const left = bounds(find('biceps-brachii', 'left').mesh.positions);

    expect(left.max[0]).toBeCloseTo(-right.min[0], 6);
    expect(left.min[0]).toBeCloseTo(-right.max[0], 6);
    // Height and depth are untouched by the mirror.
    expect(left.min[1]).toBeCloseTo(right.min[1], 6);
    expect(left.min[2]).toBeCloseTo(right.min[2], 6);
  });

  it('puts the right side on +x, the way an anatomist describes a body', () => {
    const right = bounds(find('biceps-brachii', 'right').mesh.positions);
    expect(right.min[0]).toBeGreaterThan(0);
  });

  it('gives every paired muscle two sides and no midline copy', () => {
    for (const spec of MUSCLES) {
      const sides = parts.filter((part) => part.slug === spec.slug).map((part) => part.side);
      if (spec.midline === true) expect(sides).toEqual(['midline']);
      else expect([...sides].sort()).toEqual(['left', 'right']);
    }
  });
});

describe('the naming contract', () => {
  /**
   * The same convention `muscles.mesh_node_names` records in Postgres. A real
   * GLB has to satisfy it too, which is what makes the swap a change of
   * geometry source and nothing else.
   */
  it('names every part so it parses back to its own slug and side', () => {
    for (const part of parts) {
      const parsed = parseMuscleNode(part.nodeName);
      expect(parsed, part.nodeName).not.toBeNull();
      expect(parsed?.slug).toBe(part.slug);
      expect(parsed?.side).toBe(part.side);
    }
  });

  it('gives every part a unique node name', () => {
    const names = parts.map((part) => part.nodeName);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('the forms that are not muscle', () => {
  /**
   * Deliberately unnamed, so `parseMuscleNode` never sees them and a tap on
   * the head selects nothing. They exist because a figure made only of the
   * muscles a lifter trains is a floating collection of straps.
   */
  it('has bone and core pieces', () => {
    expect(forms.some((form) => form.tone === 'bone')).toBe(true);
    expect(forms.some((form) => form.tone === 'core')).toBe(true);
  });

  it('puts something where the head is', () => {
    const skull = forms.filter((form) => bounds(form.mesh.positions).max[1] > 1.7);
    expect(skull.length).toBeGreaterThan(0);
  });

  it('mirrors the limbs and leaves the midline alone', () => {
    const onTheRight = forms.filter((form) => bounds(form.mesh.positions).min[0] > 0.02);
    const onTheLeft = forms.filter((form) => bounds(form.mesh.positions).max[0] < -0.02);
    expect(onTheRight.length).toBe(onTheLeft.length);
    expect(onTheRight.length).toBeGreaterThan(3);
  });
});

describe('the rectus abdominis', () => {
  /**
   * The tendinous intersections are the entire reason a six-pack has separate
   * blocks rather than being one long muscle, so it is drawn as stacked
   * bellies with gaps between them.
   */
  it('is drawn in bands rather than as one strap', () => {
    const banded = find('rectus-abdominis', 'right');
    const plain = find('biceps-brachii', 'right');
    const perFascicle = (part: BodyPart, fascicles: number): number =>
      part.mesh.indices.length / fascicles;

    // Four bands per column against one belly per fascicle.
    expect(perFascicle(banded, 2)).toBeGreaterThan(perFascicle(plain, 4));
  });

  it('leaves a gap at the midline for the linea alba', () => {
    const right = bounds(find('rectus-abdominis', 'right').mesh.positions);
    expect(right.min[0]).toBeGreaterThan(0);
  });
});

describe('the cost of the whole body', () => {
  /**
   * This runs on a phone. Two hundred thousand triangles is a slideshow on a
   * mid-range Android, and the figure is six centimetres tall on screen.
   */
  it('draws in a budget a phone can hold', () => {
    const triangles = [...parts, ...forms].reduce(
      (total, part) => total + part.mesh.indices.length / 3,
      0,
    );
    expect(triangles).toBeLessThan(120_000);
    // And enough to actually be smooth.
    expect(triangles).toBeGreaterThan(20_000);
  });

  it('is one mesh per muscle per side, not one per fascicle', () => {
    // Four hundred draw calls is the difference between a smooth drag and a
    // stutter, and a merged muscle is also one raycast target rather than a
    // bundle of separately tappable threads.
    const paired = MUSCLES.filter((spec) => spec.midline !== true).length;
    const midline = MUSCLES.length - paired;
    expect(parts.length).toBe(paired * 2 + midline);
  });
});

/**
 * The muscles a closed skin has no room for.
 *
 * `deep` decides two things a long way apart. Here it keeps the muscle out of
 * the skin labelling, because a floated deep muscle does not carve a sliver
 * out of a trapezius, it takes a patch out of the middle of one (ADR-0044).
 * In Postgres the same five carry `is_selectable = false`, because with the
 * peel layer gone there is nowhere left to tap them (ADR-0049).
 *
 * Nothing in the build can check those two agree — the taxonomy lives in a
 * database this package does not depend on, and should not. So both ends are
 * pinned to the same list, and marking a sixth muscle deep fails here with a
 * reminder that the other end needs a migration.
 */
describe('the deep muscles', () => {
  it('are the five the taxonomy also declines to offer', () => {
    const deep = MUSCLES.filter((spec) => spec.deep === true)
      .map((spec) => spec.slug)
      .sort();

    expect(deep, 'deep muscles need `is_selectable = false` in a migration too').toEqual([
      'brachialis',
      'rhomboids',
      'semimembranosus',
      'teres-major',
      'triceps-medial-head',
    ]);
  });
});
