-- ============================================================================
-- gyms — the places somebody trains, and which one each workout happened at.
--
-- ADR-0178. Somebody with two gym memberships logs the same "machine chest
-- press" at both, and the two machines do not weigh the same: 90 kg on one
-- pulldown is harder than 100 kg on the other. Before anything can compare a
-- machine lift within one gym, a workout has to say where it happened.
--
-- ## Why gym_id is nullable
--
-- Nobody with one gym should be asked where they trained. The feature is off
-- until `profiles.multiple_gyms` is switched on, and every workout logged
-- before that has no gym. Switching it on tags those workouts with the first
-- gym the lifter names, from the device (`GymRepository.tagUntaggedSessions`),
-- so the history they already have keeps counting at the gym it came from.
--
-- ## Archived, not deleted
--
-- A gym somebody stops going to still names the workouts done there. The app
-- archives; it never deletes. The foreign key still says what happens if a row
-- is removed some other way: the workout loses its gym and nothing else. The
-- column list on `set null` matters — without it Postgres would null
-- `user_id` too, which the composite key shares and which is not nullable.
--
-- The replication role's SELECT is granted automatically by the ALTER DEFAULT
-- PRIVILEGES in 20260907140000_replication_grants.sql.
-- ============================================================================

create table public.gyms (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,

  -- What the lifter calls it. Short, because it is a chip on a phone.
  name         text not null check (char_length(btrim(name)) between 1 and 40),

  -- Fractional key, like routines, so reordering writes one row.
  order_key    text not null,

  -- Set when the lifter stops going there. Its workouts keep its name.
  archived_at  timestamptz,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  unique (id, user_id)
);

create index gyms_by_user
  on public.gyms (user_id, order_key);

create trigger gyms_touch
  before update on public.gyms
  for each row execute function public.set_updated_at();

alter table public.gyms enable row level security;

create policy gyms_owner on public.gyms
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

comment on table public.gyms is
  'The gyms one lifter trains at (ADR-0178). Machine lifts are compared within '
  'a gym, because the same machine at two gyms does not weigh the same.';

-- ----------------------------------------------------------------------------
-- Where each workout happened. Null for anybody with one gym.
-- ----------------------------------------------------------------------------
alter table public.workout_sessions
  add column gym_id uuid;

alter table public.workout_sessions
  add constraint workout_sessions_gym_fk
  foreign key (gym_id, user_id)
  references public.gyms (id, user_id)
  on delete set null (gym_id);

-- "The last gym I trained at" is the first row of this index.
create index workout_sessions_by_gym
  on public.workout_sessions (user_id, gym_id, started_at desc)
  where gym_id is not null;

-- ----------------------------------------------------------------------------
-- The switch. Off by default: one gym is the common case and asks nothing.
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column multiple_gyms boolean not null default false;

-- ----------------------------------------------------------------------------
-- The publication. See ADR-0031 and `powersync-publication.test.ts`.
-- ----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'powersync')
     and not exists (
       select 1 from pg_publication_tables
        where pubname = 'powersync'
          and schemaname = 'public'
          and tablename = 'gyms'
     )
  then
    execute 'alter publication powersync add table public.gyms';
  end if;
end
$$;
