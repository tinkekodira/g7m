import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  FOCUS_LABELS,
  estimateSessionMinutes,
  firstName,
  greetingFor,
  type PlannedSession,
} from '@g7m/core';
import { cx } from '@g7m/ui';
import { Avatar } from '../components/Avatar.js';
import {
  AlertIcon,
  BodyIcon,
  CalendarIcon,
  ChevronRightIcon,
  ClipboardIcon,
  DumbbellIcon,
  PlayIcon,
  SearchIcon,
  type IconProps,
} from '../components/icons.js';
import { ReviewNudge } from '../components/ReviewCard.js';
import { useCatalogue, useWrite } from '../lib/db/use-catalogue.js';
import { useTrainingReview } from '../lib/db/use-review.js';
import { startPlannedWorkout, useTodaysPlan, type TodaysPlan } from '../lib/db/use-todays-plan.js';
import { useSyncAlarm } from '../lib/powersync/use-sync-alarm.js';
import { openSessionSummary, type OpenSession, type OpenSessionSummary } from './workout-timer.js';

/**
 * Home: hello, today's workout, and the ways into everything else.
 *
 * The workout the app has built for today leads, and looks like it — it is
 * the reason most people open the app. Under it, four ways in: building your
 * own workout, the calendar of days trained, the exercise library and the 3D
 * model. The tab bar does the rest — your numbers are on Profile.
 *
 * What this screen used to be — account, sync, storage and device panels from
 * when it existed to prove the plumbing worked — is on Settings now. The one
 * part of it that has to find the user rather than wait to be found, a sync
 * that is losing data or not working, still shows here.
 */
export function HomeScreen() {
  const now = useMemo(() => new Date(), []);
  const profile = useCatalogue('profile', (r) => r.profile.current());
  const open = useOpenSession();
  const today = useTodaysPlan(now);
  const review = useTrainingReview(now);
  const alarm = useSyncAlarm();

  const greeting = greetingFor(profile.data?.country ?? null, profile.data?.sex ?? null);
  const name = firstName(profile.data?.displayName ?? null);

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-5 px-4 pt-safe-top pb-safe-bottom">
      <header className="flex items-center justify-between gap-4 pt-6">
        {/*
          Hello in their own language, from the country they gave at signup,
          then their name. `lang` and `dir` are on the greeting alone and are
          not decoration: Arabic inside an English heading runs the wrong way
          without them, and a screen reader spells a foreign word out letter by
          letter.
        */}
        <h1 className="min-w-0">
          {name === null ? (
            <span
              lang={greeting.language}
              dir={greeting.direction}
              className="block text-3xl font-bold text-primary"
            >
              {greeting.text}
            </span>
          ) : (
            <>
              <span
                lang={greeting.language}
                dir={greeting.direction}
                className="block text-lg text-secondary"
              >
                {greeting.text},
              </span>
              <span className="block truncate text-3xl font-bold text-primary">{name}</span>
            </>
          )}
        </h1>
        <Link
          to="/profile"
          aria-label="Your profile"
          className="shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <Avatar name={name} />
        </Link>
      </header>

      {(alarm.lost !== null || alarm.error !== null) && <SyncWarning lost={alarm.lost !== null} />}

      <TodayCard open={open} today={today} />

      <section aria-labelledby="quick-access">
        <h2 id="quick-access" className="mb-3 text-lg font-semibold text-primary">
          Quick access
        </h2>
        <ul className="grid grid-cols-2 gap-3">
          {tilesFor(open !== null).map((tile, index) => (
            <li
              key={tile.to}
              className="rise"
              style={{ animationDelay: `${String(index * 40)}ms` }}
            >
              <QuickTile {...tile} />
            </li>
          ))}
        </ul>
      </section>

      {/* The heads-up ADR-0032 asked for: it finds the user rather than
          waiting to be opened, because the lifter running their own program is
          exactly the one who never taps Progress. */}
      {review.data?.review != null && (
        <ReviewNudge
          observations={review.data.review.observations}
          links={review.data.links}
          unitSystem={review.data.unitSystem}
        />
      )}

      <footer className="py-4 text-xs text-muted">
        Educational content, not medical advice. Consult a professional before starting a program.
      </footer>
    </main>
  );
}

/**
 * Today's workout: the thing on this screen that should stand out.
 *
 * Five states, and each is a different thing to say:
 *
 *   open        a workout is already running, and carrying on beats starting
 *   no goal     nothing to build from yet — ten seconds to fix
 *   loading     the plan is being worked out from the history
 *   done        the week's targets are met; resting is the advice
 *   ready       the session, with how long it will take, and a button
 *
 * "Start workout" starts it here, with the generator's choices. "See the
 * plan" is the way to the full session — every weight with its reason, and a
 * swap for any exercise — for anybody who wants to look before they lift.
 */
function TodayCard({
  open,
  today,
}: {
  readonly open: OpenSessionSummary | null;
  readonly today: TodaysPlan;
}) {
  const navigate = useNavigate();
  const { write, busy, error } = useWrite();

  async function start(plan: PlannedSession): Promise<void> {
    const started = await write((r) =>
      startPlannedWorkout(r, {
        plan,
        exercises: plan.exercises,
        bodyweightKg: today.profile?.bodyweightKg ?? null,
      }),
    );
    if (started !== null) void navigate('/workout');
  }

  if (open !== null) {
    return (
      <Hero label={open.stale ? 'Still open' : 'In progress'}>
        <h2 className="mt-1 text-2xl font-bold text-primary">{open.headline}</h2>
        <p className="numeric mt-1 text-sm text-secondary">{open.detail}</p>
        <div className="mt-5">
          <HeroLink to="/workout">{open.stale ? 'Open it' : 'Continue'}</HeroLink>
        </div>
      </Hero>
    );
  }

  if (today.noGoal) {
    return (
      <Hero label="Today’s workout">
        <h2 className="mt-1 text-2xl font-bold text-primary">Get a plan built for you</h2>
        <p className="mt-1 text-sm text-secondary">
          Pick a goal and how many days you train. It takes about ten seconds, and every session
          after that is built from what you log.
        </p>
        <div className="mt-5">
          <HeroLink to="/goal">Choose a goal</HeroLink>
        </div>
      </Hero>
    );
  }

  if (today.error !== null) {
    return (
      <Hero label="Today’s workout">
        <p role="alert" className="mt-2 text-sm text-danger">
          {today.error}
        </p>
      </Hero>
    );
  }

  const plan = today.plan;
  if (!today.ready || plan === null) {
    return (
      <Hero label="Today’s workout">
        <div aria-hidden className="mt-2 h-8 w-40 animate-pulse rounded-control bg-elevated" />
        <p className="mt-2 text-sm text-muted">Working out today’s session…</p>
        <div aria-hidden className="mt-5 h-14 w-44 animate-pulse rounded-control bg-elevated" />
      </Hero>
    );
  }

  if (plan.exercises.length === 0) {
    return (
      <Hero label="Today’s workout">
        <h2 className="mt-1 text-2xl font-bold text-primary">You have done the week</h2>
        <p className="mt-1 text-sm text-secondary">
          Everything today’s session would train has had its sets in the last seven days. Another
          session now costs more recovery than it buys.
        </p>
        <div className="mt-5">
          {/* Not a lock. Somebody who wants to train anyway is allowed to. */}
          <HeroLink to="/workout" quiet>
            Train anyway
          </HeroLink>
        </div>
      </Hero>
    );
  }

  const minutes = estimateSessionMinutes(plan.exercises);
  const groups = [...new Set(plan.exercises.map((exercise) => exercise.groupSlug))];

  return (
    <Hero label="Today’s workout">
      <h2 className="mt-1 text-3xl font-bold text-primary">{FOCUS_LABELS[plan.focus]}</h2>
      <p className="numeric mt-1 text-sm text-secondary">
        {plan.exercises.length} exercises · {plan.totalSets} sets
        {minutes !== null && ` · about ${String(minutes)} min`}
      </p>

      <ul aria-label="Muscle groups" className="mt-3 flex flex-wrap gap-1.5">
        {groups.map((group) => (
          <li
            key={group}
            className="rounded-full border border-subtle bg-base/40 px-2.5 py-1 text-xs text-secondary capitalize"
          >
            {group}
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            void start(plan);
          }}
          className={cx(HERO_ACTION, HERO_PRIMARY, 'pr-7 pl-5 disabled:cursor-not-allowed')}
        >
          <PlayIcon className="size-5" />
          {busy ? 'Setting it up…' : 'Start workout'}
        </button>
        <Link
          to="/plan"
          className="inline-flex min-h-tap items-center px-2 text-sm font-medium text-secondary underline-offset-4 hover:text-primary hover:underline"
        >
          See the plan
        </Link>
      </div>

      {error !== null && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}
    </Hero>
  );
}

/**
 * The card's frame: a warm glow in the corner and a faint dumbbell behind the
 * words, so it reads as the one thing on the screen that is not a menu item.
 * Both decorative, and both drawn in the design tokens rather than a photo —
 * there is no stock picture to license, and no face to put on somebody's plan.
 */
function Hero({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return (
    <section className="relative isolate overflow-hidden rounded-sheet border border-accent/30 bg-surface p-5">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-br from-accent/20 via-accent/5 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-16 -z-10 size-56 rounded-full bg-accent/25 blur-3xl"
      />
      <DumbbellIcon
        className="pointer-events-none absolute top-5 right-4 -z-10 size-24 -rotate-12 text-accent/10"
        strokeWidth={1.4}
      />
      <p className="text-xs font-semibold tracking-wider text-accent uppercase">{label}</p>
      {children}
    </section>
  );
}

/**
 * The card's actions: pill-shaped and a size up from the app's other buttons,
 * because this is the one press the screen exists for. Written out rather than
 * passed to `Button` as overrides — two radius utilities on one element are
 * decided by stylesheet order, not by which was written last.
 */
const HERO_ACTION = cx(
  'inline-flex min-h-14 items-center gap-2 rounded-full px-6 text-lg font-medium select-none',
  'transition-colors duration-150',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
);
const HERO_PRIMARY =
  'bg-accent text-on-accent shadow-floating hover:bg-accent-hover active:bg-accent-pressed ' +
  'disabled:bg-strong disabled:text-muted disabled:shadow-none';
const HERO_QUIET = 'border border-subtle bg-elevated text-primary active:bg-surface';

function HeroLink({
  to,
  quiet = false,
  children,
}: {
  readonly to: string;
  readonly quiet?: boolean;
  readonly children: ReactNode;
}) {
  return (
    <Link to={to} className={cx(HERO_ACTION, quiet ? HERO_QUIET : HERO_PRIMARY)}>
      {children}
      <ChevronRightIcon className="size-5" />
    </Link>
  );
}

interface Tile {
  readonly to: string;
  readonly title: string;
  readonly detail: string;
  readonly icon: ComponentType<IconProps>;
  readonly tone: keyof typeof TILE_TONES;
}

const TILE_TONES = {
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  neutral: 'bg-elevated text-secondary',
  accent: 'bg-accent/15 text-accent',
} as const;

/**
 * The four ways in.
 *
 * With a workout already open the first one would lead straight back into it —
 * the card above already does that, and says so — so its place goes to
 * today's plan instead, which is otherwise out of reach until the workout is
 * finished.
 */
function tilesFor(workoutOpen: boolean): readonly Tile[] {
  return [
    workoutOpen
      ? {
          to: '/plan',
          title: 'Today’s plan',
          detail: 'What the app suggests',
          icon: ClipboardIcon,
          tone: 'success',
        }
      : {
          to: '/workout',
          title: 'Start your own workout',
          detail: 'Build it as you go',
          icon: DumbbellIcon,
          tone: 'success',
        },
    {
      to: '/calendar',
      title: 'Calendar',
      detail: 'The days you trained',
      icon: CalendarIcon,
      tone: 'warning',
    },
    {
      to: '/exercises',
      title: 'Browse exercises',
      detail: 'The whole library',
      icon: SearchIcon,
      tone: 'neutral',
    },
    {
      to: '/learn',
      title: '3D model',
      detail: 'See what trains what',
      icon: BodyIcon,
      tone: 'accent',
    },
  ];
}

function QuickTile({ to, title, detail, icon: Icon, tone }: Tile) {
  return (
    <Link
      to={to}
      className="flex h-full min-h-32 flex-col justify-between gap-4 rounded-card border border-subtle bg-surface p-4 transition-colors active:bg-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span
        aria-hidden
        className={cx('flex size-11 items-center justify-center rounded-control', TILE_TONES[tone])}
      >
        <Icon className="size-6" />
      </span>
      <span>
        <span className="block text-base leading-snug font-semibold text-primary">{title}</span>
        <span className="mt-0.5 block text-xs text-muted">{detail}</span>
      </span>
    </Link>
  );
}

/**
 * Sync is losing data, or not working at all. See `useSyncAlarm`.
 *
 * The full message is on Settings, with the panel it belongs to. Here it is
 * one line saying what kind of trouble, and the way there.
 */
function SyncWarning({ lost }: { readonly lost: boolean }) {
  return (
    <section role="alert" className="rounded-card border border-danger/60 bg-danger/10 p-4">
      <div className="flex items-start gap-3">
        <AlertIcon className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-primary">
            {lost ? 'Some changes did not reach the server' : 'Sync has stopped'}
          </p>
          <p className="mt-0.5 text-sm text-secondary">
            {lost
              ? 'They are on this phone but will not sync.'
              : 'Everything is still saved on this phone.'}
          </p>
          <Link
            to="/settings"
            className="mt-1 inline-flex min-h-tap items-center text-sm font-medium text-primary underline underline-offset-4"
          >
            See what happened
          </Link>
        </div>
      </div>
    </section>
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
function useOpenSession(): OpenSessionSummary | null {
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
