-- ============================================================================
-- The five muscles a closed skin has no room for stop being tap targets.
--
-- They were reachable through a "Look underneath" toggle that swapped the
-- sculpted body for the generated one. That toggle is gone, and it should be:
-- nobody taps "look underneath" *hoping* to find a rhomboid, and two of the
-- five had nothing to show when you got there.
--
-- `is_selectable` answers "should a tap select this", and on the shipping
-- build the answer is now no — there is no geometry to tap. Left true, the
-- Learn screen would tell every user, permanently and correctly, that five
-- muscles have no geometry and cannot be tapped. A warning that is always on
-- is not a warning.
--
-- They are NOT removed. They stay in `muscles`, they keep their rows in
-- `exercise_muscles`, they still count toward volume in the heat map, and the
-- exercises that train them still say so: the semimembranosus is a prime mover
-- for three of them. What changes is only that the 3D model no longer offers
-- them as targets it cannot actually hit.
--
-- The same treatment `sternocleidomastoid` already has, for a related reason —
-- it is anatomy the app carries and does not program for.
-- ============================================================================

update public.muscles
   set is_selectable = false
 where slug in (
   'rhomboids',
   'teres-major',
   'brachialis',
   'triceps-medial-head',
   'semimembranosus'
 );
