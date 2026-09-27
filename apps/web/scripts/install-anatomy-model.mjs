/**
 * Put the licensed anatomy model where the build can find it.
 *
 *   node scripts/install-anatomy-model.mjs [--body male|female] <file-or-url>
 *
 * ADR-0009 says the asset is fetched at build time and never committed. This is
 * the fetching half: CI runs it with a URL held in a repository secret, and a
 * developer runs it with the path to the GLB they just cut.
 *
 * ## Two bodies, two slots
 *
 * The app draws a male body or a female one by the profile's sex (ADR-0096),
 * and a build can carry either, both or neither. `--body` says which slot this
 * file goes in, and it defaults to the male, which is what every call made
 * before there were two bodies meant. Installing one body never touches the
 * other's file or its line in the manifest.
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
import { access, mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const HERE = dirname(fileURLToPath(import.meta.url));
const TARGET = resolve(HERE, '..', 'public', 'anatomy');
const MANIFEST = 'manifest.json';

/**
 * What each body's files are called, and how its older copies are recognised.
 *
 * The male keeps the name he always had, so a manifest written before there
 * were two bodies still points at a file this recognises as his. The female's
 * prefix is not hex, so neither pattern can match the other's files.
 */
const SLOTS = {
  male: { prefix: 'body-', own: /^body-[0-9a-f]+\.glb$/ },
  female: { prefix: 'body-female-', own: /^body-female-[0-9a-f]+\.glb$/ },
};

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

/**
 * The bodies already installed, whichever shape the manifest is in.
 *
 * The old form, `{ "model", "bytes" }`, is one male body. An entry whose file
 * has gone is dropped rather than carried forward, so the manifest never
 * names something the app would fetch and not find.
 */
async function installedBodies() {
  const parsed = await readFile(join(TARGET, MANIFEST), 'utf8')
    .then((text) => JSON.parse(text))
    .catch(() => null);
  if (parsed === null || typeof parsed !== 'object') return {};

  const listed =
    typeof parsed.bodies === 'object' && parsed.bodies !== null
      ? parsed.bodies
      : typeof parsed.model === 'string'
        ? { male: { model: parsed.model, bytes: parsed.bytes } }
        : {};

  const bodies = {};
  for (const body of Object.keys(SLOTS)) {
    const entry = listed[body];
    if (typeof entry?.model !== 'string') continue;
    const present = await access(join(TARGET, entry.model)).then(
      () => true,
      () => false,
    );
    if (present) bodies[body] = { model: entry.model, bytes: entry.bytes };
  }
  return bodies;
}

const usage = 'Usage: node scripts/install-anatomy-model.mjs [--body male|female] <file-or-url>';
const { values, positionals } = parseArgs({
  options: { body: { type: 'string', default: 'male' } },
  allowPositionals: true,
});
const body = values.body;
const source = positionals[0];
if (source === undefined || source === '' || !Object.hasOwn(SLOTS, body)) {
  console.error(usage);
  process.exit(2);
}
const slot = SLOTS[body];

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
const name = `${slot.prefix}${hash}.glb`;

await mkdir(TARGET, { recursive: true });

const bodies = { ...(await installedBodies()), [body]: { model: name, bytes: bytes.length } };

/**
 * The male is also written at the top level, where the manifest's first shape
 * kept him. A phone still running the build before this one reads only that
 * line, and so goes on drawing exactly what it drew.
 */
const manifest = {
  ...(bodies.male === undefined ? {} : bodies.male),
  bodies,
};

// The new file, then the manifest naming it, then this body's older copies.
// Stopping at any point leaves the manifest naming files that are there.
await writeFile(join(TARGET, name), bytes);
await writeFile(join(TARGET, MANIFEST), `${JSON.stringify(manifest, null, 2)}\n`);
for (const existing of await readdir(TARGET)) {
  if (existing !== name && slot.own.test(existing)) {
    await unlink(join(TARGET, existing));
  }
}

const mb = (bytes.length / 1024 / 1024).toFixed(2);
console.log(`[32m✓[0m anatomy model (${body}): ${name}, ${mb} MB`);
