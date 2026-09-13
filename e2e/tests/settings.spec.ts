import { expect, test } from '@playwright/test';
import { createUser, eventually, sql } from './support/backend.js';
import { openTab, signIn } from './support/app.js';

/**
 * The two choices in Settings that change how everything else looks, and that
 * have to still be chosen the next time the app opens.
 */
test('light mode stays light after the app is reopened', async ({ page }) => {
  const user = await createUser('theme', { onboarded: true });
  await signIn(page, user);
  await openTab(page, 'Settings');

  const darkMode = page.getByRole('switch', { name: /Dark mode/ });
  await expect(darkMode).toBeChecked();
  await darkMode.click();
  await expect(darkMode).not.toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await openTab(page, 'Settings');
  await expect(page.getByRole('switch', { name: /Dark mode/ })).not.toBeChecked();
});

test('pounds are remembered, on this phone and on the server', async ({ page }) => {
  const user = await createUser('units', { onboarded: true });
  await signIn(page, user);
  await openTab(page, 'Settings');

  await page.getByRole('radio', { name: 'Pounds' }).click();
  await expect(page.getByRole('radio', { name: 'Pounds' })).toBeChecked();

  // A profile setting, so it syncs: another phone would open in pounds too.
  await eventually(
    () =>
      sql<{ unit_system: string }>(`select unit_system from public.profiles where user_id = $1`, [
        user.id,
      ]),
    (rows) => rows[0]?.unit_system === 'imperial',
  );

  await page.reload();
  await openTab(page, 'Settings');
  await expect(page.getByRole('radio', { name: 'Pounds' })).toBeChecked();
});

test('every tab opens without the crash screen', async ({ page }) => {
  const user = await createUser('tabs', { onboarded: true, displayName: 'Robin' });
  await signIn(page, user);

  const headings = {
    Learn: 'Learn',
    Progress: 'Progress',
    Profile: 'Your profile',
    Settings: 'Settings',
  } as const;
  for (const [tab, heading] of Object.entries(headings)) {
    await openTab(page, tab as keyof typeof headings);
    await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible();
    await expect(page.getByText('Something went wrong on this screen')).toHaveCount(0);
  }
  await openTab(page, 'Home');
  await expect(page.getByText('Robin')).toBeVisible();
});
