-- ============================================================================
-- Conventions, extensions and shared helpers.
--
-- Runs before every other migration. Everything here is machinery the schema
-- leans on; no application tables are created in this file.
--
-- Conventions that hold across the whole schema:
--
--   · Every table has `id uuid primary key default gen_random_uuid()`, plus
--     `created_at` and `updated_at timestamptz not null default now()`.
--     This is not only tidiness — PowerSync requires a column named `id` as
--     the primary key on every synced table, so the convention is load-bearing
--     from Phase 2 onward.
--
--   · Enumerated values are `text` with a CHECK constraint, not native
--     Postgres enums. See DECISIONS.md ADR-0020.
--
--   · Weights are `numeric(6,2)` kilograms, always. Conversion to pounds is a
--     display concern and happens nowhere near the database. (Brief §5)
--
--   · Ordering within a parent uses a lexicographic `order_key text`, never an
--     integer index. See DECISIONS.md ADR-0017 §12.5.4.
-- ============================================================================

-- Trigram search over exercise names and aliases (Brief §7). Supabase installs
-- extensions into the `extensions` schema by convention; `if not exists` keeps
-- this idempotent on a project where it is already enabled.
create extension if not exists pg_trgm;

-- ----------------------------------------------------------------------------
-- updated_at
--
-- A default of now() only fires on INSERT. Without this trigger, `updated_at`
-- silently equals `created_at` forever, which would quietly break any sync
-- strategy that leans on it — including the row-level last-write-wins we chose
-- in ADR-0017.
--
-- `search_path = ''` is deliberate: an unqualified search_path in a function is
-- a privilege-escalation vector, and the Supabase linter flags it. pg_catalog
-- is always implicitly available, so now() still resolves.
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'BEFORE UPDATE trigger. Stamps updated_at = now(). Attached to every table.';

-- ----------------------------------------------------------------------------
-- Search text
--
-- Brief §7 wants fuzzy search across `name` AND `aliases`, so that typing "bp"
-- finds bench press and "incline db" finds incline dumbbell press.
--
-- The obvious implementation — a trigram index on an expression like
-- `array_to_string(aliases, ' ')` — does not work: array_to_string is not
-- marked IMMUTABLE, and Postgres refuses it in both index expressions and
-- generated columns. Hence this wrapper, which is genuinely immutable for
-- `text[]` input, and a stored generated column built from it.
--
-- Note for Phase 2: Postgres logical replication does not carry generated
-- columns, so `search_text` stays server-side. The offline mirror of this index
-- is SQLite FTS5 built over name + aliases locally.
-- ----------------------------------------------------------------------------
create or replace function public.exercise_search_text(p_name text, p_aliases text[])
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select lower(p_name || ' ' || array_to_string(coalesce(p_aliases, '{}'::text[]), ' '));
$$;

comment on function public.exercise_search_text(text, text[]) is
  'Lowercased haystack of an exercise name plus its aliases. Immutable so it '
  'can back a stored generated column and a trigram index.';
