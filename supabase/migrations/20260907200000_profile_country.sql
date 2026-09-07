-- ============================================================================
-- profiles.country — where the user is from, so the app can say hello in their
-- own language.
--
-- On `profiles` next to `sex` and `birth_year`, for the same reason: it does
-- not change, and a series of one value is a table row with extra steps.
--
-- ## An ISO code, not a name
--
-- Two letters, ISO 3166-1 alpha-2, upper case. Storing "Germany" would tie the
-- row to the language the picker happened to be in, and a name is not a key —
-- the same country is Germany, Deutschland, Allemagne and Njemačka depending
-- on who is asking. The code is the same everywhere, and the display name is
-- looked up from it at render time with `Intl.DisplayNames`, which every
-- target platform ships.
--
-- ## What it is used for
--
-- One greeting on the home screen. Nothing else reads it, nothing is
-- prescribed from it, and no content is regionalised by it — this is not a
-- locale setting and must not quietly become one. If real localisation ever
-- arrives it will need a *language* column, because a country is not a
-- language: Switzerland has four and Belgium has three, and picking one of
-- them for somebody is a guess that is fine for a greeting and wrong for
-- anything with meaning in it.
--
-- Nullable, with no default. Somebody who skips the question gets "Welcome",
-- which is what they would have got anyway.
-- ============================================================================

alter table public.profiles
  add column country text check (country ~ '^[A-Z]{2}$');

comment on column public.profiles.country is
  'ISO 3166-1 alpha-2, upper case. Used for the greeting on the home screen '
  'and nothing else. Not a locale setting — see the migration header.';

-- ----------------------------------------------------------------------------
-- The signup trigger carries it through.
--
-- The country is asked for on the create-account form, and the profile row is
-- created by this trigger rather than by the app — so the answer has to travel
-- as auth metadata and be copied here. The alternative is for the client to
-- write it afterwards, which races the row's own arrival: the trigger runs on
-- the server, the row syncs down some milliseconds later, and an UPDATE issued
-- before it lands updates nothing at all and reports success.
--
-- Validated here as well as on the column, because metadata is whatever the
-- client put there and this function is `security definer`. A malformed code
-- becomes null rather than failing the signup — nobody should be unable to
-- create an account because a country picker misbehaved.
-- ----------------------------------------------------------------------------
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
  return new;
end;
$$;
