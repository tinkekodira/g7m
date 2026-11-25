import { expect, test } from '@playwright/test';
import { createUser, eventually, sql } from './support/backend.js';
import { logSet, signIn } from './support/app.js';

/**
 * A workout logged afterwards is given its time on the recap (ADR-0193): the
 * recap stops saying "Not recorded", the calendar shows when it started, and
 * the server holds the start, the end and the sets spread between them.
 */
for (const viewport of [
  { width: 390, height: 844 },
  { width: 1280, height: 900 },
]) {
  test(`a past workout takes its time from the recap (${String(viewport.width)} px)`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    const user = await createUser('past-time', { onboarded: true });
    await signIn(page, user);

    await page.getByRole('link', { name: /Calendar/ }).click();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (yesterday.getMonth() !== new Date().getMonth()) {
      await page.getByRole('button', { name: /Previous month/ }).click();
    }
    const title = yesterday.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    await page.getByRole('button', { name: new RegExp(`^${title},`) }).click();
    await page.getByRole('button', { name: /Log a workout for this day/ }).click();
    await page.getByRole('link', { name: '+ Add an exercise' }).click();
    await page.getByLabel('Search').fill('Barbell Bench Press');
    await page.getByRole('button', { name: /^Barbell Bench Press/ }).click();
    await logSet(page, 1, '70', '5');
    await logSet(page, 2, '70', '5');
    await page.getByRole('button', { name: 'Finish workout' }).click();

    await expect(page.getByRole('heading', { name: 'Workout saved', exact: true })).toBeVisible();
    await expect(page.getByText('Not recorded', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Add the time' }).click();

    const sheet = page.getByRole('dialog', { name: 'When was this workout?' });
    await expect(sheet).toBeFocused();
    // Nothing guessed: both fields are asked for.
    await sheet.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(sheet.getByText('Pick when it started.')).toBeVisible();
    await sheet.getByLabel('Started at').fill('17:30');
    await sheet.getByLabel('How long (minutes)').fill('900');
    await sheet.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(sheet.getByText('Between 1 and 600 minutes.')).toBeVisible();
    await sheet.getByLabel('How long (minutes)').fill('56');
    await page.screenshot({ path: testInfo.outputPath('sheet.png') });
    await sheet.getByRole('button', { name: 'Save', exact: true }).click();

    await expect(sheet).toBeHidden();
    await expect(page.getByText('56:00', { exact: true })).toBeVisible();
    await expect(page.getByText('Not recorded', { exact: true })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Change the time' })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('recap.png') });

    // Reopened, it shows what was given.
    await page.getByRole('button', { name: 'Change the time' }).click();
    await expect(sheet.getByLabel('Started at')).toHaveValue('17:30');
    await expect(sheet.getByLabel('How long (minutes)')).toHaveValue('56');
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();

    await page.getByRole('link', { name: /^(Done|Continue)$/ }).click();
    await expect(page.getByText('Logged afterwards')).toBeHidden();
    await expect(page.getByText(/56 min/)).toBeVisible();

    const start = new Date(yesterday);
    start.setHours(17, 30, 0, 0);
    const [session] = await eventually(
      () =>
        sql<{ started: string; ended: string; first: string; last: string }>(
          `select ws.started_at as started, ws.ended_at as ended,
                  min(ss.completed_at) as first, max(ss.completed_at) as last
             from public.workout_sessions ws
             join public.session_exercises se on se.session_id = ws.id
             join public.session_sets ss on ss.session_exercise_id = se.id
            where ws.user_id = $1
            group by ws.id`,
          [user.id],
        ),
      (rows) =>
        rows.length === 1 && new Date(rows[0]?.ended ?? 0) > new Date(rows[0]?.started ?? 0),
    );
    expect(new Date(session?.started ?? '').toISOString()).toBe(start.toISOString());
    const end = new Date(start.getTime() + 56 * 60_000).toISOString();
    expect(new Date(session?.ended ?? '').toISOString()).toBe(end);
    expect(new Date(session?.first ?? '').toISOString()).toBe(start.toISOString());
    expect(new Date(session?.last ?? '').toISOString()).toBe(end);
  });
}

/**
 * Where the lifter actually looks (ADR-0194): the Past workout screen while
 * logging, and the workout's page from the calendar afterwards.
 */
test('the time can be given while logging, and changed from the calendar', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const user = await createUser('past-time-logging', { onboarded: true });
  await signIn(page, user);

  await page.getByRole('link', { name: /Calendar/ }).click();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (yesterday.getMonth() !== new Date().getMonth()) {
    await page.getByRole('button', { name: /Previous month/ }).click();
  }
  const title = yesterday.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  await page.getByRole('button', { name: new RegExp(`^${title},`) }).click();
  await page.getByRole('button', { name: /Log a workout for this day/ }).click();
  await expect(page.getByText('Past workout')).toBeVisible();

  // Under the gym, before anything is logged.
  await page.getByRole('button', { name: 'Add the time' }).click();
  const sheet = page.getByRole('dialog', { name: 'When was this workout?' });
  await sheet.getByLabel('Started at').fill('07:15');
  await sheet.getByLabel('How long (minutes)').fill('45');
  await sheet.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(sheet).toBeHidden();
  const row = page.getByRole('button', { name: /^Change the time: .*45 min$/ });
  await expect(row).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('logging.png') });

  // Kept across a reload while the workout is still open.
  await page.reload();
  await expect(row).toBeVisible();

  await page.getByRole('link', { name: '+ Add an exercise' }).click();
  await page.getByLabel('Search').fill('Barbell Bench Press');
  await page.getByRole('button', { name: /^Barbell Bench Press/ }).click();
  await logSet(page, 1, '70', '5');
  await logSet(page, 2, '70', '5');
  await page.getByRole('button', { name: 'Finish workout' }).click();

  // Applied on Finish: the recap already has it.
  await expect(page.getByRole('heading', { name: 'Workout saved', exact: true })).toBeVisible();
  await expect(page.getByText('45:00', { exact: true })).toBeVisible();
  await expect(page.getByText('Not recorded', { exact: true })).toBeHidden();
  await page.getByRole('link', { name: /^(Done|Continue)$/ }).click();
  await expect(page.getByText(/45 min/)).toBeVisible();

  // From the calendar: the workout's page offers to change it.
  await page.getByRole('link', { name: /Open the workout/ }).click();
  await page.getByRole('button', { name: 'Change the time' }).click();
  await expect(sheet.getByLabel('Started at')).toHaveValue('07:15');
  await expect(sheet.getByLabel('How long (minutes)')).toHaveValue('45');
  await sheet.getByLabel('How long (minutes)').fill('50');
  await sheet.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(sheet).toBeHidden();
  // The page reads the new length at once.
  await expect(page.getByText('50 min', { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('details.png') });

  const start = new Date(yesterday);
  start.setHours(7, 15, 0, 0);
  const end = new Date(start.getTime() + 50 * 60_000).toISOString();
  const [session] = await eventually(
    () =>
      sql<{ started: string; ended: string }>(
        `select started_at as started, ended_at as ended
           from public.workout_sessions where user_id = $1`,
        [user.id],
      ),
    (rows) => rows.length === 1 && new Date(rows[0]?.ended ?? 0).toISOString() === end,
  );
  expect(new Date(session?.started ?? '').toISOString()).toBe(start.toISOString());
});
