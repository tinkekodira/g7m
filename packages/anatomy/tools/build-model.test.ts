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
import { alignToSculpt } from '../src/align.js';
import { bareSkinForms, placeholderBodyParts } from '../src/placeholder-body.js';
import { checkModelContract, parseBodyNode, parseMuscleNode } from '../src/node-names.js';
import { MUSCLES } from '../src/atlas.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(HERE, '..', 'assets', 'licensed', 'full_body');
const FITTED = join(ASSETS, 'body_fit.obj');
const LABELS = join(ASSETS, 'body_labels.json');
const GLB = join(ASSETS, 'body.glb');

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

/**
 * How much tendon a source vertex may be and still claim skin.
 *
 * See `CloudOptions.maxTendon`. This is the setting that gave the bicep back:
 * at 1.0 it had 127 vertices of sixty thousand, at 0.4 it has 521 and the
 * deltoid has stopped running a third of the way down the humerus. Below 0.3
 * it starts to lose again, and 0.6 leaves two parts with no geometry at all.
 */
const MAX_TENDON = Number(process.env.G7M_MAX_TENDON ?? '0.4');

/** The share of the body below which a part is not a target, whatever the contract says. */
const MIN_SHARE = 0.001;

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

    /**
     * Surface muscles only, which is ADR-0044's answer to the mottled back.
     *
     * A closed skin can only be divided among the muscles that reach it.
     * Letting a rhomboid — floated outward by the procedural body so that a
     * sliver shows between the trapezius fascicles — bid for skin does not
     * carve a sliver, because there are no gaps in a skin. It takes a patch
     * out of the middle of the trapezius instead.
     *
     * The deep ones are left out of the export entirely. They are drawn on
     * the generated body, which has gaps for them, and they are not tap
     * targets on either — the taxonomy marks them unselectable (ADR-0049).
     */
    const parts = placeholderBodyParts();
    const surface = parts.filter((part) => !part.deep);

    /**
     * The head, the hands, the feet and the groin, claiming their own skin.
     *
     * Without them the flood has to give this surface to *some* muscle,
     * because every vertex gets a label and these are attached to the body
     * like anything else. It gave the back of the skull to the trapezius, the
     * hand and every finger to the wrist extensors, and both feet to the
     * soleus — 5618 vertices, the largest label on the body, on a muscle that
     * stops at the ankle.
     *
     * None of that was a labelling error. It was the only answer available to
     * a question that should never have been asked, and the fix is to let the
     * skin over no muscle say so.
     */
    const bare = bareSkinForms();

    /**
     * The arms moved out to where the sculpt holds them.
     *
     * The two figures stand differently and `maxDistance` is 6 cm, so without
     * this there is nothing within reach of a forearm and everything from the
     * elbow down is assigned by the flood. See `align.ts` — including why the
     * atlas moves out rather than the sculpt moving in.
     */
    const cloud = cloudFrom(alignToSculpt([...surface, ...bare]), { maxTendon: MAX_TENDON });

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
    console.log(
      `named parts hit ${String(counts.size)} of ${String(cloud.names.length)} on the surface, ` +
        `${String(parts.length - surface.length)} deep ones left out of the skin`,
    );

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

    /**
     * Big enough to hit with a finger.
     *
     * `checkModelContract` asks whether a muscle has a node, and a node with
     * six vertices out of sixty thousand passes that question while being
     * impossible to tap — which is exactly the failure the contract exists to
     * prevent, arriving through the one door it does not watch. The
     * infraspinatus was in that state: present, exported, and unreachable.
     *
     * A tenth of a percent of the body is a patch a couple of centimetres
     * across. Below that nobody is selecting it on purpose.
     */
    const starved = [...counts]
      .filter(([, count]) => count < labels.length * MIN_SHARE)
      .map(([name, count]) => `${name} (${String(count)})`);
    expect(starved, 'too small to tap').toEqual([]);
  });

  it('names everything the way node-names.ts expects', () => {
    const cloud = cloudFrom(placeholderBodyParts());
    for (const name of cloud.names) {
      expect(parseMuscleNode(name), name).not.toBeNull();
    }
  });

  /**
   * Bare skin has to be readable by the loader and invisible to the contract.
   *
   * If `skin_head` ever parsed as a muscle it would be reported as a node the
   * taxonomy has never heard of — filing a deliberate part of the model under
   * the one heading that means something is wrong.
   */
  it('names bare skin so the loader reads it and the contract ignores it', () => {
    const bare = bareSkinForms();
    expect(bare.length).toBeGreaterThan(0);

    for (const { nodeName } of bare) {
      expect(parseMuscleNode(nodeName), nodeName).toBeNull();
      expect(parseBodyNode(nodeName)?.muscle, nodeName).toBe(false);
    }
  });
});

/**
 * The node names inside a GLB, without a glTF library.
 *
 * A GLB is a twelve-byte header and then length-prefixed chunks, the first of
 * which is the JSON. Reading the names out of it is twenty lines; taking a
 * dependency to do it would be a strange trade for a build script that runs
 * on one machine.
 */
function glbNodeNames(path: string): string[] {
  const file = readFileSync(path);
  const view = new DataView(file.buffer, file.byteOffset, file.byteLength);
  if (view.getUint32(0, true) !== 0x46546c67) throw new Error(`${path} is not a GLB`);

  let at = 12;
  while (at + 8 <= file.byteLength) {
    const length = view.getUint32(at, true);
    const kind = view.getUint32(at + 4, true);
    const body = file.subarray(at + 8, at + 8 + length);
    // 0x4e4f534a is 'JSON'. The next chunk is the binary buffer.
    if (kind === 0x4e4f534a) {
      const parsed: unknown = JSON.parse(new TextDecoder().decode(body));
      const nodes = (parsed as { nodes?: { name?: string }[] }).nodes ?? [];
      return nodes.map((node) => node.name ?? '');
    }
    at += 8 + length + ((4 - (length % 4)) % 4);
  }
  throw new Error(`${path} has no JSON chunk`);
}

/**
 * The check the whole arrangement was built around.
 *
 * `node-names.ts` says a muscle with no mesh is a part of the body that cannot
 * be tapped, and a mesh with no muscle is one that highlights and then shows
 * an empty exercise list — and that neither raises anything anywhere. This is
 * where it gets raised.
 */
describe.skipIf(!existsSync(GLB))('the exported model', () => {
  const surfaceSlugs = MUSCLES.filter((spec) => spec.deep !== true).map((spec) => spec.slug);

  it('has a node for every muscle that reaches the skin, and nothing else', () => {
    const nodeNames = glbNodeNames(GLB);
    console.log(`nodes ${String(nodeNames.length)}`);

    const report = checkModelContract(
      { all: MUSCLES.map((spec) => spec.slug), selectable: surfaceSlugs },
      nodeNames,
    );
    if (report.missing.length > 0) console.log('MISSING:', report.missing.join(' '));
    if (report.unknown.length > 0) console.log('UNKNOWN:', report.unknown.join(' '));

    expect(report.missing).toEqual([]);
    expect(report.unknown).toEqual([]);
  });

  it('names both sides of every paired muscle', () => {
    const nodeNames = new Set(glbNodeNames(GLB));
    for (const spec of MUSCLES) {
      if (spec.deep === true) continue;
      const sides = spec.midline === true ? [''] : ['_l', '_r'];
      for (const side of sides) {
        expect(nodeNames.has(`muscle_${spec.slug}${side}`), `${spec.slug}${side}`).toBe(true);
      }
    }
  });

  /**
   * A body with no head is worse than a body with a mislabelled one.
   *
   * These nodes carry the surface no muscle owns, and `partsFromObject` is the
   * only thing that draws them. Dropping them from the export would take the
   * skull, both hands, both feet and the groin out of the figure and leave
   * holes where they were.
   */
  it('exports the skin that covers no muscle', () => {
    const nodeNames = new Set(glbNodeNames(GLB));
    const bare = bareSkinForms();
    for (const { nodeName } of bare) {
      expect(nodeNames.has(nodeName), nodeName).toBe(true);
    }
  });

  /**
   * The deep ones are deliberately absent: a closed skin has no room for a
   * muscle that never reaches it (ADR-0045), and the taxonomy no longer
   * offers them as tap targets (ADR-0049).
   */
  it('leaves the deep muscles out', () => {
    const nodeNames = new Set(glbNodeNames(GLB));
    const deep = MUSCLES.filter((spec) => spec.deep === true);
    expect(deep.length).toBeGreaterThan(0);
    for (const spec of deep) {
      expect(nodeNames.has(`muscle_${spec.slug}_r`), spec.slug).toBe(false);
    }
  });
});
