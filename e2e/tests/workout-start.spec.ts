import { expect, test, type Page } from '@playwright/test';
import { createUser, eventually, sql } from './support/backend.js';
import { openTab, signIn, signOut, waitForCatalogue } from './support/app.js';

const chooser = (page: Page) => page.getByRole('dialog', { name: 'Start a workout', exact: true });
const start = (page: Page) => page.getByRole('button', { name: /^Start a workout/ });
const blank = (page: Page) =>
  chooser(page).getByRole('button', { name: 'Start a blank workout', exact: true });

async function discard(page: Page) {
  page.once('dialog', (dialog) => void dialog.accept());
  await page.getByRole('button', { name: 'Discard', exact: true }).click();
  await expect(start(page)).toBeVisible();
}

test('blank opt-out persists, settings restores it, and accounts stay separate', async ({
  page,
}) => {
  const user = await createUser('start-preference', { onboarded: true });
  await signIn(page, user);
  await start(page).click();
  await expect(chooser(page).getByText(/No routines yet/)).toBeVisible();
  await expect(chooser(page).getByRole('group', { name: 'Choose routine page' })).toHaveCount(0);
  const checkbox = page.getByRole('checkbox', { name: 'Do not show this again' });
  await expect(checkbox).not.toBeChecked();
  await checkbox.check();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(start(page)).toBeFocused();
  await expect
    .poll(() => sql('select id from public.workout_sessions where user_id = $1', [user.id]))
    .toEqual([]);
  await start(page).click();
  await expect(checkbox).not.toBeChecked();
  await checkbox.check();
  await blank(page).click();
  await expect(page.getByRole('button', { name: 'Finish workout' })).toBeVisible();
  await discard(page);
  await page.reload();
  await start(page).click();
  await expect(page.getByRole('button', { name: 'Finish workout' })).toBeVisible();
  await expect(chooser(page)).toHaveCount(0);
  await discard(page);
  await openTab(page, 'Settings');
  const toggle = page.getByRole('switch', { name: /Show workout start options/ });
  await expect(toggle).not.toBeChecked();
  await toggle.click();
  await openTab(page, 'Home');
  await start(page).click();
  await expect(chooser(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(start(page)).toBeFocused();
  await openTab(page, 'Settings');
  await toggle.click();
  await signOut(page);
  const other = await createUser('start-other-account', { onboarded: true });
  await signIn(page, other);
  await start(page).click();
  await expect(chooser(page)).toBeVisible();
});

test('routines start offline, sort by last performed, and never save blank opt-out', async ({
  page,
  context,
}) => {
  const user = await createUser('start-routine', { onboarded: true });
  const [routine] = await sql<{ id: string }>(
    `insert into public.routines (user_id, name, last_performed_at) values ($1, 'Push day', now()) returning id`,
    [user.id],
  );
  if (!routine) throw new Error('Missing routine');
  await sql(
    `insert into public.routine_exercises (user_id, routine_id, exercise_id, order_key)
    select $1, $2, id, 'a0' from public.exercises where slug = 'barbell-bench-press'`,
    [user.id, routine.id],
  );
  await sql(`insert into public.routines (user_id, name) values ($1, 'Empty routine')`, [user.id]);
  await signIn(page, user);
  await waitForCatalogue(page);
  await openTab(page, 'Home');
  await start(page).click();
  await expect(chooser(page).getByRole('button', { name: 'Start Push day' })).toBeEnabled();
  await expect(chooser(page).getByRole('listitem').first()).toContainText('Push day');
  await expect(chooser(page).getByRole('button', { name: 'Start Empty routine' })).toBeDisabled();
  await page.getByRole('checkbox', { name: 'Do not show this again' }).check();
  await context.setOffline(true);
  await chooser(page).getByRole('button', { name: 'Start Push day' }).dblclick();
  await expect(
    page.getByRole('heading', { name: 'Barbell Bench Press', exact: true }),
  ).toBeVisible();
  await context.setOffline(false);
  await eventually(
    () =>
      sql<{ source: string; routine_id: string }>(
        'select source, routine_id from public.workout_sessions where user_id = $1',
        [user.id],
      ),
    (rows) =>
      rows.length === 1 && rows[0]?.source === 'routine' && rows[0]?.routine_id === routine.id,
  );
  await discard(page);
  await start(page).click();
  await expect(chooser(page)).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Do not show this again' })).not.toBeChecked();
});

test('empty logger uses the chooser and blocked preference storage has a session fallback', async ({
  page,
}) => {
  await page.addInitScript(() => {
    // eslint-disable-next-line @typescript-eslint/unbound-method -- Rebound with .call(this) below.
    const get = Storage.prototype.getItem;
    // eslint-disable-next-line @typescript-eslint/unbound-method -- Rebound with .call(this) below.
    const set = Storage.prototype.setItem;
    Storage.prototype.getItem = function (key) {
      if (key.startsWith('g7m.workout-start-options.')) throw new Error('blocked');
      return get.call(this, key);
    };
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith('g7m.workout-start-options.')) throw new Error('blocked');
      set.call(this, key, value);
    };
  });
  const user = await createUser('start-no-storage', { onboarded: true });
  await signIn(page, user);
  await page.goto('/#/workout');
  await start(page).click();
  await page.getByRole('checkbox', { name: 'Do not show this again' }).check();
  await blank(page).click();
  await expect(page.getByRole('button', { name: 'Finish workout' })).toBeVisible();
  await discard(page);
  await start(page).click();
  await expect(page.getByRole('button', { name: 'Finish workout' })).toBeVisible();
  await expect(chooser(page)).toHaveCount(0);
});

test('long routine pages keep blank controls visible with focus contained in both themes', async ({
  page,
}, testInfo) => {
  const user = await createUser('start-layout', { onboarded: true });
  await sql(
    `insert into public.routines (user_id, name)
    select $1, 'Routine ' || n || ' with a longer training day name' from generate_series(1, 18) n`,
    [user.id],
  );
  await signIn(page, user);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const theme of ['dark', 'light']) {
    await openTab(page, 'Settings');
    const toggle = page.getByRole('switch', { name: /Dark mode/ });
    if ((await toggle.isChecked()) !== (theme === 'dark')) await toggle.click();
    await openTab(page, 'Home');
    for (const width of [320, 393, 1280]) {
      await page.setViewportSize({ width, height: width === 320 ? 568 : 851 });
      await start(page).click();
      await expect(chooser(page).getByRole('listitem')).toHaveCount(3);
      await expect(chooser(page).getByRole('button', { name: /^Show routine page/ })).toHaveCount(
        6,
      );
      await expect(blank(page)).toBeInViewport();
      await expect(page.getByRole('checkbox')).toBeInViewport();
      await page.keyboard.press('Shift+Tab');
      await expect
        .poll(() => chooser(page).evaluate((node) => node.contains(document.activeElement)))
        .toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`chooser-${theme}-${width}.png`) });
      await page.keyboard.press('Escape');
      await expect(start(page)).toBeFocused();
    }
  }
});

test('three routines need no dots; additional routines make swipeable pages and start offline', async ({
  page,
  context,
}) => {
  const user = await createUser('start-pages', { onboarded: true });
  const seed = async (first: number, last: number) => {
    await sql(
      `insert into public.routines (user_id, name, last_performed_at)
       select $1, 'Routine ' || n, now() - n * interval '1 day' from generate_series($2::int, $3::int) n`,
      [user.id, first, last],
    );
  };
  await seed(1, 3);
  await signIn(page, user);
  await waitForCatalogue(page);
  await start(page).click();
  await expect(chooser(page).getByRole('listitem')).toHaveCount(3);
  await expect(chooser(page).getByRole('group', { name: 'Choose routine page' })).toHaveCount(0);
  await page.keyboard.press('Escape');

  await seed(4, 4);
  // SQL fixtures are picked up on a fresh fake sync connection.
  await page.reload();
  await start(page).click();
  await expect(chooser(page).getByRole('button', { name: /^Show routine page/ })).toHaveCount(2);
  await chooser(page).getByRole('button', { name: 'Show routine page 2 of 2' }).click();
  await expect(chooser(page).getByRole('listitem')).toHaveCount(1);
  await expect(chooser(page).getByRole('listitem')).toContainText('Routine 4');
  await expect(chooser(page).getByRole('button', { name: 'Start Routine 4' })).toBeDisabled();
  await page.keyboard.press('Escape');

  await seed(5, 7);
  await sql(
    `insert into public.routine_exercises (user_id, routine_id, exercise_id, order_key)
     select $1, r.id, e.id, 'a0' from public.routines r cross join public.exercises e
     where r.user_id = $1 and r.name = 'Routine 7' and e.slug = 'barbell-bench-press'`,
    [user.id],
  );
  await page.reload();
  await start(page).click();
  const dot = (n: number) =>
    chooser(page).getByRole('button', { name: `Show routine page ${String(n)} of 3` });
  await expect(dot(1)).toHaveAttribute('aria-pressed', 'true');
  await expect(chooser(page).getByRole('listitem')).toHaveText([
    /Routine 1/,
    /Routine 2/,
    /Routine 3/,
  ]);

  const slide = chooser(page).getByRole('group', { name: 'Routine page 1 of 3' });
  const box = await slide.boundingBox();
  if (!box) throw new Error('Missing routine slide');
  const cdp = await context.newCDPSession(page);
  const x = box.x + box.width * 0.9;
  const y = box.y + 20;
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x, y }],
  });
  for (let step = 1; step <= 12; step++) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: x - (box.width * 0.8 * step) / 12, y }],
    });
    await page.waitForTimeout(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
  await expect(dot(2)).toHaveAttribute('aria-pressed', 'true');
  await expect(chooser(page).getByRole('listitem')).toHaveText([
    /Routine 4/,
    /Routine 5/,
    /Routine 6/,
  ]);

  await dot(2).focus();
  await page.keyboard.press('End');
  await expect(dot(3)).toBeFocused();
  await expect(dot(3)).toHaveAttribute('aria-pressed', 'true');
  await expect(chooser(page).getByRole('listitem')).toHaveCount(1);
  await page.setViewportSize({ width: 1280, height: 851 });
  await expect(chooser(page).getByRole('button', { name: 'Start Routine 7' })).toBeInViewport();
  await page.keyboard.press('Home');
  await expect(dot(1)).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('ArrowRight');
  await expect(dot(2)).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('ArrowLeft');
  await expect(dot(1)).toHaveAttribute('aria-pressed', 'true');
  await dot(3).click();
  await expect(chooser(page).getByRole('button', { name: 'Start Routine 7' })).toBeEnabled();
  await context.setOffline(true);
  await chooser(page).getByRole('button', { name: 'Start Routine 7' }).click();
  await expect(
    page.getByRole('heading', { name: 'Barbell Bench Press', exact: true }),
  ).toBeVisible();
});
