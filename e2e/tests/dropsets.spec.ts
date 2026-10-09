import { expect, test } from '@playwright/test';
import { createUser, eventually, sql } from './support/backend.js';
import { finishWorkout, logSet, signIn, startWith, waitForCatalogue } from './support/app.js';

/**
 * Drop sets (ADR-0112).
 *
 * `set_type = 'dropset'` has been in the schema since the start with no way to
 * make one. This is the button: off a ticked set, a lighter row under it, no
 * rest until the last drop — and a set with its drops is one set everywhere.
 */
test('a drop comes off a ticked set, and the rest waits for the last one', async ({ page }) => {
  const user = await createUser('dropset', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);

  await startWith(page, 'Barbell Bench Press');
  await logSet(page, 1, '100', '8');
  await expect(page.getByText('Resting')).toBeVisible();

  // A fifth off, on a weight the bar can be loaded to, and no rest between.
  await page.getByRole('button', { name: 'Drop after set 1' }).click();
  await expect(page.getByRole('textbox', { name: 'Weight' })).toHaveValue('80.0');
  await expect(page.getByText('Resting')).toHaveCount(0);

  await page.getByRole('button', { name: 'Complete drop 1 of set 1' }).click();
  await expect(page.getByText('Resting')).toBeVisible();

  // And again, off the drop: 64 is not a barbell weight, 65 is.
  await page.getByRole('button', { name: 'Drop after drop' }).click();
  await expect(page.getByRole('textbox', { name: 'Weight' })).toHaveValue('65.0');
  await page.getByRole('button', { name: 'Complete drop 2 of set 1' }).click();
  await expect(page.getByRole('button', { name: 'Undo drop 2 of set 1' })).toBeVisible();

  // The next set goes back up to the set, not down to the last drop, and is
  // set two: the drops took no number.
  await page.getByRole('button', { name: 'Add set' }).click();
  await expect(page.getByRole('textbox', { name: 'Weight' })).toHaveValue('100.0');
  await expect(page.getByRole('button', { name: 'Complete set 2' })).toBeVisible();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();

  await finishWorkout(page);

  // On the server: one set, and every kilo of the drops lifted.
  const [session] = await eventually(
    () =>
      sql<{ id: string; tally: { sets: number; lifted_kg: number }[] }>(
        `select ws.id, public.board_workouts($1, now() - interval '1 day') as tally
           from public.workout_sessions ws
          where ws.user_id = $1 and ws.ended_at is not null`,
        [user.id],
      ),
    (rows) => rows.length > 0 && (rows[0]?.tally.length ?? 0) > 0,
  );
  if (session === undefined) throw new Error('The workout never reached the server');
  expect(session.tally[0]).toMatchObject({ sets: 1 });
  expect(Number(session.tally[0]?.lifted_kg)).toBe(800 + 640 + 520);

  // And in history, the drops sit under their set.
  await page.goto(`/#/progress/session/${session.id}`);
  await expect(page.getByText('Set 1', { exact: true })).toBeVisible();
  await expect(page.getByText('Drop', { exact: true })).toBeVisible();
  await expect(page.getByText('Drop 2', { exact: true })).toBeVisible();
  await expect(page.getByText('Set 2', { exact: true })).toHaveCount(0);
});

/** A percentage of "your own bodyweight" is not a weight anybody can strip off. */
test('a plain bodyweight set is offered no drop', async ({ page }) => {
  const user = await createUser('dropset-bodyweight', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);

  await startWith(page, 'Pull-Up');
  await page.getByRole('button', { name: 'Add set' }).click();
  await page.getByRole('button', { name: 'Complete set 1' }).click();
  await expect(page.getByRole('button', { name: 'Undo set 1' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Drop after/ })).toHaveCount(0);
});
