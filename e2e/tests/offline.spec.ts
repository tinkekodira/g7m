import { expect, test } from '@playwright/test';
import { createUser, eventually, outage, sql } from './support/backend.js';
import {
  finishWorkout,
  logSet,
  openTab,
  signIn,
  startWith,
  waitForCatalogue,
} from './support/app.js';

/**
 * Training in a basement.
 *
 * The app is offline-first: a set is written to the phone the moment it is
 * ticked, and the server is caught up with whenever there is one to reach.
 * Here the server goes away mid-workout — every request drops, as with no
 * signal — the workout is finished anyway, and nothing reaches Postgres until
 * it comes back. Then all of it does.
 */
test('a workout logged with no connection is uploaded once there is one', async ({ page }) => {
  const user = await createUser('offline', { onboarded: true });
  await signIn(page, user);
  // Online long enough to have the exercises, as any phone that has been used.
  await waitForCatalogue(page);

  await outage(true);
  try {
    await startWith(page, 'Barbell Bench Press');
    await logSet(page, 1, '100', '3');
    await logSet(page, 2, '100', '3');
    await finishWorkout(page);

    // The phone has it, while the server has nothing at all.
    await openTab(page, 'Progress');
    await expect(page.getByText('Recent workouts')).toBeVisible();
    const [during] = await sql<{ n: number }>(
      `select count(*)::int as n from public.workout_sessions where user_id = $1`,
      [user.id],
    );
    expect(during?.n).toBe(0);
  } finally {
    await outage(false);
  }

  // Back online, without anyone touching anything: the queue drains.
  const sets = await eventually(
    () =>
      sql<{ n: number }>(
        `select count(*)::int as n from public.session_sets
          where user_id = $1 and is_completed`,
        [user.id],
      ),
    (rows) => rows[0]?.n === 2,
    45_000,
  );
  expect(sets[0]?.n).toBe(2);
});
