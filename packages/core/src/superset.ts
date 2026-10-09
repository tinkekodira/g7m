/**
 * Supersets: two or more exercises done back to back, one set of each, with
 * the rest coming after the round rather than after every set.
 *
 * Stored as nothing more than a shared `superset_id` on the exercises in it.
 * Everything else — which exercises are grouped, what a round is, where the
 * lifter goes after a tick and when the rest timer runs — is worked out here,
 * from that id and the exercises' order.
 *
 * The rules are lenient on purpose. Two phones reordering the same routine
 * offline can leave a group split by something else, or a group of one. Both
 * read as ordinary exercises: nothing fails, nothing is lost, and the worst
 * outcome is a superset that has to be made again.
 */
import { isTopSet, type SetType } from './load.js';
import { initialOrderKeys, orderKeysBetween, sortByOrder } from './order-key.js';

/** One thing in a workout's list: an exercise on its own, or a superset. */
export type WorkoutUnit<T> =
  | { readonly kind: 'single'; readonly item: T }
  | { readonly kind: 'superset'; readonly supersetId: string; readonly members: readonly T[] };

/**
 * A workout's exercises, in order, grouped into supersets.
 *
 * Only a run of two or more *next to each other* with the same id is a group.
 * The id alone is not enough — the logger and the builder both keep a group's
 * members together, and something that has come apart is shown as what it now
 * is rather than glued back together from across the list.
 */
export function workoutUnits<T>(
  items: readonly T[],
  supersetOf: (item: T) => string | null,
): WorkoutUnit<T>[] {
  const units: WorkoutUnit<T>[] = [];
  let index = 0;
  while (index < items.length) {
    const first = items[index] as T;
    const id = supersetOf(first);
    let end = index + 1;
    if (id !== null) {
      while (end < items.length && supersetOf(items[end] as T) === id) end += 1;
    }
    if (id !== null && end - index >= 2) {
      units.push({ kind: 'superset', supersetId: id, members: items.slice(index, end) });
    } else {
      units.push({ kind: 'single', item: first });
    }
    index = end;
  }
  return units;
}

/** A set as the rounds see it. */
export interface RoundSet {
  readonly id: string;
  readonly setType: string;
  readonly isCompleted: boolean;
}

/** One exercise in a superset, with its sets in order. */
export interface RoundMember {
  readonly entryId: string;
  readonly sets: readonly RoundSet[];
}

/** One stop in a round: this exercise's set. */
export interface RoundStop {
  readonly entryId: string;
  /** The top set. Its drops, if any, travel with it. */
  readonly setId: string;
  /** Whether the set and every drop off it are ticked. */
  readonly done: boolean;
}

/**
 * The superset's rounds: round one is every exercise's first set, round two
 * every exercise's second, and so on.
 *
 * Warm-ups are not part of a round — they are done before the superset starts,
 * one exercise at a time. A drop travels with the set it came off, so a round
 * is not finished until the drops are. An exercise with fewer sets than the
 * others simply drops out of the later rounds.
 */
export function supersetRounds(members: readonly RoundMember[]): RoundStop[][] {
  const rounds: RoundStop[][] = [];
  for (const member of members) {
    let round = -1;
    for (const set of member.sets) {
      if (set.setType === 'warmup') continue;
      if (isTopSet({ setType: set.setType as SetType }) || round === -1) {
        round += 1;
        const stops = rounds[round] ?? [];
        rounds[round] = stops;
        stops.push({ entryId: member.entryId, setId: set.id, done: set.isCompleted });
        continue;
      }
      // A drop belongs to the stop just made for this exercise, and an
      // unticked one holds the round open.
      const stops = rounds[round];
      const stop = stops?.at(-1);
      if (stops !== undefined && stop !== undefined && !set.isCompleted) {
        stops[stops.length - 1] = { ...stop, done: false };
      }
    }
  }
  return rounds;
}

/** What to do after a set in a superset is ticked. */
export interface AfterTick {
  /**
   * `start` the rest timer, or `hold` it off because the round goes on.
   * Holding also stops a rest that was already running: the lifter has moved
   * on, and a timer counting down mid-round is telling them to stop.
   */
  readonly rest: 'start' | 'hold';
  /** The set to bring into view next, or null when there is nothing left. */
  readonly next: RoundStop | null;
}

/**
 * Where a lifter goes after ticking a set in a superset.
 *
 * Mid-round, on to the next exercise's set in this round — wrapping round to
 * one earlier in the list that was skipped — and the rest timer holds. Once
 * every set in the round is done, the rest starts, and the first unfinished
 * set of a later round is the one to show. A warm-up is not part of a round,
 * so it rests the way it would anywhere else.
 *
 * `members` is the superset as it is *after* the tick.
 */
export function afterTick(members: readonly RoundMember[], tickedSetId: string): AfterTick {
  const owner = members.find((member) => member.sets.some((set) => set.id === tickedSetId));
  const ticked = owner?.sets.find((set) => set.id === tickedSetId);
  if (owner === undefined || ticked === undefined || ticked.setType === 'warmup') {
    return { rest: 'start', next: null };
  }

  const rounds = supersetRounds(members);
  const topId = topOf(owner, tickedSetId);
  const stops = rounds.find((round) => round.some((stop) => stop.setId === topId)) ?? [];

  // The rest of this round, starting after the exercise just done and coming
  // round to the ones before it.
  const at = stops.findIndex((stop) => stop.setId === topId);
  const ahead = [...stops.slice(at + 1), ...stops.slice(0, Math.max(0, at))];
  const next = ahead.find((stop) => !stop.done);
  if (next !== undefined) return { rest: 'hold', next };

  // A drop still to tick on the set just done keeps the round open, but there
  // is nowhere to go: it is right there, under the lifter's thumb.
  if (stops[at]?.done === false) return { rest: 'hold', next: null };

  return { rest: 'start', next: rounds.flat().find((stop) => !stop.done) ?? null };
}

/** The top set a set belongs to: itself, or the one its drop came off. */
function topOf(member: RoundMember, setId: string): string {
  let top: string | null = null;
  for (const set of member.sets) {
    if (set.setType === 'warmup') continue;
    if (isTopSet({ setType: set.setType as SetType }) || top === null) top = set.id;
    if (set.id === setId) return top;
  }
  return setId;
}

/**
 * How long to rest after a round: the longest of its exercises' own rests.
 *
 * A bench press and a curl in one superset rest as long as the bench press
 * needs — the round is only as recovered as its heaviest lift.
 */
export function roundRestSeconds(perMember: readonly number[]): number {
  return perMember.reduce((longest, seconds) => Math.max(longest, seconds), 0);
}

/** An exercise in a list that can be reordered. */
export interface MovableRow {
  readonly id: string;
  readonly orderKey: string;
  readonly supersetId: string | null;
}

/** What to move: a whole unit by its place in the list, or one member of a superset. */
export type MoveTarget = { readonly unit: number } | { readonly member: string };

interface Span {
  readonly start: number;
  readonly length: number;
}

/**
 * The order keys to write to move something one place up or down.
 *
 * A superset moves as a block — splitting it to let an exercise through would
 * leave two halves that no longer read as one. A member of a superset moves
 * only within it, for the same reason.
 *
 * Swapping two neighbours only needs one of them re-keyed, and the smaller
 * one is chosen: an exercise moved past a superset of three is one write, not
 * three. If the keys around it are tied — two devices minted the same one —
 * the whole list is re-keyed in its new order, which always works.
 *
 * Empty when there is nowhere to go.
 */
export function planMove(
  rows: readonly MovableRow[],
  target: MoveTarget,
  direction: -1 | 1,
): { id: string; orderKey: string }[] {
  const sorted = sortByOrder(rows);
  const units = workoutUnits(sorted, (row) => row.supersetId);
  const spans: Span[] = [];
  let cursor = 0;
  for (const unit of units) {
    const length = unit.kind === 'single' ? 1 : unit.members.length;
    spans.push({ start: cursor, length });
    cursor += length;
  }

  if ('unit' in target) {
    const here = spans[target.unit];
    const there = spans[target.unit + direction];
    if (here === undefined || there === undefined) return [];
    return direction === -1 ? swapAdjacent(sorted, there, here) : swapAdjacent(sorted, here, there);
  }

  const index = sorted.findIndex((row) => row.id === target.member);
  const neighbourIndex = index + direction;
  const span = spans.find(
    (candidate) => index >= candidate.start && index < candidate.start + candidate.length,
  );
  // Only inside a real group: a lone exercise moves as a unit, and a member
  // never steps out over the edge of its own superset.
  if (index === -1 || span === undefined || span.length < 2) return [];
  if (neighbourIndex < span.start || neighbourIndex >= span.start + span.length) return [];
  const low = Math.min(index, neighbourIndex);
  return swapAdjacent(sorted, { start: low, length: 1 }, { start: low + 1, length: 1 });
}

/** Re-key so that `second` comes before `first`, touching as few rows as possible. */
function swapAdjacent(
  sorted: readonly MovableRow[],
  first: Span,
  second: Span,
): { id: string; orderKey: string }[] {
  const firstRows = sorted.slice(first.start, first.start + first.length);
  const secondRows = sorted.slice(second.start, second.start + second.length);
  const before = sorted[first.start - 1]?.orderKey ?? null;
  const after = sorted[second.start + second.length]?.orderKey ?? null;

  try {
    if (secondRows.length <= firstRows.length) {
      // The later block goes in front of the earlier one.
      const keys = orderKeysBetween(before, firstRows[0]?.orderKey ?? null, secondRows.length);
      return secondRows.map((row, index) => ({ id: row.id, orderKey: keys[index]! }));
    }
    // The earlier block goes behind the later one.
    const keys = orderKeysBetween(secondRows.at(-1)?.orderKey ?? null, after, firstRows.length);
    return firstRows.map((row, index) => ({ id: row.id, orderKey: keys[index]! }));
  } catch {
    // Tied keys leave no room between them. Start the list's keys afresh.
    const reordered = [
      ...sorted.slice(0, first.start),
      ...secondRows,
      ...firstRows,
      ...sorted.slice(second.start + second.length),
    ];
    const keys = initialOrderKeys(reordered.length);
    return reordered.map((row, index) => ({ id: row.id, orderKey: keys[index]! }));
  }
}
