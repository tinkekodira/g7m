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
  // Seated Cable Row deliberately stays off the map (see `equipment-art.ts`).
  await page.goto('/#/exercises/seated-cable-row');
  await expect(page.getByRole('heading', { level: 1, name: 'Seated Cable Row' })).toBeVisible();
  await expect(page.locator('img[src*="hero"]')).toHaveCount(0);
  await expect(page.getByRole('link', { name: '← All exercises' })).toBeVisible();
});

/**
 * The bench is close to square-ish (1.22:1) and fills the hero box corner to
 * corner. The rack, the lat pulldown and the cable machine are portrait — a
 * tall render in a wide box — while the floor barbell, the dumbbell and the
 * pull-up bar are low and wide (the pull-up bar the widest yet, about 2.3:1).
 * The leg press is close to square. None of these shapes gets a special
 * case: `object-contain` on a box that only constrains width and max-height
 * fits any aspect without cropping it, by construction, so what is worth
 * asserting is that the fit still holds at the extremes rather than only at
 * the bench's own near-square ratio.
 */
test('a portrait or a very wide render still fits without cropping', async ({ page }) => {
  const user = await createUser('hero-shapes', { onboarded: true });
  await signIn(page, user);
  await page.setViewportSize({ width: 393, height: 852 });

  for (const [slug, srcMatch] of [
    ['barbell-back-squat', 'squat-rack-hero'],
    ['barbell-row', 'barbell-hero'],
    ['lat-pulldown', 'lat-pulldown-hero'],
    ['leg-press', 'leg-press-hero'],
    ['hammer-curl', 'dumbbell-hero'],
    ['cable-fly', 'cable-machine-hero'],
    ['pull-up', 'pull-up-bar-hero'],
  ] as const) {
    await page.goto(`/#/exercises/${slug}`);
    const hero = page.locator(`img[src*="${srcMatch}"]`);
    await expect(hero).toBeVisible();

    // `object-fit: contain` is what guarantees no crop whatever the art's
    // shape — this is the property a future edit could silently drop.
    await expect(hero).toHaveCSS('object-fit', 'contain');

    const frame = await hero.boundingBox();
    const container = await page
      .locator('div.overflow-hidden[class*="var(--hero-h)"]')
      .boundingBox();
    expect(frame?.x).toBeCloseTo(0, 0);
    expect(frame?.width).toBeCloseTo(393, 0);
    // Never taller than the box it sits in — contain letterboxes inside the
    // element rather than growing the element past its container.
    expect(frame?.height ?? Infinity).toBeLessThanOrEqual((container?.height ?? 0) + 1);

    // The title still lands on the art, not above or below it, regardless of
    // how little of the box's width or height the art itself occupies.
    const title = page.getByRole('heading', { level: 1 });
    const text = await title.boundingBox();
    expect(text?.y ?? 0).toBeGreaterThanOrEqual(frame?.y ?? 0);
    expect((text?.y ?? 0) + (text?.height ?? 0)).toBeLessThanOrEqual(
      (frame?.y ?? 0) + (frame?.height ?? 0) + 1,
    );
  }
});
