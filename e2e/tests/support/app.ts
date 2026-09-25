/** Driving the app the way a person does: by what the screen says. */
import { expect, type Page } from '@playwright/test';
import type { TestUser } from './backend.js';

/** Sign in from the sign-in screen and wait for the app behind it. */
export async function signIn(page: Page, user: TestUser): Promise<void> {
  await page.goto('/');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('navigation')).toBeVisible();
}

/** Go to a tab by the bar at the bottom of the screen. */
export async function openTab(
  page: Page,
  tab: 'Learn' | 'Progress' | 'Home' | 'Profile' | 'Settings',
): Promise<void> {
  await page.getByRole('navigation').getByRole('link', { name: tab }).click();
}

/** Open the logger, start a workout and add one exercise from the library. */
export async function startWith(page: Page, exercise: string): Promise<void> {
  await page.getByRole('link', { name: /Start your own workout/ }).click();
  await page.getByRole('button', { name: 'Start a workout' }).click();
  await page.getByRole('link', { name: '+ Add an exercise' }).click();
  await page.getByLabel('Search').fill(exercise);
  await page.getByRole('button', { name: new RegExp(`^${exercise}`) }).click();
  await expect(page.getByRole('heading', { name: exercise })).toBeVisible();
}

/** Add the n-th set, fill its weight and reps, then tick it. */
export async function logSet(page: Page, set: number, weight: string, reps: string): Promise<void> {
  await page.getByRole('button', { name: 'Add set' }).click();
  // The last fields on the card belong to the set just added. Indexing by set
  // number stopped working when a ticked set collapsed to a single line and
  // gave up its steppers — the second set's boxes are the only ones left.
  await page.getByRole('textbox', { name: 'Weight' }).last().fill(weight);
  await page.getByRole('textbox', { name: 'Reps' }).last().fill(reps);
  await page.getByRole('button', { name: `Complete set ${String(set)}` }).click();
  await expect(page.getByRole('button', { name: `Undo set ${String(set)}` })).toBeVisible();
}

/** Finish the workout that is open, and wait to be back among the tabs. */
export async function finishWorkout(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Finish workout' }).click();
  // A live workout with something ticked in it is offered as a routine before
  // the screen goes. Most tests are not about that, so decline it — but the
  // offer only appears for some workouts, and racing the two means this works
  // either way.
  const decline = page.getByRole('button', { name: 'Not this one' });
  await Promise.race([
    decline.waitFor({ state: 'visible' }).catch(() => undefined),
    page
      .getByRole('navigation')
      .waitFor({ state: 'visible' })
      .catch(() => undefined),
  ]);
  if (await decline.isVisible()) await decline.click();
  await expect(page.getByRole('navigation')).toBeVisible();
}

/** Finish, and keep the workout's shape as a routine under this name. */
export async function finishAndKeepAsRoutine(page: Page, name: string): Promise<void> {
  await page.getByRole('button', { name: 'Finish workout' }).click();
  await expect(page.getByRole('heading', { name: 'Workout saved' })).toBeVisible();
  await page.getByLabel('Routine name').fill(name);
  await page.getByRole('button', { name: 'Save as a routine' }).click();
  await expect(page.getByRole('heading', { name: 'Your routines' })).toBeVisible();
}

/**
 * The n-th row in Progress's "Recent workouts" list (0 = most recent).
 *
 * Not by name: an unnamed workout is now titled after what it trained
 * ("Push day (chest focused)", "Cardio", …), which a test would otherwise
 * have to predict. Position is what every caller actually means by "the
 * workout I just logged".
 */
export function recentWorkoutLink(page: Page, index = 0) {
  return page
    .locator('section', { has: page.getByRole('heading', { name: 'Recent workouts' }) })
    .getByRole('link')
    .nth(index);
}

/** Sign out from Settings, and wait for the sign-in screen. */
export async function signOut(page: Page): Promise<void> {
  await openTab(page, 'Settings');
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
}

/**
 * Wait until the exercise catalogue is on the device.
 *
 * It arrives by sync after sign-in, not with the page. Anything that needs an
 * exercise — or that takes the network away — has to wait for it, as a phone
 * that has never been online would have no exercises either.
 */
export async function waitForCatalogue(page: Page): Promise<void> {
  await page.goto('/#/exercises');
  await expect(page.getByRole('link', { name: /^Barbell Bench Press/ })).toBeVisible();
  await page.goto('/#/');
  await expect(page.getByRole('navigation')).toBeVisible();
}
