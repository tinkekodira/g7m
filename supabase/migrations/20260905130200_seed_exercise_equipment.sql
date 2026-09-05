-- ============================================================================
-- What each exercise needs.
--
-- `is_primary` marks the station you queue for — the thing the generator must
-- not schedule back to back (Brief §8 step 5), and the badge shown on each row
-- in the exercise list. Everything else is an accessory that qualifies the
-- exercise: a bench, a rack, a pad.
--
-- A partial unique index enforces exactly one primary per exercise, so a
-- mistake here fails the migration rather than producing an exercise the
-- generator cannot schedule.
-- ============================================================================

insert into public.exercise_equipment (exercise_id, equipment_id, is_primary)
select e.id, q.id, x.is_primary
from (values
  -- --- Horizontal push --------------------------------------------------
  ('barbell-bench-press',        'barbell',              true),
  ('barbell-bench-press',        'flat-bench',           false),
  ('incline-barbell-press',      'barbell',              true),
  ('incline-barbell-press',      'incline-bench',        false),
  ('dumbbell-bench-press',       'dumbbell',             true),
  ('dumbbell-bench-press',       'flat-bench',           false),
  ('incline-dumbbell-press',     'dumbbell',             true),
  ('incline-dumbbell-press',     'incline-bench',        false),
  ('machine-chest-press',        'chest-press-machine',  true),
  ('push-up',                    'bodyweight-only',      true),
  ('chest-dip',                  'dip-station',          true),
  ('cable-fly',                  'cable-machine',        true),
  ('pec-deck',                   'pec-deck',             true),

  -- --- Vertical push ----------------------------------------------------
  ('overhead-press',             'barbell',              true),
  ('overhead-press',             'squat-rack',           false),
  ('dumbbell-shoulder-press',    'dumbbell',             true),
  ('dumbbell-shoulder-press',    'incline-bench',        false),
  ('lateral-raise',              'dumbbell',             true),
  ('rear-delt-fly',              'dumbbell',             true),
  ('face-pull',                  'cable-machine',        true),

  -- --- Vertical pull ----------------------------------------------------
  ('pull-up',                    'pull-up-bar',          true),
  ('chin-up',                    'pull-up-bar',          true),
  ('lat-pulldown',               'lat-pulldown',         true),
  ('straight-arm-pulldown',      'cable-machine',        true),

  -- --- Horizontal pull --------------------------------------------------
  ('barbell-row',                'barbell',              true),
  ('single-arm-dumbbell-row',    'dumbbell',             true),
  ('single-arm-dumbbell-row',    'flat-bench',           false),
  ('seated-cable-row',           'seated-row-machine',   true),
  ('barbell-shrug',              'barbell',              true),

  -- --- Squat ------------------------------------------------------------
  ('barbell-back-squat',         'barbell',              true),
  ('barbell-back-squat',         'squat-rack',           false),
  ('barbell-front-squat',        'barbell',              true),
  ('barbell-front-squat',        'squat-rack',           false),
  ('goblet-squat',               'dumbbell',             true),
  ('leg-press',                  'leg-press',            true),
  ('hack-squat',                 'hack-squat',           true),
  ('bulgarian-split-squat',      'dumbbell',             true),
  ('bulgarian-split-squat',      'flat-bench',           false),
  ('walking-lunge',              'dumbbell',             true),
  ('leg-extension',              'leg-extension',        true),

  -- --- Hinge ------------------------------------------------------------
  ('conventional-deadlift',      'barbell',              true),
  ('romanian-deadlift',          'barbell',              true),
  ('trap-bar-deadlift',          'trap-bar',             true),
  ('barbell-hip-thrust',         'barbell',              true),
  ('barbell-hip-thrust',         'flat-bench',           false),
  ('lying-leg-curl',             'leg-curl-lying',       true),
  ('seated-leg-curl',            'leg-curl-seated',      true),
  ('back-extension',             'back-extension-bench', true),

  -- --- Calves -----------------------------------------------------------
  ('standing-calf-raise',        'calf-raise-machine',   true),
  ('seated-calf-raise',          'calf-raise-machine',   true),

  -- --- Biceps -----------------------------------------------------------
  ('barbell-curl',               'barbell',              true),
  ('hammer-curl',                'dumbbell',             true),
  ('preacher-curl',              'ez-bar',               true),
  ('preacher-curl',              'preacher-bench',       false),

  -- --- Triceps ----------------------------------------------------------
  ('close-grip-bench-press',     'barbell',              true),
  ('close-grip-bench-press',     'flat-bench',           false),
  ('triceps-pushdown',           'cable-machine',        true),
  ('overhead-triceps-extension', 'cable-machine',        true),

  -- --- Core -------------------------------------------------------------
  ('plank',                      'bodyweight-only',      true),
  ('hanging-leg-raise',          'pull-up-bar',          true),
  ('cable-crunch',               'cable-machine',        true),
  ('cable-woodchop',             'cable-machine',        true),

  -- --- Carry ------------------------------------------------------------
  ('farmer-carry',               'dumbbell',             true)
) as x(exercise_slug, equipment_slug, is_primary)
join public.exercises e on e.slug = x.exercise_slug
join public.equipment q on q.slug = x.equipment_slug
on conflict (exercise_id, equipment_id) do update
  set is_primary = excluded.is_primary;
