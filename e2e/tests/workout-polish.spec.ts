import { expect, test } from '@playwright/test';
import { createUser } from './support/backend.js';
import {
  finishWorkout,
  logSet,
  openTab,
  signIn,
  startWith,
  waitForCatalogue,
} from './support/app.js';

/**
 * Fixes from a round of testing on the phone (ADR-0107): an exercise is not
 * removed by one stray tap, last time's set says its unit and nothing stands
 * in for it the first time, and the rest timer can be set by kind of lift.
 */

test('removing an exercise asks first, and Cancel keeps it', async ({ page }) => {
  const user = await createUser('remove', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);
  await startWith(page, 'Lateral Raise');
  await logSet(page, 1, '10', '12');

  const heading = page.getByRole('heading', { name: 'Lateral Raise' });
  await page.getByRole('button', { name: 'Remove', exact: true }).click();

  const dialog = page.getByRole('alertdialog', { name: 'Remove Lateral Raise?' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('The set you logged on it goes with it.');
  // Focus starts on Cancel, so a second stray tap or an Enter keeps it.
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();

  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog).toBeHidden();
  await expect(heading).toBeVisible();

  // Confirmed, it goes — and the undo is still there behind it.
  await page.getByRole('button', { name: 'Remove', exact: true }).click();
  await dialog.getByRole('button', { name: 'Remove' }).click();
  await expect(heading).toBeHidden();
  await expect(page.getByText('Lateral Raise removed, with 1 set.')).toBeVisible();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(heading).toBeVisible();
});

test('last time reads "Last: 20kg × 8", and a first time reads nothing', async ({ page }) => {
  const user = await createUser('last-time', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);
  await startWith(page, 'Lateral Raise');

  await page.getByRole('button', { name: 'Add set' }).click();
  await expect(page.getByRole('textbox', { name: 'Weight' })).toBeVisible();
  await expect(page.getByText('First time')).toHaveCount(0);
  await expect(page.getByText(/^Last:/)).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Weight' }).fill('20');
  await page.getByRole('textbox', { name: 'Reps' }).fill('8');
  await page.getByRole('button', { name: 'Complete set 1' }).click();
  await expect(page.getByRole('button', { name: 'Undo set 1' })).toBeVisible();
  await finishWorkout(page);

  await openTab(page, 'Home');
  await startWith(page, 'Lateral Raise');
  await page.getByRole('button', { name: 'Add set' }).click();
  await expect(page.getByText('Last: 20kg × 8')).toBeVisible();
});

test('a rest time set for isolation lifts is what the timer starts at', async ({ page }) => {
  const user = await createUser('rest', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);

  await openTab(page, 'Settings');
  await page.getByRole('switch', { name: /Set my own rest times/ }).click();
  const isolation = page.getByRole('group', { name: 'Isolation lifts rest' });
  await expect(isolation).toContainText('1:30');
  // 2:15 rather than anything round, so no exercise's own default can pass for it.
  for (let press = 0; press < 3; press += 1) {
    await page.getByRole('button', { name: 'Longer rest for isolation lifts' }).click();
  }
  await expect(isolation).toContainText('2:15');

  await openTab(page, 'Home');
  await startWith(page, 'Lateral Raise');
  await logSet(page, 1, '10', '12');
  await expect(page.getByText('Resting')).toBeVisible();
  await expect(page.getByText(/^2:1[0-5]$/)).toBeVisible();
});
