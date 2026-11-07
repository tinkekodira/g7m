-- The supplied Arnold press illustration is standing. Keep its history ID and
-- remove the bench requirement introduced by the already-applied expansion.
update public.exercises
   set instructions = array[
         'Stand with feet about hip-width apart and knees soft. Hold the dumbbells in front of your shoulders with palms facing you and elbows bent. Brace your abdomen and glutes.',
         'Press upward while smoothly rotating your palms forward and opening the elbows outward. Keep your ribs stacked over your pelvis without using leg drive.',
         'Lower slowly, reversing the rotation until the dumbbells return in front of the shoulders. Use a comfortable range without forcing the rotation.'
       ],
       aliases = array['dumbbell arnold press','arnold shoulder press','standing arnold press']
 where slug = 'arnold-press';

delete from public.exercise_equipment ee
using public.exercises e, public.equipment q
where ee.exercise_id = e.id and ee.equipment_id = q.id
  and e.slug = 'arnold-press' and q.slug = 'incline-bench';
