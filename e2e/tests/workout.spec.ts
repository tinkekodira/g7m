import { expect, test } from '@playwright/test';
import { createUser, eventually, sql } from './support/backend.js';
import { logSet, openTab, signIn, startWith } from './support/app.js';

/**
 * The hot path: a workout, logged set by set, arriving on the server.
 *
 * Everything in it is written to the device first and uploaded behind the
 * lifter's back, so the screen alone proves only half of it. The other half is
 * the rows in Postgres — the session, the exercise, the completed set with its
 * weight and reps — owned by this user and nobody else.
 */

test('a logged workout reaches the server and shows up in Progress', async ({ page }) => {
  const user = await createUser('workout', { onboarded: true, displayName: 'Sam' });
  await signIn(page, user);

  await startWith(page, 'Barbell Bench Press');
  await logSet(page, 1, '60', '8');
  await logSet(page, 2, '62.5', '6');

  await page.getByRole('button', { name: 'Finish workout' }).click();
  await expect(page.getByRole('navigation')).toBeVisible();

  // On the device: the finished workout is in Progress.
  await openTab(page, 'Progress');
  await expect(page.getByText('Recent workouts')).toBeVisible();
  await expect(page.getByRole('link', { name: /Workout/ }).first()).toBeVisible();

  // On the server: both sets, completed, owned by this user.
  const sets = await eventually(
    () =>
      sql<{ weight_kg: string; reps: number; is_completed: boolean; owner: string }>(
        `select ss.weight_kg, ss.reps, ss.is_completed, ws.user_id as owner
           from public.session_sets ss
           join public.session_exercises se on se.id = ss.session_exercise_id
           join public.workout_sessions ws on ws.id = se.session_id
          where ws.user_id = $1 and ws.ended_at is not null
          order by ss.order_key`,
        [user.id],
      ),
    (rows) => rows.length === 2 && rows.every((row) => row.is_completed),
  );
  expect(sets.map((row) => [Number(row.weight_kg), row.reps])).toEqual([
    [60, 8],
    [62.5, 6],
  ]);
});

test('a workout logged for a day that has gone lands on that day', async ({ page }) => {
  const user = await createUser('past', { onboarded: true });
  await signIn(page, user);

  // Yesterday on the calendar — which in the first days of a month means
  // stepping back a month first.
  await page.getByRole('link', { name: /Calendar/ }).click();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (yesterday.getMonth() !== new Date().getMonth()) {
    await page.getByRole('button', { name: /Previous month/ }).click();
  }
  // Days are labelled for screen readers: "Saturday 12 September, no workout".
  const title = yesterday.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  await page.getByRole('button', { name: new RegExp(`^${title},`) }).click();
  await page.getByRole('button', { name: /Log a workout for this day/ }).click();

  await expect(page.getByText('Past workout')).toBeVisible();
  await page.getByRole('link', { name: '+ Add an exercise' }).click();
  await page.getByLabel('Search').fill('Barbell Bench Press');
  await page.getByRole('button', { name: /^Barbell Bench Press/ }).click();
  await logSet(page, 1, '70', '5');
  await page.getByRole('button', { name: 'Finish workout' }).click();

  // Back on the calendar, on that day, marked as logged afterwards.
  await expect(page.getByText('Logged afterwards')).toBeVisible();

  const [session] = await eventually(
    () =>
      sql<{ source: string; day: string; same: boolean }>(
        `select source, to_char(started_at at time zone 'UTC', 'YYYY-MM-DD') as day,
                ended_at = started_at as same
           from public.workout_sessions where user_id = $1`,
        [user.id],
      ),
    (rows) => rows.length === 1 && rows[0]?.same === true,
  );
  expect(session?.source).toBe('past');
  // Noon on the day, so it is that day in any zone near this one.
  const expected = new Date(
    yesterday.getFullYear(),
    yesterday.getMonth(),
    yesterday.getDate(),
    12,
  ).toISOString();
  expect(session?.day).toBe(expected.slice(0, 10));
});
