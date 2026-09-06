/**
 * Reading the catalogue from a component.
 *
 * Three states, always: loading, failed, or here. A hook that returns only the
 * data forces every screen to invent the other two, and they get invented
 * differently each time.
 *
 * Queries re-run when sync finishes. On a first launch the catalogue arrives a
 * second or two after the screen does, and a library that renders "No
 * exercises" and stays that way until the user navigates twice is the most
 * obvious possible bug in an offline-first app.
 */
import { useEffect, useRef, useState } from 'react';
import { useSyncStore } from '../powersync/sync-store.js';
import { getRepositories, type Repositories } from './repositories.js';

export interface QueryState<T> {
  readonly data: T | null;
  /** Something to show the user. Null when there is nothing wrong. */
  readonly error: string | null;
  readonly loading: boolean;
}

/**
 * Run a query against the local database.
 *
 * `key` is what the query depends on, as a string — a search term, an id, a
 * serialised filter. The callback is deliberately *not* a dependency: it is a
 * new closure on every render, so depending on it would re-run the query
 * forever. Passing the dependencies as one explicit string instead makes the
 * re-run condition something you can read, rather than something you infer
 * from an array of captured variables.
 */
export function useCatalogue<T>(
  key: string,
  run: (repositories: Repositories) => Promise<T>,
): QueryState<T> {
  const [state, setState] = useState<QueryState<T>>({ data: null, error: null, loading: true });
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt);

  // Held in a ref so the effect can call the latest version without treating
  // it as a reason to run again.
  const runRef = useRef(run);
  runRef.current = run;

  const syncedAt = lastSyncedAt?.getTime() ?? 0;

  useEffect(() => {
    let cancelled = false;
    setState((previous) => ({ ...previous, loading: true }));

    getRepositories()
      .then((repositories) => runRef.current(repositories))
      .then(
        (data) => {
          if (!cancelled) setState({ data, error: null, loading: false });
        },
        (error: unknown) => {
          if (cancelled) return;
          console.error('Could not read the local catalogue', error);
          // The database, not the network. A user who is offline is not the
          // explanation here and should not be told they are.
          setState({
            data: null,
            error: 'Could not read the exercise catalogue on this device.',
            loading: false,
          });
        },
      );

    return () => {
      cancelled = true;
    };
  }, [key, syncedAt]);

  return state;
}
