import { expect, test, type Page } from '@playwright/test';
import { createUser } from './support/backend.js';
import { signIn, waitForCatalogue } from './support/app.js';

/**
 * Starred exercises (ADR-0108): a star by the name, and first in the list,
 * filtered or not, until the star is taken away.
 *
 * Two lifts from well down the popularity order, so being first can only be
 * the star's doing: Straight-Arm Pulldown (back) and Walking Lunge (legs).
 */

/** The rows of the exercise list, top to bottom. */
function rows(page: Page) {
  return page.locator('main ul > li');
}

async function toggleFavourite(page: Page, slug: string, name: string, to: boolean) {
  await page.goto(`/#/exercises/${slug}`);
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
  const button = page.getByRole('button', { name: 'Favourite' });
  await expect(button).toHaveAttribute('aria-pressed', String(!to));
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', String(to));
}

test('a starred exercise has a star and comes first, in every list it is in', async ({ page }) => {
  const user = await createUser('favourites', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);

  // Nothing starred: the catalogue's own order, and no stars anywhere. What
  // leads Back on its own is noted, to check the order comes back after.
  await page.goto('/#/exercises?muscle=back');
  await expect(rows(page).first()).toBeVisible();
  const backLeader = (await rows(page).first().innerText()).split('\n')[0] ?? '';
  expect(backLeader).not.toBe('Straight-Arm Pulldown');
  await page.goto('/#/exercises');
  await expect(rows(page).first()).not.toContainText(/Walking Lunge|Straight-Arm Pulldown/);
  await expect(page.getByTestId('favourite-star')).toHaveCount(0);

  await toggleFavourite(page, 'walking-lunge', 'Walking Lunge', true);
  await toggleFavourite(page, 'straight-arm-pulldown', 'Straight-Arm Pulldown', true);

  // The whole list: both starred, both on top, each with its star.
  await page.goto('/#/exercises');
  await expect(page.getByTestId('favourite-star')).toHaveCount(2);
  const top = [await rows(page).nth(0).innerText(), await rows(page).nth(1).innerText()];
  expect(top.some((text) => text.startsWith('Walking Lunge'))).toBe(true);
  expect(top.some((text) => text.startsWith('Straight-Arm Pulldown'))).toBe(true);
  await expect(rows(page).nth(0).getByTestId('favourite-star')).toBeVisible();
  await expect(rows(page).nth(1).getByTestId('favourite-star')).toBeVisible();
  // Read out after the name, so a screen reader hears it too.
  await expect(page.getByRole('link', { name: /^Walking Lunge \(favourite\)/ })).toBeVisible();

  // Narrowed to Back: the pulldown leads, and the lunge is not there at all.
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(rows(page).first()).toContainText('Straight-Arm Pulldown');
  await expect(page.getByRole('link', { name: /^Walking Lunge/ })).toHaveCount(0);
  await expect(page.getByTestId('favourite-star')).toHaveCount(1);

  // A search keeps the stars on top of whatever it matched.
  await page.goto('/#/exercises?q=lunge');
  await expect(rows(page).first()).toContainText('Walking Lunge');

  // The picker inside a workout is the same list.
  await page.goto('/#/exercises?add=1&muscle=back');
  await expect(page.getByRole('heading', { level: 1, name: 'Add an exercise' })).toBeVisible();
  await expect(rows(page).first()).toContainText('Straight-Arm Pulldown');

  // Unstarred, it goes back to where it was, and loses its star.
  await toggleFavourite(page, 'straight-arm-pulldown', 'Straight-Arm Pulldown', false);
  await page.goto('/#/exercises?muscle=back');
  await expect(rows(page).first()).toContainText(backLeader);
  await expect(page.getByTestId('favourite-star')).toHaveCount(0);
});

test('a star survives a reload, because it is saved, not just shown', async ({ page }) => {
  const user = await createUser('favourites-reload', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);

  await toggleFavourite(page, 'face-pull', 'Face Pull', true);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Favourite' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.goto('/#/exercises');
  await expect(rows(page).first()).toContainText('Face Pull');
});
