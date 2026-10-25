import { expect, test, type Page } from '@playwright/test';
import { createUser, eventually, sql, type TestUser } from './support/backend.js';
import { signIn, startWith, waitForCatalogue } from './support/app.js';

async function welcome(page: Page, user: TestUser) {
  await page.goto('/');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'What should we call you?' })).toBeVisible();
}

test('all signup questions fit both themes on phones and desktop', async ({ page }, info) => {
  test.setTimeout(120_000);
  const user = await createUser('signup-layout');
  await welcome(page, user);
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ['light', 'dark']) {
      await page.evaluate((value) => {
        document.documentElement.dataset['theme'] = value;
      }, theme);
      for (const [index, step] of [
        'name',
        'dob',
        'sex',
        'height',
        'weight',
        'activity',
        'country',
        'goal',
        'guidance',
      ].entries()) {
        await page.evaluate((value) => {
          location.hash = `/welcome/${value}`;
        }, step);
        await expect(page.getByRole('progressbar')).toBeVisible();
        await expect(page.getByRole('progressbar')).toHaveAttribute(
          'aria-valuenow',
          String(index + 1),
        );
        await expect(page.locator('h1')).toBeFocused();
        await expect(page.getByRole('button', { name: /^(Continue|Finish)$/ })).toBeEnabled();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        await page.screenshot({
          path: info.outputPath(`${step}-${theme}-${String(width)}.png`),
          fullPage: true,
        });
      }
    }
  }
  await page.setViewportSize({ width: 320, height: 568 });
  await page.evaluate(() => {
    location.hash = '/welcome/activity';
  });
  await page.getByRole('radio', { name: /Moderately active/ }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Where are you from?' })).toBeVisible();
});

test('multiple goals validate, survive offline navigation and reload, and remain editable', async ({
  page,
  context,
}) => {
  const user = await createUser('signup-goals');
  await welcome(page, user);
  await page.evaluate(() => {
    location.hash = '/welcome/goal';
  });
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('alert')).toHaveText('Pick what you are training for.');
  await context.setOffline(true);
  await page.getByRole('checkbox', { name: /Lose fat/ }).check();
  await page.getByRole('checkbox', { name: /Build muscle/ }).check();
  await page.getByRole('checkbox', { name: /Get stronger/ }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  for (const goal of ['Lose fat', 'Build muscle', 'Get stronger'])
    await expect(page.getByRole('checkbox', { name: new RegExp(goal) })).toBeChecked();
  await context.setOffline(false);
  await page.reload();
  // Earlier questions were deliberately left blank; resume returns to the first one.
  await expect(page.getByRole('heading', { name: 'What should we call you?' })).toBeVisible();
  await page.evaluate(() => {
    location.hash = '/welcome/goal';
  });
  for (const goal of ['Lose fat', 'Build muscle', 'Get stronger'])
    await expect(page.getByRole('checkbox', { name: new RegExp(goal) })).toBeChecked();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('radio', { name: /choose my own training/ }).check();
  await page.getByRole('button', { name: 'Finish' }).click();
  await expect(page.getByRole('navigation')).toBeVisible();
  const rows = await eventually(
    () =>
      sql<{ goal: string; selected_goals: string }>(
        'select goal, selected_goals from public.training_goals where user_id = $1',
        [user.id],
      ),
    (rows) => rows.length === 1,
  );
  expect(rows[0]?.goal).toBe('recomp');
  expect(JSON.parse(rows[0]?.selected_goals ?? 'null')).toEqual([
    'lose_fat',
    'build_muscle',
    'get_stronger',
  ]);
  await page.evaluate(() => {
    location.hash = '/goal';
  });
  await expect(page.getByRole('checkbox', { name: /Get stronger/ })).toBeChecked();
  await page.getByRole('checkbox', { name: /Lose fat/ }).uncheck();
  await page.getByRole('button', { name: 'Save goals' }).click();
  await expect(page.getByText('Build muscle, Get stronger', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('checkbox', { name: /Lose fat/ })).not.toBeChecked();
  await expect(page.getByRole('checkbox', { name: /Build muscle/ })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: /Get stronger/ })).toBeChecked();
});

for (const units of ['metric', 'imperial']) {
  test(`added bodyweight load saves, prefills and clears offline in ${units}`, async ({
    page,
    context,
  }, info) => {
    const user = await createUser(`weighted-crunch-${units}`, { onboarded: true });
    await sql('update public.profiles set unit_system = $1 where user_id = $2', [units, user.id]);
    await signIn(page, user);
    await waitForCatalogue(page);
    await startWith(page, 'Decline Ab Crunch');
    await page.getByRole('button', { name: 'Add set', exact: true }).click();
    await page.getByRole('radio', { name: 'Added weight', exact: true }).click();
    await page.getByRole('textbox', { name: /^Added/ }).fill(units === 'metric' ? '10' : '22');
    await page.getByRole('textbox', { name: 'Reps', exact: true }).fill('12');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.reload();
    await expect(page.getByRole('radio', { name: 'Added weight', exact: true })).toBeChecked();
    await expect(page.getByRole('textbox', { name: /^Added/ })).toHaveValue(
      units === 'metric' ? '10.0' : '22.0',
    );
    await page.screenshot({ path: info.outputPath(`added-weight-${units}.png`), fullPage: true });
    await context.setOffline(true);
    await page.getByRole('button', { name: 'Complete set 1', exact: true }).click();
    await page.getByRole('button', { name: 'Add set', exact: true }).click();
    await expect(page.getByRole('radio', { name: 'Added weight', exact: true })).toBeChecked();
    await expect(page.getByRole('textbox', { name: /^Added/ })).toHaveValue(
      units === 'metric' ? '10.0' : '22.0',
    );
    await page.getByRole('radio', { name: 'Bodyweight', exact: true }).click();
    await expect(page.getByRole('textbox', { name: /^Added/ })).toHaveCount(0);
    await page.getByRole('button', { name: 'Complete set 2', exact: true }).click();
    await context.setOffline(false);
    const rows = await eventually(
      () =>
        sql<{ load_type: string; weight_kg: number; reps: number }>(
          'select load_type, weight_kg::float, reps from public.session_sets where user_id = $1 and is_completed order by order_key',
          [user.id],
        ),
      (rows) => rows.length === 2,
      45_000,
    );
    expect(rows[0]?.load_type).toBe('bodyweight_plus');
    expect(Number(rows[0]?.weight_kg)).toBeCloseTo(units === 'metric' ? 10 : 9.98, 2);
    expect(rows[0]?.reps).toBe(12);
    expect(rows[1]).toMatchObject({ load_type: 'bodyweight', weight_kg: 0, reps: 12 });
  });
}
