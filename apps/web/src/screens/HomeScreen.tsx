import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Button } from '@g7m/ui';
import { firstName, greetingFor } from '@g7m/core';
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
import { useTrainingReview } from '../lib/db/use-review.js';
import { useCatalogue } from '../lib/db/use-catalogue.js';
import { ReviewNudge } from '../components/ReviewCard.js';
import { openSessionSummary, type OpenSession } from './workout-timer.js';

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
  readonly country: string | null;
  readonly sex: string | null;
}

interface Snapshot {
  readonly displayName: string | null;
  readonly unitSystem: string;
  readonly country: string | null;
  readonly sex: string | null;
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
  const review = useTrainingReview(useMemo(() => new Date(), []));
  const open = useOpenSession();

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
          supabase.from('profiles').select('display_name, unit_system, country, sex').single(),
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
        country: row.country,
        sex: row.sex,
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
  const greeting = greetingFor(
    snapshot?.country ?? null,
    snapshot?.sex === 'male' || snapshot?.sex === 'female' ? snapshot.sex : null,
  );

  /**
   * Greeted by name, where there is one.
   *
   * The heading used to show the name *instead of* the greeting, so anybody
   * who filled the field in got "Tin" where everybody else got "Bienvenue" —
   * a label rather than a welcome. The name now joins the greeting, in
   * whichever language the greeting is already in.
   */
  const name = firstName(snapshot?.displayName ?? null);

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-4 px-4 pt-safe-top pb-safe-bottom">
      <header className="pt-6 pb-2">
        {/* Their own language, from the country they gave at signup. `lang`
            and `dir` are not decoration: Arabic inside an English heading runs
            the wrong way without them, and a screen reader spells a foreign
            word out letter by letter. */}
        <h1
          lang={greeting.language}
          dir={greeting.direction}
          className="text-2xl font-semibold text-primary"
        >
          {name === null ? greeting.text : `${greeting.text}, ${name}!`}
        </h1>
      </header>

      {/* The heads-up ADR-0032 asked for: it finds the user rather than
          waiting to be opened, because the lifter running their own program is
          exactly the one who never taps Progress. */}
      {review.data?.review != null && (
        <ReviewNudge
          observations={review.data.review.observations}
          unitSystem={review.data.unitSystem}
        />
      )}

      {/*
        A workout already running takes the top slot and the accent.

        This screen used to offer "Start an empty workout" whether or not one
        was open, which is the app forgetting the thing the lifter is in the
        middle of: coming back after a phone call meant tapping through to the
        logger to find out whether anything was still there.
      */}
      {open !== null && (
        <Link
          to="/workout"
          className="flex min-h-tap items-center justify-between gap-4 rounded-card bg-accent px-4 py-3 text-on-accent active:brightness-95"
        >
          <span className="min-w-0">
            <span className="block text-base font-semibold">{open.headline}</span>
            <span className="numeric mt-0.5 block text-sm opacity-80">{open.detail}</span>
          </span>
          <span aria-hidden>→</span>
        </Link>
      )}

      {/* The two things on this screen that are the actual app rather than a
          readout of whether the plumbing works. Train first: it is what
          somebody standing in a gym opened the app to do. */}
      <Link
        to="/plan"
        className={`flex min-h-tap items-center justify-between rounded-card px-4 py-3 ${
          open === null
            ? 'bg-accent text-on-accent active:brightness-95'
            : 'bg-surface text-primary active:bg-elevated'
        }`}
      >
        <span className="text-base font-semibold">Train — today’s session</span>
        <span aria-hidden className={open === null ? undefined : 'text-muted'}>
          →
        </span>
      </Link>

      {/* Still here, and deliberately. Brief §0: somebody who knows what they
          are doing builds their own workout, and the generated plan is an
          offer rather than a gate. Hidden while one is running, because the
          card above already goes to the same place and means something else. */}
      {open === null && (
        <Link
          to="/workout"
          className="flex min-h-tap items-center justify-between rounded-card bg-surface px-4 py-3 active:bg-elevated"
        >
          <span className="text-base font-medium text-primary">Start an empty workout</span>
          <span aria-hidden className="text-muted">
            →
          </span>
        </Link>
      )}

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

      {/* Sits with the other pillars rather than in a settings menu. The
          weekly weigh-in is a thing the app asks of the user, so the way to it
          has to be somewhere they already look. */}
      <Link
        to="/you"
        className="flex min-h-tap items-center justify-between rounded-card bg-surface px-4 py-3 active:bg-elevated"
      >
        <span className="text-base font-medium text-primary">You — weight, goal, activity</span>
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
            {/* Which account this is, moved down out of the greeting. It
                answers "whose account am I in", which is this card's whole
                job — not the first line somebody reads on opening the app. */}
            <Row label="Signed in" value={email} />
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

/**
 * The workout that is still open, if there is one, described in a line.
 *
 * A clock rather than a single read, because "23 min in" is wrong a minute
 * later — and a lifter who left the app open on Home while resting would
 * otherwise watch a stale number. Thirty seconds is under the resolution of
 * anything it says, so nothing is ever visibly out of date.
 *
 * Null covers three cases that should all look the same here: no session, a
 * database that has not opened yet, and a read that failed. None of them is
 * worth an error on a landing screen — the logger itself says so properly.
 */
function useOpenSession(): ReturnType<typeof openSessionSummary> | null {
  const [now, setNow] = useState(() => new Date());

  const state = useCatalogue<OpenSession | null>('home-open-session', async (repositories) => {
    const session = await repositories.sessions.active();
    if (session === null) return null;

    const entries = await repositories.sessions.exercisesFor(session.id);
    const sets = await Promise.all(entries.map((entry) => repositories.sessions.setsFor(entry.id)));

    return {
      startedAt: session.startedAt,
      exerciseCount: entries.length,
      // Only what was actually done. A planned set nobody has performed yet is
      // not progress, and counting it would make an untouched plan look busy.
      completedSets: sets.flat().filter((set) => set.isCompleted).length,
    };
  });

  const session = state.data;
  const open = session !== null;
  useEffect(() => {
    if (!open) return;
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30_000);
    return () => {
      clearInterval(timer);
    };
  }, [open]);

  return session === null ? null : openSessionSummary(session, now);
}
