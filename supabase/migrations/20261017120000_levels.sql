-- ============================================================================
-- Levels: each person's XP, published for friends. ADR-0132.
--
-- XP is worked out on the phone from the whole training log, like the
-- achievements it partly comes from (ADR-0072), so a friend's phone cannot
-- work out yours. The owner's phone publishes the total (`publish_xp`), and
-- `friends_overview` hands it to friends who are shared with, next to the
-- training it came from. The level is not stored: the phone reads it off the
-- curve in @g7m/core, so the curve can change without anybody republishing.
--
-- The total is trusted as sent, within reason, the way published achievements
-- are: the server cannot check a log it never reads, and every training row
-- is the owner's to write anyway.
-- ============================================================================

alter table public.friend_profiles
  add column if not exists xp integer;

comment on column public.friend_profiles.xp is
  'Total XP, as the owner''s phone worked it out. Null until first published. '
  'Published by publish_xp for friends to read. ADR-0132.';

create or replace function public.publish_xp(total integer)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  -- Far past anything a lifetime of training earns: a level over a thousand.
  if total is null or total < 0 or total > 10000000 then
    raise exception 'xp must be between 0 and 10,000,000' using errcode = '22023';
  end if;

  update public.friend_profiles set xp = total where user_id = me;
end;
$$;

revoke all on function public.publish_xp(integer) from public, anon;
grant execute on function public.publish_xp(integer) to authenticated;

-- ----------------------------------------------------------------------------
-- friends_overview, as in 20261007120000_friends.sql, with `xp` beside
-- `training` for a friend who shares it. A level is a summary of their
-- training, so it goes where the training goes and nowhere else.
-- ----------------------------------------------------------------------------
create or replace function public.friends_overview()
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

  return jsonb_build_object(
    'me', (
      select jsonb_build_object('code', p.friend_code, 'sharing', p.share_training)
        from public.friend_profiles p where p.user_id = me
    ),
    'requests', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', f.id,
               'user_id', f.requester_id,
               'name', public.friend_name(f.requester_id),
               'requested_at', f.requested_at
             ) order by f.requested_at desc)
        from public.friendships f
       where f.addressee_id = me and f.status = 'pending'
    ), '[]'::jsonb),
    'friends', coalesce((
      select jsonb_agg(
               jsonb_build_object(
                 'user_id', other.id,
                 'name', public.friend_name(other.id),
                 'since', f.responded_at,
                 'sharing', p.share_training
               )
               || case when p.share_training
                    then jsonb_build_object(
                           'training', public.training_summary(other.id),
                           'xp', p.xp
                         )
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
