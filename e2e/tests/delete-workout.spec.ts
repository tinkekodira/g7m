import { expect, test, type Page } from '@playwright/test';
import { createUser, eventually, sql } from './support/backend.js';
import { finishWorkout, logSet, signIn, startWith, waitForCatalogue } from './support/app.js';

/**
 * Deleting a logged workout.
 *
 * Nothing about a workout's numbers is cached anywhere: Progress, the
 * calendar, an exercise's estimated 1RM, streaks and achievements are all
 * computed fresh from `workout_sessions`/`session_exercises`/`session_sets`
 * on every read (see DECISIONS.md). So the thing worth testing is not "does
 * some cache get invalidated" — there is none — but that
 * `SessionRepository.discard` (already used to abandon an in-progress
 * workout) is reachable for a *finished* one from both places the brief asks
 * for, asks first, and that every screen reading those tables reflects the
 * deletion on its very next read.
 */

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/** Local noon, `daysAgo` calendar days back — clear of any day-boundary edge. */
function localNoon(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(12, 0, 0, 0);
  return date;
}

/** The calendar's day cell button, by the same "Thursday 10 September" title it labels itself with. */
function dayButton(page: Page, date: Date) {
  const title = `${WEEKDAYS[date.getDay()]} ${String(date.getDate())} ${MONTHS[date.getMonth()]}`;
  return page.getByRole('button', { name: new RegExp(`^${title}(,|$)`) });
}

/**
 * The estimated one-rep max tile's value.
 *
 * Waited for rather than read on sight: this is read straight after a seed
 * written directly to Postgres, and PowerSync's reply is a moment behind the
 * page load, same as every read of session data here.
 */
async function oneRepMax(page: Page, slug: string): Promise<string> {
  await page.goto(`/#/exercises/${slug}`);
  const heading = page.getByRole('heading', { name: 'Your estimated one-rep max' });
  await expect(heading).toBeVisible({ timeout: 10_000 });
  const card = page.locator('section').filter({ has: heading });
  return (await card.locator('p.numeric').first().textContent())?.trim() ?? '';
}

/** "Total workouts" from Progress, "All time" — clear of any week/month boundary. */
async function totalWorkouts(page: Page): Promise<string> {
  await page.goto('/#/progress');
  await page.getByRole('radio', { name: 'All time' }).click();
  const heading = page.getByRole('heading', { name: 'Total workouts' });
  await expect(heading).toBeVisible({ timeout: 10_000 });
  const card = page.locator('section').filter({ has: heading });
  return (await card.locator('p.numeric').first().textContent())?.trim() ?? '';
}

/** Seed one finished, completed-set session directly, the way `chart-back` does. */
async function seedSession(
  userId: string,
  startedAt: Date,
  set: { readonly weightKg: number; readonly reps: number },
  options: { readonly routineId?: string } = {},
): Promise<void> {
  const endedAt = new Date(startedAt.getTime() + 20 * 60_000);
  const completedAt = new Date(startedAt.getTime() + 10 * 60_000);
  await sql(
    `with s as (
       insert into public.workout_sessions (user_id, started_at, ended_at, source, routine_id)
       values ($1, $2, $3, $4, $5)
       returning id
     ), se as (
       insert into public.session_exercises (user_id, session_id, exercise_id, order_key)
       select $1, s.id, e.id, 'a0' from s, public.exercises e
        where e.slug = 'barbell-bench-press'
       returning id
     )
     insert into public.session_sets
       (user_id, session_exercise_id, order_key, set_type, load_type, weight_kg, reps,
        is_completed, completed_at)
     select $1, se.id, 'a0', 'working', 'external', $6, $7, true, $8
       from se`,
    [
      userId,
      startedAt.toISOString(),
      endedAt.toISOString(),
      options.routineId === undefined ? 'manual' : 'routine',
      options.routineId ?? null,
      set.weightKg,
      set.reps,
      completedAt.toISOString(),
    ],
  );
}

test('deleting a workout from its detail screen reverts Progress, the 1RM and the calendar', async ({
  page,
}) => {
  const user = await createUser('delete-detail', { onboarded: true });
  const threeDaysAgo = localNoon(3);

  // A workout three days ago, a different day from today's — the control
  // that must still be there, untouched, after today's workout is deleted.
  await seedSession(user.id, threeDaysAgo, { weightKg: 100, reps: 1 });

  await signIn(page, user);
  await waitForCatalogue(page);

  // A single rep IS the 1RM, so 100 kg for one rep reads back as exactly
  // 100 kg — no Epley rounding to argue with.
  expect(await oneRepMax(page, 'barbell-bench-press')).toBe('100 kg');
  expect(await totalWorkouts(page)).toBe('1');

  // A new PR, logged for real through the app.
  await page.goto('/#/');
  await startWith(page, 'Barbell Bench Press');
  await logSet(page, 1, '110', '1');
  await finishWorkout(page);

  expect(await oneRepMax(page, 'barbell-bench-press')).toBe('110 kg');
  expect(await totalWorkouts(page)).toBe('2');

  const [todaysSession] = await sql<{ id: string }>(
    `select id from public.workout_sessions
      where user_id = $1 and started_at >= date_trunc('day', now())`,
    [user.id],
  );
  if (todaysSession === undefined) throw new Error('The new workout never reached the server');

  await page.goto(`/#/progress/session/${todaysSession.id}`);
  // The header names what was trained, not when — a single bench set names
  // it "Push day (chest focused)"; the date is in the stats card below.
  await expect(page.getByRole('heading', { name: 'Push day (chest focused)' })).toBeVisible();

  page.on('dialog', (dialog) => void dialog.accept());
  await page.getByRole('button', { name: /Delete workout/ }).click();

  // Gone from the screen it was deleted from, without a reload.
  await expect(page).not.toHaveURL(new RegExp(todaysSession.id));

  // And everywhere else that read it: the 1RM, the totals, the calendar.
  expect(await oneRepMax(page, 'barbell-bench-press')).toBe('100 kg');
  expect(await totalWorkouts(page)).toBe('1');

  await page.goto('/#/calendar');
  await dayButton(page, new Date()).click();
  await expect(page.getByText('Nothing logged today yet.')).toBeVisible();

  // The three-days-ago workout — never touched by any of this — is still there.
  await dayButton(page, threeDaysAgo).click();
  await expect(page.getByText('100 kg × 1')).toBeVisible();

  // Deleted on the server too, not only on this device.
  await eventually(
    () =>
      sql<{ id: string }>('select id from public.workout_sessions where id = $1', [
        todaysSession.id,
      ]),
    (rows) => rows.length === 0,
  );
});

test('deleting a workout from the calendar removes its row and marker, and leaves its routine alone', async ({
  page,
}) => {
  const user = await createUser('delete-calendar', { onboarded: true });

  const [routine] = await sql<{ id: string }>(
    `insert into public.routines (user_id, name) values ($1, 'Push Day') returning id`,
    [user.id],
  );
  if (routine === undefined) throw new Error('The routine was not created');
  await sql(
    `insert into public.routine_exercises (user_id, routine_id, exercise_id, order_key)
     select $1, $2, e.id, 'a0' from public.exercises e where e.slug = 'barbell-bench-press'`,
    [user.id, routine.id],
  );

  // A finished workout sourced from that routine, logged today.
  await seedSession(user.id, localNoon(0), { weightKg: 60, reps: 8 }, { routineId: routine.id });

  await signIn(page, user);
  await page.goto('/#/calendar');
  await dayButton(page, new Date()).click();
  await expect(page.getByText('60 kg × 8')).toBeVisible();

  page.on('dialog', (dialog) => void dialog.accept());
  await page.getByRole('button', { name: 'Delete this workout' }).click();

  // The row is gone, and with the day's only workout gone, so is the marker.
  await expect(page.getByText('Nothing logged today yet.')).toBeVisible();
  await expect(dayButton(page, new Date())).toHaveAccessibleName(/no workout/);

  // The routine it came from is exactly as it was — a session delete never
  // touches the routine it references, whatever it references.
  const routineRows = await sql<{ name: string }>(
    'select name from public.routines where id = $1',
    [routine.id],
  );
  expect(routineRows).toHaveLength(1);
  expect(routineRows[0]?.name).toBe('Push Day');
  const routineExercises = await sql(
    'select 1 from public.routine_exercises where routine_id = $1',
    [routine.id],
  );
  expect(routineExercises).toHaveLength(1);
});

test('Cancel leaves the workout exactly as it was, on both screens', async ({ page }) => {
  const user = await createUser('delete-cancel', { onboarded: true });
  await seedSession(user.id, localNoon(0), { weightKg: 70, reps: 5 });
  const [session] = await sql<{ id: string }>(
    'select id from public.workout_sessions where user_id = $1',
    [user.id],
  );
  if (session === undefined) throw new Error('The workout was not created');

  await signIn(page, user);

  // Calendar: dismiss, and the row is still there.
  await page.goto('/#/calendar');
  await dayButton(page, new Date()).click();
  await expect(page.getByText('70 kg × 5')).toBeVisible();

  page.on('dialog', (dialog) => void dialog.dismiss());
  await page.getByRole('button', { name: 'Delete this workout' }).click();
  await expect(page.getByText('70 kg × 5')).toBeVisible();

  // The detail screen: dismiss, and it is still the same workout.
  await page.goto(`/#/progress/session/${session.id}`);
  await expect(page.getByText('70 kg')).toBeVisible();
  await page.getByRole('button', { name: /Delete workout/ }).click();
  await expect(page.getByText('70 kg')).toBeVisible();
  await expect(page).toHaveURL(new RegExp(session.id));

  const rows = await sql('select id from public.workout_sessions where id = $1', [session.id]);
  expect(rows).toHaveLength(1);
});
