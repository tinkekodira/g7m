-- ============================================================================
-- training_goals — what the lifter is training for, and since when.
--
-- ADR-0032: the generator takes a person and a goal. `body_metrics` is the
-- person; this is the goal.
--
-- ## Why a table rather than a column on profiles
--
-- The same argument that made `body_metrics` append-only, and it is worth
-- restating because a `goal` column is the obvious cheaper thing.
--
-- The feedback loop has to answer "how has this been going", and that question
-- is only answerable against a start date: eight weeks into a cut is a
-- different conversation from eight days into one. A mutable column plus a
-- `goal_set_at` would carry that much — but it would also mean that switching
-- from "lose fat" to "build muscle" silently rewrites history, so the app can
-- never say "your cut ran eleven weeks and then you changed your mind", which
-- is one of the more useful things it could ever say to somebody.
--
-- One row per decision. The current goal is the newest row. Nothing is
-- overwritten, so the sequence of decisions stays readable.
--
-- ## days_per_week
--
-- Not in the brief's list, and a plan cannot be written without it. Everything
-- else about a program follows from how many days somebody can actually be in
-- a gym — a four-day upper/lower split and a three-day full body are different
-- programs for the same goal, and picking the wrong one wastes the user's
-- month. Asked once, here, alongside the goal it modifies.
--
-- ## Not here
--
-- No target weight and no deadline. Both are easy to add and both change what
-- this table is for: a goal is a direction the training takes, and a target
-- with a date on it is a promise about a body that no training plan can make.
-- If a target arrives later it arrives with the feedback loop, which is the
-- part that would have to be honest about missing it.
--
-- The replication role's SELECT is granted automatically by the ALTER DEFAULT
-- PRIVILEGES in 20260907140000_replication_grants.sql. Without that, deploying
-- sync rules mentioning this table would fail with `permission denied`.
-- ============================================================================

create table public.training_goals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,

  goal           text not null check (
                   goal in ('lose_fat', 'build_muscle', 'recomp', 'get_stronger')),

  -- How many days a week they can train. One is a real answer and so is seven;
  -- the generator's job is to write the best plan that fits, not to argue.
  days_per_week  integer not null check (days_per_week between 1 and 7),

  -- When this goal was chosen. Separate from created_at for the same reason
  -- body_metrics.recorded_at is: a goal backdated to when it actually started
  -- gives the feedback loop the right window to read.
  started_at     timestamptz not null default now(),

  note           text,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  unique (id, user_id)
);

-- "What is the current goal" and "what were the last few" are the only two
-- questions asked of this table, and both are this index.
create index training_goals_by_user
  on public.training_goals (user_id, started_at desc);

create trigger training_goals_touch
  before update on public.training_goals
  for each row execute function public.set_updated_at();

alter table public.training_goals enable row level security;

create policy training_goals_owner on public.training_goals
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

comment on table public.training_goals is
  'One row per goal decision (ADR-0032). The current goal is the newest row; '
  'the history is what lets the feedback loop say how long a cut has run.';

-- ----------------------------------------------------------------------------
-- The publication.
--
-- A table missing from here produces no error anywhere: the app builds, sync
-- connects, everything reports healthy, and this table is simply always empty
-- on every device. See ADR-0031, and `powersync-publication.test.ts`.
-- ----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'powersync')
     and not exists (
       select 1 from pg_publication_tables
        where pubname = 'powersync'
          and schemaname = 'public'
          and tablename = 'training_goals'
     )
  then
    execute 'alter publication powersync add table public.training_goals';
  end if;
end
$$;
