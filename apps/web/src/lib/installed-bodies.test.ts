/**
 * The bodies installed in this checkout, checked against the node contract.
 *
 * **Skipped unless a body has been installed**, which on most checkouts and
 * in CI's test job it has not: the male is licensed, the female is handled
 * the same way, and neither is committed (ADR-0009, ADR-0019). Run
 * `node scripts/install-anatomy-model.mjs [--body female] <glb>` from
 * `apps/web` first, and this reads whatever the manifest names.
 *
 * `build-model.test.ts` checks the male where he is cut. This checks what the
 * app will actually be served, including the female, which is cut in another
 * repository and arrives here as a finished file (ADR-0096).
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { MUSCLES, bareSkinForms, checkModelContract, parseBodyNode } from '@g7m/anatomy';
import { BODIES, modelFileFor, type BodyKind } from './anatomy-model.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ANATOMY = join(HERE, '..', '..', 'public', 'anatomy');
const MANIFEST = join(ANATOMY, 'manifest.json');

/**
 * Skin that is the female body's alone. It renders and never selects, so
 * tapping the chest lights the pecs and leaves the breasts as skin.
 */
const OWN_SKIN: Record<BodyKind, readonly string[]> = {
  male: [],
  female: ['skin_breast_l', 'skin_breast_r'],
};

/** Each body's own file, not the one it would fall back to. */
function installed(): [BodyKind, string][] {
  if (!existsSync(MANIFEST)) return [];
  const manifest: unknown = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  const files: [BodyKind, string][] = [];
  for (const body of BODIES) {
    const file = modelFileFor(manifest, body);
    if (file === null || (body === 'female' && file === modelFileFor(manifest, 'male'))) continue;
    files.push([body, join(ANATOMY, file)]);
  }
  return files;
}

/** Node names from a GLB's JSON chunk, which is always the first. */
function glbNodeNames(path: string): string[] {
  const file = readFileSync(path);
  if (file.readUInt32LE(0) !== 0x46546c67) throw new Error(`${path} is not a GLB`);
  const length = file.readUInt32LE(12);
  const parsed: unknown = JSON.parse(file.subarray(20, 20 + length).toString('utf8'));
  const nodes = (parsed as { nodes?: { name?: string }[] }).nodes ?? [];
  return nodes.map((node) => node.name ?? '');
}

const bodies = installed();

describe.skipIf(bodies.length === 0)('the installed bodies', () => {
  const surface = MUSCLES.filter((spec) => spec.deep !== true).map((spec) => spec.slug);
  const expectedSkin = bareSkinForms().map((form) => form.nodeName);

  it.each(bodies)(
    '%s has a node for every muscle that reaches the skin, and nothing else',
    (_, path) => {
      const report = checkModelContract(
        { all: MUSCLES.map((spec) => spec.slug), selectable: surface },
        glbNodeNames(path),
      );
      expect(report.missing).toEqual([]);
      expect(report.unknown).toEqual([]);
    },
  );

  it.each(bodies)('%s carries no skin beyond the male contract except its own', (body, path) => {
    const skin = glbNodeNames(path).filter((name) => parseBodyNode(name)?.muscle === false);
    expect(skin.sort()).toEqual([...expectedSkin, ...OWN_SKIN[body]].sort());
  });

  it.each(bodies)('%s has only nodes the loader can read', (_, path) => {
    for (const name of glbNodeNames(path)) {
      expect(parseBodyNode(name), name).not.toBeNull();
    }
  });

  /**
   * Bare skin, not a muscle: nothing in the taxonomy is called `skin-breast`,
   * so the viewer's selectable set can never contain it.
   */
  it('reads the breasts as skin that never selects', () => {
    for (const name of OWN_SKIN.female) {
      const node = parseBodyNode(name);
      expect(node?.muscle).toBe(false);
      expect(node?.slug).toBe('skin-breast');
      expect(surface).not.toContain(node?.slug);
    }
  });
});
