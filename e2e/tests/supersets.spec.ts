import { expect, test, type Page } from '@playwright/test';
import { createUser, sql } from './support/backend.js';
import { finishAndKeepAsRoutine, signIn, waitForCatalogue } from './support/app.js';

/**
 * Supersets (ADR-0112): picked together in "Add an exercise", done round by
 * round with the rest after the round, and kept by a routine.
 */

/** With the Superset switch on, a tap picks rather than adds. */
async function pick(page: Page, exercise: string): Promise<void> {
  await page.getByLabel('Search').fill(exercise);
  await page.getByRole('button', { name: new RegExp(`^${exercise}`) }).click();
  await expect(
    page.getByRole('button', { name: new RegExp(`^${exercise}`), pressed: true }),
  ).toBeVisible();
}

async function startSuperset(page: Page): Promise<void> {
  await page.getByRole('link', { name: /Start your own workout/ }).click();
  await page.getByRole('button', { name: 'Start a workout' }).click();
  await page.getByRole('link', { name: '+ Add an exercise' }).click();
  await page.getByRole('switch', { name: /^Superset/ }).click();
  await pick(page, 'Barbell Curl');
  // One is not a superset, so there is nothing to confirm yet.
  await expect(page.getByRole('button', { name: /^Confirm/ })).toHaveCount(0);
  await pick(page, 'Triceps Pushdown');
  await page.getByRole('button', { name: 'Confirm (2)' }).click();
}

test('a superset is picked together and done round by round', async ({ page }) => {
  const user = await createUser('superset', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);
  await startSuperset(page);

  const superset = page.getByRole('region', { name: 'Superset' });
  await expect(superset.getByRole('heading', { name: 'Barbell Curl' })).toBeVisible();
  await expect(superset.getByRole('heading', { name: 'Triceps Pushdown' })).toBeVisible();

  // One set of each.
  await superset.getByRole('button', { name: 'Add round' }).click();
  await expect(page.getByRole('button', { name: 'Complete set 1' })).toHaveCount(2);

  // The curl: no rest, and on to the pushdown.
  await page.getByRole('button', { name: 'Complete set 1' }).first().click();
  await expect(page.getByRole('button', { name: 'Undo set 1' })).toHaveCount(1);
  await expect(page.getByText('Resting')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Complete set 1' })).toBeInViewport();

  // The pushdown finishes the round, and now the rest runs.
  await page.getByRole('button', { name: 'Complete set 1' }).click();
  await expect(page.getByRole('button', { name: 'Undo set 1' })).toHaveCount(2);
  await expect(page.getByText('Resting')).toBeVisible();

  // Ungroup keeps every set; only the grouping goes.
  await superset.getByRole('button', { name: 'Ungroup' }).click();
  await expect(page.getByRole('region', { name: 'Superset' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Barbell Curl' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Undo set 1' })).toHaveCount(2);
});

test('a workout with a superset, kept as a routine, starts with it again', async ({ page }) => {
  const user = await createUser('superset-routine', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);
  await startSuperset(page);

  const superset = page.getByRole('region', { name: 'Superset' });
  await superset.getByRole('button', { name: 'Add round' }).click();
  await page.getByRole('button', { name: 'Complete set 1' }).first().click();
  await expect(page.getByRole('button', { name: 'Undo set 1' })).toHaveCount(1);
  await page.getByRole('button', { name: 'Complete set 1' }).click();
  await expect(page.getByRole('button', { name: 'Undo set 1' })).toHaveCount(2);

  await finishAndKeepAsRoutine(page, 'Arms');
  await page.getByRole('link', { name: /^Arms/ }).click();
  await expect(page.getByRole('region', { name: 'Superset' })).toBeVisible();

  await page.getByRole('link', { name: 'Routines' }).click();
  await page.getByRole('button', { name: 'Start Arms' }).click();
  const started = page.getByRole('region', { name: 'Superset' });
  await expect(started.getByRole('heading', { name: 'Barbell Curl' })).toBeVisible();
  await expect(started.getByRole('heading', { name: 'Triceps Pushdown' })).toBeVisible();
});

test('the coach pairs exercises up when time today is short', async ({ page }) => {
  const user = await createUser('superset-plan', { onboarded: true });
  await sql(
    `insert into public.training_goals (user_id, goal, days_per_week)
     values ($1, 'build_muscle', 3)`,
    [user.id],
  );
  await signIn(page, user);
  await waitForCatalogue(page);

  await page.goto('/#/plan');
  // No limit: planned exactly as before, with no supersets.
  await expect(page.getByText(/^About \d+ min$/)).toBeVisible();
  await expect(page.getByText('Superset · rest after each round')).toHaveCount(0);

  await page.getByRole('radio', { name: '30' }).click();
  await expect(page.getByText(/^Paired up to fit 30 min/)).toBeVisible();
  await expect(page.getByText('Superset · rest after each round').first()).toBeVisible();

  await page.getByRole('button', { name: 'Start this workout' }).click();
  await expect(page.getByRole('region', { name: 'Superset' }).first()).toBeVisible();
});
