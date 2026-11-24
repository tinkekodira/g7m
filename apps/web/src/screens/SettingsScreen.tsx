import { currentLocale, t } from '@g7m/i18n';
import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { formatRest, type UnitSystem } from '@g7m/core';
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
import {
  readWorkoutStartOptions,
  saveWorkoutStartOptions,
  useWorkoutStartPreference,
} from '../lib/workout-start-preference.js';
import { useThemeStore } from '../lib/use-theme.js';
import { useRestSettingsStore } from '../lib/use-rest-settings.js';
import {
  REST_ADJUST_MAX_SECONDS,
  REST_ADJUST_MIN_SECONDS,
  REST_ADJUST_STEP_SECONDS,
  REST_MAX_SECONDS,
  REST_MIN_SECONDS,
  REST_STEP_SECONDS,
  formatAdjust,
} from '../lib/rest-settings.js';
import { prepareExport } from '../lib/data-export.js';
import { saveFile } from '../lib/save-file.js';
import { confirmsDeletion, deleteConfirmationWord } from '../lib/account-words.js';
import { useOnline } from '../lib/use-online.js';
import { FriendsError, setTrainingSharing } from '../lib/friends/api.js';
import { PlatePicker } from '../components/PlatePicker.js';
import { GymSettings } from '../components/GymSettings.js';
import { LanguageSelect } from '../components/LanguagePicker.js';
import { switchLanguage } from '../lib/language.js';
import { useSearchParams } from 'react-router';
import { LegalLinks } from '../components/LegalLinks.js';
import { DELETE_ACCOUNT_SECTION } from '../lib/public-pages.js';
import {
  BellIcon,
  ClockIcon,
  DeviceIcon,
  DownloadIcon,
  DumbbellIcon,
  FriendsIcon,
  GlobeIcon,
  KettlebellIcon,
  MessageIcon,
  MoonIcon,
  PinIcon,
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

function unitOptions(): readonly { value: UnitSystem; label: string }[] {
  return [
    { value: 'metric', label: t().settings.units.kilograms },
    { value: 'imperial', label: t().settings.units.pounds },
  ];
}

const TourReplay = lazy(() =>
  import('../components/TourInvitation.js').then((m) => ({ default: m.TourReplay })),
);

interface AccountSnapshot {
  readonly exerciseCount: number;
  readonly muscleCount: number;
}

export function SettingsScreen() {
  useScrollToRequestedSection();

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-4 px-4 pt-safe-top pb-safe-bottom">
      <header className="pt-6">
        <h1 className="text-2xl font-semibold text-primary">{t().settings.title}</h1>
      </header>

      {/* Thirteen cards in one column was a page to scroll through looking
          for one switch. Three groups under labels in Home's small capitals
          (ADR-0129): what changes a workout first, since that is what
          somebody opens Settings mid-session for; then the app; then the
          account and the data, ending on the two ways out. */}
      <Group id="settings-gym" title={t().settings.groups.gym}>
        <WorkoutRecommendations />
        <Panel title={t().settings.gyms} icon={<PinIcon className="size-5" />}>
          <GymSettings />
        </Panel>
        <Units />
        <AvailablePlates />
        <RestTimes />
      </Group>
      <Group id="settings-app" title={t().settings.groups.app}>
        <Language />
        <Appearance />
        <Panel title={t().settings.tour.title}>
          <p className="mb-3 text-sm text-secondary">{t().settings.tour.body}</p>
          <Suspense fallback={null}>
            <TourReplay />
          </Suspense>
        </Panel>
        <FriendsSharing />
        <SendFeedback />
      </Group>
      <Group id="settings-account" title={t().settings.groups.account}>
        <Account />
        <SyncPanel />
        <OfflineStorage />
        <WhereThisIsRunning />
        <YourData />
        <SignOut />
        <DeleteAccount />
      </Group>

      <footer className="flex flex-col gap-2 py-4">
        <LegalLinks />
        <p className="text-xs text-muted">{t().settings.disclaimer}</p>
      </footer>
    </main>
  );
}

/**
 * `?section=delete-account` opens Settings at the delete panel, which is the
 * last thing on a long page. The public account-deletion page links here, so
 * "Settings → Delete account" is one tap after signing in rather than a
 * scroll past everything else. ADR-0189.
 *
 * An effect, not a layout effect: `TabLayout` scrolls every new screen to
 * its top in a layout effect, and this has to land after that.
 *
 * One scroll is not enough. The panels above fill in as their reads arrive —
 * the account's counts, sync, storage — and each pushes the delete panel
 * further down, so a single jump landed a screen and a half short of it. So
 * the panel is held in view while the page settles, and let go the moment the
 * person scrolls or touches anything themselves, or after two seconds.
 * Instant rather than smooth: an animation chasing a moving target is worse.
 */
function useScrollToRequestedSection(): void {
  const [params] = useSearchParams();
  const section = params.get('section');

  useEffect(() => {
    if (section !== DELETE_ACCOUNT_SECTION) return;
    const panel = document.getElementById(DELETE_ACCOUNT_SECTION);
    if (panel === null) return;

    const hold = () => {
      panel.scrollIntoView({ block: 'center' });
    };
    hold();
    panel.focus({ preventScroll: true });

    const observer = new ResizeObserver(hold);
    observer.observe(document.body);
    const release = () => {
      observer.disconnect();
      clearTimeout(timer);
      for (const event of RELEASE_EVENTS) globalThis.removeEventListener(event, release);
    };
    const timer = setTimeout(release, 2_000);
    for (const event of RELEASE_EVENTS) {
      globalThis.addEventListener(event, release, { passive: true, once: true });
    }
    return release;
  }, [section]);
}

/** Anything that says the person has taken over the scrolling. */
const RELEASE_EVENTS = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;

/**
 * Which language the app speaks. ADR-0181.
 *
 * Saved to the account before the switch, not after: the switch re-mounts
 * the app, and the auth gate would otherwise read the old language off the
 * profile and switch straight back to it.
 */
function Language() {
  const profile = useCatalogue('profile', (r) => r.profile.current());
  const { write, busy, error } = useWrite();

  return (
    <Panel title={t().settings.language.title} icon={<GlobeIcon className="size-5" />}>
      <LanguageSelect
        label={t().settings.language.label}
        value={currentLocale()}
        disabled={busy}
        onChange={(locale) => {
          void (async () => {
            if (profile.data !== null) {
              const saved = await write((r) => r.profile.update({ language: locale }));
              if (saved === null) return;
            }
            await switchLanguage(locale);
          })();
        }}
      />
      <p className="mt-2 text-sm text-muted">{t().settings.language.hint}</p>
      {error !== null && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </Panel>
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
    <Panel title={t().settings.appearance.title}>
      <Switch
        checked={theme === 'dark'}
        onChange={(dark) => {
          setTheme(dark ? 'dark' : 'light');
        }}
        icon={<IconChip tone="accent" icon={<MoonIcon className="size-5" />} />}
        label={t().settings.appearance.dark}
        description={
          theme === 'dark' ? t().settings.appearance.darkOn : t().settings.appearance.darkOff
        }
      />
    </Panel>
  );
}

/** Account preference shared with onboarding, persisted locally before syncing. */
function WorkoutRecommendations() {
  const user = useAuthStore((s) => s.session?.user.id ?? '');
  useWorkoutStartPreference((s) => s.revision);
  const showStartOptions = readWorkoutStartOptions(user);
  const profile = useCatalogue('profile', (r) => r.profile.current());
  const { write, busy, error } = useWrite();
  const [pending, setPending] = useState<boolean | null>(null);
  const saved = profile.data?.workoutRecommendations !== false;
  const shown = pending ?? saved;

  useEffect(() => {
    if (pending !== null && pending === saved) setPending(null);
  }, [pending, saved]);

  return (
    <Panel title={t().settings.training.title} icon={<DumbbellIcon className="size-5" />}>
      <Switch
        label={t().settings.training.recommendations}
        checked={shown}
        disabled={busy || profile.data === null}
        description={
          shown ? t().settings.training.recommendationsOn : t().settings.training.recommendationsOff
        }
        onChange={(next) => {
          setPending(next);
          void write((r) => r.profile.update({ workoutRecommendations: next })).then((updated) => {
            if (updated === null) setPending(null);
          });
        }}
      />
      <div className="mt-4 border-t border-subtle pt-4">
        <Switch
          label={t().settings.training.startOptions}
          checked={showStartOptions}
          description={
            showStartOptions
              ? t().settings.training.startOptionsOn
              : t().settings.training.startOptionsOff
          }
          onChange={(show) => saveWorkoutStartOptions(user, show)}
        />
      </div>
      {(error ?? profile.error) !== null && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error ?? profile.error}
        </p>
      )}
    </Panel>
  );
}

/** Kilograms or pounds, without changing any stored workout loads. */
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
    <Panel title={t().settings.units.title}>
      <div className="flex items-center gap-3">
        <IconChip tone="warning" icon={<KettlebellIcon className="size-5" />} />
        <div className="min-w-0 flex-1">
          <p className="text-base font-medium text-primary">{t().settings.units.weight}</p>
          <p className="text-sm text-muted">{t().settings.units.weightDetail}</p>
        </div>
      </div>
      <SegmentedControl
        className="mt-3"
        label={t().settings.units.weightUnit}
        options={unitOptions()}
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
      <p className="mt-3 text-sm text-muted">{t().settings.units.note}</p>
      {error !== null && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </Panel>
  );
}

/**
 * Which plates this gym has — the same picker, on the same store, as the
 * bottom of the plate calculator (`PlatePicker`), so a plate unticked here is
 * unticked there and the other way round.
 *
 * Here as well because the calculator is three taps and a scroll away (Learn,
 * Plates, the bottom of the page), and Settings is where somebody looks for a
 * fact about their gym that they set once.
 */
function AvailablePlates() {
  const profile = useCatalogue('profile', (r) => r.profile.current());
  const unit = profile.data?.unitSystem === 'imperial' ? 'lb' : 'kg';

  return (
    <Panel title={t().settings.plates.title}>
      <div className="flex items-center gap-3">
        <IconChip tone="accent" icon={<DumbbellIcon className="size-5" />} />
        <div className="min-w-0 flex-1">
          <p className="text-base font-medium text-primary">{t().settings.plates.yours}</p>
          <p className="text-sm text-muted">{t().settings.plates.detail}</p>
        </div>
      </div>
      <PlatePicker unit={unit} />
    </Panel>
  );
}

/**
 * How long the rest timer runs: the lifter's own time for compound lifts and
 * another for isolation lifts, or each exercise's own suggestion.
 *
 * Off by default, and off is what the timer always did — so nobody's rest
 * changes until they come here and change it. On, the two times win over
 * every exercise's own (`restSecondsFor`). Kept on this phone; see
 * `rest-settings.ts` for why.
 *
 * Below them, whatever the switch says: how far the rest bar's minus and plus
 * move it, and whether rest ending makes a sound.
 */
function RestTimes() {
  const custom = useRestSettingsStore((state) => state.custom);
  const compound = useRestSettingsStore((state) => state.compound);
  const isolation = useRestSettingsStore((state) => state.isolation);
  const adjust = useRestSettingsStore((state) => state.adjust);
  const sound = useRestSettingsStore((state) => state.sound);
  const setCustom = useRestSettingsStore((state) => state.setCustom);
  const setSeconds = useRestSettingsStore((state) => state.setSeconds);
  const setAdjust = useRestSettingsStore((state) => state.setAdjust);
  const setSound = useRestSettingsStore((state) => state.setSound);

  return (
    <Panel title={t().settings.rest.title}>
      <Switch
        checked={custom}
        onChange={setCustom}
        icon={<IconChip tone="accent" icon={<ClockIcon className="size-5" />} />}
        label={t().settings.rest.own}
        description={custom ? t().settings.rest.ownOn : t().settings.rest.ownOff}
      />
      {custom && (
        <div className="mt-3 flex flex-col gap-3 border-t border-subtle pt-3">
          <RestStepper
            label={t().settings.rest.compound}
            hint={t().settings.rest.compoundHint}
            seconds={compound}
            onChange={(next) => {
              setSeconds('compound', next);
            }}
          />
          <RestStepper
            label={t().settings.rest.isolation}
            hint={t().settings.rest.isolationHint}
            seconds={isolation}
            onChange={(next) => {
              setSeconds('isolation', next);
            }}
          />
        </div>
      )}
      <div className="mt-3 border-t border-subtle pt-3">
        <SecondsStepper
          label={t().settings.rest.step}
          hint={t().settings.rest.stepHint}
          groupLabel={t().settings.rest.stepGroup}
          lessLabel={t().settings.rest.smaller}
          moreLabel={t().settings.rest.bigger}
          seconds={adjust}
          step={REST_ADJUST_STEP_SECONDS}
          min={REST_ADJUST_MIN_SECONDS}
          max={REST_ADJUST_MAX_SECONDS}
          format={formatAdjust}
          onChange={setAdjust}
        />
      </div>
      <div className="mt-3 border-t border-subtle pt-3">
        <Switch
          checked={sound}
          onChange={setSound}
          icon={<IconChip tone="accent" icon={<BellIcon className="size-5" />} />}
          label={t().settings.rest.sound}
          description={sound ? t().settings.rest.soundOn : t().settings.rest.soundOff}
        />
      </div>
    </Panel>
  );
}

/**
 * A rest time with a minus and a plus, read as `m:ss`.
 *
 * Not the shared Stepper: that one shows a plain number, and "180" is a sum
 * to do where "3:00" is a time to read. Fifteen seconds a press, which is as
 * fine as anybody counts rest.
 */
function RestStepper({
  label,
  hint,
  seconds,
  onChange,
}: {
  readonly label: string;
  readonly hint: string;
  readonly seconds: number;
  readonly onChange: (seconds: number) => void;
}) {
  return (
    <SecondsStepper
      label={label}
      hint={hint}
      groupLabel={t().settings.rest.group(label)}
      lessLabel={t().settings.rest.shorter(label)}
      moreLabel={t().settings.rest.longer(label)}
      seconds={seconds}
      step={REST_STEP_SECONDS}
      min={REST_MIN_SECONDS}
      max={REST_MAX_SECONDS}
      format={formatRest}
      onChange={onChange}
    />
  );
}

/** A number of seconds with a minus and a plus, in whatever steps and words it is given. */
function SecondsStepper({
  label,
  hint,
  groupLabel,
  lessLabel,
  moreLabel,
  seconds,
  step,
  min,
  max,
  format,
  onChange,
}: {
  readonly label: string;
  readonly hint: string;
  readonly groupLabel: string;
  readonly lessLabel: string;
  readonly moreLabel: string;
  readonly seconds: number;
  readonly step: number;
  readonly min: number;
  readonly max: number;
  readonly format: (seconds: number) => string;
  readonly onChange: (seconds: number) => void;
}) {
  const button =
    'flex size-tap shrink-0 items-center justify-center rounded-control border border-subtle bg-elevated text-xl text-primary select-none active:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:text-muted/40';

  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-base font-medium text-primary">{label}</p>
        <p className="text-sm text-muted">{hint}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1" role="group" aria-label={groupLabel}>
        <button
          type="button"
          aria-label={lessLabel}
          disabled={seconds <= min}
          onClick={() => {
            onChange(seconds - step);
          }}
          className={button}
        >
          −
        </button>
        <output
          aria-live="polite"
          className="numeric w-14 text-center text-lg font-semibold text-primary"
        >
          {format(seconds)}
        </output>
        <button
          type="button"
          aria-label={moreLabel}
          disabled={seconds >= max}
          onClick={() => {
            onChange(seconds + step);
          }}
          className={button}
        >
          +
        </button>
      </div>
    </div>
  );
}

/**
 * Whether friends see your training.
 *
 * On by default — a friend has been accepted by you before they see anything
 * — and off means they see your name and "Not sharing their training", and
 * nothing else: no workouts, lifts, dots, streak or online status.
 *
 * The switch lives on the server, not on this phone, because it is the server
 * that decides what a friend is sent (ADR-0105). So, like sending feedback, it
 * needs a connection to change, and says so rather than pretending.
 */
function FriendsSharing() {
  const online = useOnline();
  const [sharing, setSharing] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    if (!online) return;
    let cancelled = false;
    void supabase
      .from('friend_profiles')
      .select('share_training')
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error !== null) {
          setFailure(describeDataError(error.message));
          return;
        }
        const row = data as { share_training?: unknown } | null;
        setSharing(row?.share_training !== false);
      });
    return () => {
      cancelled = true;
    };
  }, [online]);

  return (
    <Panel title={t().settings.friends.title} icon={<FriendsIcon className="size-5" />}>
      <Switch
        checked={sharing ?? true}
        disabled={!online || sharing === null || busy}
        onChange={(next) => {
          setBusy(true);
          setFailure(null);
          setSharing(next);
          setTrainingSharing(next).then(
            () => {
              setBusy(false);
            },
            (cause: unknown) => {
              setBusy(false);
              setSharing(!next);
              setFailure(
                cause instanceof FriendsError ? cause.message : t().settings.friends.didNotSave,
              );
            },
          );
        }}
        label={t().settings.friends.share}
        description={
          sharing === false ? t().settings.friends.shareOff : t().settings.friends.shareOn
        }
      />
      {!online && (
        <p className="mt-2 text-sm text-warning">{t().settings.friends.needConnection}</p>
      )}
      {failure !== null && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {failure}
        </p>
      )}
    </Panel>
  );
}

type FeedbackCategory = 'bug' | 'idea' | 'other';

function feedbackCategoryOptions(): readonly { value: FeedbackCategory; label: string }[] {
  return [
    { value: 'bug', label: t().settings.feedback.bug },
    { value: 'idea', label: t().settings.feedback.idea },
    { value: 'other', label: t().settings.feedback.other },
  ];
}

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
    <Panel title={t().settings.feedback.title} icon={<MessageIcon className="size-5" />}>
      <p className="max-w-prose text-sm text-secondary">{t().settings.feedback.intro}</p>
      <SegmentedControl
        className="mt-3"
        label={t().settings.feedback.category}
        options={feedbackCategoryOptions()}
        value={category}
        disabled={state.step === 'sending'}
        onChange={setCategory}
      />
      <div className="mt-3">
        <TextareaField
          label={t().settings.feedback.message}
          value={message}
          disabled={state.step === 'sending'}
          error={
            tooLong ? t().settings.feedback.tooLong(trimmed.length, FEEDBACK_MAX_LENGTH) : undefined
          }
          hint={
            tooLong ? undefined : t().settings.feedback.count(trimmed.length, FEEDBACK_MAX_LENGTH)
          }
          onChange={(event) => {
            setMessage(event.target.value);
            if (state.step === 'sent' || state.step === 'failed') setState({ step: 'idle' });
          }}
        />
      </div>
      {!online && (
        <p className="mt-2 text-sm text-warning">{t().settings.feedback.needConnection}</p>
      )}
      {state.step === 'failed' && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {state.message}
        </p>
      )}
      {state.step === 'sent' && (
        <p role="status" className="mt-2 text-sm text-success">
          {t().settings.feedback.thanks}
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
        {state.step === 'sending' ? t().settings.feedback.sending : t().settings.feedback.send}
      </Button>
      <p className="mt-3 text-xs text-muted">{t().settings.feedback.sentWith}</p>
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
        setLoadError(t().settings.account.noProfile);
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
    <Panel title={t().settings.account.title} icon={<ProfileIcon className="size-5" />}>
      {/* Which account this is. It answers "whose account am I in", which is
          this panel's whole job. */}
      <Row label={t().settings.account.signedIn} value={email} />
      {loadError !== null ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {loadError}
        </p>
      ) : snapshot === null ? (
        <p className="mt-2 text-sm text-muted">{t().common.loading}</p>
      ) : (
        <>
          <Row label={t().settings.account.exercises} value={snapshot.exerciseCount} />
          <Row label={t().settings.account.muscles} value={snapshot.muscleCount} />
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
    <Panel
      title={`${t().settings.sync.title}${syncBusy ? t().settings.sync.working : ''}`}
      icon={<SyncIcon className="size-5" />}
    >
      {/* The one message that is genuinely bad news: rows that exist here and
          never will on the server. Shown above the counts, not below. */}
      {alarm.lost !== null && (
        <p role="alert" className="mb-3 text-sm text-destructive">
          {alarm.lost}
        </p>
      )}
      {/* Why it is not connecting, when there is a reason beyond "no signal".
          Without this the screen cannot tell a basement from a rejected
          token, and neither can anyone reading it over your shoulder. */}
      {alarm.error !== null && (
        <p role="alert" className="mb-3 text-sm text-destructive">
          {alarm.error}
        </p>
      )}
      <Row
        label={t().settings.sync.status}
        value={
          syncPhase === 'synced'
            ? t().settings.sync.connected
            : syncPhase === 'connecting'
              ? t().settings.sync.connecting
              : syncPhase === 'unconfigured'
                ? t().settings.sync.notSetUp
                : t().settings.sync.offline
        }
      />
      {/* These come from SQLite on this device, not from the network. Turning
          the network off and watching them stay is the whole demonstration. */}
      <Row label={t().settings.sync.exercises} value={local?.exercises ?? '—'} />
      <Row label={t().settings.sync.muscles} value={local?.muscles ?? '—'} />
      <Row label={t().settings.sync.equipment} value={local?.equipment ?? '—'} />
      <Row label={t().settings.sync.profiles} value={local?.profiles ?? '—'} />
      <Row label={t().settings.sync.workouts} value={local?.sessions ?? '—'} />
      <Row label={t().settings.sync.sets} value={local?.sets ?? '—'} />
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
    <Panel title={t().settings.storage.title} icon={<StorageIcon className="size-5" />}>
      {persistence === null ? (
        <p className="text-sm text-muted">{t().settings.storage.checking}</p>
      ) : (
        <>
          <Row
            label={t().settings.storage.persistent}
            value={
              persistence.state === 'granted'
                ? t().settings.storage.granted
                : persistence.state === 'denied'
                  ? t().settings.storage.refused
                  : persistence.state === 'unsupported'
                    ? t().settings.storage.unsupported
                    : t().settings.storage.unknown
            }
          />
          <Row label={t().settings.storage.space} value={formatBytes(persistence.quotaBytes)} />
          <Row label={t().settings.storage.used} value={formatBytes(persistence.usageBytes)} />
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
    <Panel title={t().settings.device.title} icon={<DeviceIcon className="size-5" />}>
      <Row label={t().settings.device.shell} value={platform.shell} />
      <Row label={t().settings.device.platform} value={platformLabel(platform.platform)} />
      <Row
        label={t().settings.device.pointer}
        value={platform.hasFinePointer ? t().settings.device.fine : t().settings.device.coarse}
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
        message: t().settings.data.failed,
      });
    }
  };

  return (
    <Panel title={t().settings.data.title} icon={<DownloadIcon className="size-5" />}>
      <p className="max-w-prose text-sm text-secondary">{t().settings.data.intro}</p>
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
        {state.step === 'working' ? t().settings.data.preparing : t().settings.data.download}
      </Button>
      {state.step === 'done' && (
        <div role="status" className="mt-3 flex flex-col gap-2 text-sm">
          <p className="text-secondary">{state.contents}</p>
          {state.caveat !== null && <p className="text-warning">{state.caveat}</p>}
        </div>
      )}
      {state.step === 'failed' && (
        <p role="alert" className="mt-3 text-sm text-destructive">
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
        {t().common.signOut}
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
    <section
      id={DELETE_ACCOUNT_SECTION}
      tabIndex={-1}
      aria-labelledby={`${DELETE_ACCOUNT_SECTION}-title`}
      className="rounded-sheet border border-danger/40 bg-surface p-4 outline-none"
    >
      <h3
        id={`${DELETE_ACCOUNT_SECTION}-title`}
        className="mb-3 flex items-center gap-3 text-lg font-semibold text-primary"
      >
        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-card bg-danger/10 text-destructive"
        >
          <TrashIcon className="size-4" />
        </span>
        {t().settings.deletion.title}
      </h3>
      <p className="max-w-prose text-sm text-secondary">{t().settings.deletion.intro}</p>

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
          {t().settings.deletion.open}
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
            label={t().settings.deletion.typeToConfirm(deleteConfirmationWord())}
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
            <p className="text-sm text-warning">{t().settings.deletion.needConnection}</p>
          )}
          {failure !== null && (
            <p role="alert" className="text-sm text-destructive">
              {failure}
            </p>
          )}
          <Button type="submit" variant="danger" fullWidth disabled={!confirmed || busy || !online}>
            {busy ? t().settings.deletion.deleting : t().settings.deletion.confirm}
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
            {t().settings.deletion.keep}
          </Button>
        </form>
      )}
    </section>
  );
}

const DANGER_OUTLINE =
  'mt-3 inline-flex min-h-tap w-full items-center justify-center rounded-control border ' +
  'border-danger/60 bg-elevated px-4 text-base font-medium text-destructive transition-colors ' +
  'duration-150 hover:border-danger active:bg-surface focus-visible:outline-2 ' +
  'focus-visible:outline-offset-2 focus-visible:outline-accent';

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
    <section className="rounded-sheet border border-subtle bg-surface p-4">
      <h3 className="mb-3 flex items-center gap-3 text-lg font-semibold text-primary">
        {icon !== undefined && (
          <span
            aria-hidden
            className="flex size-8 shrink-0 items-center justify-center rounded-card bg-elevated text-secondary [&>svg]:size-4"
          >
            {icon}
          </span>
        )}
        {title}
      </h3>
      {children}
    </section>
  );
}

/** A heading over a run of cards, in the small capitals Home labels its cards with. */
function Group({
  id,
  title,
  children,
}: {
  readonly id: string;
  readonly title: string;
  readonly children: ReactNode;
}) {
  return (
    // A group, not a section: each card inside is a section of its own, and
    // a section around sections made "the section with this heading" match
    // two of them.
    <div role="group" aria-labelledby={id} className="flex flex-col gap-3 pt-2">
      {/* Small capitals rather than a title: the cards under it already have
          titles of this size, and a group heading as large as them would
          read as one more card's. */}
      <h2
        id={id}
        className="px-1 text-xs leading-4 font-semibold tracking-[0.08em] text-muted uppercase"
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

const CHIP_TONES = {
  accent: 'bg-elevated text-secondary',
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
      className={`flex size-10 shrink-0 items-center justify-center rounded-card ${CHIP_TONES[tone]}`}
    >
      {icon}
    </span>
  );
}

function Row({ label, value }: { readonly label: string; readonly value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-subtle/70 py-2.5 last:border-b-0">
      <span className="text-sm text-secondary">{label}</span>
      <span className="numeric min-w-0 truncate text-base text-primary">{value}</span>
    </div>
  );
}
