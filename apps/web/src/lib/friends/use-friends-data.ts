/**
 * The two halves every friend screen needs.
 *
 * **Theirs**, from the network (`useRemote`): loading, failed, or here, the
 * same three states `useCatalogue` gives the local database, plus a way to
 * ask again after a write.
 *
 * **Yours**, from this phone (`useMySide`): the profile for units and week
 * start, your best on every lift for the comparisons, and the catalogue's
 * names and muscles to describe their workouts in. Nothing of yours is sent
 * anywhere to be compared — the comparison happens here.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BIG_THREE,
  DEFAULT_WEEK_START,
  bestLiftsByExercise,
  tallyWorkouts,
  type BestLift,
  type BoardWorkout,
  type UnitSystem,
  type WeekStart,
} from '@g7m/core';
import { useCatalogue, type QueryState } from '../db/use-catalogue.js';
import type { Movers } from '../../screens/friends-view.js';

export interface RemoteState<T> extends QueryState<T> {
  readonly reload: () => void;
}

/**
 * Run `fetch` while `enabled`, again whenever `key` changes or `reload` is
 * called. Keeps showing the last answer while a reload is in flight, so
 * accepting a request does not blank the screen behind it.
 */
export function useRemote<T>(
  key: string,
  enabled: boolean,
  fetch: () => Promise<T>,
): RemoteState<T> {
  const [state, setState] = useState<QueryState<T>>({ data: null, error: null, loading: true });
  const [round, setRound] = useState(0);
  const fetchRef = useRef(fetch);
  fetchRef.current = fetch;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setState((previous) => ({ ...previous, loading: previous.data === null }));
    fetchRef.current().then(
      (data) => {
        if (!cancelled) setState({ data, error: null, loading: false });
      },
      (cause: unknown) => {
        if (cancelled) return;
        console.error('Could not read from the server', cause);
        setState((previous) => ({
          data: previous.data,
          error: cause instanceof Error ? cause.message : 'Something went wrong. Try again.',
          loading: false,
        }));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [key, enabled, round]);

  const reload = useCallback(() => {
    setRound((value) => value + 1);
  }, []);

  return { ...state, reload };
}

export interface MySide {
  /**
   * Whether the profile row is on this phone yet. Right after signing in it
   * may still be on its way down, and "no name" must not be concluded from a
   * row that has not arrived.
   */
  readonly hasProfile: boolean;
  readonly displayName: string | null;
  readonly unitSystem: UnitSystem;
  readonly weekStartsOn: WeekStart;
  readonly bodyweightKg: number | null;
  /** Your best on every lift you have done, by exercise id. */
  readonly bests: ReadonlyMap<string, BestLift>;
  /** Your best on each of the three card lifts, by slug. */
  readonly bigThree: ReadonlyMap<string, number>;
  /** The bench press's id, which head-to-head opens on. */
  readonly benchId: string | null;
  readonly movers: Movers;
  /** Every exercise's display name, by id. */
  readonly names: ReadonlyMap<string, string>;
}

export function useMySide(): QueryState<MySide> {
  return useCatalogue('friends-my-side', async (repositories) => {
    const [profile, sets, ids, movers, exercises] = await Promise.all([
      repositories.profile.current(),
      repositories.history.completedSets(),
      repositories.exercises.idsBySlug(BIG_THREE.map((lift) => lift.slug)),
      repositories.exercises.primaryMovers(),
      repositories.exercises.list(),
    ]);

    const bests = bestLiftsByExercise(sets);
    const bigThree = new Map<string, number>();
    for (const lift of BIG_THREE) {
      const id = ids.get(lift.slug);
      const best = id === undefined ? undefined : bests.get(id);
      if (best !== undefined) bigThree.set(lift.slug, best.bestKg);
    }

    const name = profile?.displayName?.trim() ?? '';
    return {
      hasProfile: profile !== null,
      displayName: name === '' ? null : name,
      unitSystem: profile?.unitSystem ?? 'metric',
      weekStartsOn: (profile?.weekStartsOn ?? DEFAULT_WEEK_START) as WeekStart,
      bodyweightKg: profile?.bodyweightKg ?? null,
      bests,
      bigThree,
      benchId: ids.get('barbell-bench-press') ?? null,
      movers,
      names: new Map(exercises.map((exercise) => [exercise.id, exercise.name])),
    };
  });
}

/**
 * Your own finished workouts since `since`, tallied on this phone by the rule
 * the server tallies a friend's. Yours come from here rather than from the
 * server so a workout finished in a basement is on the board before it has
 * uploaded.
 */
export function useMyBoard(since: Date): QueryState<readonly BoardWorkout[]> {
  return useCatalogue(`friends-my-board-${since.toISOString()}`, async (repositories) =>
    tallyWorkouts(await repositories.history.boardSets(since)),
  );
}
