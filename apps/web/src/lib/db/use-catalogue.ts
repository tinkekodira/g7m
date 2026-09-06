/**
 * Reading and writing the local database from a component.
 *
 * Three states on every read, always: loading, failed, or here. A hook that
 * returns only the data forces every screen to invent the other two, and they
 * get invented differently each time.
 *
 * Reads re-run on three triggers: the query's own key changing, sync
 * delivering new rows, and a local write. The last one is why `useWrite`
 * exists at all — a logger where the set you just saved does not appear until
 * you navigate away and back is not a logger.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { create } from 'zustand';
import { useAuthStore } from '../../auth/auth-store.js';
import { useSyncStore } from '../powersync/sync-store.js';
import { getRepositories, type Repositories } from './repositories.js';

export interface QueryState<T> {
  readonly data: T | null;
  /** Something to show the user. Null when there is nothing wrong. */
  readonly error: string | null;
  readonly loading: boolean;
}

/**
 * A counter bumped after every local write, so reads know to run again.
 *
 * PowerSync can watch a SQL statement and push changes, but the repositories
 * exist to keep SQL out of the components — so the app cannot hand it a query
 * to watch without unpicking that. A counter is cruder and costs one re-read
 * per write of a fifty-row table, which is nothing next to the alternative of
 * leaking SQL into every screen.
 */
interface RevisionState {
  readonly revision: number;
  readonly bump: () => void;
}

const useRevisionStore = create<RevisionState>((set) => ({
  revision: 0,
  bump: () => {
    set((state) => ({ revision: state.revision + 1 }));
  },
}));

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
  const revision = useRevisionStore((s) => s.revision);
  const userId = useAuthStore((s) => s.session?.user.id ?? '');

  // Held in a ref so the effect can call the latest version without treating
  // it as a reason to run again.
  const runRef = useRef(run);
  runRef.current = run;

  const syncedAt = lastSyncedAt?.getTime() ?? 0;

  useEffect(() => {
    let cancelled = false;
    // Only "loading" when there is nothing to show. A re-read triggered by a
    // local write already has the data on screen, and flashing a spinner over
    // it every time a set is ticked would be worse than useless.
    setState((previous) => ({ ...previous, loading: previous.data === null }));

    getRepositories(userId)
      .then((repositories) => runRef.current(repositories))
      .then(
        (data) => {
          if (!cancelled) setState({ data, error: null, loading: false });
        },
        (error: unknown) => {
          if (cancelled) return;
          console.error('Could not read the local database', error);
          // The database on this device, not the network. Somebody offline is
          // not the explanation here and should not be told they are.
          setState({
            data: null,
            error: 'Could not read this device’s copy of your data.',
            loading: false,
          });
        },
      );

    return () => {
      cancelled = true;
    };
  }, [key, syncedAt, revision, userId]);

  return state;
}

export interface WriteState {
  /** Run a write, then make every open query re-read. */
  readonly write: <T>(run: (repositories: Repositories) => Promise<T>) => Promise<T | null>;
  /** True while a write is in flight, for disabling the button that started it. */
  readonly busy: boolean;
  readonly error: string | null;
}

/**
 * Write to the local database.
 *
 * The write itself is local and effectively instant — it is a SQLite
 * statement, not a request — so there is no optimistic-update machinery here.
 * The queue takes care of the server, whenever the server becomes reachable.
 */
export function useWrite(): WriteState {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bump = useRevisionStore((s) => s.bump);
  const userId = useAuthStore((s) => s.session?.user.id ?? '');

  const write = useCallback(
    async <T>(run: (repositories: Repositories) => Promise<T>): Promise<T | null> => {
      setBusy(true);
      setError(null);
      try {
        const repositories = await getRepositories(userId);
        const result = await run(repositories);
        bump();
        return result;
      } catch (cause: unknown) {
        console.error('Could not save to this device', cause);
        // Worth saying plainly. A failed local write means the set is gone,
        // which is the one thing this app promises will not happen.
        setError('That did not save. Try again — nothing has been sent anywhere yet.');
        return null;
      } finally {
        setBusy(false);
      }
    },
    [bump, userId],
  );

  return { write, busy, error };
}
