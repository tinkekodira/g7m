import { expect, test, type Page } from '@playwright/test';
import { createUser, eventually, sql } from './support/backend.js';
import { finishWorkout, logSet, signIn, startWith } from './support/app.js';

/**
 * Numbers a set may hold, and numbers asked about before they count. ADR-0182.
 *
 * A slipped zero used to be ticked straight into a personal record, a stack of
 * achievements and first place on the friends leaderboard; a set of nothing
 * counted as a working set; and 10000 kg was saved on the phone, refused by
 * the server for good, and replaced by the server's older number.
 */

async function typeSet(page: Page, weight: string, reps: string): Promise<void> {
  await page.getByRole('button', { name: 'Add set' }).click();
  await page.getByRole('textbox', { name: 'Weight' }).last().fill(weight);
  await page.getByRole('textbox', { name: 'Reps' }).last().fill(reps);
}

function setWeights(userId: string): Promise<{ weight_kg: string; is_completed: boolean }[]> {
  return sql<{ weight_kg: string; is_completed: boolean }>(
    `select ss.weight_kg::text as weight_kg, ss.is_completed
       from public.session_sets ss
       join public.session_exercises se on se.id = ss.session_exercise_id
       join public.workout_sessions ws on ws.id = se.session_id
      where ws.user_id = $1 and ws.ended_at is null
      order by ss.order_key`,
    [userId],
  );
}

test('a slipped zero is asked about, and logged as typed only on a yes', async ({ page }) => {
  const user = await createUser('slipped-zero', { onboarded: true });
  await signIn(page, user);

  // A best to be far above.
  await startWith(page, 'Barbell Bench Press');
  await logSet(page, 1, '100', '5');
  await finishWorkout(page);

  await startWith(page, 'Barbell Bench Press');
  await typeSet(page, '1000', '5');
  await page.getByRole('button', { name: 'Complete set 1' }).click();

  const question = page.getByRole('alertdialog', { name: 'Is that right?' });
  await expect(question).toBeVisible();
  await expect(question).toContainText(/1,?000 kg is far above your best of 100 kg/);

  // "Fix it" leaves the set open with the number still in it, nothing logged.
  await question.getByRole('button', { name: 'Fix it' }).click();
  await expect(question).toBeHidden();
  await expect(page.getByRole('button', { name: 'Complete set 1' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Undo set 1' })).toHaveCount(0);

  // Fixed, it goes through without a word.
  await page.getByRole('textbox', { name: 'Weight' }).last().fill('100');
  await page.getByRole('button', { name: 'Complete set 1' }).click();
  await expect(page.getByRole('button', { name: 'Undo set 1' })).toBeVisible();
  await expect(question).toBeHidden();

  // A real jump, confirmed, is logged exactly as typed.
  await typeSet(page, '1000', '1');
  await page.getByRole('button', { name: 'Complete set 2' }).click();
  await question.getByRole('button', { name: 'Log it' }).click();
  await expect(page.getByRole('button', { name: 'Undo set 2' })).toBeVisible();

  await eventually(
    () => setWeights(user.id),
    (rows) => rows.length === 2 && rows.every((row) => row.is_completed),
  );
  expect((await setWeights(user.id)).map((row) => Number(row.weight_kg))).toEqual([100, 1000]);
});

test('a set of nothing cannot be ticked, and says why', async ({ page }) => {
  const user = await createUser('zero-reps', { onboarded: true });
  await signIn(page, user);
  await startWith(page, 'Barbell Bench Press');

  await typeSet(page, '60', '0');
  await page.getByRole('button', { name: 'Complete set 1' }).click();
  const why = page.getByRole('alert').filter({ hasText: 'Enter at least 1 rep to tick this set.' });
  await expect(why).toBeVisible();
  await expect(page.getByRole('button', { name: 'Undo set 1' })).toHaveCount(0);

  // The reason goes as soon as there is a rep to count.
  await page.getByRole('textbox', { name: 'Reps' }).last().fill('5');
  await expect(why).toBeHidden();
  await page.getByRole('button', { name: 'Complete set 1' }).click();
  await expect(page.getByRole('button', { name: 'Undo set 1' })).toBeVisible();
});

test('a weight past the limit is stored at the limit, and reaches the server', async ({ page }) => {
  const user = await createUser('weight-limit', { onboarded: true });
  await signIn(page, user);
  await startWith(page, 'Leg Press');

  // 10000 kg overflowed numeric(6,2): refused on upload, then overwritten.
  await typeSet(page, '10000', '5');
  await page.getByRole('button', { name: 'Complete set 1' }).click();
  // No history, and heavier than almost anyone lifts: asked, then logged.
  await page
    .getByRole('alertdialog', { name: 'Is that right?' })
    .getByRole('button', { name: 'Log it' })
    .click();
  await expect(page.getByRole('button', { name: 'Undo set 1' })).toBeVisible();

  await eventually(
    () => setWeights(user.id),
    (rows) => rows.length === 1 && rows[0]?.is_completed === true,
  );
  expect((await setWeights(user.id)).map((row) => Number(row.weight_kg))).toEqual([1000]);
  // And nothing was refused along the way.
  await expect(page.getByText('Some changes did not reach the server')).toHaveCount(0);
});
