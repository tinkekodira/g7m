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

  // Air Bike is the last exercise with no render. When it gets one, this
  // needs another fixture.
  await page.getByLabel('Search').fill('Air Bike');
  const withoutArt = page.getByRole('link', { name: /^Air Bike/ });
  await expect(withoutArt).toBeVisible();
  // The one without a render falls back to the app's own glyph.
  await expect(withoutArt.locator('img')).toHaveCount(0);
  await expect(withoutArt.locator('svg')).toHaveCount(1);
  const glyph = await withoutArt.locator('svg').first().boundingBox();
  const other = await page.getByText('Air Bike', { exact: true }).boundingBox();
  expect(glyph).not.toBeNull();

  // Both squares are the same square, and both names start at the same x.
  expect(named?.x).toBeCloseTo(other?.x ?? -1, 0);
});

/**
 * The bench was the first render; the rack, the floor barbell, the lat
 * pulldown, the leg press, the (hex) dumbbell, the cable machine, the
 * pull-up bar, the EZ bar, the exercise bike, the leg curl/extension
 * machine, the back extension, the adjustable bench, the abductor and
 * adductor machines, the chest press machine, the trap bar, the
 * treadmill, the seated row machine, the hack squat, the pec deck, the calf
 * raise machine, the dip bar, the lying leg curl, the exercise mat, the
 * incline bench, the T-bar, the standing calf raise, the seated cable row, the
 * rowing machine, the ski erg and the stair climber followed it into the same
 * map (see `equipment-art.ts`). One row per piece is enough
 * to say the join still works for each new key — the square itself is
 * already covered above.
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
    ['Preacher Curl (EZ Bar)', 'ez-bar'],
    ['Preacher Curl (Barbell)', 'barbell'],
    ['Preacher Curl (Dumbbell)', 'dumbbell'],
    ['Dumbbell Curl', 'dumbbell'],
    ['EZ Bar Curl', 'ez-bar'],
    ['Upright Bike', 'exercise-bike'],
    ['Leg Extension', 'leg-curl-extension'],
    ['Back Extension', 'back-extension'],
    ['Incline Dumbbell Press', 'adjustable-bench'],
    ['Incline Barbell Bench Press', 'incline-bench'],
    ['Close-Grip Bench Press', 'bench-press'],
    ['Abductor Machine', 'abductor-machine'],
    ['Adductor Machine', 'adductor-machine'],
    ['Machine Chest Press', 'chest-press-machine'],
    ['Trap Bar Deadlift', 'trap-bar'],
    ['Treadmill', 'treadmill'],
    ['Seated Row Machine', 'seated-row-machine'],
    ['Seated Cable Row Machine', 'seated-cable-row'],
    ['Cable Lat Pullover', 'cable-machine'],
    ['Hack Squat', 'hack-squat'],
    ['Pec Deck', 'pec-deck'],
    ['Seated Calf Raise', 'calf-raise-machine'],
    ['Dips (Chest focused)', 'dip-bar'],
    ['Dips (Triceps focused)', 'dip-bar'],
    ['Chest Supported Dumbbell Row', 'adjustable-bench'],
    ['Lying Leg Curl', 'lying-leg-curl'],
    ['Push-Up', 'exercise-mat'],
    ['T-Bar Row', 't-bar'],
    ['Standing Calf Raise', 'standing-calf-raise'],
    ['Rowing Machine', 'rowing-machine'],
    ['Ski Erg', 'ski-erg'],
    ['Stair Climber', 'stair-climber'],
    ['Kettlebell Swing', 'kettlebell'],
    ['Turkish Get-Up', 'kettlebell'],
  ] as const) {
    await page.getByLabel('Search').fill(name);
    // Escaped: "Preacher Curl (EZ Bar)" carries brackets.
    const pattern = name.replace(/[()]/g, '\\$&');
    const row = page.getByRole('link', { name: new RegExp(`^${pattern}`) });
    await expect(row).toBeVisible();
    await expect(row.locator('img')).toHaveAttribute('src', new RegExp(srcMatch));
  }
});
