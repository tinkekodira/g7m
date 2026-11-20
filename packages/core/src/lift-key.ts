/**
 * Which past sets a set is compared with. ADR-0179.
 *
 * The same machine at two gyms does not weigh the same: 90 kg on one pulldown
 * is harder than 100 kg on the other. So for somebody who trains at more than
 * one gym (ADR-0178), a machine or cable lift is compared only with itself at
 * the same gym: its history, its records, its estimated max, its suggested
 * load. A barbell, a dumbbell or a bodyweight lift weighs the same anywhere and
 * keeps one history.
 *
 * The decision is made once, in the repository's SQL, and arrives here as
 * `gymScope`: the gym, when the lift depends on it, and null otherwise. Every
 * fold that used to group by exercise groups by `liftKey` instead, and with no
 * gym scope the key is the exercise id, so everybody with one gym sees exactly
 * what they saw before.
 *
 * Totals stay global on purpose. Volume, the heat map and the leaderboard are
 * about how much work was done, not about how one machine compares with
 * another, and splitting them would hide half of somebody's training.
 */

/** Equipment whose weight depends on the gym: its stack, its cams, its pulleys. */
export const GYM_DEPENDENT_CATEGORIES = ['machine', 'cable'] as const;

export function isGymDependent(category: string | null | undefined): boolean {
  return (GYM_DEPENDENT_CATEGORIES as readonly (string | null | undefined)[]).includes(category);
}

export interface Scoped {
  readonly exerciseId: string;
  /** The gym this set is compared within, or null when it is compared everywhere. */
  readonly gymScope?: string | null;
}

const SEPARATOR = '@';

/** The key a set's history is grouped under. The exercise id when unscoped. */
export function liftKey(set: Scoped): string {
  const scope = set.gymScope ?? null;
  return scope === null ? set.exerciseId : `${set.exerciseId}${SEPARATOR}${scope}`;
}

/** The exercise a lift key belongs to. */
export function exerciseOfLiftKey(key: string): string {
  const at = key.indexOf(SEPARATOR);
  return at === -1 ? key : key.slice(0, at);
}

/** Whether two sets are the same lift, and so comparable. */
export function sameLift(a: Scoped, b: Scoped): boolean {
  return liftKey(a) === liftKey(b);
}

/**
 * Each exercise's sets at the gym it was last done at, and only those.
 *
 * For views that show one line per exercise — a sparkline, a best lift —
 * where two gyms' machines on one line would draw a drop that never happened.
 * The gym is the one where the exercise was most recently trained, which is
 * where the lifter will be next time, more often than not.
 */
export function latestScopeOnly<T extends Scoped & { readonly performedAt: Date }>(
  sets: readonly T[],
): T[] {
  const latest = new Map<string, { at: number; key: string }>();
  for (const set of sets) {
    const at = set.performedAt.getTime();
    const known = latest.get(set.exerciseId);
    if (known === undefined || at >= known.at)
      latest.set(set.exerciseId, { at, key: liftKey(set) });
  }
  return sets.filter((set) => latest.get(set.exerciseId)?.key === liftKey(set));
}
