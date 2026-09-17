/**
 * The web app's Home Screen icons, from the same art as the native ones.
 *
 * `@capacitor/assets` fills in `ios/` and `android/`; these three files are
 * what the manifest and `index.html` point at, and on an iPhone that has the
 * app on its Home Screen rather than installed, they *are* the app icon. Drawn
 * from `assets/icon-only.svg` so there is one mark, not two that drift.
 *
 * Run through `pnpm --filter @g7m/mobile assets`, never by hand.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, '..', 'assets', 'icon-only.svg');
const out = join(here, '..', '..', 'web', 'public');

/** The sizes `manifest.webmanifest` and `index.html` ask for. */
const SIZES = [180, 192, 512];

await mkdir(out, { recursive: true });
for (const size of SIZES) {
  const png = await sharp(source, { density: 384 }).resize(size, size).png().toBuffer();
  const file = join(out, `icon-${String(size)}.png`);
  await writeFile(file, png);
  console.log(`icon-${String(size)}.png  ${String(Math.round(png.byteLength / 1024))} KB`);
}
