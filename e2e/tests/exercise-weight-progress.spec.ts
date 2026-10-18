import { expect, test, type Page } from '@playwright/test';
import { createUser, sql } from './support/backend.js';
import {
  finishWorkout,
  logSet,
  openTab,
  signIn,
  signOut,
  startWith,
  waitForCatalogue,
} from './support/app.js';

/** Past training is seeded on the server, then read through real sync and SQLite. */
async function seedHistory(userId: string): Promise<void> {
  await sql(`update public.profiles set favourite_exercises = $2 where user_id = $1`, [
    userId,
    'barbell-bench-press,barbell-back-squat,pull-up,push-up',
  ]);
  for (let i = 0; i < 8; i++) {
    await sql(
      `
      with workout as (
        insert into public.workout_sessions (user_id, started_at, ended_at)
        values ($1, $2::timestamptz, $2::timestamptz + interval '40 minutes') returning id
      ), slot as (
        insert into public.session_exercises (user_id, session_id, exercise_id, order_key)
        select $1, workout.id, e.id, 'a0' from workout, public.exercises e
        where e.slug = 'barbell-bench-press' returning id
      )
      insert into public.session_sets (user_id, session_exercise_id, order_key, set_type, weight_kg, reps, is_completed, completed_at)
      select $1, slot.id, v.key, v.kind, v.weight, 8, v.done, case when v.done then $2::timestamptz else null end from slot,
        (values ('a0', 'working', $3::numeric, true), ('a1', 'working', 20, true),
                ('a2', 'warmup', 200, true), ('a3', 'working', 300, false)) v(key, kind, weight, done)
    `,
      [userId, `2026-09-${String(i + 10)}T10:00:00Z`, 40 + i * 5],
    );
  }
  for (const [slug, load, weight] of [
    ['pull-up', 'bodyweight_plus', 10],
    ['push-up', 'bodyweight', 0],
    ['chin-up', 'assisted', 20],
  ] as const) {
    await sql(
      `
      with workout as (
        insert into public.workout_sessions (user_id, started_at, ended_at)
        values ($1, '2026-09-18T10:00:00Z', '2026-09-18T10:40:00Z') returning id
      ), slot as (
        insert into public.session_exercises (user_id, session_id, exercise_id, order_key)
        select $1, workout.id, e.id, 'a0' from workout, public.exercises e where e.slug = $2 returning id
      )
      insert into public.session_sets (user_id, session_exercise_id, order_key, load_type, weight_kg, reps, is_completed, completed_at)
      select $1, slot.id, 'a0', $3, $4, 8, true, '2026-09-18T10:05:00Z'::timestamptz from slot
    `,
      [userId, slug, load, weight],
    );
  }
}

const bench = (page: Page) => page.getByRole('link', { name: /^Barbell Bench Press/ });

for (const theme of ['dark', 'light'] as const) {
  test(`recent weight charts: ${theme}, phone and desktop`, async ({ page }, testInfo) => {
    await page.addInitScript((value) => localStorage.setItem('g7m.theme', value), theme);
    const user = await createUser('weight-charts', { onboarded: true });
    await seedHistory(user.id);
    await signIn(page, user);
    await waitForCatalogue(page);
    await page.goto('/#/exercises');
    const chart = bench(page).getByRole('img');
    await expect(chart).toContainText('75 kg');
    await expect(chart).toContainText('Last 6 sessions');
    await expect(chart).toHaveAttribute('aria-label', /50 kg.*55 kg.*60 kg.*65 kg.*70 kg.*75 kg/);
    await expect(chart).not.toHaveAttribute('aria-label', /200 kg|300 kg|40 kg|45 kg/);
    await expect(page.getByRole('link', { name: /^Pull-Up / }).getByRole('img')).toContainText(
      '+10 kg',
    );
    await expect(page.getByRole('link', { name: /^Push-Up / }).getByRole('img')).toContainText(
      'BW',
    );
    await expect(page.getByRole('link', { name: /^Chin-Up / }).getByRole('img')).toHaveAttribute(
      'aria-label',
      /−20 kg assistance/,
    );
    await expect(page.getByRole('link', { name: /^Treadmill / }).getByRole('img')).toContainText(
      'No weight data',
    );
    const empty = page.getByRole('link', { name: /^Barbell Back Squat/ }).getByRole('img');
    await expect(empty).toContainText('Not logged yet');
    await expect(empty.locator('circle, polyline')).toHaveCount(0);

    // Favourites keep the reference's exercised rows together for visual review.
    await expect(page.getByText('From your past training', { exact: true })).toBeHidden();
    for (const width of [390, 320, 1280]) {
      await page.setViewportSize({ width, height: 1000 });
      await bench(page).scrollIntoViewIfNeeded();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(await bench(page).evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`charts-${String(width)}.png`) });
    }
    await bench(page).focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(bench(page)).toBeFocused();
    await expect(bench(page)).toHaveCSS('outline-style', 'solid');
    await page.keyboard.press('Enter');
    await expect(
      page.getByRole('heading', { name: 'Barbell Bench Press', exact: true }),
    ).toBeVisible();
  });
}

test('charts update offline after finishing, convert units, and stay private across accounts', async ({
  page,
  context,
}) => {
  test.setTimeout(120_000);
  const user = await createUser('weight-offline', { onboarded: true });
  const other = await createUser('weight-empty', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);
  await context.setOffline(true);
  await startWith(page, 'Barbell Bench Press');
  await logSet(page, 1, '80', '8');
  await page.goto('/#/exercises');
  await expect(bench(page).getByRole('img')).toContainText('Not logged yet');
  await page.goto('/#/workout');
  await finishWorkout(page);
  await page.goto('/#/exercises');
  await expect(bench(page).getByRole('img')).toContainText('80 kg');
  await expect(bench(page).getByRole('img')).toContainText('1 session');
  await expect(bench(page).locator('polyline')).toHaveCount(0);
  await page.getByLabel('Search').fill('bench');
  await expect(bench(page).getByRole('img')).toContainText('80 kg');
  await openTab(page, 'Settings');
  await page.getByRole('radio', { name: 'Pounds' }).click();
  await page.goto('/#/exercises');
  await expect(bench(page).getByRole('img')).toContainText('176.4 lb');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(bench(page).locator('svg animate')).toHaveCount(0);
  await context.setOffline(false);
  // Offline cold reload is a separately documented test-build issue (FIXES.md).
  // Verify persisted units online; all chart reads and the finish above were offline.
  await page.reload();
  await expect(bench(page).getByRole('img')).toContainText('176.4 lb');
  await signOut(page);
  await signIn(page, other);
  await waitForCatalogue(page);
  await page.goto('/#/exercises');
  await expect(bench(page).getByRole('img')).toContainText('Not logged yet');
});
