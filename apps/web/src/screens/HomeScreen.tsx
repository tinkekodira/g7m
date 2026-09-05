import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '@g7m/ui';
import { supabase } from '../lib/supabase.js';
import { useAuthStore } from '../auth/auth-store.js';
import { detectPlatform, platformLabel } from '../platform.js';
import {
  describePersistence,
  formatBytes,
  requestPersistenceOnce,
  type PersistenceReport,
} from '../lib/storage.js';

/**
 * Phase 1c landing screen.
 *
 * Its job is to prove the whole stack works end to end: a real session, a real
 * authenticated read of the seeded catalogue, and the profile row that the
 * database trigger created on signup. Phase 3 replaces it with the exercise
 * library.
 */

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
  const platform = detectPlatform();

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      // Three reads that each prove something different: the profile row proves
      // the signup trigger fired, and the two counts prove an authenticated
      // user can read reference data that an anonymous one cannot.
      const [profile, exercises, muscles] = await Promise.all([
        supabase.from('profiles').select('display_name, unit_system').single(),
        supabase.from('exercises').select('*', { count: 'exact', head: true }),
        supabase.from('muscles').select('*', { count: 'exact', head: true }),
      ]);

      if (cancelled) return;

      const failure = profile.error ?? exercises.error ?? muscles.error;
      if (failure !== null) {
        setLoadError(failure.message);
        return;
      }
      if (profile.data === null) {
        // The signup trigger should make this impossible. If it happens, say so
        // plainly rather than rendering a screen full of blanks.
        setLoadError('No profile row exists for this account.');
        return;
      }

      setSnapshot({
        displayName: profile.data.display_name as string | null,
        unitSystem: String(profile.data.unit_system),
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

  const email = session?.user.email ?? 'unknown';

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-4 px-4 pt-safe-top pb-safe-bottom">
      <header className="pt-6 pb-2">
        <h1 className="text-2xl font-semibold text-primary">
          {snapshot?.displayName ?? 'Welcome'}
        </h1>
        <p className="mt-1 text-sm text-secondary">Signed in as {email}</p>
      </header>

      <section className="rounded-card bg-surface p-4">
        <h2 className="mb-3 text-lg font-semibold text-primary">Your account</h2>
        {loadError !== null ? (
          <p role="alert" className="text-sm text-danger">
            Could not load your profile: {loadError}
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
