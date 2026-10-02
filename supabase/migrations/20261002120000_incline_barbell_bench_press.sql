-- ============================================================================
-- "Incline Barbell Press" becomes "Incline Barbell Bench Press".
--
-- It is the flat bench press done on an incline bench, and the list already
-- names the flat one "Barbell Bench Press". The old name joins the aliases so
-- a search for it still lands here.
--
-- A rename in place: the slug, the row and everything logged against it stay
-- as they are.
-- ============================================================================

update public.exercises
   set name    = 'Incline Barbell Bench Press',
       aliases = array['incline bench','incline bp','incline barbell press']
 where slug = 'incline-barbell-press';
