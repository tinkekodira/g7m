import { devices, expect, test } from '@playwright/test';
import { createUser, eventually, sql } from './support/backend.js';
import { finishWorkout, logSet, openTab, signIn, startWith } from './support/app.js';
import { APP_URL } from './support/urls.js';

test.use({ deviceScaleFactor: 1 });

test('live workout status starts, respects privacy, clears on finish and expires locally', async ({
  page,
  browser,
}) => {
  test.setTimeout(150_000);
  const alex = await createUser('presence-alex', { onboarded: true, displayName: 'Alex' });
  const blake = await createUser('presence-blake', { onboarded: true, displayName: 'Blake' });
  await sql(
    `insert into public.friendships (requester_id, addressee_id, status, responded_at) values ($1, $2, 'accepted', now())`,
    [alex.id, blake.id],
  );
  const phone = await browser.newContext({ ...devices['Pixel 7'], baseURL: APP_URL });
  try {
    const lifter = await phone.newPage();
    await signIn(lifter, blake);
    await startWith(lifter, 'Barbell Bench Press');
    await logSet(lifter, 1, '60', '5');
    const read = () =>
      sql<{ workout_active_until: string | null }>(
        `select workout_active_until from public.friend_profiles where user_id = $1`,
        [blake.id],
      );
    await eventually(read, (rows) => rows[0]?.workout_active_until != null);

    await signIn(page, alex);
    await openTab(page, 'Friends');
    const card = page.locator('article', {
      has: page.getByRole('link', { name: 'Blake', exact: true }),
    });
    await expect(card.getByText('Working out', { exact: true })).toBeVisible();

    await lifter.getByRole('link', { name: 'Home', exact: true }).first().click();
    await openTab(lifter, 'Friends');
    const sharing = lifter.getByRole('switch', { name: /Share my workout status/ });
    await expect(sharing).toBeChecked();
    await sharing.click();
    await expect(sharing).not.toBeChecked();
    await page.reload();
    await expect(card.getByText('Working out', { exact: true })).toHaveCount(0);
    await expect(card.getByRole('heading', { name: 'Blake' })).toBeVisible();
    await sharing.click();
    await expect(sharing).toBeChecked();
    await eventually(read, (rows) => rows[0]?.workout_active_until != null);
    // Observe the actual 30-second refresh, without reloading the viewer.
    await expect(card.getByText('Working out', { exact: true })).toBeVisible({ timeout: 40_000 });

    await openTab(lifter, 'Home');
    await lifter.getByRole('link', { name: /In progress/ }).click();
    await finishWorkout(lifter);
    await eventually(read, (rows) => rows[0]?.workout_active_until === null);
    await page.reload();
    await expect(card.getByText('Working out', { exact: true })).toHaveCount(0);

    // Even an unreachable endpoint cannot keep a once-received lease alive.
    await sql(
      `update public.friend_profiles set workout_active_until = now() + interval '4 seconds' where user_id = $1`,
      [blake.id],
    );
    await page.reload();
    await expect(card.getByText('Working out', { exact: true })).toBeVisible();
    await page.route('**/rest/v1/rpc/friends_workout_presence', (route) => route.abort());
    await expect(card.getByText('Working out', { exact: true })).toHaveCount(0, {
      timeout: 15_000,
    });
  } finally {
    await phone.close();
  }
});

for (const theme of ['dark', 'light'] as const) {
  for (const width of [360, 1280]) {
    test(`workout badge layout: ${theme}, ${String(width)}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.addInitScript((value) => localStorage.setItem('g7m.theme', value), theme);
      const viewer = await createUser('badge-viewer', { onboarded: true, displayName: 'Alex' });
      const friend = await createUser('badge-friend', {
        onboarded: true,
        displayName: 'Matej Majsec with a very long name',
      });
      await sql(
        `insert into public.friendships (requester_id, addressee_id, status, responded_at) values ($1, $2, 'accepted', now())`,
        [viewer.id, friend.id],
      );
      await sql(
        `update public.friend_profiles set workout_active_until = now() + interval '5 minutes', xp = 6000 where user_id = $1`,
        [friend.id],
      );
      await signIn(page, viewer);
      await openTab(page, 'Friends');
      const badge = page.getByText('Working out', { exact: true });
      await expect(badge).toBeVisible();
      await expect(badge).toHaveCSS('animation-name', 'workout-status-breathe');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const card = page.locator('article').filter({ has: badge });
      const bounds = await card.boundingBox();
      const labelBounds = await badge.boundingBox();
      expect(labelBounds!.x + labelBounds!.width).toBeLessThanOrEqual(bounds!.x + bounds!.width);
      await page.screenshot({
        path: testInfo.outputPath(`workout-status-${theme}-${String(width)}.png`),
      });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect(badge).toHaveCSS('animation-name', 'none');
      // A failed privacy change leaves the saved preference intact and explains it.
      await page.route('**/rest/v1/rpc/set_workout_status_sharing', (route) => route.abort());
      const sharing = page.getByRole('switch', { name: /Share my workout status/ });
      await sharing.click();
      await expect(page.getByRole('alert')).toBeVisible();
      await expect(sharing).toBeChecked();
    });
  }
}
