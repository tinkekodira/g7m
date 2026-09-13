import { expect, test, type Page } from '@playwright/test';
import { createUser, sql, type TestUser } from './support/backend.js';
import { finishWorkout, logSet, openTab, signIn, startWith } from './support/app.js';

/**
 * "Download your data": the file somebody gets when they ask for everything.
 *
 * Checked as a file, not as a button that did something. It has to hold the
 * workout they just logged, a weigh-in that only ever existed on the server
 * (so it came down by sync), the names of the exercises its ids point at, and
 * real booleans and timestamps rather than SQLite's flattened ones. ADR-0064.
 */

interface ExportFile {
  readonly format: string;
  readonly version: number;
  readonly account: { readonly email: string | null };
  readonly data: Record<string, readonly Record<string, unknown>[]>;
  readonly reference: { readonly exercises: readonly { readonly name: string | null }[] };
}

/** A user with one workout logged in the app and one weigh-in made on the server. */
async function userWithHistory(page: Page, tag: string): Promise<TestUser> {
  const user = await createUser(tag, { onboarded: true });
  // Postgres' own precision, to be cut to the milliseconds the rules ask for.
  await sql(
    `insert into public.body_metrics (user_id, recorded_at, weight_kg)
     values ($1, '2026-09-01 07:30:00.123456+00', 81.5)`,
    [user.id],
  );
  await signIn(page, user);
  await startWith(page, 'Barbell Bench Press');
  await logSet(page, 1, '90', '5');
  await finishWorkout(page);
  return user;
}

async function download(page: Page): Promise<void> {
  await openTab(page, 'Settings');
  await page.getByRole('button', { name: 'Download your data' }).click();
}

function expectEverything(file: ExportFile, user: TestUser): void {
  expect(file.format).toBe('g7m-export');
  expect(file.version).toBe(1);
  expect(file.account.email).toBe(user.email);

  const [session] = file.data['workout_sessions'] ?? [];
  expect(session?.['user_id']).toBe(user.id);
  expect(session?.['ended_at']).not.toBeNull();

  const [set] = file.data['session_sets'] ?? [];
  expect(set).toMatchObject({ weight_kg: 90, reps: 5, is_completed: true });

  // Only ever on the server, so this proves sync brought it down — spelt the
  // way the device spells time (ADR-0068), not the service's legacy way.
  const [weighIn] = file.data['body_metrics'] ?? [];
  expect(weighIn).toMatchObject({ weight_kg: 81.5, recorded_at: '2026-09-01T07:30:00.123Z' });

  expect(file.reference.exercises.map((exercise) => exercise.name)).toContain(
    'Barbell Bench Press',
  );
}

test('on a phone, the file goes to the share sheet with everything in it', async ({ page }) => {
  // The share sheet is the operating system's, so it is stood in for: this
  // one keeps the file it is handed, which is what "Save to Files" would do.
  await page.addInitScript(() => {
    const store = window as unknown as { shared?: { name: string; text: string } };
    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async (data: { files: File[] }) => {
        const [file] = data.files;
        if (file !== undefined) store.shared = { name: file.name, text: await file.text() };
      },
    });
  });

  const user = await userWithHistory(page, 'export-phone');
  await download(page);

  // Counted back in words once it is made.
  await expect(page.getByText('It holds 1 workout, 1 set and 1 weigh-in.')).toBeVisible();

  const shared = await page.waitForFunction(
    () => (window as unknown as { shared?: { name: string; text: string } }).shared,
  );
  const { name, text } = (await shared.jsonValue()) as { name: string; text: string };
  expect(name).toMatch(/^g7m-export-\d{4}-\d{2}-\d{2}\.json$/);
  expectEverything(JSON.parse(text) as ExportFile, user);
});

test.describe('on a computer', () => {
  // A mouse, not a thumb: the ordinary download, even where a share sheet exists.
  test.use({ hasTouch: false, isMobile: false, viewport: { width: 1280, height: 900 } });

  test('the file is an ordinary download with everything in it', async ({ page }) => {
    const user = await userWithHistory(page, 'export-desktop');
    const [file] = await Promise.all([page.waitForEvent('download'), download(page)]);

    expect(file.suggestedFilename()).toMatch(/^g7m-export-\d{4}-\d{2}-\d{2}\.json$/);
    const path = await file.path();
    const { readFile } = await import('node:fs/promises');
    expectEverything(JSON.parse(await readFile(path, 'utf8')) as ExportFile, user);
  });
});
