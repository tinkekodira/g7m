-- ============================================================================
-- A date of birth, replacing a year of birth.
--
-- Two screens asked the same question two ways: the welcome flow asked an age
-- and the You screen asked a year. Neither is wrong, and having both is —
-- somebody who answers 26 in one place and reads 2000 in the other has to work
-- out whether the app agrees with itself.
--
-- A date settles it, and it is also the only version of this fact that can be
-- used for anything else. A year cannot wish anyone a happy birthday.
--
-- `birth_year` is NOT dropped. It holds real answers from before this column
-- existed and dropping it would destroy them for nothing — the client simply
-- stops carrying it. There is deliberately no backfill: turning 2000 into a
-- date means inventing a day, and an invented birthday is worse than no
-- birthday. Anyone who had only a year is asked again.
-- ============================================================================

alter table public.profiles
  add column if not exists birth_date date;

-- The same bounds the app enforces, so a row the client would refuse cannot be
-- written round the side. Wide enough to be a sanity check rather than a
-- policy: 13 is the floor the welcome flow states, and the upper end is a
-- typo guard.
alter table public.profiles
  drop constraint if exists profiles_birth_date_sane;

alter table public.profiles
  add constraint profiles_birth_date_sane
  check (
    birth_date is null
    or (birth_date > date '1900-01-01' and birth_date < current_date)
  );

comment on column public.profiles.birth_date is
  'Date of birth. Replaces birth_year, which is kept for the answers given before this existed and is no longer synced to devices.';
