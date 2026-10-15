import { devices, expect, test } from '@playwright/test';
import { createUser, eventually, sql } from './support/backend.js';
import { finishWorkout, logSet, openTab, signIn, startWith } from './support/app.js';
import { APP_URL } from './support/urls.js';

/**
 * Levels (ADR-0132): XP worked out on the phone from the training log, shown
 * on Profile, published, and shown to friends beside the name.
 *
 * Blake finishes a workout on Blake's own phone and sees the level on
 * Profile; the phone publishes the XP; Alex, on another phone, sees Blake's
 * level on the Friends tab.
 */

/** The curve in @g7m/core (`levelFor`), which e2e does not depend on. */
function level(total: number): { level: number; into: number; step: number } {
  let remaining = total;
  let at = 1;
  const step = (n: number) => Math.min(400 + 50 * n, 2000);
  while (remaining >= step(at)) {
    remaining -= step(at);
    at += 1;
  }
  return { level: at, into: remaining, step: step(at) };
}

test('a finished workout shows as XP on Profile, and as a level to friends', async ({
  page,
  browser,
}) => {
  test.setTimeout(180_000);
  const alexUser = await createUser('levels-alex', { onboarded: true, displayName: 'Alex' });
  const blakeUser = await createUser('levels-blake', { onboarded: true, displayName: 'Blake' });
  await sql(
    `insert into public.friendships (requester_id, addressee_id, status, responded_at)
     values ($1, $2, 'accepted', now())`,
    [blakeUser.id, alexUser.id],
  );

  // 1. Blake trains: three sets make it a workout that counts.
  const context = await browser.newContext({ ...devices['Pixel 7'], baseURL: APP_URL });
  const blake = await context.newPage();
  await signIn(blake, blakeUser);
  await startWith(blake, 'Barbell Bench Press');
  await logSet(blake, 1, '60', '5');
  await logSet(blake, 2, '60', '5');
  await logSet(blake, 3, '60', '5');
  await finishWorkout(blake);

  // Blake's phone publishes the total: the workout and its sets at least,
  // and whatever badges it earned on top.
  const [published] = await eventually(
    () =>
      sql<{ xp: number | null }>(`select xp from public.friend_profiles where user_id = $1`, [
        blakeUser.id,
      ]),
    (rows) => (rows[0]?.xp ?? 0) >= 115,
  );
  const xp = published?.xp ?? 0;
  const expected = level(xp);

  // 2. Blake's Profile: the level and how far into it, between name and goal.
  await openTab(blake, 'Profile');
  const bar = blake.getByRole('progressbar', { name: /^Level \d+:/ });
  await expect(bar).toHaveAccessibleName(
    `Level ${String(expected.level)}: ${expected.into.toLocaleString('en-GB')} of ${expected.step.toLocaleString('en-GB')} XP to level ${String(expected.level + 1)}`,
  );
  const hero = blake.getByRole('region', { name: 'You' });
  await expect(hero.getByText(`${expected.step.toLocaleString('en-GB')} XP`)).toBeVisible();
  // Under the name, above the goal.
  const barBox = await bar.boundingBox();
  const nameBox = await hero.getByText('Blake', { exact: true }).boundingBox();
  const goalBox = await hero.getByText('Your goal').boundingBox();
  expect(barBox?.y ?? 0).toBeGreaterThan(nameBox?.y ?? Infinity);
  expect(barBox?.y ?? Infinity).toBeLessThan(goalBox?.y ?? 0);
  await context.close();

  // 3. Alex sees Blake's level beside the name.
  await signIn(page, alexUser);
  await openTab(page, 'Friends');
  const card = page.getByRole('article').filter({
    has: page.getByRole('link', { name: 'Blake', exact: true }),
  });
  await expect(card.getByText(`Lv ${String(expected.level)}`, { exact: true })).toBeVisible();
  await expect(card.getByText(`Level ${String(expected.level)}`, { exact: true })).toBeAttached();
});
