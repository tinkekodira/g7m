import { expect, test } from '@playwright/test';
import { createUser } from './support/backend.js';
import { logSet, openTab, signIn, startWith, waitForCatalogue } from './support/app.js';

for (const width of [393, 1280]) {
  test(`Continue opens the latest exercise and workout actions at ${String(width)}px`, async ({
    page,
    context,
  }, info) => {
    await page.setViewportSize({ width, height: 740 });
    const user = await createUser('continue-workout', { onboarded: true });
    await signIn(page, user);
    await waitForCatalogue(page);
    await startWith(page, 'Barbell Bench Press');
    for (let set = 1; set <= 4; set += 1) await logSet(page, set, '40', '8');

    for (const exercise of ['Lateral Raise', 'Pull-Up']) {
      await page.getByRole('link', { name: '+ Add an exercise' }).click();
      await page.getByLabel('Search').fill(exercise);
      await page.getByRole('button', { name: new RegExp(`^${exercise}`) }).click();
      await expect(page.getByRole('heading', { name: exercise, exact: true })).toBeInViewport();
    }

    // Repeat offline with reduced motion: resuming must use the local workout
    // and scroll again on each visit, without waiting for the network.
    for (const offline of [false, true]) {
      await page.getByRole('link', { name: 'Home', exact: true }).click();
      if (offline) {
        await openTab(page, 'Settings');
        await page.getByRole('switch', { name: /Dark mode/ }).click();
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await context.setOffline(true);
        await openTab(page, 'Home');
      }
      await page.getByRole('link', { name: /In progress.*Continue your workout/ }).click();
      await expect(page.getByRole('heading', { name: 'Pull-Up', exact: true })).toBeInViewport();
      await expect(page.getByRole('link', { name: '+ Add an exercise' })).toBeInViewport();
      await expect(
        page.getByRole('button', { name: 'Finish workout', exact: true }),
      ).toBeInViewport();
      await expect(page.getByRole('button', { name: 'Discard', exact: true })).toBeInViewport();
      await expect(
        page.getByRole('heading', { name: 'Barbell Bench Press', exact: true }),
      ).not.toBeInViewport();
      await page.screenshot({ path: info.outputPath(`continue-${String(offline)}.png`) });

      // Once consumed, the resume request must not pull the user back down.
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect(page.getByRole('heading', { name: 'Workout', exact: true })).toBeInViewport();
    }
    await context.setOffline(false);
  });
}
