import { expect, test, type Page } from '@playwright/test';
import { createUser } from './support/backend.js';
import { openTab, signIn } from './support/app.js';

/**
 * The plate calculator under Learn: what goes on each end, drawn from
 * cartoon sprites, with a bar picker and a gym's own available plates.
 *
 * The loading arithmetic is `loadCalculatorBar` and `sleeveFits`, which have
 * their own unit tests, as does the sprite layout (`layout.test.ts`). What is
 * worth driving through a browser is the wiring: that Learn offers the way
 * in, that the bar and plates change with the number and the bar picked,
 * that a weight too heavy for the sleeve says so instead of drawing off the
 * bar, and that deselecting a plate in "Available plates" changes the maths,
 * the drawing and the legend together — and stays deselected.
 */

async function openCalculator(page: Page): Promise<void> {
  await openTab(page, 'Learn');
  await page.getByRole('link', { name: 'Plates' }).click();
  await expect(page.getByRole('heading', { name: 'Plate calculator', level: 1 })).toBeVisible();
}

const stepperLocator = (page: Page) => page.getByRole('textbox', { name: /Weight on the bar/ });

/** The "Each end ..." paragraph, not its own "Each end" label. */
const eachEnd = (page: Page) => page.locator('p').filter({ hasText: /^Each end/ });

test('20 kg empty, 60 kg, and a weight lighter than the bar', async ({ page }) => {
  const user = await createUser('plates-basic', { onboarded: true });
  await signIn(page, user);
  await openCalculator(page);

  const stepper = stepperLocator(page);
  await expect(stepper).toHaveValue('60.0');
  await expect(eachEnd(page)).toContainText('20');
  await expect(eachEnd(page)).toContainText('on a 20 kg bar');

  await stepper.fill('20');
  await stepper.blur();
  await expect(page.getByText('Just the bar — 20 kg, nothing on it.')).toBeVisible();
  await expect(page.getByRole('img', { name: /An empty 20 kg bar/ })).toBeVisible();

  await stepper.fill('15');
  await stepper.blur();
  await expect(page.getByText(/Lighter than the bar on its own/)).toBeVisible();
});

test('117.5 kg, a 1.25-step value, and a weight that cannot be made exactly', async ({ page }) => {
  const user = await createUser('plates-values', { onboarded: true });
  await signIn(page, user);
  await openCalculator(page);
  const stepper = stepperLocator(page);

  // 117.5: (117.5 - 20) / 2 = 48.75 a side -> 25 + 20 + 2.5 + 1.25.
  await stepper.fill('117.5');
  await stepper.blur();
  const each = eachEnd(page);
  await expect(each).toContainText('25');
  await expect(each).toContainText('20');
  await expect(each).toContainText('2.5');
  await expect(each).toContainText('1.25');
  await expect(each).not.toContainText('short');

  // 22.5: exactly a bar plus one 1.25 a side.
  await stepper.fill('22.5');
  await stepper.blur();
  await expect(
    page.getByRole('img', { name: /A bar loaded with 1\.25 kg on each end/ }),
  ).toBeVisible();

  // 101: 25 + 15 a side makes 100, one short of 101.
  await stepper.fill('101');
  await stepper.blur();
  await expect(each).toContainText('the closest these plates make is 100 kg, 1 kg short');
});

test('a weight too heavy for the sleeve draws an empty bar with a message', async ({ page }) => {
  const user = await createUser('plates-overflow', { onboarded: true });
  await signIn(page, user);
  await openCalculator(page);

  await page.getByRole('radio', { name: '15 kg' }).click();
  const stepper = stepperLocator(page);
  // All seven plates a side (78.75 kg) plus the 30 mm collar is 337 mm, more
  // than the 15 kg bar's 320 mm sleeve.
  await stepper.fill('172.5');
  await stepper.blur();

  await expect(page.getByText(/That.s more plate than this bar.s sleeve can hold\./)).toBeVisible();
  await expect(page.getByRole('img', { name: /An empty 15 kg bar/ })).toBeVisible();
  await expect(page.locator('p').filter({ hasText: /^Each end/ })).toHaveCount(0);
});

test('each bar: 15 kg, and an EZ bar with an editable weight', async ({ page }) => {
  const user = await createUser('plates-bars', { onboarded: true });
  await signIn(page, user);
  await openCalculator(page);
  const stepper = stepperLocator(page);

  await page.getByRole('radio', { name: '15 kg' }).click();
  await expect(page.getByRole('radio', { name: '15 kg' })).toBeChecked();
  await stepper.fill('15');
  await stepper.blur();
  await expect(page.getByText('Just the bar — 15 kg, nothing on it.')).toBeVisible();

  await page.getByRole('radio', { name: 'EZ bar' }).click();
  await expect(page.getByRole('radio', { name: 'EZ bar' })).toBeChecked();
  const ezWeight = page.getByRole('textbox', { name: /EZ bar weighs/ });
  await expect(ezWeight).toHaveValue('10.0');

  await ezWeight.fill('12.5');
  await ezWeight.blur();
  await stepper.fill('12.5');
  await stepper.blur();
  await expect(page.getByText('Just the bar — 12.5 kg, nothing on it.')).toBeVisible();
});

test('lb mode: standard lb bars and the seven-plate pound ladder', async ({ page }) => {
  const user = await createUser('plates-lb', { onboarded: true });
  await signIn(page, user);
  await openTab(page, 'Settings');
  await page.getByRole('radio', { name: 'Pounds' }).click();
  await expect(page.getByRole('radio', { name: 'Pounds' })).toBeChecked();

  await openCalculator(page);
  await expect(page.getByRole('radio', { name: '45 lb' })).toBeChecked();
  await expect(page.getByRole('radio', { name: '35 lb' })).toBeVisible();

  const stepper = stepperLocator(page);
  await expect(stepper).toHaveValue('135.0');
  await expect(eachEnd(page)).toContainText('45');
  await expect(eachEnd(page)).toContainText('on a 45 lb bar');
});

test('deselecting plates changes the maths, the bar and the legend, and survives a unit switch', async ({
  page,
}) => {
  const user = await createUser('plates-available', { onboarded: true });
  await signIn(page, user);
  await openCalculator(page);

  const available = page.locator('#available-plates');
  await available.scrollIntoViewIfNeeded();
  await expect(available.getByRole('heading', { name: 'Available plates' })).toBeVisible();

  // Exact matches throughout this section: "25 kg" is a substring of "1.25 kg",
  // and "5 kg" a substring of both "1.25 kg" and "2.5 kg".
  const redButton = available.getByRole('button', { name: '25 kg', exact: true });
  const yellowButton = available.getByRole('button', { name: '15 kg', exact: true });
  await redButton.click();
  await yellowButton.click();
  await expect(redButton).toHaveAttribute('aria-pressed', 'false');
  await expect(yellowButton).toHaveAttribute('aria-pressed', 'false');

  // The hint appears, and links to the section that was just edited.
  await expect(page.getByText('2 plates are hidden')).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Change which plates your gym has' }),
  ).toHaveAttribute('href', '#available-plates');

  // Without a 25 or a 15, 100 kg loads as two 20s a side, not a 25 and a 15.
  const stepper = stepperLocator(page);
  await stepper.fill('100');
  await stepper.blur();
  const each = eachEnd(page);
  await expect(each).toContainText('20');
  await expect(each).not.toContainText('25');
  await expect(each).not.toContainText('15');

  // The legend no longer shows red or yellow. Each disc's accessible text is
  // its number plus a screen-reader-only unit ("25 kg"), so exact matches are
  // what tells "25 kg" apart from "1.25 kg".
  const legend = page.locator('section', {
    has: page.getByRole('heading', { name: 'The colours' }),
  });
  await expect(legend.getByText('25 kg', { exact: true })).toHaveCount(0);
  await expect(legend.getByText('15 kg', { exact: true })).toHaveCount(0);
  await expect(legend.getByText('20 kg', { exact: true })).toBeVisible();

  // The choice survives a switch to pounds and back.
  await openTab(page, 'Settings');
  await page.getByRole('radio', { name: 'Pounds' }).click();
  await expect(page.getByRole('radio', { name: 'Pounds' })).toBeChecked();
  await page.getByRole('radio', { name: 'Kilograms' }).click();
  await expect(page.getByRole('radio', { name: 'Kilograms' })).toBeChecked();
  await openCalculator(page);
  await expect(page.getByText('2 plates are hidden')).toBeVisible();

  // And a reload — the choice is kept on this device.
  await page.reload();
  await expect(page.getByText('2 plates are hidden')).toBeVisible();
});

test('at least one plate must stay selected', async ({ page }) => {
  const user = await createUser('plates-minimum', { onboarded: true });
  await signIn(page, user);
  await openCalculator(page);

  const available = page.locator('#available-plates');
  await available.scrollIntoViewIfNeeded();
  const slots = ['25 kg', '20 kg', '15 kg', '10 kg', '5 kg', '2.5 kg'];
  for (const slot of slots) {
    await available.getByRole('button', { name: slot, exact: true }).click();
  }
  // One plate left — 1.25 kg — and deselecting it is refused.
  await available.getByRole('button', { name: '1.25 kg' }).click();
  await expect(available.getByRole('button', { name: '1.25 kg' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByText('Keep at least one plate selected.')).toBeVisible();
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
