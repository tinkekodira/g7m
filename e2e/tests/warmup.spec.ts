import { expect, test } from '@playwright/test';
import { createUser } from './support/backend.js';
import { logSet, signIn, startWith, waitForCatalogue } from './support/app.js';

/**
 * The warm-up ramp.
 *
 * `set_type = 'warmup'` has been in the schema, the partial index that keeps
 * warm-ups out of counted volume, the prefill rules and three screens'
 * rendering since the start, with no way to create one. This is the button.
 */

test('one tap ramps a heavy lift from the empty bar', async ({ page }) => {
  const user = await createUser('warmup', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);

  await startWith(page, 'Barbell Back Squat');
  await page.getByRole('button', { name: 'Add set' }).click();
  await page.getByRole('textbox', { name: 'Weight' }).first().fill('100');

  // What it is about to do, before it is pressed.
  await expect(page.getByText(/Adds 5 sets from 20 kg up to 85 kg/)).toBeVisible();
  await page.getByRole('button', { name: 'Warm-up', exact: true }).click();

  // The empty bar and four rungs, in front of the working set. A warm-up is a
  // prescription rather than a number to type, so it is a line to read.
  for (const rung of ['20 kg × 8', '40 kg × 8', '55 kg × 5', '70 kg × 3', '85 kg × 2']) {
    await expect(page.getByText(rung)).toBeVisible();
  }
  // Each rung says what to put on the bar, which is the part read at the rack.
  await expect(page.getByText('Just the 20 kg bar')).toBeVisible();

  // The working set keeps its steppers, is still 100, and is still Set 1 —
  // a ramp in front of it must not renumber it.
  await expect(page.getByRole('textbox', { name: 'Weight' })).toHaveCount(1);
  await expect(page.getByRole('textbox', { name: 'Weight' })).toHaveValue('100.0');
  await expect(page.getByRole('button', { name: 'Complete set 1' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Complete warm-up 1' })).toBeVisible();

  // Offered once: a second tap must not produce eight warm-up sets.
  await expect(page.getByRole('button', { name: 'Warm-up', exact: true })).toHaveCount(0);
});

/**
 * The failure a fixed percentage ladder produces: 40% of a light lift is
 * lighter than the bar it would be loaded onto.
 */
test('a light lift gets a short ramp, and a near-bar one gets none', async ({ page }) => {
  const user = await createUser('warmup-light', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);

  await startWith(page, 'Barbell Back Squat');
  await page.getByRole('button', { name: 'Add set' }).click();
  await page.getByRole('textbox', { name: 'Weight' }).first().fill('40');
  await expect(page.getByText(/Adds 2 sets from 20 kg up to 27.5 kg/)).toBeVisible();

  // Barely more than the empty bar: there is nothing to ramp through.
  await page.getByRole('textbox', { name: 'Weight' }).first().fill('22.5');
  await expect(page.getByRole('button', { name: 'Warm-up', exact: true })).toHaveCount(0);
});

/**
 * Warm-ups are preparation, not training. The partial index in Postgres says
 * so and every total in the app has to agree.
 */
test('warm-up sets do not count toward the workout total', async ({ page }) => {
  const user = await createUser('warmup-volume', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);

  await startWith(page, 'Barbell Back Squat');
  await logSet(page, 1, '100', '5');
  // 100 kg for 5 is 500 kg lifted, whatever is added in front of it.
  await expect(page.getByText(/500 kg lifted/)).toBeVisible();

  await page.getByRole('button', { name: 'Warm-up', exact: true }).click();

  // Tick every warm-up. The total must not move.
  for (let index = 1; index <= 5; index++) {
    await page.getByRole('button', { name: `Complete warm-up ${String(index)}` }).click();
  }
  await expect(page.getByText(/500 kg lifted/)).toBeVisible();
});

/** A percentage of "your own bodyweight" is not a weight anybody can load. */
test('a bodyweight exercise is offered no ramp', async ({ page }) => {
  const user = await createUser('warmup-bodyweight', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);

  await startWith(page, 'Pull-Up');
  await page.getByRole('button', { name: 'Add set' }).click();
  await expect(page.getByRole('button', { name: 'Warm-up', exact: true })).toHaveCount(0);
});
