import { devices, expect, test, type Browser, type Page } from '@playwright/test';
import { createUser, eventually, sql, type TestUser } from './support/backend.js';
import { finishWorkout, logSet, openTab, signIn, startWith } from './support/app.js';
import { APP_URL } from './support/urls.js';

/**
 * Friends, with two people on two phones (ADR-0105).
 *
 * Alex has never set a name, so is asked for one first. Blake adds Alex by
 * the code on Alex's screen, Alex accepts, Blake trains, and Alex sees it:
 * today's dot, the workout, and the workout started as Alex's own with
 * Blake's numbers beside it. A workout already opened still opens with no
 * connection. Then Blake stops sharing, and Alex sees only the name.
 *
 * Everything a friend sees comes from the server live, so each check here is
 * against what the other phone has uploaded — `eventually` waits for it.
 */

async function secondPhone(browser: Browser, user: TestUser): Promise<Page> {
  const context = await browser.newContext({ ...devices['Pixel 7'], baseURL: APP_URL });
  const page = await context.newPage();
  await signIn(page, user);
  return page;
}

const today = new Date().toLocaleDateString('en-GB', { weekday: 'long' });

test('two friends: add by code, accept, see the training, do the workout, stop sharing', async ({
  page,
  browser,
}) => {
  test.setTimeout(180_000);
  const alexUser = await createUser('friends-alex', { onboarded: true });
  const blakeUser = await createUser('friends-blake', { onboarded: true, displayName: 'Blake' });

  // 1. Alex opens Friends, is asked for a name first, and gives one.
  await signIn(page, alexUser);
  await openTab(page, 'Friends');
  await expect(page.getByRole('heading', { name: 'What should friends call you?' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add a friend' })).toBeDisabled();
  await page.getByLabel('Your name').fill('Alex');
  await page.getByRole('button', { name: 'Continue' }).click();
  await eventually(
    () =>
      sql<{ display_name: string | null }>(
        `select display_name from public.profiles where user_id = $1`,
        [alexUser.id],
      ),
    (rows) => rows[0]?.display_name === 'Alex',
  );

  // With no friends yet, the code is right there to share.
  await expect(page.getByRole('heading', { name: 'Train with friends' })).toBeVisible();
  const [row] = await sql<{ friend_code: string }>(
    `select friend_code from public.friend_profiles where user_id = $1`,
    [alexUser.id],
  );
  const code = row?.friend_code ?? '';
  await expect(page.getByText(code, { exact: true })).toBeVisible();

  // 2. Blake sends a request with Alex's code, typed the way people type.
  const blake = await secondPhone(browser, blakeUser);
  await openTab(blake, 'Friends');
  await blake.getByRole('button', { name: 'Add a friend' }).click();
  await blake.getByLabel('Their code').fill(`${code.slice(0, 3).toLowerCase()}-${code.slice(3)}`);
  await blake.getByRole('button', { name: 'Send request' }).click();
  await expect(blake.getByText('Request sent to Alex.')).toBeVisible();
  // And sending it again says so rather than sending twice.
  await blake.getByLabel('Their code').fill(code);
  await blake.getByRole('button', { name: 'Send request' }).click();
  await expect(blake.getByText('You’ve already sent Alex a request.')).toBeVisible();
  await blake.getByRole('button', { name: 'Done' }).click();

  // 3. Alex accepts it in Requests.
  await page.reload();
  await expect(page.getByRole('tab', { name: /Requests 1/ })).toBeVisible();
  await page.getByRole('tab', { name: /Requests/ }).click();
  await page.getByRole('button', { name: 'Accept Blake' }).click();
  await expect(page.getByText(/No requests waiting/)).toBeVisible();
  await eventually(
    () =>
      sql<{ status: string }>(`select status from public.friendships where requester_id = $1`, [
        blakeUser.id,
      ]),
    (rows) => rows[0]?.status === 'accepted',
  );

  // 4. Blake logs a workout.
  await openTab(blake, 'Home');
  await startWith(blake, 'Barbell Bench Press');
  await logSet(blake, 1, '60', '5');
  await logSet(blake, 2, '60', '5');
  await finishWorkout(blake);
  await eventually(
    () =>
      sql<{ n: number }>(
        `select count(*)::int as n from public.workout_sessions
          where user_id = $1 and ended_at is not null`,
        [blakeUser.id],
      ),
    (rows) => rows[0]?.n === 1,
  );

  // 5. Alex sees today's dot coloured, and the workout.
  await page.getByRole('tab', { name: 'Friends' }).click();
  await page.reload();
  const card = page.locator('article', { has: page.getByRole('link', { name: 'Blake' }) });
  await expect(card.getByLabel(`${today}: trained (today)`)).toBeVisible();
  await expect(card.getByText('Online now')).toBeVisible();
  const lastWorkout = card.getByRole('link', { name: /Last workout/ });
  await expect(lastWorkout).toContainText('Today');

  // 6. Alex opens it...
  await lastWorkout.click();
  await expect(page.getByText('Blake’s workout')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Barbell Bench Press' })).toBeVisible();

  // ...which is kept on the phone: with no connection the list says so, but
  // the workout already opened still opens, ready to start.
  await page.context().setOffline(true);
  await openTab(page, 'Friends');
  await expect(page.getByRole('heading', { name: 'You’re offline' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add a friend' })).toBeDisabled();
  await page.goBack();
  await expect(page.getByText('Saved on this phone from when you last opened it.')).toBeVisible();
  await page.context().setOffline(false);

  // ...and does it: the logger opens with Blake's exercise, Blake's numbers
  // beside it as a guide, and none of them typed in.
  await page.getByRole('button', { name: 'Do this workout' }).click();
  await expect(page.getByRole('heading', { name: 'Barbell Bench Press' })).toBeVisible();
  await expect(page.getByText('Blake: 5 × 60 kg')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Finish workout' })).toBeVisible();

  // 7. Blake turns sharing off; Alex sees the name and nothing else.
  await openTab(blake, 'Settings');
  const sharing = blake.getByRole('switch', { name: /Share my training with friends/ });
  await expect(sharing).toBeEnabled();
  await sharing.click();
  await eventually(
    () =>
      sql<{ share_training: boolean }>(
        `select share_training from public.friend_profiles where user_id = $1`,
        [blakeUser.id],
      ),
    (rows) => rows[0]?.share_training === false,
  );

  await page.goto('/#/friends');
  await expect(card.getByText('Not sharing their training')).toBeVisible();
  await expect(card.getByRole('link', { name: /Last workout/ })).toHaveCount(0);

  await blake.context().close();
});
