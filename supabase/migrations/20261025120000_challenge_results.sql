-- Durable challenge results, acknowledgment and private history. ADR-0156.
-- Snapshots advance with uploaded training only until starts_at + 8 elapsed
-- days. No scheduler or app visit is needed at the cutoff. Reads thereafter
-- finalize the already frozen snapshot, never today's mutable workout data.
alter table public.friend_challenges
  add column challenger_score jsonb,
  add column opponent_score jsonb,
  add column result_available boolean not null default false,
  add column recovered boolean not null default false,
  add column challenger_ack_at timestamptz,
  add column opponent_ack_at timestamptz,
  add column challenger_popup_at timestamptz,
  add column opponent_popup_at timestamptz;

create function public.challenge_saved_score(owner uuid, c public.friend_challenges)
returns jsonb language sql volatile security definer set search_path = '' as $$
  with w as (
    select x, (x->>'started_at')::timestamptz as at
      from jsonb_array_elements(public.board_workouts(owner, c.starts_at - interval '672 hours')) x
  ), totals as (
    select coalesce(sum(case c.stat
      when 'workouts' then 1
      when 'sets' then (x->>'sets')::numeric
      when 'lifted' then (x->>'lifted_kg')::numeric
      when 'minutes' then case when x->>'source' = 'past' then 0 else
        greatest(0, round(extract(epoch from
          ((x->>'last_set_at')::timestamptz - (x->>'first_set_at')::timestamptz)) / 60)) end
    end) filter (where at >= c.starts_at and at < c.starts_at + interval '168 hours'), 0) as done,
    coalesce(sum(case c.stat
      when 'workouts' then 1
      when 'sets' then (x->>'sets')::numeric
      when 'lifted' then (x->>'lifted_kg')::numeric
      when 'minutes' then case when x->>'source' = 'past' then 0 else
        greatest(0, round(extract(epoch from
          ((x->>'last_set_at')::timestamptz - (x->>'first_set_at')::timestamptz)) / 60)) end
    end) filter (where at < c.starts_at), 0) as before from w
  ) select jsonb_build_object(
    'amount', done,
    'score', case when c.ranking = 'most' then round(done)
      when round(before) > 0 then round(round(done) / (round(before) / 4) * 100)
      else null end,
    'usual', case when c.ranking = 'most' then 0 else round(before) / 4 end
  ) from totals;
$$;

create function public.refresh_challenge_scores(owner uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare c public.friend_challenges; available boolean;
  empty_score constant jsonb := '{"amount":0,"score":0,"usual":0}'::jsonb;
begin
  -- Row locks also serialize concurrent uploads by the two participants.
  for c in select * from public.friend_challenges
    where status = 'active' and owner in (challenger_id, opponent_id)
      and clock_timestamp() < starts_at + interval '192 hours'
    order by id for update
  loop
    select count(*) = 2 and bool_and(share_training) into available
      from public.friend_profiles where user_id in (c.challenger_id, c.opponent_id);
    update public.friend_challenges set
      challenger_score = case when available then public.challenge_saved_score(c.challenger_id, c) else empty_score end,
      opponent_score = case when available then public.challenge_saved_score(c.opponent_id, c) else empty_score end,
      result_available = available
      where id = c.id and clock_timestamp() < starts_at + interval '192 hours';
  end loop;
end;
$$;

create function public.challenge_training_changed()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op <> 'INSERT' then perform public.refresh_challenge_scores(old.user_id); end if;
  if tg_op <> 'DELETE' and (tg_op = 'INSERT' or new.user_id is distinct from old.user_id) then
    perform public.refresh_challenge_scores(new.user_id);
  end if;
  return null;
end;
$$;

create trigger challenge_sessions_changed after insert or update or delete on public.workout_sessions
  for each row execute function public.challenge_training_changed();
create trigger challenge_exercises_changed after insert or update or delete on public.session_exercises
  for each row execute function public.challenge_training_changed();
create trigger challenge_sets_changed after insert or update or delete on public.session_sets
  for each row execute function public.challenge_training_changed();
create trigger challenge_sharing_changed after update of share_training on public.friend_profiles
  for each row execute function public.challenge_training_changed();

create function public.challenge_initial_scores()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'active' then
    new.result_available := (select count(*) = 2 and bool_and(share_training)
      from public.friend_profiles where user_id in (new.challenger_id, new.opponent_id));
    new.challenger_score := case when new.result_available then public.challenge_saved_score(new.challenger_id, new)
      else '{"amount":0,"score":0,"usual":0}'::jsonb end;
    new.opponent_score := case when new.result_available then public.challenge_saved_score(new.opponent_id, new)
      else '{"amount":0,"score":0,"usual":0}'::jsonb end;
  end if;
  return new;
end;
$$;
create trigger challenge_initial_scores before insert or update of starts_at on public.friend_challenges
  for each row execute function public.challenge_initial_scores();

-- Recover only from data still present; never pretend these are original finals.
update public.friend_challenges c set
  challenger_score = public.challenge_saved_score(c.challenger_id, c),
  opponent_score = public.challenge_saved_score(c.opponent_id, c),
  result_available = (select count(*) = 2 and bool_and(share_training)
    from public.friend_profiles where user_id in (c.challenger_id, c.opponent_id)),
  recovered = c.starts_at + interval '192 hours' <= now(),
  challenger_ack_at = case when c.starts_at < now() - interval '336 hours' then now() end,
  opponent_ack_at = case when c.starts_at < now() - interval '336 hours' then now() end,
  challenger_popup_at = case when c.starts_at < now() - interval '336 hours' then now() end,
  opponent_popup_at = case when c.starts_at < now() - interval '336 hours' then now() end
where c.status = 'active';

-- The table's participant SELECT policy must not expose private provisional
-- training while either participant has sharing switched off.
update public.friend_challenges set
  challenger_score = '{"amount":0,"score":0,"usual":0}'::jsonb,
  opponent_score = '{"amount":0,"score":0,"usual":0}'::jsonb
where status = 'active' and not result_available;

create function public.challenge_reply(c public.friend_challenges, me uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  other uuid := case when c.challenger_id = me then c.opponent_id else c.challenger_id end;
  mine jsonb := case when c.challenger_id = me then c.challenger_score else c.opponent_score end;
  theirs jsonb := case when c.challenger_id = me then c.opponent_score else c.challenger_score end;
  final boolean := c.status = 'active' and now() >= c.starts_at + interval '192 hours';
  sharing boolean := coalesce((select share_training from public.friend_profiles where user_id = other), false);
begin
  return jsonb_build_object(
    'id', c.id, 'friend_id', other, 'name', public.friend_name(other),
    'sent_by_me', c.challenger_id = me, 'stat', c.stat, 'ranking', c.ranking,
    'status', c.status, 'sent_at', c.sent_at, 'starts_at', c.starts_at,
    'sharing', sharing, 'recovered', c.recovered,
    'acknowledged', case when c.challenger_id = me then c.challenger_ack_at else c.opponent_ack_at end is not null,
    'result', case when final then jsonb_build_object(
      'mine', mine, 'theirs', theirs,
      'outcome', case when not c.result_available then 'unavailable'
        when coalesce((mine->>'score')::numeric, 0) > coalesce((theirs->>'score')::numeric, 0) then 'win'
        when coalesce((mine->>'score')::numeric, 0) < coalesce((theirs->>'score')::numeric, 0) then 'loss'
        else 'draw' end
    ) else null end
  ) || case when c.status = 'active' and not final and sharing and c.result_available then
    jsonb_build_object('workouts', coalesce((select jsonb_agg(w)
      from jsonb_array_elements(public.board_workouts(other, c.starts_at - interval '696 hours')) w
      where (w->>'started_at')::timestamptz < c.starts_at + interval '168 hours'), '[]'::jsonb))
    else '{}'::jsonb end;
end;
$$;

create or replace function public.my_challenges()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'not signed in' using errcode = '42501'; end if;
  return jsonb_build_object('challenges', coalesce((
    select jsonb_agg(public.challenge_reply(c, me) order by coalesce(c.starts_at, c.sent_at) desc, c.id)
    from public.friend_challenges c
    where me in (c.challenger_id, c.opponent_id) and (
      (c.status = 'pending' and public.challenge_is_live(c)) or
      (c.status = 'active' and (now() < c.starts_at + interval '192 hours' or
        case when c.challenger_id = me then c.challenger_ack_at else c.opponent_ack_at end is null))
    )), '[]'::jsonb));
end;
$$;

create function public.acknowledge_challenge(challenge_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid();
begin
  update public.friend_challenges c set
    challenger_ack_at = case when me = c.challenger_id then coalesce(c.challenger_ack_at, now()) else c.challenger_ack_at end,
    opponent_ack_at = case when me = c.opponent_id then coalesce(c.opponent_ack_at, now()) else c.opponent_ack_at end
    where c.id = challenge_id and me in (c.challenger_id, c.opponent_id)
      and c.starts_at + interval '192 hours' <= now();
  if not found then raise exception 'Challenge result unavailable' using errcode = '42501'; end if;
end;
$$;

-- Claim, rather than read then mark: concurrent devices cannot announce twice.
create function public.claim_challenge_results()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); reply jsonb;
begin
  if me is null then raise exception 'not signed in' using errcode = '42501'; end if;
  with claimed as (
    update public.friend_challenges c set
      challenger_popup_at = case when c.challenger_id = me then now() else c.challenger_popup_at end,
      opponent_popup_at = case when c.opponent_id = me then now() else c.opponent_popup_at end
    where c.id in (select id from public.friend_challenges
      where me in (challenger_id, opponent_id) and starts_at + interval '192 hours' <= now()
        and case when challenger_id = me then challenger_popup_at else opponent_popup_at end is null
        and case when challenger_id = me then challenger_ack_at else opponent_ack_at end is null
      order by starts_at desc, id limit 20 for update skip locked)
    returning c.*
  ) select coalesce(jsonb_agg(public.challenge_reply(claimed, me) order by starts_at desc, id), '[]'::jsonb)
    into reply from claimed;
  return jsonb_build_object('challenges', reply);
end;
$$;

create function public.challenge_history(result_filter text default 'all', page_offset integer default 0)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare me uuid := auth.uid(); reply jsonb;
begin
  if me is null then raise exception 'not signed in' using errcode = '42501'; end if;
  if result_filter not in ('all', 'win', 'loss', 'draw') or page_offset < 0 or page_offset is null then
    raise exception 'Invalid history filter';
  end if;
  with results as materialized (
    select public.challenge_reply(c, me) as item, c.starts_at, c.id
      from public.friend_challenges c where me in (c.challenger_id, c.opponent_id)
      and c.starts_at + interval '192 hours' <= now()
  ), filtered as (
    select * from results where result_filter = 'all' or item->'result'->>'outcome' = result_filter
  ), page as (
    select * from filtered order by starts_at desc, id limit 20 offset page_offset
  ) select jsonb_build_object(
    'challenges', coalesce((select jsonb_agg(item order by starts_at desc, id) from page), '[]'::jsonb),
    'has_more', (select count(*) > page_offset + 20 from filtered),
    'wins', (select count(*) from results where item->'result'->>'outcome' = 'win'),
    'losses', (select count(*) from results where item->'result'->>'outcome' = 'loss'),
    'draws', (select count(*) from results where item->'result'->>'outcome' = 'draw')
  ) into reply;
  return reply;
end;
$$;

create or replace function public.end_challenges_with_friendship()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- Final results retain only the saved score, never access to training.
  delete from public.friend_challenges c
    where least(c.challenger_id, c.opponent_id) = least(old.requester_id, old.addressee_id)
      and greatest(c.challenger_id, c.opponent_id) = greatest(old.requester_id, old.addressee_id)
      and (c.starts_at is null or c.starts_at + interval '192 hours' > now());
  return old;
end;
$$;

revoke all on function public.challenge_saved_score(uuid, public.friend_challenges) from public, anon, authenticated;
revoke all on function public.refresh_challenge_scores(uuid) from public, anon, authenticated;
revoke all on function public.challenge_training_changed() from public, anon, authenticated;
revoke all on function public.challenge_initial_scores() from public, anon, authenticated;
revoke all on function public.challenge_reply(public.friend_challenges, uuid) from public, anon, authenticated;
revoke all on function public.acknowledge_challenge(uuid) from public, anon;
revoke all on function public.claim_challenge_results() from public, anon;
revoke all on function public.challenge_history(text, integer) from public, anon;
grant execute on function public.acknowledge_challenge(uuid) to authenticated;
grant execute on function public.claim_challenge_results() to authenticated;
grant execute on function public.challenge_history(text, integer) to authenticated;
