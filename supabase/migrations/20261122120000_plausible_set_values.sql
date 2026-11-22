-- ============================================================================
-- A set holds numbers a gym can produce. ADR-0182.
-- ============================================================================
--
-- `weight_kg numeric(6, 2)` stored anything up to 9999.99 kg and `reps` any
-- integer. That let one slipped digit — 1000 for 100 — become a personal
-- record, a stack of achievements, a level and first place on every friend's
-- leaderboard, all of which read straight from these rows. And 10000 kg, one
-- digit further, overflowed the column: the phone had saved it, the server
-- refused it for good, and the server's older value then synced back over the
-- one that was typed.
--
-- The app now clamps every write to the same two numbers (`MAX_SET_WEIGHT_KG`
-- and `MAX_SET_REPS` in `packages/core/src/set-sanity.ts`), and asks before
-- logging a weight far above the lifter's best. These CHECKs are the server's
-- half of that line, for anything written by a build without the clamp or by
-- hand. They must stay equal to the constants: a server stricter than the
-- phone is exactly the refused-upload failure above.
--
-- `not valid`, so rows already stored are left alone and the push cannot fail
-- on one. Every insert and update is checked from now on, and the phone's
-- clamp rewrites an old out-of-range value the next time that set is edited,
-- so the update that carries it passes.
-- ============================================================================

alter table public.session_sets
  add constraint session_sets_weight_kg_plausible check (weight_kg <= 1000) not valid,
  add constraint session_sets_reps_plausible check (reps <= 3600) not valid;
