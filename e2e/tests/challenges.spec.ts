import { expect, test, type Page } from '@playwright/test';
import { createUser, sql } from './support/backend.js';
import { finishWorkout, logSet, openTab, signIn, startWith } from './support/app.js';

/**
 * One-to-one challenges (ADR-0110), from both ends.
 *
 * The friend's side is written straight into the server: what their phone
 * does is the friends test's business, and a challenge sent to you is
 * something the app can only be told about.
 */

async function befriend(a: string, b: string): Promise<void> {
  await sql(
    `insert into public.friendships (requester_id, addressee_id, status, responded_at)
     values ($1, $2, 'accepted', now())`,
    [a, b],
  );
}

/** A finished workout of one bench set, started at `startedAt`. */
async function trained(userId: string, startedAt: Date): Promise<void> {
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

async function openFriendsTab(page: Page, tab: 'Leaderboard' | RegExp): Promise<void> {
  await openTab(page, 'Friends');
  await page.getByRole('tab', { name: tab }).click();
}

async function completedChallenge(a: string, b: string, aCount = 6, bCount = 5) {
  const date = new Date(Date.now() - 3 * 86_400_000);
  for (let i = 0; i < aCount; i++) await trained(a, date);
  for (let i = 0; i < bCount; i++) await trained(b, date);
  const [row] = await sql<{ id: string }>(
    `insert into public.friend_challenges
    (challenger_id, opponent_id, stat, ranking, status, starts_at)
    values ($1, $2, 'workouts', 'most', 'active', now() - interval '9 days') returning id`,
    [a, b],
  );
  return row!.id;
}

test('a final result: popup, direct card, permanent profile history and explicit acknowledgment', async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  const me = await createUser('result-winner', { onboarded: true, displayName: 'Morgan' });
  const friend = await createUser('result-runner-up', { onboarded: true, displayName: 'Riley' });
  await befriend(me.id, friend.id);
  const id = await completedChallenge(me.id, friend.id);
  // The native dialog correctly makes the tab navigation inert, so sign in
  // directly rather than waiting for the shared helper's navigation locator.
  await page.goto('/');
  await page.getByLabel('Email').fill(me.email);
  await page.getByLabel('Password').fill(me.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  const popup = page.getByRole('dialog', { name: 'You won', exact: true });
  await expect(popup).toBeVisible();
  await expect(popup.getByText('6', { exact: true })).toBeVisible();
  await expect(popup.getByText('5', { exact: true })).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('result-popup-phone-dark.png'),
    animations: 'disabled',
  });
  await popup.getByRole('link', { name: 'View challenge' }).click();
  await expect(page).toHaveURL(new RegExp(`tab=leaderboard&challenge=${id}`));
  const card = page.getByRole('article', { name: 'Most workouts', exact: true });
  await expect(card).toBeFocused();
  await expect(card.getByText('You won', { exact: true })).toBeVisible();
  await expect(card.getByText('6', { exact: true })).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('result-card-phone-dark.png'),
    fullPage: true,
  });
  await page.setViewportSize({ width: 360, height: 800 });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  await page.screenshot({
    path: testInfo.outputPath('result-card-phone-light.png'),
    fullPage: true,
  });
  await expect(card.getByText('6', { exact: true })).toHaveCSS('color', 'rgb(118, 88, 9)');
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({
    path: testInfo.outputPath('result-card-desktop-light.png'),
    fullPage: true,
  });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.screenshot({
    path: testInfo.outputPath('result-card-desktop-dark.png'),
    fullPage: true,
  });
  await page.setViewportSize({ width: 412, height: 915 });
  await page.reload();
  await expect(card.getByRole('button', { name: 'Got it' })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  // A failed acknowledgment keeps the result in place and supports retry.
  await page.route('**/rest/v1/rpc/acknowledge_challenge', (route) => route.abort());
  await card.getByRole('button', { name: 'Got it' }).click();
  await expect(card.getByRole('alert')).toBeVisible();
  await page.unroute('**/rest/v1/rpc/acknowledge_challenge');
  await card.getByRole('button', { name: 'Got it' }).click();
  await expect(card).toHaveCount(0);
  await expect(async () => {
    const [row] = await sql<{ ack: string | null; other_ack: string | null }>(
      'select challenger_ack_at as ack, opponent_ack_at as other_ack from public.friend_challenges where id = $1',
      [id],
    );
    expect(row?.ack).not.toBeNull();
    expect(row?.other_ack).toBeNull();
  }).toPass();
  await openTab(page, 'Profile');
  await page.getByRole('link', { name: /Challenge record/ }).click();
  await expect(page.getByRole('heading', { name: 'Challenge history' })).toBeVisible();
  await expect(
    page.getByRole('article', { name: 'Most workouts' }).getByText('You won', { exact: true }),
  ).toBeVisible();
  await page.getByRole('radio', { name: 'Losses', exact: true }).click();
  await expect(page.getByText('No results here yet')).toBeVisible();
  await page.getByRole('radio', { name: 'Wins', exact: true }).click();
  await expect(page.getByRole('article', { name: 'Most workouts' })).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('challenge-history-phone.png'),
    fullPage: true,
  });
  await page.context().setOffline(true);
  await expect(page.getByText('Connect to see your challenge history.')).toBeVisible();
  await page.context().setOffline(false);
});

test('multiple results can be stepped through; Later and Escape preserve the cards', async ({
  page,
  browser,
}) => {
  test.setTimeout(120_000);
  const me = await createUser('result-multiple', { onboarded: true, displayName: 'Morgan' });
  const friend = await createUser('result-multiple-friend', {
    onboarded: true,
    displayName: 'Riley',
  });
  await befriend(me.id, friend.id);
  await signIn(page, me);
  await completedChallenge(me.id, friend.id, 0, 0);
  await completedChallenge(me.id, friend.id, 0, 0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  const popup = page.getByRole('dialog', { name: 'A draw', exact: true });
  await expect(popup).toBeVisible();
  await expect(popup.getByText('Result 1 of 2')).toBeVisible();
  await expect(popup.locator('.challenge-result-reveal')).toHaveCSS('animation-name', 'none');
  await popup.getByRole('button', { name: 'Next result' }).click();
  await expect(popup.getByText('Result 2 of 2')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(popup).toHaveCount(0);
  await openFriendsTab(page, 'Leaderboard');
  await expect(page.getByRole('button', { name: 'Got it', exact: true })).toHaveCount(2);
  // Another device has its own session but the server remembers popup delivery.
  const secondContext = await browser.newContext();
  const second = await secondContext.newPage();
  await signIn(second, me);
  await openFriendsTab(second, 'Leaderboard');
  await expect(second.getByRole('dialog')).toHaveCount(0);
  await expect(second.getByRole('button', { name: 'Got it', exact: true })).toHaveCount(2);
  await secondContext.close();
});

test('a result finalizes before announcing a loss, and stays visible after removing the last friend', async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  const me = await createUser('result-finalizing', { onboarded: true, displayName: 'Morgan' });
  const friend = await createUser('result-finalizing-friend', {
    onboarded: true,
    displayName: 'RileyWithAnUnusuallyLongNameWithoutSpaces',
  });
  await befriend(me.id, friend.id);
  await signIn(page, me);
  await trained(friend.id, new Date(Date.now() - 3 * 86_400_000));
  const [challenge] = await sql<{ id: string }>(
    `insert into public.friend_challenges
    (challenger_id, opponent_id, stat, ranking, status, starts_at)
    values ($1, $2, 'workouts', 'most', 'active', now() - interval '180 hours') returning id`,
    [me.id, friend.id],
  );
  await openFriendsTab(page, 'Leaderboard');
  await expect(page.getByText('Finalizing result', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Got it' })).toHaveCount(0);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await sql(
    `update public.friend_challenges set starts_at = now() - interval '193 hours' where id = $1`,
    [challenge!.id],
  );
  await sql('delete from public.friendships where requester_id = $1 and addressee_id = $2', [
    me.id,
    friend.id,
  ]);
  await page.setViewportSize({ width: 360, height: 800 });
  await page.reload();
  const popup = page.getByRole('dialog', {
    name: 'RileyWithAnUnusuallyLongNameWithoutSpaces won',
    exact: true,
  });
  await expect(popup).toBeVisible();
  await expect
    .poll(() => popup.evaluate((node) => node.scrollWidth <= node.clientWidth))
    .toBe(true);
  await page.screenshot({
    path: testInfo.outputPath('result-loss-phone-dark.png'),
    animations: 'disabled',
  });
  await popup.getByRole('button', { name: 'Later' }).click();
  const card = page.getByRole('article', { name: 'Most workouts', exact: true });
  await expect(card.getByRole('button', { name: 'Got it' })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
  await page.screenshot({
    path: testInfo.outputPath('result-loss-card-phone.png'),
    fullPage: true,
  });
});

test('history pages retain their URL and start at the top', async ({ page }) => {
  const me = await createUser('result-pages', { onboarded: true, displayName: 'Morgan' });
  const friend = await createUser('result-pages-friend', { onboarded: true, displayName: 'Riley' });
  await befriend(me.id, friend.id);
  await signIn(page, me);
  await sql(
    `insert into public.friend_challenges
    (challenger_id, opponent_id, stat, ranking, status, starts_at, challenger_popup_at)
    select $1, $2, 'workouts', 'most', 'active', now() - n * interval '24 hours', now()
    from generate_series(9, 29) n`,
    [me.id, friend.id],
  );
  await openTab(page, 'Profile');
  await page.getByRole('link', { name: /Challenge record/ }).click();
  await expect(page.getByRole('article')).toHaveCount(20);
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByRole('article')).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await page.reload();
  await expect(page.getByRole('article')).toHaveCount(1);
  await page.getByRole('button', { name: 'Previous', exact: true }).click();
  await expect(page.getByRole('article')).toHaveCount(20);
});

test('a challenge sent to you: accept it, fall behind, then go ahead', async ({ page }) => {
  test.setTimeout(120_000);
  const morgan = await createUser('challenge-morgan', { onboarded: true, displayName: 'Morgan' });
  const riley = await createUser('challenge-riley', { onboarded: true, displayName: 'Riley' });
  await befriend(riley.id, morgan.id);
  await sql(
    `insert into public.friend_challenges (challenger_id, opponent_id, stat, ranking)
     values ($1, $2, 'sets', 'most')`,
    [riley.id, morgan.id],
  );

  await signIn(page, morgan);
  await openTab(page, 'Friends');
  await expect(page.getByRole('tab', { name: /Requests 1/ })).toBeVisible();
  await page.getByRole('tab', { name: /Requests/ }).click();
  await expect(
    page.getByText('Riley challenged you. Seven days, from when you accept.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Accept Riley’s challenge' }).click();
  await expect(page.getByText(/No requests waiting/)).toBeVisible();

  // Riley gets a set in after it started.
  await trained(riley.id, new Date());
  await page.getByRole('tab', { name: 'Leaderboard' }).click();
  const card = page.getByRole('article', { name: 'Most sets' });
  await expect(card.getByText('1 set behind Riley', { exact: true })).toBeVisible();
  await expect(card.getByText('7 days left')).toBeVisible();

  await openTab(page, 'Home');
  await startWith(page, 'Barbell Bench Press');
  await logSet(page, 1, '60', '5');
  await logSet(page, 2, '60', '5');
  await finishWorkout(page);

  await openFriendsTab(page, 'Leaderboard');
  await expect(
    page.getByRole('article', { name: 'Most sets' }).getByText('1 set ahead of Riley', {
      exact: true,
    }),
  ).toBeVisible();
});

test('challenging a friend from their page, and taking it back', async ({ page }) => {
  test.setTimeout(120_000);
  const casey = await createUser('challenge-casey', { onboarded: true, displayName: 'Casey' });
  const jordan = await createUser('challenge-jordan', { onboarded: true, displayName: 'Jordan' });
  await befriend(casey.id, jordan.id);

  await signIn(page, casey);
  await openTab(page, 'Friends');
  await page.getByRole('link', { name: 'Jordan' }).click();

  // Shut until asked for: a button, and the choices in a sheet behind it.
  const opener = page.getByRole('button', { name: 'Challenge Jordan', exact: true });
  const sheet = page.getByRole('dialog', { name: 'Challenge Jordan' });
  await expect(opener).toBeVisible();
  await expect(sheet).toHaveCount(0);
  await opener.click();

  // Neither of them has trained, so there is nothing to measure improvement against.
  await sheet.getByRole('radio', { name: 'Most improved' }).click();
  await sheet.getByRole('button', { name: 'Send challenge' }).click();
  await expect(sheet.getByRole('alert')).toHaveText(
    'You have no workouts in the last four weeks to measure against. Try Most instead.',
  );

  await sheet.getByRole('radio', { name: 'Most', exact: true }).click();
  await sheet.getByRole('radio', { name: 'Weight' }).click();
  await sheet.getByRole('button', { name: 'Send challenge' }).click();
  await expect(sheet).toHaveCount(0);

  const card = page.getByRole('article', { name: 'Most weight lifted' });
  await expect(card.getByText('Waiting for Jordan to accept')).toBeVisible();
  // One at a time: no button while it waits.
  await expect(opener).toHaveCount(0);

  await card.getByRole('button', { name: 'Take back your challenge to Jordan' }).click();
  await expect(opener).toBeVisible();
  await expect(sheet).toHaveCount(0);
  await expect(page.getByRole('article', { name: 'Most weight lifted' })).toHaveCount(0);
});

/**
 * The challenge button and its sheet on the narrowest common phone. A label
 * wider than its share once widened its option, so the highlight (always 1/n
 * of the track) spilled past "Workouts" and sat off its centre. Measured on
 * the live page.
 */
test('the challenge sheet: two stats, options share the track, the highlight fits', async ({
  page,
}) => {
  const casey = await createUser('challenge-fit-casey', { onboarded: true, displayName: 'Casey' });
  const jordan = await createUser('challenge-fit-jordan', {
    onboarded: true,
    displayName: 'Jordan',
  });
  await befriend(casey.id, jordan.id);

  await page.setViewportSize({ width: 375, height: 812 });
  await signIn(page, casey);
  await openTab(page, 'Friends');
  await page.getByRole('link', { name: 'Jordan' }).click();
  const opener = page.getByRole('button', { name: 'Challenge Jordan', exact: true });
  const form = page.getByRole('dialog', { name: 'Challenge Jordan' });

  // Escape, or a tap above the sheet, puts it away and hands focus back.
  await opener.click();
  await expect(form).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(form).toHaveCount(0);
  await expect(opener).toBeFocused();
  await opener.click();
  await page.getByRole('button', { name: 'Close' }).click({ position: { x: 20, y: 20 } });
  await expect(form).toHaveCount(0);

  await opener.click();
  await expect(form.getByRole('radio', { name: 'Workouts' })).toBeVisible();
  // Who turned up, and who lifted more: sets and time can be padded.
  await expect(form.getByRole('radio')).toHaveText(['Most', 'Most improved', 'Workouts', 'Weight']);

  /** Each group: its options' widths, and the highlight's gaps to the chosen one and the track. */
  const measure = () =>
    form.evaluate((section) =>
      Array.from(section.querySelectorAll('[role="radiogroup"]'), (group) => {
        const track = group.getBoundingClientRect();
        const indicator = group.querySelector('[aria-hidden]')!.getBoundingClientRect();
        const radios = Array.from(group.querySelectorAll('[role="radio"]'));
        const chosen = radios
          .find((radio) => radio.getAttribute('aria-checked') === 'true')!
          .getBoundingClientRect();
        return {
          widths: radios.map((radio) => Math.round(radio.getBoundingClientRect().width)),
          offCentre: Math.abs(
            indicator.left + indicator.width / 2 - (chosen.left + chosen.width / 2),
          ),
          widthGap: Math.abs(indicator.width - chosen.width),
          top: indicator.top - track.top,
          bottom: track.bottom - indicator.bottom,
          height: track.height,
        };
      }),
    );

  const fits = async () => {
    await expect
      .poll(async () => {
        const groups = await measure();
        return groups.every(
          (g) =>
            Math.max(...g.widths) - Math.min(...g.widths) <= 1 &&
            g.offCentre <= 1 &&
            g.widthGap <= 1 &&
            Math.abs(g.top - g.bottom) <= 1,
        );
      })
      .toBe(true);
  };

  await fits();
  await form.getByRole('radio', { name: 'Weight' }).click();
  await form.getByRole('radio', { name: 'Most improved' }).click();
  await fits();

  // Both controls the height of the button under them.
  const button = await form.getByRole('button', { name: 'Send challenge' }).boundingBox();
  for (const group of await measure())
    expect(Math.abs(group.height - button!.height)).toBeLessThanOrEqual(1);

  // Nothing pushes the page sideways.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
});
