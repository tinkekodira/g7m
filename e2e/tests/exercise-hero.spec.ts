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

test.use({ deviceScaleFactor: 1, reducedMotion: 'reduce' });

for (const theme of ['dark', 'light'] as const) {
  test(`exercise field guide fits phones and desktop in ${theme}`, async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await page.addInitScript((value) => localStorage.setItem('g7m.theme', value), theme);
    const user = await createUser(`detail-${theme}`, { onboarded: true });
    await signIn(page, user);
    await waitForCatalogue(page);
    for (const width of [320, 393, 1280]) {
      await page.setViewportSize({ width, height: 852 });
      for (const slug of [
        'barbell-bench-press',
        'barbell-row',
        'lat-pulldown',
        'plank',
        'air-bike',
      ]) {
        await page.goto(`/#/exercises/${slug}`);
        const title = page.getByRole('heading', { level: 1 });
        await expect(title).not.toBeEmpty();
        const art = page.locator('.exercise-art-stage img');
        await expect(art).toBeVisible();
        await expect(art).toHaveCSS('object-fit', 'contain');
        await expect
          .poll(() =>
            art.evaluate((img: HTMLImageElement) => img.naturalWidth > 320 && img.complete),
          )
          .toBe(true);
        const imageBox = await art.boundingBox();
        const titleBox = await title.boundingBox();
        expect((titleBox?.y ?? 0) + (titleBox?.height ?? 0)).toBeLessThan(imageBox?.y ?? 0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
          width,
        );
        const star = page.getByRole('button', { name: 'Favourite', exact: true });
        expect((await star.boundingBox())?.height).toBeGreaterThanOrEqual(48);
        await expect(page.getByRole('heading', { name: 'Cues', exact: true })).toBeVisible();
        if (slug === 'plank' || slug === 'air-bike') {
          await expect(
            page.getByRole('heading', { name: 'Your estimated one-rep max' }),
          ).toHaveCount(0);
        }
        if (slug === 'barbell-bench-press') {
          await page
            .getByRole('heading', { name: 'Muscles worked', exact: true })
            .scrollIntoViewIfNeeded();
          await expect(page.getByRole('img', { name: /^Muscles worked:/ })).toBeVisible();
          await expect(page.locator('.exercise-body-preview canvas')).toHaveCount(2);
          await page
            .getByRole('heading', { name: 'How to do it', exact: true })
            .scrollIntoViewIfNeeded();
          await expect(page.locator('.exercise-demo img')).toBeVisible();
          await page.evaluate(() => window.scrollTo(0, 0));
          await page.screenshot({
            path: testInfo.outputPath(`bench-${theme}-${width}.png`),
            fullPage: true,
          });
        }
      }
    }
    await page.goto('/#/exercises/barbell-bench-press');
    await page.getByRole('button', { name: 'Favourite', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Favourite', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.reload();
    await expect(page.getByRole('button', { name: 'Favourite', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.evaluate(() =>
      document.documentElement.style.setProperty('--spacing-safe-top', '59px'),
    );
    const back = await page.getByRole('link', { name: '← All exercises' }).boundingBox();
    expect(back?.y).toBeGreaterThanOrEqual(59);
    await page.goto('/#/exercises/not-a-real-exercise');
    await expect(page.getByText(/There is no exercise called/)).toBeVisible();
    await expect(page.locator('.exercise-art-stage')).toHaveCount(0);
  });
}

test.describe('artwork fallback', () => {
  test.use({ serviceWorkers: 'block' });
  test('a failed large illustration falls back to the bundled thumbnail', async ({ page }) => {
    const user = await createUser('detail-fallback', { onboarded: true });
    await page.route('**/assets/exercise-heroes/**', (route) => route.abort());
    await signIn(page, user);
    await page.goto('/#/exercises/barbell-bench-press');
    const art = page.getByRole('img', { name: 'Barbell Bench Press illustration' });
    await expect(art).toHaveAttribute('src', /\/assets\/barbell-bench-press-[\w-]+\.webp$/);
    await expect.poll(() => art.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(320);
    await expect(page.getByText('Chest up', { exact: true })).toBeVisible();
  });
});

test('an unvisited exercise has artwork and coaching on its first offline visit', async ({
  page,
  context,
}) => {
  const user = await createUser('detail-offline', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (navigator.serviceWorker.controller === null)
      await new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), {
          once: true,
        }),
      );
  });
  await context.setOffline(true);
  await page.goto('/#/exercises/barbell-bench-press');
  const art = page.getByRole('img', { name: 'Barbell Bench Press illustration' });
  await expect.poll(() => art.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(320);
  await expect(page.getByText('Chest up', { exact: true })).toBeVisible();
  await page.reload();
  await expect(art).toBeVisible();
  await page.getByRole('heading', { name: 'How to do it', exact: true }).scrollIntoViewIfNeeded();
  await expect(page.locator('main ol > li')).toHaveCount(3);
});

test('personal strength fits a narrow phone and keeps units and trend navigation', async ({
  page,
}, testInfo) => {
  const user = await createUser('detail-strength', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);
  await startWith(page, 'Barbell Bench Press');
  await logSet(page, 1, '80', '5');
  await finishWorkout(page);
  await page.setViewportSize({ width: 320, height: 852 });
  await page.goto('/#/exercises/barbell-bench-press');
  const strength = page.locator('.exercise-strength');
  await expect(strength.locator('p.numeric')).toHaveText('93.5 kg');
  const value = await strength.locator('p.numeric').boundingBox();
  const link = await strength.getByRole('link', { name: 'See the trend' }).boundingBox();
  expect((value?.x ?? 0) + (value?.width ?? 0)).toBeLessThanOrEqual(link?.x ?? 0);
  await strength.screenshot({ path: testInfo.outputPath('personal-strength-320.png') });
  await strength.getByRole('link', { name: 'See the trend' }).click();
  await expect(page).toHaveURL(/\/progress\/exercise\//);
  await openTab(page, 'Settings');
  await page.getByRole('radio', { name: 'Pounds', exact: true }).click();
  await page.goto('/#/exercises/barbell-bench-press');
  await expect(strength.locator('p.numeric')).toHaveText('206 lb');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
