-- ============================================================================
-- A workout logged after it happened.
--
-- The calendar can now log a workout on a day that has gone — the one somebody
-- forgot to record. It is a session like any other, started on that day, with
-- one difference the app has to know about: nothing about it is live. There is
-- no clock to run, no rest to time, no "still training?" to ask, and the times
-- its sets are ticked are the time of typing, not of lifting.
--
-- That difference is a fact about where the session came from, which is what
-- `source` records — so it is a fourth value there rather than a new column,
-- and nothing about syncing changes. A date alone could not carry it: a live
-- workout started at 23:50 would turn into a past one at midnight.
--
-- Run this before deploying the app that writes it. A 'past' session uploaded
-- to a database that does not allow it is refused, and a refused upload is
-- discarded, not retried. See ADR-0061.
-- ============================================================================

alter table public.workout_sessions
  drop constraint workout_sessions_source_check;

alter table public.workout_sessions
  add constraint workout_sessions_source_check
    check (source in ('manual', 'generated', 'routine', 'past'));
