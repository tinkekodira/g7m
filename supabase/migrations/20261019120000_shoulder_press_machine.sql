-- A supported overhead press on its own machine. Keep its loads and history
-- separate from the barbell and dumbbell presses. A gym must have this station
-- for the planner to offer it, so it has its own equipment row as well.

insert into public.equipment (slug, name, category) values
  ('shoulder-press-machine', 'Shoulder press machine', 'machine')
on conflict (slug) do update
  set name = excluded.name, category = excluded.category;

insert into public.exercises
  (slug, name, aliases, mechanic, force, joint_count, difficulty, is_unilateral,
   is_time_based, instructions, cues, common_mistakes,
   default_rep_low, default_rep_high, default_rest_seconds, popularity_rank)
values
('shoulder-press-machine', 'Shoulder press machine',
 array['machine shoulder press','machine overhead press'],
 'compound', 'push', 2, 'beginner', false, false,
 array['Choose a manageable load; on plate-loaded machines, load both sides evenly. Adjust the seat so the handles start around shoulder height and you can reach them without stretching.',
       'Sit with your hips and upper back against the pads and your feet flat on the floor. Brace your abdomen and keep your ribs stacked over your hips.',
       'Take the handles with a full grip. Keep your wrists straight and your elbows slightly in front of your torso, with your forearms following the direction of the handles.',
       'Breathe out as you press the handles upward along the machine''s path. Keep your back against the pad and extend your arms without snapping your elbows straight.',
       'Breathe in as you lower slowly to the starting position, or as low as you can comfortably control. Keep the shoulders steady and avoid bouncing at the bottom.',
       'Repeat with the same range and pace. After the last repetition, return the handles gently to their stops before releasing your grip.'],
 array['Back on the pad, ribs down',
       'Wrists straight, elbows under the handles',
       'Press smoothly; control the way down',
       'Use a comfortable range without forcing depth'],
 array['Setting the seat too low or too high, so the handles start far below or above shoulder height',
       'Arching the lower back and lifting off the pad to move a load that is too heavy',
       'Bouncing out of the bottom or snapping the elbows straight at the top',
       'Bending the wrists back or forcing the handles below a comfortable shoulder position'],
 8, 12, 120, 136)
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
select e.id, q.id, true
  from public.exercises e
  join public.equipment q on q.slug = 'shoulder-press-machine'
 where e.slug = 'shoulder-press-machine'
on conflict (exercise_id, equipment_id) do update
  set is_primary = excluded.is_primary;

-- The back pad supports the torso: the shoulder and elbow extensors do the
-- pressing, without carrying over the standing barbell press's abdominal work.
insert into public.exercise_muscles (exercise_id, muscle_id, role, recruitment_weight)
select e.id, m.id, x.role, x.weight
from (values
  ('anterior-deltoid', 'primary', 0.95),
  ('lateral-deltoid', 'secondary', 0.65),
  ('triceps-long-head', 'secondary', 0.60),
  ('triceps-lateral-head', 'secondary', 0.60),
  ('upper-trapezius', 'secondary', 0.35)
) as x(muscle_slug, role, weight)
join public.exercises e on e.slug = 'shoulder-press-machine'
join public.muscles m on m.slug = x.muscle_slug
on conflict (exercise_id, muscle_id) do update
  set role = excluded.role,
      recruitment_weight = excluded.recruitment_weight;
