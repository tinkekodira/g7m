import { expect, test } from '@playwright/test';
import { createUser, sql } from './support/backend.js';
import { logSet, signIn, startWith, waitForCatalogue } from './support/app.js';

test.use({ deviceScaleFactor: 1 });

for (const theme of ['light', 'dark']) {
  test(`cable-to-Viking details are complete, fit and work offline in ${theme}`, async ({
    page,
    context,
  }, testInfo) => {
    test.setTimeout(120_000);
    const user = await createUser(`viking-${theme}`, { onboarded: true });
    const additions = await sql<{ slug: string; name: string }>(
      `select slug, name from public.exercises where popularity_rank between 340 and 360 order by slug`,
    );
    expect(additions).toHaveLength(21);
    await signIn(page, user);
    await waitForCatalogue(page);
    await page.setViewportSize({ width: 320, height: 852 });
    await page.evaluate((value) => {
      document.documentElement.dataset['theme'] = value;
    }, theme);

    for (const exercise of additions) {
      await page.goto(`/#/exercises/${exercise.slug}`);
      await expect(
        page.getByRole('heading', { level: 1, name: exercise.name, exact: true }),
      ).toBeVisible();
      const illustration = page.getByRole('img', {
        name: `${exercise.name} illustration`,
        exact: true,
      });
      await expect(illustration).toHaveAttribute('src', /\/assets\/exercise-heroes\//);
      await expect
        .poll(() =>
          illustration.evaluate((element) => {
            const img = element as HTMLImageElement;
            return img.complete && img.naturalWidth > 320;
          }),
        )
        .toBe(true);
      for (const title of [
        'Cues',
        'How to do it',
        'Common mistakes',
        'Muscles worked',
        'Equipment',
        'Starting point',
      ]) {
        await expect(page.getByRole('heading', { name: title, exact: true })).toBeAttached();
      }
      expect(await page.locator('main ol > li').count()).toBeGreaterThanOrEqual(3);
      await expect(page.getByText('Not recorded for this exercise.', { exact: true })).toHaveCount(
        0,
      );
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        320,
      );
    }

    for (const width of [320, 1280]) {
      await page.setViewportSize({ width, height: 852 });
      for (const slug of ['one-arm-push-ups', 'close-grip-dumbbell-bench-press']) {
        await page.goto(`/#/exercises/${slug}`);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
          width,
        );
        await page.screenshot({
          path: testInfo.outputPath(`${slug}-${width}.png`),
          fullPage: true,
        });
      }
    }

    await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
    await expect
      .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
      .toBe(true);
    await context.setOffline(true);
    try {
      await page.goto('/#/exercises/one-arm-push-ups');
      await page.reload();
      await expect(page.getByRole('heading', { level: 1, name: 'One Arm Push Ups' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'How to do it', exact: true })).toBeVisible();
      const favourite = page.getByRole('button', { name: 'Favourite', exact: true });
      await favourite.click();
      await expect(favourite).toHaveAttribute('aria-pressed', 'true');
      await page.goto('/#/exercises');
      await expect(page.locator('.browse-exercise-row').first()).toContainText('One Arm Push Ups');
      await expect(page.locator('.browse-exercise-row').first().locator('img')).toHaveAttribute(
        'src',
        /one-arm-push-ups-[^/]+\.webp$/,
      );
    } finally {
      await context.setOffline(false);
    }
  });
}

test('Viking press and bodyweight sumo squat log independently offline and upload', async ({
  page,
  context,
}) => {
  const user = await createUser('viking-log', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
    .toBe(true);
  await context.setOffline(true);
  try {
    await startWith(page, 'Viking Press');
    await logSet(page, 1, '25', '12');
    await page.getByRole('link', { name: '+ Add an exercise' }).click();
    await page.getByLabel('Search').fill('Sumo Squat');
    await page.getByRole('button', { name: /^Sumo Squat/ }).click();
    const squat = page.locator('section', {
      has: page.getByRole('heading', { name: 'Sumo Squat', exact: true }),
    });
    await squat.getByRole('button', { name: 'Add set', exact: true }).click();
    await expect(squat.getByRole('textbox', { name: 'Weight', exact: true })).toHaveCount(0);
    await squat.getByRole('textbox', { name: 'Reps', exact: true }).fill('8');
    await squat.getByRole('button', { name: 'Complete set 1', exact: true }).click();
    await expect(squat.getByRole('button', { name: 'Undo set 1', exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Viking Press', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sumo Squat', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Undo set 1', exact: true })).toHaveCount(2);
  } finally {
    await context.setOffline(false);
  }
  await expect
    .poll(async () => {
      return sql<{ slug: string; load_type: string; weight_kg: number; reps: number }>(
        `select e.slug, s.load_type, s.weight_kg::float as weight_kg, s.reps from public.session_sets s
       join public.session_exercises se on se.id = s.session_exercise_id
       join public.exercises e on e.id = se.exercise_id
       where s.user_id = $1 and s.is_completed order by e.slug`,
        [user.id],
      );
    })
    .toEqual([
      { slug: 'sumo-squat', load_type: 'bodyweight', weight_kg: 0, reps: 8 },
      { slug: 'viking-press', load_type: 'external', weight_kg: 25, reps: 12 },
    ]);
});
