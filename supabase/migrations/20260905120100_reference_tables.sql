-- ============================================================================
-- Reference data: muscle groups, muscles, equipment, exercises.
--
-- Globally readable, admin-writable (Brief §5). "Admin-writable" is implemented
-- as *no write policy at all*: RLS denies by default, and the service role
-- bypasses RLS entirely. Seeds and the eventual admin tooling run as the
-- service role; nothing that holds an anon key can write here, and there is no
-- admin flag to get wrong.
--
-- RLS is enabled in the same migration that creates each table. On a public
-- repository the policies are readable by anyone, so a table without one is not
-- an oversight anybody has to discover. (DECISIONS.md ADR-0019)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- muscle_groups — the coarse buckets shown in the generator picker.
-- ----------------------------------------------------------------------------
create table public.muscle_groups (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name          text not null,
  display_order integer not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger muscle_groups_touch
  before update on public.muscle_groups
  for each row execute function public.set_updated_at();

alter table public.muscle_groups enable row level security;

create policy muscle_groups_read on public.muscle_groups
  for select to authenticated using (true);

-- ----------------------------------------------------------------------------
-- muscles — the fine-grained anatomical entries. These are what is clickable
-- on the 3D model, which makes this the most important table in the app.
-- ----------------------------------------------------------------------------
create table public.muscles (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9-]+$'),
  common_name     text not null,
  latin_name      text not null,
  muscle_group_id uuid not null references public.muscle_groups (id) on delete restrict,

  -- The contract between the GLB and the database (Brief §5).
  --
  -- An array, not a single column: §6 gives the model one mesh per muscle per
  -- side (`muscle_<slug>_l`, `muscle_<slug>_r`) while muscle rows here are
  -- side-agnostic, so one row maps to one *or two* nodes. A scalar column
  -- cannot express that, and the Phase 5 startup validation has to check every
  -- node it expects — otherwise it passes while a muscle is silently
  -- unclickable, which is exactly the failure the brief warns about.
  -- (DECISIONS.md ADR-0017 §12.5.5)
  mesh_node_names text[] not null default '{}',

  region          text not null check (region in ('anterior', 'posterior', 'both')),

  -- Some muscles exist on the model for visual completeness but are not
  -- training targets. Only selectable muscles are validated against the GLB.
  is_selectable   boolean not null default true,
  display_order   integer not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- A selectable muscle with no mesh node cannot be clicked, which is a bug
  -- that is invisible until someone tries. Refuse it at write time.
  constraint muscles_selectable_needs_mesh
    check (not is_selectable or cardinality(mesh_node_names) > 0)
);

create index muscles_group_idx on public.muscles (muscle_group_id, display_order);
create index muscles_selectable_idx on public.muscles (is_selectable) where is_selectable;

create trigger muscles_touch
  before update on public.muscles
  for each row execute function public.set_updated_at();

alter table public.muscles enable row level security;

create policy muscles_read on public.muscles
  for select to authenticated using (true);

-- ----------------------------------------------------------------------------
-- equipment
-- ----------------------------------------------------------------------------
create table public.equipment (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name       text not null,
  category   text not null check (
               category in ('barbell', 'dumbbell', 'machine', 'cable',
                            'bodyweight', 'bands', 'other')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger equipment_touch
  before update on public.equipment
  for each row execute function public.set_updated_at();

alter table public.equipment enable row level security;

create policy equipment_read on public.equipment
  for select to authenticated using (true);

-- ----------------------------------------------------------------------------
-- exercises
-- ----------------------------------------------------------------------------
create table public.exercises (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name                text not null,

  -- Powers fuzzy search: {"bench","BP","flat bench"}. Brief §7.
  aliases             text[] not null default '{}',

  mechanic            text not null check (mechanic in ('compound', 'isolation')),
  force               text not null check (force in ('push', 'pull', 'static')),
  joint_count         integer not null check (joint_count >= 1),
  difficulty          text not null check (
                        difficulty in ('beginner', 'intermediate', 'advanced')),
  is_unilateral       boolean not null default false,

  -- Ordered setup and execution steps.
  instructions        text[] not null default '{}',

  -- Short coaching cues: "chest up", "elbows tucked". Required on every
  -- exercise because they are the offline fallback for "how do I do this
  -- lift" when a YouTube embed cannot load. Brief §7.
  cues                text[] not null,

  common_mistakes     text[] not null default '{}',

  default_rep_low     integer not null check (default_rep_low >= 1),
  default_rep_high    integer not null,

  -- Null means "derive from mechanic" — roughly 180s compound, 90s isolation.
  -- The derivation lives in packages/core so it is tunable in one place.
  -- (DECISIONS.md ADR-0017 §12.3)
  default_rest_seconds integer check (default_rest_seconds between 15 and 900),

  video_provider      text not null default 'none'
                        check (video_provider in ('youtube', 'hosted', 'none')),
  video_ref           text,
  thumbnail_url       text,
  popularity_rank     integer not null default 1000,
  is_active           boolean not null default true,

  -- See public.exercise_search_text() in the conventions migration for why this
  -- needs a wrapper function rather than an inline expression.
  search_text         text generated always as
                        (public.exercise_search_text(name, aliases)) stored,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint exercises_rep_range_ordered check (default_rep_high >= default_rep_low),

  -- A single-joint movement is isolation by definition (Brief §5). Encoding it
  -- stops the two fields drifting apart during seeding, where it would silently
  -- corrupt the generator's compounds-first ordering.
  constraint exercises_joint_count_matches_mechanic
    check ((joint_count = 1) = (mechanic = 'isolation')),

  -- A provider without a reference is a broken player; a reference without a
  -- provider is unreachable data.
  constraint exercises_video_ref_matches_provider
    check ((video_provider = 'none') = (video_ref is null)),

  constraint exercises_cues_not_empty check (cardinality(cues) > 0)
);

create index exercises_search_trgm
  on public.exercises using gin (search_text gin_trgm_ops);

create index exercises_active_rank_idx
  on public.exercises (popularity_rank) where is_active;

create index exercises_mechanic_idx on public.exercises (mechanic) where is_active;

create trigger exercises_touch
  before update on public.exercises
  for each row execute function public.set_updated_at();

alter table public.exercises enable row level security;

create policy exercises_read on public.exercises
  for select to authenticated using (true);

-- ----------------------------------------------------------------------------
-- exercise_equipment
--
-- Replaces the `equipment_id` + `secondary_equipment_id` pair from Brief §5.
-- Two slots cannot express a barbell hip thrust (barbell + bench + pad), which
-- slot means what is unenforced, and §8's "avoid two consecutive exercises on
-- the same station" rule needs to know which item *is* the station.
-- (DECISIONS.md ADR-0017 §12.5.1)
-- ----------------------------------------------------------------------------
create table public.exercise_equipment (
  id           uuid primary key default gen_random_uuid(),
  exercise_id  uuid not null references public.exercises (id) on delete cascade,
  equipment_id uuid not null references public.equipment (id) on delete restrict,

  -- The station you queue for. Drives generator scheduling and the equipment
  -- badge in the exercise list.
  is_primary   boolean not null default false,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  unique (exercise_id, equipment_id)
);

-- Exactly one primary per exercise. A partial unique index is the only way to
-- say that in Postgres, and without it the generator has no deterministic
-- answer to "which station does this exercise occupy".
create unique index exercise_equipment_one_primary
  on public.exercise_equipment (exercise_id) where is_primary;

create index exercise_equipment_by_equipment
  on public.exercise_equipment (equipment_id);

create trigger exercise_equipment_touch
  before update on public.exercise_equipment
  for each row execute function public.set_updated_at();

alter table public.exercise_equipment enable row level security;

create policy exercise_equipment_read on public.exercise_equipment
  for select to authenticated using (true);

-- ----------------------------------------------------------------------------
-- exercise_muscles — the join that makes everything work.
-- ----------------------------------------------------------------------------
create table public.exercise_muscles (
  id                 uuid primary key default gen_random_uuid(),
  exercise_id        uuid not null references public.exercises (id) on delete cascade,
  muscle_id          uuid not null references public.muscles (id) on delete restrict,
  role               text not null check (role in ('primary', 'secondary', 'stabilizer')),

  -- Drives ranking in the muscle panel (Brief §6). Deliberately NOT used for
  -- heat-map set counting, which counts whole sets by role instead — see §9.
  recruitment_weight numeric(3, 2) not null
                       check (recruitment_weight >= 0 and recruitment_weight <= 1),

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  unique (exercise_id, muscle_id)
);

create index exercise_muscles_by_muscle
  on public.exercise_muscles (muscle_id, role, recruitment_weight desc);

create trigger exercise_muscles_touch
  before update on public.exercise_muscles
  for each row execute function public.set_updated_at();

alter table public.exercise_muscles enable row level security;

create policy exercise_muscles_read on public.exercise_muscles
  for select to authenticated using (true);
