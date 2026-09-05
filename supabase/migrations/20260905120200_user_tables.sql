-- ============================================================================
-- User-owned data.
--
-- Every table here carries `user_id` and an RLS policy in this same migration.
-- On a public repository the policies are visible to anyone, and RLS is the
-- only thing standing between the published anon key and everyone's training
-- history — so there is no "add the policy later" for any of these.
-- (DECISIONS.md ADR-0019)
--
-- Two conventions worth understanding before reading on:
--
-- 1. `user_id` is denormalised onto child tables (routine_exercises,
--    session_exercises, session_sets) rather than reached through a join.
--    RLS policies that join are evaluated per row and get slow; PowerSync sync
--    rules also want a direct column to bucket on. The redundancy is kept
--    honest by composite foreign keys — a child row physically cannot point at
--    a parent belonging to a different user. See ADR-0021.
--
-- 2. Ordering uses a lexicographic `order_key text`, never an integer index.
--    Two devices reordering the same list offline produce duplicate integers
--    that row-level last-write-wins cannot repair, and every insert renumbers
--    its siblings. A fractional key makes an insert a single-row write.
--    Deliberately NOT unique: two offline devices can mint the same key, and a
--    unique constraint would turn that into a failed sync rather than a
--    cosmetic tie. Ties break on id. (ADR-0017 §12.5.4)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
create table public.profiles (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null unique references auth.users (id) on delete cascade,
  display_name      text,
  unit_system       text not null default 'metric'
                      check (unit_system in ('metric', 'imperial')),
  experience_level  text not null default 'beginner'
                      check (experience_level in ('beginner', 'intermediate', 'advanced')),
  birth_year        integer check (birth_year between 1900 and 2100),

  -- Current bodyweight, needed so a pull-up can be attributed real volume.
  -- This is not body-measurement tracking (out of scope, Brief §13) — it is one
  -- current value, snapshotted onto each session so history stays correct as
  -- the user gains or loses weight. (ADR-0017 §12.5.2)
  bodyweight_kg     numeric(5, 2) check (bodyweight_kg > 0),

  -- Global fallback for the rest timer. Per-exercise overrides live on
  -- exercises.default_rest_seconds; null there means derive from mechanic.
  rest_seconds_default integer not null default 120
                      check (rest_seconds_default between 15 and 900),

  -- 1 = Monday, matching ISO 8601 and the Brief §9 default.
  week_starts_on    smallint not null default 1 check (week_starts_on between 0 and 6),

  onboarded_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger profiles_touch
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

-- `(select auth.uid())` rather than a bare `auth.uid()` is deliberate: wrapping
-- it in a subselect lets the planner evaluate it once for the statement instead
-- of once per row. On a session with a few hundred sets that is the difference
-- between instant and noticeable.
create policy profiles_owner on public.profiles
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Every authenticated user needs a profile row to exist before the app can read
-- their unit system. Doing it in a trigger means it cannot be forgotten by a
-- client, and it works identically for email, Apple and Google sign-in.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    )
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- user_equipment — the "my gym has this" profile.
-- ----------------------------------------------------------------------------
create table public.user_equipment (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  equipment_id uuid not null references public.equipment (id) on delete cascade,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, equipment_id)
);

create trigger user_equipment_touch
  before update on public.user_equipment
  for each row execute function public.set_updated_at();

alter table public.user_equipment enable row level security;

create policy user_equipment_owner on public.user_equipment
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ----------------------------------------------------------------------------
-- routines
-- ----------------------------------------------------------------------------
create table public.routines (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  name              text not null check (length(trim(name)) > 0),
  notes             text,
  last_performed_at timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- Target for the composite foreign key from routine_exercises.
  unique (id, user_id)
);

create index routines_by_user on public.routines (user_id, last_performed_at desc nulls last);

create trigger routines_touch
  before update on public.routines
  for each row execute function public.set_updated_at();

alter table public.routines enable row level security;

create policy routines_owner on public.routines
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ----------------------------------------------------------------------------
-- routine_exercises
-- ----------------------------------------------------------------------------
create table public.routine_exercises (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  routine_id      uuid not null,
  exercise_id     uuid not null references public.exercises (id) on delete restrict,
  order_key       text not null check (length(order_key) > 0),
  target_sets     integer not null default 3 check (target_sets between 1 and 20),
  target_rep_low  integer not null default 8 check (target_rep_low >= 1),
  target_rep_high integer not null default 12,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- Composite FK: the child cannot belong to a different user than its parent.
  -- This is what makes the denormalised user_id safe rather than a liability.
  foreign key (routine_id, user_id)
    references public.routines (id, user_id) on delete cascade,

  constraint routine_exercises_rep_range_ordered
    check (target_rep_high >= target_rep_low)
);

create index routine_exercises_by_routine
  on public.routine_exercises (routine_id, order_key);

create trigger routine_exercises_touch
  before update on public.routine_exercises
  for each row execute function public.set_updated_at();

alter table public.routine_exercises enable row level security;

create policy routine_exercises_owner on public.routine_exercises
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ----------------------------------------------------------------------------
-- workout_sessions
-- ----------------------------------------------------------------------------
create table public.workout_sessions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  name                text,
  started_at          timestamptz not null default now(),
  ended_at            timestamptz,
  notes               text,
  source              text not null default 'manual'
                        check (source in ('manual', 'generated', 'routine')),
  routine_id          uuid,

  -- What the generator was asked for and what it decided, kept so a workout
  -- can be explained after the fact and so Phase 6 can debug its own output.
  generation_metadata jsonb,

  -- Snapshot, not a reference to profiles.bodyweight_kg: a pull-up logged at
  -- 80 kg bodyweight is still an 80 kg pull-up after the user drops to 75.
  bodyweight_kg       numeric(5, 2) check (bodyweight_kg > 0),

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  unique (id, user_id),

  foreign key (routine_id, user_id)
    references public.routines (id, user_id) on delete set null,

  constraint workout_sessions_ends_after_start
    check (ended_at is null or ended_at >= started_at),

  -- A session sourced from a routine should say which one; one that is not,
  -- should not claim to be.
  constraint workout_sessions_routine_matches_source
    check ((source = 'routine') = (routine_id is not null))
);

create index workout_sessions_by_user
  on public.workout_sessions (user_id, started_at desc);

create trigger workout_sessions_touch
  before update on public.workout_sessions
  for each row execute function public.set_updated_at();

alter table public.workout_sessions enable row level security;

create policy workout_sessions_owner on public.workout_sessions
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ----------------------------------------------------------------------------
-- session_exercises
-- ----------------------------------------------------------------------------
create table public.session_exercises (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  session_id  uuid not null,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  order_key   text not null check (length(order_key) > 0),
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  unique (id, user_id),

  foreign key (session_id, user_id)
    references public.workout_sessions (id, user_id) on delete cascade
);

create index session_exercises_by_session
  on public.session_exercises (session_id, order_key);

-- Brief §8: "prefill every set from the last time this exercise was performed"
-- is the single highest-value feature in the logger, and it runs on every
-- exercise the user opens. This index is what makes that lookup instant.
create index session_exercises_history
  on public.session_exercises (user_id, exercise_id, created_at desc);

create trigger session_exercises_touch
  before update on public.session_exercises
  for each row execute function public.set_updated_at();

alter table public.session_exercises enable row level security;

create policy session_exercises_owner on public.session_exercises
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ----------------------------------------------------------------------------
-- session_sets
--
-- The hot path. Written the instant a set is entered, never batched.
-- ----------------------------------------------------------------------------
create table public.session_sets (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  session_exercise_id uuid not null,
  order_key           text not null check (length(order_key) > 0),

  set_type            text not null default 'working'
                        check (set_type in ('warmup', 'working', 'dropset',
                                            'failure', 'amrap')),

  -- How to read weight_kg, which depends entirely on load_type:
  --   external       — the load on the bar or machine.
  --   bodyweight     — always 0. The load is profiles/session bodyweight.
  --   bodyweight_plus— added load on top of bodyweight (weighted pull-ups).
  --   assisted       — the assistance, subtracted from bodyweight.
  -- Without this, §9's volume maths attributes zero volume to every pull-up
  -- ever logged. (ADR-0017 §12.5.2)
  load_type           text not null default 'external'
                        check (load_type in ('external', 'bodyweight',
                                             'bodyweight_plus', 'assisted')),

  weight_kg           numeric(6, 2) not null default 0 check (weight_kg >= 0),
  reps                integer not null default 0 check (reps >= 0),
  rpe                 numeric(3, 1) check (rpe between 1 and 10),

  is_completed        boolean not null default false,
  completed_at        timestamptz,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  foreign key (session_exercise_id, user_id)
    references public.session_exercises (id, user_id) on delete cascade,

  constraint session_sets_completed_has_timestamp
    check (is_completed = (completed_at is not null)),

  -- A pure bodyweight set carries no external load by definition. Letting it
  -- hold a weight would double-count against the session bodyweight snapshot.
  constraint session_sets_bodyweight_has_no_load
    check (load_type <> 'bodyweight' or weight_kg = 0)
);

create index session_sets_by_exercise
  on public.session_sets (session_exercise_id, order_key);

-- Personal-record detection and the volume heat map both scan completed
-- working sets for a user over a date range.
create index session_sets_completed_by_user
  on public.session_sets (user_id, completed_at desc)
  where is_completed and set_type <> 'warmup';

create trigger session_sets_touch
  before update on public.session_sets
  for each row execute function public.set_updated_at();

alter table public.session_sets enable row level security;

create policy session_sets_owner on public.session_sets
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ----------------------------------------------------------------------------
-- personal_records
--
-- Computed client-side in packages/core on set completion, not by a database
-- trigger — it has to work offline. (Brief §5)
-- ----------------------------------------------------------------------------
create table public.personal_records (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  exercise_id    uuid not null references public.exercises (id) on delete cascade,
  record_type    text not null check (
                   record_type in ('max_weight', 'max_reps_at_weight',
                                   'estimated_1rm', 'max_session_volume')),
  value          numeric not null,

  -- Which formula produced `value`, so historical estimates stay interpretable
  -- if the formula ever changes. Required for estimated_1rm, meaningless for
  -- the others. (ADR-0015, ADR-0017 §12.5.3)
  formula        text check (formula in ('epley')),

  achieved_at    timestamptz not null default now(),
  session_set_id uuid references public.session_sets (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint personal_records_formula_only_for_estimates
    check ((record_type = 'estimated_1rm') = (formula is not null))
);

-- Rows are kept as a history rather than overwritten, so the 1RM trend line in
-- §9 has something to draw. This index serves both "what is my current best"
-- and "show me the progression".
create index personal_records_by_exercise
  on public.personal_records (user_id, exercise_id, record_type, achieved_at desc);

create trigger personal_records_touch
  before update on public.personal_records
  for each row execute function public.set_updated_at();

alter table public.personal_records enable row level security;

create policy personal_records_owner on public.personal_records
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
