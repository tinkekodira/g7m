/**
 * The body, built from the atlas.
 *
 * ADR-0009: the licensed anatomy asset is fetched, never committed, and the
 * repository is public — so there is no GLB in the tree and there may not be
 * one for a while. This is geometry generated at runtime that satisfies the
 * same naming contract a real model has to satisfy (`node-names.ts`), so
 * everything built on top of it — raycasting, selection, the exercise panel,
 * the volume heat map — is real code exercised against real geometry.
 *
 * Swapping in a licensed model is then a change of geometry source and nothing
 * else. If it were the other way round, with the viewer written against a
 * specific GLB, the swap would touch every file here.
 *
 * ## How a muscle becomes a mesh
 *
 * `atlas.ts` gives origin, via and insertion as *lines*. A bundle of N
 * fascicles takes the same fraction along each line, sweeps a fusiform tube
 * along the resulting path — thin tendon, swelling belly, thin tendon — and
 * the N tubes are merged into one geometry. So a wide origin converging on a
 * narrow insertion produces a fan because that is what a fan is, and the
 * striation is not a texture: the fibres are actually there.
 *
 * One mesh per muscle per side. Four hundred fascicles as four hundred meshes
 * would be four hundred draw calls, and it is also the merge that makes a
 * whole muscle one raycast target rather than a bundle of tappable threads.
 */
import { FORMS, MUSCLES, type FormSpec, type MuscleSpec } from './atlas.js';
import { buildTube, mergeMeshes, type MeshData, type TubeProfile } from './geometry/tube.js';
import { distance, lerp, mirrorX, type Vec3 } from './geometry/vec3.js';
import { meshNodeName, type Side } from './node-names.js';

export interface BodyPart {
  readonly nodeName: string;
  readonly slug: string;
  readonly side: Side;
  readonly mesh: MeshData;
  /**
   * Covered by another muscle, and so not on the surface of a real skin.
   *
   * Carried through from the atlas rather than looked up again, because the
   * one caller that needs it is dividing a sculpted skin between these parts
   * and would otherwise have to reach back into `MUSCLES` to ask.
   */
  readonly deep: boolean;
}

export interface BodyForm {
  readonly tone: 'bone' | 'core';
  readonly mesh: MeshData;
}

/**
 * Rings along a fascicle.
 *
 * Twelve, not thirty-two. A fascicle is a few centimetres of gentle curve and
 * the silhouette is already smooth at twelve; the cost is real, because this
 * multiplies by nine fascicles by two sides by thirty-seven muscles.
 */
const SEGMENTS = 12;

/**
 * Points around a fascicle.
 *
 * Eight reads as round at a centimetre across, and the flat shading of the
 * ellipse normals carries the rest. Twelve was tried and is invisible.
 */
const RADIAL = 8;

/**
 * How far a tendon narrows relative to its belly, when a muscle does not say.
 *
 * High, because most muscles are sheets that barely narrow, and a sheet given
 * a waist opens gaps between its fascicles where it should be continuous. The
 * few with long tendons — gastrocnemius into an Achilles, biceps into the
 * radius — name their own.
 */
const TENDON_THICKNESS = 0.82;

/** Default tendon fractions when a muscle does not name its own. */
const DEFAULT_TENDON: readonly [number, number] = [0.06, 0.14];

/** Overlap between neighbouring fascicles when the girth is derived. */
const FASCICLE_OVERLAP = 1.75;

/** Gap between the bands of a segmented muscle, as a fraction of its length. */
const BAND_GAP = 0.055;

/**
 * Every part of the body, both sides.
 *
 * Paired muscles are declared once in the atlas and mirrored here, which is
 * the only way a body does not end up with two left biceps.
 */
export function placeholderBodyParts(): BodyPart[] {
  const parts: BodyPart[] = [];

  for (const spec of MUSCLES) {
    if (spec.midline === true) {
      parts.push({
        nodeName: meshNodeName(spec.slug, 'midline'),
        slug: spec.slug,
        side: 'midline',
        deep: spec.deep ?? false,
        mesh: buildMuscle(spec, false),
      });
      continue;
    }

    // Right is +x, which is the viewer's left when the figure faces them —
    // the same way an anatomical model is described, from the body's own
    // point of view.
    parts.push({
      nodeName: meshNodeName(spec.slug, 'right'),
      slug: spec.slug,
      side: 'right',
      deep: spec.deep ?? false,
      mesh: buildMuscle(spec, false),
    });
    parts.push({
      nodeName: meshNodeName(spec.slug, 'left'),
      slug: spec.slug,
      side: 'left',
      deep: spec.deep ?? false,
      mesh: buildMuscle(spec, true),
    });
  }

  return parts;
}

/** The head, hands, feet and the bulk the muscles are laid over. */
export function bodyForms(): BodyForm[] {
  const forms: BodyForm[] = [];

  for (const spec of FORMS) {
    forms.push({ tone: spec.tone, mesh: buildForm(spec, false) });
    if (spec.midline !== true) forms.push({ tone: spec.tone, mesh: buildForm(spec, true) });
  }

  return forms;
}

/** The slugs this body provides geometry for. */
export function placeholderSlugs(): string[] {
  return MUSCLES.map((spec) => spec.slug);
}

/**
 * One muscle: N fascicles swept and merged.
 *
 * The girth is derived from the spacing between neighbouring fascicles unless
 * the atlas overrides it, so widening a muscle is a matter of moving its
 * origin line rather than of tuning two numbers that have to agree. A little
 * overlap, or the sheet is a comb.
 */
function buildMuscle(spec: MuscleSpec, mirrored: boolean): MeshData {
  const count = Math.max(1, spec.fascicles);
  const girth = spec.girth ?? derivedGirth(spec, count);
  const bands = Math.max(1, spec.bands ?? 1);

  const meshes: MeshData[] = [];
  for (let i = 0; i < count; i++) {
    const u = count === 1 ? 0.5 : i / (count - 1);
    const path = spec.lines.map((line) => {
      const point = lerp(line[0], line[1], u);
      return mirrored ? mirrorX(point) : point;
    });

    // Edge fascicles are thinner, so a sheet has a rounded edge rather than a
    // square one — the tell that a muscle was drawn as a row of tubes.
    const edge = count === 1 ? 1 : 1 - 0.12 * Math.abs(u - 0.5) * 2;
    const profile: TubeProfile = {
      width: girth * edge,
      depth: girth * edge * (spec.flatten ?? 1),
      bellyAt: spec.bellyAt ?? 0.45,
      tendon: spec.tendon ?? DEFAULT_TENDON,
      tendonThickness: spec.tendonThickness ?? TENDON_THICKNESS,
    };

    for (const band of bandRanges(bands)) {
      meshes.push(
        buildTube({
          path: band === null ? path : slicePath(path, band[0], band[1]),
          // A band is a whole small belly, not a slice of a long one: the
          // tendinous intersections between them are the point.
          profile: band === null ? profile : { ...profile, bellyAt: 0.5, tendon: [0.16, 0.16] },
          segments: band === null ? SEGMENTS : Math.max(6, Math.round(SEGMENTS / bands)),
          radial: RADIAL,
        }),
      );
    }
  }

  return mergeMeshes(meshes);
}

function buildForm(spec: FormSpec, mirrored: boolean): MeshData {
  const path = spec.lines.map((line) => (mirrored ? mirrorX(line[0]) : line[0]));

  return buildTube({
    path,
    profile: {
      width: spec.girth,
      depth: spec.girth * (spec.flatten ?? 1),
      bellyAt: 0.5,
      tendon: [0.1, 0.1],
      tendonThickness: 0.5,
      ...(spec.silhouette === undefined ? {} : { silhouette: spec.silhouette }),
    },
    segments: SEGMENTS + 6,
    radial: RADIAL + 4,
  });
}

/**
 * Fascicle half-thickness from how far apart the fascicles sit.
 *
 * Measured on the widest line in the muscle, because that is the end that has
 * to be covered — a fan spaced to suit its narrow insertion leaves gaps at the
 * origin, which is where it is most visible.
 */
function derivedGirth(spec: MuscleSpec, count: number): number {
  if (count < 2) return 0.014;

  let widest = 0;
  for (const line of spec.lines) widest = Math.max(widest, distance(line[0], line[1]));
  if (widest <= 0) return 0.014;

  return (widest / (count - 1) / 2) * FASCICLE_OVERLAP;
}

/** `bands` ranges along the path, with a gap between each. Null for one band. */
function bandRanges(bands: number): (readonly [number, number] | null)[] {
  if (bands <= 1) return [null];

  const span = (1 - BAND_GAP * (bands - 1)) / bands;
  const ranges: [number, number][] = [];
  for (let i = 0; i < bands; i++) {
    const start = i * (span + BAND_GAP);
    ranges.push([start, start + span]);
  }
  return ranges;
}

/**
 * The part of a path between two fractions, as its own path.
 *
 * Sampled rather than sliced: the control points are not evenly spaced along
 * the curve, so taking a fraction of the *list* would cut a band in the wrong
 * place. Five samples is enough for a band a few centimetres long.
 */
function slicePath(path: readonly Vec3[], from: number, to: number): Vec3[] {
  const samples = 5;
  const points: Vec3[] = [];
  for (let i = 0; i < samples; i++) {
    points.push(pointAlong(path, from + ((to - from) * i) / (samples - 1)));
  }
  return points;
}

/** Linear interpolation along the control polygon. Close enough at this scale. */
function pointAlong(path: readonly Vec3[], t: number): Vec3 {
  const first = path[0];
  if (first === undefined) return [0, 0, 0];
  if (path.length === 1) return first;

  const spans = path.length - 1;
  const scaled = Math.min(Math.max(t, 0), 1) * spans;
  const index = Math.min(Math.floor(scaled), spans - 1);
  return lerp(path[index] ?? first, path[index + 1] ?? first, scaled - index);
}
