import { expect, test, type Page } from '@playwright/test';
import { createUser, sql } from './support/backend.js';
import { signIn, waitForCatalogue } from './support/app.js';

test.use({ deviceScaleFactor: 1 });

async function arrange(page: Page) {
  const user = await createUser('level-up', { onboarded: true });
  const sessions: string[] = [];
  for (const [days, weight, finished] of [
    [8, 20, true],
    [0, 30, false],
  ] as const) {
    const [session] = await sql<{ id: string }>(
      `with workout as (
        insert into public.workout_sessions (user_id, started_at, ended_at)
        values ($1, now() - $2::int * interval '1 day' - interval '1 hour',
          case when $4 then now() - $2::int * interval '1 day' else null end) returning id
      ), entry as (
        insert into public.session_exercises (user_id, session_id, exercise_id, order_key)
        select $1, workout.id, e.id, 'a0' from workout, public.exercises e
        where e.slug = 'shoulder-press-machine' returning id, session_id
      ), sets as (
        insert into public.session_sets (user_id, session_exercise_id, order_key, weight_kg, reps, is_completed, completed_at)
        select $1, entry.id, 'a' || lpad(n::text, 2, '0'), $3, 8, true,
          now() - $2::int * interval '1 day' - (12-n) * interval '2 minutes'
        from entry, generate_series(1,12) n
      ) select session_id id from entry`,
      [user.id, days, weight, finished],
    );
    sessions.push(session!.id);
  }
  await signIn(page, user);
  await waitForCatalogue(page);
  await page.goto('/#/workout');
  await expect(page.getByRole('button', { name: 'Finish workout' })).toBeVisible();
  return sessions[1]!;
}

test('a workout level gain celebrates only after Continue, works offline and never replays from history', async ({
  page,
  context,
}, info) => {
  const session = await arrange(page);
  await page.setViewportSize({ width: 393, height: 851 });
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Finish workout' }).click();
  await expect(page.getByRole('heading', { name: 'Workout saved' })).toBeVisible();
  await expect(page.locator('.recap-level')).toContainText('Level up!');
  const dialog = page.getByRole('dialog', { name: 'Level up!' });
  await expect(dialog).toHaveCount(0);
  await page.getByRole('button', { name: 'Show Exercise log' }).click();
  await page.getByRole('link', { name: 'Continue', exact: true }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(/Level 1.*Level 2/);
  await expect(dialog.getByRole('button', { name: 'Let’s go' })).toBeFocused();
  await expect(page.getByRole('group', { name: 'Workout actions' })).toBeHidden();
  await page.screenshot({ path: info.outputPath('celebration-phone.png') });
  // With normal motion the moment ends by itself, returning to the original destination.
  await expect(dialog).toBeHidden({ timeout: 6000 });
  await expect(page).toHaveURL(/\/#\/$/);
  await page.goto(`/#/progress/session/${session}`);
  await expect(page.locator('.recap-level')).toBeVisible();
  await page.getByRole('link', { name: 'Done', exact: true }).click();
  await expect(page).toHaveURL(/\/#\/progress$/);
  await expect(dialog).toHaveCount(0);
  await context.setOffline(false);
});

test('reduced motion stays still until dismissed, fits both themes and clears the fresh state on reload', async ({
  page,
}, info) => {
  const session = await arrange(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Finish workout' }).click();
  await page.getByRole('link', { name: 'Continue', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Level up!' });
  await expect(dialog).toBeVisible();
  await page.waitForTimeout(3600);
  await expect(dialog).toBeVisible();
  for (const [width, height] of [
    [320, 568],
    [393, 851],
    [1280, 900],
  ] as const) {
    await page.setViewportSize({ width, height });
    for (const theme of ['dark', 'light']) {
      await page.evaluate((value) => {
        document.documentElement.dataset['theme'] = value;
      }, theme);
      await expect(dialog.getByRole('heading')).toBeInViewport({ ratio: 1 });
      await expect(dialog.getByRole('button')).toBeInViewport({ ratio: 1 });
      await expect(page.locator('.level-up-badge')).toHaveCSS('animation-name', 'none');
      expect(
        await dialog.evaluate(
          (el) => el.scrollWidth <= el.clientWidth && el.scrollHeight <= el.clientHeight,
        ),
      ).toBe(true);
      await page.screenshot({ path: info.outputPath(`celebration-${width}-${theme}.png`) });
    }
  }
  await page.reload();
  await expect(page.getByRole('link', { name: 'Done', exact: true })).toBeVisible();
  await expect(dialog).toHaveCount(0);
  // A new finish state can still be dismissed immediately with the keyboard.
  await page.evaluate(() =>
    history.replaceState({ ...history.state, usr: { workoutFinished: true } }, ''),
  );
  await page.reload();
  await page.getByRole('link', { name: 'Continue', exact: true }).click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/#\/$/);
  await page.goto(`/#/progress/session/${session}`);
  await expect(dialog).toHaveCount(0);
});

test('a workout without a level gain goes straight home', async ({ page }) => {
  const user = await createUser('no-level-up', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);
  const { startWith, logSet } = await import('./support/app.js');
  await startWith(page, 'Barbell Bench Press');
  await logSet(page, 1, '20', '8');
  await page.getByRole('button', { name: 'Finish workout' }).click();
  await expect(page.locator('.recap-level')).toHaveCount(0);
  await page.getByRole('link', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('navigation', { name: 'Main', exact: true })).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Level up!' })).toHaveCount(0);
});
