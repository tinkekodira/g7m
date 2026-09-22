import { expect, test } from '@playwright/test';
import { createUser, outage, sql } from './support/backend.js';
import { openTab, signIn } from './support/app.js';

/**
 * Send feedback (ADR-0088): a message to the developer, from Settings.
 *
 * Posted straight to `public.feedback` through PostgREST, not through
 * PowerSync, so the thing worth proving end to end is that a real submission
 * lands in Postgres with its category and its auto-attached context, and that
 * a server the app cannot reach fails loudly rather than silently.
 */
test('feedback reaches the developer, with its context attached', async ({ page }) => {
  const user = await createUser('feedback', { onboarded: true });
  await signIn(page, user);
  await openTab(page, 'Settings');

  await expect(page.getByRole('radio', { name: 'Idea' })).toBeChecked();
  await page.getByLabel('Message').fill('More cardio machines please.');
  await page.getByRole('button', { name: 'Send feedback' }).click();

  await expect(page.getByText('Thanks — this reached the developer.')).toBeVisible();
  await expect(page.getByLabel('Message')).toHaveValue('');

  const rows = await sql<{
    category: string;
    message: string;
    app_version: string | null;
    platform: string | null;
  }>(`select category, message, app_version, platform from public.feedback where user_id = $1`, [
    user.id,
  ]);
  expect(rows).toHaveLength(1);
  expect(rows[0]?.category).toBe('idea');
  expect(rows[0]?.message).toBe('More cardio machines please.');
  expect(rows[0]?.app_version).not.toBeNull();
  expect(rows[0]?.platform).not.toBeNull();
});

test('a message over the limit cannot be sent, and an unreachable server fails loudly', async ({
  page,
}) => {
  const user = await createUser('feedback-limits', { onboarded: true });
  await signIn(page, user);
  await openTab(page, 'Settings');

  await page.getByLabel('Message').fill('a'.repeat(2001));
  await expect(page.getByRole('button', { name: 'Send feedback' })).toBeDisabled();
  await expect(page.getByText(/too long/)).toBeVisible();

  await page.getByLabel('Message').fill('Short message');
  await outage(true);
  try {
    await page.getByRole('button', { name: 'Send feedback' }).click();
    await expect(page.getByText(/Cannot reach the server/)).toBeVisible();
  } finally {
    await outage(false);
  }

  // The message is still there after the failure, and sending now goes through.
  await expect(page.getByLabel('Message')).toHaveValue('Short message');
  await page.getByRole('button', { name: 'Send feedback' }).click();
  await expect(page.getByText('Thanks — this reached the developer.')).toBeVisible();

  const rows = await sql<{ n: number }>(
    `select count(*)::int as n from public.feedback where user_id = $1`,
    [user.id],
  );
  expect(rows[0]?.n).toBe(1);
});
