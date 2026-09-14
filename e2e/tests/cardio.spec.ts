import { expect, test } from '@playwright/test';
import { createUser, eventually, sql } from './support/backend.js';
import { finishWorkout, openTab, signIn, waitForCatalogue } from './support/app.js';

/**
 * Cardio on a machine, logged as bouts. ADR-0069.
 *
 * A treadmill in a workout like any exercise: time, distance, speed and
 * incline typed from the display, calories estimated from them and your
 * bodyweight — then a second bout carrying the first one's settings and the
 * machine's own calorie figure. Checked on the server, where each bout is a
 * set with the machine's numbers on it and no weight or reps, and on the
 * workout's own page afterwards.
 */
test('a treadmill workout is logged as bouts, with calories', async ({ page }) => {
  const user = await createUser('cardio', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);

  await page.getByRole('link', { name: /Start your own workout/ }).click();
  await page.getByRole('button', { name: 'Start a workout' }).click();
  await page.getByRole('link', { name: '+ Add an exercise' }).click();

  // Found under its own chip, not among the muscles.
  await page.getByRole('button', { name: 'Cardio', exact: true }).click();
  await page.getByRole('button', { name: /^Treadmill/ }).click();
  await expect(page.getByRole('heading', { name: 'Treadmill' })).toBeVisible();

  await page.getByRole('button', { name: 'Add bout' }).click();
  await page.getByLabel('Time').fill('30:00');
  await page.getByLabel('Distance (km)').fill('5');
  await page.getByLabel('Speed (km/h)').fill('10');
  await page.getByLabel('Incline (%)').fill('1');
  // 10 km/h at 1%, 80 kg, half an hour, by the ACSM running equation:
  // 0.2 × 166.7 + 0.9 × 166.7 × 0.01 + 3.5 = 38.33 → 15.33 kcal/min × 30.
  await expect(page.getByText(/≈ 460 kcal\. Estimated from the speed and incline/)).toBeVisible();
  await page.getByRole('button', { name: 'Complete bout 1' }).click();
  await expect(page.getByRole('button', { name: 'Undo bout 1' })).toBeVisible();

  // The next bout starts from the last one's settings; this one uses the
  // machine's own calorie count.
  await page.getByRole('button', { name: 'Add bout' }).click();
  await expect(page.getByLabel('Time').nth(1)).toHaveValue('30:00');
  await page.getByLabel('Calories').nth(1).fill('300');
  await page.getByRole('button', { name: 'Complete bout 2' }).click();
  await expect(page.getByRole('button', { name: 'Undo bout 2' })).toBeVisible();

  await finishWorkout(page);

  // On the server: two completed sets carrying the machine's numbers, with
  // nothing in weight or reps for volume or records to pick up.
  const bouts = await eventually(
    () =>
      sql<{
        duration_seconds: number;
        distance_m: number;
        speed_kmh: string;
        incline_percent: string;
        calories_kcal: number | null;
        weight_kg: string;
        reps: number;
        is_completed: boolean;
      }>(
        `select ss.duration_seconds, ss.distance_m, ss.speed_kmh, ss.incline_percent,
                ss.calories_kcal, ss.weight_kg, ss.reps, ss.is_completed
           from public.session_sets ss
           join public.session_exercises se on se.id = ss.session_exercise_id
           join public.workout_sessions ws on ws.id = se.session_id
          where ws.user_id = $1 and ws.ended_at is not null
          order by ss.order_key`,
        [user.id],
      ),
    (rows) => rows.length === 2 && rows.every((row) => row.is_completed),
  );
  expect(
    bouts.map((row) => ({
      duration: row.duration_seconds,
      distance: row.distance_m,
      speed: Number(row.speed_kmh),
      incline: Number(row.incline_percent),
      calories: row.calories_kcal,
      weight: Number(row.weight_kg),
      reps: row.reps,
    })),
  ).toEqual([
    { duration: 1800, distance: 5000, speed: 10, incline: 1, calories: null, weight: 0, reps: 0 },
    { duration: 1800, distance: 5000, speed: 10, incline: 1, calories: 300, weight: 0, reps: 0 },
  ]);

  // On Progress: this week's cardio — an hour on the treadmill, 10 km, and
  // the two bouts' calories (the estimate and the machine's figure).
  await openTab(page, 'Progress');
  const cardio = page.locator('section', { has: page.getByRole('heading', { name: 'Cardio' }) });
  await expect(cardio.getByText('1h', { exact: true })).toBeVisible();
  await expect(cardio.getByText('10 km')).toBeVisible();
  await expect(cardio.getByText('≈ 760 kcal')).toBeVisible();

  // On the workout's page: bouts in the display's words, cardio totals, and
  // no lifting numbers for a workout that had no lifting.
  await page
    .getByRole('link', { name: /Workout/ })
    .first()
    .click();
  await expect(page.getByText('30:00 · 5 km · 6:00 /km · ≈ 460 kcal')).toBeVisible();
  await expect(page.getByText('30:00 · 5 km · 6:00 /km · 300 kcal')).toBeVisible();
  await expect(page.getByText('1:00:00')).toBeVisible();
  await expect(page.getByText('760 kcal')).toBeVisible();
  await expect(page.getByText('Volume')).toHaveCount(0);
});
