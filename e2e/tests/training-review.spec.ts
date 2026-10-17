import { expect, test } from '@playwright/test';
import { createUser, sql } from './support/backend.js';
import { signIn } from './support/app.js';

for (const viewport of [
  { name: 'phone', width: 412, height: 915 },
  { name: 'desktop', width: 1440, height: 1000 },
]) {
  test(`rapid goal changes preserve the training review on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const user = await createUser('training-review', { onboarded: true });

    // A month of improving training, followed by a few seconds trying goals
    // and returning to the original. Nothing has been logged since those taps.
    await sql(
      `insert into public.training_goals (user_id, goal, days_per_week, started_at)
       values ($1, 'recomp', 2, now() - interval '35 days'),
              ($1, 'lose_fat', 2, now() - interval '1 hour 7 seconds'),
              ($1, 'build_muscle', 2, now() - interval '1 hour 4 seconds'),
              ($1, 'recomp', 2, now() - interval '1 hour')`,
      [user.id],
    );
    for (let index = 0; index < 8; index += 1) {
      await sql(
        `with s as (
           insert into public.workout_sessions (user_id, started_at, ended_at)
           values ($1, now() - $2::int * interval '1 day',
                       now() - $2::int * interval '1 day' + interval '1 hour')
           returning id
         ), se as (
           insert into public.session_exercises (user_id, session_id, exercise_id, order_key)
           select $1, s.id, e.id, 'a0' from s, public.exercises e
            where e.slug = 'barbell-bench-press'
           returning id
         )
         insert into public.session_sets
           (user_id, session_exercise_id, order_key, set_type, load_type,
            weight_kg, reps, is_completed, completed_at)
         select $1, se.id, 'a0', 'working', 'external', $3, 8, true,
                now() - $2::int * interval '1 day' + interval '30 minutes'
           from se`,
        [user.id, 30 - index * 4, 60 + index * 2.5],
      );
    }

    await signIn(page, user);
    const nudge = page.getByRole('link', { name: /How it is going/ });
    await expect(nudge).toBeVisible();
    await nudge.click();

    const review = page.locator('section').filter({
      has: page.getByRole('heading', { name: 'How it is going', exact: true }),
    });
    await expect(review).toContainText('Your barbell bench press is going up');
    await expect(review).toContainText('across 8 sessions');
    await expect(review).toContainText('worth adding first');
    await expect(review).not.toContainText('Not enough to go on yet');
    await expect(review.getByRole('listitem')).toHaveCount(2);
    await expect(page.getByText('From your past training', { exact: true })).toHaveCount(0);
    await review.scrollIntoViewIfNeeded();
    await page.screenshot({ path: test.info().outputPath(`review-${viewport.name}.png`) });

    // Remount both screens offline so their queries read the local log again.
    await page.context().setOffline(true);
    await page.getByRole('navigation').getByRole('link', { name: 'Home' }).click();
    await expect(nudge).toBeVisible();
    await nudge.click();
    await expect(review).toContainText('Your barbell bench press is going up');
    await expect(review).not.toContainText('Not enough to go on yet');
  });
}
