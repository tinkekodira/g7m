import { expect, test } from '@playwright/test';
import { createUser, eventually, sql } from './support/backend.js';
import { finishWorkout, logSet, signIn, startWith, waitForCatalogue } from './support/app.js';

for (const theme of ['dark', 'light'] as const) {
  test(`incline machine chest press details and artwork: ${theme}`, async ({
    page,
    context,
  }, testInfo) => {
    await page.addInitScript((value) => localStorage.setItem('g7m.theme', value), theme);
    const user = await createUser('incline-press', { onboarded: true });
    await signIn(page, user);
    await waitForCatalogue(page);
    await page.goto('/#/exercises');
    await page.getByLabel('Search').fill('machine incline press');
    const row = page.getByRole('link', { name: /^Incline machine chest press/ });
    await expect(row).toBeVisible();
    await expect(row.locator('img')).toHaveAttribute(
      'src',
      /\/assets\/incline-machine-chest-press-[\w-]+\.webp$/,
    );
    await row.click();

    const hero = page.locator('img[src*="incline-chest-press-machine-hero"]');
    await expect(hero).toBeVisible();
    await expect(hero).toHaveCSS('object-fit', 'contain');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Incline machine chest press' }),
    ).toBeVisible();
    for (const section of [
      'Cues',
      'How to do it',
      'Common mistakes',
      'Muscles worked',
      'Equipment',
      'Starting point',
    ]) {
      await expect(page.getByRole('heading', { name: section, exact: true })).toBeVisible();
    }
    await expect(
      page.getByRole('listitem').filter({ hasText: 'Shoulder blades back and down' }),
    ).toBeVisible();
    await expect(page.getByText('Upper chest', { exact: true })).toBeVisible();
    await expect(page.getByText('8–12', { exact: true })).toBeVisible();

    for (const width of [320, 393, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => window.scrollTo(0, 0));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.screenshot({
        path: testInfo.outputPath(`details-${String(width)}.png`),
        fullPage: true,
      });
    }

    // The synced description is available when navigating with no connection.
    await context.setOffline(true);
    await page.getByRole('link', { name: '← All exercises' }).click();
    await page.getByLabel('Search').fill('incline machine chest press');
    await page.getByRole('link', { name: /^Incline machine chest press/ }).click();
    await expect(
      page.getByRole('listitem').filter({ hasText: 'Shoulder blades back and down' }),
    ).toBeVisible();
    await expect(hero).toBeVisible();
  });
}

test('the incline machine chest press logs external weight against its own exercise', async ({
  page,
}) => {
  const user = await createUser('incline-press-log', { onboarded: true });
  await signIn(page, user);
  await startWith(page, 'Incline machine chest press');
  await logSet(page, 1, '30', '10');
  await finishWorkout(page);
  const sets = await eventually(
    () =>
      sql<{ slug: string; weight_kg: string; reps: number; load_type: string }>(
        `select e.slug, ss.weight_kg, ss.reps, ss.load_type
       from public.session_sets ss
       join public.session_exercises se on se.id = ss.session_exercise_id
       join public.exercises e on e.id = se.exercise_id
       join public.workout_sessions ws on ws.id = se.session_id
      where ws.user_id = $1 and ws.ended_at is not null and ss.is_completed`,
        [user.id],
      ),
    (rows) => rows.length === 1,
  );
  expect(sets.map((row) => ({ ...row, weight_kg: Number(row.weight_kg) }))).toEqual([
    { slug: 'incline-machine-chest-press', weight_kg: 30, reps: 10, load_type: 'external' },
  ]);
});
