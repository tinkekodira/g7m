import { expect, test, type Page } from '@playwright/test';
import { createUser, eventually, sql } from './support/backend.js';
import {
  finishWorkout,
  logSet,
  openTab,
  signIn,
  startWith,
  waitForCatalogue,
} from './support/app.js';

/**
 * Achievements (ADR-0072): earned from the training log, announced once by a
 * banner from the top — at the bench for a heavy set, on Finish for a
 * workout — remembered on the server so no device announces them again, and
 * collected on a screen of their own. Past training counts, and is summed up
 * in one quiet banner rather than a parade.
 */

function banner(page: Page) {
  return page.getByRole('status').filter({ hasText: /Achievement unlocked|From your past/ });
}

async function seenOnServer(userId: string): Promise<string> {
  const [row] = await sql<{ achievements_seen: string | null }>(
    `select achievements_seen from public.profiles where user_id = $1`,
    [userId],
  );
  return row?.achievements_seen ?? '';
}

test('a heavy set is celebrated at the bench, the workout on Finish, and each only once', async ({
  page,
}) => {
  const user = await createUser('badges', { onboarded: true });
  await signIn(page, user);
  // The first sync, with the profile in it, before the workout starts: the
  // workout takes its bodyweight from the profile, and Bench Your Body needs it.
  await waitForCatalogue(page);
  await startWith(page, 'Barbell Bench Press');

  // 100 kg for a single: one plate a side, two, and more than the 80 kg the
  // lifter weighs — three badges at once, announced one after another.
  await logSet(page, 1, '100', '1');
  await expect(banner(page)).toContainText('Achievement unlocked');
  await expect(banner(page)).toContainText('Plate Club');
  await expect(banner(page)).toContainText('Two-Plate Bench');
  await expect(banner(page)).toContainText('Bench Your Body');

  await finishWorkout(page);
  await expect(banner(page)).toContainText('Day One');

  // Remembered on the server, so no other device plays them again.
  await eventually(
    () => seenOnServer(user.id),
    (seen) =>
      ['bench-your-body', 'day-one', 'plate-club', 'two-plate-bench'].every((key) =>
        seen.includes(key),
      ),
  );

  // The banner opens the badge it announced.
  await banner(page).getByRole('button').click();
  await expect(page.getByRole('heading', { name: 'Achievements', level: 1 })).toBeVisible();
  await expect(page).toHaveURL(/badge=day-one/);
  await expect(page.locator('#badge-day-one')).toContainText('Earned');
  await expect(page.locator('#badge-two-plate-bench')).toContainText('Earned');
  // Not earned yet: greyed out, with how far there is to go.
  await expect(page.locator('#badge-three-plate-bench')).toContainText('100 / 140 kg');
  // The secret stays one.
  await expect(page.locator('#badge-birthday-pump')).toContainText('Secret achievement');

  // Once means once: a reload announces nothing.
  await page.reload();
  await expect(page.locator('#badge-day-one')).toContainText('Earned');
  await page.waitForTimeout(1500);
  await expect(banner(page)).toHaveCount(0);

  // And Profile shows the count, with the way in.
  await openTab(page, 'Profile');
  await expect(page.getByRole('link', { name: /Achievements/ })).toContainText(/4 of 52 earned/);
});

test('training done before is summed up quietly, not announced badge by badge', async ({
  page,
}) => {
  const user = await createUser('past-badges', { onboarded: true });
  // A workout from March, as if logged before achievements existed: a
  // 100 kg bench, on a Tuesday at lunchtime, when no date badge is on offer.
  await sql(
    `with s as (
       insert into public.workout_sessions (user_id, started_at, ended_at)
       values ($1, '2026-03-10T12:00:00Z', '2026-03-10T13:00:00Z')
       returning id
     ), se as (
       insert into public.session_exercises (user_id, session_id, exercise_id, order_key)
       select $1, s.id, e.id, 'a0' from s, public.exercises e
        where e.slug = 'barbell-bench-press'
       returning id
     )
     insert into public.session_sets
       (user_id, session_exercise_id, order_key, set_type, load_type, weight_kg, reps,
        is_completed, completed_at)
     select $1, se.id, 'a0', 'working', 'external', 100, 1, true, '2026-03-10T12:30:00Z'
       from se`,
    [user.id],
  );

  await signIn(page, user);
  await expect(banner(page)).toContainText('From your past training');
  await expect(banner(page)).toContainText('3 achievements earned');
  await expect(page.getByText('Achievement unlocked')).toHaveCount(0);

  await banner(page).getByRole('button').click();
  await expect(page.locator('#badge-two-plate-bench')).toContainText('Earned 10 Mar');
});
