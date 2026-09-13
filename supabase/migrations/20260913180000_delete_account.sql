-- ============================================================================
-- Deleting your own account, from inside the app.
--
-- GDPR's right to erasure (Article 17), the brief's §14, and both app stores'
-- rules for any app that has accounts: somebody who wants to leave must be
-- able to, from the app, without writing to ask.
--
-- ## A database function, not an Edge Function
--
-- Deleting a user needs more than the signed-in user has: the auth tables are
-- not theirs to write. The usual answer is an Edge Function holding the
-- service role key. This is the other one — a SECURITY DEFINER function, which
-- runs with the rights of the role that created it and can do exactly one
-- thing with them: delete the row whose id is the caller's. The id comes from
-- the verified JWT (`auth.uid()`), never from an argument, so there is nothing
-- a caller can pass to reach anyone else. No key anywhere, nothing extra to
-- deploy, and it is tested against real Postgres on every pull request.
--
-- ## What goes
--
-- The `auth.users` row. Every user table references it `on delete cascade`,
-- so profiles, workouts, sets, records, weigh-ins, goals, routines and
-- equipment all go with it, in the same transaction — all of it or none. The
-- auth schema's own tables (identities, sessions, refresh tokens) cascade the
-- same way, so no session can be refreshed afterwards. PowerSync replicates
-- the deletes like any others, and the app clears the device itself.
--
-- See ADR-0065.
-- ============================================================================

-- A function that cannot do its one job should not install quietly. Supabase
-- lets the migration role delete from auth.users; if that ever stops being
-- true, fail here, where it is seen, rather than in front of somebody trying to
-- leave.
do $check$
begin
  if not has_table_privilege('auth.users', 'DELETE') then
    raise exception
      'delete_my_account() needs DELETE on auth.users, which % does not have.', current_user;
  end if;
end;
$check$;

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
-- Empty, so nothing the caller has put on their search path can stand in for
-- a table this function names. Everything below is schema-qualified.
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;

  delete from auth.users where id = me;
end;
$$;

comment on function public.delete_my_account() is
  'Deletes the calling user''s account and, by cascade, every row they own. ADR-0065.';

-- Signed-in callers only. PUBLIC has EXECUTE on a new function by default, and
-- Supabase also grants it to anon explicitly, so both are taken away.
revoke all on function public.delete_my_account() from public;
revoke all on function public.delete_my_account() from anon;
grant execute on function public.delete_my_account() to authenticated;
