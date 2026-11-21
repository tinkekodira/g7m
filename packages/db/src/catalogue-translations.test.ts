/**
 * Every row of the catalogue, in every language the app speaks (ADR-0181).
 *
 * The translations live in `@g7m/i18n`, keyed by slug, and the catalogue
 * lives in the migrations. Nothing ties the two together except this test:
 * an exercise added in a migration without its five translations, or a
 * translation whose slug was mistyped, fails here rather than showing an
 * English card in the middle of a German library.
 */
import { LOCALES, type CatalogueText } from '@g7m/i18n';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bundle as de } from '../../i18n/src/bundles/de.js';
import { bundle as es } from '../../i18n/src/bundles/es.js';
import { bundle as fr } from '../../i18n/src/bundles/fr.js';
import { bundle as it_ } from '../../i18n/src/bundles/it.js';
import { bundle as pt } from '../../i18n/src/bundles/pt.js';
import { startHarness, type Harness } from './testing/pglite-harness.js';

interface Row {
  readonly slug: string;
  readonly instructions?: readonly string[];
  readonly cues?: readonly string[];
  readonly common_mistakes?: readonly string[];
}

let h: Harness;
let exercises: Row[];
let muscles: string[];
let groups: string[];
let equipment: string[];

beforeAll(async () => {
  h = await startHarness();
  const slugs = async (table: string) =>
    (await h.db.query<{ slug: string }>(`select slug from public.${table} order by slug`)).rows.map(
      (row) => row.slug,
    );
  exercises = (
    await h.db.query<Row>(
      'select slug, instructions, cues, common_mistakes from public.exercises order by slug',
    )
  ).rows;
  muscles = await slugs('muscles');
  groups = await slugs('muscle_groups');
  equipment = await slugs('equipment');
}, 120_000);
afterAll(async () => h?.close());

const catalogues: Record<string, CatalogueText | null> = {
  de: de.catalogue,
  es: es.catalogue,
  fr: fr.catalogue,
  pt: pt.catalogue,
  it: it_.catalogue,
};

it('has a catalogue for every language but English', () => {
  expect(Object.keys(catalogues).sort()).toEqual(LOCALES.filter((l) => l !== 'en').sort());
});

describe.each(Object.entries(catalogues))('%s', (_locale, catalogue) => {
  it('translates every exercise, and nothing that is not one', () => {
    const text = catalogue?.exercises ?? {};
    expect(Object.keys(text).sort()).toEqual(exercises.map((row) => row.slug));
  });

  it('keeps every instruction, cue and mistake, one for one', () => {
    for (const row of exercises) {
      const local = catalogue?.exercises[row.slug];
      expect(local?.name.trim(), row.slug).not.toBe('');
      expect(local?.instructions.length, `${row.slug} instructions`).toBe(row.instructions?.length);
      expect(local?.cues.length, `${row.slug} cues`).toBe(row.cues?.length);
      expect(local?.commonMistakes.length, `${row.slug} mistakes`).toBe(
        row.common_mistakes?.length,
      );
      for (const line of [
        ...(local?.instructions ?? []),
        ...(local?.cues ?? []),
        ...(local?.commonMistakes ?? []),
      ]) {
        expect(line.trim(), row.slug).not.toBe('');
      }
    }
  });

  it('names every muscle, muscle group and piece of equipment', () => {
    expect(Object.keys(catalogue?.muscles ?? {}).sort()).toEqual(muscles);
    expect(Object.keys(catalogue?.muscleGroups ?? {}).sort()).toEqual(groups);
    expect(Object.keys(catalogue?.equipment ?? {}).sort()).toEqual(equipment);
  });
});
