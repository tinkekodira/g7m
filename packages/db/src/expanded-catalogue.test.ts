import { readFileSync } from 'node:fs';
import { loadTypeForEquipment } from '@g7m/core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startHarness, type Harness } from './testing/pglite-harness.js';

let h: Harness;
beforeAll(async () => {
  h = await startHarness();
}, 120_000);
afterAll(async () => h?.close());

// Pin the requested variants, their actual stations and their main training target.
// An inner join with an incorrect equipment/muscle slug can silently omit a link.
const additions = [
  ['machine-lateral-raise', 'lateral-raise-machine', 'lateral-deltoid'],
  ['machine-shrug', 'shrug-machine', 'upper-trapezius'],
  ['machine-triceps-extension', 'triceps-extension-machine', 'triceps-lateral-head'],
  ['smith-machine-bulgarian-split-squat', 'smith-machine', 'vastus-lateralis'],
  ['muscle-up', 'pull-up-bar', 'latissimus-dorsi'],
  ['arnold-press', 'dumbbell', 'anterior-deltoid'],
  ['jm-press', 'barbell', 'triceps-lateral-head'],
  ['incline-push-up', 'bodyweight-only', 'pec-major-sternal'],
  ['decline-push-up', 'bodyweight-only', 'pec-major-clavicular'],
  ['bench-dips', 'bodyweight-only', 'triceps-lateral-head'],
  ['ab-wheel-rollout', 'ab-wheel', 'rectus-abdominis'],
  ['barbell-calf-raise', 'barbell', 'gastrocnemius'],
  ['spider-curl-ez-bar', 'ez-bar', 'biceps-brachii'],
  ['spider-curl-dumbbell', 'dumbbell', 'biceps-brachii'],
  ['strict-curl', 'ez-bar', 'biceps-brachii'],
  ['wrist-curl-dumbbell', 'dumbbell', 'wrist-flexors'],
  ['seated-dip-machine', 'seated-dip-machine', 'triceps-lateral-head'],
  ['scissor-kicks', 'bodyweight-only', 'rectus-abdominis'],
  ['pike-push-up', 'bodyweight-only', 'anterior-deltoid'],
  ['pistol-squat', 'bodyweight-only', 'vastus-lateralis'],
  ['neck-curl', 'bodyweight-only', 'sternocleidomastoid'],
  ['mountain-climbers', 'bodyweight-only', 'rectus-abdominis'],
  ['bicycle-crunch', 'bodyweight-only', 'external-obliques'],
  ['box-squat', 'barbell', 'gluteus-maximus'],
  ['russian-twists', 'bodyweight-only', 'external-obliques'],
  ['cable-lateral-raise', 'cable-machine', 'lateral-deltoid'],
  ['clean-and-jerk', 'barbell', 'vastus-lateralis'],
  ['decline-bench-press', 'barbell', 'pec-major-sternal'],
  ['decline-smith-bench-press', 'smith-machine', 'pec-major-sternal'],
  ['decline-dumbbell-fly', 'dumbbell', 'pec-major-sternal'],
  ['decline-dumbbell-bench-press', 'dumbbell', 'pec-major-sternal'],
  ['diamond-push-ups', 'bodyweight-only', 'triceps-lateral-head'],
  ['barbell-lunge', 'barbell', 'vastus-lateralis'],
  ['trap-bar-shrug', 'trap-bar', 'upper-trapezius'],
  ['incline-hammer-curl', 'dumbbell', 'brachialis'],
  ['incline-dumbbell-fly', 'dumbbell', 'pec-major-clavicular'],
  ['incline-cable-curl', 'cable-machine', 'biceps-brachii'],
  ['log-press', 'log-bar', 'anterior-deltoid'],
] as const;

describe('November exercise expansion', () => {
  it.each(additions)(
    '%s has the correct station and primary muscle',
    async (slug, station, muscle) => {
      const { rows } = await h.db.query<{ station: string; muscles: string[] }>(
        `select q.slug as station,
              array(select m.slug from public.exercise_muscles em
                    join public.muscles m on m.id = em.muscle_id
                    where em.exercise_id = e.id and em.role = 'primary') as muscles
       from public.exercises e
       join public.exercise_equipment ee on ee.exercise_id = e.id and ee.is_primary
       join public.equipment q on q.id = ee.equipment_id
       where e.slug = $1 and e.is_active`,
        [slug],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]?.station).toBe(station);
      expect(rows[0]?.muscles).toContain(muscle);
    },
  );

  it.each([
    ['incline-push-up', 'bodyweight', ['bodyweight-only', 'flat-bench']],
    ['decline-push-up', 'bodyweight', ['bodyweight-only', 'flat-bench']],
    ['bench-dips', 'bodyweight', ['bodyweight-only', 'flat-bench']],
    ['neck-curl', 'bodyweight', ['bodyweight-only', 'flat-bench']],
    ['ab-wheel-rollout', 'bodyweight', ['ab-wheel']],
    ['arnold-press', 'external', ['dumbbell']],
    ['box-squat', 'external', ['barbell', 'squat-box', 'squat-rack']],
    ['spider-curl-ez-bar', 'external', ['ez-bar', 'incline-bench']],
    ['spider-curl-dumbbell', 'external', ['dumbbell', 'incline-bench']],
    ['smith-machine-bulgarian-split-squat', 'external', ['flat-bench', 'smith-machine']],
    ['decline-smith-bench-press', 'external', ['decline-bench', 'smith-machine']],
    ['incline-cable-curl', 'external', ['cable-machine', 'incline-bench']],
    ['seated-dip-machine', 'external', ['seated-dip-machine']],
    ['log-press', 'external', ['log-bar']],
  ])(
    '%s requires its accessories and logs the right load type',
    async (slug, loadType, equipment) => {
      const { rows } = await h.db.query<{ slug: string; category: string; isPrimary: boolean }>(
        `select q.slug, q.category, ee.is_primary as "isPrimary"
       from public.exercise_equipment ee
       join public.exercises e on e.id = ee.exercise_id
       join public.equipment q on q.id = ee.equipment_id
       where e.slug = $1 order by q.slug`,
        [slug],
      );
      expect(rows.map((row) => row.slug)).toEqual(equipment);
      expect(loadTypeForEquipment(rows)).toBe(loadType);
    },
  );

  it('keeps side-specific logging separate from bilateral work', async () => {
    const { rows } = await h.db.query<{ slug: string }>(
      `select slug from public.exercises where slug = any($1) and is_unilateral order by slug`,
      [additions.map(([slug]) => slug)],
    );
    expect(rows.map((row) => row.slug)).toEqual([
      'barbell-lunge',
      'cable-lateral-raise',
      'pistol-squat',
      'smith-machine-bulgarian-split-squat',
    ]);
  });

  it('preserves exercise IDs and links when the data migration is reapplied', async () => {
    const snapshot = () =>
      h.db.query(`
      select e.id, e.slug,
             (select count(*) from public.exercise_equipment where exercise_id = e.id) as kit,
             (select count(*) from public.exercise_muscles where exercise_id = e.id) as muscles
      from public.exercises e order by e.slug`);
    const before = await snapshot();
    for (const file of [
      '20261107120000_expand_exercise_catalogue.sql',
      '20261107130000_align_arnold_press_artwork.sql',
    ]) {
      await h.db.exec(
        readFileSync(new URL(`../../../supabase/migrations/${file}`, import.meta.url), 'utf8'),
      );
    }
    expect((await snapshot()).rows).toEqual(before.rows);
  });
});
