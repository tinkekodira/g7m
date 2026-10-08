-- ============================================================================
-- One-to-one challenges between friends. ADR-0110.
--
-- One friend challenges another on one stat — workouts, weight, sets or time,
-- by the most done or the most improved — for seven days from the moment the
-- other accepts. One challenge at a time between any two people.
--
-- Built the way friendships are (ADR-0105): a table between two users, read
-- and written only through `security definer` functions that take the caller
-- from the token, check the friendship and both sharing switches, and send
-- nothing a friend could not already see. Not synced, not published.
--
-- What decides a challenge is counted on each phone from the same tallies the
-- leaderboard sends (`board_workouts`), by the same rules (ADR-0106, ADR-0109),
-- so the two never disagree about the same training.
-- ============================================================================

create table public.friend_challenges (
  id             uuid primary key default gen_random_uuid(),
  challenger_id  uuid not null references auth.users (id) on delete cascade,
  opponent_id    uuid not null references auth.users (id) on delete cascade,
  stat           text not null check (stat in ('workouts', 'lifted', 'sets', 'minutes')),
  ranking        text not null check (ranking in ('most', 'improved')),
  status         text not null default 'pending' check (status in ('pending', 'active')),
  sent_at        timestamptz not null default now(),
  -- When it was accepted, which is when the seven days begin.
  starts_at      timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint friend_challenges_not_yourself check (challenger_id <> opponent_id),
  constraint friend_challenges_started_when_active
    check ((status = 'active') = (starts_at is not null))
);

create index friend_challenges_by_challenger on public.friend_challenges (challenger_id);
create index friend_challenges_by_opponent on public.friend_challenges (opponent_id);

create trigger friend_challenges_touch
  before update on public.friend_challenges
  for each row execute function public.set_updated_at();

alter table public.friend_challenges enable row level security;

-- Both people can see the challenge between them. Nobody can write it directly:
-- a policy that let the opponent write would let a challenger accept their own.
create policy friend_challenges_participants_read on public.friend_challenges
  for select to authenticated
  using (challenger_id = (select auth.uid()) or opponent_id = (select auth.uid()));

comment on table public.friend_challenges is
  'One-to-one challenges between friends (ADR-0110). Not synced; written only by '
  'the challenge functions.';

-- Removing a friend ends every challenge between the two, finished or not.
create function public.end_challenges_with_friendship()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.friend_challenges c
   where least(c.challenger_id, c.opponent_id) = least(old.requester_id, old.addressee_id)
     and greatest(c.challenger_id, c.opponent_id) = greatest(old.requester_id, old.addressee_id);
  return old;
end;
$$;

create trigger friendships_end_challenges
  after delete on public.friendships
  for each row execute function public.end_challenges_with_friendship();

-- ----------------------------------------------------------------------------
-- Internal helpers, out of reach of anybody signed in.
-- ----------------------------------------------------------------------------

-- Whether a challenge is still in play: sent and waiting, for at most seven
-- days, or accepted and inside its seven. A challenge nobody answered lapses
-- rather than blocking the pair for ever.
create function public.challenge_is_live(c public.friend_challenges)
returns boolean
language sql
stable
set search_path = ''
as $$
  select (c.status = 'pending' and c.sent_at > now() - interval '7 days')
      or (c.status = 'active' and c.starts_at > now() - interval '7 days');
$$;

-- Whether somebody has anything to be measured against for Most improved: a
-- counted workout in the four weeks before now. With none, any workout at all
-- would be an infinite improvement (ADR-0109).
create function public.has_usual(owner uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_array_length(public.board_workouts(owner, now() - interval '28 days')) > 0;
$$;

-- The accepted friendship between two people, locked, so two challenges sent
-- at the same moment cannot both find the pair free.
create function public.lock_friendship(me uuid, other uuid)
returns uuid
language sql
volatile
security definer
set search_path = ''
as $$
  select f.id
    from public.friendships f
   where f.status = 'accepted'
     and least(f.requester_id, f.addressee_id) = least(me, other)
     and greatest(f.requester_id, f.addressee_id) = greatest(me, other)
   for update;
$$;

-- Why two people cannot start a challenge right now, or null if they can.
-- Both must share their training: a challenge is scored from it.
create function public.challenge_blocked(me uuid, other uuid, ranking text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when not coalesce((select p.share_training from public.friend_profiles p
                        where p.user_id = me), false)
      then 'you_not_sharing'
    when not coalesce((select p.share_training from public.friend_profiles p
                        where p.user_id = other), false)
      then 'not_sharing'
    when ranking = 'improved' and not public.has_usual(me) then 'you_no_usual'
    when ranking = 'improved' and not public.has_usual(other) then 'no_usual'
  end;
$$;

-- ----------------------------------------------------------------------------
-- What the app calls.
-- ----------------------------------------------------------------------------

create function public.send_challenge(friend_id uuid, stat text, ranking text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  blocked text;
  recent_count integer;
begin
  if me is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;

  if stat is null or stat not in ('workouts', 'lifted', 'sets', 'minutes')
     or ranking is null or ranking not in ('most', 'improved') then
    return jsonb_build_object('outcome', 'invalid');
  end if;

  if friend_id is null or friend_id = me or public.lock_friendship(me, friend_id) is null then
    return jsonb_build_object('outcome', 'not_friends');
  end if;

  if exists (
    select 1 from public.friend_challenges c
     where least(c.challenger_id, c.opponent_id) = least(me, friend_id)
       and greatest(c.challenger_id, c.opponent_id) = greatest(me, friend_id)
       and public.challenge_is_live(c)
  ) then
    return jsonb_build_object('outcome', 'already_live', 'name', public.friend_name(friend_id));
  end if;

  blocked := public.challenge_blocked(me, friend_id, ranking);
  if blocked is not null then
    return jsonb_build_object('outcome', blocked, 'name', public.friend_name(friend_id));
  end if;

  -- One at a time per pair already bounds this; the cap stops a loop of
  -- sending and withdrawing.
  select count(*) into recent_count
    from public.friend_challenges c
   where c.challenger_id = me and c.sent_at > now() - interval '1 hour';
  if recent_count >= 20 then
    return jsonb_build_object('outcome', 'too_many');
  end if;

  insert into public.friend_challenges (challenger_id, opponent_id, stat, ranking)
  values (me, friend_id, stat, ranking);
  return jsonb_build_object('outcome', 'sent', 'name', public.friend_name(friend_id));
end;
$$;

-- Only the person challenged can answer, and only while it is waiting. A
-- decline deletes it: the challenger sees it gone, and nobody is told in words.
create function public.respond_to_challenge(challenge_id uuid, accept boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  found_challenge public.friend_challenges;
  blocked text;
begin
  if me is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;

  select * into found_challenge
    from public.friend_challenges c
   where c.id = challenge_id
     and c.opponent_id = me
     and c.status = 'pending'
     and public.challenge_is_live(c)
   for update;
  if not found or public.lock_friendship(me, found_challenge.challenger_id) is null then
    return jsonb_build_object('outcome', 'not_found');
  end if;

  if not coalesce(accept, false) then
    delete from public.friend_challenges where id = found_challenge.id;
    return jsonb_build_object('outcome', 'declined');
  end if;

  blocked := public.challenge_blocked(me, found_challenge.challenger_id, found_challenge.ranking);
  if blocked is not null then
    return jsonb_build_object(
      'outcome', blocked, 'name', public.friend_name(found_challenge.challenger_id)
    );
  end if;

  update public.friend_challenges
     set status = 'active', starts_at = now()
   where id = found_challenge.id;
  return jsonb_build_object('outcome', 'started');
end;
$$;

-- The challenger can take back a challenge nobody has answered yet.
create function public.withdraw_challenge(challenge_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;

  delete from public.friend_challenges c
   where c.id = challenge_id and c.challenger_id = me and c.status = 'pending';

  return jsonb_build_object('outcome', case when found then 'done' else 'not_found' end);
end;
$$;

-- Every challenge you are in that is worth showing: waiting to be answered,
-- running, or finished in the last seven days, so its result is seen.
--
-- For a running or finished one, the friend's workouts from four weeks (and a
-- day, for timezones) before it began until it ended, one tally each, as the
-- leaderboard sends them — but only while they share. Yours are counted on
-- your phone, so a workout you have just finished counts before it uploads.
create function public.my_challenges()
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
    'challenges', coalesce((
      select jsonb_agg(
               jsonb_build_object(
                 'id', c.id,
                 'friend_id', other.id,
                 'name', public.friend_name(other.id),
                 'sent_by_me', c.challenger_id = me,
                 'stat', c.stat,
                 'ranking', c.ranking,
                 'status', c.status,
                 'sent_at', c.sent_at,
                 'starts_at', c.starts_at,
                 'sharing', p.share_training
               )
               || case when c.status = 'active' and p.share_training
                    then jsonb_build_object('workouts', coalesce((
                      select jsonb_agg(w order by w->>'started_at')
                        from jsonb_array_elements(
                               public.board_workouts(other.id, c.starts_at - interval '29 days')
                             ) w
                       where (w->>'started_at')::timestamptz < c.starts_at + interval '7 days'
                    ), '[]'::jsonb))
                    else '{}'::jsonb
                  end
               order by coalesce(c.starts_at, c.sent_at) desc
             )
        from public.friend_challenges c
        cross join lateral (
          select case when c.challenger_id = me then c.opponent_id else c.challenger_id end as id
        ) other
        join public.friend_profiles p on p.user_id = other.id
       where (c.challenger_id = me or c.opponent_id = me)
         and exists (
           select 1 from public.friendships f
            where f.status = 'accepted'
              and least(f.requester_id, f.addressee_id) = least(me, other.id)
              and greatest(f.requester_id, f.addressee_id) = greatest(me, other.id)
         )
         and (
           (c.status = 'pending' and c.sent_at > now() - interval '7 days')
           or (c.status = 'active' and c.starts_at > now() - interval '14 days')
         )
    ), '[]'::jsonb)
  );
end;
$$;

-- PUBLIC has EXECUTE on a new function by default and Supabase grants it to
-- anon as well, so everything is taken away first. The helpers take user ids,
-- so nobody signed in may call them.
revoke all on function public.end_challenges_with_friendship() from public, anon, authenticated;
revoke all on function public.challenge_is_live(public.friend_challenges) from public, anon, authenticated;
revoke all on function public.has_usual(uuid) from public, anon, authenticated;
revoke all on function public.lock_friendship(uuid, uuid) from public, anon, authenticated;
revoke all on function public.challenge_blocked(uuid, uuid, text) from public, anon, authenticated;

revoke all on function public.send_challenge(uuid, text, text) from public, anon;
revoke all on function public.respond_to_challenge(uuid, boolean) from public, anon;
revoke all on function public.withdraw_challenge(uuid) from public, anon;
revoke all on function public.my_challenges() from public, anon;

grant execute on function public.send_challenge(uuid, text, text) to authenticated;
grant execute on function public.respond_to_challenge(uuid, boolean) to authenticated;
grant execute on function public.withdraw_challenge(uuid) to authenticated;
grant execute on function public.my_challenges() to authenticated;
