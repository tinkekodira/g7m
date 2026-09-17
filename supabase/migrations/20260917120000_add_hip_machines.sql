-- ============================================================================
-- The two hip machines every commercial gym has and the catalogue did not.
--
-- The adductor (inner thigh) and abductor (outer thigh) machines are the only
-- direct work most people ever give those muscles, and one of them —
-- `hip-adductors` — had no primary exercise at all. That is not a cosmetic
-- gap: the generator prescribes by muscle group, the body map colours by what
-- was trained, and a group nothing trains as a primary is a group that stays
-- grey forever.
--
-- ## Two rows in `equipment`, deliberately
--
-- A new item in `equipment` appears in everybody's equipment picker, which
-- ADR-0010 treats as a decision of its own rather than a side effect of adding
-- an exercise. It is the right call here: these are two distinct stations,
-- they are not interchangeable with anything already on the list, and a gym
-- either has them or does not — which is exactly the question the picker asks.
--
-- The cable lat pullover, also asked for, is **already in the catalogue** as
-- `straight-arm-pulldown`, with "cable lat pullover" among its aliases since
-- the migration that made it findable. Adding a second row for it would put
-- the same movement in the library twice.
--
-- Same shape as the original seeds: idempotent on slug, so re-running is safe.
-- ============================================================================

insert into public.equipment (slug, name, category) values
  ('adductor-machine', 'Adductor machine', 'machine'),
  ('abductor-machine', 'Abductor machine', 'machine')
on conflict (slug) do update
  set name     = excluded.name,
      category = excluded.category;

insert into public.exercises
  (slug, name, aliases, mechanic, force, joint_count, difficulty, is_unilateral,
   is_time_based, instructions, cues, common_mistakes,
   default_rep_low, default_rep_high, default_rest_seconds, popularity_rank)
values

('hip-adduction-machine', 'Adductor Machine',
 array['adductor machine','inner thigh machine','hip adduction','adduction machine',
       'inner thigh','adductors'],
 'isolation', 'pull', 1, 'beginner', false, false,
 array['Sit with your back against the pad and your knees against the inside pads.',
       'Squeeze your knees together until the pads nearly touch.',
       'Let them open again under control, only as far as the stretch is comfortable.'],
 array['Squeeze, do not swing','Stop the return where the stretch starts, not where it hurts'],
 array['Loading it so heavily the return becomes a drop',
       'Opening wider than the hips are warm for, chasing range'],
 12, 20, 60, 86),

('hip-abduction-machine', 'Abductor Machine',
 array['abductor machine','outer thigh machine','hip abduction','abduction machine',
       'glute machine','outer thigh'],
 'isolation', 'push', 1, 'beginner', false, false,
 array['Sit with your back against the pad and your knees against the outside pads.',
       'Press your knees apart as far as they go comfortably.',
       'Bring them back under control rather than letting the stack pull them in.'],
 array['Sit upright; leaning forward changes which part of the glute works',
       'Pause at the widest point'],
 array['Using the whole stack and moving two inches',
       'Rocking the torso to get the last few degrees'],
 12, 20, 60, 88)

on conflict (slug) do update
  set name                 = excluded.name,
      aliases              = excluded.aliases,
      mechanic             = excluded.mechanic,
      force                = excluded.force,
      joint_count          = excluded.joint_count,
      difficulty           = excluded.difficulty,
      is_unilateral        = excluded.is_unilateral,
      is_time_based        = excluded.is_time_based,
      instructions         = excluded.instructions,
      cues                 = excluded.cues,
      common_mistakes      = excluded.common_mistakes,
      default_rep_low      = excluded.default_rep_low,
      default_rep_high     = excluded.default_rep_high,
      default_rest_seconds = excluded.default_rest_seconds,
      popularity_rank      = excluded.popularity_rank;

-- ----------------------------------------------------------------------------
-- What each one needs: its own station, and nothing else.
-- ----------------------------------------------------------------------------
insert into public.exercise_equipment (exercise_id, equipment_id, is_primary)
select e.id, q.id, x.is_primary
from (values
  ('hip-adduction-machine', 'adductor-machine', true),
  ('hip-abduction-machine', 'abductor-machine', true)
) as x(exercise_slug, equipment_slug, is_primary)
join public.exercises e on e.slug = x.exercise_slug
join public.equipment q on q.slug = x.equipment_slug
on conflict (exercise_id, equipment_id) do update
  set is_primary = excluded.is_primary;

-- ----------------------------------------------------------------------------
-- What each one trains.
--
-- Adduction is the adductors and little else, which is the point of it.
-- Abduction is mostly the gluteus medius, with the upper fibres of the maximus
-- helping once the knees are well apart.
-- ----------------------------------------------------------------------------
insert into public.exercise_muscles (exercise_id, muscle_id, role, recruitment_weight)
select e.id, m.id, x.role, x.weight
from (values
  ('hip-adduction-machine','hip-adductors','primary',0.95),

  ('hip-abduction-machine','gluteus-medius','primary',0.95),
  ('hip-abduction-machine','gluteus-maximus','secondary',0.45)
) as x(exercise_slug, muscle_slug, role, weight)
join public.exercises e on e.slug = x.exercise_slug
join public.muscles  m on m.slug = x.muscle_slug
on conflict (exercise_id, muscle_id) do update
  set role = excluded.role,
      recruitment_weight = excluded.recruitment_weight;
