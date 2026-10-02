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
  // Air Bike is the last exercise with no render. When it gets one, this
  // needs another fixture.
  await page.goto('/#/exercises/air-bike');
  await expect(page.getByRole('heading', { level: 1, name: 'Air Bike' })).toBeVisible();
  await expect(page.locator('img[src*="hero"]')).toHaveCount(0);
  await expect(page.getByRole('link', { name: '← All exercises' })).toBeVisible();

  // An icon with no hero is the same: the mat is drawn for the list only.
  await page.goto('/#/exercises/push-up');
  await expect(page.getByRole('heading', { level: 1, name: 'Push-Up' })).toBeVisible();
  await expect(page.locator('img[src*="hero"]')).toHaveCount(0);
});

/**
 * The bench is close to square-ish (1.22:1) and fills the hero box corner to
 * corner. The rack, the lat pulldown and the cable machine are portrait — a
 * tall render in a wide box — while the floor barbell, the dumbbell and the
 * pull-up bar are low and wide (the pull-up bar the widest yet, about 2.3:1).
 * The leg press is close to square. The EZ bar is wider still (about 2.8:1,
 * the widest render in the set) and the exercise bike is the most portrait
 * yet (about 0.68:1). The chest press machine is portrait too (about
 * 0.67:1, a tall two-post frame) and the trap bar is wide (about 1.94:1),
 * a bar between two plates like the floor barbell. The pec deck is the
 * most portrait render yet (about 0.64:1, a single tall spine tower) and
 * the dip bar is wide (about 2.6:1, two arms out of a wall plate), second
 * only to the EZ bar. The ski erg is now the most portrait (about 0.56:1,
 * a tall mast on a small floor plate). None of these shapes gets a special case:
 * `object-contain` on a box that only constrains width and max-height fits
 * any aspect without cropping it, by construction, so what is worth
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
    ['preacher-curl', 'ez-bar-hero'],
    ['upright-bike', 'exercise-bike-hero'],
    ['leg-extension', 'leg-curl-extension-hero'],
    ['back-extension', 'back-extension-hero'],
    ['incline-dumbbell-press', 'adjustable-bench-hero'],
    ['incline-barbell-press', 'incline-bench-hero'],
    ['close-grip-bench-press', 'bench-press-hero'],
    ['hip-abduction-machine', 'abductor-machine-hero'],
    ['hip-adduction-machine', 'adductor-machine-hero'],
    ['machine-chest-press', 'chest-press-machine-hero'],
    ['trap-bar-deadlift', 'trap-bar-hero'],
    ['treadmill', 'treadmill-hero'],
    ['seated-row-machine', 'seated-row-machine-hero'],
    ['hack-squat', 'hack-squat-hero'],
    ['pec-deck', 'pec-deck-hero'],
    ['seated-calf-raise', 'calf-raise-machine-hero'],
    ['chest-dip', 'dip-bar-hero'],
    ['lying-leg-curl', 'lying-leg-curl-hero'],
    ['t-bar-row', 't-bar-hero'],
    ['standing-calf-raise', 'standing-calf-raise-hero'],
    ['seated-cable-row', 'seated-cable-row-hero'],
    ['rowing-machine', 'rowing-machine-hero'],
    ['ski-erg', 'ski-erg-hero'],
    ['stair-climber', 'stair-climber-hero'],
  ] as const) {
    await page.goto(`/#/exercises/${slug}`);
    const hero = page.locator(`img[src*="${srcMatch}"]`);
    await expect(hero).toBeVisible();

    // `object-fit: contain` is what guarantees no crop whatever the art's
    // shape — this is the property a future edit could silently drop.
    await expect(hero).toHaveCSS('object-fit', 'contain');
    // The name arrives after the image. Measured before it does, the heading
    // is an empty box sitting low on the art, and every check below passes.
    await expect(page.getByRole('heading', { level: 1 })).not.toBeEmpty();

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
    // how little of the box's width or height the art itself occupies. A name
    // that wraps grows upward by design (see `ExerciseHero`), and whether it
    // wraps is up to the font: CI's breaks "Preacher Curl (EZ Bar)" in two at
    // 393px, where phone fonts do not. So what is pinned is the last line,
    // measured as layout (bottom less one line-height), not glyphs, so the
    // font's ascent cannot move it.
    const title = page.getByRole('heading', { level: 1 });
    const text = await title.boundingBox();
    const lineHeight = await title.evaluate((el) => parseFloat(getComputedStyle(el).lineHeight));
    const bottom = (text?.y ?? 0) + (text?.height ?? 0);
    expect(lineHeight).toBeGreaterThan(0);
    expect(bottom - lineHeight).toBeGreaterThanOrEqual(frame?.y ?? 0);
    expect(bottom).toBeLessThanOrEqual((frame?.y ?? 0) + (frame?.height ?? 0) + 1);
  }
});

/**
 * A long "Also called" line wraps, and it used to lift the name with it. The
 * name and aliases were one block anchored at the bottom, so each extra alias
 * line pushed the name up by a line. Over the EZ bar, the shortest render in
 * the loop above, that put Preacher Curl's name on bare page above the bar.
 * The aliases now hang below the name and grow downward.
 *
 * What is pinned is where the name ends, not whether it fits on the art: a
 * long name may wrap and grow upward by design, and whether it wraps depends
 * on the font. At 320px Preacher Curl's aliases wrap in any font, so the name
 * still has to end where a one-line list would leave it: a quarter of the
 * hero plus one alias line (1.5rem) up from the bottom.
 */
test('a long alias list grows down and leaves the name where it was', async ({ page }) => {
  const user = await createUser('hero-aliases', { onboarded: true });
  await signIn(page, user);
  await page.setViewportSize({ width: 320, height: 740 });

  await page.goto('/#/exercises/preacher-curl');
  await expect(page.locator('img[src*="ez-bar-hero"]')).toBeVisible();
  const aliases = page.getByText(/^Also called ez bar preacher curl/);
  await expect(aliases).toBeVisible();

  const text = await page.getByRole('heading', { level: 1 }).boundingBox();
  const under = await aliases.boundingBox();
  const container = await page.locator('div.overflow-hidden[class*="var(--hero-h)"]').boundingBox();
  const heroBottom = (container?.y ?? 0) + (container?.height ?? 0);
  const nameBottom = (text?.y ?? 0) + (text?.height ?? 0);

  // The case under test: the aliases really do take more than one line.
  expect(under?.height ?? 0).toBeGreaterThan(30);
  // The name ends where it would with one line of aliases.
  expect(Math.abs(nameBottom - (heroBottom - (container?.height ?? 0) * 0.25 - 24))).toBeLessThan(
    1,
  );
  // The aliases sit under it and stay inside the hero.
  expect(under?.y ?? 0).toBeGreaterThanOrEqual(nameBottom);
  expect((under?.y ?? 0) + (under?.height ?? 0)).toBeLessThanOrEqual(heroBottom);
});
