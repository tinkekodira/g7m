-- Separate catalogue entries: Smith and dumbbell loads/history are not interchangeable.
insert into public.exercises
  (slug, name, aliases, mechanic, force, joint_count, difficulty, is_unilateral,
   is_time_based, instructions, cues, common_mistakes,
   default_rep_low, default_rep_high, default_rest_seconds, popularity_rank)
values
('smith-machine-bench-press', 'Smith Machine Bench Press',
 array['smith bench press','smith bench','smith machine chest press'],
 'compound', 'push', 2, 'beginner', false, false,
 array['Centre a flat bench under the Smith bar so it lowers toward your mid-chest. Set the safety stops just below your intended bottom position and check the path with an unloaded bar.',
       'Lie back with your feet planted, hips on the bench and shoulder blades gently back and down. Grip slightly wider than shoulder width with straight wrists.',
       'Rotate the bar to release the hooks. Lower slowly toward your mid-chest, keeping your forearms aligned with the bar and elbows below shoulder level.',
       'Press smoothly along the rails without bouncing or lifting your hips. Extend your arms without snapping the elbows straight.',
       'Finish with the bar under control, rotate it onto both hooks and check that it is secure before letting go.'],
 array['Shoulder blades back and down','Feet planted, hips on the bench',
       'Lower with control','Check both hooks before releasing'],
 array['Positioning the bench so the fixed path forces the bar toward the neck',
       'Flaring the elbows or bending the wrists back',
       'Bouncing off the chest or lifting the hips',
       'Skipping the safety stops or releasing an unsecured bar'],
 8, 12, 120, 138),
('smith-machine-squat', 'Smith Machine Squat',
 array['smith squat','smith squats','smith machine back squat'],
 'compound', 'push', 3, 'beginner', false, false,
 array['Set the bar just below shoulder height and the safety stops just below your intended squat depth. Check your stance and the rail path with an unloaded bar.',
       'Place the bar across your upper traps, away from the neck. Grip both sides, stand with feet about shoulder width and adjust their position so you can keep your whole foot planted throughout the squat.',
       'Stand tall to release the hooks. Brace your abdomen, then bend your knees and hips together, keeping your knees in line with your toes.',
       'Lower with control to a comfortable depth while keeping your spine steady and heels down. Do not force a deeper position by rounding your lower back.',
       'Push through your whole foot to stand, keeping your knees aligned. Rotate the bar onto both hooks and check that it is secure before stepping away.'],
 array['Brace before each rep','Keep the whole foot planted',
       'Knees follow the toes','Control the descent and check the hooks'],
 array['Choosing a foot position that lifts the heels or forces an uncomfortable rail path',
       'Letting the knees collapse inward',
       'Rounding the lower back or bouncing at the bottom',
       'Skipping the safety stops or stepping away before both hooks engage'],
 8, 12, 150, 139),
('smith-machine-shrug', 'Smith Machine Shrug',
 array['smith shrug','smith shrugs','smith machine trap shrug'],
 'isolation', 'pull', 1, 'beginner', false, false,
 array['Set the Smith bar around mid-thigh height with the safety stops just below it. Check the hook direction and bar path before adding load.',
       'Stand facing the bar with feet about hip width. Take an overhand grip just outside your thighs, stand tall and release the hooks.',
       'Keep your arms straight and lift your shoulders toward your ears without rolling them, jutting your head forward or leaning back.',
       'Pause briefly at the top, then lower your shoulders slowly to a comfortable stretch. Keep the bar close and your torso still.',
       'After the last rep, rotate the bar onto both hooks and check that it is secure before letting go.'],
 array['Shoulders straight up and down','Arms stay straight',
       'Pause at the top','Keep your head and torso still'],
 array['Rolling the shoulders in circles',
       'Bending the elbows or bouncing with the legs to move the load',
       'Pushing the head forward or leaning back',
       'Dropping the shoulders abruptly or releasing an unsecured bar'],
 10, 15, 90, 140),
('dumbbell-shrug', 'Dumbbell Shrug',
 array['db shrug','db shrugs','dumbbell shrugs','dumbbell trap shrug'],
 'isolation', 'pull', 1, 'beginner', false, false,
 array['Stand with feet about hip width and a dumbbell in each hand at your sides, palms facing your thighs.',
       'Keep your chest tall, head neutral and arms straight. Lift both shoulders toward your ears without bending your elbows or rolling the shoulders.',
       'Pause briefly at the top, then lower your shoulders slowly to a comfortable stretch.',
       'Repeat with your torso still and the same controlled range on both sides. Set the dumbbells down with control when finished.'],
 array['Shoulders straight up and down','Arms stay straight',
       'Pause at the top','Keep your head neutral'],
 array['Rolling the shoulders in circles',
       'Bending the elbows or bouncing with the legs',
       'Pushing the head forward',
       'Using a load that prevents a controlled shoulder lift'],
 10, 15, 90, 141)
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
  ('smith-machine-bench-press', 'smith-machine', true),
  ('smith-machine-bench-press', 'flat-bench', false),
  ('smith-machine-squat', 'smith-machine', true),
  ('smith-machine-shrug', 'smith-machine', true),
  ('dumbbell-shrug', 'dumbbell', true)
) as x(exercise_slug, equipment_slug, is_primary)
join public.exercises e on e.slug = x.exercise_slug
join public.equipment q on q.slug = x.equipment_slug
on conflict (exercise_id, equipment_id) do update set is_primary = excluded.is_primary;

-- Curated ranking weights, not measured activation percentages. Rails support
-- the bar path; keep the chest, knee-dominant and trap emphases of these lifts.
insert into public.exercise_muscles (exercise_id, muscle_id, role, recruitment_weight)
select e.id, m.id, x.role, x.weight
from (values
  ('smith-machine-bench-press', 'pec-major-sternal', 'primary', 0.95),
  ('smith-machine-bench-press', 'pec-major-clavicular', 'secondary', 0.60),
  ('smith-machine-bench-press', 'anterior-deltoid', 'secondary', 0.70),
  ('smith-machine-bench-press', 'triceps-lateral-head', 'secondary', 0.65),
  ('smith-machine-bench-press', 'triceps-long-head', 'secondary', 0.50),
  ('smith-machine-squat', 'vastus-lateralis', 'primary', 0.90),
  ('smith-machine-squat', 'vastus-medialis', 'primary', 0.90),
  ('smith-machine-squat', 'gluteus-maximus', 'secondary', 0.75),
  ('smith-machine-squat', 'rectus-femoris', 'secondary', 0.70),
  ('smith-machine-squat', 'hip-adductors', 'secondary', 0.45),
  ('smith-machine-squat', 'erector-spinae', 'stabilizer', 0.30),
  ('smith-machine-squat', 'rectus-abdominis', 'stabilizer', 0.30),
  ('smith-machine-shrug', 'upper-trapezius', 'primary', 0.95),
  ('smith-machine-shrug', 'middle-trapezius', 'secondary', 0.40),
  ('smith-machine-shrug', 'wrist-flexors', 'stabilizer', 0.30),
  ('dumbbell-shrug', 'upper-trapezius', 'primary', 0.95),
  ('dumbbell-shrug', 'middle-trapezius', 'secondary', 0.40),
  ('dumbbell-shrug', 'wrist-flexors', 'stabilizer', 0.30)
) as x(exercise_slug, muscle_slug, role, weight)
join public.exercises e on e.slug = x.exercise_slug
join public.muscles m on m.slug = x.muscle_slug
on conflict (exercise_id, muscle_id) do update
  set role = excluded.role, recruitment_weight = excluded.recruitment_weight;
