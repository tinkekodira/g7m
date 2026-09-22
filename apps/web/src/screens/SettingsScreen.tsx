import { useEffect, useState, type ReactNode } from 'react';
import type { UnitSystem } from '@g7m/core';
import { Button, SegmentedControl, Switch, TextareaField, TextField } from '@g7m/ui';
import { supabase } from '../lib/supabase.js';
import { useAuthStore } from '../auth/auth-store.js';
import { detectPlatform, platformLabel } from '../platform.js';
import { describeDataError, retryOnceIfTransient } from '../lib/errors.js';
import { APP_VERSION } from '../lib/app-version.js';
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
import { useThemeStore } from '../lib/use-theme.js';
import { prepareExport } from '../lib/data-export.js';
import { saveFile } from '../lib/save-file.js';
import { DELETE_CONFIRMATION_WORD, confirmsDeletion } from '../lib/account-words.js';
import {
  DeviceIcon,
  DownloadIcon,
  KettlebellIcon,
  MessageIcon,
  MoonIcon,
  ProfileIcon,
  StorageIcon,
  SyncIcon,
  TrashIcon,
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
      <SendFeedback />
      <Account />
      <SyncPanel />
      <OfflineStorage />
      <WhereThisIsRunning />
      <YourData />
      <SignOut />
      <DeleteAccount />

      <footer className="py-4 text-xs text-muted">
        Educational content, not medical advice. Consult a professional before starting a program.
      </footer>
    </main>
  );
}

/**
 * Dark mode, on or off.
 *
 * Dark is the default and the design's home; off is the light theme, which is
 * easier to read in daylight. The whole app changes the moment it is flipped,
 * because everything is drawn in tokens and the tokens are what change — see
 * `lib/theme.ts` and ADR-0062.
 */
function Appearance() {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  return (
    <Panel title="Appearance">
      <Switch
        checked={theme === 'dark'}
        onChange={(dark) => {
          setTheme(dark ? 'dark' : 'light');
        }}
        icon={<IconChip tone="accent" icon={<MoonIcon className="size-5" />} />}
        label="Dark mode"
        description={
          theme === 'dark'
            ? 'Turn it off for the light theme, easier to read in daylight.'
            : 'Off — the app is in its light theme.'
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

type FeedbackCategory = 'bug' | 'idea' | 'other';

const FEEDBACK_CATEGORY_OPTIONS = [
  { value: 'bug', label: 'Bug' },
  { value: 'idea', label: 'Idea' },
  { value: 'other', label: 'Other' },
] as const satisfies readonly { value: FeedbackCategory; label: string }[];

const FEEDBACK_MAX_LENGTH = 2000;

/**
 * A message to the developer, from Settings.
 *
 * Inserted straight into `public.feedback` through PostgREST — the same
 * direct-write shape `Account` already reads with and `DeleteAccount` already
 * writes with — rather than going through PowerSync. There is nothing to
 * reconcile offline about a message that has not been sent yet, so this
 * needs a connection the same way deleting the account does, and says so the
 * same way: disable Send, explain why (ADR-0088).
 */
function SendFeedback() {
  const userId = useAuthStore((s) => s.session?.user.id ?? null);
  const online = useOnline();
  const [category, setCategory] = useState<FeedbackCategory>('idea');
  const [message, setMessage] = useState('');
  const [state, setState] = useState<
    | { readonly step: 'idle' }
    | { readonly step: 'sending' }
    | { readonly step: 'sent' }
    | { readonly step: 'failed'; readonly message: string }
  >({ step: 'idle' });

  const trimmed = message.trim();
  const tooLong = trimmed.length > FEEDBACK_MAX_LENGTH;
  const canSend =
    online && userId !== null && trimmed.length > 0 && !tooLong && state.step !== 'sending';

  const send = async () => {
    if (!canSend || userId === null) return;
    setState({ step: 'sending' });
    const { error } = await supabase.from('feedback').insert({
      user_id: userId,
      category,
      message: trimmed,
      app_version: APP_VERSION,
      platform: detectPlatform().platform,
    });
    if (error !== null) {
      setState({ step: 'failed', message: describeDataError(error.message) });
      return;
    }
    setMessage('');
    setState({ step: 'sent' });
  };

  return (
    <Panel title="Send feedback" icon={<MessageIcon className="size-5" />}>
      <p className="max-w-prose text-sm text-secondary">
        Report a bug, suggest something, or just say what&rsquo;s on your mind — it goes straight to
        the developer.
      </p>
      <SegmentedControl
        className="mt-3"
        label="Category"
        options={FEEDBACK_CATEGORY_OPTIONS}
        value={category}
        disabled={state.step === 'sending'}
        onChange={setCategory}
      />
      <div className="mt-3">
        <TextareaField
          label="Message"
          value={message}
          disabled={state.step === 'sending'}
          error={
            tooLong
              ? `${String(trimmed.length)}/${String(FEEDBACK_MAX_LENGTH)} — too long`
              : undefined
          }
          hint={tooLong ? undefined : `${String(trimmed.length)}/${String(FEEDBACK_MAX_LENGTH)}`}
          onChange={(event) => {
            setMessage(event.target.value);
            if (state.step === 'sent' || state.step === 'failed') setState({ step: 'idle' });
          }}
        />
      </div>
      {!online && (
        <p className="mt-2 text-sm text-warning">You need a connection to send feedback.</p>
      )}
      {state.step === 'failed' && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {state.message}
        </p>
      )}
      {state.step === 'sent' && (
        <p role="status" className="mt-2 text-sm text-success">
          Thanks — this reached the developer.
        </p>
      )}
      <Button
        fullWidth
        className="mt-3"
        disabled={!canSend}
        onClick={() => {
          void send();
        }}
      >
        {state.step === 'sending' ? 'Sending…' : 'Send feedback'}
      </Button>
      <p className="mt-3 text-xs text-muted">
        Sent with your account email, app version and platform.
      </p>
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

/**
 * "Download your data": everything this account has put into the app, as one
 * file.
 *
 * Made from this device's database, so it works offline and includes changes
 * the server has not had yet (ADR-0064). Saved through the share sheet on a
 * phone and as a download on a computer (`lib/save-file.ts`).
 */
function YourData() {
  const user = useAuthStore((s) => s.session?.user ?? null);
  const [state, setState] = useState<
    | { readonly step: 'idle' }
    | { readonly step: 'working' }
    | { readonly step: 'done'; readonly contents: string; readonly caveat: string | null }
    | { readonly step: 'failed'; readonly message: string }
  >({ step: 'idle' });

  const download = async () => {
    if (user === null) return;
    setState({ step: 'working' });
    try {
      const prepared = await prepareExport(user);
      const outcome = await saveFile(prepared.file, detectPlatform().hasFinePointer);
      setState(
        outcome === 'cancelled'
          ? { step: 'idle' }
          : { step: 'done', contents: prepared.contents, caveat: prepared.caveat },
      );
    } catch (cause: unknown) {
      console.error('Could not export the data.', cause);
      setState({
        step: 'failed',
        message: 'The file could not be made. Nothing was changed — try again in a moment.',
      });
    }
  };

  return (
    <Panel title="Your data" icon={<DownloadIcon className="size-5" />}>
      <p className="max-w-prose text-sm text-secondary">
        Everything you have logged — workouts, sets, records, weigh-ins, goals and your profile — as
        one file you can keep, or open in another app. It is made on this phone, so it works
        offline.
      </p>
      <Button
        variant="secondary"
        fullWidth
        className="mt-3"
        disabled={user === null || state.step === 'working'}
        onClick={() => {
          void download();
        }}
      >
        <DownloadIcon className="size-5" />
        {state.step === 'working' ? 'Preparing your file…' : 'Download your data'}
      </Button>
      {state.step === 'done' && (
        <div role="status" className="mt-3 flex flex-col gap-2 text-sm">
          <p className="text-secondary">{state.contents}</p>
          {state.caveat !== null && <p className="text-warning">{state.caveat}</p>}
        </div>
      )}
      {state.step === 'failed' && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {state.message}
        </p>
      )}
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

/**
 * Deleting the account, last on the page and two deliberate steps away.
 *
 * The first tap only opens the panel; the second needs the word typed. Not to
 * make leaving hard — it is one screen, with no email to send and nobody to
 * ask — but because nothing about it can be undone, and a button a thumb can
 * brush on the way to Sign out is not a decision.
 *
 * Offline it says what it needs rather than failing: the account lives on the
 * server, and deleting only this phone's copy would be the one outcome nobody
 * asked for. See ADR-0065.
 */
function DeleteAccount() {
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const busy = useAuthStore((s) => s.busy);
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [failure, setFailure] = useState<string | null>(null);
  const online = useOnline();

  const confirmed = confirmsDeletion(typed);

  return (
    <section className="rounded-card border border-danger/40 bg-surface p-4">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-primary">
        <span className="text-danger">
          <TrashIcon className="size-5" />
        </span>
        Delete your account
      </h2>
      <p className="max-w-prose text-sm text-secondary">
        Deletes your account and everything in it — every workout, set, record, weigh-in and goal —
        from the server and from this phone. It cannot be undone. If you want a copy, download your
        data first.
      </p>

      {!open ? (
        // Not the shared Button: its secondary variant sets its own text
        // colour, and two colour utilities on one element are decided by the
        // stylesheet's order, not the class list's.
        <button
          type="button"
          className={DANGER_OUTLINE}
          onClick={() => {
            setOpen(true);
          }}
        >
          Delete my account…
        </button>
      ) : (
        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!confirmed || busy || !online) return;
            setFailure(null);
            void deleteAccount().then((message) => {
              // On success this component is already gone — the session ended
              // and the sign-in screen replaced the app — so only a failure
              // comes back here.
              if (message !== null) setFailure(message);
            });
          }}
        >
          <TextField
            label={`Type ${DELETE_CONFIRMATION_WORD} to confirm`}
            value={typed}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            disabled={busy}
            onChange={(event) => {
              setTyped(event.target.value);
            }}
          />
          {!online && (
            <p className="text-sm text-warning">
              You need a connection. Your account is deleted on the server, not just on this phone.
            </p>
          )}
          {failure !== null && (
            <p role="alert" className="text-sm text-danger">
              {failure}
            </p>
          )}
          <Button type="submit" variant="danger" fullWidth disabled={!confirmed || busy || !online}>
            {busy ? 'Deleting…' : 'Delete my account for good'}
          </Button>
          <Button
            variant="ghost"
            fullWidth
            disabled={busy}
            onClick={() => {
              setOpen(false);
              setTyped('');
              setFailure(null);
            }}
          >
            Keep my account
          </Button>
        </form>
      )}
    </section>
  );
}

const DANGER_OUTLINE =
  'mt-3 inline-flex min-h-tap w-full items-center justify-center rounded-control border ' +
  'border-danger/50 bg-elevated px-4 text-base font-medium text-danger transition-colors ' +
  'duration-150 hover:border-danger active:bg-surface focus-visible:outline-2 ' +
  'focus-visible:outline-offset-2 focus-visible:outline-accent';

/** Whether the browser thinks there is a network. A hint, not a promise — the request is the test. */
function useOnline(): boolean {
  const [online, setOnline] = useState(() => globalThis.navigator.onLine);
  useEffect(() => {
    const update = () => {
      setOnline(globalThis.navigator.onLine);
    };
    globalThis.addEventListener('online', update);
    globalThis.addEventListener('offline', update);
    return () => {
      globalThis.removeEventListener('online', update);
      globalThis.removeEventListener('offline', update);
    };
  }, []);
  return online;
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
