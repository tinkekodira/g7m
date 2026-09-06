import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Button } from '@g7m/ui';
import { supabase } from '../lib/supabase.js';
import { useAuthStore } from '../auth/auth-store.js';
import { detectPlatform, platformLabel } from '../platform.js';
import { describeDataError, retryOnceIfTransient } from '../lib/errors.js';
import {
  describePersistence,
  formatBytes,
  requestPersistenceOnce,
  type PersistenceReport,
} from '../lib/storage.js';
import {
  describeDiscarded,
  describeSyncError,
  describeSyncPhase,
  useSyncStore,
} from '../lib/powersync/sync-store.js';
import { readLocalCounts, type LocalCounts } from '../lib/powersync/local-counts.js';

/**
 * Phase 1c landing screen.
 *
 * Its job is to prove the whole stack works end to end: a real session, a real
 * authenticated read of the seeded catalogue, and the profile row that the
 * database trigger created on signup. Phase 3 replaces it with the exercise
 * library.
 */

/**
 * The Supabase client is untyped until Phase 2b generates a Database type
 * with `supabase gen types`. Until then, the shape of a row is asserted at
 * the one place it is read, rather than spread as `any` through the file.
 */
interface ProfileRow {
  readonly display_name: string | null;
  readonly unit_system: string;
}

interface Snapshot {
  readonly displayName: string | null;
  readonly unitSystem: string;
  readonly exerciseCount: number;
  readonly muscleCount: number;
}

function Row({ label, value }: { readonly label: string; readonly value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-subtle py-2 last:border-b-0">
      <span className="text-sm text-secondary">{label}</span>
      <span className="numeric text-base text-primary">{value}</span>
    </div>
  );
}

export function HomeScreen() {
  const session = useAuthStore((s) => s.session);
  const signOut = useAuthStore((s) => s.signOut);
  const busy = useAuthStore((s) => s.busy);

  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [persistence, setPersistence] = useState<PersistenceReport | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [local, setLocal] = useState<LocalCounts | null>(null);
  const platform = detectPlatform();

  const syncPhase = useSyncStore((s) => s.phase);
  const syncBusy = useSyncStore((s) => s.busy);
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt);
  const discarded = useSyncStore((s) => s.discarded);
  const connectionError = useSyncStore((s) => s.connectionError);
  const lostMessage = describeDiscarded(discarded);
  const syncErrorMessage = describeSyncError(connectionError ?? undefined);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      // Three reads that each prove something different: the profile row proves
      // the signup trigger fired, and the two counts prove an authenticated
      // user can read reference data that an anonymous one cannot.
      const [profile, exercises, muscles] = await Promise.all([
        // Retried once: a device clock a second or two ahead of the server
        // makes the freshly issued token look like it came from the future.
        retryOnceIfTransient(() =>
          supabase.from('profiles').select('display_name, unit_system').single(),
        ),
        supabase.from('exercises').select('*', { count: 'exact', head: true }),
        supabase.from('muscles').select('*', { count: 'exact', head: true }),
      ]);

      if (cancelled) return;

      const failure = profile.error ?? exercises.error ?? muscles.error;
      if (failure !== null) {
        setLoadError(describeDataError(failure.message));
        return;
      }
      if (profile.data === null) {
        // The signup trigger should make this impossible. If it happens, say so
        // plainly rather than rendering a screen full of blanks.
        setLoadError('No profile row exists for this account.');
        return;
      }

      const row = profile.data as unknown as ProfileRow;
      setSnapshot({
        displayName: row.display_name,
        unitSystem: row.unit_system,
        exerciseCount: exercises.count ?? 0,
        muscleCount: muscles.count ?? 0,
      });
    }

    void load();
    // Phase 2 moves this ahead of the PowerSync bootstrap; for now the point
    // is to see the real answer on a real device.
    void requestPersistenceOnce().then((report) => {
      if (!cancelled) setPersistence(report);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Poll the local counts rather than watching them.
   *
   * `db.watch()` would push updates, but it also holds a subscription open for
   * a panel that exists to be glanced at. Two seconds is fast enough to watch
   * the catalogue arrive on a first sync and cheap enough not to matter.
   */
  useEffect(() => {
    let cancelled = false;
    const read = () => {
      void readLocalCounts().then((counts) => {
        if (!cancelled) setLocal(counts);
      });
    };
    read();
    const timer = setInterval(read, 2000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [syncPhase, syncBusy]);

  const email = session?.user.email ?? 'unknown';

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-4 px-4 pt-safe-top pb-safe-bottom">
      <header className="pt-6 pb-2">
        <h1 className="text-2xl font-semibold text-primary">
          {snapshot?.displayName ?? 'Welcome'}
        </h1>
        <p className="mt-1 text-sm text-secondary">Signed in as {email}</p>
      </header>

      {/* The two things on this screen that are the actual app rather than a
          readout of whether the plumbing works. Train first: it is what
          somebody standing in a gym opened the app to do. */}
      <Link
        to="/workout"
        className="flex min-h-tap items-center justify-between rounded-card bg-accent px-4 py-3 text-on-accent active:brightness-95"
      >
        <span className="text-base font-semibold">Train</span>
        <span aria-hidden>→</span>
      </Link>

      <Link
        to="/progress"
        className="flex min-h-tap items-center justify-between rounded-card bg-surface px-4 py-3 active:bg-elevated"
      >
        <span className="text-base font-medium text-primary">Progress</span>
        <span aria-hidden className="text-muted">
          →
        </span>
      </Link>

      <Link
        to="/learn"
        className="flex min-h-tap items-center justify-between rounded-card bg-surface px-4 py-3 active:bg-elevated"
      >
        <span className="text-base font-medium text-primary">Learn — the 3D model</span>
        <span aria-hidden className="text-muted">
          →
        </span>
      </Link>

      <Link
        to="/exercises"
        className="flex min-h-tap items-center justify-between rounded-card bg-surface px-4 py-3 active:bg-elevated"
      >
        <span className="text-base font-medium text-primary">Browse exercises</span>
        <span aria-hidden className="text-muted">
          →
        </span>
      </Link>

      <section className="rounded-card bg-surface p-4">
        <h2 className="mb-3 text-lg font-semibold text-primary">Your account</h2>
        {loadError !== null ? (
          <p role="alert" className="text-sm text-danger">
            {loadError}
          </p>
        ) : snapshot === null ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : (
          <>
            <Row label="Units" value={snapshot.unitSystem === 'metric' ? 'Kilograms' : 'Pounds'} />
            <Row label="Exercises available" value={snapshot.exerciseCount} />
            <Row label="Muscles on the model" value={snapshot.muscleCount} />
          </>
        )}
      </section>

      <section className="rounded-card bg-surface p-4">
        <h2 className="mb-3 text-lg font-semibold text-primary">
          Sync{syncBusy ? ' · working…' : ''}
        </h2>
        {/* The one message that is genuinely bad news: rows that exist here and
            never will on the server. Shown above the counts, not below. */}
        {lostMessage !== null && (
          <p role="alert" className="mb-3 text-sm text-danger">
            {lostMessage}
          </p>
        )}
        {/* Why it is not connecting, when there is a reason beyond "no signal".
            Without this the screen cannot tell a basement from a rejected
            token, and neither can anyone reading it over your shoulder. */}
        {syncErrorMessage !== null && (
          <p role="alert" className="mb-3 text-sm text-danger">
            {syncErrorMessage}
          </p>
        )}
        <Row
          label="Status"
          value={
            syncPhase === 'synced'
              ? 'Connected'
              : syncPhase === 'connecting'
                ? 'Connecting'
                : syncPhase === 'unconfigured'
                  ? 'Not set up'
                  : 'Offline'
          }
        />
        {/* These come from SQLite on this device, not from the network. Turning
            the network off and watching them stay is the whole demonstration. */}
        <Row label="Exercises on device" value={local?.exercises ?? '—'} />
        <Row label="Muscles on device" value={local?.muscles ?? '—'} />
        <Row label="Equipment on device" value={local?.equipment ?? '—'} />
        <Row label="Your profile rows" value={local?.profiles ?? '—'} />
        <Row label="Workouts logged" value={local?.sessions ?? '—'} />
        <Row label="Sets logged" value={local?.sets ?? '—'} />
        <p className="mt-3 max-w-prose text-sm text-secondary">
          {describeSyncPhase(syncPhase, lastSyncedAt)}
        </p>
      </section>

      <section className="rounded-card bg-surface p-4">
        <h2 className="mb-3 text-lg font-semibold text-primary">Offline storage</h2>
        {persistence === null ? (
          <p className="text-sm text-muted">Checking…</p>
        ) : (
          <>
            <Row
              label="Persistent"
              value={
                persistence.state === 'granted'
                  ? 'Granted'
                  : persistence.state === 'denied'
                    ? 'Refused'
                    : persistence.state === 'unsupported'
                      ? 'Unsupported'
                      : 'Unknown'
              }
            />
            <Row label="Space available" value={formatBytes(persistence.quotaBytes)} />
            <Row label="Used" value={formatBytes(persistence.usageBytes)} />
            <p className="mt-3 max-w-prose text-sm text-secondary">
              {describePersistence(persistence.state)}
            </p>
          </>
        )}
      </section>

      <section className="rounded-card bg-surface p-4">
        <h2 className="mb-3 text-lg font-semibold text-primary">Where this is running</h2>
        <Row label="Shell" value={platform.shell} />
        <Row label="Platform" value={platformLabel(platform.platform)} />
        <Row
          label="Pointer"
          value={platform.hasFinePointer ? 'Fine — hover available' : 'Coarse — tap only'}
        />
      </section>

      <div className="pt-2">
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => {
            void signOut();
          }}
        >
          Sign out
        </Button>
      </div>

      <footer className="py-6 text-xs text-muted">
        Educational content, not medical advice. Consult a professional before starting a program.
      </footer>
    </main>
  );
}
