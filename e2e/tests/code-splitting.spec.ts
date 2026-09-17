import { expect, test } from '@playwright/test';
import { createUser } from './support/backend.js';
import { openTab, signIn } from './support/app.js';

/**
 * Screens that arrive in their own files still arrive. ADR-0078.
 *
 * Every other spec in here exercises the ordinary path — open the app, tap
 * about — and so covers lazy screens by accident. What none of them covers is
 * the path this change actually introduced: landing *directly* on a screen
 * that is not in the entry chunk, with the router resolving a hash on its
 * first render and Suspense having nothing on screen to hold. That is what a
 * Home Screen app does every time it is reopened on a screen that is not Home.
 */

test('the app opens straight onto a screen that is in its own file', async ({ page }) => {
  const user = await createUser('deep-link', { onboarded: true });
  await signIn(page, user);

  // Not a navigation within the app: a fresh document, the way reopening a
  // Home Screen app on the screen it was left on is.
  await page.goto('/#/achievements');
  await expect(page.getByRole('heading', { name: 'Achievements', level: 1 })).toBeVisible();
  await expect(page.locator('#badge-day-one')).toBeVisible();

  // And the tab bar came with it, so there is a way out.
  await expect(page.getByRole('navigation')).toBeVisible();
});

test('every tab loads its own screen, and going back does not lose them', async ({ page }) => {
  const user = await createUser('tab-chunks', { onboarded: true });
  await signIn(page, user);

  // Each of these is a separate file now. The bar itself must never blink:
  // it lives outside the boundary the screens load inside.
  for (const [tab, heading] of [
    ['Progress', 'Progress'],
    ['Learn', 'Learn'],
    ['Profile', 'Your profile'],
    ['Settings', 'Settings'],
  ] as const) {
    await openTab(page, tab);
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible();
  }

  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Your profile', level: 1 })).toBeVisible();
});

/**
 * The guard that keeps this from quietly undoing itself.
 *
 * The budget in `service-worker/budget.ts` fails the build if the entry grows
 * past it, but a build is not this test's to run. What it can check is the
 * shape: the screens are separate files, and the page asks for them by name.
 */
test('the screens are served as separate files', async ({ page }) => {
  const user = await createUser('chunk-shape', { onboarded: true });

  const fetched: string[] = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'script') fetched.push(request.url());
  });

  await signIn(page, user);
  await openTab(page, 'Settings');
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();

  // Vite names a chunk after the module it was split from.
  expect(fetched.some((url) => /SettingsScreen-[^/]*\.js/.test(url))).toBe(true);
});
