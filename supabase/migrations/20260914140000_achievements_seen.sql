-- ============================================================================
-- profiles.achievements_seen — which achievements have been celebrated.
--
-- Achievements themselves are not stored anywhere. Whether one is earned, and
-- when, is worked out on the device from the training log every time it is
-- asked (@g7m/core `achievements`, ADR-0072) — so past workouts count, and a
-- mistyped set that is deleted takes its badge with it.
--
-- What does need remembering is which ones the app has already *announced*,
-- so the banner that drops in when a badge is earned plays once per badge,
-- not on every launch and not once per device. That is this column.
--
-- ## A list in a text column
--
-- The keys, comma-separated: `day-one,gym-rat,two-plate-bench`. Not a table of
-- its own, because it is one small fact about one person that is only ever read
-- and written whole, and a row per badge would be fifty rows with no meaning of
-- their own. Not `text[]` or `jsonb`, because this column is written from the
-- device, and a device writes through PowerSync as SQLite text: a JSON string
-- would arrive in a jsonb column as a JSON *string*, not an array.
--
-- Null means none celebrated yet, which is where every account starts.
--
-- The CHECK is the shape the app writes — lower-case keys, digits and
-- hyphens, joined by commas — and a generous cap on length. There are 52
-- badges averaging fifteen characters, so 4,000 is room for several times as
-- many.
-- ============================================================================

alter table public.profiles
  add column if not exists achievements_seen text;

alter table public.profiles
  drop constraint if exists profiles_achievements_seen_shape;

alter table public.profiles
  add constraint profiles_achievements_seen_shape
  check (
    achievements_seen is null
    or (
      achievements_seen ~ '^[a-z0-9-]+(,[a-z0-9-]+)*$'
      and length(achievements_seen) <= 4000
    )
  );

comment on column public.profiles.achievements_seen is
  'Comma-separated keys of the achievements already celebrated on some device. '
  'Whether one is earned is worked out from the training log, never stored. ADR-0072.';
