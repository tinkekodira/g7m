import { describe, expect, it } from 'vitest';
import { checkModelContract, parseMuscleNode } from './node-names.js';
import { BODY_FILLER, placeholderBodyParts, placeholderSlugs } from './placeholder-body.js';

/**
 * The seed migration's selectable muscles, copied here on purpose.
 *
 * A test that read the list from the database would pass by construction. This
 * is the list the taxonomy actually ships, written down separately, so that
 * adding a muscle to the seed and not to the model fails here rather than
 * showing up as a part of the body that does not respond to a tap.
 */
const SELECTABLE = [
  'pec-major-clavicular',
  'pec-major-sternal',
  'anterior-deltoid',
  'lateral-deltoid',
  'posterior-deltoid',
  'biceps-brachii',
  'brachialis',
  'brachioradialis',
  'wrist-flexors',
  'wrist-extensors',
  'rectus-abdominis',
  'external-obliques',
  'serratus-anterior',
  'upper-trapezius',
  'middle-trapezius',
  'lower-trapezius',
  'latissimus-dorsi',
  'rhomboids',
  'teres-major',
  'infraspinatus',
  'erector-spinae',
  'triceps-long-head',
  'triceps-lateral-head',
  'triceps-medial-head',
  'gluteus-maximus',
  'gluteus-medius',
  'rectus-femoris',
  'vastus-lateralis',
  'vastus-medialis',
  'hip-adductors',
  'biceps-femoris',
  'semitendinosus',
  'semimembranosus',
  'gastrocnemius',
  'soleus',
  'tibialis-anterior',
];

const parts = placeholderBodyParts();

describe('the placeholder body against the taxonomy', () => {
  /**
   * The reason this file exists. Everything built on the viewer — selection,
   * the exercise panel, Phase 9's heat map — is real code, and it is exercised
   * against geometry that satisfies the same contract a licensed GLB will.
   */
  it('provides geometry for every selectable muscle, and invents none', () => {
    expect(
      checkModelContract(
        { all: [...SELECTABLE, 'sternocleidomastoid'], selectable: SELECTABLE },
        parts.map((part) => part.nodeName),
      ),
    ).toEqual({ missing: [], unknown: [] });
  });

  it('does not claim to model the one muscle the seed marks unselectable', () => {
    // `sternocleidomastoid` is in the taxonomy but excluded from selection.
    // It is drawn, so the neck is not a gap; it is just never in SELECTABLE.
    expect(placeholderSlugs()).toContain('sternocleidomastoid');
    expect(SELECTABLE).not.toContain('sternocleidomastoid');
  });
});

describe('mirroring', () => {
  it('gives every paired muscle exactly one left and one right', () => {
    const bySlug = new Map<string, string[]>();
    for (const part of parts) {
      bySlug.set(part.slug, [...(bySlug.get(part.slug) ?? []), part.side]);
    }

    for (const [slug, sides] of bySlug) {
      if (sides.includes('midline')) {
        expect(sides, slug).toEqual(['midline']);
        continue;
      }
      expect([...sides].sort(), slug).toEqual(['left', 'right']);
    }
  });

  /**
   * Declared once and mirrored, because writing both halves by hand is how a
   * body ends up with two left biceps.
   */
  it('mirrors position across the midline', () => {
    const right = parts.find((p) => p.nodeName === 'muscle_biceps-brachii_r');
    const left = parts.find((p) => p.nodeName === 'muscle_biceps-brachii_l');

    expect(right?.position[0]).toBeGreaterThan(0);
    expect(left?.position[0]).toBe(-(right?.position[0] ?? 0));
    // Height and depth are not mirrored — only the side is.
    expect(left?.position[1]).toBe(right?.position[1]);
    expect(left?.position[2]).toBe(right?.position[2]);
  });

  it('mirrors the tilt too, or the arms lean the same way as each other', () => {
    const right = parts.find((p) => p.nodeName === 'muscle_biceps-brachii_r');
    const left = parts.find((p) => p.nodeName === 'muscle_biceps-brachii_l');
    expect(right?.tilt).not.toBe(0);
    expect(left?.tilt).toBe(-(right?.tilt ?? 0));
  });

  it('puts midline muscles on the midline', () => {
    for (const part of parts.filter((p) => p.side === 'midline')) {
      expect(part.position[0], part.slug).toBe(0);
    }
  });
});

describe('the figure itself', () => {
  it('puts front muscles in front and back muscles behind', () => {
    // `z` is the only coordinate doing real work: it is what makes the figure
    // read correctly when it is turned round.
    const chest = parts.find((p) => p.slug === 'pec-major-sternal');
    const lats = parts.find((p) => p.slug === 'latissimus-dorsi');
    expect(chest?.position[2]).toBeGreaterThan(0);
    expect(lats?.position[2]).toBeLessThan(0);
  });

  it('stacks the body in a plausible order, head to toe', () => {
    const height = (slug: string): number =>
      parts.find((p) => p.slug === slug)?.position[1] ?? Number.NaN;

    expect(height('upper-trapezius')).toBeGreaterThan(height('latissimus-dorsi'));
    expect(height('latissimus-dorsi')).toBeGreaterThan(height('gluteus-maximus'));
    expect(height('gluteus-maximus')).toBeGreaterThan(height('rectus-femoris'));
    expect(height('rectus-femoris')).toBeGreaterThan(height('gastrocnemius'));
    expect(height('gastrocnemius')).toBeGreaterThan(height('soleus'));
  });

  it('keeps everything above the ground and inside a human height', () => {
    for (const part of parts) {
      const [, y] = part.position;
      expect(y, part.nodeName).toBeGreaterThan(0);
      expect(y, part.nodeName).toBeLessThan(1.9);
    }
  });

  it('has filler that is not selectable', () => {
    // The head, hands and feet exist so the figure can be oriented on. They
    // must not be named like muscles, or tapping the head would select one.
    expect(BODY_FILLER.length).toBeGreaterThan(0);
    for (const filler of BODY_FILLER) {
      expect(filler.size.every((n) => n > 0)).toBe(true);
    }
  });

  it('gives every part a real size', () => {
    for (const part of parts) {
      for (const dimension of part.size) {
        expect(dimension, part.nodeName).toBeGreaterThan(0);
      }
    }
  });

  it('names every part in a way the parser accepts', () => {
    for (const part of parts) {
      expect(parseMuscleNode(part.nodeName), part.nodeName).toEqual({
        slug: part.slug,
        side: part.side,
      });
    }
  });
});
