/**
 * One machine's history at one gym, for the screens that chart an exercise.
 * ADR-0179.
 *
 * A machine at two gyms is two histories: one line through both would draw a
 * 10 kg drop every time the lifter changed gym. So a screen showing one
 * exercise shows one gym's sets, the most recently used first, and offers the
 * others. A lift compared everywhere has no gym scope and is left whole.
 */
import type { HistoricalSet } from '@g7m/core';

/** The gyms this exercise has history at, the most recently trained first. */
export function scopesIn(sets: readonly HistoricalSet[]): string[] {
  const latest = new Map<string, number>();
  for (const set of sets) {
    const scope = set.gymScope ?? null;
    if (scope === null) continue;
    latest.set(scope, Math.max(latest.get(scope) ?? 0, set.performedAt.getTime()));
  }
  return [...latest].sort((a, b) => b[1] - a[1]).map(([scope]) => scope);
}

/** The sets at `scope`; every set when the exercise has no gym scope at all. */
export function setsAtGym(sets: readonly HistoricalSet[], scope: string | null): HistoricalSet[] {
  if (scope === null) return [...sets];
  return sets.filter((set) => (set.gymScope ?? null) === scope);
}
