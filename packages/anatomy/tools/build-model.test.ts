/**
 * Pass two: give every vertex of the sculpt a muscle name.
 *
 * A test that generates a file, which is the same shape as `pnpm sync-rules`
 * in `@g7m/db`: vitest is the only thing in this repository that runs
 * TypeScript, so a generator written in TypeScript is a test whether or not it
 * asserts anything. This one does both — it writes the labels and then checks
 * them against the contract in `node-names.ts`, which is the check that
 * matters, because a model missing a muscle is a part of the body that cannot
 * be tapped and nothing anywhere raises it.
 *
 * **Skipped unless the licensed sculpt has been fitted.** The asset is not in
 * the repository and never will be (ADR-0009, ADR-0019), so this has to be
 * absent-by-default rather than red-by-default. Run pass one first:
 *
 *   blender --background --factory-startup --python packages/anatomy/tools/fit.py \
 *     -- <sculpt>.OBJ packages/anatomy/assets/licensed/full_body/body_fit.obj 120000
 */
/* eslint-disable no-console -- This is a generator, and the report it prints
   is the point: which muscles got geometry, which got none, and how much. It
   runs by hand and its output is read by a person, not shipped anywhere. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { cloudFrom, transferLabels } from '../src/label-transfer.js';
import { placeholderBodyParts } from '../src/placeholder-body.js';
import { parseMuscleNode } from '../src/node-names.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(HERE, '..', 'assets', 'licensed', 'full_body');
const FITTED = join(ASSETS, 'body_fit.obj');
const LABELS = join(ASSETS, 'body_labels.json');

/**
 * How far a skin vertex may be from a muscle and still be claimed by it.
 *
 * Six centimetres, which sounds enormous until you remember what is being
 * measured: the sculpt is a heavier figure than the procedural one — 29 cm of
 * chest half-width against 23 — so its skin genuinely sits that far outside
 * the atlas's idea of the same muscle. Anything tighter leaves the whole chest
 * for the flood to guess at.
 */
const MAX_DISTANCE = Number(process.env.G7M_MAX_DISTANCE ?? '0.06');
const SMOOTHING_PASSES = Number(process.env.G7M_SMOOTHING ?? '3');

interface ParsedObj {
  readonly positions: Float32Array;
  readonly indices: Uint32Array;
}

function readObj(path: string): ParsedObj {
  const text = readFileSync(path, 'utf8');
  const positions: number[] = [];
  const indices: number[] = [];

  for (const line of text.split('\n')) {
    if (line.startsWith('v ')) {
      const parts = line.split(/\s+/);
      positions.push(Number(parts[1]), Number(parts[2]), Number(parts[3]));
    } else if (line.startsWith('f ')) {
      const parts = line.trim().split(/\s+/).slice(1);
      // One-based in the file, and a face may carry `v/vt/vn`.
      const corners = parts.map((part) => Number(part.split('/')[0]) - 1);
      for (let i = 1; i + 1 < corners.length; i += 1) {
        indices.push(corners[0]!, corners[i]!, corners[i + 1]!);
      }
    }
  }

  return { positions: new Float32Array(positions), indices: new Uint32Array(indices) };
}

describe.skipIf(!existsSync(FITTED))('the licensed model', () => {
  it('gets a muscle name on every vertex', () => {
    const body = readObj(FITTED);
    const cloud = cloudFrom(placeholderBodyParts());

    const started = Date.now();
    const labels = transferLabels(body, cloud, {
      maxDistance: MAX_DISTANCE,
      smoothingPasses: SMOOTHING_PASSES,
    });
    const elapsed = Date.now() - started;

    const counts = new Map<string, number>();
    let unlabelled = 0;
    for (const label of labels) {
      if (label < 0) {
        unlabelled += 1;
        continue;
      }
      const name = cloud.names[label]!;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }

    console.log(
      `vertices ${String(labels.length)}  faces ${String(body.indices.length / 3)}  ` +
        `sources ${String(cloud.label.length)}  in ${String(elapsed)}ms`,
    );
    console.log(`named parts hit ${String(counts.size)} of ${String(cloud.names.length)}`);

    const missing = cloud.names.filter((name) => !counts.has(name));
    if (missing.length > 0) console.log('NO GEOMETRY:', missing.join(' '));

    const ranked = [...counts].sort((a, b) => b[1] - a[1]);
    for (const [name, count] of ranked) {
      console.log(`  ${name.padEnd(34)} ${String(count).padStart(6)}`);
    }

    // Written before the assertions: this is a generator first, and a render
    // of a bad labelling is the fastest way to find out why it is bad.
    writeFileSync(LABELS, JSON.stringify({ names: cloud.names, labels: [...labels] }), 'utf8');

    // The flood reaches everything attached to anything, so a leftover is a
    // vertex floating free of the mesh — which would raycast to nothing.
    expect(unlabelled).toBe(0);
  });

  it('names everything the way node-names.ts expects', () => {
    const cloud = cloudFrom(placeholderBodyParts());
    for (const name of cloud.names) {
      expect(parseMuscleNode(name), name).not.toBeNull();
    }
  });
});
