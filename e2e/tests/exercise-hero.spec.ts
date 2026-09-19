import { expect, test } from '@playwright/test';
import { createUser } from './support/backend.js';
import { signIn } from './support/app.js';

/**
 * The render behind an exercise's title.
 *
 * One exercise has a hero and fifty-two do not, so the two things worth holding
 * are that the one with a render gets a full-bleed image and exactly one title,
 * and that the ones without keep the plain header they have always had. A
 * second <h1> would be the obvious regression — the hero carries the name, and
 * the detail below it used to.
 */
test('an exercise with a hero wears it full-bleed, and one without is unchanged', async ({
  page,
}) => {
  const user = await createUser('hero', { onboarded: true });
  await signIn(page, user);

  await page.goto('/#/exercises/barbell-bench-press');
  const title = page.getByRole('heading', { level: 1, name: 'Barbell Bench Press' });
  await expect(title).toBeVisible();
  // The name is said once. It lived in the detail block before the hero took it.
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);

  // Edge to edge: `-mx-4` cancelling the page gutter is what makes this a hero
  // rather than a picture in a column, and it is one class away from being lost.
  const hero = page.locator('img[src*="bench-press-hero"]');
  await expect(hero).toBeVisible();
  const frame = await hero.boundingBox();
  const width = page.viewportSize()?.width ?? 0;
  expect(frame?.x).toBeCloseTo(0, 0);
  expect(frame?.width).toBeCloseTo(width, 0);
  // Behind the status bar, not under it.
  expect(frame?.y).toBeCloseTo(0, 0);
  // Roughly 45% of the screen, per the brief, and never the whole of it.
  const height = page.viewportSize()?.height ?? 0;
  expect(frame?.height ?? 0).toBeGreaterThan(height * 0.3);
  expect(frame?.height ?? 0).toBeLessThan(height * 0.55);

  // The way back is still there, over the image.
  await expect(page.getByRole('link', { name: '← All exercises' })).toBeVisible();
  // And the aliases still sit under the name.
  await expect(page.getByText(/^Also called bench, bp/)).toBeVisible();

  // An exercise with no render keeps the plain header: no image, same title.
  await page.goto('/#/exercises/dumbbell-shoulder-press');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Dumbbell Shoulder Press' }),
  ).toBeVisible();
  await expect(page.locator('img[src*="hero"]')).toHaveCount(0);
  await expect(page.getByRole('link', { name: '← All exercises' })).toBeVisible();
});
