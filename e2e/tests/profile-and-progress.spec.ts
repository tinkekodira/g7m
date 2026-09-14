import { expect, test } from '@playwright/test';
import { createUser, sql } from './support/backend.js';
import { finishWorkout, logSet, openTab, signIn, startWith } from './support/app.js';

/**
 * Profile's front page and Progress's chart views (ADR-0071): where you are
 * from, with its flag; your goal, findable and changeable from the top; and a
 * chart that shows whichever view you pick, remembered like the period.
 */
test('Profile shows where you are from and a goal card that opens the goal', async ({ page }) => {
  const user = await createUser('profile', { onboarded: true, displayName: 'Ana' });
  await sql(`update public.profiles set country = 'HR' where user_id = $1`, [user.id]);
  await signIn(page, user);
  await openTab(page, 'Profile');

  await expect(page.getByText('Croatia')).toBeVisible();

  // No goal yet, so the card asks for one — and is right at the top.
  const card = page.getByRole('link', { name: /Your goal/ });
  await expect(card).toContainText('Choose what you are training for');
  await card.click();

  await expect(page.getByRole('heading', { name: 'Your goal', level: 1 })).toBeVisible();
  // Back where it was opened from, not to the You screen.
  await page.getByRole('link', { name: 'Profile' }).first().click();
  await expect(page.getByRole('heading', { name: 'Your profile' })).toBeVisible();
});

test('the Progress chart shows the view picked from its dropdown, and keeps it', async ({
  page,
}) => {
  const user = await createUser('chart', { onboarded: true });
  await signIn(page, user);
  await startWith(page, 'Barbell Bench Press');
  await logSet(page, 1, '60', '8');
  await logSet(page, 2, '60', '8');
  await finishWorkout(page);
  await openTab(page, 'Progress');

  // Weight lifted, as it always was: 2 × 60 kg × 8.
  const picker = page.getByRole('button', { name: /Chart view/ });
  await expect(picker).toContainText('Weight lifted');
  await expect(page.getByText('960 kg')).toBeVisible();

  await picker.click();
  const menu = page.getByRole('listbox', { name: 'Chart view' });
  await expect(menu.getByRole('option')).toHaveCount(6);
  await menu.getByRole('option', { name: /^Sets/ }).click();

  await expect(picker).toContainText('Sets');
  await expect(page.getByText('2 sets', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/chart=sets/);

  // Remembered through a reload, as the period is.
  await page.reload();
  await expect(page.getByRole('button', { name: /Chart view/ })).toContainText('Sets');

  // And from the keyboard: open with the arrow, move, choose.
  await page.getByRole('button', { name: /Chart view/ }).focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: /Chart view/ })).toContainText('Workouts');
  await expect(page.getByText('1 workout', { exact: true })).toBeVisible();
});
