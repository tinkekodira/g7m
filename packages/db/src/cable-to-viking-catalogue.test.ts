import { readFileSync } from 'node:fs';
import { loadTypeForEquipment, trainingProfile } from '@g7m/core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startHarness, type Harness } from './testing/pglite-harness.js';

let h: Harness;
beforeAll(async () => {
  h = await startHarness();
}, 120_000);
afterAll(async () => h?.close());

const additions = [
  ['cable-kickback', 'cable-machine', 'gluteus-maximus', true],
  ['burpees', 'bodyweight-only', 'vastus-lateralis', false],
  ['cable-hammer-curl', 'cable-machine', 'brachialis', false],
  ['close-grip-dumbbell-bench-press', 'dumbbell', 'pec-major-sternal', false],
  ['close-grip-incline-bench-press', 'barbell', 'triceps-lateral-head', false],
  ['close-grip-lat-pulldown', 'lat-pulldown', 'latissimus-dorsi', false],
  ['dumbbell-romanian-deadlift', 'dumbbell', 'biceps-femoris', false],
  ['flat-bench-dumbbell-fly', 'dumbbell', 'pec-major-sternal', false],
  ['handstand-push-ups', 'bodyweight-only', 'anterior-deltoid', false],
  ['hanging-knee-raise', 'pull-up-bar', 'rectus-abdominis', false],
  ['jumping-jacks', 'bodyweight-only', 'gastrocnemius', false],
  ['lying-leg-raise', 'bodyweight-only', 'rectus-abdominis', false],
  ['one-arm-cable-bicep-curl', 'cable-machine', 'biceps-brachii', true],
  ['one-arm-pull-ups', 'pull-up-bar', 'latissimus-dorsi', true],
  ['one-arm-push-ups', 'bodyweight-only', 'pec-major-sternal', true],
  ['one-arm-seated-cable-row', 'seated-row-machine', 'latissimus-dorsi', true],
  ['overhead-squat', 'barbell', 'vastus-lateralis', false],
  ['sissy-squat', 'bodyweight-only', 'rectus-femoris', false],
  ['sumo-deadlift', 'barbell', 'hip-adductors', false],
  ['sumo-squat', 'bodyweight-only', 'vastus-medialis', false],
  ['viking-press', 'viking-press', 'anterior-deltoid', false],
] as const;

describe('cable-to-Viking catalogue', () => {
  it.each(additions)(
    '%s has its own complete coaching, station and target',
    async (slug, station, muscle, unilateral) => {
      const { rows } = await h.db.query<{
        is_unilateral: boolean;
        is_time_based: boolean;
        instructions: string[];
        cues: string[];
        common_mistakes: string[];
        muscles: string[];
        station: string;
      }>(
        `select e.is_unilateral, e.is_time_based, e.instructions, e.cues, e.common_mistakes,
      q.slug as station, array(select m.slug from public.exercise_muscles em
        join public.muscles m on m.id = em.muscle_id
        where em.exercise_id = e.id and em.role = 'primary') as muscles
      from public.exercises e join public.exercise_equipment ee on ee.exercise_id = e.id and ee.is_primary
      join public.equipment q on q.id = ee.equipment_id where e.slug = $1 and e.is_active`,
        [slug],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ station, is_unilateral: unilateral, is_time_based: false });
      expect(rows[0]?.muscles).toContain(muscle);
      expect(rows[0]?.instructions.length).toBeGreaterThanOrEqual(3);
      expect(rows[0]?.cues.length).toBeGreaterThanOrEqual(3);
      expect(rows[0]?.common_mistakes.length).toBeGreaterThanOrEqual(2);
      expect(trainingProfile(slug)).toBeDefined();
    },
  );

  it.each([
    ['close-grip-incline-bench-press', 'external', ['barbell', 'incline-bench', 'squat-rack']],
    ['close-grip-dumbbell-bench-press', 'external', ['dumbbell', 'flat-bench']],
    ['flat-bench-dumbbell-fly', 'external', ['dumbbell', 'flat-bench']],
    ['one-arm-pull-ups', 'bodyweight', ['pull-up-bar']],
    ['one-arm-seated-cable-row', 'external', ['seated-row-machine']],
    ['sumo-squat', 'bodyweight', ['bodyweight-only']],
    ['sissy-squat', 'bodyweight', ['bodyweight-only']],
    ['viking-press', 'external', ['viking-press']],
  ])('%s retains the full setup and correct load type', async (slug, loadType, equipment) => {
    const { rows } = await h.db.query<{ slug: string; category: string; isPrimary: boolean }>(
      `select q.slug, q.category, ee.is_primary as "isPrimary" from public.exercise_equipment ee
       join public.exercises e on e.id = ee.exercise_id join public.equipment q on q.id = ee.equipment_id
       where e.slug = $1 order by q.slug`,
      [slug],
    );
    expect(rows.map((row) => row.slug)).toEqual(equipment);
    expect(loadTypeForEquipment(rows)).toBe(loadType);
  });

  it('keeps skill and conditioning movements out of accessory suggestions', () => {
    for (const slug of [
      'handstand-push-ups',
      'one-arm-pull-ups',
      'one-arm-push-ups',
      'overhead-squat',
      'sissy-squat',
      'burpees',
      'jumping-jacks',
    ]) {
      expect(trainingProfile(slug)?.emphases, slug).toEqual([]);
    }
  });

  it('preserves IDs and all links when replayed', async () => {
    const snapshot = () =>
      h.db.query(`select e.id, e.slug,
      (select jsonb_agg(to_jsonb(ee) - 'updated_at' order by ee.id) from public.exercise_equipment ee where ee.exercise_id = e.id) as kit,
      (select jsonb_agg(to_jsonb(em) - 'updated_at' order by em.id) from public.exercise_muscles em where em.exercise_id = e.id) as muscles
      from public.exercises e order by e.slug`);
    const before = await snapshot();
    await h.db.exec(
      readFileSync(
        new URL(
          '../../../supabase/migrations/20261109120000_cable_to_viking_exercises.sql',
          import.meta.url,
        ),
        'utf8',
      ),
    );
    expect((await snapshot()).rows).toEqual(before.rows);
  });
});
