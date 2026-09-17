import { expect, test } from '@playwright/test';
import { createUser, eventually, sql } from './support/backend.js';
import {
  finishWorkout,
  logSet,
  openTab,
  signIn,
  startWith,
  waitForCatalogue,
} from './support/app.js';

/**
 * The small things that make the logger bearable in a gym, and the one that
 * cleans up after it.
 *
 * A ticked set that cannot be nudged (ADR-0076), a dumbbell that steps by the
 * rack rather than by plates, the nudge to add weight when a set is too easy,
 * and a workout nobody came back to being closed at its last set (ADR-0077).
 */

test('a ticked set is locked, a dumbbell steps by the rack, and 12 reps earns a nudge', async ({
  page,
}) => {
  const user = await createUser('logger', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);
  await startWith(page, 'Lateral Raise');

  await page.getByRole('button', { name: 'Add set' }).click();

  // A dumbbell at 14 kg steps to 16, not to 16.5: no rack has a 16.5.
  const weight = page.getByRole('textbox', { name: 'Weight' }).first();
  await weight.fill('14');
  await page.getByRole('button', { name: 'Increase Weight' }).first().click();
  await expect(weight).toHaveValue('16.0');

  // And a half-kilo dumbbell stays on the half-kilo ladder: 12.5 → 15.
  await weight.fill('12.5');
  await page.getByRole('button', { name: 'Increase Weight' }).first().click();
  await expect(weight).toHaveValue('15.0');

  // The lateral raise aims at 12–20, so 20 is the top of its range.
  await page.getByRole('textbox', { name: 'Reps' }).first().fill('20');
  await page.getByRole('button', { name: 'Complete set 1' }).click();
  await expect(page.getByRole('button', { name: 'Undo set 1' })).toBeVisible();

  // Ticked: the steppers are done being useful. Tapping one used to rewrite
  // the draft of a set that was already saved.
  await expect(page.getByRole('button', { name: 'Increase Weight' }).first()).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Decrease Reps' }).first()).toBeDisabled();

  // The top of the range, so the app says what to try next — in rack steps.
  await expect(page.getByText(/20 reps at 15 kg — try 17.5 kg next time/)).toBeVisible();
});

test('a workout nobody came back to is closed at its last set, and owned up to', async ({
  page,
}) => {
  const user = await createUser('abandoned', { onboarded: true });
  // Started this morning, last set ticked two hours ago, never finished: the
  // phone was put in a bag. Two idle limits is an hour, so this is long gone.
  await sql(
    `with s as (
       insert into public.workout_sessions (user_id, started_at)
       values ($1, now() - interval '3 hours')
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
     select $1, se.id, 'a0', 'working', 'external', 60, 8, true, now() - interval '2 hours'
       from se`,
    [user.id],
  );

  await signIn(page, user);

  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toContainText('We finished your workout');
  await expect(dialog).toContainText('closed at your last set');
  await expect(dialog).toContainText('Saved: 1 exercise · 1 set');

  // Closed on the server too, at the last set rather than at now: a phone in a
  // bag is not three hours of training.
  const [row] = await eventually(
    () =>
      sql<{ minutes: string }>(
        `select extract(epoch from (now() - ended_at)) / 60 as minutes
           from public.workout_sessions where user_id = $1 and ended_at is not null`,
        [user.id],
      ),
    (rows) => rows.length === 1,
  );
  expect(Number(row?.minutes ?? 0)).toBeGreaterThan(100);

  await dialog.getByRole('button', { name: 'Okay' }).click();
  await expect(dialog).toBeHidden();

  // Said once. A reload does not bring it back.
  await page.reload();
  await expect(page.getByRole('navigation')).toBeVisible();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);

  // And the workout is in the history, with its sets.
  await openTab(page, 'Progress');
  await expect(page.getByText('Recent workouts')).toBeVisible();
});

test('the chart view outlives the app being closed', async ({ page }) => {
  const user = await createUser('chart-memory', { onboarded: true });
  await signIn(page, user);
  await startWith(page, 'Barbell Bench Press');
  await logSet(page, 1, '60', '8');
  await finishWorkout(page);
  await openTab(page, 'Progress');

  const picker = page.getByRole('button', { name: /Chart view/ });
  await picker.click();
  await page
    .getByRole('listbox', { name: 'Chart view' })
    .getByRole('option', { name: /^Sets/ })
    .click();
  await expect(picker).toContainText('Sets');

  // Opening the app fresh — no query on the address, as a Home Screen app
  // swiped out of the switcher comes back — still shows what was picked.
  await page.goto('/');
  await openTab(page, 'Progress');
  await expect(page.getByRole('button', { name: /Chart view/ })).toContainText('Sets');
});

test('earned achievements come first in their section', async ({ page }) => {
  const user = await createUser('badge-order', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);
  await startWith(page, 'Barbell Bench Press');
  await logSet(page, 1, '100', '1');
  await finishWorkout(page);

  await openTab(page, 'Profile');
  await page.getByRole('link', { name: /Achievements/ }).click();
  await expect(page.getByRole('heading', { name: 'Achievements', level: 1 })).toBeVisible();

  // The grid is read from the database, so wait for it to be there at all.
  await expect(page.locator('#badge-day-one')).toBeVisible();

  // Read the grid in the order it is drawn in.
  const order = await page
    .locator('[id^="badge-"]')
    .evaluateAll((badges) => badges.map((badge) => badge.id));
  const at = (key: string) => order.indexOf(`badge-${key}`);

  // A 100 kg single earns the first two plate clubs, so they lead the section.
  expect(at('plate-club')).toBeGreaterThanOrEqual(0);
  expect(at('plate-club')).toBeLessThan(at('three-plate-bench'));
  expect(at('two-plate-bench')).toBeLessThan(at('three-plate-bench'));
  // Then whatever is closest: 100 of the 140 kg three-plate bench, well ahead
  // of a five-plate deadlift that has not been started.
  expect(at('three-plate-bench')).toBeLessThan(at('five-plate-pull'));
  // And the same rule in the milestones: the first workout is done.
  expect(at('day-one')).toBeLessThan(at('centurion'));
});
