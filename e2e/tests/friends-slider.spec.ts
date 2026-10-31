import { expect, test, type Locator } from '@playwright/test';
import { createUser, sql } from './support/backend.js';
import { openTab, signIn } from './support/app.js';

// Slider geometry and input use CSS pixels; high-DPI captures add no coverage.
test.use({ deviceScaleFactor: 1 });

// Inspect the decorative highlight because selected-state assertions alone
// cannot distinguish a sliding pill from the old background-color swap.
const highlight = (control: Locator) => control.locator(':scope > span[aria-hidden="true"]');

async function expectAligned(control: Locator, selected: Locator): Promise<void> {
  await expect
    .poll(async () => {
      const pill = await highlight(control).boundingBox();
      const button = await selected.boundingBox();
      if (pill === null || button === null) return Infinity;
      return Math.max(Math.abs(pill.x - button.x), Math.abs(pill.width - button.width));
    })
    .toBeLessThan(1);
}

for (const theme of ['dark', 'light'] as const) {
  for (const width of [360, 1280]) {
    test(`Friends slides like Learn: ${theme}, ${String(width)}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.addInitScript((value) => localStorage.setItem('g7m.theme', value), theme);
      const user = await createUser('slider', { onboarded: true, displayName: 'Robin' });
      await signIn(page, user);

      await openTab(page, 'Learn');
      const learn = page.getByRole('radiogroup', { name: 'Body view' });
      await expect(learn).toBeVisible();
      const learnMotion = await highlight(learn).evaluate((element) => {
        const style = getComputedStyle(element);
        return [style.transitionProperty, style.transitionDuration, style.transitionTimingFunction];
      });
      await learn.getByRole('radio', { name: 'What I have trained' }).click();
      await expect(learn.getByRole('radio', { name: 'What I have trained' })).toBeChecked();
      await expectAligned(learn, learn.getByRole('radio', { name: 'What I have trained' }));

      await openTab(page, 'Friends');
      const tabs = page.getByRole('tablist', { name: 'Friends' });
      const friends = tabs.getByRole('tab', { name: 'Friends', exact: true });
      const board = tabs.getByRole('tab', { name: 'Leaderboard' });
      const requests = tabs.getByRole('tab', { name: 'Requests' });
      await expectAligned(tabs, friends);
      const friendsMotion = await highlight(tabs).evaluate((element) => {
        const style = getComputedStyle(element);
        return [style.transitionProperty, style.transitionDuration, style.transitionTimingFunction];
      });
      expect(friendsMotion).toEqual(learnMotion);
      expect(friendsMotion.slice(0, 2)).toEqual(['transform, width', '0.3s']);

      // Freeze the real CSS transition halfway through its timeline. This
      // proves interpolation without depending on a screenshot's timing.
      const motion = await tabs.evaluate(async (element) => {
        const pill = element.querySelector<HTMLElement>(':scope > span[aria-hidden="true"]');
        const next = element.querySelectorAll<HTMLButtonElement>('[role="tab"]')[1];
        if (pill === null || next === undefined) throw new Error('Missing slider');
        const start = pill.getBoundingClientRect().x;
        next.click();
        await new Promise(requestAnimationFrame);
        await new Promise(requestAnimationFrame);
        const transition = pill
          .getAnimations()
          .find((animation) => (animation as CSSTransition).transitionProperty === 'transform');
        if (transition === undefined) throw new Error('Highlight did not slide');
        transition.pause();
        transition.currentTime = 150;
        const middle = pill.getBoundingClientRect().x;
        transition.finish();
        return {
          start,
          middle,
          end: next.getBoundingClientRect().x,
          samePill: pill === element.querySelector(':scope > span[aria-hidden="true"]'),
        };
      });
      expect(motion.samePill).toBe(true);
      expect(motion.middle).toBeGreaterThan(motion.start);
      expect(motion.middle).toBeLessThan(motion.end);
      await expect(board).toHaveAttribute('aria-selected', 'true');
      await expect(page).toHaveURL(/tab=leaderboard/);
      await expectAligned(tabs, board);

      // Rapid changes must finish on the last choice, including backwards.
      await requests.click();
      await friends.click();
      await requests.click();
      await expectAligned(tabs, requests);
      await expect(page).toHaveURL(/tab=requests/);
      await page.screenshot({ path: testInfo.outputPath('friends.png') });
      await page.reload();
      await expect(requests).toHaveAttribute('aria-selected', 'true');
      await expectAligned(tabs, requests);
      await page.setViewportSize({ width: width === 360 ? 1280 : 360, height: 900 });
      await expectAligned(tabs, requests);
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
        .toBe(true);
    });
  }
}

test('Friends tabs support arrow wrapping, Home/End and one tab stop', async ({ page }) => {
  const user = await createUser('slider-keys', { onboarded: true, displayName: 'Robin' });
  await signIn(page, user);
  await openTab(page, 'Friends');
  const tabs = page.getByRole('tablist', { name: 'Friends' });
  const friends = tabs.getByRole('tab', { name: 'Friends', exact: true });
  const board = tabs.getByRole('tab', { name: 'Leaderboard' });
  const requests = tabs.getByRole('tab', { name: 'Requests' });
  await friends.focus();
  for (const [key, selected] of [
    ['ArrowRight', board],
    ['ArrowRight', requests],
    ['ArrowRight', friends],
    ['ArrowLeft', requests],
    ['Home', friends],
    ['End', requests],
  ] as const) {
    await page.keyboard.press(key);
    await expect(selected).toBeFocused();
    await expect(selected).toHaveAttribute('aria-selected', 'true');
    await expect(selected).toHaveAttribute('tabindex', '0');
    await expect(tabs.locator('[tabindex="0"]')).toHaveCount(1);
    await expectAligned(tabs, selected);
  }
});

test('Friends respects reduced motion while switching content', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const user = await createUser('slider-reduced', { onboarded: true, displayName: 'Robin' });
  await signIn(page, user);
  await openTab(page, 'Friends');
  const tabs = page.getByRole('tablist', { name: 'Friends' });
  const requests = tabs.getByRole('tab', { name: 'Requests' });
  const duration = await highlight(tabs).evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).transitionDuration),
  );
  expect(duration).toBeLessThanOrEqual(0.001);
  await requests.click();
  await expect(requests).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText(/No requests waiting/)).toBeVisible();
  await expectAligned(tabs, requests);
});

test('the highlight fits when accepting a request removes its badge', async ({ page, browser }) => {
  await page.setViewportSize({ width: 320, height: 812 });
  const robin = await createUser('slider-badge', { onboarded: true, displayName: 'Robin' });
  const alex = await createUser('slider-sender', { onboarded: true, displayName: 'Alex' });
  await signIn(page, robin);
  await openTab(page, 'Friends');
  await expect(page.getByRole('heading', { name: 'Train with friends' })).toBeVisible();
  const [profile] = await sql<{ friend_code: string }>(
    'select friend_code from public.friend_profiles where user_id = $1',
    [robin.id],
  );
  if (profile === undefined) throw new Error('Missing friend code');

  const sender = await browser.newContext({ baseURL: page.url() });
  try {
    const other = await sender.newPage();
    await signIn(other, alex);
    await openTab(other, 'Friends');
    await other.getByRole('button', { name: 'Add a friend' }).click();
    await other.getByLabel('Their code').fill(profile.friend_code);
    await other.getByRole('button', { name: 'Send request' }).click();
    await expect(other.getByText('Request sent to Robin.')).toBeVisible();
    await page.reload();

    const tabs = page.getByRole('tablist', { name: 'Friends' });
    const requests = tabs.getByRole('tab', { name: /Requests/ });
    await expect(requests).toHaveAccessibleName('Requests 1 waiting');
    await requests.click();
    await expectAligned(tabs, requests);
    await page.getByRole('button', { name: 'Accept Alex' }).click();
    await expect(requests).toHaveAccessibleName('Requests');
    await expect(requests).toHaveAttribute('aria-selected', 'true');
    await expectAligned(tabs, requests);
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      .toBe(true);
  } finally {
    await sender.close();
  }
});
