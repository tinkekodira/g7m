-- ============================================================================
-- The friend card's best lifts. ADR-0113.
--
-- The card used to show the same three lifts for everybody — squat, bench,
-- deadlift — and a dash for anyone who does not do one of them. It now shows
-- each person's own heaviest three, with no more than two leg lifts. Which
-- three is decided on the viewer's phone (`cardLifts` in @g7m/core), where the
-- catalogue's muscles already are, so this only has to send every best.
--
-- `training_summary` gains `bests`: each exercise's best and when it was last
-- lifted, the same rows `friend_detail` already sends for head-to-head, so
-- nothing is shared that was not before. `big_three` stays, so a phone still
-- running the app from before this keeps showing its three columns.
--
-- Replaced rather than dropped, so the grants stay as they were.
-- ============================================================================

create or replace function public.training_summary(other uuid)
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
    'bests', coalesce((
      select jsonb_agg(jsonb_build_object(
               'exercise_id', b.exercise_id, 'best_kg', b.best_kg, 'last_at', b.last_at
             ) order by b.best_kg desc, b.exercise_id)
        from public.best_lifts(other) b
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
