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
