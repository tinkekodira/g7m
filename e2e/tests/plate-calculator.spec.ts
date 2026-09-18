import { expect, test } from '@playwright/test';
import { createUser } from './support/backend.js';
import { openTab, signIn } from './support/app.js';

/**
 * The plate calculator under Learn: what goes on each end, drawn.
 *
 * The loading arithmetic is `loadBar`, which has its own tests. What is worth
 * driving through a browser is the wiring: that Learn offers the way in, that
 * the plates change with the number, and that a bar too light to load says so
 * instead of drawing nothing.
 */
test('the calculator loads a bar, from Learn', async ({ page }) => {
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
  // The drawing says the same thing to anybody who cannot see it.
  await expect(page.getByRole('img', { name: /A bar loaded with 25 kg, 15 kg/ })).toBeVisible();

  // Under the bar's own weight there is nothing to load, and the bar is drawn bare.
  await stepper.fill('15');
  await stepper.blur();
  await expect(page.getByText(/Lighter than the bar on its own/)).toBeVisible();
  await expect(page.getByRole('img', { name: /An empty 20 kg bar/ })).toBeVisible();

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
