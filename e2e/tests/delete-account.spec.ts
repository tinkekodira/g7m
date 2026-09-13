import { expect, test, type Page } from '@playwright/test';
import { createUser, outage, sql, type TestUser } from './support/backend.js';
import {
  finishWorkout,
  logSet,
  openTab,
  signIn,
  startWith,
  waitForCatalogue,
} from './support/app.js';

/**
 * "Delete your account": everything, from the server and from this phone, or
 * nothing, anywhere. ADR-0065.
 *
 * Checked on both sides. On the server: the auth user and every row it owned
 * are gone, and nobody else's are. On the phone: the local database is empty
 * and forgets whose it was, so the next account to sign in here starts clean.
 */

/** Every row in every user table that belongs to `user`, counted on the server. */
async function rowsOnServer(user: TestUser): Promise<number> {
  const [row] = await sql<{ n: number }>(
    `select (select count(*) from auth.users where id = $1)
          + (select count(*) from public.profiles where user_id = $1)
          + (select count(*) from public.workout_sessions where user_id = $1)
          + (select count(*) from public.session_exercises where user_id = $1)
          + (select count(*) from public.session_sets where user_id = $1)
          + (select count(*) from public.body_metrics where user_id = $1)
          + (select count(*) from public.training_goals where user_id = $1) as n`,
    [user.id],
  );
  return Number(row?.n ?? -1);
}

async function openDeletion(page: Page): Promise<void> {
  await openTab(page, 'Settings');
  await page.getByRole('button', { name: 'Delete my account…' }).click();
}

const DELETE_FOR_GOOD = { name: 'Delete my account for good' } as const;

test('deleting an account removes it from the server and from the phone', async ({ page }) => {
  const leaving = await createUser('leaving', { onboarded: true });
  const staying = await createUser('staying', { onboarded: true });
  await sql(`insert into public.body_metrics (user_id, weight_kg) values ($1, 70)`, [staying.id]);

  await signIn(page, leaving);
  await startWith(page, 'Barbell Bench Press');
  await logSet(page, 1, '60', '10');
  await finishWorkout(page);
  await expect.poll(() => rowsOnServer(leaving)).toBeGreaterThan(4);
  const before = await rowsOnServer(staying);

  await openDeletion(page);
  // Nothing happens until the word is typed.
  await expect(page.getByRole('button', DELETE_FOR_GOOD)).toBeDisabled();
  await page.getByLabel('Type DELETE to confirm').fill('delete');
  await page.getByRole('button', DELETE_FOR_GOOD).click();

  // Signed out, told so, on the sign-in screen.
  await expect(page.getByText(/Your account has been deleted/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();

  // Gone from the server, and only this account.
  expect(await rowsOnServer(leaving)).toBe(0);
  expect(await rowsOnServer(staying)).toBe(before);

  // The phone forgot whose database it was...
  expect(await page.evaluate(() => localStorage.getItem('g7m.database-owner'))).toBeNull();

  // ...and signing in again is refused: there is no such account any more.
  await page.getByLabel('Email').fill(leaving.email);
  await page.getByLabel('Password').fill(leaving.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByText(/email and password do not match/)).toBeVisible();

  // The next account on this phone starts on an empty device.
  await signIn(page, staying);
  await openTab(page, 'Progress');
  await expect(page.getByText(/Nothing here yet/)).toBeVisible();
});

test('without a connection nothing is deleted, and it works once there is one', async ({
  page,
}) => {
  const user = await createUser('delete-offline', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);
  const rows = await rowsOnServer(user);

  await openDeletion(page);
  await page.getByLabel('Type DELETE to confirm').fill('DELETE');

  await outage(true);
  try {
    await page.getByRole('button', DELETE_FOR_GOOD).click();
    await expect(page.getByText(/nothing was deleted/i)).toBeVisible();
  } finally {
    await outage(false);
  }
  // Still signed in, still all there.
  expect(await rowsOnServer(user)).toBe(rows);
  await expect(page.getByRole('navigation')).toBeVisible();

  // Tried again with a connection, it goes through.
  await page.getByRole('button', DELETE_FOR_GOOD).click();
  await expect(page.getByText(/Your account has been deleted/)).toBeVisible();
  expect(await rowsOnServer(user)).toBe(0);
});
