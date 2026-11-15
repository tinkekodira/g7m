/** L11–L13: real app captures against the disposable dev:fake backend only. */
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium, expect } from '@playwright/test';
import { createUser, sql } from './tests/support/backend.js';
import { signIn, waitForCatalogue } from './tests/support/app.js';

const output = resolve('test-results/video-l11-l13/raw');
await mkdir(output, { recursive: true });
// This helper is hardwired to the local fake backend; it cannot seed production.
const user = await createUser('video-chest-day', { onboarded: true, displayName: 'Milan' });
await sql(
  `insert into public.training_goals (user_id, goal, days_per_week, started_at)
   values ($1, 'build_muscle', 3, now() - interval '45 days')`,
  [user.id],
);

async function chestDay(daysAgo: number, index: number): Promise<string> {
  const [session] = await sql<{ id: string }>(
    `insert into public.workout_sessions (user_id, name, started_at, ended_at, bodyweight_kg)
     values ($1, 'Chest day', now() - $2::int * interval '1 day' - interval '1 hour',
             now() - $2::int * interval '1 day', 80) returning id`,
    [user.id, daysAgo],
  );
  if (!session) throw new Error('No demo session');
  const lifts = [
    {
      slug: 'barbell-bench-press',
      sets: [
        ['warmup', 20, 12],
        ['warmup', 40, 8],
        ['warmup', 50, 5],
        ['warmup', 60, 3],
        ['working', 70 + index, 8],
        ['working', 70 + index, 8],
        ['working', 70 + index, 8],
      ],
    },
    {
      slug: 'incline-dumbbell-press',
      sets: Array.from({ length: 3 }, () => [
        ['working', 28 + index / 2, 10],
        ['dropset', 22 + index / 2, 8],
        ['dropset', 16 + index / 2, 8],
      ]).flat(),
    },
    { slug: 'cable-fly', sets: Array.from({ length: 4 }, () => ['working', 12.5 + index / 2, 12]) },
  ];
  let minute = 2;
  for (const [position, lift] of lifts.entries()) {
    const [slot] = await sql<{ id: string }>(
      `insert into public.session_exercises (user_id, session_id, exercise_id, order_key)
       select $1, $2, id, $3 from public.exercises where slug = $4 returning id`,
      [user.id, session.id, `a${String(position)}`, lift.slug],
    );
    if (!slot) throw new Error(`Missing exercise ${lift.slug}`);
    for (const [order, set] of lift.sets.entries()) {
      minute += 2;
      await sql(
        `insert into public.session_sets
         (user_id, session_exercise_id, order_key, set_type, load_type, weight_kg, reps,
          is_completed, completed_at)
         values ($1, $2, $3, $4, 'external', $5, $6, true,
                 now() - $7::int * interval '1 day' - interval '1 hour' + $8::int * interval '1 minute')`,
        [user.id, slot.id, `a${String(order).padStart(2, '0')}`, ...set, daysAgo, minute],
      );
    }
  }
  return session.id;
}

// Twelve push-heavy sessions over four weeks, followed by the featured session.
for (let i = 0; i < 12; i++) await chestDay(28 - i * 2, i);
const sessionId = await chestDay(0, 12);
const [counts] = await sql<{ rows: number; working: number; warmups: number; drops: number }>(
  `select count(*)::int rows,
          count(*) filter (where ss.set_type = 'working')::int working,
          count(*) filter (where ss.set_type = 'warmup')::int warmups,
          count(*) filter (where ss.set_type = 'dropset')::int drops
   from public.session_sets ss join public.session_exercises se on se.id = ss.session_exercise_id
   where se.session_id = $1`,
  [sessionId],
);
expect(counts).toEqual({ rows: 20, working: 10, warmups: 4, drops: 6 });

const browser = await chromium.launch({ channel: 'chrome' });
try {
  const context = await browser.newContext({
    baseURL: 'http://127.0.0.1:4381',
    viewport: { width: 432, height: 768 },
    deviceScaleFactor: 2.5,
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  await signIn(page, user);
  const dismiss = page.getByRole('button', { name: 'Dismiss app tour invitation' });
  if (await dismiss.isVisible()) await dismiss.click();
  await waitForCatalogue(page);
  const banner = page.locator('[data-achievement-banner]');
  if (await banner.isVisible()) {
    const bounds = await banner.getByRole('button').boundingBox();
    if (!bounds) throw new Error('No achievement banner bounds');
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height - 8);
    await page.mouse.down();
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + 8, { steps: 3 });
    await page.mouse.up();
    await expect(banner).toBeHidden();
  }
  await page.goto('/#/settings');
  const dark = page.getByRole('switch', { name: 'Dark mode' });
  await expect(dark).toBeVisible();
  if ((await dark.getAttribute('aria-checked')) !== 'true') await dark.click();
  await page.goto(`/#/progress/session/${sessionId}`);
  const session = page.getByRole('region', { name: 'Your session', exact: true });
  await expect(session).toContainText('Working sets');
  await expect(
    session
      .locator('div')
      .filter({ has: page.locator('dt', { hasText: 'Working sets' }) })
      .last(),
  ).toContainText('10');
  await page.screenshot({ path: resolve(output, 'L11-your-session.png') });

  await page.getByRole('button', { name: 'Show Exercise log', exact: true }).click();
  const log = page.getByRole('region', { name: 'Exercise log', exact: true });
  await expect(log).toBeVisible();
  await expect(log).toContainText('Warm-up 4');
  await page.screenshot({ path: resolve(output, 'L11-exercise-log-warmups.png') });
  await log.getByText('Incline Dumbbell Press', { exact: true }).evaluate((heading) => {
    const card = heading.closest('.recap-card');
    if (card)
      card.scrollTop += heading.getBoundingClientRect().top - card.getBoundingClientRect().top - 16;
  });
  await page.screenshot({ path: resolve(output, 'L11-exercise-log-drops.png') });

  await page.getByRole('button', { name: 'Show Muscles trained', exact: true }).click();
  await expect(page.locator('canvas')).toHaveCount(2);
  await page.waitForTimeout(1500); // Let WebGL and contact shadows reach the compositor.
  await page.screenshot({ path: resolve(output, 'L13-muscles-trained.png') });

  await page.goto('/#/learn?view=heatmap');
  await expect(page.getByRole('radio', { name: 'What I have trained' })).toBeChecked();
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: resolve(output, 'L12-heatmap-front.png') });
  const box = await canvas.boundingBox();
  if (!box) throw new Error('No body canvas');
  // OrbitControls: dragging half the canvas height turns the body 180 degrees.
  const x = box.x + box.width * 0.12;
  const y = box.y + box.height * 0.5;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + box.height / 2, y, { steps: 60 });
  await page.waitForTimeout(1000);
  await page.mouse.up();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: resolve(output, 'L12-heatmap-back.png') });

  await page.goto('/#/progress');
  const review = page.locator('section').filter({
    has: page.getByRole('heading', { name: 'How it is going', exact: true }),
  });
  await expect(review).toContainText('Your back is behind');
  await expect(review).toContainText('A lot of chest');
  await review.evaluate((element) => {
    window.scrollTo(0, window.scrollY + element.getBoundingClientRect().top - 16);
  });
  await page.screenshot({ path: resolve(output, 'L12-training-review.png') });
  await writeFile(
    resolve(output, 'capture.json'),
    JSON.stringify(
      {
        source: 'Actual g7m production build, local disposable demo backend',
        sessionId,
        counts,
        viewport: { width: 432, height: 768 },
        deviceScaleFactor: 2.5,
        caption: 'No app text, values or muscle colours replaced in captures.',
      },
      null,
      2,
    ) + '\n',
  );
  process.stdout.write(`Captured L11–L13 in ${output}\n`);
} finally {
  await browser.close();
}
