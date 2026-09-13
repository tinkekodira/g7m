import { expect, test, type Page } from '@playwright/test';
import { createUser, eventually, sql, type TestUser } from './support/backend.js';
import { finishWorkout, logSet, openTab, signIn, signOut, startWith } from './support/app.js';

/**
 * One phone, two accounts.
 *
 * The local database is one file and PowerSync's upload queue is one queue,
 * whoever is signed in. Sign-out and sign-in between accounts have lost
 * training before — a set queued as one account, uploaded under the next,
 * refused by row level security and discarded (ADR-0036 and the handover in
 * `database.ts`). This is that sequence, end to end.
 */

async function finishedSessions(user: TestUser): Promise<number> {
  const [row] = await sql<{ n: number }>(
    `select count(*)::int as n from public.workout_sessions
      where user_id = $1 and ended_at is not null`,
    [user.id],
  );
  return row?.n ?? 0;
}

async function expectNoWorkouts(page: Page): Promise<void> {
  await openTab(page, 'Progress');
  await expect(page.getByText(/Nothing here yet/)).toBeVisible();
}

test('each account sees its own training, and gets it back after signing out', async ({ page }) => {
  const first = await createUser('first', { onboarded: true, displayName: 'First' });
  const second = await createUser('second', { onboarded: true, displayName: 'Second' });

  // The first account logs a workout and it reaches the server.
  await signIn(page, first);
  await startWith(page, 'Barbell Bench Press');
  await logSet(page, 1, '80', '5');
  await finishWorkout(page);
  await eventually(
    () => finishedSessions(first),
    (n) => n === 1,
  );
  await signOut(page);

  // The second account, on the same phone, sees none of it.
  await signIn(page, second);
  await expectNoWorkouts(page);
  expect(await finishedSessions(second)).toBe(0);
  await signOut(page);

  // The first account comes back and its workout comes back with it — from
  // the server, because signing out cleared this device.
  await signIn(page, first);
  await openTab(page, 'Progress');
  await expect(page.getByText('Recent workouts')).toBeVisible();
  expect(await finishedSessions(first)).toBe(1);
});
