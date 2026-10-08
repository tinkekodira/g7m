import { expect, test, type Page } from '@playwright/test';
import { createUser, sql } from './support/backend.js';
import { finishWorkout, logSet, openTab, signIn, startWith } from './support/app.js';

/**
 * The friends leaderboard (ADR-0106), from the side of somebody chasing.
 *
 * Riley won last week and has a set in already this week; Morgan, signed in,
 * is a set behind. Morgan trains and goes top — before the workout has had
 * time to upload, because your own row is read from the phone.
 *
 * Riley's history is written straight into the server: a workout last week is
 * something the app can only be told about afterwards, and how Riley's phone
 * uploads is the friends test's business, not this one's.
 */

async function rileyTrained(userId: string, startedAt: Date): Promise<void> {
  const [session] = await sql<{ id: string }>(
    `insert into public.workout_sessions (user_id, started_at, ended_at)
     values ($1, $2, $2::timestamptz + interval '40 minutes') returning id`,
    [userId, startedAt.toISOString()],
  );
  const [slot] = await sql<{ id: string }>(
    `insert into public.session_exercises (user_id, session_id, exercise_id, order_key)
     values ($1, $2, (select id from public.exercises where slug = 'barbell-bench-press'), 'a0')
     returning id`,
    [userId, session?.id],
  );
  await sql(
    `insert into public.session_sets
       (user_id, session_exercise_id, order_key, set_type, weight_kg, reps,
        is_completed, completed_at)
     values ($1, $2, 'a0', 'working', 80, 5, true, $3)`,
    [userId, slot?.id, startedAt.toISOString()],
  );
}

async function openBoard(page: Page): Promise<void> {
  await openTab(page, 'Friends');
  await page.getByRole('tab', { name: 'Leaderboard' }).click();
  await page.getByRole('radio', { name: 'Sets' }).click();
}

test('the leaderboard: a set behind last week’s winner, then a set ahead', async ({ page }) => {
  test.setTimeout(120_000);
  const morgan = await createUser('board-morgan', { onboarded: true, displayName: 'Morgan' });
  const riley = await createUser('board-riley', { onboarded: true, displayName: 'Riley' });
  await sql(
    `insert into public.friendships (requester_id, addressee_id, status, responded_at)
     values ($1, $2, 'accepted', now())`,
    [riley.id, morgan.id],
  );
  // The same moment a week ago is always last week, whatever day the week starts on.
  await rileyTrained(riley.id, new Date(Date.now() - 7 * 86_400_000));
  await rileyTrained(riley.id, new Date(Date.now() - 60_000));

  await signIn(page, morgan);
  await openBoard(page);
  await expect(page.getByRole('link', { name: '1st, Riley: 1 set. Won last week' })).toBeVisible();
  await expect(page.getByText('1 set behind Riley', { exact: true })).toBeVisible();

  await openTab(page, 'Home');
  await startWith(page, 'Barbell Bench Press');
  await logSet(page, 1, '60', '5');
  await logSet(page, 2, '60', '5');
  await finishWorkout(page);

  await openBoard(page);
  await expect(page.getByText('1 set ahead of Riley', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: '2nd, Riley: 1 set. Won last week' })).toBeVisible();
});

test('most improved: measured against your own last four weeks', async ({ page }) => {
  test.setTimeout(120_000);
  const casey = await createUser('improved-casey', { onboarded: true, displayName: 'Casey' });
  const riley = await createUser('improved-riley', { onboarded: true, displayName: 'Riley' });
  await sql(
    `insert into public.friendships (requester_id, addressee_id, status, responded_at)
     values ($1, $2, 'accepted', now())`,
    [riley.id, casey.id],
  );
  // The same moment one to four weeks ago always falls in the four weeks before
  // this week, whatever day it starts on: one a week is Riley's usual, and one
  // so far this week is 100% of it. Last week's one, against the three before
  // it, was a third more than usual.
  for (const weeks of [1, 2, 3, 4]) {
    await rileyTrained(riley.id, new Date(Date.now() - weeks * 7 * 86_400_000));
  }
  await rileyTrained(riley.id, new Date(Date.now() - 60_000));

  await signIn(page, casey);
  await openBoard(page);
  await page.getByRole('radio', { name: 'Most improved' }).click();
  await expect(
    page.getByRole('link', { name: '1st, Riley: 100% of usual. Most improved last week' }),
  ).toBeVisible();
  // Casey has never trained, so has nothing to be measured against yet.
  await expect(page.getByText('Nothing to measure against yet', { exact: true })).toBeVisible();
  await expect(page.getByText('100% is a usual week', { exact: false })).toBeVisible();
});
