-- ============================================================================
-- Cardio on gym machines.
--
-- A cardio machine is an exercise like any other, added to a workout like any
-- other. What it logs is different: not sets of reps at a weight but *bouts* —
-- time on the machine, and what the machine says about it. A bout is a row in
-- `session_sets`, so everything built for sets already works for it: sync,
-- undo, ordering, a workout logged for a past day, the data export. Intervals
-- are simply several short bouts. See DECISIONS.md ADR-0069.
--
-- ## Which exercises are cardio
--
-- `exercises.cardio_kind`, null for everything that is not. The kind decides
-- which of the bout columns the logger offers and which formula estimates the
-- calories, so it names a family of machines rather than a model: every
-- stationary bike reads the same numbers off the same kind of display.
--
-- The strength columns still have to hold something on a cardio row — they are
-- NOT NULL, and loosening them would push "maybe null" into every strength
-- query for the sake of eight rows. So they hold honest, inert values: the rep
-- range is 1-1 and is never read for a cardio exercise; mechanic, force and
-- joint count describe the movement as well as they can. Nothing that consumes
-- them reaches a cardio exercise: the generator selects by primary muscle and
-- these have no muscle rows (and it now excludes cardio outright), and the
-- 1RM, records and volume all work from weight and reps, which a bout leaves
-- at zero.
--
-- No muscle rows on purpose: the body map answers "what am I training", in
-- sets per muscle, and twenty minutes on a bike is not twenty sets of quads.
--
-- ## The bout columns
--
-- All nullable, all optional — a bout is whatever the display showed. Which
-- ones a machine offers is decided in @g7m/core (`cardio.ts`), not here: a
-- CHECK cannot see which exercise a set belongs to. The ranges only refuse
-- what no machine in a gym could produce, so a typo is caught and a real
-- reading never is.
--
--   duration_seconds  time on the machine.
--   distance_m        metres. Shown in km or miles, following the unit setting.
--   speed_kmh         the treadmill's speed setting.
--   incline_percent   the treadmill's incline. Negative for a decline.
--   resistance_level  the level on a bike or stair climber. Not comparable
--                     between brands, so it describes a bout and never feeds
--                     a calorie estimate.
--   avg_watts         average power, from a bike, rower or ski erg display.
--   floors            climbed on a stair climber.
--   calories_kcal     the machine's own number, typed in to replace the app's
--                     estimate. Null means "use the estimate", which is worked
--                     out when it is shown, from the session's bodyweight.
--
-- Run this before deploying the app that writes these columns, and redeploy
-- the sync rules with it. A bout uploaded to a table without the columns is
-- refused, and a refused upload is discarded, not retried.
-- ============================================================================

alter table public.exercises
  add column cardio_kind text
    check (cardio_kind in ('treadmill', 'bike', 'rower', 'ski_erg', 'stair_climber'));

comment on column public.exercises.cardio_kind is
  'Null for strength exercises. For a cardio machine, which family it belongs '
  'to: decides the bout fields the logger shows and the calorie formula. ADR-0069.';

alter table public.session_sets
  add column duration_seconds integer check (duration_seconds between 0 and 86400),
  add column distance_m       integer check (distance_m between 0 and 1000000),
  add column speed_kmh        numeric(4, 1) check (speed_kmh between 0 and 50),
  add column incline_percent  numeric(4, 1) check (incline_percent between -10 and 40),
  add column resistance_level numeric(4, 1) check (resistance_level between 0 and 100),
  add column avg_watts        integer check (avg_watts between 0 and 3000),
  add column floors           integer check (floors between 0 and 10000),
  add column calories_kcal    integer check (calories_kcal between 0 and 20000);

-- ----------------------------------------------------------------------------
-- The machines, as equipment: they are what a gym has and a park does not, so
-- the library's gym/home switch files them correctly.
-- ----------------------------------------------------------------------------
insert into public.equipment (slug, name, category) values
  ('treadmill',      'Treadmill',      'machine'),
  ('exercise-bike',  'Exercise bike',  'machine'),
  ('air-bike',       'Air bike',       'machine'),
  ('rowing-machine', 'Rowing machine', 'machine'),
  ('ski-erg',        'Ski erg',        'machine'),
  ('stair-climber',  'Stair climber',  'machine')
on conflict (slug) do update
  set name = excluded.name,
      category = excluded.category;

-- ----------------------------------------------------------------------------
-- The eight machines, as exercises.
-- ----------------------------------------------------------------------------
insert into public.exercises
  (slug, name, aliases, mechanic, force, joint_count, difficulty, is_unilateral,
   is_time_based, instructions, cues, common_mistakes,
   default_rep_low, default_rep_high, default_rest_seconds, popularity_rank, cardio_kind)
values

('treadmill', 'Treadmill',
 array['treadmill run','treadmill walk','running machine','incline walk','jogging'],
 'compound', 'push', 3, 'beginner', false, false,
 array['Straddle the belt, start it slowly, then step on.',
       'Build up to your speed and incline over the first minute.',
       'Slow down before stepping off, onto the side rails.'],
 array['Land under your hips, not out in front','Hands off the rails once you are moving'],
 array['Holding the rails on an incline, which takes away most of the work',
       'Stepping off a moving belt'],
 1, 1, null, 110, 'treadmill'),

('upright-bike', 'Upright Bike',
 array['exercise bike','stationary bike','bike','cycle'],
 'compound', 'push', 3, 'beginner', false, false,
 array['Set the saddle so the knee is slightly bent at the bottom of the pedal stroke.',
       'Choose a level you can hold for the whole bout.',
       'Ease off for the last minute rather than stopping dead.'],
 array['Knees track over the feet','Push through the whole foot'],
 array['A saddle so low the knees come up past the hips'],
 1, 1, null, 120, 'bike'),

('recumbent-bike', 'Recumbent Bike',
 array['recumbent','seated bike','reclined bike'],
 'compound', 'push', 3, 'beginner', false, false,
 array['Slide the seat so the leg is almost straight at the far end of the stroke.',
       'Sit back against the rest and keep a steady rhythm.',
       'Raise the level rather than the speed when it starts to feel easy.'],
 array['Back against the seat','Smooth circles, no stamping'],
 array['Sitting so close that the knees are cramped at the top'],
 1, 1, null, 150, 'bike'),

('spin-bike', 'Spin Bike',
 array['spinning','indoor cycling','spin class','studio bike'],
 'compound', 'push', 3, 'intermediate', false, false,
 array['Set the saddle at hip height standing beside the bike.',
       'Set the handlebars level with the saddle or a little higher.',
       'Add resistance with the knob rather than spinning faster without it.'],
 array['Hips still in the saddle','Resistance on before you stand'],
 array['Bouncing in the saddle at a high cadence with no resistance'],
 1, 1, null, 140, 'bike'),

('air-bike', 'Air Bike',
 array['assault bike','echo bike','fan bike','airdyne'],
 'compound', 'push', 3, 'intermediate', false, false,
 array['Set the seat as for an upright bike.',
       'Push and pull the handles with the pedals: the harder you go, the harder the fan pushes back.',
       'For intervals, go hard for the work part and pedal gently through the rest.'],
 array['Arms and legs together','Breathe out on the push'],
 array['Starting an interval flat out and having nothing left halfway'],
 1, 1, null, 160, 'bike'),

('rowing-machine', 'Rowing Machine',
 array['rower','erg','indoor rower','concept2','rowing'],
 'compound', 'pull', 3, 'beginner', false, false,
 array['Strap the feet in with the strap across the widest part of the foot.',
       'Drive with the legs, then lean back slightly, then pull the handle to the ribs.',
       'Return in the opposite order: arms, body, then legs.'],
 array['Legs, body, arms, then back again','Twice as long coming forward as driving back'],
 array['Pulling with the arms before the legs have finished',
       'Setting the damper to 10 because it feels harder'],
 1, 1, null, 115, 'rower'),

('ski-erg', 'Ski Erg',
 array['skierg','ski machine','nordic ski'],
 'compound', 'pull', 3, 'intermediate', false, false,
 array['Stand tall facing the machine with a handle in each hand.',
       'Hinge at the hips and drive the handles down past the thighs.',
       'Let the arms rise back up as you stand tall again.'],
 array['Hinge, do not squat','Finish with the hands past the hips'],
 array['Bending the knees deeply and turning it into a squat'],
 1, 1, null, 170, 'ski_erg'),

('stair-climber', 'Stair Climber',
 array['stairmaster','step mill','stair machine','stepper','stairs'],
 'compound', 'push', 3, 'beginner', false, false,
 array['Step on while the stairs are moving slowly, holding the rails.',
       'Let go of the rails once you have the rhythm and stand upright.',
       'Slow the stairs down before stepping off.'],
 array['Whole foot on each step','Stand tall, do not lean on the rails'],
 array['Leaning on the rails, which takes the weight off your legs'],
 1, 1, null, 130, 'stair_climber')

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
      popularity_rank      = excluded.popularity_rank,
      cardio_kind          = excluded.cardio_kind;

insert into public.exercise_equipment (exercise_id, equipment_id, is_primary)
select e.id, q.id, true
from (values
  ('treadmill',      'treadmill'),
  ('upright-bike',   'exercise-bike'),
  ('recumbent-bike', 'exercise-bike'),
  ('spin-bike',      'exercise-bike'),
  ('air-bike',       'air-bike'),
  ('rowing-machine', 'rowing-machine'),
  ('ski-erg',        'ski-erg'),
  ('stair-climber',  'stair-climber')
) as x(exercise_slug, equipment_slug)
join public.exercises e on e.slug = x.exercise_slug
join public.equipment q on q.slug = x.equipment_slug
on conflict (exercise_id, equipment_id) do update
  set is_primary = excluded.is_primary;
