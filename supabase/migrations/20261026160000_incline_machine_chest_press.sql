-- A supported incline press with separate equipment, loads and history.
insert into public.equipment (slug, name, category) values
  ('incline-chest-press-machine', 'Incline chest press machine', 'machine')
on conflict (slug) do update
  set name = excluded.name, category = excluded.category;

insert into public.exercises
  (slug, name, aliases, mechanic, force, joint_count, difficulty, is_unilateral,
   is_time_based, instructions, cues, common_mistakes,
   default_rep_low, default_rep_high, default_rest_seconds, popularity_rank)
values
('incline-machine-chest-press', 'Incline machine chest press',
 array['machine incline press','incline chest press','incline machine press','incline chest press machine'],
 'compound', 'push', 2, 'beginner', false, false,
 array['Choose a manageable load. On a plate-loaded machine, load both sides evenly. Adjust the seat or back pad so the handles start beside your upper chest.',
       'Lie back against the inclined pad with your feet planted and your hips supported. Draw your shoulder blades gently back and down.',
       'Take a full grip with straight wrists. Keep your elbows slightly below shoulder level and your forearms aligned with the handles.',
       'Breathe out and press the handles forward and upward along the machine''s path. Keep your shoulders and back against the pad; extend without snapping your elbows straight.',
       'Breathe in as you lower slowly until the handles return beside your upper chest, or to the deepest position you can comfortably control. Avoid bouncing or forcing a stretch.',
       'Repeat with a consistent range and pace. Return the handles gently to their stops before releasing your grip.'],
 array['Shoulder blades back and down',
       'Keep your back and hips on the pads',
       'Press smoothly; control the return',
       'Wrists straight, elbows below shoulder level'],
 array['Setting the pads so the handles start near the neck rather than the upper chest',
       'Lifting the hips or shoulders off the pads to move too much weight',
       'Flaring the elbows level with the shoulders or bending the wrists back',
       'Bouncing at the bottom, forcing depth or snapping the elbows straight'],
 8, 12, 120, 137)
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
select e.id, q.id, true
  from public.exercises e
  join public.equipment q on q.slug = 'incline-chest-press-machine'
 where e.slug = 'incline-machine-chest-press'
on conflict (exercise_id, equipment_id) do update set is_primary = excluded.is_primary;

-- Same regional emphasis as the other incline presses; the pad supports the torso.
insert into public.exercise_muscles (exercise_id, muscle_id, role, recruitment_weight)
select e.id, m.id, x.role, x.weight
from (values
  ('pec-major-clavicular', 'primary', 0.90),
  ('pec-major-sternal', 'secondary', 0.60),
  ('anterior-deltoid', 'secondary', 0.75),
  ('triceps-lateral-head', 'secondary', 0.55)
) as x(muscle_slug, role, weight)
join public.exercises e on e.slug = 'incline-machine-chest-press'
join public.muscles m on m.slug = x.muscle_slug
on conflict (exercise_id, muscle_id) do update
  set role = excluded.role, recruitment_weight = excluded.recruitment_weight;
