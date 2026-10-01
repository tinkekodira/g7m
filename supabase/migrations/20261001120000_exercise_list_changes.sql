-- ============================================================================
-- A round of changes to the exercise list, asked for together.
--
-- ## The preacher curl splits by bar
--
-- `preacher-curl` keeps its row and its history and becomes the EZ bar
-- version, which is what it always was: its primary station is `ez-bar` and
-- its render is the EZ bar. The straight barbell version is a new row. They
-- are separate exercises rather than one with a note, because the bar changes
-- the wrist angle and the weight on it, and a logged 30 kg means nothing
-- unless you know which bar it was on.
--
-- ## The curl family fills out
--
-- The list had a barbell curl, a hammer curl and one preacher curl. Curls are
-- the exercise people vary most by kit, and the variations are not
-- interchangeable in a log: a dumbbell preacher curl is one arm at a time, an
-- incline curl starts from a stretch the standing curl never reaches. So the
-- common ones each get a row: dumbbell preacher, dumbbell, EZ bar, cable,
-- incline dumbbell and concentration. `barbell-curl` is unchanged and remains
-- the plain barbell bicep curl.
--
-- ## The seated row splits by station
--
-- The row called "Seated Cable Row" was already the machine: its primary
-- station is `seated-row-machine` and since ADR-0097 it wears the seated row
-- machine render. It is renamed to say so, and its slug moves with the name,
-- so that `seated-cable-row` can go to the cable version, which is new.
--
-- Moving the slug is safe because nothing stored on the user side refers to
-- an exercise by slug — sessions, sets and plans all hold the id. History
-- logged as "Seated Cable Row" stays with the machine, which is what it was
-- drawn as.
--
-- ## The cable lat pullover gets its own row
--
-- Twice before (20260910100000, 20260917120000) this was answered by pointing
-- at `straight-arm-pulldown`, which carried "cable lat pullover" as an alias.
-- It was asked for a third time, as its own entry, and that is the answer:
-- in a gym the two are done differently. The pulldown is standing tall with a
-- straight bar; the pullover is hinged forward with a rope, pulled through to
-- the hips. The pullover aliases move off the pulldown so a search for
-- "pullover" lands on the pullovers.
--
-- ## T-bar row and wall sit
--
-- Two plain gaps. The T-bar row is filed under `barbell`: the bar wedged in a
-- corner or a landmine is how most people do it, and a dedicated T-bar
-- station would be a new item in everybody's equipment picker, which is a
-- decision of its own (ADR-0010). The wall sit is a hold, so it is time based,
-- like the plank, and needs nothing but a wall.
--
-- Same shape as the original seeds: idempotent on slug, so re-running is safe.
-- ============================================================================

update public.exercises
   set slug = 'seated-row-machine'
 where slug = 'seated-cable-row'
   and not exists (select 1 from public.exercises where slug = 'seated-row-machine');

insert into public.exercises
  (slug, name, aliases, mechanic, force, joint_count, difficulty, is_unilateral,
   is_time_based, instructions, cues, common_mistakes,
   default_rep_low, default_rep_high, default_rest_seconds, popularity_rank)
values

-- --- Biceps ------------------------------------------------------------------
('preacher-curl', 'Preacher Curl (EZ Bar)',
 array['ez bar preacher curl','ez preacher curl','preacher','preacher curl'],
 'isolation', 'pull', 1, 'beginner', false, false,
 array['Set the pad so the armpits rest on the top edge.',
       'Take the EZ bar on the angled grips and curl it up, stopping short of vertical to keep tension.',
       'Lower slowly until the arms are almost straight.'],
 array['Do not let the elbows lift off the pad','Control the stretch at the bottom'],
 array['Dropping the weight fast at the bottom, which strains the elbow'],
 10, 15, 90, 175),

('barbell-preacher-curl', 'Preacher Curl (Barbell)',
 array['barbell preacher curl','straight bar preacher curl','bb preacher curl','preacher',
       'preacher curl'],
 'isolation', 'pull', 1, 'beginner', false, false,
 array['Set the pad so the armpits rest on the top edge.',
       'Take a straight bar at shoulder width, palms up, and curl it up, stopping short of vertical.',
       'Lower slowly until the arms are almost straight.'],
 array['Do not let the elbows lift off the pad','Wrists straight, not curled back'],
 array['Dropping the weight fast at the bottom, which strains the elbow',
       'Loading it like the EZ bar; the straight grip is harder on the wrists'],
 10, 15, 90, 176),

('dumbbell-preacher-curl', 'Preacher Curl (Dumbbell)',
 array['dumbbell preacher curl','db preacher curl','single arm preacher curl','preacher',
       'preacher curl'],
 'isolation', 'pull', 1, 'beginner', true, false,
 array['Set the pad so one armpit rests on the top edge, the dumbbell in that hand.',
       'Curl it up, stopping short of vertical to keep tension.',
       'Lower slowly until the arm is almost straight, then switch sides.'],
 array['Elbow stays on the pad','Turn the little finger up at the top'],
 array['Dropping the weight fast at the bottom, which strains the elbow'],
 10, 15, 75, 177),

('dumbbell-curl', 'Dumbbell Curl',
 array['db curl','dumbbell bicep curl','bicep curl','alternating curl','standing dumbbell curl'],
 'isolation', 'pull', 1, 'beginner', false, false,
 array['Stand holding a dumbbell in each hand, arms straight, palms forward.',
       'Curl to shoulder height keeping the elbows at your sides.',
       'Lower under control to full extension, together or one arm at a time.'],
 array['Elbows pinned to the ribs','Full extension at the bottom'],
 array['Swinging the hips to start each rep','Letting the elbows drift forward'],
 10, 12, 75, 42),

('ez-bar-curl', 'EZ Bar Curl',
 array['ez curl','ez bar bicep curl','cambered bar curl'],
 'isolation', 'pull', 1, 'beginner', false, false,
 array['Stand holding the EZ bar on the angled grips, arms extended.',
       'Curl the bar to shoulder height keeping the elbows at your sides.',
       'Lower under control to full extension.'],
 array['Elbows pinned to the ribs','Full extension at the bottom'],
 array['Swinging the hips to start each rep'],
 8, 12, 90, 95),

('cable-curl', 'Cable Curl',
 array['cable bicep curl','standing cable curl','rope curl'],
 'isolation', 'pull', 1, 'beginner', false, false,
 array['Stand facing a low pulley with a straight bar or rope.',
       'Curl it to shoulder height keeping the elbows at your sides.',
       'Lower until the arms are straight, keeping tension on the cable.'],
 array['Elbows still','Squeeze at the top'],
 array['Leaning back to finish the rep'],
 10, 15, 75, 105),

('incline-dumbbell-curl', 'Incline Dumbbell Curl',
 array['incline curl','incline db curl','seated incline curl'],
 'isolation', 'pull', 1, 'intermediate', false, false,
 array['Sit back on a bench set to about 45 degrees, arms hanging straight down.',
       'Curl the dumbbells up without bringing the elbows forward.',
       'Lower all the way to the stretch.'],
 array['Elbows stay behind the body','Own the stretch at the bottom'],
 array['Lifting the shoulders off the bench to swing the weight up'],
 10, 12, 75, 130),

('concentration-curl', 'Concentration Curl',
 array['seated concentration curl','single arm curl'],
 'isolation', 'pull', 1, 'beginner', true, false,
 array['Sit on a bench and brace the back of one upper arm against the inside of the thigh.',
       'Curl the dumbbell up towards the shoulder.',
       'Lower under control until the arm is straight, then switch sides.'],
 array['Upper arm stays on the thigh','Slow on the way down'],
 array['Using the thigh to push the arm up'],
 10, 15, 60, 150),

-- --- Horizontal pull ---------------------------------------------------------
('seated-row-machine', 'Seated Row Machine',
 array['seated row','row machine','machine row','chest supported row','seated machine row'],
 'compound', 'pull', 2, 'beginner', false, false,
 array['Set the seat so the handles line up with the bottom of your chest, and lean into the pad.',
       'Pull the handles back, driving the elbows past the ribs.',
       'Let them return to a full stretch without leaving the pad.'],
 array['Chest stays on the pad','Squeeze the shoulder blades together'],
 array['Peeling the chest off the pad to heave the last few reps'],
 10, 15, 90, 75),

('seated-cable-row', 'Seated Cable Row Machine',
 array['seated cable row','cable row','low row','seated row cable','low cable row'],
 'compound', 'pull', 2, 'beginner', false, false,
 array['Sit at the low pulley with the feet on the platform and a slight knee bend.',
       'Pull the handle to the navel, elbows close to the body.',
       'Return to a full stretch without rounding the back.'],
 array['Chest tall','Squeeze at the ribs'],
 array['Rocking the torso back and forth to move the weight'],
 10, 15, 90, 76),

('t-bar-row', 'T-Bar Row',
 array['t bar row','tbar row','landmine row','t-bar'],
 'compound', 'pull', 2, 'intermediate', false, false,
 array['Straddle the bar with one end fixed in a corner or landmine, and take a close grip under the plates.',
       'Hinge forward with a flat back and pull the plates to your chest.',
       'Lower under control to a full stretch.'],
 array['Flat back throughout','Pull with the elbows, not the hands'],
 array['Standing up as the set gets hard','Yanking with the lower back'],
 8, 12, 120, 82),

-- --- Lats --------------------------------------------------------------------
-- Already in the catalogue. Same row; it gives up the pullover aliases now that
-- the pullover is its own entry.
('straight-arm-pulldown', 'Straight-Arm Pulldown',
 array['straight arm pushdown','lat pushdown','straight arm lat pulldown'],
 'isolation', 'pull', 1, 'beginner', false, false,
 array['Stand facing a high pulley with a straight bar or rope.',
       'Keep the elbows almost locked and hinge slightly forward.',
       'Sweep the bar down to your thighs, then return overhead.'],
 array['Elbows stay fixed','Feel it in the armpit, not the triceps'],
 array['Bending the elbows and turning it into a pushdown'],
 12, 15, 75, 72),

('cable-lat-pullover', 'Cable Lat Pullover',
 array['cable pullover','lat pullover','pullover','rope pullover','cable lat pullover'],
 'isolation', 'pull', 1, 'beginner', false, false,
 array['Take a rope on a high pulley, step back and hinge forward until the arms are overhead.',
       'With the elbows soft and fixed, pull the rope in an arc down past the hips.',
       'Let it travel back up until you feel the lats stretch.'],
 array['Hips back, chest down','Finish with the hands by the hips'],
 array['Bending the elbows and turning it into a pushdown',
       'Standing up straight, which shortens the stretch'],
 12, 15, 75, 71),

-- --- Legs --------------------------------------------------------------------
('wall-sit', 'Wall Sit',
 array['wall squat','wall hold','wall chair'],
 'isolation', 'static', 1, 'beginner', false, true,
 array['Stand with your back flat against a wall and walk the feet out.',
       'Slide down until the thighs are about parallel to the floor, knees over the ankles.',
       'Hold, breathing steadily.'],
 array['Back flat against the wall','Knees over the ankles, not past the toes'],
 array['Resting the hands on the thighs to take the weight'],
 30, 60, 60, 190)

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
-- What each new one needs. The renamed rows keep the stations they had.
-- ----------------------------------------------------------------------------
insert into public.exercise_equipment (exercise_id, equipment_id, is_primary)
select e.id, q.id, x.is_primary
from (values
  ('barbell-preacher-curl', 'barbell',         true),
  ('barbell-preacher-curl', 'preacher-bench',  false),
  ('dumbbell-preacher-curl','dumbbell',        true),
  ('dumbbell-preacher-curl','preacher-bench',  false),
  ('dumbbell-curl',         'dumbbell',        true),
  ('ez-bar-curl',           'ez-bar',          true),
  ('cable-curl',            'cable-machine',   true),
  ('incline-dumbbell-curl', 'dumbbell',        true),
  ('incline-dumbbell-curl', 'incline-bench',   false),
  ('concentration-curl',    'dumbbell',        true),
  ('concentration-curl',    'flat-bench',      false),
  ('seated-cable-row',      'cable-machine',   true),
  ('t-bar-row',             'barbell',         true),
  ('cable-lat-pullover',    'cable-machine',   true),
  ('wall-sit',              'bodyweight-only', true)
) as x(exercise_slug, equipment_slug, is_primary)
join public.exercises e on e.slug = x.exercise_slug
join public.equipment q on q.slug = x.equipment_slug
on conflict (exercise_id, equipment_id) do update
  set is_primary = excluded.is_primary;

-- ----------------------------------------------------------------------------
-- What each new one trains.
--
-- The cable row adds the lower back as a stabilizer, which the machine's chest
-- pad takes away. The wall sit is the vasti: with the hip bent and still, the
-- rectus femoris has little to do.
-- ----------------------------------------------------------------------------
insert into public.exercise_muscles (exercise_id, muscle_id, role, recruitment_weight)
select e.id, m.id, x.role, x.weight
from (values
  ('barbell-preacher-curl','biceps-brachii','primary',0.95),
  ('barbell-preacher-curl','brachialis','secondary',0.55),

  ('dumbbell-preacher-curl','biceps-brachii','primary',0.95),
  ('dumbbell-preacher-curl','brachialis','secondary',0.60),

  ('dumbbell-curl','biceps-brachii','primary',0.95),
  ('dumbbell-curl','brachialis','secondary',0.55),
  ('dumbbell-curl','brachioradialis','secondary',0.40),

  ('ez-bar-curl','biceps-brachii','primary',0.90),
  ('ez-bar-curl','brachialis','secondary',0.65),
  ('ez-bar-curl','brachioradialis','secondary',0.45),

  ('cable-curl','biceps-brachii','primary',0.95),
  ('cable-curl','brachialis','secondary',0.55),

  ('incline-dumbbell-curl','biceps-brachii','primary',0.95),
  ('incline-dumbbell-curl','brachialis','secondary',0.50),

  ('concentration-curl','biceps-brachii','primary',0.95),
  ('concentration-curl','brachialis','secondary',0.60),

  ('seated-cable-row','latissimus-dorsi','primary',0.80),
  ('seated-cable-row','rhomboids','secondary',0.70),
  ('seated-cable-row','middle-trapezius','secondary',0.65),
  ('seated-cable-row','biceps-brachii','secondary',0.40),
  ('seated-cable-row','posterior-deltoid','secondary',0.40),
  ('seated-cable-row','erector-spinae','stabilizer',0.30),

  ('t-bar-row','latissimus-dorsi','primary',0.85),
  ('t-bar-row','middle-trapezius','secondary',0.70),
  ('t-bar-row','rhomboids','secondary',0.70),
  ('t-bar-row','posterior-deltoid','secondary',0.50),
  ('t-bar-row','biceps-brachii','secondary',0.40),
  ('t-bar-row','erector-spinae','stabilizer',0.50),

  ('cable-lat-pullover','latissimus-dorsi','primary',0.90),
  ('cable-lat-pullover','teres-major','secondary',0.60),
  ('cable-lat-pullover','triceps-long-head','secondary',0.30),

  ('wall-sit','vastus-lateralis','primary',0.85),
  ('wall-sit','vastus-medialis','primary',0.85),
  ('wall-sit','rectus-femoris','secondary',0.50),
  ('wall-sit','gluteus-maximus','secondary',0.35)
) as x(exercise_slug, muscle_slug, role, weight)
join public.exercises e on e.slug = x.exercise_slug
join public.muscles  m on m.slug = x.muscle_slug
on conflict (exercise_id, muscle_id) do update
  set role = excluded.role,
      recruitment_weight = excluded.recruitment_weight;
