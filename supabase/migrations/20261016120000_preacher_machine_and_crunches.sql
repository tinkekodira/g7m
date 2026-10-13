-- ============================================================================
-- A preacher curl machine, and two crunches that can take a plate.
--
-- ## The preacher curl machine is its own exercise
--
-- The catalogue had three preacher curls, one per bar: EZ bar, barbell and
-- dumbbell, all on the free-standing preacher bench. The machine is a
-- different station: a seat, a fixed arm pad and a lever or a cable on a
-- weight stack. Its numbers are pins in a stack, not plates on a bar, so 30 on
-- it means nothing next to 30 on the EZ bar, and the two are logged apart for
-- the same reason the bars are (see 20261001120000_exercise_list_changes).
--
-- It needs a new `equipment` row. ADR-0010 treats that as a decision of its
-- own, because every new row shows up in everybody's equipment picker. It is
-- the right call here for the reason the hip machines gave: a gym either has
-- this machine or it does not, and nothing already on the list stands in for
-- it.
--
-- ## Two crunches, bodyweight with an optional plate
--
-- The ab crunch on the floor and the decline crunch on a decline bench. Both
-- are bodyweight movements that people load by holding a plate on the chest,
-- so both are filed under `bodyweight-only`. That makes them `bodyweight` in
-- the logger, which is what offers "+ Add weight" and records the plate as
-- added load on top of the lifter (`bodyweight_plus`).
--
-- The decline crunch also needs the decline bench, as an accessory, so the
-- generator never offers it to somebody without one. An accessory qualifies
-- an exercise and adds no resistance, so the load type is read from the
-- primary equipment only (`loadTypeForEquipment` in core). Without that rule
-- the bench, whose category is `other`, would have turned the crunch into an
-- external lift logged as "0 kg". The decline bench was the one piece of
-- equipment no exercise used, and now one does.
--
-- Same shape as the original seeds: idempotent on slug, so re-running is safe.
-- ============================================================================

insert into public.equipment (slug, name, category) values
  ('preacher-curl-machine', 'Preacher curl machine', 'machine')
on conflict (slug) do update
  set name     = excluded.name,
      category = excluded.category;

insert into public.exercises
  (slug, name, aliases, mechanic, force, joint_count, difficulty, is_unilateral,
   is_time_based, instructions, cues, common_mistakes,
   default_rep_low, default_rep_high, default_rest_seconds, popularity_rank)
values

('preacher-curl-machine', 'Preacher Curl (Machine)',
 array['preacher curl machine','machine preacher curl','machine curl','bicep curl machine',
       'biceps curl machine','preacher','preacher curl'],
 'isolation', 'pull', 1, 'beginner', false, false,
 array['Set the seat so the backs of your upper arms lie flat on the pad and your armpits meet its top edge.',
       'Take the handles palms up and curl them towards your shoulders.',
       'Lower slowly until the arms are almost straight, without letting the stack touch down.'],
 array['Upper arms stay on the pad','Squeeze at the top','Slow on the way down'],
 array['Lifting the elbows off the pad to finish the rep',
       'Letting the weight drop at the bottom, which strains the elbow'],
 10, 15, 75, 178),

('ab-crunch', 'Ab Crunch',
 array['crunch','crunches','ab crunches','abdominal crunch','floor crunch','weighted crunch'],
 'isolation', 'pull', 1, 'beginner', false, false,
 array['Lie on your back with knees bent and feet flat, hands beside the head or a plate held on the chest.',
       'Curl the shoulders off the floor by rounding the upper back, ribs towards the hips.',
       'Pause at the top, then lower under control until the shoulders touch down.'],
 array['Ribs to hips','Lower back stays on the floor','Breathe out on the way up'],
 array['Pulling on the head with the hands',
       'Sitting all the way up, which turns it into a hip flexor exercise'],
 12, 20, 60, 185),

('decline-ab-crunch', 'Decline Ab Crunch',
 array['decline crunch','decline crunches','decline ab crunches','decline bench crunch',
       'weighted decline crunch'],
 'isolation', 'pull', 1, 'intermediate', false, false,
 array['Hook your feet under the pads of a decline bench and lie back, hands beside the head or a plate held on the chest.',
       'Curl the shoulders up by rounding the upper back, ribs towards the hips.',
       'Lower under control, stopping before the shoulders rest on the bench to keep tension on the abs.'],
 array['Round the spine, do not hinge at the hips','Slow on the way down','Breathe out on the way up'],
 array['Swinging up with momentum and dropping back down',
       'Sitting all the way up, which hands the work to the hip flexors'],
 10, 20, 60, 210)

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
-- What each one needs. The decline bench is the crunch's accessory, not its
-- station: the load is the lifter (see above).
-- ----------------------------------------------------------------------------
insert into public.exercise_equipment (exercise_id, equipment_id, is_primary)
select e.id, q.id, x.is_primary
from (values
  ('preacher-curl-machine', 'preacher-curl-machine', true),
  ('ab-crunch',             'bodyweight-only',       true),
  ('decline-ab-crunch',     'bodyweight-only',       true),
  ('decline-ab-crunch',     'decline-bench',         false)
) as x(exercise_slug, equipment_slug, is_primary)
join public.exercises e on e.slug = x.exercise_slug
join public.equipment q on q.slug = x.equipment_slug
on conflict (exercise_id, equipment_id) do update
  set is_primary = excluded.is_primary;

-- ----------------------------------------------------------------------------
-- What each one trains.
--
-- The machine is the preacher curl's muscles, the same as on the bars. Both
-- crunches are the rectus abdominis with the obliques helping; the decline
-- loads it more through a longer range, so it weighs a little more.
-- ----------------------------------------------------------------------------
insert into public.exercise_muscles (exercise_id, muscle_id, role, recruitment_weight)
select e.id, m.id, x.role, x.weight
from (values
  ('preacher-curl-machine','biceps-brachii','primary',0.95),
  ('preacher-curl-machine','brachialis','secondary',0.60),

  ('ab-crunch','rectus-abdominis','primary',0.90),
  ('ab-crunch','external-obliques','secondary',0.45),

  ('decline-ab-crunch','rectus-abdominis','primary',0.95),
  ('decline-ab-crunch','external-obliques','secondary',0.50)
) as x(exercise_slug, muscle_slug, role, weight)
join public.exercises e on e.slug = x.exercise_slug
join public.muscles  m on m.slug = x.muscle_slug
on conflict (exercise_id, muscle_id) do update
  set role = excluded.role,
      recruitment_weight = excluded.recruitment_weight;
