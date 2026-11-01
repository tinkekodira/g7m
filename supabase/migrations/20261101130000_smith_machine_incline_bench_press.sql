-- A separate incline Smith press: preserve flat Smith and free-weight histories.
insert into public.exercises
  (slug, name, aliases, mechanic, force, joint_count, difficulty, is_unilateral,
   is_time_based, instructions, cues, common_mistakes,
   default_rep_low, default_rep_high, default_rest_seconds, popularity_rank)
values
('smith-machine-incline-bench-press', 'Smith Machine Incline Bench Press',
 array['smith incline bench press','smith incline press','incline smith press','smith machine incline chest press'],
 'compound', 'push', 2, 'beginner', false, false,
 array['Set an adjustable bench to a modest incline, around 30 to 45 degrees, and centre it under the Smith bar. Position it so the bar lowers toward your upper chest. Set the safety stops just below your intended bottom position and check the path with an unloaded bar.',
       'Lie back with your head, upper back and hips supported and both feet planted. Draw your shoulder blades gently back and down. Take a closed grip slightly wider than shoulder width with straight wrists.',
       'Rotate the bar to release the hooks. Lower slowly toward your upper chest, keeping your forearms aligned with the bar and elbows below shoulder level. Stop at a depth you can comfortably control.',
       'Press smoothly along the rails, keeping your shoulders and hips against the bench. Extend your arms without snapping the elbows straight.',
       'After the last rep, rotate the bar onto both hooks and check that it is secure before letting go.'],
 array['Keep the bench on a modest incline','Shoulder blades back and down',
       'Lower toward the upper chest with control','Check both hooks before releasing'],
 array['Positioning the bench so the fixed path forces the bar toward the neck or face',
       'Flaring the elbows or bending the wrists back',
       'Lifting the hips or shoulders off the bench or bouncing at the bottom',
       'Skipping the safety stops or releasing an unsecured bar'],
 8, 12, 120, 142)
on conflict (slug) do update
  set name = excluded.name, aliases = excluded.aliases,
      mechanic = excluded.mechanic, force = excluded.force,
      joint_count = excluded.joint_count, difficulty = excluded.difficulty,
      is_unilateral = excluded.is_unilateral, is_time_based = excluded.is_time_based,
      instructions = excluded.instructions, cues = excluded.cues,
      common_mistakes = excluded.common_mistakes,
      default_rep_low = excluded.default_rep_low, default_rep_high = excluded.default_rep_high,
      default_rest_seconds = excluded.default_rest_seconds, popularity_rank = excluded.popularity_rank;

insert into public.exercise_equipment (exercise_id, equipment_id, is_primary)
select e.id, q.id, x.is_primary
from (values
  ('smith-machine', true),
  ('incline-bench', false)
) as x(equipment_slug, is_primary)
join public.exercises e on e.slug = 'smith-machine-incline-bench-press'
join public.equipment q on q.slug = x.equipment_slug
on conflict (exercise_id, equipment_id) do update set is_primary = excluded.is_primary;

-- Same curated upper-chest emphasis as the other supported incline press.
insert into public.exercise_muscles (exercise_id, muscle_id, role, recruitment_weight)
select e.id, m.id, x.role, x.weight
from (values
  ('pec-major-clavicular', 'primary', 0.90),
  ('pec-major-sternal', 'secondary', 0.60),
  ('anterior-deltoid', 'secondary', 0.75),
  ('triceps-lateral-head', 'secondary', 0.55)
) as x(muscle_slug, role, weight)
join public.exercises e on e.slug = 'smith-machine-incline-bench-press'
join public.muscles m on m.slug = x.muscle_slug
on conflict (exercise_id, muscle_id) do update
  set role = excluded.role, recruitment_weight = excluded.recruitment_weight;
