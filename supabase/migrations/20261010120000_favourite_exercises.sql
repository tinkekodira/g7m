-- ============================================================================
-- profiles.favourite_exercises — the exercises somebody has starred.
--
-- A starred exercise wears a star next to its name and comes first in every
-- list it appears in: the whole library, the library narrowed to one muscle
-- group or one piece of kit, the picker inside a workout, and the exercises
-- under a muscle in Learn. ADR-0108.
--
-- ## Slugs in a text column, like achievements_seen
--
-- The slugs, comma-separated: `barbell-back-squat,face-pull`. The same shape
-- as `achievements_seen` (ADR-0072) and for the same reasons: one small fact
-- about one person, always read and written whole, written from the device as
-- SQLite text. A table of its own would be a row per star with nothing else
-- in it, plus a publication entry and a bucket query to keep in step.
--
-- Slugs rather than ids, because the slug is what the app already joins art,
-- loops and URLs on, and it has survived every rename so far (ADR-0101 kept
-- `incline-barbell-press` when the name changed). A slug whose exercise has
-- gone is harmless: nothing matches it, so nothing shows a star.
--
-- On a profile rather than on the device, because a list somebody builds up
-- over months should still be there on a new phone. Rest settings stayed on
-- the device (ADR-0107); those are a preference, these are a collection.
--
-- Null means nothing starred, which is where every account starts. Removing
-- the last star writes null, never an empty string, which the CHECK refuses.
--
-- The CHECK is the shape the app writes: slugs of lower-case letters, digits
-- and hyphens, joined by commas, and a cap of 8,000 characters. The catalogue
-- has about 80 exercises with slugs averaging under twenty characters, so
-- starring every one of them fits several times over.
-- ============================================================================

alter table public.profiles
  add column if not exists favourite_exercises text;

alter table public.profiles
  drop constraint if exists profiles_favourite_exercises_shape;

alter table public.profiles
  add constraint profiles_favourite_exercises_shape
  check (
    favourite_exercises is null
    or (
      favourite_exercises ~ '^[a-z0-9-]+(,[a-z0-9-]+)*$'
      and length(favourite_exercises) <= 8000
    )
  );

comment on column public.profiles.favourite_exercises is
  'Comma-separated slugs of the exercises this person has starred. They show a '
  'star and come first in every exercise list. ADR-0108.';
