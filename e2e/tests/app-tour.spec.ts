import { expect, test, type Page } from '@playwright/test';
import { createUser, sql } from './support/backend.js';
import { openTab, signIn, signOut } from './support/app.js';

const titles = [
  'Start a workout',
  'Progress & history',
  'Exercise library',
  'Your interactive 3D body',
  'Train with friends',
] as const;

async function checkPlacement(page: Page) {
  await expect(page.locator('.app-tour-highlight')).toBeVisible();
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const card = document.querySelector('.app-tour-card')?.getBoundingClientRect();
        const highlight = document.querySelector('.app-tour-highlight')?.getBoundingClientRect();
        return (
          !!card &&
          !!highlight &&
          card.top >= 0 &&
          card.bottom <= innerHeight &&
          card.left >= 0 &&
          card.right <= innerWidth &&
          highlight.height > 0 &&
          (highlight.bottom <= card.top || highlight.top >= card.bottom)
        );
      }),
    )
    .toBe(true);
}

for (const width of [320, 393, 1280]) {
  test(`five-stop tour fits ${String(width)}px in both themes and never starts a workout`, async ({
    page,
  }, info) => {
    test.setTimeout(120_000);
    const user = await createUser('tour', { onboarded: true, displayName: 'Alex' });
    await page.setViewportSize({ width, height: width === 320 ? 568 : 852 });
    if (width !== 393) await page.emulateMedia({ reducedMotion: 'reduce' });
    await signIn(page, user);
    for (const theme of ['light', 'dark']) {
      await page.evaluate((value) => {
        document.documentElement.dataset['theme'] = value;
      }, theme);
      if (theme === 'light') {
        await page.screenshot({ path: info.outputPath('invitation.png') });
        await page.getByRole('button', { name: 'Take a quick tour' }).click();
      } else {
        await openTab(page, 'Settings');
        await page.getByRole('button', { name: 'Take app tour' }).click();
      }
      for (const [index, title] of titles.entries()) {
        const dialog = page.getByRole('dialog', { name: title, exact: true });
        await expect(dialog).toBeVisible();
        await expect(dialog.getByText(`${String(index + 1)} of 5`, { exact: true })).toBeVisible();
        await checkPlacement(page);
        if (index === 3) {
          // Let the first WebGL frame reach the compositor before visual review.
          await page.evaluate(
            () =>
              new Promise<void>((resolve) =>
                requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
              ),
          );
          await page.waitForTimeout(500);
        }
        // Keyboard focus stays inside the native modal, including after route changes.
        await page.keyboard.press('Tab');
        expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true);
        if (index === 1) {
          await dialog.getByRole('button', { name: 'Back', exact: true }).click();
          await expect(page.getByRole('dialog', { name: titles[0], exact: true })).toBeVisible();
          await page.getByRole('button', { name: 'Next', exact: true }).click();
          await checkPlacement(page);
        }
        await page.screenshot({ path: info.outputPath(`${theme}-step-${String(index + 1)}.png`) });
        await dialog
          .getByRole('button', { name: index === 4 ? 'Finish tour' : 'Next', exact: true })
          .click();
      }
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(page.locator('[data-tour-home]')).toBeFocused();
      await expect(page.getByRole('button', { name: 'Take a quick tour' })).toHaveCount(0);
    }
    expect(
      await sql('select id from public.workout_sessions where user_id = $1', [user.id]),
    ).toHaveLength(0);
    await page.reload();
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Take a quick tour' })).toHaveCount(0);
  });
}

test('dismissal is account-scoped, replay can be skipped, and interrupted tours stay closed', async ({
  page,
}) => {
  const first = await createUser('tour-dismiss', { onboarded: true });
  const second = await createUser('tour-other', { onboarded: true });
  await signIn(page, first);
  await page.getByRole('button', { name: 'Dismiss app tour invitation' }).click();
  await page.reload();
  await expect(page.getByRole('navigation')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Take a quick tour' })).toHaveCount(0);
  await openTab(page, 'Settings');
  await page.getByRole('button', { name: 'Take app tour' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Skip tour' }).click();
  await expect(page.locator('[data-tour-home]')).toBeFocused();
  await signOut(page);
  await signIn(page, second);
  await page.getByRole('button', { name: 'Take a quick tour' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('navigation')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Take a quick tour' })).toHaveCount(0);
  await openTab(page, 'Settings');
  await page.getByRole('button', { name: 'Take app tour' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-tour-home]')).toBeFocused();
});

test('cached tour can be replayed offline including the Friends stop', async ({
  page,
  context,
}) => {
  const user = await createUser('tour-offline', { onboarded: true });
  await signIn(page, user);
  await page.getByRole('button', { name: 'Take a quick tour' }).click();
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Train with friends', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Finish tour' }).click();
  await openTab(page, 'Settings');
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Take app tour' }).click();
  for (const title of titles) {
    await expect(page.getByRole('dialog', { name: title, exact: true })).toBeVisible();
    await checkPlacement(page);
    await page
      .getByRole('button', { name: title === titles[4] ? 'Finish tour' : 'Next', exact: true })
      .click();
  }
  await expect(page.locator('[data-tour-home]')).toBeFocused();
});

test('tour tolerates blocked preference storage and preserves a workout already in progress', async ({
  page,
}) => {
  const user = await createUser('tour-active', { onboarded: true });
  await page.addInitScript(() => {
    // eslint-disable-next-line @typescript-eslint/unbound-method -- Rebound with .call(this) below.
    const get = Storage.prototype.getItem;
    // eslint-disable-next-line @typescript-eslint/unbound-method -- Rebound with .call(this) below.
    const set = Storage.prototype.setItem;
    Storage.prototype.getItem = function (key) {
      if (key.startsWith('g7m.app-tour.')) throw new Error('Storage unavailable');
      return get.call(this, key);
    };
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith('g7m.app-tour.')) throw new Error('Storage unavailable');
      set.call(this, key, value);
    };
  });
  await signIn(page, user);
  await page.getByRole('button', { name: /^Start a workout/ }).click();
  await page.getByRole('button', { name: 'Start a blank workout', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Finish workout', exact: true })).toBeVisible();
  await page.goto('/#/');
  await page.getByRole('button', { name: 'Take a quick tour' }).click();
  await expect(page.getByRole('dialog', { name: 'Start a workout', exact: true })).toBeVisible();
  await checkPlacement(page);
  await page.setViewportSize({ width: 1280, height: 720 });
  await checkPlacement(page);
  await page.getByRole('button', { name: 'Skip tour' }).click();
  await expect(page.locator('[data-tour-home]')).toBeFocused();
  await openTab(page, 'Settings');
  await openTab(page, 'Home');
  await expect(page.getByRole('button', { name: 'Take a quick tour' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Continue your workout/ }).first()).toBeVisible();
  await expect
    .poll(
      async () =>
        (await sql('select id from public.workout_sessions where user_id = $1', [user.id])).length,
    )
    .toBe(1);
});
