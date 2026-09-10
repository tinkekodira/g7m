/**
 * Put the licensed anatomy model where the build can find it.
 *
 *   node scripts/install-anatomy-model.mjs <file-or-url>
 *
 * ADR-0009 says the asset is fetched at build time and never committed. This is
 * the fetching half: CI runs it with a URL held in a repository secret, and a
 * developer runs it with the path to the GLB they just cut.
 *
 * ## Why the filename carries a hash
 *
 * Not obscurity — anyone can read the manifest. Cache correctness.
 *
 * `anatomy/` is deliberately left out of the service worker's precache: the
 * model is megabytes, optional, and wanted only by a screen most people never
 * open. It is kept by the *runtime* cache instead, which is the right trade and
 * has one consequence — at a fixed URL, a device that has the model never asks
 * for it again. Rebuild the geometry, deploy, and every phone that has already
 * been to the Learn screen keeps the old body for good.
 *
 * A content hash in the name makes a new model a new URL, so the old entry is
 * simply never requested again and the new one is fetched once.
 *
 * The manifest is what lets the app find the current name without the build
 * having to rewrite any source.
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const TARGET = resolve(HERE, '..', 'public', 'anatomy');
const MANIFEST = 'manifest.json';

/** 'glTF' little-endian: the first four bytes of every GLB. */
const GLB_MAGIC = 0x46546c67;

async function bytesFrom(source) {
  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(
        `${String(response.status)} fetching the model. Check the URL has not expired.`,
      );
    }
    return Buffer.from(await response.arrayBuffer());
  }
  return readFile(resolve(source));
}

const source = process.argv[2];
if (source === undefined || source === '') {
  console.error('Usage: node scripts/install-anatomy-model.mjs <file-or-url>');
  process.exit(2);
}

const bytes = await bytesFrom(source);

/**
 * Checked before anything is written.
 *
 * A signed URL that has expired answers 200 with an XML error document, and a
 * mistyped path answers with a dev server's index page. Both are perfectly
 * valid files and neither is a model — writing one would produce a build that
 * looks complete and shows the generated body with no explanation.
 */
if (bytes.length < 4 || bytes.readUInt32LE(0) !== GLB_MAGIC) {
  console.error(
    `That is not a GLB: ${String(bytes.length)} bytes starting ` +
      `${bytes.subarray(0, 4).toString('hex')}. Expected the glTF magic number.`,
  );
  process.exit(1);
}

const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 8);
const name = `body-${hash}.glb`;

await mkdir(TARGET, { recursive: true });

// Older models first, so a failure part-way through leaves the manifest
// pointing at a file that is still there.
for (const existing of await readdir(TARGET).catch(() => [])) {
  if (existing !== name && /^body-[0-9a-f]+\.glb$/.test(existing)) {
    await unlink(join(TARGET, existing));
  }
}

await writeFile(join(TARGET, name), bytes);
await writeFile(
  join(TARGET, MANIFEST),
  `${JSON.stringify({ model: name, bytes: bytes.length }, null, 2)}\n`,
);

const mb = (bytes.length / 1024 / 1024).toFixed(2);
console.log(`[32m✓[0m anatomy model: ${name}, ${mb} MB`);
