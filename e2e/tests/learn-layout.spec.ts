import { expect, test, type Page } from '@playwright/test';
import { createUser, sql } from './support/backend.js';
import { openTab, signIn, waitForCatalogue } from './support/app.js';
import { expectToken } from './support/theme.js';

test.use({ deviceScaleFactor: 1, reducedMotion: 'reduce' });

// Network overrides must bypass the service worker; keep it enabled for the offline test.
const layoutTest = test.extend({ serviceWorkers: 'block' });

async function seedTraining(userId: string) {
  await sql(
    `with sessions as (
      insert into public.workout_sessions (user_id, started_at, ended_at)
      select $1, now() - n * interval '1 day' - interval '45 minutes',
        now() - n * interval '1 day' from generate_series(1, 5) n returning id
    ), entries as (
      insert into public.session_exercises (user_id, session_id, exercise_id, order_key)
      select $1, s.id, e.id, 'a0' from sessions s, public.exercises e
      where e.slug = 'barbell-bench-press' returning id
    ) insert into public.session_sets
      (user_id, session_exercise_id, order_key, weight_kg, reps, is_completed, completed_at)
      select $1, id, 'a0', 50, 8, true, now() from entries`,
    [userId],
  );
}

async function expectArtwork(page: Page) {
  const rows = page.locator('.learn-exercise-row');
  await expect(rows.first()).toBeVisible();
  await expect
    .poll(() =>
      rows
        .locator('img')
        .first()
        .evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth === 320),
    )
    .toBe(true);
  await expect(rows.first().locator('img')).toHaveCSS('object-fit', 'contain');
  await expect
    .poll(() =>
      rows.evaluateAll((elements) =>
        elements.every(
          (row) => row.scrollWidth <= row.clientWidth && row.getBoundingClientRect().height >= 48,
        ),
      ),
    )
    .toBe(true);
}

for (const theme of ['dark', 'light'] as const) {
  layoutTest(
    `Learn shows a full-width body above illustrated exercises in ${theme}`,
    async ({ page }, info) => {
      test.setTimeout(120_000);
      // Match CI's public checkout even when a licensed model is installed locally.
      // The separate input/offline scenario also exercises whichever model is installed.
      await page.route('**/anatomy/manifest.json', (route) => route.fulfill({ status: 404 }));
      await page.addInitScript((value) => localStorage.setItem('g7m.theme', value), theme);
      const user = await createUser(`learn-${theme}`, { onboarded: true });
      await seedTraining(user.id);
      await signIn(page, user);
      await waitForCatalogue(page);
      // Advice needs five local sessions, not just the first catalogue row.
      await openTab(page, 'Progress');
      const recent = page.locator('section', {
        has: page.getByRole('heading', { name: 'Recent workouts', exact: true }),
      });
      await expect(recent.getByRole('link')).toHaveCount(5);
      await openTab(page, 'Learn');
      const picker = page.getByRole('combobox', { name: 'Choose a muscle' });
      const results = page.getByRole('region', { name: 'Muscle exercises', exact: true });
      const stage = page.locator('[data-tour="body"]');
      const canvas = stage.locator('canvas');
      await expect(canvas).toBeVisible();
      const viewer = await canvas.elementHandle();
      await expect(
        page.getByText(/The figure is generated from origins and insertions/),
      ).toBeVisible();

      for (const width of [320, 393, 1280]) {
        await page.setViewportSize({ width, height: 852 });
        await page.evaluate(() => window.scrollTo(0, 0));
        await picker.selectOption({ label: 'Abs' });
        await expect(results.getByRole('heading', { name: 'Abs', exact: true })).toBeVisible();
        await expect(results.getByRole('heading', { name: 'Compound', exact: true })).toBeVisible();
        await expectArtwork(page);
        await expectToken(stage, 'background-color', 'bg-stage');
        await expectToken(
          results.getByRole('heading', { name: 'Abs', exact: true }),
          'color',
          'accent',
        );
        const modelBox = (await canvas.boundingBox())!;
        const listBox = (await results.boundingBox())!;
        const columnBox = (await page.locator('.learn-body-column').boundingBox())!;
        expect(modelBox.width).toBeCloseTo(columnBox.width, 0);
        expect(modelBox.y + modelBox.height).toBeLessThan(listBox.y);
        expect(Math.abs(modelBox.x - listBox.x)).toBeLessThanOrEqual(4);
        expect(Math.abs(modelBox.width - listBox.width)).toBeLessThanOrEqual(8);
        if (width < 768) expect(modelBox.width).toBeGreaterThanOrEqual(width - 32);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
          width,
        );
        expect(
          (await page.getByRole('button', { name: 'Clear', exact: true }).boundingBox())?.height,
        ).toBeGreaterThanOrEqual(48);
        await expect(
          page.getByRole('status').filter({ hasText: /From your past training/i }),
        ).toBeHidden();
        await page.screenshot({ path: info.outputPath(`learn-model-${theme}-${width}.png`) });

        // Answers use document scrolling, with no narrow column or nested scroll trap.
        await expect(results).toHaveCSS('overflow-y', 'visible');
        await results.getByRole('link').last().scrollIntoViewIfNeeded();
        await expect(results.getByRole('link').last()).toBeInViewport();
        expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
        expect(await results.evaluate((el) => el.scrollTop)).toBe(0);
        expect(await viewer?.evaluate((node) => node.isConnected)).toBe(true);
        await results.getByRole('heading', { name: 'Abs', exact: true }).scrollIntoViewIfNeeded();
        await page.screenshot({ path: info.outputPath(`learn-exercises-${theme}-${width}.png`) });

        // Long muscle and exercise names wrap instead of colliding with Clear or the art.
        await picker.selectOption({ label: 'Mid and lower chest' });
        await expect(
          results.getByRole('heading', { name: 'Mid and lower chest', exact: true }),
        ).toBeVisible();
        await expectArtwork(page);
        await results.getByRole('button', { name: 'Clear', exact: true }).click();
        await expect(picker).toHaveValue('');

        await page.getByRole('radio', { name: 'What I have trained' }).click();
        const suggestions = page.getByRole('region', { name: 'Worth adding', exact: true });
        await expect(suggestions).toBeVisible();
        await expect(suggestions.getByRole('link').first()).toBeVisible();
        await expectArtwork(page);
        await expect(suggestions).toContainText('sets behind');
        const suggestionBox = (await suggestions.boundingBox())!;
        const heatBodyBox = (await canvas.boundingBox())!;
        expect(heatBodyBox.y + heatBodyBox.height).toBeLessThan(suggestionBox.y);
        expect(await viewer?.evaluate((node) => node.isConnected)).toBe(true);
        await suggestions
          .getByRole('heading', { name: 'Worth adding', exact: true })
          .scrollIntoViewIfNeeded();
        await page.screenshot({ path: info.outputPath(`learn-heatmap-${theme}-${width}.png`) });
        await page.getByRole('radio', { name: 'Explore', exact: true }).click();
      }
      await picker.selectOption({ label: 'Abs' });
      await expect(results.getByRole('heading', { name: 'Abs', exact: true })).toBeVisible();
      await page.getByRole('radio', { name: 'What I have trained' }).click();
      await expect(picker).toHaveValue('');
      await expect(results.getByRole('heading', { name: 'Abs', exact: true })).toHaveCount(0);
      await expect(
        results.getByRole('heading', { name: 'Worth adding', exact: true }),
      ).toBeVisible();
      // iPhone safe areas must not put the last exercise under the tab bar.
      await page.setViewportSize({ width: 393, height: 852 });
      await page.evaluate(() => {
        document.documentElement.style.setProperty('--spacing-safe-top', '59px');
        document.documentElement.style.setProperty('--spacing-safe-bottom', '34px');
      });
      await page.getByRole('radio', { name: 'Explore', exact: true }).click();
      await picker.selectOption({ label: 'Abs' });
      const last = results.getByRole('link').last();
      await last.scrollIntoViewIfNeeded();
      await expect(last).toBeInViewport();
      const lastBox = (await last.boundingBox())!;
      const navBox = (await page
        .getByRole('navigation', { name: 'Main', exact: true })
        .boundingBox())!;
      expect(lastBox.y + lastBox.height).toBeLessThanOrEqual(navBox.y);
    },
  );
}

test('Learn supports direct model taps, rotation, page scrolling, and offline exercise links', async ({
  page,
  context,
}) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => {
    // The original is deliberately invoked with the live WebGL context via apply below.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const drawElements = WebGL2RenderingContext.prototype.drawElements;
    WebGL2RenderingContext.prototype.drawElements = function (...args) {
      if (this.canvas instanceof HTMLCanvasElement) {
        const draws = Number(this.canvas.dataset['draws'] ?? '0');
        this.canvas.dataset['draws'] = String(draws + 1);
      }
      return drawElements.apply(this, args);
    };
  });
  await page.setViewportSize({ width: 393, height: 852 });
  const user = await createUser('learn-input', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);
  await openTab(page, 'Learn');
  const picker = page.getByRole('combobox', { name: 'Choose a muscle' });
  const results = page.getByRole('region', { name: 'Muscle exercises', exact: true });
  const canvas = page.locator('[data-tour="body"] canvas');
  await expect(canvas).toBeVisible();
  await expect(picker.locator('option')).not.toHaveCount(1);
  // Canvas creation precedes the model's first GPU-composited frame.
  await page.waitForTimeout(500);
  const box = (await canvas.boundingBox())!;
  const element = await canvas.elementHandle();
  for (const y of [0.4, 0.48, 0.32, 0.58]) {
    for (const x of [0.5, 0.4, 0.6]) {
      await page.touchscreen.tap(box.x + box.width * x, box.y + box.height * y);
      await page.waitForTimeout(75);
      if (await picker.inputValue()) break;
    }
    if (await picker.inputValue()) break;
  }
  await expect(picker).not.toHaveValue('');
  await expect(results.getByRole('heading', { level: 2 }).first()).toBeVisible();
  expect(await element?.evaluate((node) => node.isConnected)).toBe(true);

  // The body stops drawing while idle, but a new selection still paints a frame.
  await picker.selectOption('');
  await expect(canvas).toHaveAttribute('data-draws', /\d+/);
  await expect
    .poll(async () => {
      const before = await canvas.getAttribute('data-draws');
      await page.waitForTimeout(200);
      return before === (await canvas.getAttribute('data-draws'));
    })
    .toBe(true);
  const unselected = await canvas.screenshot();
  await picker.selectOption({ label: 'Abs' });
  await expect.poll(async () => unselected.equals(await canvas.screenshot())).toBe(false);

  // A real drag changes the rendered body, rather than moving a static mockup.
  const before = await canvas.screenshot();
  await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.5, { steps: 16 });
  await page.mouse.up();
  await expect.poll(async () => before.equals(await canvas.screenshot())).toBe(false);
  expect(await element?.evaluate((node) => node.isConnected)).toBe(true);
  await picker.selectOption({ label: 'Abs' });
  await expectArtwork(page);

  await results.getByRole('link').first().scrollIntoViewIfNeeded();
  const beforeScroll = await page.evaluate(() => window.scrollY);
  const cdp = await context.newCDPSession(page);
  const x = 393 / 2;
  const y = 852 - 110;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let step = 1; step <= 12; step++) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x, y: y - (step * 320) / 12 }],
    });
    await page.waitForTimeout(16);
  }
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-touch-scrolling', 'true');
    document.addEventListener(
      'scrollend',
      () => document.documentElement.removeAttribute('data-touch-scrolling'),
      {
        once: true,
      },
    );
  });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(beforeScroll);
  await expect(page.locator('html')).not.toHaveAttribute('data-touch-scrolling', 'true');
  expect(await results.evaluate((el) => el.scrollTop)).toBe(0);
  expect(await element?.evaluate((node) => node.isConnected)).toBe(true);

  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (navigator.serviceWorker.controller === null) {
      await new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), {
          once: true,
        }),
      );
    }
  });
  await context.setOffline(true);
  try {
    await page.reload();
    await expect(canvas).toBeVisible();
    await picker.selectOption({ label: 'Abs' });
    await expectArtwork(page);
    const first = results.getByRole('link').first();
    const name = (await first.innerText()).trim();
    await first.click();
    await expect(page.getByRole('heading', { level: 1, name, exact: true })).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});
