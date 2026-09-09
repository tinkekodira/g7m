/**
 * Where every muscle starts, where it ends, and what shape it is on the way.
 *
 * ## The idea
 *
 * A muscle is not a lump in a place. It is a bundle of fibres running from an
 * origin on one bone to an insertion on another, and almost everything about
 * how it looks follows from that: the direction it pulls, the way it bulges in
 * the middle and narrows to tendon at the ends, and the fan shape it takes
 * when a wide origin converges on a narrow insertion.
 *
 * So every entry here is a list of **lines**, not points. A fascicle bundle of
 * N fibres takes the same fraction along each line — fibre 0 from the top of
 * the origin to the top of the insertion, fibre N-1 from the bottom to the
 * bottom — and sweeps a tube along the result. A muscle whose origin line is
 * long and whose insertion line is short comes out as a fan, because that is
 * what a fan *is*. The lats and the pec fall out of the same code as the
 * biceps.
 *
 * It is also why the model reads as striated without a texture: the fibres are
 * actually there.
 *
 * ## The coordinate frame
 *
 * A 1.8 m figure standing at the origin, feet on y = 0, facing +z. +x is the
 * figure's own right, which is how an anatomical model is described — from the
 * body's point of view, not the viewer's.
 *
 * Everything paired is written once for the right side and mirrored. Writing
 * both halves by hand is how a body ends up with two left biceps.
 *
 * ## Where this is a model and not a body
 *
 * Landmarks are placed from proportion tables and reference imagery, not from
 * a scan, so this is anatomically *shaped* rather than anatomically correct.
 * Two deliberate departures beyond that:
 *
 * Deep muscles are floated to the surface far enough to leave a sliver
 * showing. The rhomboids are genuinely under the trapezius and the brachialis
 * genuinely under the biceps, and rendered honestly neither could ever be
 * tapped. An anatomy app nobody can select half of is worse than one that
 * cheats by four millimetres.
 *
 * The figure is symmetrical and relaxed. No handedness, no breathing, no
 * weight shift.
 */
import type { Vec3 } from './geometry/vec3.js';

/** Origin-to-insertion is a line; a fascicle takes one fraction along it. */
export type Line = readonly [Vec3, Vec3];

export interface MuscleSpec {
  readonly slug: string;
  /** Rendered once at the midline instead of mirrored. */
  readonly midline?: boolean;
  /** Origin, then any via points, then insertion. Each a line across the belly. */
  readonly lines: readonly Line[];
  /** Fibres in the bundle. More for a sheet, fewer for a spindle. */
  readonly fascicles: number;
  /** Half-thickness of one fascicle at the belly. Derived from spacing if absent. */
  readonly girth?: number;
  /** Depth as a fraction of girth. Below 1 for a muscle pressed flat to a bone. */
  readonly flatten?: number;
  /** Where the belly is thickest, 0 at the origin. Default 0.45. */
  readonly bellyAt?: number;
  /** Fraction that is tendon at each end. Default a short one at each. */
  readonly tendon?: readonly [number, number];
  /**
   * How thin the tendon gets, relative to the belly.
   *
   * Per muscle, because the range is enormous and a single value is wrong at
   * both ends of it. A gastrocnemius runs into an Achilles a third its width;
   * a pectoralis barely narrows at all, and giving it a waist opens gaps
   * between its fascicles exactly where the sheet should be continuous — which
   * renders a chest as a ribcage. Default is the sheet case.
   */
  readonly tendonThickness?: number;
  /**
   * Split into stacked bellies with gaps between.
   *
   * One muscle, for the rectus abdominis, whose tendinous intersections are
   * the reason a six-pack has six of anything.
   */
  readonly bands?: number;
  /**
   * Covered by another muscle across essentially its whole area.
   *
   * The procedural body floats these outward far enough to leave a sliver
   * showing between the fascicles of whatever covers them, because a bundle of
   * separate tubes has gaps for a sliver to show through and a muscle nobody
   * can tap is worse than one that cheats by four millimetres.
   *
   * A sculpted skin has no gaps. Labelling it from a floated deep muscle does
   * not carve a sliver, it takes a patch out of the middle of the trapezius —
   * which is what ADR-0044 found on the back. So the flag: the skin is divided
   * among the muscles that reach it, and these are reached by peeling it away.
   *
   * Judged by whether a lean, muscular body shows the muscle at all. The
   * infraspinatus stays superficial because it genuinely does; the rhomboids
   * under it do not.
   */
  readonly deep?: boolean;
}

/** A point, as a degenerate line. Most insertions are one. */
function at(v: Vec3): Line {
  return [v, v];
}

/**
 * The muscles, roughly head to foot.
 *
 * The taxonomy in Postgres decides which of these can be tapped; this only
 * decides where they are. A slug here that the taxonomy does not know is
 * caught by `checkModelContract`, not by looking.
 */
export const MUSCLES: readonly MuscleSpec[] = [
  // ── Neck ──────────────────────────────────────────────────────────────
  {
    slug: 'sternocleidomastoid',
    // The strap that shows when somebody turns their head. Sternum and medial
    // clavicle up to behind the ear, and it is the reason a neck has a line.
    lines: [
      [
        [0.012, 1.487, 0.062],
        [0.045, 1.487, 0.05],
      ],
      at([0.045, 1.55, 0.038]),
      at([0.058, 1.6, -0.012]),
    ],
    fascicles: 3,
    girth: 0.015,
    tendon: [0.12, 0.14],
    tendonThickness: 0.5,
  },

  // ── Chest ─────────────────────────────────────────────────────────────
  {
    slug: 'pec-major-clavicular',
    // Medial half of the clavicle, converging on the humerus. Runs upward to
    // its insertion, which is why the upper chest is built by pressing on an
    // incline and not by pressing flat.
    lines: [
      [
        [0.016, 1.482, 0.068],
        [0.098, 1.489, 0.049],
      ],
      [
        [0.07, 1.452, 0.107],
        [0.125, 1.455, 0.085],
      ],
      at([0.163, 1.418, 0.027]),
    ],
    fascicles: 6,
    girth: 0.027,
    flatten: 0.9,
    bellyAt: 0.5,
    tendon: [0.1, 0.24],
  },
  {
    slug: 'pec-major-sternal',
    // The fan. A long origin down the sternum and the costal cartilages, all
    // of it converging on one flat tendon at the humerus — so the lower fibres
    // run up and the upper ones run across.
    lines: [
      [
        [0.014, 1.428, 0.083],
        [0.03, 1.246, 0.085],
      ],
      [
        [0.085, 1.4, 0.115],
        [0.108, 1.288, 0.1],
      ],
      [
        [0.15, 1.408, 0.056],
        [0.152, 1.375, 0.048],
      ],
      at([0.165, 1.412, 0.02]),
    ],
    fascicles: 9,
    girth: 0.03,
    flatten: 0.9,
    bellyAt: 0.45,
    tendon: [0.08, 0.26],
  },
  {
    slug: 'serratus-anterior',
    // The finger-like slips over the ribs, under the arm. Kept thin and
    // separated on purpose: they read as fingers or they read as nothing.
    lines: [
      [
        [0.118, 1.335, 0.069],
        [0.142, 1.196, 0.042],
      ],
      [
        [0.142, 1.325, 0.019],
        [0.153, 1.21, 0.004],
      ],
      at([0.088, 1.335, -0.048]),
    ],
    fascicles: 6,
    girth: 0.013,
    flatten: 0.85,
    tendon: [0.06, 0.3],
    tendonThickness: 0.5,
  },

  // ── Shoulder ──────────────────────────────────────────────────────────
  {
    slug: 'anterior-deltoid',
    lines: [
      [
        [0.113, 1.484, 0.052],
        [0.171, 1.484, 0.026],
      ],
      [
        [0.155, 1.408, 0.082],
        [0.196, 1.404, 0.056],
      ],
      at([0.184, 1.302, 0.028]),
    ],
    fascicles: 6,
    girth: 0.027,
    flatten: 0.92,
    bellyAt: 0.42,
    tendon: [0.08, 0.28],
  },
  {
    slug: 'lateral-deltoid',
    // The cap. Multipennate in life, which is why it is thick for its length
    // and why the shoulder is round rather than sloped.
    lines: [
      [
        [0.163, 1.497, 0.014],
        [0.196, 1.492, -0.022],
      ],
      [
        [0.208, 1.41, 0.026],
        [0.221, 1.405, -0.03],
      ],
      at([0.192, 1.298, 0.002]),
    ],
    fascicles: 6,
    girth: 0.029,
    flatten: 0.95,
    bellyAt: 0.4,
    tendon: [0.06, 0.3],
  },
  {
    slug: 'posterior-deltoid',
    lines: [
      [
        [0.096, 1.468, -0.092],
        [0.172, 1.482, -0.048],
      ],
      [
        [0.16, 1.404, -0.098],
        [0.199, 1.404, -0.062],
      ],
      at([0.186, 1.322, -0.028]),
    ],
    fascicles: 6,
    girth: 0.027,
    flatten: 0.92,
    bellyAt: 0.42,
    tendon: [0.08, 0.36],
  },

  // ── Upper arm ─────────────────────────────────────────────────────────
  {
    slug: 'biceps-brachii',
    // Two heads that share a belly and a tendon. The long tendon at the elbow
    // is why a flexed biceps is a ball and not a cylinder.
    lines: [
      [
        [0.148, 1.442, 0.032],
        [0.176, 1.438, 0.014],
      ],
      [
        [0.175, 1.29, 0.055],
        [0.199, 1.288, 0.041],
      ],
      at([0.196, 1.114, 0.03]),
    ],
    fascicles: 5,
    girth: 0.023,
    flatten: 0.85,
    bellyAt: 0.42,
    tendon: [0.1, 0.2],
    tendonThickness: 0.44,
  },
  {
    slug: 'brachialis',
    // Under the biceps. The lateral sliver is real and is small.
    deep: true,
    // Under the biceps in life. Floated just proud of it here so the sliver
    // either side of the biceps can be tapped.
    lines: [
      [
        [0.172, 1.318, 0.031],
        [0.197, 1.315, 0.021],
      ],
      at([0.198, 1.126, 0.032]),
    ],
    fascicles: 3,
    girth: 0.017,
    flatten: 0.75,
    bellyAt: 0.5,
    tendon: [0.08, 0.2],
    tendonThickness: 0.55,
  },
  {
    slug: 'triceps-long-head',
    // The only head crossing the shoulder, which is why an overhead position
    // stretches it and a pushdown does not.
    lines: [
      [
        [0.146, 1.42, -0.045],
        [0.168, 1.418, -0.032],
      ],
      [
        [0.163, 1.29, -0.068],
        [0.187, 1.288, -0.056],
      ],
      at([0.202, 1.152, -0.032]),
    ],
    fascicles: 5,
    girth: 0.022,
    flatten: 0.85,
    bellyAt: 0.4,
    tendon: [0.08, 0.32],
    tendonThickness: 0.46,
  },
  {
    slug: 'triceps-lateral-head',
    // The horseshoe's outer arm — the one visible from the side.
    lines: [
      [
        [0.187, 1.386, -0.024],
        [0.202, 1.378, -0.045],
      ],
      [
        [0.206, 1.27, -0.03],
        [0.216, 1.264, -0.052],
      ],
      at([0.205, 1.158, -0.03]),
    ],
    fascicles: 5,
    girth: 0.019,
    flatten: 0.8,
    bellyAt: 0.38,
    tendon: [0.06, 0.34],
    tendonThickness: 0.46,
  },
  {
    slug: 'triceps-medial-head',
    // Under the long and lateral heads.
    deep: true,
    lines: [
      [
        [0.16, 1.28, -0.041],
        [0.174, 1.276, -0.052],
      ],
      at([0.198, 1.16, -0.034]),
    ],
    fascicles: 3,
    girth: 0.017,
    flatten: 0.8,
    bellyAt: 0.45,
    tendon: [0.06, 0.3],
    tendonThickness: 0.5,
  },

  // ── Forearm ───────────────────────────────────────────────────────────
  {
    slug: 'brachioradialis',
    // Crosses from the humerus to the wrist, so it is the ridge that appears
    // on the thumb side when somebody carries something heavy.
    lines: [
      [
        [0.201, 1.184, 0.014],
        [0.216, 1.18, -0.004],
      ],
      [
        [0.222, 1.06, 0.048],
        [0.234, 1.056, 0.024],
      ],
      at([0.232, 0.912, 0.018]),
    ],
    fascicles: 5,
    girth: 0.017,
    flatten: 0.8,
    bellyAt: 0.32,
    tendon: [0.1, 0.42],
    tendonThickness: 0.46,
  },
  {
    slug: 'wrist-flexors',
    // A group, drawn as one. Medial epicondyle to the palm, the mass that
    // makes a forearm thick when a grip is what is being trained.
    lines: [
      [
        [0.181, 1.148, 0.018],
        [0.192, 1.145, -0.008],
      ],
      [
        [0.203, 1.02, 0.056],
        [0.219, 1.014, 0.024],
      ],
      at([0.221, 0.9, 0.03]),
    ],
    fascicles: 6,
    girth: 0.016,
    flatten: 0.7,
    bellyAt: 0.28,
    tendon: [0.05, 0.44],
    tendonThickness: 0.46,
  },
  {
    slug: 'wrist-extensors',
    lines: [
      [
        [0.218, 1.152, -0.012],
        [0.226, 1.148, -0.032],
      ],
      [
        [0.237, 1.03, -0.014],
        [0.247, 1.026, -0.042],
      ],
      at([0.235, 0.902, -0.014]),
    ],
    fascicles: 6,
    girth: 0.015,
    flatten: 0.7,
    bellyAt: 0.28,
    tendon: [0.05, 0.44],
    tendonThickness: 0.46,
  },

  // ── Trunk, front ──────────────────────────────────────────────────────
  {
    slug: 'rectus-abdominis',
    // Paired columns, not one sheet — the linea alba runs between them. The
    // bands are the tendinous intersections, which is the entire reason a
    // six-pack has separate blocks rather than being one long muscle.
    lines: [
      [
        [0.034, 1.004, 0.082],
        [0.072, 1.004, 0.074],
      ],
      [
        [0.036, 1.14, 0.112],
        [0.078, 1.14, 0.102],
      ],
      [
        [0.038, 1.298, 0.104],
        [0.08, 1.298, 0.092],
      ],
    ],
    fascicles: 3,
    girth: 0.028,
    flatten: 0.7,
    bands: 4,
    tendon: [0.04, 0.04],
  },
  {
    slug: 'external-obliques',
    // Fibres running down and forward, like hands in front pockets. The
    // direction is the whole reason a twist trains them.
    lines: [
      [
        [0.079, 1.312, 0.062],
        [0.142, 1.196, -0.01],
      ],
      [
        [0.083, 1.18, 0.092],
        [0.146, 1.13, 0.006],
      ],
      [
        [0.048, 1.068, 0.1],
        [0.134, 1.076, 0.018],
      ],
    ],
    fascicles: 6,
    girth: 0.023,
    flatten: 0.85,
    bellyAt: 0.5,
    tendon: [0.08, 0.12],
  },

  // ── Trunk, back ───────────────────────────────────────────────────────
  {
    slug: 'upper-trapezius',
    // Runs *down* from the skull to the clavicle, so it lifts the shoulder
    // girdle rather than the arm. The slope of a neck.
    lines: [
      [
        [0.008, 1.612, -0.058],
        [0.014, 1.498, -0.082],
      ],
      [
        [0.05, 1.562, -0.07],
        [0.078, 1.5, -0.082],
      ],
      [
        [0.098, 1.492, -0.04],
        [0.168, 1.486, -0.034],
      ],
    ],
    fascicles: 6,
    girth: 0.03,
    flatten: 0.85,
    bellyAt: 0.5,
    tendon: [0.1, 0.12],
  },
  {
    slug: 'middle-trapezius',
    lines: [
      [
        [0.011, 1.462, -0.08],
        [0.011, 1.372, -0.084],
      ],
      [
        [0.05, 1.462, -0.092],
        [0.05, 1.386, -0.094],
      ],
      [
        [0.092, 1.458, -0.09],
        [0.148, 1.474, -0.056],
      ],
    ],
    fascicles: 5,
    girth: 0.029,
    flatten: 0.85,
    tendon: [0.1, 0.1],
  },
  {
    slug: 'lower-trapezius',
    // Converges upward on the scapular spine, which is why it pulls the
    // shoulder blade down and back rather than up.
    lines: [
      [
        [0.011, 1.356, -0.086],
        [0.011, 1.234, -0.084],
      ],
      [
        [0.05, 1.386, -0.092],
        [0.055, 1.29, -0.086],
      ],
      at([0.086, 1.436, -0.09]),
    ],
    fascicles: 5,
    girth: 0.028,
    flatten: 0.85,
    tendon: [0.1, 0.16],
  },
  {
    slug: 'rhomboids',
    // Under the trapezius, all of it.
    deep: true,
    // Under the trapezius in life. Floated out at the medial border, where
    // the trapezius is thinnest, so there is something to tap.
    lines: [
      [
        [0.014, 1.478, -0.09],
        [0.014, 1.394, -0.093],
      ],
      at([0.072, 1.418, -0.102]),
    ],
    fascicles: 4,
    girth: 0.02,
    flatten: 0.8,
    tendon: [0.08, 0.12],
  },
  {
    slug: 'latissimus-dorsi',
    // The widest fan in the body: a long origin down the spine and iliac
    // crest, all of it wrapping round the ribs and converging on a small
    // tendon in the armpit. That convergence is what makes a back look wide,
    // and it is why the muscle is trained by pulling the elbow to the hip.
    lines: [
      [
        [0.016, 1.24, -0.089],
        [0.07, 1.048, -0.076],
      ],
      [
        [0.09, 1.262, -0.096],
        [0.126, 1.11, -0.072],
      ],
      [
        [0.132, 1.35, -0.076],
        [0.152, 1.242, -0.052],
      ],
      at([0.161, 1.412, -0.032]),
    ],
    fascicles: 8,
    girth: 0.031,
    flatten: 0.85,
    bellyAt: 0.45,
    tendon: [0.06, 0.3],
    tendonThickness: 0.52,
  },
  {
    slug: 'teres-major',
    // Under the posterior deltoid and the lat.
    deep: true,
    lines: [
      [
        [0.096, 1.322, -0.092],
        [0.116, 1.348, -0.088],
      ],
      at([0.163, 1.406, -0.046]),
    ],
    fascicles: 3,
    girth: 0.022,
    flatten: 0.85,
    tendon: [0.08, 0.2],
    tendonThickness: 0.55,
  },
  {
    slug: 'infraspinatus',
    // Across the infraspinous fossa to the greater tubercle. Genuinely
    // superficial — only fascia covers it — but it sat 6 cm inside the
    // sculpt's back, at the very edge of the claim radius, and the middle
    // trapezius and posterior deltoid either side of it took all but six
    // vertices. Laid out on the fossa where it belongs.
    lines: [
      [
        [0.068, 1.348, -0.118],
        [0.108, 1.428, -0.114],
      ],
      [
        [0.118, 1.364, -0.11],
        [0.139, 1.42, -0.1],
      ],
      at([0.163, 1.45, -0.06]),
    ],
    fascicles: 5,
    girth: 0.024,
    flatten: 0.85,
    tendon: [0.08, 0.2],
  },
  {
    slug: 'erector-spinae',
    // Paired columns either side of the spine, not one midline slab — the
    // groove between them is the shape of a back.
    //
    // Widest at the waist and narrowing upward, which is both what the muscle
    // does and what decides who owns the lower back. It was an 18 mm strip
    // here, against a gluteus maximus 34 mm thick reaching up to y = 1.086 —
    // so on a sculpted skin the glutes took the whole lumbar region, ten
    // centimetres above the pelvis. A real lumbar erector is 5 to 6 cm across
    // and is the muscle somebody actually sees on a lower back.
    lines: [
      [
        [0.02, 0.998, -0.086],
        [0.072, 0.998, -0.078],
      ],
      [
        [0.022, 1.2, -0.096],
        [0.064, 1.2, -0.088],
      ],
      [
        [0.024, 1.42, -0.082],
        [0.052, 1.42, -0.076],
      ],
    ],
    fascicles: 5,
    girth: 0.029,
    flatten: 0.85,
    bellyAt: 0.42,
    tendon: [0.06, 0.14],
  },

  // ── Hip ───────────────────────────────────────────────────────────────
  {
    slug: 'gluteus-maximus',
    lines: [
      [
        [0.026, 1.056, -0.082],
        [0.116, 1.086, -0.05],
      ],
      [
        [0.062, 0.976, -0.108],
        [0.138, 0.99, -0.078],
      ],
      [
        [0.086, 0.892, -0.062],
        [0.148, 0.906, -0.038],
      ],
    ],
    fascicles: 8,
    girth: 0.034,
    flatten: 0.92,
    bellyAt: 0.5,
    tendon: [0.06, 0.16],
  },
  {
    slug: 'gluteus-medius',
    // Above and lateral to the maximus. What actually stops a hip dropping
    // when somebody stands on one leg.
    lines: [
      [
        [0.104, 1.086, -0.014],
        [0.142, 1.062, -0.056],
      ],
      at([0.154, 0.958, -0.018]),
    ],
    fascicles: 5,
    girth: 0.023,
    flatten: 0.88,
    tendon: [0.08, 0.18],
  },

  // ── Thigh, front ──────────────────────────────────────────────────────
  {
    slug: 'rectus-femoris',
    // The only quadriceps head crossing the hip, so it is the one a leg
    // extension trains differently from a squat.
    lines: [
      [
        [0.082, 1.022, 0.058],
        [0.104, 1.018, 0.05],
      ],
      [
        [0.09, 0.762, 0.096],
        [0.118, 0.758, 0.088],
      ],
      at([0.101, 0.545, 0.062]),
    ],
    fascicles: 5,
    girth: 0.028,
    flatten: 0.8,
    bellyAt: 0.42,
    tendon: [0.08, 0.26],
    tendonThickness: 0.5,
  },
  {
    slug: 'vastus-lateralis',
    // The sweep. Biggest of the four, and the reason a thigh is wider at the
    // top from the front than from the side.
    lines: [
      [
        [0.128, 0.918, -0.008],
        [0.148, 0.914, -0.03],
      ],
      [
        [0.152, 0.73, 0.028],
        [0.166, 0.726, -0.012],
      ],
      at([0.116, 0.556, 0.046]),
    ],
    fascicles: 7,
    girth: 0.027,
    flatten: 0.85,
    bellyAt: 0.45,
    tendon: [0.06, 0.28],
    tendonThickness: 0.55,
  },
  {
    slug: 'vastus-medialis',
    // The teardrop above the knee. Low and short, which is why it appears
    // only when a squat is taken deep.
    lines: [
      [
        [0.066, 0.826, 0.012],
        [0.078, 0.822, 0.038],
      ],
      [
        [0.056, 0.652, 0.05],
        [0.07, 0.648, 0.07],
      ],
      at([0.086, 0.556, 0.06]),
    ],
    fascicles: 5,
    girth: 0.024,
    flatten: 0.85,
    bellyAt: 0.55,
    tendon: [0.1, 0.18],
    tendonThickness: 0.55,
  },
  {
    slug: 'hip-adductors',
    // A group, drawn as one sheet from the pubis down the inner thigh.
    lines: [
      [
        [0.022, 0.968, 0.032],
        [0.038, 0.962, -0.012],
      ],
      [
        [0.044, 0.8, 0.03],
        [0.062, 0.796, -0.02],
      ],
      [
        [0.074, 0.63, 0.006],
        [0.086, 0.626, -0.026],
      ],
    ],
    fascicles: 6,
    girth: 0.027,
    flatten: 0.88,
    bellyAt: 0.42,
    tendon: [0.08, 0.2],
  },

  // ── Thigh, back ───────────────────────────────────────────────────────
  {
    slug: 'biceps-femoris',
    // Lateral hamstring, to the head of the fibula — the tendon you can feel
    // on the outside of the back of a bent knee.
    lines: [
      [
        [0.056, 0.944, -0.062],
        [0.074, 0.94, -0.05],
      ],
      [
        [0.108, 0.73, -0.082],
        [0.128, 0.726, -0.066],
      ],
      at([0.136, 0.512, -0.026]),
    ],
    fascicles: 5,
    girth: 0.026,
    flatten: 0.85,
    bellyAt: 0.45,
    tendon: [0.1, 0.26],
    tendonThickness: 0.5,
  },
  {
    slug: 'semitendinosus',
    // Medial, and mostly tendon below the belly — hence the name and hence
    // the long thin cord on the inside of the knee.
    lines: [
      [
        [0.038, 0.944, -0.068],
        [0.052, 0.94, -0.058],
      ],
      [
        [0.064, 0.732, -0.086],
        [0.08, 0.728, -0.074],
      ],
      at([0.074, 0.496, -0.026]),
    ],
    fascicles: 3,
    girth: 0.021,
    flatten: 0.85,
    bellyAt: 0.38,
    tendon: [0.08, 0.36],
    tendonThickness: 0.38,
  },
  {
    slug: 'semimembranosus',
    // Under the semitendinosus and the biceps femoris.
    deep: true,
    // Under the semitendinosus, wider and flatter, showing either side of it.
    lines: [
      [
        [0.044, 0.938, -0.05],
        [0.06, 0.934, -0.042],
      ],
      [
        [0.076, 0.72, -0.072],
        [0.096, 0.716, -0.06],
      ],
      at([0.086, 0.506, -0.034]),
    ],
    fascicles: 3,
    girth: 0.021,
    flatten: 0.7,
    bellyAt: 0.48,
    tendon: [0.08, 0.22],
    tendonThickness: 0.5,
  },

  // ── Lower leg ─────────────────────────────────────────────────────────
  {
    slug: 'gastrocnemius',
    // Two heads from above the knee, joining a long Achilles tendon. The
    // tendon is nearly half the muscle's length, which is why a calf is a
    // diamond high on the leg and not a taper down to the ankle.
    lines: [
      [
        [0.072, 0.508, -0.038],
        [0.126, 0.508, -0.034],
      ],
      [
        [0.078, 0.372, -0.076],
        [0.126, 0.372, -0.07],
      ],
      [
        [0.094, 0.2, -0.05],
        [0.106, 0.2, -0.048],
      ],
      at([0.099, 0.115, -0.042]),
    ],
    fascicles: 7,
    girth: 0.025,
    flatten: 0.85,
    bellyAt: 0.32,
    tendon: [0.06, 0.5],
    tendonThickness: 0.3,
  },
  {
    slug: 'soleus',
    // Under the gastrocnemius and wider, so it shows either side of it. Does
    // not cross the knee, which is why a seated calf raise finds it.
    lines: [
      [
        [0.076, 0.448, -0.03],
        [0.13, 0.446, -0.026],
      ],
      [
        [0.076, 0.3, -0.056],
        [0.132, 0.298, -0.05],
      ],
      at([0.101, 0.152, -0.042]),
    ],
    fascicles: 5,
    girth: 0.022,
    flatten: 0.7,
    bellyAt: 0.4,
    tendon: [0.06, 0.3],
    tendonThickness: 0.5,
  },
  {
    slug: 'tibialis-anterior',
    // The shin. Lateral to the tibia, so the bony ridge stays bare.
    lines: [
      [
        [0.104, 0.472, 0.038],
        [0.136, 0.462, 0.008],
      ],
      [
        [0.1, 0.3, 0.014],
        [0.142, 0.292, -0.012],
      ],
      [
        [0.088, 0.155, 0.006],
        [0.11, 0.152, -0.014],
      ],
    ],
    fascicles: 4,
    girth: 0.022,
    flatten: 0.8,
    bellyAt: 0.4,
    tendon: [0.06, 0.16],
    tendonThickness: 0.44,
  },
];

/**
 * The parts that are not muscle.
 *
 * Two jobs. The bone-coloured pieces — skull, hands, feet — are what let
 * somebody tell at a glance which way the figure is facing, and they are the
 * white in every anatomical plate for the same reason. The dark cores fill the
 * space *under* the muscles, so the gaps between fascicles show body rather
 * than background: without them a torso is a set of straps with a hole behind.
 */
export interface FormSpec {
  readonly lines: readonly Line[];
  readonly girth: number;
  readonly flatten?: number;
  /** Radius multipliers along the path, for a silhouette a taper cannot give. */
  readonly silhouette?: readonly number[];
  readonly tone: 'bone' | 'core';
  readonly midline?: boolean;
  /**
   * The region name, when the skin over this form belongs to no muscle.
   *
   * A head is not a muscle, and neither is a hand, a foot, or the groin. The
   * label transfer divides a closed skin among whatever claims it, and with
   * nothing here to claim these, the flood handed each to the nearest muscle
   * that could reach it: the trapezius took the back of the skull, the wrist
   * extensors took the hand and every finger, and the soleus took both feet —
   * 5618 vertices, the largest label on the body, on a muscle that stops at
   * the ankle.
   *
   * Naming a region here enters the form in the cloud as a claimant of its
   * own. The skin it wins is exported as `skin_<region>`, which renders as
   * part of the body and does not answer a tap.
   *
   * The bone landmarks that sit *inside* muscle territory — clavicle,
   * sternum, patella, olecranon — deliberately have no name. They are bare in
   * life, but a dead strip down the middle of a chest is worse anatomy
   * teaching than a chest that runs over its own sternum.
   */
  readonly bare?: string;
}

export const FORMS: readonly FormSpec[] = [
  // Skull and jaw. An egg, narrower at the chin.
  {
    lines: [
      at([0, 1.552, 0.03]),
      at([0, 1.6, 0.026]),
      at([0, 1.665, 0.012]),
      at([0, 1.73, 0.0]),
      at([0, 1.785, -0.012]),
    ],
    girth: 0.086,
    flatten: 1.1,
    silhouette: [0.52, 0.78, 0.94, 1, 1, 0.98, 0.9, 0.74],
    tone: 'bone',
    midline: true,
    bare: 'head',
  },
  // Neck, behind the sternocleidomastoids.
  {
    lines: [at([0, 1.4, -0.014]), at([0, 1.49, 0.006]), at([0, 1.578, 0.018])],
    girth: 0.075,
    flatten: 0.94,
    silhouette: [0.94, 1, 0.96, 0.88],
    tone: 'core',
    midline: true,
  },
  // Torso. Wide at the chest, in at the waist, out again at the hips — the
  // one shape in the body that no origin-to-insertion sweep describes.
  {
    lines: [
      at([0, 0.92, -0.01]),
      at([0, 1.08, 0.004]),
      at([0, 1.22, 0.008]),
      at([0, 1.36, 0.006]),
      at([0, 1.5, -0.01]),
    ],
    girth: 0.122,
    flatten: 0.62,
    silhouette: [0.86, 0.95, 0.84, 0.97, 1, 0.9, 0.72],
    tone: 'core',
    midline: true,
  },
  // Pelvis, wider than the waist above it.
  {
    lines: [at([0, 0.87, -0.016]), at([0, 0.95, 0.004]), at([0, 1.055, 0.006])],
    girth: 0.118,
    flatten: 0.78,
    silhouette: [0.72, 0.96, 1, 0.9],
    tone: 'core',
    midline: true,
  },
  // Upper arm.
  {
    lines: [at([0.172, 1.44, 0.002]), at([0.19, 1.3, 0.004]), at([0.203, 1.155, 0.004])],
    girth: 0.029,
    silhouette: [0.9, 1, 0.92, 0.74],
    tone: 'core',
  },
  // Forearm, tapering hard into the wrist.
  {
    lines: [at([0.204, 1.15, 0.006]), at([0.222, 1.02, 0.012]), at([0.232, 0.9, 0.016])],
    girth: 0.029,
    silhouette: [0.78, 0.98, 0.8, 0.56],
    tone: 'core',
  },
  // Hand. Flat, and bone-coloured like the plates. Long enough to reach the
  // fingertips: a hand that stops at the knuckles leaves the fingers for the
  // nearest muscle, and the nearest muscle is in the forearm.
  {
    lines: [
      at([0.232, 0.906, 0.016]),
      at([0.238, 0.84, 0.02]),
      at([0.241, 0.79, 0.018]),
      at([0.242, 0.744, 0.014]),
    ],
    girth: 0.044,
    flatten: 0.44,
    silhouette: [0.58, 1, 1, 0.92, 0.46],
    tone: 'bone',
    bare: 'hand',
  },
  // Thigh.
  {
    lines: [at([0.104, 1.01, 0.0]), at([0.11, 0.74, 0.004]), at([0.102, 0.53, 0.006])],
    girth: 0.052,
    flatten: 0.95,
    silhouette: [0.88, 1, 0.9, 0.62],
    tone: 'core',
  },
  // Shank.
  {
    lines: [at([0.101, 0.52, 0.002]), at([0.1, 0.3, -0.006]), at([0.096, 0.105, -0.008])],
    girth: 0.035,
    flatten: 0.95,
    silhouette: [0.86, 1, 0.72, 0.44],
    tone: 'core',
  },
  // The inguinal region: pubis and the aponeurosis over it. Pale in every
  // anatomical plate, and the one part of the front of a body with no
  // superficial muscle over it — so without something here it reads as a hole
  // between the abdomen and the thighs rather than as anatomy.
  {
    lines: [at([0, 1.02, 0.058]), at([0, 0.975, 0.064]), at([0, 0.93, 0.05])],
    girth: 0.058,
    flatten: 0.55,
    silhouette: [0.35, 0.95, 1, 0.62],
    tone: 'bone',
    midline: true,
    bare: 'groin',
  },
  // Clavicle. The bar across the top of the chest, and the landmark that
  // makes a shoulder read as a shoulder rather than as a lump on a torso.
  {
    lines: [at([0.006, 1.486, 0.062]), at([0.09, 1.492, 0.042]), at([0.166, 1.487, 0.006])],
    girth: 0.016,
    flatten: 0.72,
    silhouette: [0.5, 0.95, 1, 0.8],
    tone: 'bone',
  },
  // Sternum, between the two pectorals.
  {
    lines: [at([0, 1.472, 0.084]), at([0, 1.38, 0.098]), at([0, 1.29, 0.1])],
    girth: 0.021,
    flatten: 0.42,
    silhouette: [0.7, 1, 0.9, 0.55],
    tone: 'bone',
    midline: true,
  },
  // Patella. A knee is white in every plate, and here it also fills the gap
  // between the quadriceps above and the calf below.
  {
    lines: [at([0.101, 0.556, 0.05]), at([0.101, 0.518, 0.062]), at([0.101, 0.482, 0.052])],
    girth: 0.034,
    flatten: 0.62,
    silhouette: [0.6, 1, 0.95, 0.55],
    tone: 'bone',
  },
  // Olecranon, the point of the elbow.
  {
    lines: [at([0.204, 1.178, -0.012]), at([0.207, 1.152, -0.026]), at([0.208, 1.126, -0.014])],
    girth: 0.028,
    flatten: 0.75,
    silhouette: [0.6, 1, 0.92, 0.55],
    tone: 'bone',
  },
  // Foot, pointing forward.
  {
    lines: [at([0.096, 0.062, -0.058]), at([0.099, 0.036, 0.02]), at([0.102, 0.028, 0.115])],
    girth: 0.042,
    flatten: 0.62,
    silhouette: [0.7, 1, 0.86, 0.42],
    tone: 'bone',
    bare: 'foot',
  },
];
