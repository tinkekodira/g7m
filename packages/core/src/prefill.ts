/**
 * What the next set says before anybody types in it.
 *
 * Brief §6 wants a set logged in under three seconds. That is only possible if
 * the numbers are already right most of the time, because the fast path is
 * "tap the tick" and the slow path is "type 100, type 5, tap the tick". Almost
 * everything a lifter does is the same as the set before it, or the same as
 * last week.
 *
 * Pure, and separate from the repository that fetches the history, because the
 * rule is the interesting part and the query is not.
 */
import type { LoadType, SetType } from './load.js';

export interface SetTemplate {
  readonly weightKg: number;
  readonly reps: number;
  readonly loadType: LoadType;
  readonly setType: SetType;
}

export interface PrefillContext {
  /** Sets already logged for this exercise in the session, in order. */
  readonly current: readonly SetTemplate[];
  /** The same exercise the last time it was trained, in order. */
  readonly previous: readonly SetTemplate[];
  /** `exercises.default_rep_low`, for an exercise never done before. */
  readonly repLow: number;
  /** The exercise's natural load type — bodyweight for a pull-up. */
  readonly loadType: LoadType;
}

/**
 * Where a new set starts.
 *
 * The rule in one sentence: **if the lifter is reproducing last week, offer
 * last week's next set; the moment they deviate, offer what they just did.**
 *
 * That single test resolves three cases which pull in opposite directions and
 * which a simpler rule gets wrong one way or the other:
 *
 *   · **An ascending scheme** — 80, 90, 100. Repeating the last set would make
 *     the lifter retype every row, every week, forever.
 *   · **A progression** — last week 100, today 105. Following last week would
 *     drag every remaining set back to 100 and fight them for it.
 *   · **A bad day** — last week 100, today 90. Same fight, in reverse, on the
 *     day they least want an argument with their phone.
 *
 * "Reproducing" is judged on the load, not the reps: the weight is the decision
 * and the reps are what the body had left that day.
 *
 * Warm-ups are skipped when reading history and never proposed from it — a
 * lifter who warmed up with the bar last week should not find this week's first
 * working set prefilled at 20 kg. But a warm-up in progress *is* repeated,
 * because the set after a warm-up is usually another warm-up.
 */
export function nextSetTemplate(context: PrefillContext): SetTemplate {
  // Mid-warm-up: keep warming up. Checked before anything else, because the
  // positional logic below counts working sets and would otherwise offer the
  // first working set of the session while the bar is still empty.
  const lastLogged = context.current.at(-1);
  if (lastLogged?.setType === 'warmup') return { ...lastLogged };

  const currentWorking = context.current.filter((entry) => entry.setType !== 'warmup');
  const previousWorking = context.previous.filter((entry) => entry.setType !== 'warmup');
  const lastWorking = currentWorking.at(-1);

  if (lastWorking !== undefined) {
    const opposite = previousWorking[currentWorking.length - 1];
    if (opposite !== undefined && isSameLoad(opposite, lastWorking)) {
      const next = previousWorking[currentWorking.length];
      // Following last week's plan, and last week had another set. Offer it.
      if (next !== undefined) return asWorking(next);
    }
    // Deviated from last week, or gone further than it went. Either way the
    // load the lifter chose today is the better guess than the one they did
    // not choose last week.
    return asWorking(lastWorking);
  }

  const openingSet = previousWorking[0];
  if (openingSet !== undefined) return asWorking(openingSet);

  return {
    weightKg: 0,
    reps: Math.max(1, Math.round(context.repLow)),
    loadType: context.loadType,
    setType: 'working',
  };
}

/**
 * The set type is never carried across from history.
 *
 * Last week's set three being an AMRAP does not make this week's one, and a set
 * silently prefilled as `failure` would count toward volume nobody asked for.
 */
function asWorking(template: SetTemplate): SetTemplate {
  return { ...template, setType: 'working' };
}

/** Same load means the same number *and* the same meaning for that number. */
function isSameLoad(a: SetTemplate, b: SetTemplate): boolean {
  return a.weightKg === b.weightKg && a.loadType === b.loadType;
}

/**
 * The set from last time that sits opposite this one, for the "last time"
 * hint printed beside each row.
 *
 * Positional rather than best-matching: the hint has to line up with the row it
 * sits next to, and a lifter comparing set three to last week's set three is
 * the comparison that means something.
 */
export function previousSetAt(previous: readonly SetTemplate[], index: number): SetTemplate | null {
  const working = previous.filter((entry) => entry.setType !== 'warmup');
  return working[index] ?? null;
}

/**
 * Whether this session has already beaten the last one on this exercise.
 *
 * Compares completed working reps at or above the previous load, which is the
 * plain reading of "did more". Not a personal record — that is a separate
 * calculation over all of history, and this is only about the two sessions
 * either side of today.
 */
export function hasBeatenPrevious(
  current: readonly SetTemplate[],
  previous: readonly SetTemplate[],
): boolean {
  const currentWorking = current.filter((entry) => entry.setType !== 'warmup');
  const previousWorking = previous.filter((entry) => entry.setType !== 'warmup');
  if (previousWorking.length === 0) return false;

  const currentReps = totalReps(currentWorking);
  const previousReps = totalReps(previousWorking);
  const currentTop = topWeight(currentWorking);
  const previousTop = topWeight(previousWorking);

  if (currentTop > previousTop) return true;
  return currentTop === previousTop && currentReps > previousReps;
}

function totalReps(sets: readonly SetTemplate[]): number {
  return sets.reduce((sum, entry) => sum + Math.max(0, entry.reps), 0);
}

function topWeight(sets: readonly SetTemplate[]): number {
  return sets.reduce((top, entry) => Math.max(top, entry.weightKg), 0);
}
