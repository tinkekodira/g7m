-- ============================================================================
-- body_metrics — an append-only record of what the user is, over time.
--
-- ADR-0032. The coaching loop asks for a weight at least weekly, and it asks
-- *so that there is a series*: whether "lose fat" is working is a question
-- about a trend, and a trend cannot be reconstructed from a single mutable
-- number that was overwritten every Sunday.
--
-- So this is one row per measurement, never updated in place by the app. The
-- existing `profiles.bodyweight_kg` stays where it is and keeps its job —
-- it is the *current* value, read once at the start of a workout and
-- snapshotted onto the session so a pull-up logged at 80 kg stays an 80 kg
-- pull-up. This table is the history behind that number, and the repository
-- writes both.
--
-- ## What is here and what is not
--
-- Weight, height, activity level and body fat: the four things the coaching
-- loop needs, all of which change and all of which are worth a date.
--
-- `birth_year` is NOT moved here from `profiles`, and ADR-0032's aside said it
-- would be. It is already on `profiles` with a CHECK, it does not change, and
-- a series of one value is a table row with extra steps. Recorded as a
-- deliberate deviation rather than an oversight.
--
-- ## Not medical data collection
--
-- Brief §13 puts body-measurement tracking out of scope, and this is not that:
-- there are no circumference measurements, no photographs, no progress logs.
-- It is the minimum a plan can be written from. §14's export and deletion
-- obligations apply to it in full, which the ON DELETE CASCADE below is part
-- of honouring.
-- ============================================================================

create table public.body_metrics (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,

  -- When the measurement was taken, which is not when the row was written. A
  -- weight entered on Monday evening for Sunday morning belongs to Sunday.
  recorded_at    timestamptz not null default now(),

  weight_kg      numeric(5, 2) check (weight_kg > 0 and weight_kg < 1000),
  height_cm      numeric(5, 1) check (height_cm > 50 and height_cm < 300),

  -- How hard the week is outside the gym. The input to a maintenance-calorie
  -- estimate, and the reason "lose fat" means different things to a labourer
  -- and to somebody at a desk.
  activity_level text check (
                   activity_level in ('sedentary', 'light', 'moderate',
                                      'active', 'very_active')),

  body_fat_percent numeric(4, 1) check (body_fat_percent > 1 and body_fat_percent < 70),

  note           text,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  unique (id, user_id),

  -- A row that records nothing is a date with no measurement on it, and it
  -- would show up in every trend as a gap that is not a gap.
  constraint body_metrics_records_something check (
    weight_kg is not null
    or height_cm is not null
    or activity_level is not null
    or body_fat_percent is not null
  )
);

-- "What do they weigh now" and "what does the last twelve weeks look like" are
-- the only two questions asked of this table, and both are this index.
create index body_metrics_by_user
  on public.body_metrics (user_id, recorded_at desc);

create trigger body_metrics_touch
  before update on public.body_metrics
  for each row execute function public.set_updated_at();

alter table public.body_metrics enable row level security;

-- Update and delete are allowed even though the app appends. Correcting a
-- mistyped weight is legitimate and has nothing to do with the append-only
-- discipline, which is about not overwriting last week's measurement with
-- this week's — a rule the repository enforces by not offering the operation.
create policy body_metrics_owner on public.body_metrics
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

comment on table public.body_metrics is
  'Append-only body measurements (ADR-0032). One row per measurement; '
  'profiles.bodyweight_kg holds the current value for session snapshots.';

-- ----------------------------------------------------------------------------
-- The publication.
--
-- A table missing from here produces no error anywhere: the app builds, sync
-- connects, everything reports healthy, and this table is simply always empty
-- on every device. `powersync-publication.test.ts` checks the list against the
-- client schema for exactly that reason.
-- ----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'powersync')
     and not exists (
       select 1 from pg_publication_tables
        where pubname = 'powersync'
          and schemaname = 'public'
          and tablename = 'body_metrics'
     )
  then
    execute 'alter publication powersync add table public.body_metrics';
  end if;
end
$$;
