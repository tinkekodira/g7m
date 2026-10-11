-- ============================================================================
-- A friend's profile: their body, achievements, routines and best lifts.
-- ADR-0117.
--
-- Your own profile builds all four on the phone from your own rows. A
-- friend's rows are not on your phone (ADR-0105), so:
--
-- 1. `friend_profiles.achievements` — the badges each person has earned, with
--    when, as their own phone worked them out. Achievements are never computed
--    on the server (ADR-0072): the rules live in @g7m/core and read a whole
--    training log. So the owner's phone publishes the result
--    (`publish_achievements`) and friends read it.
-- 2. `friend_profile(friend_id, since)` — the rest, for a friend who shares
--    with you, and null for anybody else, like every friend function:
--      * `name`, for the pages opened from theirs;
--      * `sex`, for which body to draw them on;
--      * `heat`, each muscle's training since `since` relative to their
--        hardest-worked one, rounded to tenths, hardest first;
--      * `achievements`, as published;
--      * `routines`, with each movement's sets, rep range and superset;
--      * `bests`, the heaviest external load per exercise and the day of the
--        workout it was first lifted in.
--
-- ## Why the heat is worked out here, rounded
--
-- A pull-up's volume is the lifter's bodyweight times the reps. Sending a
-- friend the volumes, or the sets with their bodyweight snapshot, would let
-- them divide it back out, and bodyweight is the one number friends are never
-- shown (ADR-0105). So the server does the sum the phone does
-- (`volumeByMuscle`, `relativeVolume`), with the session's bodyweight, and
-- sends only each muscle's share of the peak, to one decimal place. That is
-- all the body is coloured by.
--
-- ## Why bests are external load only
--
-- The same reason. A plain pull-up's "best" with bodyweight counted is the
-- bodyweight. `best_lifts` already counts external load only, for the card
-- and head-to-head; this is that rule with the date it was first reached.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Published achievements.
--
-- A list of `{ "key": "gym-rat", "earned_at": "2026-09-01T..." }`. Null until
-- the owner's phone first publishes, which a friend's page reads as "nothing
-- to show yet" rather than "none earned".
-- ----------------------------------------------------------------------------
alter table public.friend_profiles
  add column if not exists achievements jsonb;

comment on column public.friend_profiles.achievements is
  'Achievements earned, as the owner''s phone worked them out: [{key, earned_at}]. '
  'Published by publish_achievements for friends to read. ADR-0117.';

create or replace function public.publish_achievements(earned jsonb)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  cleaned jsonb;
begin
  if me is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if jsonb_typeof(earned) <> 'array' or jsonb_array_length(earned) > 200 then
    raise exception 'achievements must be a list of at most 200' using errcode = '22023';
  end if;

  -- Rebuilt rather than stored as sent: only a key of the shape the app uses
  -- and a real timestamp go in, so a friend's phone never decodes anything
  -- else from somebody's row.
  select coalesce(jsonb_agg(jsonb_build_object(
           'key', item ->> 'key',
           'earned_at', (item ->> 'earned_at')::timestamptz
         ) order by item ->> 'key'), '[]'::jsonb)
    into cleaned
    from jsonb_array_elements(earned) item
   where jsonb_typeof(item) = 'object'
     and (item ->> 'key') ~ '^[a-z0-9-]{1,60}$'
     and (item ->> 'earned_at') is not null;

  update public.friend_profiles set achievements = cleaned where user_id = me;
end;
$$;

-- ----------------------------------------------------------------------------
-- 2. Everything else, read for a friend.
-- ----------------------------------------------------------------------------

-- Each muscle's work since `since`, as a share of the most-worked one, rounded
-- to tenths, hardest first. The phone's rule: completed working sets of
-- finished workouts, load times reps, the load counting the session's
-- bodyweight for bodyweight movements (`effectiveLoadKg`), and each set split
-- across its muscles by `recruitment_weight` (`volumeByMuscle`).
create function public.muscle_heat(owner uuid, since timestamptz)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with loads as (
    select se.exercise_id,
           ss.reps * case ss.load_type
             when 'external' then ss.weight_kg
             when 'bodyweight' then ws.bodyweight_kg
             when 'bodyweight_plus' then ws.bodyweight_kg + ss.weight_kg
             when 'assisted' then greatest(0, ws.bodyweight_kg - ss.weight_kg)
           end as volume
      from public.session_sets ss
      join public.session_exercises se on se.id = ss.session_exercise_id
      join public.workout_sessions ws on ws.id = se.session_id
     where ss.user_id = owner
       and ws.started_at >= since
       and ws.ended_at is not null
       and ss.is_completed
       and ss.set_type <> 'warmup'
       and ss.reps >= 0
       and ss.weight_kg >= 0
  ),
  totals as (
    select em.muscle_id, sum(l.volume * em.recruitment_weight) as total
      from loads l
      join public.exercise_muscles em on em.exercise_id = l.exercise_id
     where l.volume > 0
       and em.recruitment_weight > 0
     group by em.muscle_id
  ),
  peak as (
    select max(total) as top from totals
  )
  select coalesce(jsonb_agg(jsonb_build_object(
           'slug', m.slug,
           'intensity', round(t.total / p.top, 1)
         ) order by t.total desc, m.slug), '[]'::jsonb)
    from totals t
    cross join peak p
    join public.muscles m on m.id = t.muscle_id
   where p.top > 0;
$$;

create function public.friend_profile(friend_id uuid, since timestamptz)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if not public.shares_training_with(me, friend_id) then
    return null;
  end if;

  return jsonb_build_object(
    'name', public.friend_name(friend_id),
    'sex', (select p.sex from public.profiles p where p.user_id = friend_id),
    -- Whether anything at all was finished in the window, so "nothing logged
    -- lately" is not confused with "only cardio".
    'trained', exists (
      select 1 from public.workout_sessions ws
       where ws.user_id = friend_id and ws.ended_at is not null and ws.started_at >= since
    ),
    'heat', public.muscle_heat(friend_id, since),
    'achievements', (select fp.achievements from public.friend_profiles fp where fp.user_id = friend_id),
    'routines', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', r.id,
               'name', r.name,
               'exercises', coalesce((
                 select jsonb_agg(jsonb_build_object(
                          'exercise_id', re.exercise_id,
                          'target_sets', re.target_sets,
                          'target_rep_low', re.target_rep_low,
                          'target_rep_high', re.target_rep_high,
                          'superset_id', re.superset_id
                        ) order by re.order_key, re.id)
                   from public.routine_exercises re
                  where re.routine_id = r.id
               ), '[]'::jsonb)
             ) order by r.last_performed_at desc nulls last, r.created_at desc, r.id)
        from public.routines r
       where r.user_id = friend_id
    ), '[]'::jsonb),
    'bests', coalesce((
      select jsonb_agg(jsonb_build_object(
               'exercise_id', b.exercise_id,
               'best_kg', b.best_kg,
               'achieved_at', b.achieved_at
             ) order by b.best_kg desc, b.exercise_id)
        from (
          select distinct on (se.exercise_id)
                 se.exercise_id, ss.weight_kg as best_kg, ws.started_at as achieved_at
            from public.session_sets ss
            join public.session_exercises se on se.id = ss.session_exercise_id
            join public.workout_sessions ws on ws.id = se.session_id
           where ss.user_id = friend_id
             and ss.is_completed
             and ss.set_type <> 'warmup'
             and ss.load_type = 'external'
             and ss.weight_kg > 0
             and ws.ended_at is not null
           order by se.exercise_id, ss.weight_kg desc, ws.started_at
        ) b
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.muscle_heat(uuid, timestamptz) from public, anon, authenticated;
revoke all on function public.publish_achievements(jsonb) from public, anon;
revoke all on function public.friend_profile(uuid, timestamptz) from public, anon;

grant execute on function public.publish_achievements(jsonb) to authenticated;
grant execute on function public.friend_profile(uuid, timestamptz) to authenticated;
