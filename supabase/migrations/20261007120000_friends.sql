-- ============================================================================
-- Friends: a code to add somebody by, a request they accept, and a live read
-- of each other's training. ADR-0105.
--
-- ## Nothing here goes through PowerSync
--
-- The sync rules' `user_data` bucket is the access control between users: it
-- sends a device the rows whose user_id is in its token, and nothing else. A
-- friend's training is by definition somebody else's rows, so it cannot ride
-- that bucket without changing what the bucket means — and a mistake there
-- publishes one person's history to another (see the top of
-- powersync/sync-rules.yaml). So neither table below is in the `powersync`
-- publication, neither is on the device (`UNSYNCED_TABLES`), and the app reads
-- a friend's training through the functions at the bottom of this file, over
-- PostgREST, with a connection. The same shape as feedback (ADR-0088) and
-- account deletion (ADR-0065).
--
-- ## Every read is a function, and every write is one too
--
-- The training tables keep the owner-only policies they have always had. No
-- "friends can read" policy is added to any of them: a policy like that is a
-- join evaluated per row on the hottest tables in the schema, and it would hand
-- a friend every column — notes, bodyweight snapshots, generation metadata —
-- when the screens need five. The functions below each check the friendship and
-- the sharing switch, then return only the fields the friend screens show.
--
-- The two new tables have no write policies at all. A request must be found by
-- code, must not be to yourself, must not duplicate one in either direction,
-- and must only be accepted by the person it was sent to — rules a policy on
-- the table cannot express without also letting a requester mark their own
-- request accepted. `security definer` functions with `auth.uid()` can.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- friend_profiles — one per account: the code, the sharing switch, and when
-- the app was last open.
--
-- Not columns on `profiles`, because `profiles` is synced. A friend code on it
-- would be writable by its owner (the owner policy is FOR ALL), the sharing
-- switch would need the sync rules redeployed, and a "last active" timestamp
-- written every few minutes would be a stream of sync traffic and a
-- last-write-wins race with every profile edit made on another device.
-- ----------------------------------------------------------------------------
create table public.friend_profiles (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null unique references auth.users (id) on delete cascade,

  -- Six characters from 31: the digits and capitals without 0, O, 1, I and L,
  -- which are the ones read aloud or copied off a screen wrongly. Upper case
  -- because that is how it is shown; input is normalised before it is looked
  -- up, so nobody has to type it that way.
  friend_code     text not null unique
                    check (friend_code ~ '^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$'),

  -- On by default: a friend has already been accepted by you before they can
  -- see anything, so the switch is for changing your mind, not for consenting.
  share_training  boolean not null default true,

  last_active_at  timestamptz,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger friend_profiles_touch
  before update on public.friend_profiles
  for each row execute function public.set_updated_at();

alter table public.friend_profiles enable row level security;

-- Read your own row. Nothing else: the code, the switch and the timestamp are
-- changed only by the functions below.
create policy friend_profiles_owner_reads on public.friend_profiles
  for select to authenticated
  using (user_id = (select auth.uid()));

comment on table public.friend_profiles is
  'Friend code, sharing switch and last-active time, one row per account (ADR-0105). '
  'Not synced; written only by the friend functions.';

-- A fresh code nobody holds yet. `random()` rather than a cryptographic
-- source: a code is not a secret, it only lets somebody ask, and the person
-- asked still has to accept.
create function public.new_friend_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  candidate text;
begin
  loop
    candidate := '';
    for position in 1..6 loop
      candidate := candidate
        || substr(alphabet, 1 + floor(random() * length(alphabet))::integer, 1);
    end loop;
    exit when not exists (
      select 1 from public.friend_profiles where friend_code = candidate
    );
  end loop;
  return candidate;
end;
$$;

-- The row for one account. The existence check above makes a collision rare;
-- this catches the one left — two accounts drawing the same code in the same
-- instant — and draws again.
create function public.create_friend_profile(target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  for attempt in 1..10 loop
    begin
      insert into public.friend_profiles (user_id, friend_code)
      values (target, public.new_friend_code())
      on conflict (user_id) do nothing;
      return;
    exception when unique_violation then
      -- Somebody took the code between the check and the insert. Draw again.
      null;
    end;
  end loop;
  raise exception 'Could not allocate a friend code for %', target;
end;
$$;

-- Every existing account gets a code now; every new one gets it at signup.
select public.create_friend_profile(id) from auth.users;

-- The signup trigger, as it was (20260907200000_profile_country.sql), plus the
-- friend profile.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed text;
begin
  claimed := upper(coalesce(new.raw_user_meta_data ->> 'country', ''));

  insert into public.profiles (user_id, display_name, country)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    ),
    case when claimed ~ '^[A-Z]{2}$' then claimed end
  )
  on conflict (user_id) do nothing;

  perform public.create_friend_profile(new.id);
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- friendships — a request, and what became of it.
--
-- One row per pair of people, whichever of them asked: the unique index on the
-- pair in sorted order is what makes a reverse duplicate impossible rather
-- than merely unlikely. A declined row is kept, so the person declined cannot
-- simply ask again (they are told they already have); the person who declined
-- can, and asking turns the row round. Removing a friend deletes the row, and
-- either of them can start again.
-- ----------------------------------------------------------------------------
create table public.friendships (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references auth.users (id) on delete cascade,
  addressee_id  uuid not null references auth.users (id) on delete cascade,
  status        text not null default 'pending'
                  check (status in ('pending', 'accepted', 'declined')),
  requested_at  timestamptz not null default now(),
  responded_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint friendships_not_yourself check (requester_id <> addressee_id),
  constraint friendships_answered_when_responded
    check ((status = 'pending') = (responded_at is null))
);

create unique index friendships_one_per_pair on public.friendships (
  least(requester_id, addressee_id),
  greatest(requester_id, addressee_id)
);

create index friendships_by_addressee on public.friendships (addressee_id, status);
create index friendships_by_requester on public.friendships (requester_id, status);

create trigger friendships_touch
  before update on public.friendships
  for each row execute function public.set_updated_at();

alter table public.friendships enable row level security;

-- Both people can see the row between them. Nobody can write it directly.
create policy friendships_participants_read on public.friendships
  for select to authenticated
  using (requester_id = (select auth.uid()) or addressee_id = (select auth.uid()));

comment on table public.friendships is
  'Friend requests and friendships, one row per pair (ADR-0105). Not synced; '
  'written only by the friend functions.';

-- The same kind of cap as feedback's: twenty requests an hour, enough for
-- anybody adding their gym, and a stop on a stuck loop or a script.
create function public.enforce_friend_request_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recent_count integer;
begin
  select count(*) into recent_count
    from public.friendships
   where requester_id = new.requester_id
     and requested_at > now() - interval '1 hour'
     and id <> new.id;

  if recent_count >= 20 then
    raise exception 'Too many friend requests. Try again later.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger friendships_rate_limit
  before insert or update of requested_at on public.friendships
  for each row execute function public.enforce_friend_request_rate_limit();

-- ----------------------------------------------------------------------------
-- Internal helpers. Not callable by anybody signed in: they take a user id as
-- an argument, which is exactly what the public functions must never do with
-- an id that decides whose data comes back.
-- ----------------------------------------------------------------------------

-- Whether `viewer` may see `other`'s training: an accepted friendship, and the
-- switch on. Every read below starts here.
create function public.shares_training_with(viewer uuid, other uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.friendships f
      join public.friend_profiles p on p.user_id = other
     where f.status = 'accepted'
       and p.share_training
       and least(f.requester_id, f.addressee_id) = least(viewer, other)
       and greatest(f.requester_id, f.addressee_id) = greatest(viewer, other)
  );
$$;

-- The heaviest weight on a completed working set, per exercise, from finished
-- workouts. External load only: a pull-up's number is added or assisted load
-- on top of a bodyweight this feature never shows, and "best" on an assisted
-- set is the wrong way round. `bestLiftsByExercise` in @g7m/core is the same
-- rule for the device's own history; a schema test holds the two together.
create function public.best_lifts(owner uuid)
returns table (exercise_id uuid, best_kg numeric, last_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select se.exercise_id, max(ss.weight_kg), max(ws.started_at)
    from public.session_sets ss
    join public.session_exercises se on se.id = ss.session_exercise_id
    join public.workout_sessions ws on ws.id = se.session_id
   where ss.user_id = owner
     and ss.is_completed
     and ss.set_type <> 'warmup'
     and ss.load_type = 'external'
     and ss.weight_kg > 0
     and ws.ended_at is not null
   group by se.exercise_id;
$$;

-- One finished workout as a list shows it: no sets, just enough to name it,
-- date it and time it.
create function public.workout_summary(w public.workout_sessions)
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
    'exercise_ids', coalesce((
      select jsonb_agg(se.exercise_id order by se.order_key, se.id)
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

-- What a friend card needs about somebody who shares: presence, their goal's
-- days per week, the days they trained over the last year (the week's dots and
-- the streak are worked out on the viewer's phone, in the viewer's timezone),
-- the big three, and the last workout.
create function public.training_summary(other uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'last_active_at', (select p.last_active_at from public.friend_profiles p where p.user_id = other),
    'days_per_week', (
      select g.days_per_week from public.training_goals g
       where g.user_id = other
       order by g.started_at desc, g.id desc
       limit 1
    ),
    'trained_at', coalesce((
      select jsonb_agg(ws.started_at order by ws.started_at desc)
        from public.workout_sessions ws
       where ws.user_id = other
         and ws.ended_at is not null
         and ws.started_at > now() - interval '371 days'
    ), '[]'::jsonb),
    'big_three', coalesce((
      select jsonb_agg(jsonb_build_object('slug', e.slug, 'best_kg', b.best_kg))
        from public.best_lifts(other) b
        join public.exercises e on e.id = b.exercise_id
       where e.slug in ('barbell-back-squat', 'barbell-bench-press', 'conventional-deadlift')
    ), '[]'::jsonb),
    'last_workout', (
      select public.workout_summary(ws)
        from public.workout_sessions ws
       where ws.user_id = other and ws.ended_at is not null
       order by ws.started_at desc, ws.id desc
       limit 1
    )
  );
$$;

-- A person as somebody else sees them: a name, and nothing about their body,
-- their email or their age.
create function public.friend_name(other uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select nullif(trim(p.display_name), '') from public.profiles p where p.user_id = other;
$$;

-- ----------------------------------------------------------------------------
-- What the app calls. Every one reads the caller from the verified token, and
-- none takes an id that decides whose data is returned without checking the
-- friendship first.
-- ----------------------------------------------------------------------------

create function public.send_friend_request(code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  wanted text := upper(regexp_replace(coalesce(code, ''), '[\s-]', '', 'g'));
  them uuid;
  existing public.friendships;
  recent_count integer;
begin
  if me is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;

  if wanted !~ '^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$' then
    return jsonb_build_object('outcome', 'invalid');
  end if;

  select p.user_id into them from public.friend_profiles p where p.friend_code = wanted;
  if them is null then
    return jsonb_build_object('outcome', 'unknown');
  end if;
  if them = me then
    return jsonb_build_object('outcome', 'own_code');
  end if;

  select * into existing
    from public.friendships f
   where least(f.requester_id, f.addressee_id) = least(me, them)
     and greatest(f.requester_id, f.addressee_id) = greatest(me, them)
   for update;

  if found then
    if existing.status = 'accepted' then
      return jsonb_build_object('outcome', 'already_friends', 'name', public.friend_name(them));
    end if;

    -- Asked before, from this side. Declined or not, it reads the same: there
    -- is nothing to do, and a decline is never announced.
    if existing.requester_id = me then
      return jsonb_build_object('outcome', 'already_requested', 'name', public.friend_name(them));
    end if;

    -- They asked first and are still waiting: asking back is a yes.
    if existing.status = 'pending' then
      update public.friendships
         set status = 'accepted', responded_at = now()
       where id = existing.id;
      return jsonb_build_object('outcome', 'now_friends', 'name', public.friend_name(them));
    end if;

    -- They asked, and this side said no; now this side is asking. The row
    -- turns round and starts again as a request from here.
    select count(*) into recent_count
      from public.friendships f
     where f.requester_id = me and f.requested_at > now() - interval '1 hour';
    if recent_count >= 20 then
      return jsonb_build_object('outcome', 'too_many');
    end if;
    update public.friendships
       set requester_id = me, addressee_id = them, status = 'pending',
           requested_at = now(), responded_at = null
     where id = existing.id;
    return jsonb_build_object('outcome', 'sent', 'name', public.friend_name(them));
  end if;

  select count(*) into recent_count
    from public.friendships f
   where f.requester_id = me and f.requested_at > now() - interval '1 hour';
  if recent_count >= 20 then
    return jsonb_build_object('outcome', 'too_many');
  end if;

  insert into public.friendships (requester_id, addressee_id) values (me, them);
  return jsonb_build_object('outcome', 'sent', 'name', public.friend_name(them));
end;
$$;

-- Only the person a request was sent to can answer it, and only once.
create function public.respond_to_friend_request(request_id uuid, accept boolean)
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

  update public.friendships
     set status = case when accept then 'accepted' else 'declined' end,
         responded_at = now()
   where id = request_id
     and addressee_id = me
     and status = 'pending';

  return jsonb_build_object('outcome', case when found then 'done' else 'not_found' end);
end;
$$;

-- Either friend can end it. The row goes, so either of them can ask again.
create function public.remove_friend(friend_id uuid)
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

  delete from public.friendships f
   where f.status = 'accepted'
     and least(f.requester_id, f.addressee_id) = least(me, friend_id)
     and greatest(f.requester_id, f.addressee_id) = greatest(me, friend_id);

  return jsonb_build_object('outcome', case when found then 'done' else 'not_found' end);
end;
$$;

create function public.set_training_sharing(enabled boolean)
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

  update public.friend_profiles set share_training = enabled where user_id = me;
  return jsonb_build_object('sharing', enabled);
end;
$$;

-- "The app is open." The phone calls this at most every few minutes; this
-- refuses anything more often than every two, so a misbehaving client cannot
-- turn presence into a write per second.
create function public.touch_last_active()
returns void
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

  update public.friend_profiles
     set last_active_at = now()
   where user_id = me
     and (last_active_at is null or last_active_at < now() - interval '2 minutes');
end;
$$;

-- Everything the Friends screen shows, in one round trip: your code and switch,
-- the requests waiting for you, and a card for each friend. A friend who has
-- turned sharing off is a name and nothing else.
create function public.friends_overview()
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
                    then jsonb_build_object('training', public.training_summary(other.id))
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

-- One friend's page: the card's summary, their best on every exercise they
-- have lifted (for the head-to-head), and their last ten workouts. Null for
-- anybody who is not a friend sharing their training.
create function public.friend_detail(friend_id uuid)
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
    'user_id', friend_id,
    'name', public.friend_name(friend_id),
    'training', public.training_summary(friend_id),
    'bests', coalesce((
      select jsonb_agg(jsonb_build_object(
               'exercise_id', b.exercise_id, 'best_kg', b.best_kg, 'last_at', b.last_at
             ) order by b.last_at desc)
        from public.best_lifts(friend_id) b
    ), '[]'::jsonb),
    'recent', coalesce((
      select jsonb_agg(public.workout_summary(ws) order by ws.started_at desc, ws.id desc)
        from public.workout_sessions ws
       where ws.id in (
         select s.id from public.workout_sessions s
          where s.user_id = friend_id and s.ended_at is not null
          order by s.started_at desc, s.id desc
          limit 10
       )
    ), '[]'::jsonb)
  );
end;
$$;

-- One of a friend's finished workouts, every exercise and every set, for
-- reading and for "Do this workout". The set's numbers only: the session's
-- bodyweight snapshot and notes stay where they are.
create function public.friend_session(friend_id uuid, session_id uuid)
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

-- ----------------------------------------------------------------------------
-- Who may call what. PUBLIC has EXECUTE on a new function by default and
-- Supabase grants it to anon as well, so everything is taken away first.
-- ----------------------------------------------------------------------------
revoke all on function public.new_friend_code() from public, anon, authenticated;
revoke all on function public.create_friend_profile(uuid) from public, anon, authenticated;
revoke all on function public.enforce_friend_request_rate_limit() from public, anon, authenticated;
revoke all on function public.shares_training_with(uuid, uuid) from public, anon, authenticated;
revoke all on function public.best_lifts(uuid) from public, anon, authenticated;
revoke all on function public.workout_summary(public.workout_sessions) from public, anon, authenticated;
revoke all on function public.training_summary(uuid) from public, anon, authenticated;
revoke all on function public.friend_name(uuid) from public, anon, authenticated;

revoke all on function public.send_friend_request(text) from public, anon;
revoke all on function public.respond_to_friend_request(uuid, boolean) from public, anon;
revoke all on function public.remove_friend(uuid) from public, anon;
revoke all on function public.set_training_sharing(boolean) from public, anon;
revoke all on function public.touch_last_active() from public, anon;
revoke all on function public.friends_overview() from public, anon;
revoke all on function public.friend_detail(uuid) from public, anon;
revoke all on function public.friend_session(uuid, uuid) from public, anon;

grant execute on function public.send_friend_request(text) to authenticated;
grant execute on function public.respond_to_friend_request(uuid, boolean) to authenticated;
grant execute on function public.remove_friend(uuid) to authenticated;
grant execute on function public.set_training_sharing(boolean) to authenticated;
grant execute on function public.touch_last_active() to authenticated;
grant execute on function public.friends_overview() to authenticated;
grant execute on function public.friend_detail(uuid) to authenticated;
grant execute on function public.friend_session(uuid, uuid) to authenticated;
