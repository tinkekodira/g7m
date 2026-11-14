import { expect, test, type Page } from '@playwright/test';
import { createUser, sql } from './support/backend.js';
import {
  finishWorkout,
  logSet,
  signIn,
  signOut,
  startWith,
  waitForCatalogue,
} from './support/app.js';

test.use({ deviceScaleFactor: 1 });

async function seedUsage(userId: string, slug: string, count: number, daysAgo = 1) {
  for (let i = 0; i < count; i++) {
    await sql(
      `
      with workout as (
        insert into public.workout_sessions (user_id, started_at, ended_at)
        values ($1, now() - $3::int * interval '1 day', now() - $3::int * interval '1 day' + interval '40 minutes') returning id
      ), slot as (
        insert into public.session_exercises (user_id, session_id, exercise_id, order_key)
        select $1, workout.id, e.id, 'a0' from workout, public.exercises e where e.slug = $2 returning id
      )
      insert into public.session_sets (user_id, session_exercise_id, order_key, weight_kg, reps, is_completed, completed_at)
      select $1, slot.id, 'a0', 20, 8, true, now() - $3::int * interval '1 day' from slot`,
      [userId, slug, daysAgo + i],
    );
  }
}

async function openPicker(page: Page) {
  await page.getByRole('button', { name: /^Start a workout/ }).click();
  await page.getByRole('button', { name: 'Start a blank workout', exact: true }).click();
  await page.getByRole('link', { name: '+ Add an exercise' }).click();
}

const rows = (page: Page) => page.getByRole('list').getByRole('button');

test('synced usage sorts filtered pickers, preserves search relevance and superset selection', async ({
  page,
}, info) => {
  const user = await createUser('usage-synced', { onboarded: true });
  await seedUsage(user.id, 'incline-barbell-press', 3);
  await seedUsage(user.id, 'barbell-back-squat', 2);
  await seedUsage(user.id, 'barbell-bench-press', 1);
  await seedUsage(user.id, 'dumbbell-curl', 4, 100);
  await sql('update public.profiles set favourite_exercises = $2 where user_id = $1', [
    user.id,
    'dumbbell-curl',
  ]);
  await signIn(page, user);
  await waitForCatalogue(page);
  await openPicker(page);
  await expect(page.getByText('Most used first · Last 90 days', { exact: true })).toBeVisible();
  await expect(rows(page).first()).toContainText('Incline Barbell Bench Press');
  await expect(rows(page).nth(1)).toContainText('Barbell Back Squat');
  await expect(page.getByText('From your past training', { exact: true })).toBeHidden();
  for (const theme of ['dark', 'light']) {
    await page.evaluate((value) => (document.documentElement.dataset['theme'] = value), theme);
    for (const width of [320, 393, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => window.scrollTo(0, 0));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.screenshot({
        path: info.outputPath(`usage-${theme}-${String(width)}.png`),
        fullPage: false,
        animations: 'disabled',
      });
    }
  }
  await page.getByLabel('Search').fill('Barbell Bench Press');
  await expect(page.getByText('Best matches first', { exact: true })).toBeVisible();
  await expect(rows(page).first()).toContainText('Barbell Bench Press');
  await expect(rows(page).first()).not.toContainText('Incline');
  await page.getByLabel('Search').fill('');
  await page
    .getByRole('group', { name: 'Muscle filters' })
    .getByRole('button', { name: 'Quads', exact: true })
    .click();
  await expect(rows(page).first()).toContainText('Barbell Back Squat');
  await expect(rows(page).filter({ hasText: 'Incline Barbell Bench Press' })).toHaveCount(0);
  await page
    .getByRole('group', { name: 'Muscle filters' })
    .getByRole('button', { name: 'All', exact: true })
    .click();
  await page.getByRole('switch', { name: /^Superset/ }).click();
  await expect(rows(page).first()).toContainText('Incline Barbell Bench Press');
  await rows(page).first().click();
  await page.getByLabel('Search').fill('Barbell Back Squat');
  await page.getByRole('button', { name: /^Barbell Back Squat/ }).click();
  await page.getByRole('button', { name: 'Confirm (2)', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Incline Barbell Bench Press', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Barbell Back Squat', exact: true }),
  ).toBeVisible();
  // Ordinary Browse still pins the unused favourite above personally frequent exercises.
  await page.goto('/#/exercises');
  await expect(page.getByRole('list').getByRole('link').first()).toContainText('Dumbbell Curl');
  await expect(page.getByText('Most used first · Last 90 days')).toHaveCount(0);
  await page.goto('/#/exercises?routine=usage-test-routine');
  await expect(rows(page).first()).toContainText('Dumbbell Curl');
  await expect(page.getByText('Most used first · Last 90 days')).toHaveCount(0);
});

test('offline finished workouts update usage after reload and stay private across accounts', async ({
  page,
  context,
}) => {
  test.setTimeout(120_000);
  const user = await createUser('usage-offline', { onboarded: true });
  const other = await createUser('usage-other', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
    .toBe(true);
  await context.setOffline(true);
  await startWith(page, 'Dumbbell Curl');
  await logSet(page, 1, '12', '8');
  await page.getByRole('link', { name: '+ Add an exercise' }).click();
  await expect(page.getByText('Most used first · Last 90 days')).toHaveCount(0);
  await expect(rows(page).first()).not.toContainText('Dumbbell Curl');
  await page.getByRole('link', { name: 'Back', exact: true }).click();
  await finishWorkout(page);
  await openPicker(page);
  await expect(rows(page).first()).toContainText('Dumbbell Curl');
  await page.reload();
  await expect(page.getByText('Most used first · Last 90 days')).toBeVisible();
  await expect(rows(page).first()).toContainText('Dumbbell Curl');
  await context.setOffline(false);
  await signOut(page);
  await signIn(page, other);
  await waitForCatalogue(page);
  await openPicker(page);
  await expect(rows(page).first()).not.toContainText('Dumbbell Curl');
  await expect(page.getByText('Most used first · Last 90 days')).toHaveCount(0);
});
