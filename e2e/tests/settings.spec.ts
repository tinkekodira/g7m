import { expect, test } from '@playwright/test';
import { createUser, eventually, sql } from './support/backend.js';
import { openTab, signIn } from './support/app.js';

/**
 * The choices in Settings that change how everything else looks, and that
 * have to still be chosen the next time the app opens.
 */
test('light mode stays light after the app is reopened', async ({ page }) => {
  const user = await createUser('theme', { onboarded: true });
  await signIn(page, user);
  await openTab(page, 'Settings');

  await expect(page.getByRole('radio', { name: 'Dark' })).toBeChecked();
  await page.getByRole('radio', { name: 'Light' }).click();
  await expect(page.getByRole('radio', { name: 'Light' })).toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await openTab(page, 'Settings');
  await expect(page.getByRole('radio', { name: 'Light' })).toBeChecked();
});

/**
 * The third option, which is a standing instruction rather than a colour: the
 * theme has to follow the device, and keep following it when the device
 * changes its mind.
 */
test('the system theme follows the device, before and after it changes', async ({ page }) => {
  const user = await createUser('system-theme', { onboarded: true });
  await page.emulateMedia({ colorScheme: 'light' });
  await signIn(page, user);
  await openTab(page, 'Settings');

  await page.getByRole('radio', { name: 'System' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  // The phone switches itself at sunset. The app is supposed to come with it,
  // with nobody touching the screen.
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  // And the instruction survives a reload rather than freezing at whatever it
  // last resolved to.
  await page.emulateMedia({ colorScheme: 'light' });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await openTab(page, 'Settings');
  await expect(page.getByRole('radio', { name: 'System' })).toBeChecked();
});

/**
 * A training week starts on whatever day the training starts on.
 *
 * Wednesday rather than Sunday on purpose: the locale question has two
 * answers and this one has seven, and a midweek start is the case the setting
 * exists for — somebody whose last week went sideways and who is restarting
 * on a Wednesday. It has to reach the server, and it has to lay the calendar
 * out that way.
 */
test('a training week can start midweek, and the calendar follows', async ({ page }) => {
  const user = await createUser('week-start', { onboarded: true });
  await signIn(page, user);
  await openTab(page, 'Settings');

  await expect(page.getByRole('button', { name: 'Monday' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Wednesday' }).click();
  await expect(page.getByRole('button', { name: 'Wednesday' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await eventually(
    () =>
      sql<{ week_starts_on: number }>(
        `select week_starts_on from public.profiles where user_id = $1`,
        [user.id],
      ),
    (rows) => rows[0]?.week_starts_on === 3,
  );

  // The calendar is the visible half of the setting: its first column is the
  // day the week now starts on.
  await page.goto(`${page.url().split('#')[0] ?? ''}#/calendar`);
  await expect(page.getByText('Wed', { exact: true }).first()).toBeVisible();

  await page.reload();
  await openTab(page, 'Settings');
  await expect(page.getByRole('button', { name: 'Wednesday' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

/**
 * Rest is a pace rather than a fixed time, so the panel says what the chosen
 * one does to a compound and to an isolation — and the two have to stay
 * different, which is the whole reason it scales instead of overriding.
 */
test('the rest pace is saved, and scales rather than flattens', async ({ page }) => {
  const user = await createUser('rest-pace', { onboarded: true });
  await signIn(page, user);
  await openTab(page, 'Settings');

  // 1:00 is half the 2:00 baseline, so a 3:00 squat becomes 1:30 and a 1:00
  // curl becomes 0:30. Still different, which an override would not be.
  await page.getByRole('button', { name: '1:00', exact: true }).click();
  const pace = page.getByText(/a heavy squat rests/);
  await expect(pace).toContainText('1:30');
  await expect(pace).toContainText('0:30');

  await eventually(
    () =>
      sql<{ rest_seconds_default: number }>(
        `select rest_seconds_default from public.profiles where user_id = $1`,
        [user.id],
      ),
    (rows) => rows[0]?.rest_seconds_default === 60,
  );

  await page.reload();
  await openTab(page, 'Settings');
  await expect(page.getByText(/a heavy squat rests/)).toContainText('1:30');
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
