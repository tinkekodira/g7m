import { expect, test } from '@playwright/test';
import { PASSWORD, eventually, sql, uniqueEmail } from './support/backend.js';

/**
 * A new account, from the sign-in screen to Home.
 *
 * The one path every user takes, and the one nobody re-tests by hand once
 * they have an account: sign up, answer all eight welcome questions, land on
 * Home. Then check the server, not just the screen — the answers are only
 * saved once they are in Postgres under the right user.
 */
test('a new account answers the welcome questions and lands on Home', async ({ page }) => {
  const email = uniqueEmail('signup');

  await page.goto('/');
  await page.getByRole('tab', { name: 'Create account' }).click();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Create account', exact: true }).click();

  // The profile row is made by a trigger on the server and has to sync down
  // before the app knows to ask anything — the welcome flow appearing at all
  // is proof that happened.
  await expect(page.getByRole('heading', { name: 'What should we call you?' })).toBeVisible();
  await page.getByLabel('Your name').fill('Alex');
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByRole('heading', { name: 'When were you born?' })).toBeVisible();
  await page.getByLabel('Date of birth').fill('1994-03-21');
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByRole('heading', { name: 'Your sex' })).toBeVisible();
  await page.getByRole('button', { name: 'Female' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByRole('heading', { name: 'How tall are you?' })).toBeVisible();
  await page.getByLabel('Height (cm)').fill('170');
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByRole('heading', { name: 'What do you weigh?' })).toBeVisible();
  await page.getByLabel('Weight (kg)').fill('64.5');
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByRole('heading', { name: 'How active is your week?' })).toBeVisible();
  await page.getByRole('button', { name: 'Moderately active' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByRole('heading', { name: 'Where are you from?' })).toBeVisible();
  await page.getByRole('button', { name: 'Skip' }).click();

  await expect(page.getByRole('heading', { name: 'What are you training for?' })).toBeVisible();
  await page.getByRole('button', { name: 'Get stronger' }).click();
  await page.getByRole('button', { name: 'Finish' }).click();

  // Home, greeting by name, with the tab bar.
  await expect(page.getByRole('navigation')).toBeVisible();
  await expect(page.getByText('Alex')).toBeVisible();

  // And on the server, under this user.
  const [profile] = await eventually(
    () =>
      sql<{ display_name: string; sex: string; bodyweight_kg: string; onboarded: boolean }>(
        `select p.display_name, p.sex, p.bodyweight_kg, p.onboarded_at is not null as onboarded
           from public.profiles p join auth.users u on u.id = p.user_id
          where u.email = $1`,
        [email],
      ),
    (rows) => rows[0]?.onboarded === true,
  );
  expect(profile).toMatchObject({ display_name: 'Alex', sex: 'female' });
  expect(Number(profile?.bodyweight_kg)).toBe(64.5);

  const goals = await sql<{ goal: string }>(
    `select g.goal from public.training_goals g join auth.users u on u.id = g.user_id
      where u.email = $1`,
    [email],
  );
  expect(goals.map((row) => row.goal)).toEqual(['get_stronger']);

  // A reload is a new start of the app: still signed in, and not asked again.
  await page.reload();
  await expect(page.getByRole('navigation')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'What should we call you?' })).toHaveCount(0);
});
