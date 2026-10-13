import { expect, test } from '@playwright/test';
import { createUser } from './support/backend.js';
import { finishWorkout, logSet, signIn, startWith, waitForCatalogue } from './support/app.js';

/**
 * Home opens with the month (ADR-0120).
 *
 * Somebody who has never trained gets one card that says how to start, not
 * three charts of zeros. Once a workout is logged, the month's cards read it
 * back, today's plan sits below Quick access rather than above it, and a
 * card leads to Progress on this month.
 */
test('a first workout turns the first step into this month’s numbers', async ({ page }) => {
  const user = await createUser('home-month', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);

  await expect(
    page.getByRole('heading', { name: 'Your first workout starts the chart' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Log a workout' })).toBeVisible();

  await startWith(page, 'Barbell Bench Press');
  await logSet(page, 1, '60', '8');
  await finishWorkout(page);
  await page.goto('/#/');

  // Read from the log, so waited for: the sets reach Home a moment after it opens.
  const workouts = page.getByRole('link', { name: /^Workouts this month: 1 completed\./ });
  await expect(workouts).toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByRole('link', { name: /^Muscle groups this month: 1 set across 1 group\./ }),
  ).toBeAttached();
  await expect(
    page.getByRole('link', { name: /^Strength and activity this month: 1 workout,/ }),
  ).toBeAttached();
  await expect(page.getByRole('link', { name: /^Workout duration this month:/ })).toBeAttached();
  // The bench press was a first: a best set, not a record broken.
  await expect(
    page.getByRole('link', {
      name: /^Personal records this month: 0 new bests\. Your first bests are set\./,
    }),
  ).toBeAttached();
  await expect(
    page.getByRole('heading', { name: 'Your first workout starts the chart' }),
  ).toHaveCount(0);

  // The month first, then the ways in, then the plan.
  const quickAccess = page.getByRole('heading', { name: 'Quick access' });
  const plan = page.getByText('Today’s workout', { exact: true });
  const top = async (locator: typeof workouts): Promise<number> =>
    (await locator.boundingBox())?.y ?? Number.NaN;
  expect(await top(workouts)).toBeLessThan(await top(quickAccess));
  expect(await top(quickAccess)).toBeLessThan(await top(plan));

  await workouts.click();
  await expect(page).toHaveURL(/#\/progress\?period=month$/);
});
