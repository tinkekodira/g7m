-- ============================================================================
-- feedback — a message from a signed-in user to the developer.
--
-- ADR-0088. Settings needed a way for any user to reach the developer. This
-- reuses the backend that is already here rather than adding a webhook or a
-- mail service: a table shaped exactly like every other user table (id /
-- created_at / updated_at, RLS scoped to the owner), read from the Supabase
-- dashboard as the project owner rather than through any app screen.
--
-- Not synced through PowerSync. Every other user table in this schema is
-- written offline and reconciled later — the point of the whole sync layer —
-- but feedback is not workout data, there is nothing to reconcile, and the
-- app already has a pattern for a write that simply needs a connection (see
-- `DeleteAccount` in `SettingsScreen.tsx`, ADR-0065): disable the button
-- offline, explain why, and post directly through PostgREST like
-- `Account`'s own reads already do. See `UNSYNCED_TABLES` in
-- `packages/db/src/schema/app-schema.ts`.
-- ============================================================================

create table public.feedback (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,

  category     text not null check (category in ('bug', 'idea', 'other')),
  message      text not null check (char_length(message) between 1 and 2000),

  -- Auto-attached context, not asked of the user. `app_version` is the
  -- `package.json` version baked in at build time (see `__APP_VERSION__` in
  -- `apps/web/vite.config.ts`); `platform` is `detectPlatform().platform`
  -- (`web` / `ios` / `android` / `windows` / `macos`). Both nullable: a
  -- request that somehow arrives without them is still worth having.
  app_version  text,
  platform     text,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index feedback_by_user on public.feedback (user_id, created_at desc);

create trigger feedback_touch
  before update on public.feedback
  for each row execute function public.set_updated_at();

alter table public.feedback enable row level security;

-- The same owner-scoped `FOR ALL` shape every other user table gets (see
-- `body_metrics`) rather than a narrower insert-only policy: no screen in
-- the app reads or edits a submitted message, but there is no reason to
-- forbid at the database layer what nothing asks for, and it keeps this
-- table from being a one-off shape in an otherwise uniform schema. The
-- developer reads the table as the project owner, which bypasses RLS the
-- same way the Supabase dashboard always does.
create policy feedback_owner on public.feedback
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- A basic cap, not a moderation system: five submissions per account per
-- rolling hour. Enough to stop an accidental double-tap or a stuck retry
-- loop from filling the table; not an attempt to stop a determined abuser,
-- which would need more than a table trigger can offer.
create function public.enforce_feedback_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count integer;
begin
  select count(*) into recent_count
  from public.feedback
  where user_id = new.user_id
    and created_at > now() - interval '1 hour';

  if recent_count >= 5 then
    raise exception 'Too many feedback submissions. Try again later.';
  end if;

  return new;
end;
$$;

create trigger feedback_rate_limit
  before insert on public.feedback
  for each row execute function public.enforce_feedback_rate_limit();

comment on table public.feedback is
  'Messages from a signed-in user to the developer (ADR-0088). The app only '
  'ever inserts; read from the Supabase dashboard, not synced to devices.';
