import { expect, test, type Locator } from '@playwright/test';
import { createUser } from './support/backend.js';
import { signIn, waitForCatalogue } from './support/app.js';

const gradient = (element: Locator) =>
  element.evaluate((node) => getComputedStyle(node).backgroundImage);

async function expectInside(button: Locator, track: Locator): Promise<void> {
  await expect
    .poll(async () => {
      const target = await button.boundingBox();
      const bounds = await track.boundingBox();
      if (target === null || bounds === null) return false;
      return target.x >= bounds.x && target.x + target.width <= bounds.x + bounds.width;
    })
    .toBe(true);
}

for (const theme of ['dark', 'light'] as const) {
  for (const width of [360, 1280]) {
    test(`Browse colors and sticky rail: ${theme}, ${String(width)}px`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript((value) => localStorage.setItem('g7m.theme', value), theme);
      const user = await createUser('browse-colors', { onboarded: true });
      await signIn(page, user);
      await waitForCatalogue(page);
      await page.goto('/#/exercises');

      const rail = page.getByRole('group', { name: 'Muscle filters' });
      const track = rail.locator(':scope > div');
      const all = rail.getByRole('button', { name: 'All', exact: true });
      const chest = rail.getByRole('button', { name: 'Chest', exact: true });
      const neck = rail.getByRole('button', { name: 'Neck', exact: true });
      const bench = page.getByRole('link', { name: /^Barbell Bench Press/ });
      await expect(rail.getByRole('button')).toHaveCount(16);
      await expect(all).toHaveAttribute('aria-pressed', 'true');
      expect(await gradient(bench)).toBe(await gradient(chest));
      expect(await gradient(bench)).not.toBe(await gradient(all));
      expect(
        await bench.evaluate((node) =>
          getComputedStyle(node).getPropertyValue('--muscle-wash-strength').trim(),
        ),
      ).toBe(theme === 'dark' ? '8%' : '6%');
      const targets = await rail
        .getByRole('button')
        .evaluateAll((buttons) =>
          buttons.every((button) => button.clientWidth >= 46 && button.clientHeight >= 46),
        );
      expect(targets).toBe(true); // Inner boxes exclude each target's 1px borders.
      await expect(rail.locator('.muscle-filter-fade-start')).toHaveCount(0);
      await expect(rail.locator('.muscle-filter-fade-end')).toHaveCount(1);
      await page.screenshot({ path: testInfo.outputPath('browse.png') });

      await page.evaluate(() => window.scrollTo(0, 600));
      await expect.poll(async () => (await rail.boundingBox())?.y).toBeCloseTo(8, 0);
      await page.screenshot({ path: testInfo.outputPath('browse-sticky.png') });
      const scrollY = await page.evaluate(() => window.scrollY);
      await neck.evaluate((button: HTMLButtonElement) => button.focus({ preventScroll: true }));
      await expectInside(neck, track);
      expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);
      await expect(rail.locator('.muscle-filter-fade-start')).toHaveCount(1);
      await expect(rail.locator('.muscle-filter-fade-end')).toHaveCount(0);
      await page.keyboard.press('Shift+Tab');
      await expect(rail.getByRole('button', { name: 'Traps', exact: true })).toBeFocused();
      const focused = rail.getByRole('button', { name: 'Traps', exact: true });
      expect(await focused.evaluate((node) => getComputedStyle(node).outlineStyle)).toBe('solid');
      await expectInside(focused, track);
      await all.evaluate((button: HTMLButtonElement) => button.focus({ preventScroll: true }));
      await expectInside(all, track);
      expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);
      await expect(rail.locator('.muscle-filter-fade-start')).toHaveCount(0);
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
        .toBe(true);

      // URL changes and reloads must reveal a choice at the far end of the rail.
      await page.goto('/#/exercises?muscle=calves');
      const calves = rail.getByRole('button', { name: 'Calves', exact: true });
      await expect(calves).toHaveAttribute('aria-pressed', 'true');
      await expectInside(calves, track);
      await page.reload();
      await expect(calves).toHaveAttribute('aria-pressed', 'true');
      await expectInside(calves, track);
      await page.setViewportSize({ width: width === 360 ? 1280 : 360, height: 900 });
      await expectInside(calves, track);
      await calves.focus();
      await page.keyboard.press('Enter');
      await expect(all).toHaveAttribute('aria-pressed', 'true');
      await expect(page).not.toHaveURL(/muscle=/);
    });
  }
}

test('dominant muscle tint survives supporting-muscle filters, search and offline browsing', async ({
  page,
  context,
}) => {
  const user = await createUser('browse-filter', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);
  await page.goto('/#/exercises');
  const rail = page.getByRole('group', { name: 'Muscle filters' });
  const bench = page.getByRole('link', { name: /^Barbell Bench Press/ });
  const original = await gradient(bench);
  await rail.getByRole('button', { name: 'Triceps', exact: true }).click();
  await expect(page).toHaveURL(/muscle=triceps/);
  await expect(bench).toBeVisible();
  expect(await gradient(bench)).toBe(original);
  expect(await gradient(bench)).not.toBe(
    await gradient(rail.getByRole('button', { name: 'Triceps', exact: true })),
  );
  await page.getByLabel('Search').fill('Barbell Bench Press');
  // Search also matches Incline Barbell Bench Press.
  await expect(page.locator('main ul > li')).toHaveCount(2);
  expect(await gradient(bench)).toBe(original);
  await context.setOffline(true);
  await rail.getByRole('button', { name: 'Triceps', exact: true }).click();
  await expect(page).not.toHaveURL(/muscle=/);
  await expect(bench).toBeVisible();
  await page.getByLabel('Search').fill('');
  await rail.getByRole('button', { name: 'Cardio', exact: true }).click();
  const cardio = page.getByRole('link', { name: /^Treadmill/ });
  await expect(cardio).toBeVisible();
  expect(await gradient(cardio)).toBe(
    await gradient(rail.getByRole('button', { name: 'Cardio', exact: true })),
  );
});

test('reduced motion and superset selection retain a clear state', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const user = await createUser('browse-superset', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);
  await page.goto('/#/exercises?add=1');
  const rail = page.getByRole('group', { name: 'Muscle filters' });
  const duration = await rail
    .getByRole('button', { name: 'All', exact: true })
    .evaluate((node) => Number.parseFloat(getComputedStyle(node).transitionDuration));
  expect(duration).toBeLessThanOrEqual(0.001);
  await page.getByRole('switch', { name: /^Superset/ }).click();
  await page.getByLabel('Search').fill('Barbell Bench Press');
  const bench = page.getByRole('button', { name: /^Barbell Bench Press/ });
  const original = await gradient(bench);
  await bench.click();
  await expect(bench).toHaveAttribute('aria-pressed', 'true');
  expect(await gradient(bench)).toBe(original);
  await expect(bench.locator('span[aria-hidden="true"]').last()).toHaveText('1');
  // The pressed state can precede the browser's ring-shadow update by a frame.
  await expect(bench).toHaveCSS('box-shadow', /0px 0px 0px 2px/);
  await page.getByLabel('Search').fill('Barbell Curl');
  await page.getByRole('button', { name: /^Barbell Curl/ }).click();
  await expect(page.getByRole('button', { name: 'Confirm (2)' })).toBeVisible();
});
