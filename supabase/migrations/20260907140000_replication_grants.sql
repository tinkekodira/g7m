-- ============================================================================
-- Keep the replication role's read privileges in step with the schema.
--
-- `docs/powersync-setup.md` had a reader run this once, by hand:
--
--     grant select on all tables in schema public to powersync_replication;
--
-- which reads like a standing rule and is not one. ON ALL TABLES is a snapshot:
-- it grants on the tables that exist at that instant and says nothing about
-- tables created afterwards. So `body_metrics` shipped, replication could not
-- read it, and deploying the sync rules failed with
--
--     permission denied for table body_metrics
--
-- alongside a `Table public.body_metrics not found` warning — the second being
-- a consequence of the first, since PowerSync introspects the schema as this
-- role and a table it cannot read is a table it cannot see.
--
-- That failure is at least loud. The quieter version is the one worth naming:
-- had the grant existed but the *publication* entry not, there would have been
-- no error anywhere and the table would simply have been empty on every device
-- forever (ADR-0031, and the reason `powersync-publication.test.ts` exists).
-- This migration closes the third of those three lists.
--
-- Two statements, because they do different jobs:
--
--   1. ON ALL TABLES catches up everything that exists now — body_metrics, and
--      anything else that drifted since the role was created.
--   2. ALTER DEFAULT PRIVILEGES is the standing rule the doc implied. Tables
--      created from here on are granted as they are created.
--
-- Default privileges attach to the role that creates the object, so this
-- covers tables created by whoever runs the migrations (`postgres` under
-- `supabase db push`) and not, deliberately, tables created by hand in the
-- dashboard as some other role. A table created outside migrations is already
-- outside the schema-drift tests; it does not get a privilege back door.
--
-- Guarded on the role existing. The role is created by hand during setup and
-- lives in no migration — it holds a password that must never reach this
-- repository — so it is absent in PGlite, in CI, and in any clone that has not
-- been through docs/powersync-setup.md. Absent means there is nothing to grant,
-- not that anything is wrong.
-- ============================================================================

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'powersync_replication') then
    execute 'grant usage on schema public to powersync_replication';
    execute 'grant select on all tables in schema public to powersync_replication';
    execute 'alter default privileges in schema public '
            'grant select on tables to powersync_replication';
  end if;
end
$$;
