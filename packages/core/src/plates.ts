/**
 * What to put on the bar.
 *
 * A barbell set is typed as a total — 102.5 kg — and loaded as plates, per
 * side, onto a bar that weighs something itself. Working that out between sets
 * is arithmetic somebody does in their head with their heart rate up, and gets
 * wrong by forgetting the bar.
 *
 * Standard gym kit only: a 20 kg bar with 25 to 1.25 kg plates, or a 45 lb bar
 * with 45 to 2.5 lb plates. EZ and trap bars are left out on purpose — they
 * vary too much from gym to gym to assume, and a loading worked out on the
 * wrong bar weight is worse than none.
 *
 * `plateLook` at the bottom carries what each plate weighs *and looks like* —
 * the colours off g7m's own plate models, and real diameters in millimetres —
 * so the calculator can draw the loading at the sizes a lifter recognises
 * instead of printing a list they have to parse.
 */

export interface PlateKit {
  readonly unit: 'kg' | 'lb';
  readonly bar: number;
  /** Heaviest first, which is the order they go on. */
  readonly plates: readonly number[];
}

export const KG_KIT: PlateKit = { unit: 'kg', bar: 20, plates: [25, 20, 15, 10, 5, 2.5, 1.25] };
export const LB_KIT: PlateKit = { unit: 'lb', bar: 45, plates: [45, 35, 25, 10, 5, 2.5] };

export type Loading =
  /** Lighter than the empty bar. Nothing to load; the bar alone is too much. */
  | { readonly kind: 'below_bar'; readonly bar: number }
  /** Exactly the bar. */
  | { readonly kind: 'bar_only'; readonly bar: number }
  | {
      readonly kind: 'plates';
      readonly bar: number;
      /** One side, heaviest first. The other side is the same. */
      readonly perSide: readonly number[];
      /** What that loading actually weighs, bar included. */
      readonly total: number;
      /**
       * How far under the asked-for weight the loading falls, when the smallest
       * plate cannot make it up exactly. Zero for every weight the steppers
       * reach, since they move in pairs of the smallest plate.
       */
      readonly short: number;
    };

/**
 * The plates for one side of the bar, heaviest first.
 *
 * Greedy — the biggest plate that fits, then the next — because that is how a
 * bar is loaded: big plates on first, small ones outside. With these kits it
 * always reaches any weight the smallest plate divides; anything else it gets
 * as close as it can from below, and says how close.
 *
 * Worked in hundredths, so 2.5 and 1.25 add up without floating-point dust.
 */
export function loadBar(target: number, kit: PlateKit): Loading {
  if (!Number.isFinite(target) || target < kit.bar - 1e-9) {
    return { kind: 'below_bar', bar: kit.bar };
  }

  let remaining = Math.round(((target - kit.bar) / 2) * 100);
  if (remaining <= 0) return { kind: 'bar_only', bar: kit.bar };

  const perSide: number[] = [];
  for (const plate of kit.plates) {
    const size = Math.round(plate * 100);
    while (remaining >= size) {
      perSide.push(plate);
      remaining -= size;
    }
  }

  if (perSide.length === 0) return { kind: 'bar_only', bar: kit.bar };

  const loadedPerSide = perSide.reduce((sum, plate) => sum + Math.round(plate * 100), 0);
  const total = (Math.round(kit.bar * 100) + loadedPerSide * 2) / 100;
  return {
    kind: 'plates',
    bar: kit.bar,
    perSide,
    total,
    short: Math.max(0, Math.round((target - total) * 100) / 100),
  };
}

/**
 * What a plate looks like, and how big it really is.
 *
 * Here rather than in the component because none of it is a styling choice. The
 * colours are sampled straight off g7m's own plate models, and the diameters and
 * thicknesses are millimetres off real cast iron.
 *
 * ## Why the sizes are worth carrying
 *
 * "Each end: 25 · 15 · 1.25" is correct and still needs reading. A picture of
 * three discs at the sizes they actually are is recognised rather than parsed,
 * and it is the same recognition that catches a mistake: four big discs and a
 * little one is a shape you check against the bar in front of you.
 *
 * Cast-iron diameters, not competition bumpers. On calibrated discs the 25, 20,
 * 15 and 10 are all 450 mm and a drawing of them is four identical circles,
 * which is true and useless. Iron plates step down as they get lighter, which
 * is what most gyms have and what the picture needs.
 *
 * ## Three tones, because the plates are drawn faceted
 *
 * A low-poly disc is a ring of flat faces catching different amounts of light,
 * so every plate carries a lit and a shaded tone as well as its face colour.
 * Interpolating them per facet is what makes a flat polygon read as a solid
 * object; one colour and it is a sticker.
 */
export interface PlateLook {
  /** The face, straight on. */
  readonly colour: string;
  /** The facet turned toward the light. */
  readonly lit: string;
  /** The facet turned away, and the edge band. */
  readonly shade: string;
  /** Ink that reads against the face. */
  readonly ink: string;
  /** Real diameter, in millimetres. */
  readonly diameterMm: number;
  /** Real thickness, in millimetres. */
  readonly thicknessMm: number;
}

const LIGHT_INK = '#faf9f5';
const DARK_INK = '#26241f';

/**
 * The scheme on the models: red, blue, yellow, green, then black and two greys
 * for the small change.
 *
 * Not the IWF competition code, which puts a white 5 and a red 2.5 on the bar.
 * That code belongs to calibrated discs almost nobody trains on; a rack of iron
 * runs black and chrome at the light end, and these are the plates the app
 * draws, so this is the scheme it knows.
 */
const KG_LOOKS: Readonly<Record<string, PlateLook>> = {
  '25': {
    colour: '#c8312f',
    lit: '#e23f3d',
    shade: '#ab2826',
    ink: LIGHT_INK,
    diameterMm: 450,
    thicknessMm: 50,
  },
  '20': {
    colour: '#064c99',
    lit: '#0b5bb6',
    shade: '#04396f',
    ink: LIGHT_INK,
    diameterMm: 450,
    thicknessMm: 40,
  },
  '15': {
    colour: '#f6c326',
    lit: '#fbd45a',
    shade: '#c99a1b',
    ink: DARK_INK,
    diameterMm: 400,
    thicknessMm: 33,
  },
  '10': {
    colour: '#18822a',
    lit: '#1fa035',
    shade: '#11601f',
    ink: LIGHT_INK,
    diameterMm: 350,
    thicknessMm: 26,
  },
  '5': {
    colour: '#1e1e1e',
    lit: '#343434',
    shade: '#121212',
    ink: LIGHT_INK,
    diameterMm: 280,
    thicknessMm: 23,
  },
  '2.5': {
    colour: '#55575a',
    lit: '#6d7074',
    shade: '#3e4043',
    ink: LIGHT_INK,
    diameterMm: 230,
    thicknessMm: 18,
  },
  '1.25': {
    colour: '#9a9da2',
    lit: '#b7bac0',
    shade: '#7b7e83',
    ink: DARK_INK,
    diameterMm: 160,
    thicknessMm: 14,
  },
};

/** The pound kit on the same scheme, by rank: a 45 stands in for a 20. */
const LB_LOOKS: Readonly<Record<string, PlateLook>> = {
  '45': {
    colour: '#064c99',
    lit: '#0b5bb6',
    shade: '#04396f',
    ink: LIGHT_INK,
    diameterMm: 450,
    thicknessMm: 45,
  },
  '35': {
    colour: '#f6c326',
    lit: '#fbd45a',
    shade: '#c99a1b',
    ink: DARK_INK,
    diameterMm: 400,
    thicknessMm: 38,
  },
  '25': {
    colour: '#18822a',
    lit: '#1fa035',
    shade: '#11601f',
    ink: LIGHT_INK,
    diameterMm: 350,
    thicknessMm: 32,
  },
  '10': {
    colour: '#1e1e1e',
    lit: '#343434',
    shade: '#121212',
    ink: LIGHT_INK,
    diameterMm: 250,
    thicknessMm: 25,
  },
  '5': {
    colour: '#c8312f',
    lit: '#e23f3d',
    shade: '#ab2826',
    ink: LIGHT_INK,
    diameterMm: 200,
    thicknessMm: 20,
  },
  '2.5': {
    colour: '#9a9da2',
    lit: '#b7bac0',
    shade: '#7b7e83',
    ink: DARK_INK,
    diameterMm: 160,
    thicknessMm: 16,
  },
};

/** The bar, on the same three tones. Sampled off the same model. */
export const BAR_LOOK = { colour: '#7c7c7d', lit: '#9a9a9c', shade: '#5f5f61' } as const;

/** The largest plate in any kit, so a drawing can scale against one figure. */
export const MAX_PLATE_DIAMETER_MM = 450;

/**
 * How a plate of this size is drawn.
 *
 * Every size in both kits has an entry. A size from outside them — which only a
 * future kit could produce — falls back to a plain grey disc scaled between the
 * smallest and largest known, rather than to nothing: a plate that does not
 * render at all reads as a bug in the loading, not as an unknown plate.
 */
export function plateLook(size: number, unit: 'kg' | 'lb'): PlateLook {
  const table = unit === 'lb' ? LB_LOOKS : KG_LOOKS;
  const known = table[String(Math.round(size * 100) / 100)];
  if (known !== undefined) return known;

  const heaviest = unit === 'lb' ? 45 : 25;
  const share = Math.min(1, Math.max(0.2, size / heaviest));
  return {
    colour: '#9a9da2',
    lit: '#b7bac0',
    shade: '#7b7e83',
    ink: DARK_INK,
    diameterMm: Math.round(160 + (MAX_PLATE_DIAMETER_MM - 160) * share),
    thicknessMm: Math.round(14 + 36 * share),
  };
}
