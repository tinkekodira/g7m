-- ============================================================================
-- Reference taxonomy: muscle groups, muscles, equipment.
--
-- This is a *migration*, not a file under supabase/seed/, because it is data
-- the application cannot run without — an app with no muscles has no anatomy
-- model and no exercise panel. `supabase db seed` only runs during a local
-- `db reset`, which needs Docker; migrations deploy with `db push`. Seeds stay
-- for development-only fixtures. See DECISIONS.md ADR-0024.
--
-- Every insert is idempotent on `slug`, so re-running is safe and correcting a
-- name later is a one-line change in a follow-up migration rather than a
-- delete-and-reinsert that would break foreign keys.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Muscle groups — the coarse buckets in the generator picker (Brief §5).
-- ----------------------------------------------------------------------------
insert into public.muscle_groups (slug, name, display_order) values
  ('chest',      'Chest',      1),
  ('back',       'Back',       2),
  ('shoulders',  'Shoulders',  3),
  ('biceps',     'Biceps',     4),
  ('triceps',    'Triceps',    5),
  ('forearms',   'Forearms',   6),
  ('core',       'Core',       7),
  ('quads',      'Quads',      8),
  ('hamstrings', 'Hamstrings', 9),
  ('glutes',     'Glutes',    10),
  ('calves',     'Calves',    11),
  ('adductors',  'Adductors', 12),
  ('traps',      'Traps',     13),
  ('neck',       'Neck',      14)
on conflict (slug) do update
  set name = excluded.name,
      display_order = excluded.display_order;

-- ----------------------------------------------------------------------------
-- Muscles — what is clickable on the 3D model.
--
-- `mesh_node_names` is the contract between this table and the GLB (Brief §5).
-- The model does not exist yet, so these names define what it must provide
-- rather than describing what it does: the §6 convention is
-- `muscle_<slug>_l` / `muscle_<slug>_r`, and Phase 5 validates every selectable
-- muscle against the loaded asset and throws loudly on a mismatch.
--
-- Every entry here is paired left/right. There are no true midline muscles in
-- the §5 list — rectus abdominis and erector spinae are both paired, even
-- though they are often modelled as one lump.
-- ----------------------------------------------------------------------------
insert into public.muscles
  (slug, common_name, latin_name, muscle_group_id, mesh_node_names, region,
   is_selectable, display_order)
select
  m.slug,
  m.common_name,
  m.latin_name,
  g.id,
  array['muscle_' || m.slug || '_l', 'muscle_' || m.slug || '_r'],
  m.region,
  m.slug <> 'sternocleidomastoid',
  m.display_order
from (values
  -- --- Anterior -----------------------------------------------------------
  ('pec-major-clavicular', 'Upper chest',        'Pectoralis major, pars clavicularis',    'chest',      'anterior',  1),
  ('pec-major-sternal',    'Mid and lower chest','Pectoralis major, pars sternocostalis',  'chest',      'anterior',  2),
  ('anterior-deltoid',     'Front delt',         'Deltoideus, pars clavicularis',          'shoulders',  'anterior',  1),
  ('lateral-deltoid',      'Side delt',          'Deltoideus, pars acromialis',            'shoulders',  'both',      2),
  ('biceps-brachii',       'Biceps',             'Biceps brachii',                         'biceps',     'anterior',  1),
  ('brachialis',           'Brachialis',         'Brachialis',                             'biceps',     'anterior',  2),
  ('brachioradialis',      'Brachioradialis',    'Brachioradialis',                        'forearms',   'both',      1),
  ('wrist-flexors',        'Wrist flexors',      'Flexores carpi',                         'forearms',   'anterior',  2),
  ('rectus-abdominis',     'Abs',                'Rectus abdominis',                       'core',       'anterior',  1),
  ('external-obliques',    'Obliques',           'Obliquus externus abdominis',            'core',       'anterior',  2),
  ('serratus-anterior',    'Serratus',           'Serratus anterior',                      'core',       'anterior',  3),
  ('rectus-femoris',       'Rectus femoris',     'Rectus femoris',                         'quads',      'anterior',  1),
  ('vastus-lateralis',     'Outer quad',         'Vastus lateralis',                       'quads',      'anterior',  2),
  ('vastus-medialis',      'Inner quad',         'Vastus medialis',                        'quads',      'anterior',  3),
  ('hip-adductors',        'Adductors',          'Adductores',                             'adductors',  'anterior',  1),
  ('tibialis-anterior',    'Shin',               'Tibialis anterior',                      'calves',     'anterior',  1),
  ('sternocleidomastoid',  'Front neck',         'Sternocleidomastoideus',                 'neck',       'anterior',  1),

  -- --- Posterior ----------------------------------------------------------
  ('upper-trapezius',      'Upper traps',        'Trapezius, pars descendens',             'traps',      'both',      1),
  ('middle-trapezius',     'Mid traps',          'Trapezius, pars transversa',             'traps',      'posterior', 2),
  ('lower-trapezius',      'Lower traps',        'Trapezius, pars ascendens',              'traps',      'posterior', 3),
  ('latissimus-dorsi',     'Lats',               'Latissimus dorsi',                       'back',       'posterior', 1),
  ('rhomboids',            'Rhomboids',          'Rhomboidei',                             'back',       'posterior', 2),
  ('teres-major',          'Teres major',        'Teres major',                            'back',       'posterior', 3),
  ('infraspinatus',        'Infraspinatus',      'Infraspinatus',                          'back',       'posterior', 4),
  ('erector-spinae',       'Lower back',         'Erector spinae',                         'back',       'posterior', 5),
  ('posterior-deltoid',    'Rear delt',          'Deltoideus, pars spinalis',              'shoulders',  'posterior', 3),
  ('triceps-long-head',    'Triceps long head',  'Triceps brachii, caput longum',          'triceps',    'posterior', 1),
  ('triceps-lateral-head', 'Triceps lateral head','Triceps brachii, caput laterale',       'triceps',    'posterior', 2),
  ('triceps-medial-head',  'Triceps medial head','Triceps brachii, caput mediale',         'triceps',    'posterior', 3),
  ('wrist-extensors',      'Wrist extensors',    'Extensores carpi',                       'forearms',   'posterior', 3),
  ('gluteus-maximus',      'Glutes',             'Gluteus maximus',                        'glutes',     'posterior', 1),
  ('gluteus-medius',       'Side glutes',        'Gluteus medius',                         'glutes',     'both',      2),
  ('biceps-femoris',       'Hamstring, outer',   'Biceps femoris',                         'hamstrings', 'posterior', 1),
  ('semitendinosus',       'Hamstring, inner',   'Semitendinosus',                         'hamstrings', 'posterior', 2),
  ('semimembranosus',      'Hamstring, deep',    'Semimembranosus',                        'hamstrings', 'posterior', 3),
  ('gastrocnemius',        'Calf',               'Gastrocnemius',                          'calves',     'posterior', 2),
  ('soleus',               'Soleus',             'Soleus',                                 'calves',     'posterior', 3)
) as m(slug, common_name, latin_name, group_slug, region, display_order)
join public.muscle_groups g on g.slug = m.group_slug
on conflict (slug) do update
  set common_name     = excluded.common_name,
      is_selectable   = excluded.is_selectable,
      latin_name      = excluded.latin_name,
      muscle_group_id = excluded.muscle_group_id,
      mesh_node_names = excluded.mesh_node_names,
      region          = excluded.region,
      display_order   = excluded.display_order;

-- ----------------------------------------------------------------------------
-- Equipment (Brief §5).
--
-- `category` is what the generator filters on, so it describes how the thing
-- behaves, not what it is made of. Benches and racks are 'other' because they
-- are accessories that qualify an exercise rather than stations that provide
-- resistance on their own.
-- ----------------------------------------------------------------------------
insert into public.equipment (slug, name, category) values
  ('barbell',             'Barbell',            'barbell'),
  ('dumbbell',            'Dumbbell',           'dumbbell'),
  ('ez-bar',              'EZ bar',             'barbell'),
  ('trap-bar',            'Trap bar',           'barbell'),
  ('kettlebell',          'Kettlebell',         'other'),
  ('flat-bench',          'Flat bench',         'other'),
  ('incline-bench',       'Incline bench',      'other'),
  ('decline-bench',       'Decline bench',      'other'),
  ('squat-rack',          'Squat rack',         'other'),
  ('power-rack',          'Power rack',         'other'),
  ('smith-machine',       'Smith machine',      'machine'),
  ('cable-machine',       'Cable machine',      'cable'),
  ('lat-pulldown',        'Lat pulldown',       'cable'),
  ('seated-row-machine',  'Seated row machine', 'cable'),
  ('chest-press-machine', 'Chest press machine','machine'),
  ('pec-deck',            'Pec deck',           'machine'),
  ('leg-press',           'Leg press',          'machine'),
  ('hack-squat',          'Hack squat',         'machine'),
  ('leg-extension',       'Leg extension',      'machine'),
  ('leg-curl-seated',     'Leg curl, seated',   'machine'),
  ('leg-curl-lying',      'Leg curl, lying',    'machine'),
  ('calf-raise-machine',  'Calf raise machine', 'machine'),
  ('hip-thrust-machine',  'Hip thrust machine', 'machine'),
  ('pull-up-bar',         'Pull-up bar',        'bodyweight'),
  ('dip-station',         'Dip station',        'bodyweight'),
  ('preacher-bench',      'Preacher bench',     'other'),
  -- Not in the Brief §5 list, added because the back extension needs it and
  -- mapping that exercise to 'bodyweight only' would have the generator
  -- prescribe it to someone training in a hotel room. See ADR-0024.
  ('back-extension-bench','Back extension bench','other'),
  ('resistance-bands',    'Resistance bands',   'bands'),
  ('bodyweight-only',     'Bodyweight only',    'bodyweight')
on conflict (slug) do update
  set name = excluded.name,
      category = excluded.category;
