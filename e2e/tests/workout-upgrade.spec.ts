import { expect, test, type Page } from '@playwright/test';
import { createUser, eventually, sql } from './support/backend.js';
import {
  logSet,
  openTab,
  recentWorkoutLink,
  signIn,
  startWith,
  waitForCatalogue,
} from './support/app.js';

async function add(page: Page, name: string): Promise<void> {
  await page.getByRole('link', { name: '+ Add an exercise' }).click();
  await page.getByLabel('Search').fill(name);
  await page
    .getByRole('button', { name: new RegExp(`^${name}`) })
    .first()
    .click();
}
async function logExercise(page: Page, name: string): Promise<void> {
  const card = page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name, exact: true }) });
  for (let n = 1; n <= 2; n += 1) {
    await card.getByRole('button', { name: 'Add set', exact: true }).click();
    await card
      .getByRole('textbox', { name: /^Weight/ })
      .last()
      .fill('20');
    await card.getByRole('textbox', { name: 'Reps', exact: true }).last().fill('8');
    await card.getByRole('button', { name: `Complete set ${String(n)}`, exact: true }).click();
  }
}

test('shoulder machine logs offline into a reusable recap in both themes and sizes', async ({
  page,
  context,
}, info) => {
  const user = await createUser('recap-offline', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);
  await startWith(page, 'Shoulder press machine');
  const start = new Date();
  await page.clock.setFixedTime(start);
  await logSet(page, 1, '30', '8');
  await page.clock.setFixedTime(new Date(start.getTime() + 2 * 60_000));
  await logSet(page, 2, '30', '8');
  await page.clock.setFixedTime(new Date(start.getTime() + 4 * 60_000));
  await logSet(page, 3, '30', '8');
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Finish workout' }).evaluate((el: HTMLButtonElement) => {
    el.click();
    el.click();
  });
  await expect(page.getByRole('heading', { name: 'Workout saved' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your session' })).toBeVisible();
  const totals = page.getByRole('region', { name: 'Your session' });
  await expect(totals).toContainText('Workout time');
  await expect(totals).toContainText('Logged training');
  await expect(totals).toContainText('720 kg');
  await expect(page.getByRole('heading', { name: 'Earned this session' })).toBeVisible();
  await page.getByRole('button', { name: 'Show Compared with last time' }).click();
  await expect(page.getByText('First logged session', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Show Your session' }).click();
  await expect(page.getByLabel('Routine name')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Day One/ })).toBeHidden();
  for (const width of [320, 412, 1280])
    for (const theme of ['dark', 'light']) {
      await page.setViewportSize({ width, height: width === 1280 ? 1000 : 850 });
      await page.evaluate((value) => {
        document.documentElement.dataset['theme'] = value;
      }, theme);
      await page.evaluate(() => window.scrollTo(0, 0));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.screenshot({
        path: info.outputPath(`recap-${String(width)}-${theme}.png`),
        fullPage: true,
      });
    }
  await page.getByRole('link', { name: 'Done', exact: true }).first().click();
  await openTab(page, 'Progress');
  await recentWorkoutLink(page).click();
  await expect(page.getByRole('heading', { name: 'Your session' })).toBeVisible();
  await expect(totals).toContainText('720 kg');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Your session' })).toBeVisible();
  await expect(totals).toContainText('720 kg');
  await context.setOffline(false);
  await eventually(
    () =>
      sql<{ n: string }>(
        'select count(*)::text n from public.workout_sessions where user_id = $1 and ended_at is not null',
        [user.id],
      ),
    (rows) => rows[0]?.n === '1',
  );
});

test('recommendations wait for three complete exercises, obey search and account for queued work', async ({
  page,
}, info) => {
  const user = await createUser('recommendation-gate', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);
  await startWith(page, 'Barbell Bench Press');
  await logExercise(page, 'Barbell Bench Press');
  await add(page, 'Dumbbell Bench Press');
  await logExercise(page, 'Dumbbell Bench Press');
  await page.getByRole('link', { name: '+ Add an exercise' }).click();
  await expect(page.getByText('Recommended', { exact: true })).toHaveCount(0);
  await page.getByLabel('Search').fill('Cable Fly');
  await page.getByRole('button', { name: /^Cable Fly/ }).click();
  await logExercise(page, 'Cable Fly');
  await page.getByRole('link', { name: '+ Add an exercise' }).click();
  await expect(page.getByText('Recommended', { exact: true }).first()).toBeVisible();
  await page.getByLabel('Search').fill('incline');
  await expect(page.getByText('Recommended', { exact: true })).toHaveCount(1);
  const first = page
    .locator('ul > li')
    .filter({ has: page.getByRole('button') })
    .first();
  await expect(first).toContainText('Incline');
  await expect(first).toContainText('Recommended');
  await page.screenshot({ path: info.outputPath('recommended-picker.png') });
  // A pending superset choice reserves its emphasis before anything is saved.
  await page.getByRole('switch', { name: /^Superset/ }).click();
  await page.getByRole('button', { name: /^Incline Dumbbell Press/ }).click();
  await expect(page.getByText('Recommended', { exact: true })).toHaveCount(0);
  await page.getByRole('switch', { name: /^Superset/ }).click();
  await expect(page.getByText('Recommended', { exact: true })).toHaveCount(1);
  await page.getByLabel('Search').fill('squat');
  await expect(page.getByText('Recommended', { exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: 'Back', exact: true }).click();
  const fly = page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: 'Cable Fly', exact: true }) });
  await fly.getByRole('button', { name: 'Undo set 2', exact: true }).click();
  await page.getByRole('link', { name: '+ Add an exercise' }).click();
  await expect(page.getByText('Recommended', { exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: 'Back', exact: true }).click();
  await fly.getByRole('button', { name: 'Complete set 2', exact: true }).click();
  await add(page, 'Incline Dumbbell Press');
  await page.getByRole('link', { name: '+ Add an exercise' }).click();
  await page.getByLabel('Search').fill('incline');
  await expect(page.getByText('Recommended', { exact: true })).toHaveCount(0);
});

for (const shoulders of [false, true]) {
  test(`shoulder suggestions ${shoulders ? 'follow' : 'respect the absence of'} a personal Push pattern`, async ({
    page,
  }) => {
    const user = await createUser('recommendation-pattern', { onboarded: true });
    for (const days of [10, 20])
      await sql(
        `
      with workout as (
        insert into public.workout_sessions (user_id, started_at, ended_at)
        values ($1, now() - $2::int * interval '1 day', now() - $2::int * interval '1 day' + interval '1 hour') returning id
      ), entries as (
        insert into public.session_exercises (user_id, session_id, exercise_id, order_key)
        select $1, workout.id, e.id, 'a' || row_number() over (order by e.slug)::text
        from workout, public.exercises e where e.slug = any($3::text[]) returning id
      )
      insert into public.session_sets (user_id, session_exercise_id, order_key, weight_kg, reps, is_completed, completed_at)
      select $1, entries.id, 'a' || n::text, 20, 8, true, now() - $2::int * interval '1 day'
      from entries, generate_series(1,2) n`,
        [
          user.id,
          days,
          ['barbell-bench-press', 'triceps-pushdown', ...(shoulders ? ['lateral-raise'] : [])],
        ],
      );
    await signIn(page, user);
    await waitForCatalogue(page);
    await startWith(page, 'Barbell Bench Press');
    await logExercise(page, 'Barbell Bench Press');
    await add(page, 'Dumbbell Bench Press');
    await logExercise(page, 'Dumbbell Bench Press');
    await add(page, 'Triceps Pushdown');
    await logExercise(page, 'Triceps Pushdown');
    await page.getByRole('link', { name: '+ Add an exercise' }).click();
    await page.getByLabel('Search').fill('Lateral Raise');
    await expect(page.getByText('Recommended', { exact: true })).toHaveCount(shoulders ? 1 : 0);
  });
}

test('floating Home remains clear of hour-length timers and preserves the running workout', async ({
  page,
}, info) => {
  const user = await createUser('floating-home', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);
  await startWith(page, 'Barbell Bench Press');
  await logSet(page, 1, '40', '8');
  for (let n = 0; n < 5; n += 1)
    await page.getByRole('button', { name: 'Add set', exact: true }).click();
  const start = new Date();
  await page.clock.setFixedTime(new Date(start.getTime() + 3729 * 1000));
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  for (const width of [320, 390, 412, 1280]) {
    await page.setViewportSize({ width, height: 740 });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const home = page.getByRole('link', { name: 'Go home', exact: true });
    await expect(home).toBeVisible();
    const a = await home.boundingBox();
    const b = await page.getByRole('group', { name: 'Workout summary' }).boundingBox();
    expect(a!.width).toBeGreaterThanOrEqual(44);
    expect(a!.x).toBeGreaterThanOrEqual(b!.x + b!.width + 4);
    expect(a!.x + a!.width).toBeLessThanOrEqual(width - 16);
    await page.screenshot({ path: info.outputPath(`home-${String(width)}.png`) });
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(
    parseFloat(
      await page
        .getByRole('link', { name: 'Go home' })
        .evaluate((el) => getComputedStyle(el).transitionDuration),
    ),
  ).toBeLessThan(0.001);
  await page.getByRole('link', { name: 'Go home' }).click();
  await expect(page.getByRole('navigation')).toBeVisible();
  await page.goto('/#/workout');
  await expect(page.getByRole('button', { name: 'Undo set 1', exact: true })).toBeVisible();
});
