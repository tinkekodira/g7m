-- ============================================================================
-- Supersets and drop sets. ADR-0112.
--
-- Three changes, deployed together:
--
-- 1. `superset_id` on `session_exercises` and `routine_exercises`. The
--    exercises done as one superset share it. Nothing else is stored: which
--    exercises are grouped, what a round is and when to rest are all worked
--    out on the phone from the id and the exercises' order (`superset.ts`).
-- 2. A drop set counts as part of the set it came off. `board_workouts` and
--    `workout_summary` count `set_type not in ('warmup', 'dropset')` as sets,
--    the rule the phone's `countsAsSet` follows; the weight lifted in a drop
--    still counts.
-- 3. `friend_session` sends each exercise's `superset_id`, so a friend's
--    superset reads as one and "Do this workout" copies it as one.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. The column.
--
-- No foreign key: it references no row. A `supersets` table would be a parent
-- with nothing to say about itself, plus a publication entry, a bucket query
-- and an upload ordering to get wrong. No CHECK: that the members sit next to
-- each other, and that there are at least two, are rules across rows, which a
-- CHECK cannot see — and the phone already reads anything else as ordinary
-- exercises. No index: nothing is ever looked up by it; a session's exercises
-- are read by `session_exercises_by_session` and grouped in memory.
--
-- A uuid minted on the phone rather than a group number per workout, because
-- two phones offline would both make "group 1".
-- ----------------------------------------------------------------------------
alter table public.session_exercises add column if not exists superset_id uuid;
alter table public.routine_exercises add column if not exists superset_id uuid;

comment on column public.session_exercises.superset_id is
  'Shared by the exercises done as one superset; members sit together by order_key. ADR-0112.';
comment on column public.routine_exercises.superset_id is
  'Shared by the exercises planned as one superset; members sit together by order_key. ADR-0112.';

-- ----------------------------------------------------------------------------
-- 2. A drop is part of its set.
--
-- The same body as ADR-0106's, with one change in the `sets` filter. Replaced
-- rather than dropped, so the grants stay as they were.
-- ----------------------------------------------------------------------------
create or replace function public.board_workouts(owner uuid, since timestamptz)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'started_at', ws.started_at,
           'source', ws.source,
           'first_set_at', counted.first_set_at,
           'last_set_at', counted.last_set_at,
           'sets', counted.sets,
           'lifted_kg', counted.lifted_kg
         ) order by ws.started_at, ws.id), '[]'::jsonb)
    from public.workout_sessions ws
    cross join lateral (
      select count(*) as counted,
             -- A drop is the set before it carried on lighter: its weight
             -- counts below, but it is not another set.
             count(*) filter (where e.cardio_kind is null and ss.set_type <> 'dropset') as sets,
             coalesce(sum(ss.weight_kg * ss.reps) filter (
               where e.cardio_kind is null
                 and ss.load_type in ('external', 'bodyweight_plus')
                 and ss.weight_kg > 0
                 and ss.reps > 0
             ), 0) as lifted_kg,
             min(ss.completed_at - make_interval(secs => coalesce(ss.duration_seconds, 0)))
               as first_set_at,
             max(ss.completed_at) as last_set_at
        from public.session_sets ss
        join public.session_exercises se on se.id = ss.session_exercise_id
        -- LEFT, as on the phone: a set is counted whatever its exercise is.
        left join public.exercises e on e.id = se.exercise_id
       where se.session_id = ws.id
         and ss.is_completed
         and ss.set_type <> 'warmup'
    ) counted
   where ws.user_id = owner
     and ws.ended_at is not null
     and ws.started_at >= since
     and counted.counted > 0;
$$;

-- ADR-0105's body, with drops left out of each exercise's set count.
create or replace function public.workout_summary(w public.workout_sessions)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', (w).id,
    'name', (w).name,
    'source', (w).source,
    'started_at', (w).started_at,
    'ended_at', (w).ended_at,
    'work', coalesce((
      select jsonb_agg(jsonb_build_object(
               'exercise_id', se.exercise_id,
               'sets', (
                 select count(*) from public.session_sets ss
                  where ss.session_exercise_id = se.id
                    and ss.is_completed
                    and ss.set_type not in ('warmup', 'dropset')
               )
             ) order by se.order_key, se.id)
        from public.session_exercises se
       where se.session_id = (w).id
    ), '[]'::jsonb),
    'first_set_at', (
      select min(ss.completed_at) from public.session_sets ss
        join public.session_exercises se on se.id = ss.session_exercise_id
       where se.session_id = (w).id and ss.is_completed
    ),
    'last_set_at', (
      select max(ss.completed_at) from public.session_sets ss
        join public.session_exercises se on se.id = ss.session_exercise_id
       where se.session_id = (w).id and ss.is_completed
    )
  );
$$;

-- ----------------------------------------------------------------------------
-- 3. A friend's superset, sent.
--
-- ADR-0105's body, with `superset_id` on each exercise. A phone that predates
-- it ignores the field.
-- ----------------------------------------------------------------------------
create or replace function public.friend_session(friend_id uuid, session_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  chosen public.workout_sessions;
begin
  if me is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if not public.shares_training_with(me, friend_id) then
    return null;
  end if;

  select * into chosen
    from public.workout_sessions ws
   where ws.id = friend_session.session_id
     and ws.user_id = friend_id
     and ws.ended_at is not null;
  if not found then
    return null;
  end if;

  return public.workout_summary(chosen) || jsonb_build_object(
    'exercises', coalesce((
      select jsonb_agg(jsonb_build_object(
               'exercise_id', se.exercise_id,
               'superset_id', se.superset_id,
               'sets', coalesce((
                 select jsonb_agg(jsonb_build_object(
                          'set_type', ss.set_type,
                          'load_type', ss.load_type,
                          'weight_kg', ss.weight_kg,
                          'reps', ss.reps,
                          'is_completed', ss.is_completed,
                          'completed_at', ss.completed_at,
                          'duration_seconds', ss.duration_seconds,
                          'distance_m', ss.distance_m,
                          'speed_kmh', ss.speed_kmh,
                          'incline_percent', ss.incline_percent,
                          'resistance_level', ss.resistance_level,
                          'avg_watts', ss.avg_watts,
                          'floors', ss.floors,
                          'calories_kcal', ss.calories_kcal
                        ) order by ss.order_key, ss.id)
                   from public.session_sets ss
                  where ss.session_exercise_id = se.id
               ), '[]'::jsonb)
             ) order by se.order_key, se.id)
        from public.session_exercises se
       where se.session_id = chosen.id
    ), '[]'::jsonb)
  );
end;
$$;
