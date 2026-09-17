import { expect, test } from '@playwright/test';
import { createUser, eventually, sql } from './support/backend.js';
import {
  finishAndKeepAsRoutine,
  finishWorkout,
  logSet,
  openTab,
  signIn,
  startWith,
  waitForCatalogue,
} from './support/app.js';

/**
 * Routines: saved on the way out of a workout, started again in one tap.
 *
 * The tables have been in the schema since the first migration with nothing to
 * fill them. These are the paths that fill and use them.
 */

test('a finished workout is kept as a routine and started again', async ({ page }) => {
  const user = await createUser('routine-save', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);

  await startWith(page, 'Barbell Bench Press');
  await logSet(page, 1, '60', '8');
  await logSet(page, 2, '60', '6');
  await finishAndKeepAsRoutine(page, 'Push Day');

  // It reaches the server, with the shape of what was actually trained: two
  // working sets, six to eight reps.
  const saved = await eventually(
    () =>
      sql<{ name: string; target_sets: number; target_rep_low: number; target_rep_high: number }>(
        `select r.name, re.target_sets, re.target_rep_low, re.target_rep_high
           from public.routines r
           join public.routine_exercises re on re.routine_id = r.id
          where r.user_id = $1`,
        [user.id],
      ),
    (rows) => rows.length === 1,
  );
  expect(saved[0]?.name).toBe('Push Day');
  expect(saved[0]?.target_sets).toBe(2);
  expect(saved[0]?.target_rep_low).toBe(6);
  expect(saved[0]?.target_rep_high).toBe(8);

  // Starting it writes the workout out in full, at the weight last lifted —
  // the routine holds no weights of its own.
  await page.getByRole('button', { name: 'Start Push Day' }).click();
  await expect(page.getByRole('heading', { name: 'Barbell Bench Press' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Weight' }).first()).toHaveValue('60.0');
  await expect(page.getByRole('button', { name: 'Complete set 2' })).toBeVisible();
});

/**
 * The quick access swap Milan asked for: the 3D model tile gives up its place
 * once there is a routine to put there, because the model has a tab of its own
 * and a saved routine does not.
 */
test('the home tile becomes the routines once one is saved', async ({ page }) => {
  const user = await createUser('routine-tile', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);

  await expect(page.getByRole('link', { name: /3D model/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Your routines/ })).toHaveCount(0);

  await startWith(page, 'Barbell Bench Press');
  await logSet(page, 1, '60', '8');
  await finishAndKeepAsRoutine(page, 'Bench Day');

  await openTab(page, 'Home');
  await expect(page.getByRole('link', { name: /Your routines/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /3D model/ })).toHaveCount(0);

  // And Profile links to them whether or not Home does.
  await openTab(page, 'Profile');
  await expect(page.getByRole('link', { name: /Your routines/ })).toBeVisible();
});

test('a routine can be built from scratch, reordered and deleted', async ({ page }) => {
  const user = await createUser('routine-edit', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);

  await openTab(page, 'Profile');
  await page.getByRole('link', { name: /Your routines/ }).click();
  await page.getByRole('button', { name: /Build a routine from scratch/ }).click();
  await page.getByLabel('Name').fill('Leg Day');
  await page.getByRole('button', { name: 'Create', exact: true }).click();

  // Empty, so add two movements from the library.
  for (const exercise of ['Barbell Back Squat', 'Barbell Bench Press']) {
    await page.getByRole('link', { name: '+ Add an exercise' }).click();
    await page.getByLabel('Search').fill(exercise);
    await page.getByRole('button', { name: new RegExp(`^${exercise}`) }).click();
    await expect(page.getByText(exercise)).toBeVisible();
  }

  const names = page.getByRole('listitem').getByText(/Barbell/);
  await expect(names.first()).toContainText('Back Squat');

  // One press writes one row, and the order changes.
  await page.getByRole('button', { name: /Move Barbell Bench Press up/ }).click();
  await expect(names.first()).toContainText('Bench Press');

  page.on('dialog', (dialog) => void dialog.accept());
  await page.getByRole('button', { name: /Delete this routine/ }).click();
  await expect(page.getByRole('heading', { name: 'Your routines' })).toBeVisible();
  await expect(page.getByText('Nothing saved yet')).toBeVisible();
});

/**
 * A workout that was not kept on the way out can still be kept later, from its
 * own page — the session somebody said "not this one" to and then trained
 * twice more.
 */
test('a past workout can be saved as a routine from its page', async ({ page }) => {
  const user = await createUser('routine-past', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);

  await startWith(page, 'Barbell Bench Press');
  await logSet(page, 1, '80', '5');
  await finishWorkout(page);

  await openTab(page, 'Progress');
  await page
    .getByRole('link', { name: /Workout/ })
    .first()
    .click();
  await page.getByRole('button', { name: 'Save as a routine' }).click();
  await page.getByLabel('Routine name').fill('Heavy Bench');
  await page.getByRole('button', { name: 'Save', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Your routines' })).toBeVisible();
  await expect(page.getByText('Heavy Bench')).toBeVisible();
});
