-- ============================================================================
-- Most improved on the friends leaderboard. ADR-0109.
--
-- Most improved measures a period against the four weeks before it began, and
-- crowns last period's most improved by measuring last period against the four
-- weeks before *it*. The furthest back that reaches is inside the month before
-- last, so the floor moves back one month: the phone now asks from the start of
-- the month before last, and nothing earlier than that is sent.
--
-- Only the floor changes. Everything else is ADR-0106's function as it was.
-- ============================================================================

-- The floor is the start of the month before last with a day's slack either
-- side for any timezone: the month is taken from yesterday, so just after
-- midnight UTC on the 1st a viewer still on the 31st is not cut off from the
-- months they are reading.
create or replace function public.friends_leaderboard(since timestamptz)
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
    date_trunc('month', now() - interval '1 day') - interval '2 months' - interval '1 day'
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

-- `create or replace` keeps the grants, but they are restated so this file
-- says on its own who may call the function.
revoke all on function public.friends_leaderboard(timestamptz) from public, anon;
grant execute on function public.friends_leaderboard(timestamptz) to authenticated;
