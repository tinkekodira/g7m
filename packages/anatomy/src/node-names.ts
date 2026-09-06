/**
 * The naming contract between the muscle taxonomy and the 3D model.
 *
 * `muscles.mesh_node_names` in Postgres holds the names this code expects to
 * find in the GLB. The seed migration says so in as many words: *"The model
 * does not exist yet, so these names define what it must provide rather than
 * describing what it does."* This file is the other end of that sentence —
 * the convention written as code, so a model can be checked against it before
 * anyone tries to tap a muscle that was never exported.
 *
 * `muscle_<slug>_l` and `muscle_<slug>_r` for a paired muscle, `muscle_<slug>`
 * for one on the midline. Lowercase throughout, because a GLB exported from
 * Blender preserves whatever case the artist typed and half of them capitalise.
 */

export const NODE_PREFIX = 'muscle_';

export type Side = 'left' | 'right' | 'midline';

const SUFFIX: Record<Exclude<Side, 'midline'>, string> = { left: '_l', right: '_r' };

export interface MuscleNode {
  readonly slug: string;
  readonly side: Side;
}

/** The node name for one side of one muscle. */
export function meshNodeName(slug: string, side: Side): string {
  return side === 'midline' ? `${NODE_PREFIX}${slug}` : `${NODE_PREFIX}${slug}${SUFFIX[side]}`;
}

/**
 * Both node names for a paired muscle, or the single one for a midline muscle.
 *
 * Almost everything a lifter trains is paired. `rectus-abdominis` and
 * `erector-spinae` are the exceptions the taxonomy already notes — often
 * modelled as one lump even though anatomy would split them.
 */
export function meshNodeNames(slug: string, paired: boolean): string[] {
  return paired
    ? [meshNodeName(slug, 'left'), meshNodeName(slug, 'right')]
    : [meshNodeName(slug, 'midline')];
}

/**
 * Read a node name back, or null if it is not one of ours.
 *
 * Null rather than a guess, because a real anatomy model contains bones,
 * organs, skin and lights alongside the muscles, and a raycast that hit the
 * ribcage must not resolve to the nearest plausible muscle slug.
 */
export function parseMuscleNode(name: string): MuscleNode | null {
  const lower = name.trim().toLowerCase();
  if (!lower.startsWith(NODE_PREFIX)) return null;

  const body = lower.slice(NODE_PREFIX.length);
  if (body === '') return null;

  if (body.endsWith(SUFFIX.left)) {
    return { slug: body.slice(0, -SUFFIX.left.length), side: 'left' };
  }
  if (body.endsWith(SUFFIX.right)) {
    return { slug: body.slice(0, -SUFFIX.right.length), side: 'right' };
  }
  return { slug: body, side: 'midline' };
}

export interface ContractReport {
  /** Selectable muscles with no geometry. Tapping these would do nothing. */
  readonly missing: string[];
  /** Nodes named like a muscle that the taxonomy has never heard of. */
  readonly unknown: string[];
}

export interface Taxonomy {
  /** Every muscle the database knows, selectable or not. */
  readonly all: readonly string[];
  /**
   * The subset a tap should select.
   *
   * Separate from `all` because they genuinely differ: the taxonomy carries
   * muscles that exist to complete the anatomy and that nobody programs for —
   * `sternocleidomastoid` is the one in the seed today. A real model will
   * contain geometry for those, and it is not an error that it does.
   */
  readonly selectable: readonly string[];
}

/**
 * Check a model against the taxonomy.
 *
 * The failure this exists to catch is silent in both directions: a muscle with
 * no mesh is a part of the body that cannot be tapped, and a mesh with no
 * muscle is a part that highlights and then shows an empty exercise list. Both
 * look like the model "not working properly" and neither raises anything.
 *
 * Run against whatever a model source provides, at load, so it is a startup
 * warning rather than a bug report from somebody prodding a shoulder.
 */
export function checkModelContract(
  taxonomy: Taxonomy,
  nodeNames: readonly string[],
): ContractReport {
  const known = new Set(taxonomy.all);
  const present = new Set<string>();

  const unknown: string[] = [];
  for (const name of nodeNames) {
    const node = parseMuscleNode(name);
    if (node === null) continue;
    if (known.has(node.slug)) present.add(node.slug);
    else if (!unknown.includes(node.slug)) unknown.push(node.slug);
  }

  return {
    // Only the selectable ones can be *missing*: geometry for a muscle nobody
    // can tap is not required, and demanding it would fail every real model
    // against a taxonomy that deliberately carries more than it selects.
    missing: taxonomy.selectable.filter((slug) => !present.has(slug)),
    unknown,
  };
}
