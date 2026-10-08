-- ============================================================================
-- Kettlebells, a chest-supported dumbbell row, and the dip split in two.
--
-- ## The dip splits by lean
--
-- "Chest Dip" was the only dip, and its own common-mistakes line said that
-- staying upright "shifts the work to the triceps" — which is how a lot of
-- people do dips on purpose. The two are logged apart because they load
-- different muscles: the forward lean puts the chest at the bottom of a deep
-- stretch, the upright torso keeps the elbows back and makes it a triceps
-- press.
--
-- `chest-dip` keeps its row, its id and every set logged on it, and is renamed
-- "Dips (Chest focused)". That is what it always described. The upright
-- version is a new row, `triceps-dip`, "Dips (Triceps focused)". Bench dips
-- are not this: they are a different, easier movement and stay out of it.
--
-- The bare "dip" and "dips" aliases go to both, so a search for either finds
-- the pair side by side rather than picking one for the lifter.
--
-- ## A chest-supported dumbbell row
--
-- Lying face down on an incline bench, a dumbbell in each hand. The bench
-- takes the lower back out of it, which is the whole point: every other row on
-- the list either needs a machine or loads the erectors. Filed under the
-- dumbbell with the incline bench as its accessory, like the dumbbell shoulder
-- press, so the generator only offers it to somebody who has both.
--
-- ## Kettlebells
--
-- The `kettlebell` equipment row has existed since the first taxonomy seed,
-- and nothing used it except as a "dumbbell or kettlebell" in the goblet squat
-- and the farmer carry's instructions. These are the six movements a
-- kettlebell is actually bought for — the swing above all — and none of them
-- is a dumbbell exercise done with a different handle. The goblet squat stays
-- one exercise: it is the same movement with either.
--
-- Its category is `other`, so the sets are logged as external load (see
-- `naturalLoadType`): the number in the field is the bell's weight. The
-- single-arm ones are `is_unilateral`, so the weight is one bell, done a side
-- at a time.
--
-- Same shape as the original seeds: idempotent on slug, so re-running is safe.
-- ============================================================================

insert into public.exercises
  (slug, name, aliases, mechanic, force, joint_count, difficulty, is_unilateral,
   is_time_based, instructions, cues, common_mistakes,
   default_rep_low, default_rep_high, default_rest_seconds, popularity_rank)
values

-- --- Dips --------------------------------------------------------------------
('chest-dip', 'Dips (Chest focused)',
 array['chest dip','chest dips','dip','dips','forward lean dip','parallel bar dip'],
 'compound', 'push', 2, 'advanced', false, false,
 array['Support yourself on the bars with arms locked out.',
       'Lean the torso forward about 30 degrees and let the elbows flare slightly.',
       'Lower until the upper arms are level, then press back up.'],
 array['Lean forward to bias the chest','Shoulders away from the ears'],
 array['Going deeper than the shoulders tolerate',
       'Staying upright, which turns it into the triceps dip'],
 6, 12, 150, 90),

('triceps-dip', 'Dips (Triceps focused)',
 array['triceps dip','tricep dip','tricep dips','upright dip','dip','dips','parallel bar dip'],
 'compound', 'push', 2, 'intermediate', false, false,
 array['Support yourself on the bars with arms locked out.',
       'Keep the torso upright and the elbows tucked back, close to the body.',
       'Lower until the elbows reach about 90 degrees, then press back to lockout.'],
 array['Chest tall, body vertical','Elbows point straight back','Lock out at the top'],
 array['Leaning forward, which turns it into the chest dip',
       'Letting the elbows flare out to the sides'],
 8, 12, 120, 92),

-- --- Rows --------------------------------------------------------------------
('chest-supported-dumbbell-row', 'Chest Supported Dumbbell Row',
 array['chest supported row','chest supported db row','incline dumbbell row','incline db row',
       'seal row dumbbell','prone dumbbell row'],
 'compound', 'pull', 2, 'beginner', false, false,
 array['Set a bench to about 30 to 45 degrees and lie face down on it, chest on the pad.',
       'Let a dumbbell hang straight down in each hand.',
       'Row both elbows back past the torso, squeeze, then lower to a full stretch.'],
 array['Chest stays on the pad','Lead with the elbows','Squeeze the shoulder blades together'],
 array['Lifting the chest off the pad to heave the weight up',
       'Shrugging the shoulders up toward the ears'],
 8, 12, 120, 120),

-- --- Kettlebells ---------------------------------------------------------------
('kettlebell-swing', 'Kettlebell Swing',
 array['kb swing','russian swing','two hand swing','swing'],
 'compound', 'pull', 2, 'beginner', false, false,
 array['Stand with feet shoulder width apart, the bell on the floor a foot in front of you.',
       'Hinge, grab the handle with both hands and hike it back between the legs.',
       'Snap the hips forward to float the bell to chest height, arms straight, then let it fall back into the hinge.'],
 array['It is a hinge, not a squat','Snap the hips, the arms just hold on','Glutes tight at the top'],
 array['Lifting the bell with the arms or shoulders','Squatting down instead of hinging',
       'Leaning back at the top'],
 12, 20, 90, 140),

('kettlebell-deadlift', 'Kettlebell Deadlift',
 array['kb deadlift','kettlebell dl'],
 'compound', 'pull', 2, 'beginner', false, false,
 array['Stand with the bell between your feet, under the middle of the foot.',
       'Hinge back, keep the back flat and grip the handle with both hands.',
       'Stand up by driving the hips forward, then lower it back the same way.'],
 array['Flat back','Push the floor away','Hips and shoulders rise together'],
 array['Rounding the lower back to reach the bell','Turning it into a squat'],
 8, 15, 90, 220),

('kettlebell-press', 'Kettlebell Press',
 array['kb press','single arm kettlebell press','kettlebell overhead press','kb overhead press'],
 'compound', 'push', 2, 'intermediate', true, false,
 array['Clean the bell to the rack position: on the forearm, against the chest, wrist straight.',
       'Brace the trunk and squeeze the glutes.',
       'Press it overhead to lockout, then lower back to the rack. Finish the side, then switch.'],
 array['Wrist straight, knuckles to the ceiling','Ribs down','Biceps by the ear at the top'],
 array['Leaning back to press','Letting the wrist bend back under the bell'],
 5, 10, 120, 222),

('kettlebell-clean', 'Kettlebell Clean',
 array['kb clean','single arm kettlebell clean'],
 'compound', 'pull', 3, 'intermediate', true, false,
 array['Start as for a one-handed swing, the bell hiked back between the legs.',
       'Drive the hips through and pull the bell in close, letting it roll around the wrist.',
       'Catch it softly in the rack position, then drop it back into the hinge. Finish the side, then switch.'],
 array['Keep the bell close, zip up the jacket','Hips do the work','Soft catch'],
 array['Swinging the bell out wide so it bangs onto the forearm'],
 5, 10, 90, 225),

('kettlebell-snatch', 'Kettlebell Snatch',
 array['kb snatch','single arm kettlebell snatch'],
 'compound', 'pull', 3, 'advanced', true, false,
 array['Start as for a one-handed swing, the bell hiked back between the legs.',
       'Drive the hips through and pull the bell up close to the body.',
       'Punch the hand through as it rises so it lands softly overhead with the arm locked. Lower it back into the hinge.'],
 array['Punch through at the top','Keep it close on the way up','Lock the arm overhead'],
 array['Letting the bell flop over and crash onto the forearm','Pressing it up with the arm'],
 5, 10, 120, 230),

('turkish-get-up', 'Turkish Get-Up',
 array['tgu','get up','kettlebell get up','kb get up'],
 'compound', 'static', 3, 'advanced', true, false,
 array['Lie on your back holding the bell straight up over the shoulder, same-side knee bent.',
       'Roll onto the opposite elbow, then the hand, then bridge the hips and sweep the leg under to a kneel.',
       'Stand up, then reverse every step back to the floor, eyes on the bell. Switch sides.'],
 array['Arm locked and vertical the whole way','Eyes on the bell','Slow, one step at a time'],
 array['Letting the arm drift or bend','Rushing the transitions'],
 1, 5, 120, 235)

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
-- What each new one needs. The chest dip keeps the station it had.
-- ----------------------------------------------------------------------------
insert into public.exercise_equipment (exercise_id, equipment_id, is_primary)
select e.id, q.id, x.is_primary
from (values
  ('triceps-dip',                  'dip-station',   true),
  ('chest-supported-dumbbell-row', 'dumbbell',      true),
  ('chest-supported-dumbbell-row', 'incline-bench', false),
  ('kettlebell-swing',             'kettlebell',    true),
  ('kettlebell-deadlift',          'kettlebell',    true),
  ('kettlebell-press',             'kettlebell',    true),
  ('kettlebell-clean',             'kettlebell',    true),
  ('kettlebell-snatch',            'kettlebell',    true),
  ('turkish-get-up',               'kettlebell',    true)
) as x(exercise_slug, equipment_slug, is_primary)
join public.exercises e on e.slug = x.exercise_slug
join public.equipment q on q.slug = x.equipment_slug
on conflict (exercise_id, equipment_id) do update
  set is_primary = excluded.is_primary;

-- ----------------------------------------------------------------------------
-- What each new one trains.
--
-- The triceps dip is the chest dip's muscles in the other order: all three
-- triceps heads lead, the chest and front delt follow. The chest-supported row
-- has no lower back at all, which is what separates it from the barbell row.
-- The swing and the kettlebell deadlift are hinges, glutes and hamstrings; the
-- clean and the snatch add the upper back pulling the bell in, and the snatch
-- the shoulder holding it overhead. The get-up is mostly a shoulder held still
-- while the trunk and hips move under it.
-- ----------------------------------------------------------------------------
insert into public.exercise_muscles (exercise_id, muscle_id, role, recruitment_weight)
select e.id, m.id, x.role, x.weight
from (values
  ('triceps-dip','triceps-lateral-head','primary',0.90),
  ('triceps-dip','triceps-medial-head','primary',0.85),
  ('triceps-dip','triceps-long-head','primary',0.80),
  ('triceps-dip','pec-major-sternal','secondary',0.55),
  ('triceps-dip','anterior-deltoid','secondary',0.50),

  ('chest-supported-dumbbell-row','latissimus-dorsi','primary',0.85),
  ('chest-supported-dumbbell-row','rhomboids','secondary',0.70),
  ('chest-supported-dumbbell-row','middle-trapezius','secondary',0.70),
  ('chest-supported-dumbbell-row','posterior-deltoid','secondary',0.50),
  ('chest-supported-dumbbell-row','biceps-brachii','secondary',0.40),

  ('kettlebell-swing','gluteus-maximus','primary',0.90),
  ('kettlebell-swing','biceps-femoris','secondary',0.70),
  ('kettlebell-swing','semitendinosus','secondary',0.65),
  ('kettlebell-swing','semimembranosus','secondary',0.65),
  ('kettlebell-swing','erector-spinae','stabilizer',0.50),
  ('kettlebell-swing','wrist-flexors','stabilizer',0.30),

  ('kettlebell-deadlift','gluteus-maximus','primary',0.80),
  ('kettlebell-deadlift','biceps-femoris','secondary',0.65),
  ('kettlebell-deadlift','semitendinosus','secondary',0.60),
  ('kettlebell-deadlift','vastus-lateralis','secondary',0.40),
  ('kettlebell-deadlift','erector-spinae','stabilizer',0.50),

  ('kettlebell-press','anterior-deltoid','primary',0.90),
  ('kettlebell-press','lateral-deltoid','secondary',0.55),
  ('kettlebell-press','triceps-lateral-head','secondary',0.55),
  ('kettlebell-press','upper-trapezius','secondary',0.35),
  ('kettlebell-press','external-obliques','stabilizer',0.40),

  ('kettlebell-clean','gluteus-maximus','primary',0.80),
  ('kettlebell-clean','biceps-femoris','secondary',0.60),
  ('kettlebell-clean','upper-trapezius','secondary',0.55),
  ('kettlebell-clean','posterior-deltoid','secondary',0.40),
  ('kettlebell-clean','erector-spinae','stabilizer',0.50),

  ('kettlebell-snatch','gluteus-maximus','primary',0.85),
  ('kettlebell-snatch','biceps-femoris','secondary',0.60),
  ('kettlebell-snatch','upper-trapezius','secondary',0.60),
  ('kettlebell-snatch','anterior-deltoid','secondary',0.55),
  ('kettlebell-snatch','lateral-deltoid','secondary',0.45),
  ('kettlebell-snatch','erector-spinae','stabilizer',0.50),

  ('turkish-get-up','anterior-deltoid','primary',0.75),
  ('turkish-get-up','external-obliques','primary',0.70),
  ('turkish-get-up','rectus-abdominis','secondary',0.55),
  ('turkish-get-up','gluteus-maximus','secondary',0.55),
  ('turkish-get-up','lateral-deltoid','secondary',0.45),
  ('turkish-get-up','triceps-lateral-head','stabilizer',0.40)
) as x(exercise_slug, muscle_slug, role, weight)
join public.exercises e on e.slug = x.exercise_slug
join public.muscles  m on m.slug = x.muscle_slug
on conflict (exercise_id, muscle_id) do update
  set role = excluded.role,
      recruitment_weight = excluded.recruitment_weight;
