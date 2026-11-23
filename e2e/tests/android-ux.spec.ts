/**
 * What the pre-Android audit found by holding a budget phone (ADR-0183).
 *
 * Each of these worked on a fast laptop and failed on the phone, or did
 * nothing where the lifter plainly asked for something.
 */
import { expect, test } from '@playwright/test';
import { createUser, sql } from './support/backend.js';
import { signIn, waitForCatalogue } from './support/app.js';

/**
 * A budget Android, by CPU. Typing "bench press" at this speed used to leave
 * "nhs" in the box: the router's transition put the old text back between
 * keys.
 */
test('the exercise search keeps every letter on a slow phone', async ({ page }) => {
  const user = await createUser('slow-search', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);
  await page.goto('/#/exercises');
  await expect(page.getByRole('link', { name: /^Barbell Bench Press/ })).toBeVisible();

  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
  const search = page.getByLabel('Search');
  await search.click();
  await page.keyboard.type('bench press', { delay: 150 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });

  await expect(search).toHaveValue('bench press');
  await expect(page).toHaveURL(/q=bench(\+|%20)press/);
  await expect(page.getByRole('link', { name: /^Barbell Bench Press/ })).toBeVisible();
});

/**
 * The picker reached with no workout running — by Back after Finish, or a
 * workout closed as abandoned — used to ignore the tap. And a new lifter's
 * first squat was prefilled at 0 kg.
 */
test('picking an exercise with no workout running starts one, at the empty bar', async ({
  page,
}) => {
  const user = await createUser('pick-starts', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);

  await page.goto('/#/exercises?add=1');
  await page.getByLabel('Search').fill('Barbell Back Squat');
  await page.getByRole('button', { name: /^Barbell Back Squat/ }).click();
  await expect(page.getByRole('heading', { name: 'Barbell Back Squat' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Finish workout' })).toBeVisible();

  await page.getByRole('button', { name: 'Add set' }).click();
  await expect(page.getByRole('textbox', { name: 'Weight' }).last()).toHaveValue('20.0');

  // Nothing ticked: Finish leaves nothing behind, here or on the server.
  await expect
    .poll(() => sql('select id from public.workout_sessions where user_id = $1', [user.id]))
    .toHaveLength(1);
  await page.getByRole('button', { name: 'Finish workout' }).click();
  await expect(page.getByRole('button', { name: /^Start a workout/ })).toBeVisible();
  await expect
    .poll(() => sql('select id from public.workout_sessions where user_id = $1', [user.id]))
    .toEqual([]);
});
