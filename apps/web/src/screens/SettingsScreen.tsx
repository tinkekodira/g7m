import { useEffect, useState, type ReactNode } from 'react';
import type { UnitSystem } from '@g7m/core';
import { Button, SegmentedControl, Switch } from '@g7m/ui';
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
import { describeSyncPhase, useSyncStore } from '../lib/powersync/sync-store.js';
import { useSyncAlarm } from '../lib/powersync/use-sync-alarm.js';
import { readLocalCounts, type LocalCounts } from '../lib/powersync/local-counts.js';
import { useCatalogue, useWrite } from '../lib/db/use-catalogue.js';
import { readTheme, writeTheme, type Theme } from '../lib/theme.js';
import {
  DeviceIcon,
  KettlebellIcon,
  MoonIcon,
  ProfileIcon,
  StorageIcon,
  SyncIcon,
} from '../components/icons.js';

/**
 * Settings: how the app looks and measures, then everything about the account
 * and the device.
 *
 * The four panels at the bottom used to be the home screen. They were built in
 * the first phases to prove the plumbing worked end to end — a real session, a
 * real read of the catalogue, a database on the device — and they are still
 * the first place to look when something is wrong. They are here now because
 * Home is for training. Nothing in them was removed.
 *
 * Their two alarms did not move with them: lost writes and a failing sync are
 * raised on Home and on this tab's icon as well (`useSyncAlarm`), because a
 * warning that only appears on a screen somebody has to go looking for is not
 * a warning.
 */

const UNIT_OPTIONS = [
  { value: 'metric', label: 'Kilograms' },
  { value: 'imperial', label: 'Pounds' },
] as const satisfies readonly { value: UnitSystem; label: string }[];

interface AccountSnapshot {
  readonly exerciseCount: number;
  readonly muscleCount: number;
}

export function SettingsScreen() {
  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-4 px-4 pt-safe-top pb-safe-bottom">
      <header className="pt-6">
        <h1 className="text-2xl font-semibold text-primary">Settings</h1>
      </header>

      <Appearance />
      <Units />
      <Account />
      <SyncPanel />
      <OfflineStorage />
      <WhereThisIsRunning />
      <SignOut />

      <footer className="py-4 text-xs text-muted">
        Educational content, not medical advice. Consult a professional before starting a program.
      </footer>
    </main>
  );
}

/**
 * Dark mode, as a switch that moves and changes nothing — yet.
 *
 * v1 is dark only (Brief §10). The switch is here so the setting exists where
 * people look for it, and the choice is remembered for the day a light palette
 * lands; `appliedTheme` in `lib/theme.ts` is the one line that changes then.
 * The description says so, so nobody thinks the switch is broken.
 */
function Appearance() {
  const [theme, setTheme] = useState<Theme>(() => readTheme());

  return (
    <Panel title="Appearance">
      <Switch
        checked={theme === 'dark'}
        onChange={(dark) => {
          const next: Theme = dark ? 'dark' : 'light';
          setTheme(next);
          writeTheme(next);
        }}
        icon={<IconChip tone="accent" icon={<MoonIcon className="size-5" />} />}
        label="Dark mode"
        description={
          theme === 'dark'
            ? 'Light mode is on its way.'
            : 'Light mode is on its way — the app stays dark until then.'
        }
      />
    </Panel>
  );
}

/**
 * Kilograms or pounds.
 *
 * The switch the app never had. Every screen already converted — weights are
 * stored in kilograms and turned into pounds only when drawn (Brief §5) — but
 * nothing let anybody choose, so a lifter who thinks in pounds was stuck in
 * kilograms. Switching changes no number that was logged, only how it reads.
 */
function Units() {
  const profile = useCatalogue('profile', (r) => r.profile.current());
  const { write, busy, error } = useWrite();

  // The choice moves the instant it is tapped. The write is local and quick,
  // but the re-read behind it is not instant, and a highlight that slid back
  // to the old option before sliding forward again would look broken.
  const [pending, setPending] = useState<UnitSystem | null>(null);
  const saved = profile.data?.unitSystem ?? null;
  const shown: UnitSystem = pending ?? saved ?? 'metric';

  useEffect(() => {
    if (pending !== null && saved === pending) setPending(null);
  }, [pending, saved]);

  return (
    <Panel title="Units">
      <div className="flex items-center gap-3">
        <IconChip tone="warning" icon={<KettlebellIcon className="size-5" />} />
        <div className="min-w-0 flex-1">
          <p className="text-base font-medium text-primary">Weight</p>
          <p className="text-sm text-muted">For every weight in the app.</p>
        </div>
      </div>
      <SegmentedControl
        className="mt-3"
        label="Weight unit"
        options={UNIT_OPTIONS}
        value={shown}
        disabled={busy || profile.data === null}
        onChange={(next) => {
          if (next === shown) return;
          setPending(next);
          void write((r) => r.profile.update({ unitSystem: next })).then((updated) => {
            // Nothing came back: the write failed, or there is no profile row
            // on this device yet. Either way the old choice is the true one.
            if (updated === null) setPending(null);
          });
        }}
      />
      <p className="mt-3 text-sm text-muted">
        Everything is stored in kilograms and only shown in pounds, so switching back and forth
        never changes a number you logged.
      </p>
      {error !== null && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </Panel>
  );
}

/**
 * Whose account this is, and proof the server answers for it.
 *
 * Three reads that each prove something different: the profile row proves the
 * signup trigger fired, and the two counts prove an authenticated user can read
 * reference data that an anonymous one cannot. Over the network on purpose —
 * the local copy is what every other screen reads, so this is the one place
 * that shows the server itself.
 */
function Account() {
  const email = useAuthStore((s) => s.session?.user.email ?? 'unknown');
  const [snapshot, setSnapshot] = useState<AccountSnapshot | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      const [profile, exercises, muscles] = await Promise.all([
        // Retried once: a device clock a second or two ahead of the server
        // makes the freshly issued token look like it came from the future.
        retryOnceIfTransient(() => supabase.from('profiles').select('id').single()),
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
        // plainly rather than rendering a panel full of blanks.
        setLoadError('No profile row exists for this account.');
        return;
      }

      setSnapshot({ exerciseCount: exercises.count ?? 0, muscleCount: muscles.count ?? 0 });
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Panel title="Your account" icon={<ProfileIcon className="size-5" />}>
      {/* Which account this is. It answers "whose account am I in", which is
          this panel's whole job. */}
      <Row label="Signed in" value={email} />
      {loadError !== null ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {loadError}
        </p>
      ) : snapshot === null ? (
        <p className="mt-2 text-sm text-muted">Loading…</p>
      ) : (
        <>
          <Row label="Exercises available" value={snapshot.exerciseCount} />
          <Row label="Muscles on the model" value={snapshot.muscleCount} />
        </>
      )}
    </Panel>
  );
}

function SyncPanel() {
  const syncPhase = useSyncStore((s) => s.phase);
  const syncBusy = useSyncStore((s) => s.busy);
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt);
  const alarm = useSyncAlarm();
  const [local, setLocal] = useState<LocalCounts | null>(null);

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

  return (
    <Panel title={`Sync${syncBusy ? ' · working…' : ''}`} icon={<SyncIcon className="size-5" />}>
      {/* The one message that is genuinely bad news: rows that exist here and
          never will on the server. Shown above the counts, not below. */}
      {alarm.lost !== null && (
        <p role="alert" className="mb-3 text-sm text-danger">
          {alarm.lost}
        </p>
      )}
      {/* Why it is not connecting, when there is a reason beyond "no signal".
          Without this the screen cannot tell a basement from a rejected
          token, and neither can anyone reading it over your shoulder. */}
      {alarm.error !== null && (
        <p role="alert" className="mb-3 text-sm text-danger">
          {alarm.error}
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
    </Panel>
  );
}

function OfflineStorage() {
  const [persistence, setPersistence] = useState<PersistenceReport | null>(null);

  useEffect(() => {
    let cancelled = false;
    // The same promise the database opened with, so this asks nothing new.
    void requestPersistenceOnce().then((report) => {
      if (!cancelled) setPersistence(report);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Panel title="Offline storage" icon={<StorageIcon className="size-5" />}>
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
    </Panel>
  );
}

function WhereThisIsRunning() {
  const platform = detectPlatform();

  return (
    <Panel title="Where this is running" icon={<DeviceIcon className="size-5" />}>
      <Row label="Shell" value={platform.shell} />
      <Row label="Platform" value={platformLabel(platform.platform)} />
      <Row
        label="Pointer"
        value={platform.hasFinePointer ? 'Fine — hover available' : 'Coarse — tap only'}
      />
    </Panel>
  );
}

function SignOut() {
  const signOut = useAuthStore((s) => s.signOut);
  const busy = useAuthStore((s) => s.busy);

  return (
    <div className="pt-2">
      <Button
        variant="secondary"
        fullWidth
        disabled={busy}
        onClick={() => {
          void signOut();
        }}
      >
        Sign out
      </Button>
    </div>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  readonly title: string;
  readonly icon?: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <section className="rounded-card border border-subtle bg-surface p-4">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-primary">
        {icon !== undefined && <span className="text-muted">{icon}</span>}
        {title}
      </h2>
      {children}
    </section>
  );
}

const CHIP_TONES = {
  accent: 'bg-accent/15 text-accent',
  warning: 'bg-warning/15 text-warning',
} as const;

function IconChip({
  tone,
  icon,
}: {
  readonly tone: keyof typeof CHIP_TONES;
  readonly icon: ReactNode;
}) {
  return (
    <span
      aria-hidden
      className={`flex size-10 shrink-0 items-center justify-center rounded-full ${CHIP_TONES[tone]}`}
    >
      {icon}
    </span>
  );
}

function Row({ label, value }: { readonly label: string; readonly value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-subtle py-2 last:border-b-0">
      <span className="text-sm text-secondary">{label}</span>
      <span className="numeric min-w-0 truncate text-base text-primary">{value}</span>
    </div>
  );
}
