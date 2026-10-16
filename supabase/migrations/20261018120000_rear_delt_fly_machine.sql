-- ============================================================================
-- The rear delt fly on a machine, apart from the one with dumbbells.
--
-- The catalogue's Rear Delt Fly is the bent-over dumbbell version. The machine
-- is a different station: seated, chest on an upright pad, arms swept back on
-- handles hung from a weight stack. Its numbers are pins in a stack, not the
-- weight of two dumbbells, so 40 on it means nothing next to 2 x 10 kg, and
-- the two are logged apart for the same reason the preacher curls are (see
-- 20261016120000_preacher_machine_and_crunches).
--
-- ## No new equipment row
--
-- The station is the pec deck turned round: the machine drawn for it is a
-- Life Fitness "Pectoral Fly / Rear Deltoid", and the pec deck already on the
-- list is the Hammer Strength version of the same thing. Somebody whose gym
-- has a pec deck has this exercise, so it is filed under `pec-deck` and the
-- equipment picker stays as it is (ADR-0010 treats a new row as a decision of
-- its own; this one is not needed).
--
-- Same shape as the original seeds: idempotent on slug, so re-running is safe.
-- ============================================================================

insert into public.exercises
  (slug, name, aliases, mechanic, force, joint_count, difficulty, is_unilateral,
   is_time_based, instructions, cues, common_mistakes,
   default_rep_low, default_rep_high, default_rest_seconds, popularity_rank)
values

('rear-delt-fly-machine', 'Rear Delt Fly (Machine)',
 array['reverse pec deck','reverse fly machine','rear delt machine','machine rear delt fly',
       'machine reverse fly','reverse pec fly','rear deltoid machine'],
 'isolation', 'pull', 1, 'beginner', false, false,
 array['Sit facing the machine with your chest against the pad, and set the seat so the handles are level with your shoulders.',
       'Take the handles with a slight bend in the elbows and sweep them out and back until the arms are in line with your body.',
       'Return slowly until the handles nearly meet, without letting the stack touch down.'],
 array['Lead with the elbows','Chest stays on the pad','Slow on the way back'],
 array['Shrugging the shoulders up, which hands the work to the upper traps',
       'Leaning back off the pad to swing the weight'],
 12, 20, 60, 135)

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

insert into public.exercise_equipment (exercise_id, equipment_id, is_primary)
select e.id, q.id, x.is_primary
from (values
  ('rear-delt-fly-machine', 'pec-deck', true)
) as x(exercise_slug, equipment_slug, is_primary)
join public.exercises e on e.slug = x.exercise_slug
join public.equipment q on q.slug = x.equipment_slug
on conflict (exercise_id, equipment_id) do update
  set is_primary = excluded.is_primary;

-- ----------------------------------------------------------------------------
-- What it trains: the dumbbell fly's muscles. The pad takes the lower back out
-- of it, so the rear delts carry a little more of the work.
-- ----------------------------------------------------------------------------
insert into public.exercise_muscles (exercise_id, muscle_id, role, recruitment_weight)
select e.id, m.id, x.role, x.weight
from (values
  ('rear-delt-fly-machine','posterior-deltoid','primary',0.95),
  ('rear-delt-fly-machine','rhomboids','secondary',0.45),
  ('rear-delt-fly-machine','middle-trapezius','secondary',0.40)
) as x(exercise_slug, muscle_slug, role, weight)
join public.exercises e on e.slug = x.exercise_slug
join public.muscles  m on m.slug = x.muscle_slug
on conflict (exercise_id, muscle_id) do update
  set role = excluded.role,
      recruitment_weight = excluded.recruitment_weight;
