-- ============================================================================
-- Two exercises the catalogue was missing, and one it had but could not find.
--
-- The skull crusher is the plain gap: the 50 carried a pushdown, an overhead
-- extension and a close-grip bench, and not the lying extension most triceps
-- work is actually built around.
--
-- The cable pullover was **already there**, as `straight-arm-pulldown`. It was
-- reported missing because it is unfindable: its aliases were 'straight arm
-- pushdown' and 'lat pushdown', so searching "pullover" — which is what
-- everybody calls it — matched nothing at all, and a popularity rank of 180
-- put it near the bottom of a filtered list. Renaming it would break anyone's
-- muscle memory for the name on the screen, so it keeps its name and gains the
-- words people look for.
--
-- That leaves a real gap next to it: the dumbbell version is a different
-- session, not a variant. The cable holds tension through the whole range; the
-- dumbbell loads the stretch and almost nothing else.
--
-- No plate-loaded pullover machine. That needs a new row in `equipment` and
-- therefore a new item in everybody's equipment picker, which is a bigger
-- decision than adding an exercise and should be made on its own.
--
-- Same shape as the original seeds: idempotent on slug, so re-running is safe.
-- ============================================================================

insert into public.exercises
  (slug, name, aliases, mechanic, force, joint_count, difficulty, is_unilateral,
   is_time_based, instructions, cues, common_mistakes,
   default_rep_low, default_rep_high, default_rest_seconds, popularity_rank)
values

('skull-crusher', 'Skull Crusher',
 array['lying triceps extension','french press','ez bar skullcrusher','skullcrusher'],
 'isolation', 'push', 1, 'intermediate', false, false,
 array['Lie on a flat bench holding an EZ bar over your chest.',
       'Keep the upper arms still and bend at the elbows, lowering toward your forehead.',
       'Extend back up without letting the elbows drift forward.'],
 array['Upper arms stay where they are','Lower behind the head, not to the nose'],
 array['Turning it into a press by swinging the elbows',
       'Going so heavy the shoulders take over'],
 8, 12, 90, 58),

-- Already in the catalogue. Same row, findable: the words people actually use
-- for it, and a rank that reflects how common it is rather than 180th.
('straight-arm-pulldown', 'Straight-Arm Pulldown',
 array['cable pullover','lat pullover','pullover','straight arm pushdown','lat pushdown',
       'cable lat pullover'],
 'isolation', 'pull', 1, 'beginner', false, false,
 array['Stand facing a high pulley with a straight bar or rope.',
       'Keep the elbows almost locked and hinge slightly forward.',
       'Sweep the bar down to your thighs, then return overhead.'],
 array['Elbows stay fixed','Feel it in the armpit, not the triceps'],
 array['Bending the elbows and turning it into a pushdown'],
 12, 15, 75, 72),

('dumbbell-pullover', 'Dumbbell Pullover',
 array['db pullover','lat pullover','bench pullover'],
 'isolation', 'pull', 1, 'intermediate', false, false,
 array['Lie along or across a flat bench holding one dumbbell over your chest.',
       'Lower it back over your head with the elbows only slightly bent.',
       'Pull it back over the chest without letting the ribs flare.'],
 array['Ribs down','Stop where the stretch stops, not where the shoulder gives'],
 array['Letting the elbows collapse, which hands the work to the triceps',
       'Going deeper than the shoulder is comfortable with for the sake of range'],
 10, 15, 90, 78)

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
-- What each one needs.
-- ----------------------------------------------------------------------------
insert into public.exercise_equipment (exercise_id, equipment_id, is_primary)
select e.id, q.id, x.is_primary
from (values
  ('skull-crusher',          'ez-bar',        true),
  ('skull-crusher',          'flat-bench',    false),
  ('dumbbell-pullover',      'dumbbell',      true),
  ('dumbbell-pullover',      'flat-bench',    false)
) as x(exercise_slug, equipment_slug, is_primary)
join public.exercises e on e.slug = x.exercise_slug
join public.equipment q on q.slug = x.equipment_slug
on conflict (exercise_id, equipment_id) do update
  set is_primary = excluded.is_primary;

-- ----------------------------------------------------------------------------
-- What each one trains.
--
-- The pullovers name the teres major as well as the lats. It is the muscle
-- that does most of the work people credit to "the lats" in this movement, and
-- it is one of the five with no geometry on the model — so an exercise panel
-- is the only place it will ever be seen.
-- ----------------------------------------------------------------------------
insert into public.exercise_muscles (exercise_id, muscle_id, role, recruitment_weight)
select e.id, m.id, x.role, x.weight
from (values
  ('skull-crusher','triceps-long-head','primary',0.90),
  ('skull-crusher','triceps-lateral-head','primary',0.80),
  ('skull-crusher','triceps-medial-head','primary',0.80),

  ('dumbbell-pullover','latissimus-dorsi','primary',0.85),
  ('dumbbell-pullover','teres-major','secondary',0.60),
  ('dumbbell-pullover','pec-major-sternal','secondary',0.50),
  ('dumbbell-pullover','triceps-long-head','secondary',0.40)
) as x(exercise_slug, muscle_slug, role, weight)
join public.exercises e on e.slug = x.exercise_slug
join public.muscles  m on m.slug = x.muscle_slug
on conflict (exercise_id, muscle_id) do update
  set role = excluded.role,
      recruitment_weight = excluded.recruitment_weight;
