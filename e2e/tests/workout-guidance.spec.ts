import { expect, test } from '@playwright/test';
import { createUser, eventually, sql } from './support/backend.js';
import { openTab, signIn, waitForCatalogue } from './support/app.js';

test('self-directed onboarding resumes, saves the opt-out and hides the plan', async ({
  page,
}, testInfo) => {
  const user = await createUser('self-directed');
  // A returning signup with earlier questions saved, including a training goal.
  await sql(
    `update public.profiles set display_name = 'Alex', birth_date = '1994-03-21', sex = 'female' where user_id = $1`,
    [user.id],
  );
  await sql(
    `insert into public.body_metrics (user_id, height_cm, weight_kg, activity_level) values ($1, 170, 64.5, 'moderate')`,
    [user.id],
  );
  await sql(
    `insert into public.training_goals (user_id, goal, days_per_week) values ($1, 'get_stronger', 3)`,
    [user.id],
  );
  await signInForWelcome();
  await expect(page.getByRole('heading', { name: 'Who plans your workouts?' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('radio', { name: /I’ll choose my own training/ })).toBeVisible();
  await page.getByRole('radio', { name: /I’ll choose my own training/ }).check();
  for (const theme of ['dark', 'light']) {
    await page.evaluate(
      (value) => document.documentElement.setAttribute('data-theme', value),
      theme,
    );
    for (const viewport of [
      { width: 320, height: 568 },
      { width: 1280, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.screenshot({
        path: testInfo.outputPath(`onboarding-${theme}-${String(viewport.width)}.png`),
      });
    }
  }
  await page.getByRole('button', { name: 'Finish' }).click();
  await expect(page.getByRole('navigation')).toBeVisible();
  await expect(page.getByText('Today’s workout', { exact: true })).toHaveCount(0);
  await expect(page.locator('a[href="#/plan"]')).toHaveCount(0);
  await eventually(
    () =>
      sql<{ workout_recommendations: boolean }>(
        `select workout_recommendations from public.profiles where user_id = $1`,
        [user.id],
      ),
    (rows) => rows[0]?.workout_recommendations === false,
  );
  await page.reload();
  await openTab(page, 'Settings');
  await expect(page.getByRole('switch', { name: /Workout recommendations/ })).not.toBeChecked();

  async function signInForWelcome() {
    await page.goto('/');
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill(user.password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  }
});

test('recommendations toggle offline, sync between devices and preserve manual training', async ({
  page,
  browser,
}, testInfo) => {
  const user = await createUser('guidance-setting', { onboarded: true });
  await sql(
    `insert into public.training_goals (user_id, goal, days_per_week) values ($1, 'build_muscle', 3)`,
    [user.id],
  );
  await signIn(page, user);
  await waitForCatalogue(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect(page.getByText('Today’s workout', { exact: true })).toBeVisible();
  const other = await browser.newContext();
  try {
    const otherPage = await other.newPage();
    await signIn(otherPage, user);
    await expect(otherPage.getByText('Today’s workout', { exact: true })).toBeVisible();
    await openTab(page, 'Settings');
    await page.context().setOffline(true);
    const toggle = page.getByRole('switch', { name: /Workout recommendations/ });
    await toggle.click();
    await expect(toggle).not.toBeChecked();
    await openTab(page, 'Home');
    await expect(page.getByText('Today’s workout', { exact: true })).toHaveCount(0);
    await page.goto('/#/plan');
    await expect(page).toHaveURL(/#\/$/);
    await page.reload();
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByText('Today’s workout', { exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: /^Start a workout/ }).click();
    await expect(page.getByRole('heading', { name: 'Workout', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Home', exact: true }).click();
    await expect(page.getByRole('link', { name: /^Continue your workout/ })).toBeVisible();
    await expect(page.locator('a[href="#/plan"]')).toHaveCount(0);
    await page.context().setOffline(false);
    await eventually(
      () =>
        sql<{ workout_recommendations: boolean }>(
          `select workout_recommendations from public.profiles where user_id = $1`,
          [user.id],
        ),
      (rows) => rows[0]?.workout_recommendations === false,
    );
    await expect(otherPage.getByText('Today’s workout', { exact: true })).toHaveCount(0);
    await openTab(otherPage, 'Settings');
    await expect(
      otherPage.getByRole('switch', { name: /Workout recommendations/ }),
    ).not.toBeChecked();
    await openTab(page, 'Settings');
    for (const theme of ['dark', 'light']) {
      const dark = page.getByRole('switch', { name: /Dark mode/ });
      if ((await dark.isChecked()) !== (theme === 'dark')) await dark.click();
      for (const viewport of [
        { width: 320, height: 568 },
        { width: 1280, height: 900 },
      ]) {
        await page.setViewportSize(viewport);
        await toggle.scrollIntoViewIfNeeded();
        await expect(toggle).toBeInViewport();
        // Existing segmented-control indicators animate to their resized bounds.
        await expect
          .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
          .toBe(true);
        await page.screenshot({
          path: testInfo.outputPath(`guidance-${theme}-${String(viewport.width)}.png`),
        });
      }
    }
    await toggle.focus();
    await page.keyboard.press('Space');
    await expect(toggle).toBeChecked();
    await eventually(
      () =>
        sql<{ workout_recommendations: boolean }>(
          `select workout_recommendations from public.profiles where user_id = $1`,
          [user.id],
        ),
      (rows) => rows[0]?.workout_recommendations === true,
    );
    await page.goto('/#/plan');
    await expect(
      page.getByRole('button', { name: 'Start this workout', exact: true }),
    ).toBeVisible();
    await openTab(otherPage, 'Settings');
    await expect(otherPage.getByRole('switch', { name: /Workout recommendations/ })).toBeChecked();
    const sessions = await sql<{ source: string }>(
      `select source from public.workout_sessions where user_id = $1`,
      [user.id],
    );
    expect(sessions.map((s) => s.source)).toEqual(['manual']);
  } finally {
    await other.close();
    await page.context().setOffline(false);
  }
});
