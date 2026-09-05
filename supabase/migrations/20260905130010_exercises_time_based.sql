-- ============================================================================
-- Time-based exercises.
--
-- Found while seeding, which is what seeding is for. A plank and a farmer carry
-- are prescribed in seconds, not repetitions, but `default_rep_low` /
-- `default_rep_high` and `session_sets.reps` have nowhere to say so. Writing 60
-- into a reps column and hoping the UI renders "60s" is the kind of silent
-- overload that produces a personal record of "60 reps of plank" and a volume
-- calculation that is nonsense.
--
-- One boolean is enough. The logger renders a timer instead of a rep stepper,
-- the 1RM estimate is skipped (it is meaningless for a hold), and volume
-- attribution treats the set as time under tension rather than reps x weight.
-- ============================================================================

alter table public.exercises
  add column is_time_based boolean not null default false;

comment on column public.exercises.is_time_based is
  'When true, default_rep_low/high and session_sets.reps are SECONDS, not '
  'repetitions. Set for holds and carries. The logger shows a timer, and 1RM '
  'estimation is skipped.';
