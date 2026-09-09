/**
 * Reading a real model into the same shape the generated one has.
 *
 * `AnatomyViewer` takes `BodyPart[]` and knows nothing about where they came
 * from — that was the point of the arrangement from the start, and this is the
 * function that cashes it in. A licensed GLB goes in, the same parts come out,
 * and nothing above changes.
 *
 * ## What it looks for
 *
 * Meshes whose names parse as muscle nodes, and only those. A real anatomy
 * model contains bones, organs, a skin, lights and cameras alongside the
 * muscles, and `parseMuscleNode` returning null is how each of those is left
 * alone rather than guessed at.
 *
 * ## Tendon weight is zero, deliberately
 *
 * The generated body blends toward bone-white on a per-vertex tendon weight,
 * which is what stops a muscle reading as a painted worm. A sculpted skin has
 * no tendons on it — it is skin — so the weight is zero everywhere and the
 * blend does nothing. That is the right answer rather than a missing feature:
 * the model this loads is a surface, not an écorché, and painting tendons onto
 * it would be inventing anatomy that the artist did not sculpt.
 */
import { Matrix3, Vector3, type Matrix4, type Object3D } from 'three';
import type { MeshData } from './geometry/tube.js';
import { parseMuscleNode } from './node-names.js';
import type { BodyPart } from './placeholder-body.js';

/**
 * Every muscle in a loaded scene, in the order it appears.
 *
 * Positions are baked through each mesh's world matrix, so a model whose
 * author left the parts under a rotated or scaled parent still arrives in the
 * frame the viewer expects. Ours has no transforms; the next one might.
 */
export function partsFromObject(root: Object3D): BodyPart[] {
  root.updateMatrixWorld(true);

  const parts: BodyPart[] = [];
  root.traverse((object) => {
    if (!isMesh(object)) return;

    const node = parseMuscleNode(object.name);
    if (node === null) return;

    const mesh = meshDataFrom(object.geometry, object.matrixWorld);
    if (mesh === null) return;

    parts.push({
      nodeName: object.name.trim().toLowerCase(),
      slug: node.slug,
      side: node.side,
      mesh,
      // A muscle that reaches the skin, by definition: the deep ones are not
      // in this file at all (ADR-0045). They come from the layer below.
      deep: false,
    });
  });

  return parts;
}

/**
 * The parts of a mesh this reads, named without three's generics.
 *
 * `object instanceof Mesh` narrows to `Mesh<any, any, any>` and
 * `geometry instanceof BufferGeometry` to `BufferGeometry<any, any>`, because
 * those are three's own defaults — and every attribute read from one then
 * arrives as `any`, which Brief §0.4 does not allow anywhere. Describing the
 * three fields actually wanted is shorter than fighting that, and it also
 * means this accepts any loader's geometry rather than only three's.
 */
interface AttributeSource {
  readonly array: ArrayLike<number>;
  readonly count: number;
}

interface GeometrySource {
  readonly getAttribute: (name: string) => AttributeSource | undefined;
  readonly getIndex: () => AttributeSource | null;
}

function isMesh(object: Object3D): object is Object3D & { geometry: GeometrySource } {
  if (object.type !== 'Mesh' || !('geometry' in object)) return false;
  const geometry: unknown = (object as { geometry: unknown }).geometry;
  return (
    typeof geometry === 'object' &&
    geometry !== null &&
    typeof (geometry as GeometrySource).getAttribute === 'function' &&
    typeof (geometry as GeometrySource).getIndex === 'function'
  );
}

function meshDataFrom(geometry: GeometrySource, matrixWorld: Matrix4): MeshData | null {
  const position = geometry.getAttribute('position');
  if (position === undefined || position.count === 0) return null;

  const count = position.count;
  const positions = new Float32Array(count * 3);
  const point = new Vector3();
  for (let v = 0; v < count; v += 1) {
    point
      .set(
        position.array[v * 3] ?? 0,
        position.array[v * 3 + 1] ?? 0,
        position.array[v * 3 + 2] ?? 0,
      )
      .applyMatrix4(matrixWorld);
    positions[v * 3] = point.x;
    positions[v * 3 + 1] = point.y;
    positions[v * 3 + 2] = point.z;
  }

  const index = geometry.getIndex();
  const indices =
    index === null
      ? // Unindexed geometry is valid glTF: the triangles are written out in
        // order. Numbering them is what the viewer's index buffer needs.
        Uint32Array.from({ length: count }, (_value, i) => i)
      : Uint32Array.from(index.array);

  const normal = geometry.getAttribute('normal');
  const normals =
    normal === undefined
      ? // A model with no normals shades flat, which on a body reads as
        // faceting rather than as an error — worth deriving rather than
        // shipping.
        derivedNormals(positions, indices)
      : rotatedNormals(normal, count, matrixWorld);

  const uv = geometry.getAttribute('uv');

  return {
    positions,
    normals,
    uvs: uv === undefined ? new Float32Array(count * 2) : Float32Array.from(uv.array),
    // See the header: skin has no tendons on it.
    tendon: new Float32Array(count),
    indices,
  };
}

/**
 * Normals through the mesh's own transform.
 *
 * The inverse transpose, not the matrix itself: a non-uniform scale skews a
 * normal the opposite way to the surface it belongs to, and using the plain
 * matrix would light such a model as though it were still the shape it was
 * before the scale.
 */
function rotatedNormals(
  normal: AttributeSource,
  count: number,
  matrixWorld: Matrix4,
): Float32Array {
  const normals = new Float32Array(count * 3);
  const basis = new Matrix3().getNormalMatrix(matrixWorld);
  const direction = new Vector3();

  for (let v = 0; v < count; v += 1) {
    direction
      .set(normal.array[v * 3] ?? 0, normal.array[v * 3 + 1] ?? 0, normal.array[v * 3 + 2] ?? 0)
      .applyMatrix3(basis)
      .normalize();
    normals[v * 3] = direction.x;
    normals[v * 3 + 1] = direction.y;
    normals[v * 3 + 2] = direction.z;
  }
  return normals;
}

/**
 * Smooth normals from the triangles, area-weighted.
 *
 * The cross product's length is twice the triangle's area, so not normalising
 * it before accumulating is what does the weighting: a large face should pull
 * a shared vertex further than a sliver does.
 */
function derivedNormals(positions: Float32Array, indices: Uint32Array): Float32Array {
  const normals = new Float32Array(positions.length);
  const a = new Vector3();
  const b = new Vector3();
  const c = new Vector3();

  for (let t = 0; t + 2 < indices.length; t += 3) {
    const ia = (indices[t] ?? 0) * 3;
    const ib = (indices[t + 1] ?? 0) * 3;
    const ic = (indices[t + 2] ?? 0) * 3;
    a.fromArray(positions, ia);
    b.fromArray(positions, ib).sub(a);
    c.fromArray(positions, ic).sub(a);
    b.cross(c);

    for (const at of [ia, ib, ic]) {
      normals[at] = (normals[at] ?? 0) + b.x;
      normals[at + 1] = (normals[at + 1] ?? 0) + b.y;
      normals[at + 2] = (normals[at + 2] ?? 0) + b.z;
    }
  }

  for (let v = 0; v < normals.length; v += 3) {
    a.fromArray(normals, v);
    // A vertex with no area around it keeps a unit normal rather than a NaN.
    if (a.lengthSq() === 0) a.set(0, 0, 1);
    a.normalize();
    normals[v] = a.x;
    normals[v + 1] = a.y;
    normals[v + 2] = a.z;
  }
  return normals;
}

/** 'glTF' as a little-endian uint32, the first four bytes of every GLB. */
const GLB_MAGIC = 0x46546c67;

/**
 * Fetch a GLB and read its muscles out, or null if there is not one there.
 *
 * Null rather than a throw for the ordinary absences — no file, a dev server
 * answering with its index page, a body with nothing named like a muscle —
 * because for most checkouts there genuinely is no model and that is not a
 * fault to report. Only a genuine parse failure throws.
 *
 * Lives here rather than in the app because `three` does: `@g7m/anatomy` is
 * the package that owns everything 3D, and the alternative was giving the web
 * app a direct dependency on three to import one loader.
 */
export async function loadBodyParts(url: string): Promise<BodyPart[] | null> {
  const response = await fetch(url);
  if (!response.ok) return null;

  const buffer = await response.arrayBuffer();
  // A dev server that falls back to its index page answers 200 with HTML, so
  // the status is not enough to know a model arrived. The magic number is.
  if (buffer.byteLength < 4) return null;
  if (new DataView(buffer).getUint32(0, true) !== GLB_MAGIC) return null;

  // Imported here rather than at the top of the file so the loader stays out
  // of the entry chunk: only the Learn screen ever needs it.
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const gltf = await new GLTFLoader().parseAsync(buffer, '');

  const parts = partsFromObject(gltf.scene);
  return parts.length > 0 ? parts : null;
}
