import { expect, test } from '@playwright/test';
import { createUser, sql } from './support/backend.js';
import { finishWorkout, logSet, openTab, signIn, startWith } from './support/app.js';

/**
 * Profile's front page and Progress's chart views (ADR-0071): where you are
 * from, with its flag; your goal, findable and changeable from the top; and a
 * chart that shows whichever view you pick, remembered like the period.
 */
test('Profile shows where you are from and a goal card that opens the goal', async ({ page }) => {
  const user = await createUser('profile', { onboarded: true, displayName: 'Ana' });
  await sql(`update public.profiles set country = 'HR' where user_id = $1`, [user.id]);
  await signIn(page, user);
  await openTab(page, 'Profile');

  await expect(page.getByText('Croatia')).toBeVisible();

  // No goal yet, so the card asks for one — and is right at the top.
  const card = page.getByRole('link', { name: /Your goal/ });
  await expect(card).toContainText('Choose what you are training for');
  await card.click();

  await expect(page.getByRole('heading', { name: 'Your goal', level: 1 })).toBeVisible();
  // Back where it was opened from, not to the You screen.
  await page.getByRole('link', { name: 'Profile' }).first().click();
  await expect(page.getByRole('heading', { name: 'Your profile' })).toBeVisible();
});

test('the Progress chart shows the view picked from its dropdown, and keeps it', async ({
  page,
}) => {
  const user = await createUser('chart', { onboarded: true });
  await signIn(page, user);
  await startWith(page, 'Barbell Bench Press');
  await logSet(page, 1, '60', '8');
  await logSet(page, 2, '60', '8');
  await finishWorkout(page);
  await openTab(page, 'Progress');

  // Weight lifted, as it always was: 2 × 60 kg × 8.
  const picker = page.getByRole('button', { name: /Chart view/ });
  await expect(picker).toContainText('Weight lifted');
  await expect(page.getByText('960 kg')).toBeVisible();

  await picker.click();
  const menu = page.getByRole('listbox', { name: 'Chart view' });
  await expect(menu.getByRole('option')).toHaveCount(6);
  await menu.getByRole('option', { name: /^Sets/ }).click();

  await expect(picker).toContainText('Sets');
  await expect(page.getByText('2 sets', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/chart=sets/);

  // Remembered through a reload, as the period is.
  await page.reload();
  await expect(page.getByRole('button', { name: /Chart view/ })).toContainText('Sets');

  // And from the keyboard: open with the arrow, move, choose.
  await page.getByRole('button', { name: /Chart view/ }).focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: /Chart view/ })).toContainText('Workouts');
  await expect(page.getByText('1 workout', { exact: true })).toBeVisible();
});

test('the chart steps back through weeks with its arrows, or a swipe, and stays there', async ({
  page,
}) => {
  const user = await createUser('chart-back', { onboarded: true });
  // A workout a week ago today, at midday: always last week, whatever the
  // weekday, and far from midnight in any time zone the tests run in.
  await sql(
    `with s as (
       insert into public.workout_sessions (user_id, started_at, ended_at)
       values ($1, date_trunc('day', now()) - interval '7 days' + interval '12 hours',
                   date_trunc('day', now()) - interval '7 days' + interval '13 hours')
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
     select $1, se.id, 'a0', 'working', 'external', 60, 8, true,
            date_trunc('day', now()) - interval '7 days' + interval '12 hours 30 minutes'
       from se`,
    [user.id],
  );
  await signIn(page, user);
  await openTab(page, 'Progress');

  // This week: nothing yet, and nowhere later to go.
  await expect(page.getByText('This week', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next week' })).toBeDisabled();

  await page.getByRole('button', { name: 'Previous week' }).click();
  await expect(page.getByText('Last week', { exact: true })).toBeVisible();
  await expect(page.getByText('480 kg')).toBeVisible();
  await expect(page).toHaveURL(/back=1/);
  // The first workout is last week, so the arrows stop there.
  await expect(page.getByRole('button', { name: 'Previous week' })).toBeDisabled();

  // Kept through a reload, like the period and the view.
  await page.reload();
  await expect(page.getByText('Last week', { exact: true })).toBeVisible();

  // Back to now, then earlier again with a swipe across the chart.
  await page.getByRole('button', { name: 'Next week' }).click();
  await expect(page.getByText('This week', { exact: true })).toBeVisible();
  const chart = page.getByRole('img', { name: /by day/ });
  const box = await chart.boundingBox();
  if (box === null) throw new Error('The chart has no box');
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + 40, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 40, y, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByText('Last week', { exact: true })).toBeVisible();

  // A new period starts from now.
  await page.getByRole('radio', { name: 'Monthly' }).click();
  await expect(page.getByText('This month', { exact: true })).toBeVisible();
  await expect(page).not.toHaveURL(/back=/);
});
