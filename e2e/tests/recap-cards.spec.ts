import { expect, test, type Page } from '@playwright/test';
import { createUser, sql } from './support/backend.js';
import { signIn, waitForCatalogue } from './support/app.js';

const titles = ['Your session', 'Muscles trained', 'Compared with last time', 'Exercise log'];

async function expectActionsClearOfNavigation(page: Page) {
  const actions = page.getByRole('group', { name: 'Workout actions', exact: true });
  const navigation = await page
    .getByRole('navigation', { name: 'Main', exact: true })
    .boundingBox();
  for (const action of [
    actions.getByRole('link', { name: 'Done', exact: true }),
    actions.getByRole('button', { name: 'Save as a routine' }),
    actions.getByRole('button', { name: 'Delete workout' }),
  ]) {
    await expect(action).toBeInViewport({ ratio: 1 });
    const box = await action.boundingBox();
    expect(box!.y + box!.height).toBeLessThanOrEqual(navigation!.y);
  }
  expect(await page.evaluate(() => scrollY)).toBe(0);
}

async function show(page: Page, title: string) {
  const dot = page.getByRole('button', { name: `Show ${title}`, exact: true });
  await dot.click();
  await expect(dot).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('region', { name: title, exact: true })).toBeInViewport({
    ratio: 0.9,
  });
  await expect
    .poll(() =>
      page
        .locator('.recap-track')
        .evaluate((el) =>
          Math.abs(
            el.scrollLeft -
              el.clientWidth *
                Array.from(el.children).findIndex(
                  (child) => child.getAttribute('aria-hidden') === 'false',
                ),
          ),
        ),
    )
    .toBeLessThan(1);
}

test('recap pages show session-only muscles, bounded weight history and accessible shared actions', async ({
  page,
  context,
}, info) => {
  test.setTimeout(120_000);
  const user = await createUser('recap-cards', { onboarded: true });
  const sessions: string[] = [];
  // Include a later workout, so reopening the middle session must cut off history.
  for (const [days, weight] of [
    [12, 20],
    [8, 30],
    [4, 25],
    [1, 200],
  ]) {
    const [row] = await sql<{ id: string }>(
      `with workout as (
        insert into public.workout_sessions (user_id, name, started_at, ended_at)
        values ($1, 'Upper body', now() - $2::int * interval '1 day', now() - $2::int * interval '1 day' + interval '1 hour') returning id
      ), entry as (
        insert into public.session_exercises (user_id, session_id, exercise_id, order_key)
        select $1, workout.id, e.id, 'a0' from workout, public.exercises e
        where e.slug = 'shoulder-press-machine' returning id, session_id
      ), sets as (
        insert into public.session_sets (user_id, session_exercise_id, order_key, weight_kg, reps, is_completed, completed_at)
        select $1, entry.id, 'a' || lpad(n::text, 2, '0'), $3, 8, true, now() - $2::int * interval '1 day'
        from entry, generate_series(1,12) n
      ) select session_id id from entry`,
      [user.id, days, weight],
    );
    sessions.push(row!.id);
  }
  await signIn(page, user);
  await waitForCatalogue(page);
  const xpFrames: string[] = [];
  await page.exposeFunction('recordRecapXp', (value: string) => xpFrames.push(value));
  await page.evaluate(() => {
    let last = '';
    new MutationObserver(() => {
      const value = document.querySelector('.recap-xp [aria-hidden]')?.textContent ?? '';
      if (value !== '' && value !== last) {
        last = value;
        void (
          globalThis as typeof globalThis & { recordRecapXp: (value: string) => Promise<void> }
        ).recordRecapXp(value);
      }
    }).observe(document.documentElement, { childList: true, characterData: true, subtree: true });
  });
  await page.goto(`/#/progress/session/${sessions[2]!}`);
  const totals = page.getByRole('region', { name: 'Your session', exact: true });
  await expect(totals).toContainText('2.4 t');
  await expectActionsClearOfNavigation(page);
  await expect(page.getByRole('link', { name: 'Done', exact: true })).toHaveCount(1);
  await expect(totals).not.toContainText('Includes applicable');
  await expect(page.getByRole('heading', { name: 'Muscles trained', exact: true })).toHaveCount(0);
  const xp = page.locator('.recap-xp');
  const finalXp = await xp.locator('.sr-only').innerText();
  await expect(xp.locator('[aria-hidden]')).toHaveText(finalXp);
  expect(xpFrames).toContain('+1 XP');
  expect(xpFrames.some((value) => value !== '+1 XP' && value !== finalXp)).toBe(true);

  // This session crosses the first level threshold. Recreate the state passed by Finish.
  await page.goto(`/#/progress/session/${sessions[1]!}`);
  await page.evaluate(() =>
    history.replaceState({ ...history.state, usr: { workoutFinished: true } }, ''),
  );
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Workout saved', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Done', exact: true })).toHaveCount(1);
  const level = page.locator('.recap-level');
  await expect(level).toContainText('Level up!');
  await expect(level).toHaveCSS('animation-name', 'recap-level-up');
  await expect(level).toHaveCSS('opacity', '1');
  await page.screenshot({ path: info.outputPath('level-up.png') });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(level).toHaveCSS('animation-name', 'none');
  await page.goto(`/#/progress/session/${sessions[2]!}`);
  await expect(xp.locator('[aria-hidden]')).toHaveText(await xp.locator('.sr-only').innerText());

  await show(page, 'Muscles trained');
  const body = page.getByRole('img', { name: /^Muscles worked this session:/ });
  await expect(body).toHaveAttribute('aria-label', /triceps/i);
  await expect(body).not.toHaveAttribute('aria-label', /quadriceps|hamstrings|glute/i);
  await expect(page.getByRole('region', { name: 'Muscles trained', exact: true })).toContainText(
    '100%',
  );
  await expect(
    page.getByRole('region', { name: 'Muscles trained', exact: true }),
  ).not.toContainText('The model highlights');
  await expect(page.locator('canvas')).toHaveCount(2);
  await expect(
    page.getByRole('status').filter({ hasText: 'From your past training' }),
  ).toBeHidden();

  await show(page, 'Compared with last time');
  const graph = page.getByRole('img', { name: /^Weight progress/ });
  await expect(graph).toHaveAttribute('aria-label', /last 3 sessions/);
  await expect(graph).toHaveAttribute('aria-label', /20 kg.*30 kg.*25 kg/);
  await expect(graph).not.toHaveAttribute('aria-label', /200 kg/);
  await expect(
    page.getByRole('region', { name: 'Compared with last time', exact: true }),
  ).toContainText('Previous30 kg');
  const comparison = page.locator('.recap-comparison');
  await expect(comparison).toContainText('Best set25 kg');
  await expect(comparison.locator('img')).toBeVisible();
  await expect
    .poll(() => comparison.locator('img').evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);

  // Keyboard navigation moves focus with the selected page; inactive pages are inert.
  const third = page.getByRole('button', { name: 'Show Compared with last time' });
  await third.focus();
  await third.press('ArrowRight');
  const last = page.getByRole('button', { name: 'Show Exercise log' });
  await expect(last).toBeFocused();
  await expect(last).toHaveAttribute('aria-pressed', 'true');
  const log = page.getByRole('region', { name: 'Exercise log', exact: true });
  await expect(log).toContainText('Shoulder press machine');
  await log.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  const actions = page.getByRole('group', { name: 'Workout actions', exact: true });
  await expect(actions.getByRole('link', { name: 'Done', exact: true })).toBeVisible();
  await expect(actions.getByRole('button', { name: 'Save as a routine' })).toBeVisible();
  await expect(actions.getByRole('button', { name: 'Delete workout' })).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });

  for (const [width, height] of [
    [320, 568],
    [390, 667],
    [412, 850],
    [1280, 1000],
  ] as const) {
    await page.setViewportSize({ width, height });
    await expect(last).toHaveAttribute('aria-pressed', 'true');
    await expect(log).toBeInViewport({ ratio: 0.9 });
    for (const theme of ['dark', 'light']) {
      // Use Settings so the WebGL stage and CSS tokens share the actual theme state.
      await page.goto('/#/settings');
      const dark = page.getByRole('switch', { name: 'Dark mode' });
      await expect(dark).toBeVisible();
      if ((await dark.getAttribute('aria-checked')) !== String(theme === 'dark'))
        await dark.click();
      await page.goto(`/#/progress/session/${sessions[2]!}`);
      await expect(totals).toContainText('2.4 t');
      for (const title of titles) {
        await show(page, title);
        await page.getByRole('region', { name: title, exact: true }).evaluate((el) => {
          el.scrollTop = 0;
        });
        if (title === 'Muscles trained') {
          await expect(page.locator('canvas')).toHaveCount(2);
          // Wait for demand-rendered frames, rather than screenshotting empty canvases.
          await page.evaluate(
            () =>
              new Promise<void>((resolve) =>
                requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
              ),
          );
          await page.waitForTimeout(500); // Let the on-demand WebGL frame reach the compositor.
        }
        await expect(actions.getByRole('link', { name: 'Done', exact: true })).toBeVisible();
        await expectActionsClearOfNavigation(page);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        await page.screenshot({
          path: info.outputPath(`${width}-${theme}-${title.replaceAll(' ', '-')}.png`),
          fullPage: false,
        });
        await expect(
          page.getByRole('button', { name: `Show ${title}`, exact: true }),
        ).toHaveAttribute('aria-pressed', 'true');
      }
    }
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await show(page, 'Your session');
  // A native swipe from right to left updates the same pagination state.
  await page.setViewportSize({ width: 412, height: 850 });
  const rect = await page.locator('.recap-track').boundingBox();
  const cdp = await context.newCDPSession(page);
  const y = rect!.y + 150;
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: rect!.x + rect!.width * 0.9, y }],
  });
  for (let step = 1; step <= 12; step++) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: rect!.x + rect!.width * (0.9 - step / 15), y }],
    });
    await page.waitForTimeout(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
  await expect(page.getByRole('button', { name: 'Show Muscles trained' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await context.setOffline(true);
  await page.reload();
  await expect(totals).toContainText('2.4 t');
  await show(page, 'Muscles trained');
  await expect(page.locator('canvas')).toHaveCount(2);
  await show(page, 'Compared with last time');
  await expect(graph).toHaveAttribute('aria-label', /last 3 sessions/);
  await show(page, 'Exercise log');
  await actions.getByRole('button', { name: 'Save as a routine' }).click();
  await page.getByLabel('Routine name').fill('Upper replay');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your routines' })).toBeVisible();
});

test('comparison cards group equipment, best sets and trends for a full workout', async ({
  page,
}, info) => {
  const user = await createUser('recap-comparison-layout', { onboarded: true });
  const sessions = await sql<{ id: string }>(
    `with workouts as (
      insert into public.workout_sessions (user_id, name, started_at, ended_at)
      select $1, 'Full body', now() - n * interval '2 days' - interval '45 minutes', now() - n * interval '2 days'
      from generate_series(0,5) n returning id, started_at
    ), entries as (
      insert into public.session_exercises (user_id, session_id, exercise_id, order_key)
      select $1, w.id, e.id, e.slug from workouts w, public.exercises e
      where e.slug in ('barbell-back-squat', 'romanian-deadlift', 'barbell-row')
      returning id, session_id, exercise_id
    ), sets as (
      insert into public.session_sets (user_id, session_exercise_id, order_key, weight_kg, reps, is_completed, completed_at)
      select $1, se.id, 'a' || n,
        case e.slug when 'barbell-back-squat' then 130 - 5 * floor(extract(epoch from (now() - w.started_at)) / 172800)
          when 'romanian-deadlift' then 95 - 2.5 * floor(extract(epoch from (now() - w.started_at)) / 172800)
          else 30 end,
        case e.slug when 'barbell-back-squat' then 5 when 'romanian-deadlift' then 8 else 6 end,
        true, w.started_at + interval '40 minutes'
      from entries se join workouts w on w.id = se.session_id join public.exercises e on e.id = se.exercise_id,
        generate_series(1,3) n
    ) select id from workouts order by started_at desc`,
    [user.id],
  );
  await signIn(page, user);
  await waitForCatalogue(page);
  await page.goto(`/#/progress/session/${sessions[0]!.id}`);
  await show(page, 'Compared with last time');
  const cards = page.locator('.recap-comparison');
  await expect(cards).toHaveCount(3);
  await expect(cards.filter({ hasText: 'Barbell Back Squat' })).toContainText('130 kg × 5');
  await expect(cards.filter({ hasText: 'Barbell Row' })).toContainText('No change');
  await expect(cards.filter({ hasText: 'Romanian Deadlift' })).toContainText('2.5 kg');
  await expect(
    page.getByRole('status').filter({ hasText: 'From your past training' }),
  ).toBeHidden();
  for (const [width, height] of [
    [390, 844],
    [1280, 1000],
  ] as const) {
    await page.setViewportSize({ width, height });
    await expectActionsClearOfNavigation(page);
    await page.screenshot({ path: info.outputPath(`comparison-${width}.png`) });
  }
  await cards.filter({ hasText: 'Romanian Deadlift' }).click();
  await expect(page.getByRole('heading', { name: 'Romanian Deadlift', exact: true })).toBeVisible();
});
