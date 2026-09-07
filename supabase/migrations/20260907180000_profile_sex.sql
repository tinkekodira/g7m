-- ============================================================================
-- profiles.sex — biological sex, for the rates the app quotes back.
--
-- On `profiles` rather than in `body_metrics`, for exactly the reason
-- `birth_year` is: it does not change, and a series of one value is a table row
-- with extra steps.
--
-- ## What it is used for, and what it must never be used for
--
-- It changes the *expectations* the app states. Muscle is gained at roughly
-- half the absolute rate in women, so "expect 0.1 to 0.3 kg a week" is honest
-- advice for one person and a setup for disappointment for another. Telling
-- somebody the real number up front is the whole point of stating a rate.
--
-- It must not change the *prescription*. Women do not need fewer sets, lighter
-- loads or shorter sessions, and any future code that reaches for this column
-- to reduce someone's training is reaching for the wrong column — the training
-- inputs are the goal, the training age and the days available, and those are
-- already there. `programming.ts` does not import it and should not start.
--
-- ## Nullable
--
-- Two values and no default. Somebody who has not answered gets the wider,
-- unqualified expectation rather than a guess, and nothing else about the app
-- changes. Making it NOT NULL would mean every existing profile needed a
-- fabricated answer at migration time, which is a worse kind of wrong than an
-- absent one.
-- ============================================================================

alter table public.profiles
  add column sex text check (sex in ('male', 'female'));

comment on column public.profiles.sex is
  'Biological sex, for stating realistic rates of gain and loss. Never an '
  'input to how much training is prescribed — see the migration header.';
