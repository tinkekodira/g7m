-- ============================================================================
-- The replication publication PowerSync reads.
--
-- PowerSync does not poll the database and does not go through PostgREST. It
-- attaches to a Postgres logical replication slot and follows the write-ahead
-- log, which is how a set logged on one device reaches another in about a
-- second rather than whenever something happens to re-query.
--
-- A publication is the server side of that: the list of tables whose changes
-- are put on the wire. It is deliberately a list and not `FOR ALL TABLES`.
--
--   1. `FOR ALL TABLES` would replicate everything the role can see, which on
--      Supabase includes internal schemas that have nothing to do with this app
--      and that we have no business streaming to a third-party service.
--   2. A table that is not in this list is invisible to sync. Naming them makes
--      that a decision somebody wrote down rather than something that happens
--      to be true, and `powersync-publication.test.ts` checks this list against
--      the client schema so the two cannot drift apart.
--
-- Note what is NOT here: `auth.users`. PowerSync never sees the auth schema. It
-- learns who the user is from the JWT the client presents, and the sync rules
-- filter on that. See powersync/sync-rules.yaml.
--
-- Replica identity is left at the default, which is the primary key. Every
-- table in this schema has a single-column `id` primary key — a PowerSync
-- requirement that also happens to be what logical replication needs to
-- identify a row on update and delete (ADR-0020).
-- ============================================================================

do $$
begin
  -- Guard rather than a bare CREATE: PowerSync's own documentation walks a
  -- reader through creating this publication by hand, so an instance set up
  -- before this migration ran would otherwise fail on it.
  if not exists (select 1 from pg_publication where pubname = 'powersync') then
    execute $publication$
      create publication powersync for table
        -- Reference data. Synced to every user, written by nobody.
        public.muscle_groups,
        public.muscles,
        public.equipment,
        public.exercises,
        public.exercise_equipment,
        public.exercise_muscles,
        -- User-owned data. The sync rules bucket these by the user id in the
        -- JWT; replication itself bypasses row level security entirely, so
        -- that bucketing is the access control, not an optimisation.
        public.profiles,
        public.user_equipment,
        public.routines,
        public.routine_exercises,
        public.workout_sessions,
        public.session_exercises,
        public.session_sets,
        public.personal_records
    $publication$;
  end if;
end
$$;

comment on publication powersync is
  'Tables replicated to PowerSync. Kept in step with packages/db/src/schema/'
  'app-schema.ts by powersync-publication.test.ts. Adding a synced table means '
  'adding it here too, in a new migration, with ALTER PUBLICATION ... ADD TABLE.';
