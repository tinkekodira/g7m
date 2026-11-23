-- ============================================================================
-- Drop user_equipment, a table nothing ever wrote. ADR-0185.
-- ============================================================================
--
-- `user_equipment` was the "my gym has this" list from the first schema
-- (20260905120200_user_tables.sql). The screen that would have filled it was
-- never built, and gyms (ADR-0178) answered "where am I lifting" another way.
-- Every device still synced it, exported it and joined it in the planner,
-- always empty.
--
-- Rollout: deploy the sync rules without the `user_equipment` query first,
-- then run this. Dropping a table removes it from the `powersync` publication
-- too, so there is nothing to alter there. Older app builds still have the
-- table in their local schema; they never wrote to it, and with no rows sent
-- they read it as empty, the same as before.
-- ============================================================================

drop table if exists public.user_equipment;
