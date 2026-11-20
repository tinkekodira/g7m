import { expect, test, type Page } from '@playwright/test';
import { createUser, eventually, sql } from './support/backend.js';
import { openTab, signIn, waitForCatalogue } from './support/app.js';

/**
 * Training at more than one gym (ADR-0178): name the gyms, have every
 * workout say where it was, start at the last one, and fix a wrong one from
 * the workout itself.
 */

const start = (page: Page) => page.getByRole('button', { name: /^Start a workout/ });
const chooser = (page: Page) => page.getByRole('dialog', { name: 'Start a workout', exact: true });

async function gymOf(sessionId: string): Promise<string | null> {
  const [row] = await sql<{ name: string | null }>(
    `select g.name from public.workout_sessions ws
       left join public.gyms g on g.id = ws.gym_id
      where ws.id = $1`,
    [sessionId],
  );
  return row?.name ?? null;
}

async function openSession(userId: string): Promise<string> {
  const [row] = await eventually(
    () =>
      sql<{ id: string }>(
        `select id from public.workout_sessions where user_id = $1 and ended_at is null`,
        [userId],
      ),
    (rows) => rows.length === 1,
  );
  if (row === undefined) throw new Error('No open workout');
  return row.id;
}

test('naming gyms tags past workouts, and each workout says where it was', async ({ page }) => {
  const user = await createUser('two-gyms', { onboarded: true });
  const [past] = await sql<{ id: string }>(
    `insert into public.workout_sessions (user_id, started_at, ended_at)
     values ($1, now() - interval '3 days', now() - interval '3 days' + interval '1 hour')
     returning id`,
    [user.id],
  );
  if (past === undefined) throw new Error('Missing past workout');

  await signIn(page, user);
  await waitForCatalogue(page);
  await openTab(page, 'Settings');

  // Nothing is on until the first gym has a name.
  const toggle = page.getByRole('switch', { name: /I train at more than one gym/ });
  await expect(toggle).not.toBeChecked();
  await toggle.click();
  await page.getByLabel('The gym you’ve trained at so far').fill('  Iron   Works ');
  await page.getByRole('button', { name: 'Save gym', exact: true }).click();
  await expect(page.getByRole('list', { name: 'Your gyms' })).toContainText('Iron Works');
  await expect(toggle).toBeChecked();
  await eventually(
    () => gymOf(past.id),
    (name) => name === 'Iron Works',
  );

  await page.getByLabel('Add a gym').fill('City Gym');
  await page.getByRole('button', { name: 'Add gym', exact: true }).click();
  await expect(page.getByRole('list', { name: 'Your gyms' })).toContainText('City Gym');

  // The start dialog offers both, with the last one used already chosen.
  await openTab(page, 'Home');
  await start(page).click();
  const where = chooser(page).getByRole('group', { name: 'Where are you training?' });
  await expect(where.getByRole('button', { name: 'Iron Works' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await where.getByRole('button', { name: 'City Gym' }).click();
  await expect(where.getByRole('button', { name: 'City Gym' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await chooser(page).getByRole('button', { name: 'Start a blank workout', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Finish workout' })).toBeVisible();

  const session = await openSession(user.id);
  await eventually(
    () => gymOf(session),
    (name) => name === 'City Gym',
  );

  // Walked into the other one: fixed from the workout's own header.
  await page.getByRole('button', { name: /City Gym, change gym/ }).click();
  const sheet = page.getByRole('dialog', { name: 'Where are you training?' });
  await sheet.getByRole('button', { name: 'Iron Works' }).click();
  await expect(sheet).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Iron Works, change gym/ })).toBeVisible();
  await eventually(
    () => gymOf(session),
    (name) => name === 'Iron Works',
  );
});

test('somebody with one gym is never asked', async ({ page }) => {
  const user = await createUser('one-gym', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);
  await start(page).click();
  await expect(chooser(page)).toBeVisible();
  await expect(chooser(page).getByRole('group', { name: 'Where are you training?' })).toHaveCount(
    0,
  );
  await chooser(page).getByRole('button', { name: 'Start a blank workout', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Finish workout' })).toBeVisible();
  await expect(page.getByRole('button', { name: /change gym/ })).toHaveCount(0);
  const session = await openSession(user.id);
  expect(await gymOf(session)).toBeNull();
});
