import {
  Suspense,
  lazy,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import { Link, useNavigate } from 'react-router';
import {
  FOCUS_LABELS,
  estimateSessionMinutes,
  firstName,
  greetingFor,
  regionOf,
  type PlannedSession,
} from '@g7m/core';
import { cx, Skeleton } from '@g7m/ui';
import { LoadingRegion } from '../components/LoadingRegion.js';
import { Avatar } from '../components/Avatar.js';
import {
  AlertIcon,
  CalendarIcon,
  ChevronRightIcon,
  ClipboardIcon,
  DumbbellIcon,
  PlayIcon,
  ProgressIcon,
  SearchIcon,
  type IconProps,
} from '../components/icons.js';
import { REGION_DOT } from '../components/region-colours.js';
import { ReviewNudge } from '../components/ReviewCard.js';
import { StatSkeleton } from '../components/StatSkeleton.js';
import { useCatalogue, useWrite } from '../lib/db/use-catalogue.js';
import { useMonthStats, type TrainedToday } from '../lib/db/use-month-stats.js';
import { useTrainingReview } from '../lib/db/use-review.js';
import { startPlannedWorkout, useTodaysPlan, type TodaysPlan } from '../lib/db/use-todays-plan.js';
import { buzz } from '../lib/haptics.js';
import { useSyncAlarm } from '../lib/powersync/use-sync-alarm.js';
import { openSessionSummary, type OpenSession, type OpenSessionSummary } from './workout-timer.js';

/**
 * The month's cards, in a chunk of their own.
 *
 * Home is the one screen in the entry chunk (ADR-0078), and the cards bring
 * the charts with them. Loaded beside the month's numbers, which are read at
 * the same moment, they cost no wait the numbers were not already costing —
 * and the skeleton covers both.
 */
const StatsHero = lazy(async () => ({
  default: (await import('../components/HomeStats.js')).StatsHero,
}));

/**
 * Home: hello, this month, the ways in, and today's workout (ADR-0120).
 *
 * The month leads. Most people never press "Start workout" on the plan the
 * app builds — they run their own — so the first thing on the first screen is
 * what everybody has: their own training this month, added up and compared
 * with last month, in three cards that swipe. Under them, what the training
 * review has to say, in a line; then the four ways in; then today's planned
 * workout, still all there for anybody who wants it.
 *
 * A workout already running goes above all of it. Getting back into it is the
 * one thing that cannot wait for a scroll.
 *
 * What this screen used to be — account, sync, storage and device panels from
 * when it existed to prove the plumbing worked — is on Settings now. The one
 * part of it that has to find the user rather than wait to be found, a sync
 * that is losing data or not working, still shows here.
 */
export function HomeScreen() {
  const navigate = useNavigate();
  const { write, busy, error } = useWrite();
  const starting = useRef(false);

  async function startWorkout(): Promise<void> {
    if (starting.current) return;
    starting.current = true;
    buzz('tick');
    try {
      const session = await write(async (r) => {
        const active = await r.sessions.active();
        if (active !== null) return active;
        const profile = await r.profile.current();
        return r.sessions.start({ bodyweightKg: profile?.bodyweightKg ?? null });
      });
      if (session !== null) void navigate('/workout');
    } finally {
      starting.current = false;
    }
  }

  const now = useMemo(() => new Date(), []);
  const profile = useCatalogue('profile', (r) => r.profile.current());
  const open = useOpenSession();
  const today = useTodaysPlan(now);
  const month = useMonthStats(now);
  const review = useTrainingReview(now);
  const alarm = useSyncAlarm();

  const coach =
    review.data?.review != null ? (
      <ReviewNudge
        observations={review.data.review.observations}
        links={review.data.links}
        unitSystem={review.data.unitSystem}
      />
    ) : null;

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

      {open !== null && <InProgress open={open} />}

      <Suspense
        fallback={
          <section aria-label="This month">
            <StatSkeleton />
          </section>
        }
      >
        <StatsHero month={month} />
      </Suspense>

      <section aria-labelledby="quick-access">
        <h2 id="quick-access" className="mb-3 text-lg font-semibold text-primary">
          Quick access
        </h2>
        <ul className="grid grid-cols-2 gap-3">
          {tilesFor(open !== null, today.recommendationsEnabled).map((tile, index) => (
            <li
              key={tile.to}
              className="rise"
              style={{ animationDelay: `${String(index * 40)}ms` }}
            >
              <QuickTile
                {...tile}
                {...(tile.to === '/workout' && open === null
                  ? { onStart: () => void startWorkout(), busy }
                  : {})}
              />
            </li>
          ))}
        </ul>
        <WriteError error={error} />
      </section>

      {/* The heads-up ADR-0032 asked for, under the ways in: the month and
          Quick access come first, and the note leads straight to the review
          it comes from (ADR-0121). */}
      {coach}

      {/* With a workout open, the strip at the top is the way back in and the
          first tile is the way to the plan; a third card saying the same
          would be one too many. */}
      {open === null && today.recommendationsEnabled && (
        <TodayCard today={today} trainedToday={month.data?.trainedToday ?? null} />
      )}

      <footer className="mt-1 border-t border-subtle/60 pt-4 pb-4 text-xs leading-relaxed text-muted">
        Educational content, not medical advice. Consult a professional before starting a program.
      </footer>
    </main>
  );
}

/**
 * A workout that is still open: the way back into it, at the top.
 *
 * One row, as wide as the screen and all of it a link, so the thumb that came
 * back to Home mid-rest finds it without looking.
 */
function InProgress({ open }: { readonly open: OpenSessionSummary }) {
  return (
    <Link
      to="/workout"
      className={cx(
        'flex min-h-tap items-center gap-3 rounded-card border border-accent/40 bg-accent-subtle px-4 py-3',
        'transition-transform duration-150 ease-out select-none active:scale-[0.99]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
      )}
    >
      <span
        aria-hidden
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent"
      >
        <PlayIcon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] leading-4 font-semibold tracking-[0.08em] text-accent uppercase">
          {open.stale ? 'Still open' : 'In progress'}
        </span>
        <span className="block truncate text-base leading-6 font-semibold text-primary">
          {open.headline}
        </span>
        <span className="numeric block truncate text-xs leading-4 text-secondary">
          {open.detail}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-0.5 text-sm font-medium text-primary">
        {open.stale ? 'Open it' : 'Continue'}
        <ChevronRightIcon aria-hidden className="size-4" />
      </span>
    </Link>
  );
}

/**
 * Today's workout: the plan the app built, one scroll down (ADR-0120).
 *
 * It used to lead the screen. Most people never press it, so it moved below
 * the ways in, a size smaller, and kept everything it did. Its states, each a
 * different thing to say:
 *
 *   no goal     nothing to build from yet — ten seconds to fix
 *   loading     the plan is being worked out from the history
 *   trained     a workout is already done today; resting is the advice
 *   done        the week's targets are met; resting is the advice
 *   ready       the session, with how long it will take, and a button
 *
 * A workout still open is not one of them: the strip at the top has it.
 *
 * "Start workout" starts it here, with the generator's choices. "See the
 * plan" is the way to the full session — every weight with its reason, and a
 * swap for any exercise — for anybody who wants to look before they lift.
 */
function TodayCard({
  today,
  trainedToday,
}: {
  readonly today: TodaysPlan;
  readonly trainedToday: TrainedToday | null;
}) {
  const navigate = useNavigate();
  const { write, busy, error } = useWrite();

  async function start(plan: PlannedSession): Promise<void> {
    buzz('tick');
    const started = await write((r) =>
      startPlannedWorkout(r, {
        plan,
        exercises: plan.exercises,
        bodyweightKg: today.profile?.bodyweightKg ?? null,
      }),
    );
    if (started !== null) void navigate('/workout');
  }

  if (today.noGoal) {
    return (
      <PlanCard label="Today’s workout" title="Get a plan built for you">
        <p className="mt-1 text-sm text-secondary">
          Pick a goal and how many days you train. It takes about ten seconds, and every session
          after that is built from what you log.
        </p>
        <Actions>
          <PrimaryLink to="/goal">Choose a goal</PrimaryLink>
        </Actions>
      </PlanCard>
    );
  }

  if (today.error !== null) {
    return (
      <PlanCard label="Today’s workout">
        <p role="alert" className="mt-2 text-sm text-danger">
          {today.error}
        </p>
      </PlanCard>
    );
  }

  const plan = today.plan;
  if (!today.ready || plan === null) {
    return (
      <PlanCard label="Today’s workout">
        <LoadingRegion label="Working out today’s session…" className="mt-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="mt-2 h-4 w-2/3" />
          <Skeleton className="mt-4 h-12 w-40 rounded-full" />
        </LoadingRegion>
      </PlanCard>
    );
  }

  if (trainedToday !== null) {
    const parts = [
      trainedToday.minutes === null ? null : `${String(trainedToday.minutes)} min`,
      `${String(trainedToday.sets)} ${trainedToday.sets === 1 ? 'set' : 'sets'}`,
    ].filter((part) => part !== null);
    return (
      <PlanCard label="Today’s workout" title="Done for today">
        <p className="numeric mt-1 text-sm text-secondary">Trained today · {parts.join(' · ')}</p>
        <p className="mt-2 text-sm text-secondary">
          Rest is where today’s work turns into progress. Tomorrow’s session is built from it.
        </p>
        <Actions>
          {plan.exercises.length > 0 && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                void start(plan);
              }}
              className={cx(ACTION, QUIET)}
            >
              {busy ? 'Setting it up…' : 'Train again'}
            </button>
          )}
          <SeePlan />
        </Actions>
        <WriteError error={error} />
      </PlanCard>
    );
  }

  if (plan.exercises.length === 0) {
    return (
      <PlanCard label="Today’s workout" title="You have done the week">
        <p className="mt-1 text-sm text-secondary">
          Everything today’s session would train has had its sets in the last seven days. Another
          session now costs more recovery than it buys.
        </p>
        <Actions>
          {/* Not a lock. Somebody who wants to train anyway is allowed to. */}
          <Link to="/workout" className={cx(ACTION, QUIET)}>
            Train anyway
          </Link>
        </Actions>
      </PlanCard>
    );
  }

  const minutes = estimateSessionMinutes(plan.exercises);
  const groups = [...new Set(plan.exercises.map((exercise) => exercise.groupSlug))];

  return (
    <PlanCard label="Today’s workout" title={FOCUS_LABELS[plan.focus]}>
      <p className="numeric mt-1 text-sm text-secondary">
        {plan.exercises.length} exercises · {plan.totalSets} sets
        {minutes !== null && ` · about ${String(minutes)} min`}
      </p>

      <ul aria-label="Muscle groups" className="mt-3 flex flex-wrap gap-1.5">
        {groups.map((group) => {
          const region = regionOf(group);
          return (
            <li
              key={group}
              className="inline-flex items-center gap-1.5 rounded-full border border-subtle bg-base/40 py-1 pr-2.5 pl-2 text-xs text-secondary capitalize"
            >
              {/* The same colour the month's ring gives this group's region. */}
              <span
                aria-hidden
                className={cx(
                  'size-1.5 rounded-full',
                  region === null ? 'bg-muted' : REGION_DOT[region],
                )}
              />
              {group}
            </li>
          );
        })}
      </ul>

      <Actions>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            void start(plan);
          }}
          className={cx(ACTION, PRIMARY, 'disabled:cursor-not-allowed')}
        >
          <PlayIcon className="size-4" />
          {busy ? 'Setting it up…' : 'Start workout'}
        </button>
        <SeePlan />
      </Actions>
      <WriteError error={error} />
    </PlanCard>
  );
}

/**
 * The plan card's frame: the month cards' warm corner light, without their
 * accent edge — this one sits lower and speaks a little more quietly — and a
 * hairline above the actions, so the buttons read as the card's floor.
 */
function PlanCard({
  label,
  title,
  children,
}: {
  readonly label: string;
  readonly title?: string;
  readonly children: ReactNode;
}) {
  const heading = useId();
  return (
    <section
      aria-labelledby={heading}
      className="relative isolate overflow-hidden rounded-sheet border border-subtle bg-surface p-4"
    >
      <div aria-hidden className="stat-glow pointer-events-none absolute inset-0 -z-10" />
      <p
        id={title === undefined ? heading : undefined}
        className="text-[11px] leading-4 font-semibold tracking-[0.08em] text-accent uppercase"
      >
        {label}
      </p>
      {title !== undefined && (
        <h2 id={heading} className="mt-1 text-2xl leading-8 font-bold text-primary">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

function Actions({ children }: { readonly children: ReactNode }) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-subtle/70 pt-4">
      {children}
    </div>
  );
}

/**
 * The card's buttons: pill-shaped, so they read as the one press the card
 * exists for. Written out rather than passed to `Button` as overrides — two
 * radius utilities on one element are decided by stylesheet order, not by
 * which was written last.
 */
const ACTION = cx(
  'inline-flex min-h-12 items-center gap-2 rounded-full px-5 text-base font-medium select-none',
  'transition-[background-color,transform] duration-150 active:scale-[0.97]',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
);
const PRIMARY =
  'bg-accent text-on-accent shadow-floating hover:bg-accent-hover active:bg-accent-pressed ' +
  'disabled:bg-strong disabled:text-muted disabled:shadow-none';
const QUIET = 'border border-subtle bg-elevated text-primary active:bg-surface';

function PrimaryLink({ to, children }: { readonly to: string; readonly children: ReactNode }) {
  return (
    <Link to={to} className={cx(ACTION, PRIMARY, 'pr-4')}>
      {children}
      <ChevronRightIcon className="size-5" />
    </Link>
  );
}

function SeePlan() {
  return (
    <Link
      to="/plan"
      className="inline-flex min-h-tap items-center gap-0.5 px-1 text-sm font-medium text-secondary underline-offset-4 hover:text-primary hover:underline"
    >
      See the plan
      <ChevronRightIcon aria-hidden className="size-4" />
    </Link>
  );
}

function WriteError({ error }: { readonly error: string | null }) {
  if (error === null) return null;
  return (
    <p role="alert" className="mt-3 text-sm text-danger">
      {error}
    </p>
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
 * the strip at the top already does that, and says so — so its place goes to
 * today's plan instead, which is otherwise out of reach until the workout is
 * finished.
 *
 * The last tile is always Progress. It gave its place in the tab bar to
 * Friends, and Home is where a workout ends, which is when somebody wants to
 * see how it went (ADR-0105). The routines are on Profile and the 3D model is
 * on Learn, so neither is out of reach for not having a tile here.
 */
function tilesFor(workoutOpen: boolean, recommendationsEnabled: boolean): readonly Tile[] {
  return [
    workoutOpen && recommendationsEnabled
      ? {
          to: '/plan',
          title: 'Today’s plan',
          detail: 'What the app suggests',
          icon: ClipboardIcon,
          tone: 'success',
        }
      : {
          to: '/workout',
          title: workoutOpen ? 'Continue your workout' : 'Start a workout',
          detail: workoutOpen ? 'Back to your session' : 'Build it as you go',
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
      to: '/progress',
      title: 'Progress',
      detail: 'How your training is going',
      icon: ProgressIcon,
      tone: 'accent',
    },
  ];
}

function QuickTile({
  to,
  title,
  detail,
  icon: Icon,
  tone,
  onStart,
  busy = false,
}: Tile & { readonly onStart?: () => void; readonly busy?: boolean }) {
  const className =
    'flex h-full min-h-32 w-full flex-col justify-between gap-4 rounded-card border border-subtle bg-surface p-4 text-left transition-colors active:bg-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50';
  const content = (
    <>
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
    </>
  );
  return onStart !== undefined ? (
    <button type="button" onClick={onStart} disabled={busy} className={className}>
      {content}
    </button>
  ) : (
    <Link to={to} className={className}>
      {content}
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
      past: session.source === 'past',
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
