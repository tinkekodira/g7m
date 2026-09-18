import { expect, test } from '@playwright/test';
import { createUser } from './support/backend.js';
import { openTab, signIn } from './support/app.js';

/**
 * The plate calculator under Learn: what goes on each end, drawn.
 *
 * The loading arithmetic is `loadBar`, which has its own tests. What is worth
 * driving through a browser is the wiring — that Learn offers the way in, that
 * the two kits are really different kits, and that a dumbbell says so when the
 * weight asked for cannot be built at all.
 */
test('the calculator loads a bar, and a dumbbell handle, from Learn', async ({ page }) => {
  const user = await createUser('plates', { onboarded: true });
  await signIn(page, user);
  await openTab(page, 'Learn');

  await page.getByRole('link', { name: 'Plates' }).click();
  await expect(page.getByRole('heading', { name: 'Plate calculator', level: 1 })).toBeVisible();

  // 60 kg on a 20 kg bar is a 20 a side.
  const stepper = page.getByRole('textbox', { name: /Weight on the bar/ });
  await expect(stepper).toHaveValue('60.0');
  // The paragraph, not the "Each end" label inside it — `getByText` resolves to
  // the smallest element that matches, which is the label and carries no plates.
  const each = page.locator('p').filter({ hasText: /^Each end/ });
  await expect(each).toContainText('20');
  await expect(each).toContainText('on a 20 kg bar');

  // 100 kg is a 25 and a 15, and the drawing names the same plates.
  await stepper.fill('100');
  await stepper.blur();
  await expect(each).toContainText('25');
  await expect(each).toContainText('15');
  await expect(page.getByRole('img', { name: /One side of the bar/ })).toBeVisible();

  // Under the bar's own weight there is nothing to load.
  await stepper.fill('15');
  await stepper.blur();
  await expect(page.getByText(/Lighter than the bar on its own/)).toBeVisible();

  // A dumbbell is a different kit: a 2 kg handle, and no 25s to put on it.
  await page.getByRole('button', { name: 'Dumbbell' }).click();
  const handle = page.getByRole('textbox', { name: /Weight of one dumbbell/ });
  await expect(handle).toHaveValue('20.0');
  await expect(each).toContainText('on a 2 kg handle');

  /**
   * The answer somebody actually opens this for: a rack has a 14 kg dumbbell
   * and a handle cannot make one, because 1 kg a side is less than the smallest
   * plate there is.
   */
  await handle.fill('14');
  await handle.blur();
  await expect(page.getByText(/cannot make 14 kg/)).toBeVisible();
  await expect(page.getByText(/closest under it is/)).toContainText('12 kg');

  await page.getByRole('link', { name: 'Learn' }).first().click();
  await expect(page.getByRole('heading', { name: 'Learn', level: 1 })).toBeVisible();
});

/**
 * Learn's own layout. The muscle panel used to render below both footnotes, so
 * tapping a muscle put the reply off the bottom of the screen.
 */
test('Learn answers a tap without three paragraphs of preamble', async ({ page }) => {
  const user = await createUser('learn-layout', { onboarded: true });
  await signIn(page, user);
  await openTab(page, 'Learn');

  // The instruction is the header's subtitle, said once.
  await expect(page.getByText('Tap a muscle to see what trains it.')).toBeVisible();
  // And the banner that used to sit above the model while the rows arrived is
  // gone — the model's own placeholder covers that second.
  await expect(page.getByText('Loading the muscle catalogue…')).toHaveCount(0);

  await page.getByRole('button', { name: 'What I have trained' }).click();
  await expect(page.getByText(/What you have trained, over \d+ weeks/)).toBeVisible();
});
