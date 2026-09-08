/**
 * Giving a sculpted body the muscle names the app needs.
 *
 * The licensed model is one welded surface: 726k vertices, no per-muscle
 * objects, no polygroups, no materials. It is beautiful and unusable as it
 * stands, because `node-names.ts` needs a node per muscle to tap.
 *
 * The atlas already knows where every muscle is — that is the whole of
 * `placeholder-body.ts`. So the labels come from there: for each vertex of the
 * sculpt, whichever procedural muscle is nearest owns it. The sculpt supplies
 * the shape and the atlas supplies the anatomy, which is the right way round.
 * Neither could do it alone.
 *
 * ## Why this is not just nearest-neighbour
 *
 * A raw nearest-neighbour pass gives a correct-looking body with confetti all
 * over it. Two vertices a millimetre apart on the same bicep can have
 * different nearest muscles wherever two run alongside each other, and a
 * scattering of single-vertex islands is worse than a wrong label: it makes
 * the highlight flicker as the finger moves.
 *
 * So it is three passes, and the last two are the ones that matter.
 *
 *   1. Nearest source point within a radius, on a uniform grid.
 *   2. Majority vote over each vertex's neighbours, repeated. Islands lose to
 *      whatever surrounds them; a genuine border survives because both sides
 *      keep winning their own half.
 *   3. Flood the unlabelled from the labelled, along the surface. A vertex
 *      further from every muscle than the radius allows — the middle of a
 *      palm, the face — takes the label that reaches it first, so the mesh has
 *      no holes for a raycast to fall through.
 */
import type { MeshData } from './geometry/tube.js';

export interface SourceCloud {
  /** Positions of every labelled point, `n * 3`. */
  readonly positions: Float32Array;
  /** Which name each point carries, `n`, indexing into `names`. */
  readonly label: Int32Array;
  readonly names: readonly string[];
}

export interface TargetMesh {
  readonly positions: Float32Array;
  readonly indices: Uint32Array;
}

export interface TransferOptions {
  /**
   * How far a vertex may be from a muscle and still be claimed by it, in
   * metres. Beyond it the vertex is left to the flood, which spreads along the
   * surface rather than through it — a fingertip should inherit from the
   * forearm it is attached to, not from whatever is nearest as the crow flies
   * through the leg.
   */
  readonly maxDistance: number;
  /** Majority-vote rounds. Two or three; more starts eating real borders. */
  readonly smoothingPasses: number;
}

/**
 * Everything the procedural body knows, as one labelled point cloud.
 *
 * Keyed on `nodeName` rather than the slug, because the sides are what get
 * tapped: `muscle_biceps-brachii_l` and `_r` are two different answers to
 * "what did I just touch", and collapsing them here would need them separated
 * again by position later, using exactly the information this threw away.
 */
export function cloudFrom(
  parts: readonly { readonly nodeName: string; readonly mesh: MeshData }[],
): SourceCloud {
  let total = 0;
  for (const part of parts) total += part.mesh.positions.length / 3;

  const positions = new Float32Array(total * 3);
  const label = new Int32Array(total);
  const names: string[] = [];

  let at = 0;
  for (const part of parts) {
    const index = names.length;
    names.push(part.nodeName);
    const source = part.mesh.positions;
    positions.set(source, at * 3);
    label.fill(index, at, at + source.length / 3);
    at += source.length / 3;
  }

  return { positions, label, names };
}

/**
 * A label for every vertex of the target mesh.
 *
 * `-1` survives only where nothing was labelled at all: the flood reaches
 * every vertex connected to anything, and a mesh with no labelled vertex
 * returns all `-1` rather than inventing one.
 */
export function transferLabels(
  target: TargetMesh,
  source: SourceCloud,
  options: TransferOptions,
): Int32Array {
  const count = target.positions.length / 3;
  const labels = nearestLabels(target.positions, source, options.maxDistance);
  const neighbours = adjacency(target.indices, count);

  for (let pass = 0; pass < options.smoothingPasses; pass += 1) {
    smoothOnce(labels, neighbours, source.names.length);
  }
  flood(labels, neighbours);

  return labels;
}

/** Pass one: nearest labelled point within the radius, or -1. */
function nearestLabels(
  positions: Float32Array,
  source: SourceCloud,
  maxDistance: number,
): Int32Array {
  const count = positions.length / 3;
  const labels = new Int32Array(count).fill(-1);
  if (source.label.length === 0) return labels;

  // One cell per search radius, so the answer is always inside the 27 cells
  // around the query. A finer grid costs memory for no fewer candidates.
  const cell = Math.max(maxDistance, 1e-4);
  const grid = new Map<number, number[]>();
  // Offsets keep every component non-negative for a body that straddles the
  // origin, which all of them do.
  const key = (x: number, y: number, z: number): number =>
    (Math.floor(x / cell) + 512) * 1048576 +
    (Math.floor(y / cell) + 512) * 1024 +
    (Math.floor(z / cell) + 512);

  for (let i = 0; i < source.label.length; i += 1) {
    const k = key(
      source.positions[i * 3]!,
      source.positions[i * 3 + 1]!,
      source.positions[i * 3 + 2]!,
    );
    const bucket = grid.get(k);
    if (bucket === undefined) grid.set(k, [i]);
    else bucket.push(i);
  }

  const limit = maxDistance * maxDistance;
  for (let v = 0; v < count; v += 1) {
    const x = positions[v * 3]!;
    const y = positions[v * 3 + 1]!;
    const z = positions[v * 3 + 2]!;

    let best = limit;
    let found = -1;
    for (let dx = -1; dx <= 1; dx += 1) {
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dz = -1; dz <= 1; dz += 1) {
          const bucket = grid.get(key(x + dx * cell, y + dy * cell, z + dz * cell));
          if (bucket === undefined) continue;
          for (const i of bucket) {
            const ex = source.positions[i * 3]! - x;
            const ey = source.positions[i * 3 + 1]! - y;
            const ez = source.positions[i * 3 + 2]! - z;
            const d = ex * ex + ey * ey + ez * ez;
            if (d < best) {
              best = d;
              found = source.label[i]!;
            }
          }
        }
      }
    }
    labels[v] = found;
  }

  return labels;
}

/** Who touches whom, from the triangles. */
function adjacency(indices: Uint32Array, count: number): number[][] {
  const neighbours: number[][] = Array.from({ length: count }, () => []);
  const link = (a: number, b: number): void => {
    const list = neighbours[a];
    if (list !== undefined && !list.includes(b)) list.push(b);
  };

  for (let t = 0; t + 2 < indices.length; t += 3) {
    const a = indices[t]!;
    const b = indices[t + 1]!;
    const c = indices[t + 2]!;
    if (a >= count || b >= count || c >= count) continue;
    link(a, b);
    link(b, a);
    link(b, c);
    link(c, b);
    link(c, a);
    link(a, c);
  }
  return neighbours;
}

/**
 * Pass two: each vertex takes whichever label most of its neighbours hold.
 *
 * Read from a snapshot rather than in place, so the result does not depend on
 * the order the exporter happened to number the mesh in — an in-place vote
 * feeds one vertex's new label into its neighbour's count within the same
 * pass, and the output then changes when the decimator changes.
 */
function smoothOnce(labels: Int32Array, neighbours: number[][], names: number): void {
  const before = Int32Array.from(labels);
  const tally = new Int32Array(names);

  for (let v = 0; v < labels.length; v += 1) {
    const list = neighbours[v];
    if (list === undefined || list.length === 0) continue;

    const touched: number[] = [];
    for (const n of list) {
      const label = before[n]!;
      if (label < 0) continue;
      const seen = tally[label]!;
      if (seen === 0) touched.push(label);
      tally[label] = seen + 1;
    }

    const own = before[v]!;
    // Its own vote counts, so a vertex on a genuine border is not flipped by a
    // single extra neighbour from the other side.
    if (own >= 0) {
      const seen = tally[own]!;
      if (seen === 0) touched.push(own);
      tally[own] = seen + 1;
    }

    let winner = own;
    let bestCount = own >= 0 ? tally[own]! : 0;
    for (const label of touched) {
      const c = tally[label]!;
      // Ties go to the lower index, so a pass is deterministic.
      if (c > bestCount || (c === bestCount && (winner < 0 || label < winner))) {
        bestCount = c;
        winner = label;
      }
    }
    labels[v] = winner;

    for (const label of touched) tally[label] = 0;
  }
}

/**
 * Pass three: spread outward until nothing is left unlabelled.
 *
 * Breadth-first along the surface, so an unlabelled patch takes the label of
 * the nearest labelled thing *it is connected to*. Straight-line distance
 * would let one inner thigh claim the other.
 */
function flood(labels: Int32Array, neighbours: number[][]): void {
  const queue: number[] = [];
  for (let v = 0; v < labels.length; v += 1) {
    if (labels[v]! >= 0) queue.push(v);
  }
  if (queue.length === 0) return;

  // The queue grows while it is being walked, which is the whole of the
  // breadth-first search. An array iterator re-reads `length` on every step,
  // so appended vertices are visited in turn rather than missed.
  for (const v of queue) {
    const label = labels[v]!;
    for (const n of neighbours[v] ?? []) {
      if (labels[n]! >= 0) continue;
      labels[n] = label;
      queue.push(n);
    }
  }
}
