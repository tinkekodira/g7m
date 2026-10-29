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

test('long routine list keeps blank controls visible with focus contained in both themes', async ({
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
      await expect(chooser(page).getByRole('listitem')).toHaveCount(18);
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
