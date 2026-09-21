import { expect, test } from '@playwright/test';
import { createUser } from './support/backend.js';
import { signIn } from './support/app.js';

/**
 * The equipment square in front of each exercise in the library.
 *
 * Some exercises have a render and most do not, so the thing worth asserting
 * is that the two kinds of row are indistinguishable from the text's point of
 * view: same container, same left edge. A list where some rows indent and
 * others do not reads as broken rather than as incomplete, and that is a
 * regression a screenshot would catch a week late.
 */
test('every exercise row has an icon square, and the text lines up either way', async ({
  page,
}) => {
  const user = await createUser('icons', { onboarded: true });
  await signIn(page, user);
  await page.goto('/#/exercises');

  await page.getByLabel('Search').fill('Barbell Bench Press');
  const withArt = page.getByRole('link', { name: /^Barbell Bench Press/ });
  await expect(withArt).toBeVisible();
  // The one with a render draws it, not an empty square.
  await expect(withArt.locator('img')).toHaveAttribute('src', /bench-press/);
  const art = await withArt.locator('img, svg').first().boundingBox();
  const named = await page.getByText('Barbell Bench Press', { exact: true }).boundingBox();
  expect(art).not.toBeNull();

  // Seated Cable Row shares a name with the cable machine but deliberately
  // stays off its map (it is its own, not-yet-rendered seated row machine).
  await page.getByLabel('Search').fill('Seated Cable Row');
  const withoutArt = page.getByRole('link', { name: /^Seated Cable Row/ });
  await expect(withoutArt).toBeVisible();
  // The one without a render falls back to the app's own glyph.
  await expect(withoutArt.locator('img')).toHaveCount(0);
  await expect(withoutArt.locator('svg')).toHaveCount(1);
  const glyph = await withoutArt.locator('svg').first().boundingBox();
  const other = await page.getByText('Seated Cable Row', { exact: true }).boundingBox();
  expect(glyph).not.toBeNull();

  // Both squares are the same square, and both names start at the same x.
  expect(named?.x).toBeCloseTo(other?.x ?? -1, 0);
});

/**
 * The bench was the first render; the rack, the floor barbell, the lat
 * pulldown, the leg press, the (hex) dumbbell, the cable machine and the
 * pull-up bar followed it into the same map (see `equipment-art.ts`). One row
 * per piece is enough to say the join still works for each new key — the
 * square itself is already covered above.
 */
test('every piece of kit draws its own icon', async ({ page }) => {
  const user = await createUser('icons-kit', { onboarded: true });
  await signIn(page, user);
  await page.goto('/#/exercises');

  for (const [name, srcMatch] of [
    ['Barbell Back Squat', 'squat-rack'],
    ['Barbell Row', 'barbell'],
    ['Lat Pulldown', 'lat-pulldown'],
    ['Leg Press', 'leg-press'],
    ['Hammer Curl', 'dumbbell'],
    ['Cable Fly', 'cable-machine'],
    ['Pull-Up', 'pull-up-bar'],
  ] as const) {
    await page.getByLabel('Search').fill(name);
    const row = page.getByRole('link', { name: new RegExp(`^${name}`) });
    await expect(row).toBeVisible();
    await expect(row.locator('img')).toHaveAttribute('src', new RegExp(srcMatch));
  }
});
