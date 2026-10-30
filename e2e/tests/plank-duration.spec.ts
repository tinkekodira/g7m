import { expect, test } from '@playwright/test';
import { createUser, eventually, sql } from './support/backend.js';
import { signIn, startWith } from './support/app.js';

test('plank logs seconds or minutes with optional weight, including offline', async ({
  page,
  context,
}, info) => {
  const user = await createUser('plank-duration', { onboarded: true });
  await signIn(page, user);
  await startWith(page, 'Plank');
  await page.getByRole('button', { name: 'Add set', exact: true }).click();
  const card = page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: 'Plank', exact: true }) });
  await expect(card.getByRole('textbox', { name: 'Reps', exact: true })).toHaveCount(0);
  await card.getByRole('textbox', { name: 'Seconds', exact: true }).fill('90');
  const format = card.getByRole('radiogroup', { name: 'Set 1 duration format' });
  await format.getByRole('radio', { name: 'Min + sec', exact: true }).click();
  await expect(card.getByRole('textbox', { name: 'Minutes', exact: true })).toHaveValue('1');
  await expect(card.getByRole('textbox', { name: 'Seconds', exact: true })).toHaveValue('30');
  await card.getByRole('textbox', { name: 'Minutes', exact: true }).fill('2');
  await card.getByRole('textbox', { name: 'Seconds', exact: true }).fill('15');
  await format.getByRole('radio', { name: 'Seconds', exact: true }).click();
  await expect(card.getByRole('textbox', { name: 'Seconds', exact: true })).toHaveValue('135');
  await format.getByRole('radio', { name: 'Min + sec', exact: true }).click();
  await card.getByRole('radio', { name: 'Added weight', exact: true }).click();
  await card.getByRole('textbox', { name: /^Added/ }).fill('10');

  for (const width of [320, 1280]) {
    for (const theme of ['dark', 'light']) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate((value) => {
        document.documentElement.dataset['theme'] = value;
      }, theme);
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
        .toBe(true);
      await card.screenshot({ path: info.outputPath(`plank-${String(width)}-${theme}.png`) });
    }
  }
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await context.setOffline(true);
  await card.getByRole('button', { name: 'Complete set 1', exact: true }).click();
  await expect(card).toContainText('+10 kg × 135 s');
  await expect(card).not.toContainText('how many more');
  await page.reload();
  await expect(card).toContainText('+10 kg × 135 s');
  await card.getByRole('button', { name: 'Undo set 1', exact: true }).click();
  await expect(card.getByRole('textbox', { name: 'Seconds', exact: true })).toHaveValue('135');
  await card.getByRole('radio', { name: 'Bodyweight', exact: true }).click();
  await expect(card.getByRole('textbox', { name: /^Added/ })).toHaveCount(0);
  await card.getByRole('textbox', { name: 'Seconds', exact: true }).fill('45');
  await card.getByRole('button', { name: 'Complete set 1', exact: true }).click();
  await expect(card).toContainText('45 s');
  await context.setOffline(false);
  const rows = await eventually(
    () =>
      sql<{ reps: number; weight_kg: string; load_type: string }>(
        `select ss.reps, ss.weight_kg, ss.load_type from public.session_sets ss
     join public.session_exercises se on se.id = ss.session_exercise_id
     join public.workout_sessions ws on ws.id = se.session_id
     where ws.user_id = $1 and ss.is_completed`,
        [user.id],
      ),
    (sets) => sets.length === 1 && sets[0]?.reps === 45 && sets[0]?.load_type === 'bodyweight',
  );
  expect(Number(rows[0]?.weight_kg)).toBe(0);
});
