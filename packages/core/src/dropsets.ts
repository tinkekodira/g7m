/**
 * The drop set: finish a heavy set, strip some weight, and keep going with no
 * rest.
 *
 * `set_type = 'dropset'` has been in the schema since the start. What it never
 * had was a parent. Rather than add a column for one, a drop belongs to the
 * nearest top set above it in the exercise's order — which is where the
 * logger puts it, and where anybody reading the list would look for it.
 *
 * Pure, and separate from the screen, for the same reason the warm-up ramp
 * is: "about a fifth lighter, on a weight the gym can actually produce" is the
 * arguable part, and the part a lifter cannot do in their head mid-set.
 */
import { isTopSet, type LoadType, type SetType } from './load.js';
import type { SetTemplate } from './prefill.js';
import { fromDisplayWeight, toDisplayWeight, type UnitSystem } from './units.js';
import { loadingFor, roundToLoadable } from './warmup.js';

/**
 * How much of the weight a drop keeps.
 *
 * Twenty to thirty percent off is the usual advice. A fifth is the gentle end
 * of it, and the field is right there for anybody who strips more.
 */
export const DROP_FRACTION = 0.8;

/**
 * Whether a drop means anything for this load type.
 *
 * External weight comes off the bar; a weighted dip's belt comes off the
 * lifter. A plain bodyweight set has nothing to take away, and "less weight"
 * on an assistance machine is *more* assistance — a different control from
 * this one, which would have to count upwards.
 */
export function canDrop(loadType: LoadType): boolean {
  return loadType === 'external' || loadType === 'bodyweight_plus';
}

export interface DropKit {
  readonly barbell: boolean;
  readonly dumbbell: boolean;
  readonly unitSystem: UnitSystem;
}

/**
 * The drop that follows this set, or null when there is none to offer.
 *
 * About a fifth lighter, on the nearest weight the equipment can be set to,
 * and always strictly lighter than the set it comes off — a "drop" to the same
 * weight is just another set. Null at the empty bar, or for a load type that
 * cannot drop.
 *
 * A weighted dip that runs out of belt becomes a plain one: the last drop off
 * +2.5 kg is your own bodyweight, which is still a set worth doing.
 *
 * The reps are carried over as a starting point. A drop is usually taken to
 * failure, and whatever the count was, it is typed after.
 */
export function dropTemplate(from: SetTemplate, kit: DropKit): SetTemplate | null {
  if (!canDrop(from.loadType)) return null;
  if (!Number.isFinite(from.weightKg) || from.weightKg <= 0) return null;

  const { unitSystem } = kit;
  const equipment = loadingFor({ ...kit, currentKg: from.weightKg });
  const { floor, step } = equipment;
  if (!(step > 0)) return null;

  // In the unit the lifter sees, for the same reason the warm-up ramp is: the
  // plates are whole numbers there, and awkward fractions in storage.
  const current = toDisplayWeight(from.weightKg, unitSystem).value;
  const target = current * DROP_FRACTION;
  const down = roundToLoadable(target, equipment);
  const up = round2(down + step);
  // Nearest rather than down, unlike a warm-up: a drop is aiming at a fifth
  // off, and rounding 12 kg down to the 10 kg dumbbell when the 12.5 sits
  // beside it takes off a third.
  let next = up < current && up - target < target - down ? up : down;
  if (next >= current) next = round2(current - step);

  if (from.loadType === 'bodyweight_plus' && next < step) {
    return { weightKg: 0, reps: from.reps, loadType: 'bodyweight', setType: DROP };
  }
  if (next < floor || next <= 0) return null;

  return {
    weightKg: fromDisplayWeight(next, unitSystem),
    reps: from.reps,
    loadType: from.loadType,
    setType: DROP,
  };
}

const DROP: SetType = 'dropset';

export interface SetChain<T> {
  /** The set the drops came off. */
  readonly top: T;
  /** Its drops, in the order they were done. */
  readonly drops: readonly T[];
}

/**
 * The exercise's sets as top sets with their drops under them.
 *
 * A drop belongs to the nearest top set before it. One with nothing before it
 * — only possible if the set it came off was deleted on another device — is
 * read as a top set of its own rather than dropped from the list: the weight
 * was lifted, and losing a row is worse than mislabelling one.
 *
 * Warm-ups are returned apart, in order. They are not part of any chain.
 */
export function dropChains<T extends { readonly setType: string }>(
  sets: readonly T[],
): { warmups: T[]; chains: { top: T; drops: T[] }[] } {
  const warmups: T[] = [];
  const chains: { top: T; drops: T[] }[] = [];
  for (const set of sets) {
    if (set.setType === 'warmup') {
      warmups.push(set);
      continue;
    }
    const open = chains.at(-1);
    if (set.setType === 'dropset' && open !== undefined) {
      open.drops.push(set);
      continue;
    }
    chains.push({ top: set, drops: [] });
  }
  return { warmups, chains };
}

/** The drops hanging from one set, in order. Empty for a set with none. */
export function dropsOf<T extends { readonly id: string; readonly setType: string }>(
  sets: readonly T[],
  topId: string,
): T[] {
  return dropChains(sets).chains.find((chain) => chain.top.id === topId)?.drops ?? [];
}

/**
 * The set worth asking "how many were left?" about, or null.
 *
 * Only once every set is ticked — asking mid-exercise interrupts the thing it
 * is measuring — and only if nobody has answered already. The last *top* set,
 * because that is the effort the next session's weight is chosen from. A drop
 * is taken to failure by definition, so its answer is always "none" and says
 * nothing about whether the heavy set had more in it.
 */
export function finalTopSet<
  T extends {
    readonly setType: string;
    readonly isCompleted: boolean;
    readonly rpe: number | null;
  },
>(sets: readonly T[]): T | null {
  if (sets.length === 0 || !sets.every((entry) => entry.isCompleted)) return null;
  const last = sets.filter((entry) => isTopSet({ setType: entry.setType as SetType })).at(-1);
  return last?.rpe === null ? last : null;
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
