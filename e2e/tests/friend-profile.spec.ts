import { devices, expect, test } from '@playwright/test';
import { createUser, eventually, sql } from './support/backend.js';
import { finishAndKeepAsRoutine, logSet, openTab, signIn, startWith } from './support/app.js';
import { APP_URL } from './support/urls.js';

/**
 * A friend's profile (ADR-0117): the cards your own profile has, about them.
 *
 * Blake trains a bench press on Blake's own phone and keeps it as a routine.
 * That phone works out Blake's achievements and publishes them. Alex, on
 * another phone, opens Blake's page and sees Blake's achievements, the
 * routine, the body coloured by the bench and the 60 kg best — then opens the
 * routine and starts it as Alex's own workout.
 */
test('a friend’s page: achievements, routines, training and best lifts', async ({
  page,
  browser,
}) => {
  test.setTimeout(180_000);
  const alexUser = await createUser('profile-alex', { onboarded: true, displayName: 'Alex' });
  const blakeUser = await createUser('profile-blake', { onboarded: true, displayName: 'Blake' });
  await sql(
    `insert into public.friendships (requester_id, addressee_id, status, responded_at)
     values ($1, $2, 'accepted', now())`,
    [blakeUser.id, alexUser.id],
  );

  // 1. Blake trains and keeps the workout as a routine.
  const context = await browser.newContext({ ...devices['Pixel 7'], baseURL: APP_URL });
  const blake = await context.newPage();
  await signIn(blake, blakeUser);
  await startWith(blake, 'Barbell Bench Press');
  await logSet(blake, 1, '60', '5');
  await logSet(blake, 2, '60', '5');
  await finishAndKeepAsRoutine(blake, 'Blake push');

  // Blake's phone uploads the routine and publishes the badges it earned.
  await eventually(
    () =>
      sql<{ routines: number; published: unknown }>(
        `select (select count(*)::int from public.routines where user_id = $1) as routines,
                (select achievements from public.friend_profiles where user_id = $1) as published`,
        [blakeUser.id],
      ),
    (rows) =>
      rows[0]?.routines === 1 && JSON.stringify(rows[0].published ?? null).includes('"day-one"'),
  );

  // 2. Alex opens Blake's page.
  await signIn(page, alexUser);
  await openTab(page, 'Friends');
  await page.getByRole('link', { name: 'Blake', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Blake', exact: true })).toBeVisible();

  const achievements = page.getByRole('link', { name: /^Achievements/ });
  await expect(achievements).toContainText(/\d+ of \d+ earned/);

  const routines = page.locator('section', {
    has: page.getByRole('heading', { name: 'Routines' }),
  });
  await expect(routines.getByRole('link', { name: /Blake push/ })).toContainText(
    '1 exercise · Barbell Bench Press',
  );

  const training = page.locator('section', {
    has: page.getByRole('heading', { name: 'Blake’s training' }),
  });
  await expect(training.getByText('Trained most')).toBeVisible();

  const bests = page.locator('section', { has: page.getByRole('heading', { name: 'Best lifts' }) });
  await expect(bests.getByRole('link', { name: /Barbell Bench Press/ })).toContainText('60 kg');

  // 3. The whole collection, with Blake's first workout earned.
  await achievements.click();
  await expect(page.getByRole('heading', { name: 'Blake’s achievements' })).toBeVisible();
  await expect(page.getByRole('listitem', { name: /^Day One\./ })).toContainText('Earned');
  await page.goBack();

  // 4. The routine, started as Alex's own: Blake's exercise and sets, no weights of Blake's.
  await routines.getByRole('link', { name: /Blake push/ }).click();
  await expect(page.getByRole('heading', { name: 'Blake push' })).toBeVisible();
  await expect(page.getByText('2 × ', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Do this routine' }).click();
  await expect(page.getByRole('heading', { name: 'Barbell Bench Press' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Finish workout' })).toBeVisible();

  await context.close();
});
