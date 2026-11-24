import { expect, test, type Page } from '@playwright/test';
import { createUser } from './support/backend.js';
import { openTab, signIn } from './support/app.js';

/**
 * The privacy policy and the account-deletion page. ADR-0189.
 *
 * The app stores link straight to them, so they are tested the way a store
 * reviewer meets them: a cold visit to the URL, signed out, no app state —
 * and offline, once the app has loaded before. Then the ways in from the app
 * itself, and the one way out that matters: from the deletion page to the
 * delete panel in Settings.
 */

const PRIVACY = { name: 'Privacy policy', level: 1 } as const;
const DELETION = { name: 'Delete your g7m account', level: 1 } as const;

/** The page is as wide as the screen: nothing in it scrolls sideways. */
async function expectNoSidewaysScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

test('the privacy policy opens from its URL, signed out', async ({ page }) => {
  await page.goto('/#/privacy');

  await expect(page.getByRole('heading', PRIVACY)).toBeVisible();
  // The parts a reviewer looks for, by heading.
  for (const heading of [
    'Who is responsible',
    'What we collect',
    'Why, and on what legal basis',
    'No ads, no tracking',
    'Where your data is, and who processes it',
    'How long we keep it',
    'Your rights',
  ]) {
    await expect(page.getByRole('heading', { name: heading, level: 2 })).toBeVisible();
  }
  await expect(page).toHaveTitle('Privacy policy · g7m');
  // Not the sign-in form: the page stands on its own.
  await expect(page.getByLabel('Password')).toHaveCount(0);
  await expectNoSidewaysScroll(page);

  // The contents scroll to a section rather than changing the route.
  await page.locator('summary').filter({ hasText: 'Contents' }).click();
  await page.getByRole('button', { name: 'Your rights', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your rights', level: 2 })).toBeInViewport();
  await expect(page).toHaveURL(/#\/privacy$/);

  // And the way on is the app.
  await page.getByRole('link', { name: 'Open g7m' }).click();
  await expect(page.getByLabel('Password')).toBeVisible();
});

test('the deletion page explains both ways and links to each', async ({ page }) => {
  await page.goto('/#/delete-account');

  await expect(page.getByRole('heading', DELETION)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'What is deleted', level: 2 })).toBeVisible();
  // The steps use the app's own words for the controls.
  await expect(page.getByText('Delete my account…', { exact: false }).first()).toBeVisible();

  const email = page.getByRole('link', { name: /^Email / });
  await expect(email).toHaveAttribute('href', /^mailto:.+\?subject=Delete%20my%20g7m%20account$/);
  await expect(page.getByRole('link', { name: 'Open Settings → Delete account' })).toHaveAttribute(
    'href',
    '#/settings?section=delete-account',
  );
  await expectNoSidewaysScroll(page);

  await page.getByRole('link', { name: 'Privacy policy' }).click();
  await expect(page.getByRole('heading', PRIVACY)).toBeVisible();
});

test('"Open Settings → Delete account" lands on the delete panel after signing in', async ({
  page,
}) => {
  const user = await createUser('legal-delete-link', { onboarded: true });
  await page.goto('/#/delete-account');
  await page.getByRole('link', { name: 'Open Settings → Delete account' }).click();

  // Signed out, so the sign-in form, with the destination kept in the URL.
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();

  const panel = page.getByRole('region', { name: 'Delete your account', exact: true });
  await expect(panel).toBeInViewport();
  await expect(panel.getByRole('button', { name: 'Delete my account…' })).toBeVisible();
});

test('both pages are linked from the sign-in screen and from Settings', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Privacy policy' }).click();
  await expect(page.getByRole('heading', PRIVACY)).toBeVisible();
  await page.goBack();
  await page.getByRole('link', { name: 'Account deletion' }).click();
  await expect(page.getByRole('heading', DELETION)).toBeVisible();

  const user = await createUser('legal-links', { onboarded: true });
  await signIn(page, user);
  await openTab(page, 'Settings');
  await page.getByRole('link', { name: 'Privacy policy' }).click();
  await expect(page.getByRole('heading', PRIVACY)).toBeVisible();
  // Signed in, the language is the account's, so the page offers none.
  await expect(page.getByLabel('Language')).toHaveCount(0);

  // Back is Settings, with the app around it again.
  await page.getByRole('link', { name: 'Back' }).click();
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
  await expect(page.getByRole('navigation')).toBeVisible();
});

test('a visitor can read the policy in their language', async ({ page }) => {
  await page.goto('/#/privacy');
  await expect(page.getByRole('heading', PRIVACY)).toBeVisible();
  await page.getByLabel('Language').selectOption('de');
  await expect(page.getByRole('heading', { name: 'Datenschutzerklärung', level: 1 })).toBeVisible();
  await expect(page.getByText('Dies ist eine Übersetzung.', { exact: false })).toBeVisible();
});

test('both pages open offline once the app has loaded', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.getByLabel('Password')).toBeVisible();
  // The worker has to be in charge before the connection goes.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (navigator.serviceWorker.controller === null)
      await new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), {
          once: true,
        }),
      );
  });

  await context.setOffline(true);
  try {
    await page.goto('/#/delete-account');
    await page.reload();
    await expect(page.getByRole('heading', DELETION)).toBeVisible();
    await page.goto('/#/privacy');
    await page.reload();
    await expect(page.getByRole('heading', PRIVACY)).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});

test.describe('on a desktop screen', () => {
  test.use({ viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false });

  test('the policy reads as one centred column', async ({ page }) => {
    await page.goto('/#/privacy');
    const heading = page.getByRole('heading', PRIVACY);
    await expect(heading).toBeVisible();
    await expectNoSidewaysScroll(page);
    const box = await page.locator('main').boundingBox();
    expect(box?.width).toBeLessThanOrEqual(672);
    expect(Math.abs((box?.x ?? 0) * 2 + (box?.width ?? 0) - 1280)).toBeLessThan(2);
  });
});
