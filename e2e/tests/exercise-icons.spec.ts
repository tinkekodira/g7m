import { expect, test, type Page } from '@playwright/test';
import { createUser, sql } from './support/backend.js';
import { signIn, waitForCatalogue } from './support/app.js';

test.use({ deviceScaleFactor: 1 });

/** Check the real catalogue, including slug aliases and previously missing art. */
async function expectCatalogueIcons(
  page: Page,
  catalogue: readonly { name: string; slug: string }[],
) {
  const rows = page.locator('.browse-exercise-row');
  await expect(rows).toHaveCount(catalogue.length);
  const byName = new Map(catalogue.map((exercise) => [exercise.name, exercise.slug]));
  const rendered = await rows.evaluateAll((elements) =>
    elements.map((row) => ({
      name: row.querySelector('.browse-exercise-copy > span')?.textContent ?? '',
      src: row.querySelector('img')?.getAttribute('src') ?? '',
    })),
  );
  for (const { name, src } of rendered) {
    const slug = byName.get(name);
    expect(slug, name).toBeDefined();
    expect(src, name).toMatch(new RegExp(`/assets/${slug}-[^/]+\\.webp$`));
  }
  await expect
    .poll(() =>
      rows.locator('img').evaluateAll((images) =>
        images.every((image) => {
          const img = image as HTMLImageElement;
          return img.complete && img.naturalWidth === 320 && img.naturalHeight === 320;
        }),
      ),
    )
    .toBe(true);
}

test('all catalogue thumbnails load in Browse and Add an exercise, including offline', async ({
  page,
  context,
}) => {
  const user = await createUser('icons-catalogue', { onboarded: true });
  const catalogue = await sql<{ name: string; slug: string }>(
    'select name, slug from public.exercises where is_active order by name',
  );
  expect(catalogue.length).toBe(92);
  await signIn(page, user);
  await waitForCatalogue(page);
  await page.goto('/#/exercises');
  await expectCatalogueIcons(page, catalogue);

  // The install cache also serves the first picker visit after losing connectivity.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (navigator.serviceWorker.controller === null) {
      await new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), {
          once: true,
        }),
      );
    }
  });
  await context.setOffline(true);
  try {
    await page.goto('/#/exercises?add=1');
    await expect(page.getByRole('heading', { name: 'Add an exercise', exact: true })).toBeVisible();
    await expectCatalogueIcons(page, catalogue);
    await expect(page.locator('button.browse-exercise-row')).toHaveCount(catalogue.length);
    await page.reload();
    await expectCatalogueIcons(page, catalogue);
  } finally {
    await context.setOffline(false);
  }
});

test('exercise thumbnails retain their size and alignment in both themes on phone and desktop', async ({
  page,
}, testInfo) => {
  const user = await createUser('icons-layout', { onboarded: true });
  await signIn(page, user);
  await waitForCatalogue(page);
  for (const width of [320, 393, 1280]) {
    await page.setViewportSize({ width, height: 852 });
    for (const theme of ['light', 'dark']) {
      for (const mode of ['browse', 'add']) {
        await page.goto(`/#/exercises${mode === 'add' ? '?add=1' : ''}`);
        await page.evaluate((value) => {
          document.documentElement.dataset['theme'] = value;
        }, theme);
        const rows = page.locator('.browse-exercise-row');
        await expect(rows.first()).toBeVisible();
        const icons = rows.locator('.browse-exercise-icon');
        const first = await icons.nth(0).boundingBox();
        const second = await icons.nth(1).boundingBox();
        expect(first?.width).toBeGreaterThanOrEqual(40);
        expect(first?.width).toBe(second?.width);
        expect(first?.height).toBe(second?.height);
        expect(first?.x).toBe(second?.x);
        const names = rows.locator('.browse-exercise-copy');
        expect((await names.nth(0).boundingBox())?.x).toBe((await names.nth(1).boundingBox())?.x);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
          width,
        );
        await expect(rows.first().locator('img')).toHaveCSS('object-fit', 'contain');
        await page.screenshot({ path: testInfo.outputPath(`icons-${mode}-${theme}-${width}.png`) });
      }
    }
  }
});
