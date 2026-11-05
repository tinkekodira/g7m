-- Ephemeral workout status stays outside PowerSync, like ordinary presence.
alter table public.friend_profiles
  add column share_workout_status boolean not null default true,
  add column workout_presence_session_id uuid,
  add column workout_active_until timestamptz;

create function public.set_workout_status_sharing(enabled boolean)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  update public.friend_profiles
     set share_workout_status = enabled,
         workout_active_until = case when enabled then workout_active_until else null end
   where user_id = auth.uid();
end;
$$;

-- The local session need not have uploaded yet. Only its opaque ID is sent,
-- never a workout title, exercise, set or other live training detail.
-- A device finishing an older session cannot clear a newer session's status.
create function public.report_workout_presence(session_id uuid, is_active boolean)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if session_id is null then
    raise exception 'session id required' using errcode = '22023';
  end if;
  if is_active then
    update public.friend_profiles
       set workout_presence_session_id = session_id,
           workout_active_until = now() + interval '5 minutes'
     where user_id = auth.uid() and share_workout_status and share_training;
  else
    update public.friend_profiles
       set workout_presence_session_id = null, workout_active_until = null
     where user_id = auth.uid() and workout_presence_session_id = session_id;
  end if;
end;
$$;

-- A small live read, so refreshing status does not re-fetch training history.
create function public.friends_workout_presence()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare me uuid := auth.uid();
begin
  if me is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'sharing', (select p.share_workout_status from public.friend_profiles p where p.user_id = me),
    'friends', coalesce((
      select jsonb_agg(jsonb_build_object('user_id', p.user_id, 'active_until', p.workout_active_until))
        from public.friend_profiles p
       where p.share_training and p.share_workout_status and p.workout_active_until > now()
         and exists (
           select 1 from public.friendships f
            where f.status = 'accepted'
              and ((f.requester_id = me and f.addressee_id = p.user_id)
                or (f.addressee_id = me and f.requester_id = p.user_id))
         )
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.set_workout_status_sharing(boolean) from public, anon;
revoke all on function public.report_workout_presence(uuid, boolean) from public, anon;
revoke all on function public.friends_workout_presence() from public, anon;
grant execute on function public.set_workout_status_sharing(boolean) to authenticated;
grant execute on function public.report_workout_presence(uuid, boolean) to authenticated;
grant execute on function public.friends_workout_presence() to authenticated;
