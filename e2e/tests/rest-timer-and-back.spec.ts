import { expect, test, type Page } from '@playwright/test';
import { createUser } from './support/backend.js';
import { logSet, openTab, signIn, startWith, waitForCatalogue } from './support/app.js';

/**
 * A round of asks from the gym (ADR-0118): Back from the library returns to
 * the end of the workout, the rest bar has a minus beside its plus and both
 * move by a step chosen in Settings, rest ending makes a sound unless that is
 * turned off, and the new crunches take an optional plate.
 */

/** The seconds the rest bar shows, read off its `m:ss`. */
async function restSeconds(page: Page): Promise<number> {
  const text =
    (await page
      .getByText(/^\d+:\d\d$/)
      .last()
      .textContent()) ?? '';
  const [minutes = '0', seconds = '0'] = text.split(':');
  return Number(minutes) * 60 + Number(seconds);
}

/** Add one more exercise to the open workout, from the library. */
async function addExercise(page: Page, name: string): Promise<void> {
  await page.getByRole('link', { name: '+ Add an exercise' }).click();
  await page.getByLabel('Search').fill(name);
  await page.getByRole('button', { name: new RegExp(`^${name}`) }).click();
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
}

test('Back from adding an exercise returns to the end of the workout', async ({ page }) => {
  const user = await createUser('back-end', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);
  await startWith(page, 'Lateral Raise');
  for (const name of ['Hammer Curl', 'Face Pull', 'Leg Press', 'Plank']) {
    await addExercise(page, name);
  }
  // Long enough that the top and the end are never on screen together, or
  // the checks below would pass on a page that never scrolled.
  const tall = await page.evaluate(
    () => document.documentElement.scrollHeight > window.innerHeight * 1.5,
  );
  expect(tall).toBe(true);

  await page.getByRole('link', { name: '+ Add an exercise' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Add an exercise' })).toBeVisible();
  await page.getByRole('link', { name: 'Back' }).click();

  await expect(page.getByRole('button', { name: 'Finish workout' })).toBeInViewport();
  await expect(page.getByRole('link', { name: '+ Add an exercise' })).toBeInViewport();
  await expect(page.getByRole('heading', { name: 'Lateral Raise' })).not.toBeInViewport();
});

test('the rest keeps running through a trip to the library and back', async ({ page }) => {
  const user = await createUser('rest-kept', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);
  await startWith(page, 'Lateral Raise');
  await logSet(page, 1, '10', '12');
  await expect(page.getByText('Resting')).toBeVisible();
  const before = await restSeconds(page);

  // Back without adding, then adding one: both used to come back to no timer.
  await page.getByRole('link', { name: '+ Add an exercise' }).click();
  await page.getByRole('link', { name: 'Back' }).click();
  await expect(page.getByText('Resting')).toBeVisible();
  await addExercise(page, 'Hammer Curl');
  await expect(page.getByText('Resting')).toBeVisible();

  // The same rest, carried on: a little less left, not a fresh one.
  const after = await restSeconds(page);
  expect(after).toBeLessThanOrEqual(before);
  expect(after).toBeGreaterThan(before - 30);
});

test('the rest bar takes off and adds the step chosen in Settings', async ({ page }) => {
  const user = await createUser('rest-step', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);

  await openTab(page, 'Settings');
  const step = page.getByRole('group', { name: 'Rest timer step' });
  await expect(step).toContainText('30s');
  await page.getByRole('button', { name: 'Smaller step' }).click();
  await page.getByRole('button', { name: 'Smaller step' }).click();
  await expect(step).toContainText('20s');

  await openTab(page, 'Home');
  await startWith(page, 'Lateral Raise');
  await logSet(page, 1, '10', '12');
  await expect(page.getByText('Resting')).toBeVisible();

  const less = page.getByRole('button', { name: '20s less rest' });
  const more = page.getByRole('button', { name: '20s more rest' });
  await expect(less).toHaveText('−20s');
  await expect(more).toHaveText('+20s');

  const before = await restSeconds(page);
  await more.click();
  await expect.poll(() => restSeconds(page)).toBeGreaterThanOrEqual(before + 17);
  const raised = await restSeconds(page);
  await less.click();
  await expect.poll(() => restSeconds(page)).toBeLessThanOrEqual(raised - 18);

  // The minus stops short of ending the rest: that is Skip's job.
  while (await less.isEnabled()) await less.click();
  await expect(page.getByText('Resting')).toBeVisible();
  expect(await restSeconds(page)).toBeGreaterThan(0);
});

/**
 * Counts the notes asked of Web Audio, so the sound can be checked without a
 * speaker. Installed before the app loads, in place of the real context.
 */
async function countNotes(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const scope = window as unknown as { notes: number; AudioContext: unknown };
    scope.notes = 0;
    const param = {
      setValueAtTime: () => undefined,
      exponentialRampToValueAtTime: () => undefined,
    };
    scope.AudioContext = class {
      currentTime = 0;
      state = 'running';
      destination = {};
      resume(): Promise<void> {
        return Promise.resolve();
      }
      createGain(): unknown {
        return { gain: param, connect: () => undefined };
      }
      createOscillator(): unknown {
        return {
          frequency: param,
          connect: () => undefined,
          start: () => {
            scope.notes += 1;
          },
          stop: () => undefined,
        };
      }
    };
  });
}

function notes(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as { notes: number }).notes);
}

/** Rest times at their shortest, so a rest ends inside the test. */
async function shortestIsolationRest(page: Page): Promise<void> {
  await openTab(page, 'Settings');
  await page.getByRole('switch', { name: /Set my own rest times/ }).click();
  const isolation = page.getByRole('group', { name: 'Isolation lifts rest' });
  const shorter = page.getByRole('button', { name: 'Shorter rest for isolation lifts' });
  while (await shorter.isEnabled()) await shorter.click();
  await expect(isolation).toContainText('0:15');
}

test('rest ending plays a sound, and not once Settings turns it off', async ({ page }) => {
  test.setTimeout(120_000);
  await countNotes(page);
  const user = await createUser('rest-sound', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);
  await shortestIsolationRest(page);

  await openTab(page, 'Home');
  await startWith(page, 'Lateral Raise');
  await logSet(page, 1, '10', '12');
  await expect(page.getByText('Rest over')).toBeVisible({ timeout: 25_000 });
  // Three rounds of three notes: the three-second chime.
  await expect.poll(() => notes(page)).toBe(9);

  // Off, the next rest ends in silence.
  await page.getByRole('button', { name: 'Dismiss' }).click();
  await page.evaluate(() => {
    (window as unknown as { notes: number }).notes = 0;
  });
  // The workout has no tab bar; Settings is reached by its address.
  await page.goto('/#/settings');
  const sound = page.getByRole('switch', { name: /Sound when rest is over/ });
  await expect(sound).toBeChecked();
  await sound.click();
  await expect(sound).not.toBeChecked();
  await page.goto('/#/workout');

  await logSet(page, 2, '10', '12');
  await expect(page.getByText('Rest over')).toBeVisible({ timeout: 25_000 });
  // Long enough for the notes to have been asked for, had they been.
  await page.waitForTimeout(500);
  expect(await notes(page)).toBe(0);
});

test('a crunch is bodyweight, with a plate when there is one', async ({ page }) => {
  const user = await createUser('crunch', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);
  await startWith(page, 'Ab Crunch');
  // On a decline bench, which it needs, but the load is still the lifter.
  await addExercise(page, 'Decline Ab Crunch');

  for (const name of ['Ab Crunch', 'Decline Ab Crunch']) {
    const card = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name, exact: true }) });
    await card.getByRole('button', { name: 'Add set' }).click();
    await expect(card.getByRole('textbox', { name: 'Weight' })).toHaveCount(0);
    await card.getByRole('button', { name: '+ Add weight' }).click();
    await expect(card.getByRole('textbox', { name: 'Added' })).toBeVisible();
  }
});

test('the machine preacher curl is its own exercise, beside the bars', async ({ page }) => {
  const user = await createUser('preacher', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);
  await page.goto('/#/exercises');
  await page.getByLabel('Search').fill('preacher');
  for (const bar of ['Machine', 'EZ Bar', 'Barbell', 'Dumbbell']) {
    await expect(
      page.getByRole('link', { name: new RegExp(`^Preacher Curl \\(${bar}\\)`) }),
    ).toBeVisible();
  }
});
