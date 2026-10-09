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

  const form = page.getByRole('region', { name: 'Challenge Jordan' });
  // Neither of them has trained, so there is nothing to measure improvement against.
  await form.getByRole('radio', { name: 'Most improved' }).click();
  await form.getByRole('button', { name: 'Send challenge' }).click();
  await expect(form.getByRole('alert')).toHaveText(
    'You have no workouts in the last four weeks to measure against. Try Most instead.',
  );

  await form.getByRole('radio', { name: 'Most', exact: true }).click();
  await form.getByRole('radio', { name: 'Weight' }).click();
  await form.getByRole('button', { name: 'Send challenge' }).click();

  const card = page.getByRole('article', { name: 'Most weight lifted' });
  await expect(card.getByText('Waiting for Jordan to accept')).toBeVisible();
  // One at a time: no form while it waits.
  await expect(page.getByRole('region', { name: 'Challenge Jordan' })).toHaveCount(0);

  await card.getByRole('button', { name: 'Take back your challenge to Jordan' }).click();
  await expect(page.getByRole('region', { name: 'Challenge Jordan' })).toBeVisible();
  await expect(page.getByRole('article', { name: 'Most weight lifted' })).toHaveCount(0);
});

/**
 * The challenge form on the narrowest common phone. A label wider than its
 * share once widened its option, so the highlight (always 1/n of the track)
 * spilled past "Workouts" and sat off its centre. Measured on the live page.
 */
test('the challenge form: options share the track, the highlight fits its option', async ({
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
  const form = page.getByRole('region', { name: 'Challenge Jordan' });
  await expect(form.getByRole('radio', { name: 'Workouts' })).toBeVisible();

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
  await form.getByRole('radio', { name: 'Time' }).click();
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
