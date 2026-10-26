import { expect, test, type Page, type Route } from '@playwright/test';
import { createUser } from './support/backend.js';
import { openTab, signIn, startWith, waitForCatalogue, logSet } from './support/app.js';

// Cold chunk requests must be interceptable rather than served by a worker.
// Offline service-worker behavior stays covered by the ordinary offline suite.
test.use({ serviceWorkers: 'block' });

function heldRequest(complete: (route: Route) => Promise<void> = (route) => route.continue()) {
  let release: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  return {
    release: () => release(),
    handler: async (route: Route) => {
      await gate;
      await complete(route);
    },
  };
}

/** Catch even a one-frame placeholder that locator polling could miss. */
async function watchLoading(page: Page, labels: readonly string[]) {
  return page.evaluateHandle((names) => {
    const flashes: string[] = [];
    const observer = new MutationObserver((records) => {
      for (const record of records)
        for (const node of Array.from(record.addedNodes)) {
          if (!(node instanceof HTMLElement)) continue;
          for (const element of [node, ...Array.from(node.querySelectorAll('[aria-busy]'))]) {
            const label = element.getAttribute('aria-label');
            if (label !== null && names.includes(label)) flashes.push(label);
          }
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return { observer, flashes };
  }, labels);
}

async function pauseClock(page: Page) {
  const now = Date.now();
  await page.clock.install({ time: new Date(now) });
  // pauseAt only moves forwards. Leave room for a busy worker to install it,
  // and pause before navigation so the host clock cannot race a reload.
  await page.clock.pauseAt(new Date(now + 60_000));
}

test('code and data share one delay, with static reduced-motion placeholders', async ({ page }) => {
  const user = await createUser('skeleton-deadline', { onboarded: true, displayName: 'Ana' });
  const code = heldRequest();
  const data = heldRequest();
  await page.route('**/FriendsScreen-*.js', code.handler);
  await page.route('**/rest/v1/rpc/friends_overview', data.handler);
  await signIn(page, user);
  await pauseClock(page);
  await page.evaluate(() => {
    location.hash = '/friends';
  });
  const region = page.getByRole('region', { name: 'Loading friends…' });
  await expect(region).toBeAttached();
  const shapes = region.locator('[data-skeleton-visible]');
  await expect(shapes).toHaveAttribute('data-skeleton-visible', 'false');
  const reserved = await region.boundingBox();
  expect(reserved?.height).toBeGreaterThan(300);
  await page.clock.runFor(249);
  await expect(shapes).toHaveAttribute('data-skeleton-visible', 'false');
  await page.clock.runFor(1);
  await expect(shapes).toHaveAttribute('data-skeleton-visible', 'true');
  expect(await region.boundingBox()).toEqual(reserved);
  await expect(page.getByRole('navigation')).toBeVisible();

  // Code arrives but the remote data is still held: the skeleton stays visible
  // on the very first frame, without a second quiet quarter-second.
  code.release();
  await expect(page.getByRole('button', { name: 'Add a friend' })).toBeVisible();
  await expect(shapes).toHaveAttribute('data-skeleton-visible', 'true');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(region.locator('.skeleton').first()).toHaveCSS('animation-name', 'none');
  await expect(region.getByRole('button')).toHaveCount(0);
  data.release();
  await expect(region).toHaveCount(0);
  await page.clock.resume();
});

test('fast content is never held to display a skeleton', async ({ page }) => {
  const user = await createUser('skeleton-fast', { onboarded: true, displayName: 'Ana' });
  await signIn(page, user);
  await pauseClock(page);
  await openTab(page, 'Profile');
  await expect(page.getByText('Ana', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /Your goal/ })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Loading your profile…' })).toHaveCount(0);
  await expect(page.locator('[data-skeleton-visible="true"]')).toHaveCount(0);
  await page.clock.resume();
});

test('search and set saves preserve content, input focus and resolved empty values', async ({
  page,
}) => {
  const user = await createUser('skeleton-refresh', { onboarded: true, displayName: 'Ana' });
  await signIn(page, user);
  await waitForCatalogue(page);
  await page.goto('/#/exercises');
  const search = page.getByLabel('Search', { exact: true });
  await expect(page.getByRole('link', { name: /^Barbell Bench Press/ })).toBeVisible();
  const searchUpdates = await watchLoading(page, ['Loading exercises…']);
  await search.fill('Bench');
  await expect(search).toBeFocused();
  await expect(page.getByRole('link', { name: /^Barbell Bench Press/ })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Loading exercises…' })).toHaveCount(0);
  expect(await searchUpdates.evaluate((state) => state.flashes)).toEqual([]);
  await searchUpdates.evaluate((state) => state.observer.disconnect());
  await searchUpdates.dispose();
  await openTab(page, 'Home');
  await startWith(page, 'Barbell Bench Press');
  await logSet(page, 1, '60', '8');
  await expect(page.getByRole('region', { name: 'Loading workout…' })).toHaveCount(0);
  await page.goto('/#/profile');
  const goal = page.getByRole('link', { name: /Your goal/ });
  await expect(goal).toBeVisible();
  await expect(page.getByText('Add your name', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Loading your numbers…' })).toHaveCount(0);
  const emptyUpdates = await watchLoading(page, ['Loading your goal…', 'Loading your numbers…']);
  await page.getByRole('button', { name: 'Add your weight' }).click();
  const sheet = page.getByRole('dialog', { name: 'Log your weight' });
  await sheet.getByLabel('Today’s weight (kg)').fill('80');
  await sheet.getByRole('button', { name: 'Save weight' }).click();
  await expect(sheet).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Weight 80/ })).toBeVisible();
  expect(await emptyUpdates.evaluate((state) => state.flashes)).toEqual([]);
  await emptyUpdates.evaluate((state) => state.observer.disconnect());
  await emptyUpdates.dispose();
});

test('loading layouts fit phone and desktop in both themes', async ({ page }, info) => {
  test.setTimeout(120_000);
  const user = await createUser('skeleton-layout', { onboarded: true, displayName: 'Ana' });
  const chunks = heldRequest();
  await page.route(
    /\/(?:LearnScreen|ExerciseLibraryScreen|FriendsScreen|ProfileScreen|WorkoutScreen|HomeStats)-[^/]+\.js$/,
    chunks.handler,
  );
  await signIn(page, user);
  for (const path of [
    '/',
    '/learn',
    '/exercises',
    '/friends',
    '/friends?tab=leaderboard',
    '/friends?tab=requests',
    '/profile',
    '/workout',
  ]) {
    await page.evaluate((value) => {
      location.hash = value;
    }, path);
    await expect(page.locator('[data-skeleton-visible="true"]').first()).toBeVisible();
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      for (const theme of ['light', 'dark']) {
        await page.evaluate((value) => {
          document.documentElement.dataset['theme'] = value;
        }, theme);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        await page.screenshot({
          path: info.outputPath(
            `${path.replace(/\W/g, '-') || 'home'}-${theme}-${String(width)}.png`,
          ),
          fullPage: true,
        });
      }
    }
  }
  chunks.release();
});

test('startup stays neutral until the local account is ready', async ({ page }, info) => {
  const user = await createUser('skeleton-startup', { onboarded: true, displayName: 'Ana' });
  await signIn(page, user);
  // Hold a real browser storage API before SQLite opens. No production test
  // switch or dependency on the database worker's private message format.
  await page.addInitScript(() => {
    Object.defineProperty(navigator.storage, 'estimate', {
      value: () =>
        new Promise<StorageEstimate>((resolve) => {
          globalThis.addEventListener(
            'resume-storage',
            () => resolve({ quota: 1_000_000, usage: 0 }),
            { once: true },
          );
        }),
    });
  });
  await pauseClock(page);
  await page.reload();
  const startup = page.getByRole('region', { name: 'Loading your account…' });
  await expect(startup).toBeAttached();
  await page.clock.runFor(250);
  await expect(startup.locator('[data-skeleton-visible]')).toHaveAttribute(
    'data-skeleton-visible',
    'true',
  );
  await expect(page.getByRole('navigation')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Quick access' })).toHaveCount(0);
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ['light', 'dark']) {
      await page.evaluate((value) => {
        document.documentElement.dataset['theme'] = value;
      }, theme);
      await page.screenshot({ path: info.outputPath(`startup-${theme}-${String(width)}.png`) });
    }
  }
  await page.evaluate(() => {
    globalThis.dispatchEvent(new Event('resume-storage'));
  });
  await page.clock.resume();
  await expect(page.getByRole('navigation')).toBeVisible();
  await expect(startup).toHaveCount(0);
});

test('a failed Friends read replaces its skeleton with the error', async ({ page }) => {
  const user = await createUser('skeleton-error', { onboarded: true, displayName: 'Ana' });
  const data = heldRequest((route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Friends are temporarily unavailable. Try again shortly.' }),
    }),
  );
  await page.route('**/rest/v1/rpc/friends_overview', data.handler);
  await signIn(page, user);
  await openTab(page, 'Friends');
  const region = page.getByRole('region', { name: 'Loading friends…' });
  await expect(region.locator('[data-skeleton-visible]')).toHaveAttribute(
    'data-skeleton-visible',
    'true',
  );
  data.release();
  await expect(page.getByRole('alert')).toContainText('Friends are temporarily unavailable');
  await expect(region).toHaveCount(0);
});

test('going offline replaces a pending Friends skeleton', async ({ page, context }) => {
  const user = await createUser('skeleton-offline', { onboarded: true, displayName: 'Ana' });
  const data = heldRequest();
  await page.route('**/rest/v1/rpc/friends_overview', data.handler);
  await signIn(page, user);
  await openTab(page, 'Friends');
  const region = page.getByRole('region', { name: 'Loading friends…' });
  await expect(region.locator('[data-skeleton-visible]')).toHaveAttribute(
    'data-skeleton-visible',
    'true',
  );
  await context.setOffline(true);
  await expect.poll(() => page.evaluate(() => navigator.onLine)).toBe(false);
  await expect(page.getByRole('heading', { name: 'You’re offline' })).toBeVisible();
  await expect(region).toHaveCount(0);
  data.release();
});
