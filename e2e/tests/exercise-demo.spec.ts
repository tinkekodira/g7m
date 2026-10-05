import { expect, test, type Page } from '@playwright/test';
import { createUser } from './support/backend.js';
import { signIn } from './support/app.js';

/**
 * The demonstration loop on an exercise's page (ADR-0102).
 *
 * Fifteen exercises have one (`WITH_LOOP` below); the rest do not. It plays in
 * the "How to do it" card, the MP4 in the dark theme and the transparent WebP
 * in the light one, the poster alone under reduced motion, and none of it is
 * fetched until somebody scrolls to it.
 */

/** Open an exercise and scroll its "How to do it" card into view. */
async function openHowTo(page: Page, slug: string, name: string): Promise<void> {
  await page.goto(`/#/exercises/${slug}`);
  // The real name, so nothing below runs against the page before it loads.
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
  await page.getByRole('heading', { level: 2, name: 'How to do it' }).scrollIntoViewIfNeeded();
}

/** The tags directly inside the "How to do it" card, in order. */
async function howToCard(page: Page): Promise<string[]> {
  return page
    .getByRole('heading', { level: 2, name: 'How to do it' })
    .locator('..')
    .evaluate((card) => Array.from(card.children, (child) => child.tagName));
}

/** Every exercise with a loop: its slug and its name as the page heads it. */
const WITH_LOOP = [
  ['barbell-back-squat', 'Barbell Back Squat'],
  ['barbell-bench-press', 'Barbell Bench Press'],
  ['conventional-deadlift', 'Conventional Deadlift'],
  ['romanian-deadlift', 'Romanian Deadlift'],
  ['barbell-row', 'Barbell Row'],
  ['barbell-curl', 'Barbell Curl'],
  ['overhead-press', 'Overhead Press'],
  ['dumbbell-bench-press', 'Dumbbell Bench Press'],
  ['dumbbell-curl', 'Dumbbell Curl'],
  ['lateral-raise', 'Lateral Raise'],
  ['push-up', 'Push-Up'],
  ['pull-up', 'Pull-Up'],
  ['chin-up', 'Chin-Up'],
  ['lat-pulldown', 'Lat Pulldown'],
  ['leg-press', 'Leg Press'],
] as const;

test('every exercise with a loop plays it', async ({ page }) => {
  // Fifteen pages, each waiting for its video to start.
  test.setTimeout(180_000);
  const user = await createUser('demo', { onboarded: true });
  await signIn(page, user);
  // A browser that cannot decode H.264 never plays the MP4: it takes the
  // failure path below instead, which has a test of its own.
  test.skip(
    await page.evaluate(
      () => document.createElement('video').canPlayType('video/mp4; codecs="avc1.64001F"') === '',
    ),
    'This browser cannot decode H.264.',
  );

  for (const [slug, name] of WITH_LOOP) {
    await openHowTo(page, slug, name);
    const panel = page.getByRole('img', { name: `${name} demonstration` });
    await expect(panel).toBeVisible();
    const video = panel.locator('video');
    await expect(video).toHaveAttribute('src', new RegExp(`assets/demos/${slug}-[\\w-]+\\.mp4$`));
    await expect
      .poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime), {
        message: `${name} is playing`,
      })
      .toBeGreaterThan(0.3);
    // The column's width, square, and never wider than 360px.
    const box = await panel.boundingBox();
    expect(box?.width).toBeCloseTo(box?.height ?? 0, 0);
    expect(box?.width ?? 0).toBeLessThanOrEqual(360);
    // Above the steps, which are all still there.
    expect(await howToCard(page)).toEqual(['H2', 'DIV', 'OL']);
  }
});

test('an exercise without a loop keeps the card it had', async ({ page }) => {
  const user = await createUser('demo-none', { onboarded: true });
  await signIn(page, user);

  // Same bench as the bench press, a different movement, and no loop.
  await openHowTo(page, 'close-grip-bench-press', 'Close-Grip Bench Press');
  await expect(page.getByRole('img', { name: /demonstration$/ })).toHaveCount(0);
  await expect(page.locator('video')).toHaveCount(0);
  expect(await howToCard(page)).toEqual(['H2', 'OL']);
});

test.describe('when the loop cannot be loaded', () => {
  // The worker would make the request itself, out of reach of `page.route`.
  test.use({ serviceWorkers: 'block' });

  test('the panel goes, with no error, and the card is as it was', async ({ page }) => {
    const user = await createUser('demo-fail', { onboarded: true });
    await page.route('**/assets/demos/**', (route) => route.abort());
    await signIn(page, user);

    await openHowTo(page, 'barbell-back-squat', 'Barbell Back Squat');
    await expect(page.getByRole('img', { name: /demonstration$/ })).toHaveCount(0);
    expect(await howToCard(page)).toEqual(['H2', 'OL']);
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
});

/**
 * Two ways a loop could be downloaded without anyone asking for it: by the
 * list, and by the service worker's install. The second does not show up as
 * a page request, so it is checked in the cache itself.
 */
test('neither the exercise list nor the install downloads a loop', async ({ page }) => {
  const user = await createUser('demo-list', { onboarded: true });
  const loops: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/assets/demos/')) loops.push(request.url());
  });
  await signIn(page, user);

  await page.goto('/#/exercises');
  await expect(page.getByRole('link', { name: /^Barbell Back Squat/ })).toBeVisible();
  // Every row, top to bottom, so every icon has been asked for.
  await page.getByRole('link', { name: /^Cable Woodchop/ }).scrollIntoViewIfNeeded();
  await expect(page.getByRole('link', { name: /^Cable Woodchop/ }).locator('img')).toBeVisible();
  expect(loops).toEqual([]);

  const cached = await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    const urls: string[] = [];
    for (const name of await caches.keys()) {
      if (!name.startsWith('g7m-app-')) continue;
      const cache = await caches.open(name);
      urls.push(...(await cache.keys()).map((request) => request.url));
    }
    return urls;
  });
  // Not vacuous: the precache is there, and it holds the icons.
  expect(cached.some((url) => /assets\/squat-rack-[\w-]+\.png$/.test(url))).toBe(true);
  expect(cached.filter((url) => url.includes('/assets/demos/'))).toEqual([]);
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('shows the still frame and plays nothing', async ({ page }) => {
    const user = await createUser('demo-still', { onboarded: true });
    await signIn(page, user);
    const loops: string[] = [];
    page.on('request', (request) => {
      if (/assets\/demos\/.*\.(mp4|webp)$/.test(request.url())) loops.push(request.url());
    });

    await openHowTo(page, 'barbell-back-squat', 'Barbell Back Squat');
    const panel = page.getByRole('img', { name: 'Barbell Back Squat demonstration' });
    // The opaque poster, on the dark panel it was rendered for.
    await expect(panel.locator('img')).toHaveAttribute(
      'src',
      /assets\/demos\/barbell-back-squat-poster-(?!transparent)[\w-]+\.webp$/,
    );
    await expect(panel.locator('video')).toHaveCount(0);
    // The poster is the only file asked for: no MP4, no animated WebP.
    expect(loops.filter((url) => !url.includes('-poster-'))).toEqual([]);
  });

  test('in the light theme, the still is the transparent one', async ({ page }) => {
    const user = await createUser('demo-still-light', { onboarded: true });
    await page.addInitScript(() => {
      localStorage.setItem('g7m.theme', 'light');
    });
    await signIn(page, user);

    await openHowTo(page, 'barbell-bench-press', 'Barbell Bench Press');
    const panel = page.getByRole('img', { name: 'Barbell Bench Press demonstration' });
    // Not the dark first frame, which would be a dark square on the light panel.
    await expect(panel.locator('img')).toHaveAttribute(
      'src',
      /assets\/demos\/barbell-bench-press-poster-transparent-[\w-]+\.webp$/,
    );
    await expect(panel.locator('video')).toHaveCount(0);
  });
});

test('the light theme plays the transparent WebP, never the opaque MP4', async ({ page }) => {
  const user = await createUser('demo-light', { onboarded: true });
  await page.addInitScript(() => {
    localStorage.setItem('g7m.theme', 'light');
  });
  await signIn(page, user);

  await openHowTo(page, 'barbell-bench-press', 'Barbell Bench Press');
  const panel = page.getByRole('img', { name: 'Barbell Bench Press demonstration' });
  await expect(panel.locator('img')).toHaveAttribute(
    'src',
    /assets\/demos\/barbell-bench-press-[\w-]+\.webp$/,
  );
  await expect(panel.locator('img')).not.toHaveAttribute('src', /-poster-/);
  await expect(panel.locator('video')).toHaveCount(0);
});
