import { expect, test } from '@playwright/test';
import { createUser } from './support/backend.js';
import { signIn } from './support/app.js';

/** The aspect the hero art is cut to. The bench fills it corner to corner. */
const ART_ASPECT = 1200 / 984;

/**
 * The render behind an exercise's title.
 *
 * The thing worth holding is that the render is never cropped. It shipped once
 * as `object-cover` on a box sized 45vh *plus the status-bar inset*, which on a
 * notched phone is narrower than the art — so cover trimmed both ends off the
 * bench. Chromium reports a zero inset and showed none of it, so the inset is
 * set by hand here and the art's aspect is checked at each one.
 */
test('the hero fills the width and is never cropped, whatever the notch', async ({ page }) => {
  const user = await createUser('hero', { onboarded: true });
  await signIn(page, user);

  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto('/#/exercises/barbell-bench-press');
  const title = page.getByRole('heading', { level: 1, name: 'Barbell Bench Press' });
  await expect(title).toBeVisible();
  // The name is said once. It lived in the detail block before the hero took it.
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);

  const hero = page.locator('img[src*="bench-press-hero"]');
  await expect(hero).toBeVisible();

  // A big notch, a small one, and none: the art keeps its shape through all of
  // them, which is what says no edge of the bench has been trimmed off.
  for (const inset of ['59px', '47px', '0px']) {
    await page.evaluate((value) => {
      document.documentElement.style.setProperty('--spacing-safe-top', value);
    }, inset);
    const frame = await hero.boundingBox();
    expect(frame, inset).not.toBeNull();
    expect(frame?.x, inset).toBeCloseTo(0, 0);
    expect(frame?.width, inset).toBeCloseTo(393, 0);
    expect((frame?.width ?? 0) / (frame?.height ?? 1)).toBeCloseTo(ART_ASPECT, 2);
  }
  await page.evaluate(() => {
    document.documentElement.style.removeProperty('--spacing-safe-top');
  });

  // The title sits on the render rather than under it.
  const frame = await hero.boundingBox();
  const text = await title.boundingBox();
  expect(text?.y ?? 0).toBeGreaterThan(frame?.y ?? 0);
  expect((text?.y ?? 0) + (text?.height ?? 0)).toBeLessThan((frame?.y ?? 0) + (frame?.height ?? 0));

  // The way back is still there, over the image, and the aliases under the name.
  await expect(page.getByRole('link', { name: '← All exercises' })).toBeVisible();
  await expect(page.getByText(/^Also called bench, bp/)).toBeVisible();

  // An exercise with no render keeps the plain header: no image, same title.
  await page.goto('/#/exercises/dumbbell-shoulder-press');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Dumbbell Shoulder Press' }),
  ).toBeVisible();
  await expect(page.locator('img[src*="hero"]')).toHaveCount(0);
  await expect(page.getByRole('link', { name: '← All exercises' })).toBeVisible();
});
