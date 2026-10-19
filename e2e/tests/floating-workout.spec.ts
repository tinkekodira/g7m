import { expect, test, type Page } from '@playwright/test';
import { createUser, eventually, sql } from './support/backend.js';
import { finishWorkout, logSet, signIn, startWith, waitForCatalogue } from './support/app.js';

const summary = (page: Page) => page.getByRole('group', { name: 'Workout summary' });

async function revealSummary(page: Page): Promise<void> {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(summary(page)).toBeVisible();
  await expect(summary(page).locator('..')).toHaveCSS('opacity', '1');
}

async function expectSets(page: Page, count: number): Promise<void> {
  await revealSummary(page);
  await expect(summary(page)).toContainText(`${String(count)} ${count === 1 ? 'set' : 'sets'}`);
}

test('the compact summary follows scrolling, resizing and exercise navigation', async ({
  page,
}, info) => {
  test.setTimeout(120_000);
  const user = await createUser('floating-layout', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);
  await startWith(page, 'Barbell Bench Press');
  // Keep the existing clearance for the rest bar when adding conditional shell classes.
  await expect(page.getByRole('main')).toHaveCSS('padding-bottom', '128px');
  for (let n = 1; n <= 4; n += 1) {
    await page.getByRole('button', { name: 'Add set' }).click();
    await expect(page.getByRole('button', { name: `Complete set ${String(n)}` })).toBeVisible();
  }

  for (const width of [320, 412, 1280]) {
    await page.setViewportSize({ width, height: width === 1280 ? 900 : 740 });
    for (const theme of ['dark', 'light']) {
      await page.evaluate((value) => {
        document.documentElement.dataset['theme'] = value;
      }, theme);
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect(summary(page)).toHaveCount(0);
      await expect(page.locator('header').getByText(/elapsed/)).toBeInViewport();
      await expectSets(page, 0);
      const bounds = await summary(page).boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.height).toBe(44);
      expect(bounds!.y).toBe(8);
      expect(bounds!.x).toBeGreaterThanOrEqual(16);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width - 16);
      expect(bounds!.width).toBeLessThan(240);
      expect(Math.abs(bounds!.x + bounds!.width / 2 - width / 2)).toBeLessThan(1);
      await page.screenshot({ path: info.outputPath(`summary-${String(width)}-${theme}.png`) });
    }
  }

  await page.setViewportSize({ width: 412, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await revealSummary(page);
  const transition = await summary(page)
    .locator('..')
    .evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(parseFloat(transition)).toBeLessThan(0.001);

  // Focus and scroll an input to the start; it must clear the floating readout.
  const input = page.getByRole('textbox', { name: 'Weight' }).last();
  await input.evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await input.focus();
  expect((await input.boundingBox())!.y).toBeGreaterThanOrEqual(68);

  await page.getByRole('link', { name: '+ Add an exercise' }).click();
  await expect(summary(page)).toHaveCount(0);
  await page.getByRole('link', { name: 'Back', exact: true }).click();
  await expect(summary(page)).toBeVisible();

  await page.getByRole('link', { name: '+ Add an exercise' }).click();
  await page.getByLabel('Search').fill('Pull-Up');
  await page.getByRole('button', { name: /^Pull-Up/ }).click();
  const added = page.getByRole('heading', { name: 'Pull-Up', exact: true });
  await expect(added).toBeInViewport();
  await expect.poll(async () => (await added.boundingBox())!.y).toBeGreaterThanOrEqual(68);
  await expect(summary(page)).toBeVisible();

  // A modal is above the informational pill, and it cannot intercept touches.
  await page.locator('section', { has: added }).getByRole('button', { name: 'Remove' }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toBeVisible();
  expect(Number(await dialog.evaluate((el) => getComputedStyle(el).zIndex))).toBeGreaterThan(30);
  await expect(summary(page)).toHaveCSS('pointer-events', 'none');
  await dialog.getByRole('button', { name: 'Cancel' }).click();
});

test('the tally follows working sets, warm-ups, drops, deletion and undo', async ({ page }) => {
  const user = await createUser('floating-counts', { onboarded: true });
  await page.setViewportSize({ width: 390, height: 640 });
  await signIn(page, user);
  await waitForCatalogue(page);
  await startWith(page, 'Barbell Bench Press');
  await logSet(page, 1, '100', '8');
  await page.getByRole('button', { name: 'Warm-up', exact: true }).click();
  await page.getByRole('button', { name: 'Complete warm-up 1', exact: true }).click();
  await expectSets(page, 1);
  await page.getByRole('button', { name: 'Drop after set 1', exact: true }).click();
  await page.getByRole('button', { name: 'Complete drop 1 of set 1' }).click();
  await expectSets(page, 1);
  await page.getByRole('button', { name: 'Undo set 1', exact: true }).click();
  await expectSets(page, 0);
  await page.getByRole('button', { name: 'Complete set 1', exact: true }).click();
  await expectSets(page, 1);
  await logSet(page, 2, '100', '8');
  await expectSets(page, 2);
  await page.getByRole('button', { name: 'Undo set 2', exact: true }).click();
  await expectSets(page, 1);
  // Delete only the second set; other editable rows here are warm-ups.
  const second = page
    .locator('[id]')
    .filter({ has: page.getByRole('button', { name: 'Complete set 2', exact: true }) })
    .last();
  await second.getByRole('button', { name: 'Delete', exact: true }).click();
  await expectSets(page, 1);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expectSets(page, 1);
  await page.getByRole('button', { name: 'Complete set 2', exact: true }).click();
  await expectSets(page, 2);

  // Keep a long second exercise so removing the first doesn't return to the header.
  await page.getByRole('link', { name: '+ Add an exercise' }).click();
  await page.getByLabel('Search').fill('Pull-Up');
  await page.getByRole('button', { name: /^Pull-Up/ }).click();
  const pullup = page.locator('section', {
    has: page.getByRole('heading', { name: 'Pull-Up', exact: true }),
  });
  for (let n = 0; n < 3; n += 1) await pullup.getByRole('button', { name: 'Add set' }).click();
  await page
    .locator('section', { has: page.getByRole('heading', { name: 'Barbell Bench Press' }) })
    .getByRole('button', { name: 'Remove' })
    .click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Remove', exact: true }).click();
  await expectSets(page, 0);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expectSets(page, 2);
});

test('the same clock survives offline logging, reload and hour rollover', async ({
  page,
  context,
}) => {
  const user = await createUser('floating-clock', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);
  const start = new Date();
  await page.clock.setFixedTime(start);
  await startWith(page, 'Barbell Bench Press');
  for (let n = 1; n <= 3; n += 1) {
    await page.getByRole('button', { name: 'Add set' }).click();
    await expect(page.getByRole('button', { name: `Complete set ${String(n)}` })).toBeVisible();
  }
  await page.clock.setFixedTime(new Date(start.getTime() + (18 * 60 + 52) * 1000));
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await revealSummary(page);
  await expect(summary(page).getByRole('timer')).toHaveText('18:52');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Workout', exact: true })).toBeVisible();
  await revealSummary(page);
  await expect(summary(page).getByRole('timer')).toHaveText('18:52');

  await context.setOffline(true);
  await page.getByRole('button', { name: 'Complete set 1', exact: true }).click();
  await expectSets(page, 1);
  for (const [seconds, label] of [
    [3599, '59:59'],
    [3600, '1:00'],
  ] as const) {
    await page.clock.setFixedTime(new Date(start.getTime() + seconds * 1000));
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await expect(summary(page).getByRole('timer')).toHaveText(label);
  }
  await expect(summary(page).getByRole('timer')).toHaveAttribute(
    'aria-label',
    '1 hour 0 minutes elapsed',
  );
  await context.setOffline(false);
  await eventually(
    () =>
      sql<{ count: string }>(
        `select count(*)::text as count from public.session_sets ss
     join public.session_exercises se on se.id = ss.session_exercise_id
     join public.workout_sessions ws on ws.id = se.session_id
     where ws.user_id = $1 and ss.is_completed`,
        [user.id],
      ),
    (rows) => rows[0]?.count === '1',
  );
  // Advancing past an hour also triggers the existing inactivity and rest bars.
  await page.getByRole('button', { name: 'Keep going', exact: true }).click();
  await page.getByRole('button', { name: 'Dismiss', exact: true }).click();
  await finishWorkout(page);
  await expect(summary(page)).toHaveCount(0);
});

test('cardio stays time-only and mixed workouts count bodyweight without a weigh-in', async ({
  page,
}) => {
  const user = await createUser('floating-cardio', { onboarded: true });
  await sql('update public.profiles set bodyweight_kg = null where id = $1', [user.id]);
  await page.setViewportSize({ width: 390, height: 640 });
  await signIn(page, user);
  await waitForCatalogue(page);
  await startWith(page, 'Treadmill');
  for (let n = 1; n <= 2; n += 1) {
    await page.getByRole('button', { name: 'Add bout' }).click();
    await page.getByLabel('Time', { exact: true }).last().fill('10:00');
    await page.getByRole('button', { name: `Complete bout ${String(n)}` }).click();
  }
  await revealSummary(page);
  await expect(summary(page)).not.toContainText('sets');
  await page.getByRole('link', { name: '+ Add an exercise' }).click();
  await page.getByLabel('Search').fill('Pull-Up');
  await page.getByRole('button', { name: /^Pull-Up/ }).click();
  await page.getByRole('button', { name: 'Add set' }).click();
  await expectSets(page, 0);
  await page.getByRole('button', { name: 'Complete set 1' }).click();
  await expectSets(page, 1);
});
