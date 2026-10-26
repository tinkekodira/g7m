import { expect, test } from '@playwright/test';
import { PASSWORD, createUser, eventually, sql, uniqueEmail } from './support/backend.js';
import { signIn } from './support/app.js';

/**
 * A new account, from the sign-in screen to Home.
 *
 * The one path every user takes, and the one nobody re-tests by hand once
 * they have an account: sign up, answer the welcome questions, land on
 * Home. Then check the server, not just the screen — the answers are only
 * saved once they are in Postgres under the right user.
 */
test('a new account answers the welcome questions and lands on Home', async ({ page }, info) => {
  const email = uniqueEmail('signup');
  // Hold the first sync until the first question is visible and editable.
  // The old gate mounted Home for this entire interval.
  let releaseSync = () => undefined as void;
  const syncing = new Promise<void>((resolve) => {
    releaseSync = resolve;
  });
  await page.route('**/sync/stream*', async (route) => {
    await syncing;
    await route.continue();
  });
  await page.addInitScript(() => {
    new MutationObserver(() => {
      if (document.querySelector('nav[aria-label="Main"]') !== null) {
        document.documentElement.dataset['homeSeen'] = 'true';
      }
    }).observe(document, { childList: true, subtree: true });
  });

  await page.goto('/');
  await page.getByRole('tab', { name: 'Create account' }).click();
  await expect(page.getByRole('combobox')).toHaveCount(0);
  await expect(page.locator('form input')).toHaveCount(2);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Create account', exact: true }).click();

  // Registration opens onboarding without waiting for the profile to sync.
  await expect(page.getByRole('heading', { name: 'What should we call you?' })).toBeVisible();
  await page.getByLabel('Your name').fill('Alex');
  await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();
  await expect(page.getByRole('status')).toHaveText('Setting up your account…');
  // Enter must not advance either: an UPDATE with no local profile is a no-op.
  await page.getByLabel('Your name').press('Enter');
  await expect(page).toHaveURL(/\/welcome\/name$/);
  await expect(page.getByRole('navigation')).toHaveCount(0);
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ['light', 'dark']) {
      await page.evaluate((value) => {
        document.documentElement.dataset['theme'] = value;
      }, theme);
      await page.screenshot({
        path: info.outputPath(`first-question-${theme}-${String(width)}.png`),
      });
    }
  }
  releaseSync();
  await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled();
  await expect(page.getByLabel('Your name')).toHaveValue('Alex');
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByRole('heading', { name: 'When were you born?' })).toBeVisible();
  await page.getByLabel('Date of birth').fill('1994-03-21');
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByRole('heading', { name: 'Your sex' })).toBeVisible();
  await page.getByRole('radio', { name: 'Female' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByRole('heading', { name: 'How tall are you?' })).toBeVisible();
  await page.getByLabel('Height (cm)').fill('170');
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByRole('heading', { name: 'What do you weigh?' })).toBeVisible();
  await page.getByLabel('Weight (kg)').fill('64.5');
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByRole('heading', { name: 'How active is your week?' })).toBeVisible();
  await page.getByRole('radio', { name: /Moderately active/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByRole('heading', { name: 'Where are you from?' })).toBeVisible();
  await page.getByRole('button', { name: 'Skip' }).click();

  await expect(page.getByRole('heading', { name: 'What are you training for?' })).toBeVisible();
  await page.getByRole('checkbox', { name: /Get stronger/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByRole('heading', { name: 'Who plans your workouts?' })).toBeVisible();
  await expect(page.locator('html')).not.toHaveAttribute('data-home-seen', 'true');
  await page.getByRole('button', { name: 'Finish' }).click();
  await expect(page.getByRole('alert')).toHaveText('Choose how you want to plan your training.');
  await page.getByRole('radio', { name: /Suggest workouts for me/ }).check();
  await page.getByRole('button', { name: 'Finish' }).click();

  // Home, greeting by name, with the tab bar.
  await expect(page.getByRole('navigation')).toBeVisible();
  await expect(page.getByText('Alex')).toBeVisible();

  // And on the server, under this user.
  const [profile] = await eventually(
    () =>
      sql<{
        display_name: string;
        sex: string;
        bodyweight_kg: string;
        onboarded: boolean;
        workout_recommendations: boolean;
      }>(
        `select p.display_name, p.sex, p.bodyweight_kg, p.workout_recommendations, p.onboarded_at is not null as onboarded
           from public.profiles p join auth.users u on u.id = p.user_id
          where u.email = $1`,
        [email],
      ),
    (rows) => rows[0]?.onboarded === true,
  );
  expect(profile).toMatchObject({
    display_name: 'Alex',
    sex: 'female',
    workout_recommendations: true,
  });
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

test('an unresolved profile cannot open Home or restart onboarding for a returning user', async ({
  page,
}, info) => {
  const user = await createUser('profile-pending', { onboarded: true });
  let releaseSync = () => undefined as void;
  const syncing = new Promise<void>((resolve) => {
    releaseSync = resolve;
  });
  await page.route('**/sync/stream*', async (route) => {
    await syncing;
    await route.continue();
  });

  await page.goto('/');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Getting your account ready' })).toBeVisible();
  await expect(page.getByRole('navigation')).toHaveCount(0);
  await expect(page.getByLabel('Your name')).toHaveCount(0);
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ['light', 'dark']) {
      await page.evaluate((value) => {
        document.documentElement.dataset['theme'] = value;
      }, theme);
      await page.screenshot({
        path: info.outputPath(`pending-profile-${theme}-${String(width)}.png`),
      });
    }
  }
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { name: 'Getting your account ready' })).toBeVisible();
  releaseSync();
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
  await expect(page.getByLabel('Your name')).toHaveCount(0);
});

test('a failed registration stays on the email and password form', async ({ page }) => {
  const user = await createUser('signup-duplicate', { onboarded: true });
  await page.goto('/');
  await page.getByRole('tab', { name: 'Create account' }).click();
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText(
    'That email already has an account. Sign in instead.',
  );
  await expect(page.getByRole('navigation')).toHaveCount(0);
  await expect(page.getByLabel('Your name')).toHaveCount(0);
  await page.getByRole('tab', { name: 'Sign in', exact: true }).click();
  await signIn(page, user);
});
