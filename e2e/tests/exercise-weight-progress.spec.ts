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

/** A row in "Add an exercise": the button's name ends with its latest weight. */
const pick = (page: Page, name: string) =>
  page.getByRole('button', { name: new RegExp(`^${name}`) });
const benchPick = (page: Page) => pick(page, 'Barbell Bench Press');

/** The picker a workout's "+ Add an exercise" opens; a pick starts the workout. */
async function openPicker(page: Page): Promise<void> {
  await page.goto('/#/exercises?add=1');
  await expect(page.getByRole('heading', { name: 'Add an exercise' })).toBeVisible();
}

for (const theme of ['dark', 'light'] as const) {
  test(`recent weight charts: ${theme}, phone and desktop`, async ({ page }, testInfo) => {
    await page.addInitScript((value) => localStorage.setItem('g7m.theme', value), theme);
    const user = await createUser('weight-charts', { onboarded: true });
    await seedHistory(user.id);
    await signIn(page, user);
    await waitForCatalogue(page);

    // Browsing lists exercises without charts; the chart is on each one's page.
    await page.goto('/#/exercises');
    const browseBench = page.getByRole('link', { name: /^Barbell Bench Press/ });
    await expect(browseBench).toBeVisible();
    // (Its favourite star is an svg too; the chart is what must be gone.)
    await expect(browseBench.locator('.exercise-weight-chart')).toHaveCount(0);
    await expect(page.getByText(/Weight per workout/)).toBeHidden();
    await browseBench.click();
    await expect(
      page.getByRole('heading', { name: 'Barbell Bench Press', exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Your recent weights' })).toBeVisible();
    const detail = page.getByRole('img', { name: /^Weight progress/ });
    await expect(detail).toContainText('75 kg');
    await expect(detail).toContainText('Last 6 sessions');
    await expect(detail).toHaveAttribute('aria-label', /50 kg.*55 kg.*60 kg.*65 kg.*70 kg.*75 kg/);
    await expect(detail).not.toHaveAttribute('aria-label', /200 kg|300 kg|40 kg|45 kg/);
    // After the demo and its steps.
    const order = await page.evaluate(() => {
      const titles = Array.from(
        document.querySelectorAll<HTMLHeadingElement>('h2'),
        (h): string => h.textContent ?? '',
      );
      return [titles.indexOf('How to do it'), titles.indexOf('Your recent weights')];
    });
    expect(order[0]).toBeGreaterThanOrEqual(0);
    expect(order[1]).toBeGreaterThan(order[0] ?? 0);
    for (const width of [390, 320, 1280]) {
      await page.setViewportSize({ width, height: 1000 });
      await detail.scrollIntoViewIfNeeded();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.screenshot({ path: testInfo.outputPath(`detail-${String(width)}.png`) });
    }

    // Mid-workout, every row in the picker carries its line.
    await page.setViewportSize({ width: 390, height: 1000 });
    await openPicker(page);
    await expect(page.getByText(/Weight per workout/)).toBeVisible();
    await expect(benchPick(page)).toHaveAccessibleName(/75 kg, Last 6 sessions$/);
    await expect(benchPick(page).locator('svg polyline')).toHaveCount(1);
    await expect(pick(page, 'Pull-Up ')).toHaveAccessibleName(/\+10 kg, 1 session$/);
    await expect(pick(page, 'Push-Up ')).toHaveAccessibleName(/BW, 1 session$/);
    await expect(pick(page, 'Chin-Up ')).toHaveAccessibleName(/−20 kg, 1 session$/);
    await page.getByLabel('Search').fill('treadmill');
    await expect(pick(page, 'Treadmill')).toHaveAccessibleName(/No weight data$/);
    await page.getByLabel('Search').fill('');
    const empty = pick(page, 'Barbell Back Squat');
    await expect(empty).toHaveAccessibleName(/Not logged yet$/);
    await expect(empty.locator('circle, polyline')).toHaveCount(0);

    for (const width of [390, 320, 1280]) {
      await page.setViewportSize({ width, height: 1000 });
      await benchPick(page).scrollIntoViewIfNeeded();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(await benchPick(page).evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(
        true,
      );
      await page.screenshot({ path: testInfo.outputPath(`picker-${String(width)}.png`) });
    }
    await benchPick(page).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'Barbell Bench Press' })).toBeVisible();
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
  // Sync can finish before the first install has cached every lazy screen.
  // Offline starting requires the completed asset cache, not just catalogue rows.
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
    .toBe(true);
  await context.setOffline(true);
  await startWith(page, 'Barbell Bench Press');
  await logSet(page, 1, '80', '8');
  await page.goto('/#/exercises/barbell-bench-press');
  await expect(page.getByRole('img', { name: /^No weight history/ })).toBeVisible();
  await page.goto('/#/workout');
  await finishWorkout(page);
  await page.goto('/#/exercises/barbell-bench-press');
  const detail = page.getByRole('img', { name: /^Weight progress/ });
  await expect(detail).toContainText('80 kg');
  await expect(detail).toContainText('1 session');
  await expect(detail.locator('polyline')).toHaveCount(0);
  await openPicker(page);
  await expect(benchPick(page)).toHaveAccessibleName(/80 kg, 1 session$/);
  await openTab(page, 'Settings');
  await page.getByRole('radio', { name: 'Pounds' }).click();
  await openPicker(page);
  await expect(benchPick(page)).toHaveAccessibleName(/176\.4 lb, 1 session$/);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(benchPick(page).locator('svg animate')).toHaveCount(0);
  await context.setOffline(false);
  // Offline cold reload is a separately documented test-build issue (FIXES.md).
  // Verify persisted units online; all chart reads and the finish above were offline.
  await page.reload();
  await expect(benchPick(page)).toHaveAccessibleName(/176\.4 lb, 1 session$/);
  await signOut(page);
  await signIn(page, other);
  await waitForCatalogue(page);
  await page.goto('/#/exercises/barbell-bench-press');
  await expect(page.getByRole('img', { name: /^No weight history/ })).toBeVisible();
});
