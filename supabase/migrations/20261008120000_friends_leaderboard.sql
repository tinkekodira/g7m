-- ============================================================================
-- The friends leaderboard. ADR-0106.
--
-- One read, in the shape of the other friend functions (ADR-0105): the caller
-- comes from the verified token, a friend is only included through an accepted
-- friendship, and only a friend who shares their training has any of it sent.
--
-- What is sent is one small tally per finished workout — when it started, its
-- clock, its set count and the weight lifted — not totals. "This week" starts
-- on the viewer's week start in the viewer's timezone, which the server does
-- not know, so the phone adds the tallies up itself, the way it works out the
-- week's dots. Nothing here is new to a friend: `friend_session` already shows
-- every set of every one of these workouts.
-- ============================================================================

-- A person's finished workouts since `since`, one tally each, by the same
-- rules the phone uses for your own (`liftedKg` and `boardTotals` in
-- @g7m/core; a schema test holds the two together):
--
-- - A workout counts once it is finished with at least one ticked working set,
--   cardio bouts included — the workouts the history list counts.
-- - `sets`: ticked working sets of lifting. A treadmill bout is not a set.
-- - `lifted_kg`: load × reps on those sets, external load only. A weighted
--   pull-up's `weight_kg` is the added plate, so it counts that and nothing
--   for the body; plain bodyweight and assisted sets add nothing. Counting
--   bodyweight would let a friend work out what somebody weighs.
-- - `first_set_at` steps back by a set's duration, so a single 30-minute
--   treadmill bout is 30 minutes of training rather than none, as the phone's
--   `sessionSummaries` does. `source` lets the phone leave out the clock of a
--   workout logged afterwards.
create function public.board_workouts(owner uuid, since timestamptz)
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
             count(*) filter (where e.cardio_kind is null) as sets,
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

-- Every friend, and for each who shares their training, their workouts since
-- `since`. The phone asks from the start of last month in its own timezone,
-- which covers this period and the last one, for either toggle.
--
-- Nothing earlier than that is sent, whatever is asked for. The floor is the
-- start of last month with a day's slack either side for any timezone: the
-- month is taken from yesterday, so just after midnight UTC on the 1st a
-- viewer still on the 31st is not cut off from the month they are reading.
create function public.friends_leaderboard(since timestamptz)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  floor_at timestamptz := greatest(
    coalesce(since, now()),
    date_trunc('month', now() - interval '1 day') - interval '1 month' - interval '1 day'
  );
begin
  if me is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'friends', coalesce((
      select jsonb_agg(
               jsonb_build_object(
                 'user_id', other.id,
                 'name', public.friend_name(other.id),
                 'sharing', p.share_training
               )
               || case when p.share_training
                    then jsonb_build_object('workouts', public.board_workouts(other.id, floor_at))
                    else '{}'::jsonb
                  end
               order by f.responded_at
             )
        from public.friendships f
        cross join lateral (
          select case when f.requester_id = me then f.addressee_id else f.requester_id end as id
        ) other
        join public.friend_profiles p on p.user_id = other.id
       where f.status = 'accepted' and (f.requester_id = me or f.addressee_id = me)
    ), '[]'::jsonb)
  );
end;
$$;

-- PUBLIC has EXECUTE on a new function by default and Supabase grants it to
-- anon as well, so everything is taken away first. The helper takes a user id,
-- so nobody signed in may call it.
revoke all on function public.board_workouts(uuid, timestamptz) from public, anon, authenticated;
revoke all on function public.friends_leaderboard(timestamptz) from public, anon;
grant execute on function public.friends_leaderboard(timestamptz) to authenticated;
