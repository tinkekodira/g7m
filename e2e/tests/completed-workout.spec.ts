import { expect, test } from '@playwright/test';
import { createUser, eventually, sql } from './support/backend.js';
import { finishWorkout, logSet, signIn, startWith, waitForCatalogue } from './support/app.js';

test.use({ deviceScaleFactor: 1 });

test('calendar opens the exercise log and corrections persist offline without reopening the workout', async ({
  page,
  context,
}, info) => {
  test.setTimeout(120_000);
  const user = await createUser('workout-corrections', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);
  await startWith(page, 'Barbell Bench Press');
  await logSet(page, 1, '60', '8');
  await finishWorkout(page);
  const [finished] = await eventually(
    () =>
      sql<{ id: string; ended_at: string }>(
        'select id, ended_at from public.workout_sessions where user_id = $1 and ended_at is not null',
        [user.id],
      ),
    (rows) => rows.length === 1,
  );
  if (finished === undefined) throw new Error('No completed workout');

  // Editing an earlier session must never add forgotten exercises to the live one.
  await startWith(page, 'Dumbbell Curl');
  await page.goto('/#/calendar');
  await page.getByRole('link', { name: 'Open the workout', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${finished.id}/details`));
  await expect(
    page.getByRole('heading', { name: 'Barbell Bench Press', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('60 kg', { exact: false }).last()).toBeVisible();
  await expect(page.getByRole('region', { name: 'Workout recap', exact: true })).toBeHidden();
  await expect(page.getByRole('link', { name: 'Edit workout', exact: true })).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await context.setOffline(true);
  await expect(page.locator('[data-achievement-banner]')).toBeHidden();

  for (const width of [360, 1280])
    for (const theme of ['dark', 'light']) {
      await page.setViewportSize({ width, height: 850 });
      await page.evaluate((value) => {
        document.documentElement.dataset['theme'] = value;
      }, theme);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.screenshot({
        path: info.outputPath(`details-${String(width)}-${theme}.png`),
        fullPage: true,
      });
    }
  await page.getByRole('link', { name: 'Edit workout', exact: true }).click();
  await page.getByRole('textbox', { name: /^Weight/ }).fill('70');
  await page.getByRole('textbox', { name: 'Reps', exact: true }).fill('10');
  await page.getByRole('button', { name: 'Save set 1', exact: true }).click();
  await page.getByRole('button', { name: 'Add set', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Complete set 2', exact: true })).toBeVisible();
  await page
    .getByRole('textbox', { name: /^Weight/ })
    .last()
    .fill('65');
  await page.getByRole('textbox', { name: 'Reps', exact: true }).last().fill('9');
  await page.getByRole('button', { name: 'Complete set 2', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Save set 2', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Delete', exact: true }).nth(1).click();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();

  await page.getByRole('link', { name: '+ Add an exercise', exact: true }).click();
  await page.getByLabel('Search').fill('Cable Fly');
  await expect(page).toHaveURL(new RegExp(`session=${finished.id}`));
  await page.getByRole('button', { name: /^Cable Fly/ }).click();
  await expect(page).toHaveURL(new RegExp(`/workout/${finished.id}`));
  const cable = page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: 'Cable Fly', exact: true }) });
  await cable.getByRole('button', { name: 'Add set', exact: true }).click();
  await cable.getByRole('textbox', { name: /^Weight/ }).fill('20');
  await cable.getByRole('textbox', { name: 'Reps', exact: true }).fill('12');
  await cable.getByRole('button', { name: 'Complete set 1', exact: true }).click();
  await expect(cable.getByRole('button', { name: 'Save set 1', exact: true })).toBeVisible();
  await expect(page.locator('[data-achievement-banner]')).toBeHidden();

  for (const width of [360, 1280])
    for (const theme of ['dark', 'light']) {
      await page.setViewportSize({ width, height: 850 });
      await page.evaluate((value) => {
        document.documentElement.dataset['theme'] = value;
      }, theme);
      await page.evaluate(() => window.scrollTo(0, 0));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.screenshot({
        path: info.outputPath(`editor-${String(width)}-${theme}.png`),
        fullPage: true,
      });
    }
  await page.getByRole('button', { name: 'Done editing', exact: true }).click();
  await expect(page.getByText('70 kg × 10', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Cable Fly', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('70 kg × 10', { exact: true })).toBeVisible();
  await expect(page.getByText('20 kg × 12', { exact: true })).toBeVisible();
  await context.setOffline(false);
  const rows = await eventually(
    () =>
      sql<{ weight_kg: number; reps: number; completed_at: string }>(
        `select ss.weight_kg::float8 weight_kg, ss.reps, ss.completed_at from public.session_sets ss join public.session_exercises se on se.id = ss.session_exercise_id where se.session_id = $1 order by ss.weight_kg`,
        [finished.id],
      ),
    // The delete/undo and new exercise upload separately. Three rows can be an
    // intermediate state before the Cable Fly set has reached the server.
    (sets) =>
      sets.length === 3 &&
      sets[0]?.weight_kg === 20 &&
      sets[0].reps === 12 &&
      sets[1]?.weight_kg === 65 &&
      sets[1].reps === 9 &&
      sets[2]?.weight_kg === 70 &&
      sets[2].reps === 10,
  );
  expect(rows.find((row) => row.weight_kg === 20)?.completed_at).toBe(finished.ended_at);
  expect(rows.map((row) => [row.weight_kg, row.reps])).toEqual([
    [20, 12],
    [65, 9],
    [70, 10],
  ]);
  const sessions = await sql<{ ended_at: string | null }>(
    'select ended_at from public.workout_sessions where user_id = $1',
    [user.id],
  );
  expect(sessions.filter((s) => s.ended_at === null)).toHaveLength(1);
  expect(sessions.filter((s) => s.ended_at !== null).map((s) => s.ended_at)).toEqual([
    finished.ended_at,
  ]);

  // A picker left open across the deadline must refuse the write as well.
  await page.getByRole('link', { name: 'Edit workout', exact: true }).click();
  await page.getByRole('link', { name: '+ Add an exercise', exact: true }).click();
  await page.clock.setFixedTime(
    new Date(new Date(finished.ended_at).getTime() + 2 * 60 * 60 * 1000),
  );
  await page.getByLabel('Search').fill('Plank');
  await page.getByRole('button', { name: /^Plank/ }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByRole('link', { name: 'Back', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Editing closed', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Workout details', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Edit workout', exact: true })).toBeHidden();
  await expect(page.getByText('Editing closed 2 hours after completion.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Cable Fly', exact: true })).toBeVisible();
  expect(
    await sql('select id from public.session_exercises where session_id = $1', [finished.id]),
  ).toHaveLength(2);
});
