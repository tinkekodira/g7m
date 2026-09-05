-- ============================================================================
-- exercise_muscles — the join that makes everything work (Brief §5).
--
-- Two separate ideas live in this table and they are used for different things:
--
--   `role`               drives set counting for the volume heat map (§9):
--                        primary = 1.0 set, secondary = 0.5, stabilizer = 0.
--                        Whole-set counting by role is what the training
--                        literature is built around and what a user can reason
--                        about.
--
--   `recruitment_weight` drives ranking in the muscle panel (§6) and nothing
--                        else. It is a judgement about how much of the work a
--                        muscle does, on a 0-1 scale, used only to decide which
--                        exercise appears first when someone taps a muscle.
--
-- Values are informed estimates, not EMG measurements. They are meant to
-- produce sensible ordering, and they are cheap to tune later because nothing
-- else depends on their exact magnitude.
-- ============================================================================

insert into public.exercise_muscles (exercise_id, muscle_id, role, recruitment_weight)
select e.id, m.id, x.role, x.weight
from (values
  -- --- Horizontal push --------------------------------------------------
  ('barbell-bench-press','pec-major-sternal','primary',0.95),
  ('barbell-bench-press','pec-major-clavicular','secondary',0.60),
  ('barbell-bench-press','anterior-deltoid','secondary',0.70),
  ('barbell-bench-press','triceps-lateral-head','secondary',0.65),
  ('barbell-bench-press','triceps-long-head','secondary',0.50),
  ('barbell-bench-press','serratus-anterior','stabilizer',0.20),

  ('incline-barbell-press','pec-major-clavicular','primary',0.90),
  ('incline-barbell-press','pec-major-sternal','secondary',0.60),
  ('incline-barbell-press','anterior-deltoid','secondary',0.80),
  ('incline-barbell-press','triceps-lateral-head','secondary',0.60),

  ('dumbbell-bench-press','pec-major-sternal','primary',0.90),
  ('dumbbell-bench-press','pec-major-clavicular','secondary',0.55),
  ('dumbbell-bench-press','anterior-deltoid','secondary',0.65),
  ('dumbbell-bench-press','triceps-lateral-head','secondary',0.55),

  ('incline-dumbbell-press','pec-major-clavicular','primary',0.90),
  ('incline-dumbbell-press','anterior-deltoid','secondary',0.75),
  ('incline-dumbbell-press','pec-major-sternal','secondary',0.55),
  ('incline-dumbbell-press','triceps-lateral-head','secondary',0.50),

  ('machine-chest-press','pec-major-sternal','primary',0.90),
  ('machine-chest-press','pec-major-clavicular','secondary',0.50),
  ('machine-chest-press','anterior-deltoid','secondary',0.55),
  ('machine-chest-press','triceps-lateral-head','secondary',0.50),

  ('push-up','pec-major-sternal','primary',0.85),
  ('push-up','anterior-deltoid','secondary',0.60),
  ('push-up','triceps-lateral-head','secondary',0.60),
  ('push-up','serratus-anterior','secondary',0.45),
  ('push-up','rectus-abdominis','stabilizer',0.30),

  ('chest-dip','pec-major-sternal','primary',0.85),
  ('chest-dip','triceps-long-head','secondary',0.70),
  ('chest-dip','triceps-lateral-head','secondary',0.70),
  ('chest-dip','anterior-deltoid','secondary',0.55),

  ('cable-fly','pec-major-sternal','primary',0.90),
  ('cable-fly','pec-major-clavicular','secondary',0.55),
  ('cable-fly','anterior-deltoid','secondary',0.30),

  ('pec-deck','pec-major-sternal','primary',0.90),
  ('pec-deck','pec-major-clavicular','secondary',0.50),
  ('pec-deck','anterior-deltoid','secondary',0.25),

  -- --- Vertical push ----------------------------------------------------
  ('overhead-press','anterior-deltoid','primary',0.95),
  ('overhead-press','lateral-deltoid','secondary',0.65),
  ('overhead-press','triceps-long-head','secondary',0.60),
  ('overhead-press','triceps-lateral-head','secondary',0.60),
  ('overhead-press','upper-trapezius','secondary',0.40),
  ('overhead-press','rectus-abdominis','stabilizer',0.30),

  ('dumbbell-shoulder-press','anterior-deltoid','primary',0.90),
  ('dumbbell-shoulder-press','lateral-deltoid','secondary',0.60),
  ('dumbbell-shoulder-press','triceps-lateral-head','secondary',0.55),

  ('lateral-raise','lateral-deltoid','primary',0.95),
  ('lateral-raise','anterior-deltoid','secondary',0.35),
  ('lateral-raise','upper-trapezius','secondary',0.30),

  ('rear-delt-fly','posterior-deltoid','primary',0.90),
  ('rear-delt-fly','rhomboids','secondary',0.45),
  ('rear-delt-fly','middle-trapezius','secondary',0.40),

  ('face-pull','posterior-deltoid','primary',0.85),
  ('face-pull','middle-trapezius','secondary',0.60),
  ('face-pull','rhomboids','secondary',0.55),
  ('face-pull','infraspinatus','secondary',0.50),
  ('face-pull','lower-trapezius','secondary',0.40),

  -- --- Vertical pull ----------------------------------------------------
  ('pull-up','latissimus-dorsi','primary',0.95),
  ('pull-up','teres-major','secondary',0.60),
  ('pull-up','biceps-brachii','secondary',0.50),
  ('pull-up','brachialis','secondary',0.45),
  ('pull-up','lower-trapezius','secondary',0.40),
  ('pull-up','rhomboids','secondary',0.40),

  ('chin-up','latissimus-dorsi','primary',0.90),
  ('chin-up','biceps-brachii','secondary',0.70),
  ('chin-up','brachialis','secondary',0.55),
  ('chin-up','teres-major','secondary',0.50),
  ('chin-up','rhomboids','secondary',0.35),

  ('lat-pulldown','latissimus-dorsi','primary',0.90),
  ('lat-pulldown','teres-major','secondary',0.55),
  ('lat-pulldown','biceps-brachii','secondary',0.45),
  ('lat-pulldown','rhomboids','secondary',0.40),
  ('lat-pulldown','lower-trapezius','secondary',0.35),

  ('straight-arm-pulldown','latissimus-dorsi','primary',0.85),
  ('straight-arm-pulldown','teres-major','secondary',0.45),
  ('straight-arm-pulldown','triceps-long-head','secondary',0.25),

  -- --- Horizontal pull --------------------------------------------------
  ('barbell-row','latissimus-dorsi','primary',0.85),
  ('barbell-row','rhomboids','secondary',0.70),
  ('barbell-row','middle-trapezius','secondary',0.65),
  ('barbell-row','posterior-deltoid','secondary',0.50),
  ('barbell-row','biceps-brachii','secondary',0.40),
  ('barbell-row','erector-spinae','stabilizer',0.45),

  ('single-arm-dumbbell-row','latissimus-dorsi','primary',0.85),
  ('single-arm-dumbbell-row','rhomboids','secondary',0.60),
  ('single-arm-dumbbell-row','middle-trapezius','secondary',0.55),
  ('single-arm-dumbbell-row','biceps-brachii','secondary',0.40),
  ('single-arm-dumbbell-row','posterior-deltoid','secondary',0.40),

  ('seated-cable-row','latissimus-dorsi','primary',0.80),
  ('seated-cable-row','rhomboids','secondary',0.70),
  ('seated-cable-row','middle-trapezius','secondary',0.65),
  ('seated-cable-row','biceps-brachii','secondary',0.40),
  ('seated-cable-row','posterior-deltoid','secondary',0.40),

  ('barbell-shrug','upper-trapezius','primary',0.95),
  ('barbell-shrug','middle-trapezius','secondary',0.40),
  ('barbell-shrug','wrist-flexors','stabilizer',0.30),

  -- --- Squat ------------------------------------------------------------
  ('barbell-back-squat','vastus-lateralis','primary',0.90),
  ('barbell-back-squat','vastus-medialis','primary',0.90),
  ('barbell-back-squat','gluteus-maximus','secondary',0.75),
  ('barbell-back-squat','rectus-femoris','secondary',0.70),
  ('barbell-back-squat','erector-spinae','secondary',0.60),
  ('barbell-back-squat','hip-adductors','secondary',0.45),
  ('barbell-back-squat','biceps-femoris','secondary',0.35),
  ('barbell-back-squat','rectus-abdominis','stabilizer',0.30),

  ('barbell-front-squat','vastus-lateralis','primary',0.95),
  ('barbell-front-squat','vastus-medialis','primary',0.95),
  ('barbell-front-squat','rectus-femoris','secondary',0.75),
  ('barbell-front-squat','gluteus-maximus','secondary',0.60),
  ('barbell-front-squat','erector-spinae','secondary',0.55),
  ('barbell-front-squat','rectus-abdominis','stabilizer',0.40),

  ('goblet-squat','vastus-lateralis','primary',0.85),
  ('goblet-squat','vastus-medialis','primary',0.85),
  ('goblet-squat','gluteus-maximus','secondary',0.60),
  ('goblet-squat','rectus-femoris','secondary',0.60),
  ('goblet-squat','rectus-abdominis','stabilizer',0.30),

  ('leg-press','vastus-lateralis','primary',0.90),
  ('leg-press','vastus-medialis','primary',0.90),
  ('leg-press','gluteus-maximus','secondary',0.60),
  ('leg-press','rectus-femoris','secondary',0.55),
  ('leg-press','hip-adductors','secondary',0.40),

  ('hack-squat','vastus-lateralis','primary',0.95),
  ('hack-squat','vastus-medialis','primary',0.95),
  ('hack-squat','rectus-femoris','secondary',0.65),
  ('hack-squat','gluteus-maximus','secondary',0.50),

  ('bulgarian-split-squat','vastus-lateralis','primary',0.85),
  ('bulgarian-split-squat','vastus-medialis','primary',0.85),
  ('bulgarian-split-squat','gluteus-maximus','secondary',0.75),
  ('bulgarian-split-squat','rectus-femoris','secondary',0.60),
  ('bulgarian-split-squat','gluteus-medius','secondary',0.50),
  ('bulgarian-split-squat','hip-adductors','secondary',0.40),
  ('bulgarian-split-squat','tibialis-anterior','secondary',0.30),

  ('walking-lunge','vastus-lateralis','primary',0.80),
  ('walking-lunge','vastus-medialis','primary',0.80),
  ('walking-lunge','gluteus-maximus','secondary',0.70),
  ('walking-lunge','rectus-femoris','secondary',0.55),
  ('walking-lunge','gluteus-medius','secondary',0.45),
  ('walking-lunge','hip-adductors','secondary',0.35),
  ('walking-lunge','tibialis-anterior','secondary',0.30),

  ('leg-extension','rectus-femoris','primary',0.90),
  ('leg-extension','vastus-lateralis','primary',0.90),
  ('leg-extension','vastus-medialis','primary',0.90),

  -- --- Hinge ------------------------------------------------------------
  ('conventional-deadlift','erector-spinae','primary',0.85),
  ('conventional-deadlift','gluteus-maximus','primary',0.85),
  ('conventional-deadlift','biceps-femoris','secondary',0.75),
  ('conventional-deadlift','semitendinosus','secondary',0.70),
  ('conventional-deadlift','semimembranosus','secondary',0.70),
  ('conventional-deadlift','upper-trapezius','secondary',0.50),
  ('conventional-deadlift','wrist-flexors','secondary',0.50),
  ('conventional-deadlift','latissimus-dorsi','secondary',0.45),
  ('conventional-deadlift','vastus-lateralis','secondary',0.45),

  ('romanian-deadlift','biceps-femoris','primary',0.90),
  ('romanian-deadlift','semitendinosus','primary',0.85),
  ('romanian-deadlift','semimembranosus','primary',0.85),
  ('romanian-deadlift','gluteus-maximus','secondary',0.75),
  ('romanian-deadlift','erector-spinae','secondary',0.60),
  ('romanian-deadlift','wrist-flexors','secondary',0.40),

  ('trap-bar-deadlift','gluteus-maximus','primary',0.80),
  ('trap-bar-deadlift','erector-spinae','secondary',0.70),
  ('trap-bar-deadlift','biceps-femoris','secondary',0.65),
  ('trap-bar-deadlift','vastus-lateralis','secondary',0.60),
  ('trap-bar-deadlift','vastus-medialis','secondary',0.60),
  ('trap-bar-deadlift','upper-trapezius','secondary',0.50),
  ('trap-bar-deadlift','wrist-flexors','secondary',0.50),

  ('barbell-hip-thrust','gluteus-maximus','primary',0.95),
  ('barbell-hip-thrust','biceps-femoris','secondary',0.50),
  ('barbell-hip-thrust','semitendinosus','secondary',0.45),
  ('barbell-hip-thrust','gluteus-medius','secondary',0.40),

  ('lying-leg-curl','biceps-femoris','primary',0.90),
  ('lying-leg-curl','semitendinosus','primary',0.85),
  ('lying-leg-curl','semimembranosus','primary',0.85),
  ('lying-leg-curl','gastrocnemius','secondary',0.35),

  ('seated-leg-curl','biceps-femoris','primary',0.90),
  ('seated-leg-curl','semitendinosus','primary',0.90),
  ('seated-leg-curl','semimembranosus','primary',0.90),

  ('back-extension','erector-spinae','primary',0.90),
  ('back-extension','gluteus-maximus','secondary',0.60),
  ('back-extension','biceps-femoris','secondary',0.55),
  ('back-extension','semitendinosus','secondary',0.50),

  -- --- Calves -----------------------------------------------------------
  ('standing-calf-raise','gastrocnemius','primary',0.95),
  ('standing-calf-raise','soleus','secondary',0.50),
  ('seated-calf-raise','soleus','primary',0.95),
  ('seated-calf-raise','gastrocnemius','secondary',0.30),

  -- --- Biceps -----------------------------------------------------------
  ('barbell-curl','biceps-brachii','primary',0.95),
  ('barbell-curl','brachialis','secondary',0.60),
  ('barbell-curl','brachioradialis','secondary',0.40),
  ('barbell-curl','wrist-flexors','stabilizer',0.25),

  ('hammer-curl','brachioradialis','primary',0.85),
  ('hammer-curl','brachialis','primary',0.80),
  ('hammer-curl','biceps-brachii','secondary',0.60),

  ('preacher-curl','biceps-brachii','primary',0.95),
  ('preacher-curl','brachialis','secondary',0.60),

  -- --- Triceps ----------------------------------------------------------
  ('close-grip-bench-press','triceps-lateral-head','primary',0.90),
  ('close-grip-bench-press','triceps-long-head','primary',0.80),
  ('close-grip-bench-press','triceps-medial-head','secondary',0.70),
  ('close-grip-bench-press','pec-major-sternal','secondary',0.60),
  ('close-grip-bench-press','anterior-deltoid','secondary',0.50),

  ('triceps-pushdown','triceps-lateral-head','primary',0.90),
  ('triceps-pushdown','triceps-medial-head','primary',0.80),
  ('triceps-pushdown','triceps-long-head','secondary',0.50),

  ('overhead-triceps-extension','triceps-long-head','primary',0.95),
  ('overhead-triceps-extension','triceps-lateral-head','secondary',0.60),
  ('overhead-triceps-extension','triceps-medial-head','secondary',0.55),

  -- --- Core -------------------------------------------------------------
  ('plank','rectus-abdominis','primary',0.85),
  ('plank','external-obliques','secondary',0.60),
  ('plank','serratus-anterior','secondary',0.40),
  ('plank','erector-spinae','stabilizer',0.30),

  ('hanging-leg-raise','rectus-abdominis','primary',0.90),
  ('hanging-leg-raise','external-obliques','secondary',0.55),
  ('hanging-leg-raise','wrist-flexors','stabilizer',0.35),
  ('hanging-leg-raise','latissimus-dorsi','stabilizer',0.30),

  ('cable-crunch','rectus-abdominis','primary',0.95),
  ('cable-crunch','external-obliques','secondary',0.50),

  ('cable-woodchop','external-obliques','primary',0.90),
  ('cable-woodchop','rectus-abdominis','secondary',0.55),
  ('cable-woodchop','serratus-anterior','secondary',0.40),

  -- --- Carry ------------------------------------------------------------
  ('farmer-carry','wrist-flexors','primary',0.90),
  ('farmer-carry','upper-trapezius','primary',0.75),
  ('farmer-carry','erector-spinae','secondary',0.50),
  ('farmer-carry','gluteus-medius','secondary',0.45),
  ('farmer-carry','wrist-extensors','secondary',0.40),
  ('farmer-carry','rectus-abdominis','secondary',0.40)
) as x(exercise_slug, muscle_slug, role, weight)
join public.exercises e on e.slug = x.exercise_slug
join public.muscles  m on m.slug = x.muscle_slug
on conflict (exercise_id, muscle_id) do update
  set role = excluded.role,
      recruitment_weight = excluded.recruitment_weight;
