import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MUSCLE_COLORS, muscleColorStyle } from './muscle-colors.js';

describe('Browse muscle colors', () => {
  it('covers every seeded group with a distinct color based on the existing region palette', () => {
    const seed = readFileSync(
      new URL('../../../../supabase/migrations/20260905130000_seed_taxonomy.sql', import.meta.url),
      'utf8',
    );
    const groups = seed.split('on conflict')[0] ?? '';
    const slugs = [...groups.matchAll(/\('([a-z]+)',\s+'[^']+',\s+\d+\)/g)].map(
      (match) => match[1],
    );
    expect(slugs.length).toBe(14);
    expect(Object.keys(MUSCLE_COLORS).sort()).toEqual(slugs.sort());
    expect(new Set(Object.values(MUSCLE_COLORS)).size).toBe(slugs.length);
    for (const color of Object.values(MUSCLE_COLORS)) expect(color).toContain('var(--region-');
  });

  it('leaves missing and unknown muscle groups neutral', () => {
    expect(muscleColorStyle(null)).toBeUndefined();
    expect(muscleColorStyle('unknown')).toBeUndefined();
    expect(muscleColorStyle('toString')).toBeUndefined();
  });
});
