import { expect, test, type Locator, type Page } from '@playwright/test';
import { createUser, sql } from './support/backend.js';
import { logSet, signIn, startWith, waitForCatalogue } from './support/app.js';
import { APP_URL } from './support/urls.js';

async function expectToken(element: Locator, property: string, token: string) {
  await expect
    .poll(() =>
      element.evaluate(
        (node, { property, token }) => {
          const probe = document.createElement('span');
          probe.style.color = `var(--${token})`;
          node.append(probe);
          const expected = getComputedStyle(probe).color;
          probe.remove();
          return getComputedStyle(node).getPropertyValue(property) === expected;
        },
        { property, token },
      ),
    )
    .toBe(true);
}

async function expectFits(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator('.stat-glow')).toHaveCount(0);
}

// Palette checks need an unobscured screen, not each banner's auto-dismiss timer.
// Use the supported upward flick; achievement delivery has its own browser tests.
async function dismissAchievementBanner(page: Page) {
  const banner = page.locator('[data-achievement-banner]');
  await expect(banner).toBeVisible();
  const box = await banner.getByRole('button').boundingBox();
  if (box === null) throw new Error('Achievement banner has no visible bounds');
  const x = box.x + box.width / 2;
  await page.mouse.move(x, box.y + box.height - 8);
  await page.mouse.down();
  await page.mouse.move(x, box.y + 8, { steps: 3 });
  await page.mouse.up();
  await expect(banner).toBeHidden();
}

for (const theme of ['dark', 'light'] as const) {
  for (const width of [320, 393, 1280]) {
    test(`Graphite + Volt: ${theme}, ${String(width)}px`, async ({ page, context }, info) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width, height: 852 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.addInitScript((value) => {
        if (localStorage.getItem('g7m.theme') === null) localStorage.setItem('g7m.theme', value);
      }, theme);
      const user = await createUser('graphite-volt', { onboarded: true, displayName: 'Alex' });
      // Current and previous periods give the chart real data in either month.
      await sql(
        `with sessions as (
          insert into public.workout_sessions (user_id, name, started_at, ended_at)
          select $1, 'Strength training', started, started + interval '45 minutes'
          from (
            select date_trunc('month', now())
              + least(n * 6, extract(day from now())::int - 1) * interval '1 day' + interval '1 hour' started
            from generate_series(0, 3) n
            union all
            select date_trunc('month', now()) - interval '1 month' + n * interval '9 days' + interval '1 hour'
            from generate_series(0, 2) n
          ) t
          returning id
        ), entries as (
          insert into public.session_exercises (user_id, session_id, exercise_id, order_key)
          select $1, s.id, e.id, 'a0' from sessions s, public.exercises e
          where e.slug = 'barbell-bench-press' returning id
        ) insert into public.session_sets
          (user_id, session_exercise_id, order_key, weight_kg, reps, is_completed, completed_at)
          select $1, id, 'a0', 50, 8, true, now() from entries`,
        [user.id],
      );
      await signIn(page, user);
      await waitForCatalogue(page);
      const dismiss = page.getByRole('button', { name: 'Dismiss app tour invitation' });
      if (await dismiss.isVisible()) await dismiss.click();
      await expectToken(page.locator('body'), 'background-color', 'bg-base');
      const start = page.getByRole('button', { name: /^Start a workout/ });
      await expectToken(start, 'background-color', 'accent');
      await expectToken(start, 'color', 'text-on-accent');
      if (await page.evaluate(() => matchMedia('(hover: hover)').matches)) {
        await start.hover();
        await expectToken(start, 'background-color', 'accent-hover');
      }
      await page.keyboard.press('Tab');
      await start.focus();
      await expect(start).toBeFocused();
      await expectToken(start, 'outline-color', 'accent');
      for (const name of ['Calendar', 'Browse exercises', 'Progress']) {
        await expectToken(
          page.getByRole('link', { name: new RegExp(`^${name}`) }),
          'background-color',
          'bg-surface',
        );
      }
      await expectToken(page.getByRole('link', { name: 'Home', exact: true }), 'color', 'accent');
      await expectToken(
        start.getByText('Start a workout', { exact: true }),
        'color',
        'text-on-accent',
      );
      await expectFits(page);
      await dismissAchievementBanner(page);
      await page
        .locator('[aria-roledescription="carousel"][aria-label="This month"]')
        .evaluate((track) => {
          const first = track.firstElementChild as HTMLElement;
          track.scrollTo({ left: first.offsetWidth + 12, behavior: 'instant' });
        });
      await expect(page.getByRole('link', { name: /^Workouts this month:/ })).toBeInViewport({
        ratio: 0.95,
      });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.mouse.move(0, 0);
      await page.locator('body').click({ position: { x: 1, y: 1 } });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: info.outputPath(`home-${theme}-${String(width)}.png`),
        fullPage: true,
      });
      await start.click();
      const chooser = page.getByRole('dialog', { name: 'Start a workout', exact: true });
      await expect(chooser).toBeVisible();
      await expectToken(chooser, 'background-color', 'bg-surface');
      await expectFits(page);
      await page.screenshot({ path: info.outputPath('start-dialog.png'), fullPage: true });
      await chooser.getByRole('button', { name: 'Cancel', exact: true }).click();
      // The workout path still works, including completed-set feedback offline.
      await startWith(page, 'Barbell Bench Press');
      await logSet(page, 1, '55', '8');
      await dismissAchievementBanner(page);
      const finish = page.getByRole('button', { name: 'Finish workout', exact: true });
      await expectToken(finish, 'background-color', 'accent');
      await expectToken(finish, 'color', 'text-on-accent');
      await expectFits(page);
      await page.screenshot({ path: info.outputPath('workout.png'), fullPage: true });
      await page.goto('/#/');
      const resume = page.getByRole('link', { name: /In progress.*Continue/ });
      await expectToken(resume, 'background-color', 'accent');
      await expectToken(resume, 'color', 'text-on-accent');
      await expect(page.getByRole('button', { name: /^Start a workout/ })).toHaveCount(0);
      await page.screenshot({ path: info.outputPath('home-active.png'), fullPage: true });
      await resume.click();
      await page.getByRole('link', { name: '+ Add an exercise' }).click();
      await expect(page.getByLabel('Search')).toBeVisible();
      await expect(page.getByRole('button', { name: /^Barbell Bench Press/ })).toBeVisible();
      await expectFits(page);
      await page.screenshot({ path: info.outputPath('browse.png') });
      await page.goto('/#/workout');
      await context.setOffline(true);
      await finish.click();
      await expect(page.getByRole('heading', { name: 'Workout saved', exact: true })).toBeVisible();
      await expect(page.getByRole('region', { name: 'Your session', exact: true })).toBeVisible();
      await expect(page.getByText('440 kg', { exact: true })).toBeVisible();
      await expectFits(page);
      await page.screenshot({ path: info.outputPath('recap.png'), fullPage: true });
      await page.getByRole('button', { name: 'Show Compared with last time', exact: true }).click();
      await expect(
        page.getByRole('region', { name: 'Compared with last time', exact: true }),
      ).toBeInViewport({ ratio: 0.95 });
      await page.screenshot({ path: info.outputPath('recap-comparison.png'), fullPage: true });
      await context.setOffline(false);
      await page.getByRole('link', { name: 'Done', exact: true }).click();
      await page.goto('/#/progress');
      await expect(page.getByRole('heading', { name: 'Progress', exact: true })).toBeVisible();
      await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
      await expectFits(page);
      await page.screenshot({ path: info.outputPath('progress.png'), fullPage: true });
      await page.goto('/#/learn');
      const stage = page.locator('[data-tour="body"]');
      await expect(stage.locator('canvas')).toBeVisible();
      await expectToken(stage, 'background-color', 'bg-stage');
      // Canvas visibility precedes Three.js's first frame and GPU compositing.
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );
      await page.waitForTimeout(500);
      await expectFits(page);
      await page.screenshot({ path: info.outputPath('anatomy.png'), fullPage: true });
      await page.goto('/#/settings');
      const switcher = page.getByRole('switch', { name: /Dark mode/ });
      await switcher.click();
      await expect(page.locator('html')).toHaveAttribute(
        'data-theme',
        theme === 'dark' ? 'light' : 'dark',
      );
      await page.reload();
      await expect(page.locator('html')).toHaveAttribute(
        'data-theme',
        theme === 'dark' ? 'light' : 'dark',
      );
    });
  }
}

test('desktop actions use readable foregrounds through hover, press and keyboard focus', async ({
  browser,
}) => {
  for (const theme of ['dark', 'light'] as const) {
    const context = await browser.newContext({
      baseURL: APP_URL,
      viewport: { width: 1280, height: 900 },
      hasTouch: false,
      isMobile: false,
    });
    try {
      const page = await context.newPage();
      await page.addInitScript((value) => localStorage.setItem('g7m.theme', value), theme);
      const user = await createUser('graphite-desktop', { onboarded: true });
      await signIn(page, user);
      await waitForCatalogue(page);
      const start = page.getByRole('button', { name: /^Start a workout/ });
      await expectToken(start, 'background-color', 'accent');
      await start.hover();
      await expectToken(start, 'background-color', 'accent-hover');
      await expectToken(
        start.getByText('Start a workout', { exact: true }),
        'color',
        'text-on-accent',
      );
      await page.mouse.down();
      await expectToken(start, 'background-color', 'accent-pressed');
      await expectToken(start, 'color', 'text-on-accent');
      await page.mouse.move(0, 0);
      await page.mouse.up();
      await page.keyboard.press('Tab');
      await start.focus();
      await expect(start).toHaveCSS('outline-style', 'solid');
      await expectToken(start, 'outline-color', 'accent');
    } finally {
      await context.close();
    }
  }
});
