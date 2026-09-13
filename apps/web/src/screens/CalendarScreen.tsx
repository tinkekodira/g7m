import { useMemo, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import {
  DEFAULT_WEEK_START,
  byDay,
  dateKey,
  monthGrid,
  startOfMonth,
  toDisplayWeight,
  totalsWithin,
  trainingMinutes,
  type CalendarDay,
  type UnitSystem,
  type WeekStart,
} from '@g7m/core';
import type { SessionSummary } from '@g7m/db';
import { Button, cx } from '@g7m/ui';
import { HeaderLink } from '../components/HeaderLink.js';
import { ChevronLeftIcon, ChevronRightIcon } from '../components/icons.js';
import { useCatalogue, useWrite } from '../lib/db/use-catalogue.js';
import {
  dayLabel,
  dayTitle,
  earliestMonth,
  monthKey,
  monthSummary,
  monthTitle,
  selectedDay,
  shownMonth,
  stepMonth,
  weekdayHeadings,
} from './calendar-view.js';
import { describeMark } from './review-copy.js';

/**
 * A month, with the days you trained on it.
 *
 * A trained day is filled in the accent — with a small count on it when there
 * was more than one workout — today has a ring round it, and a day that has
 * not happened yet is faint and cannot be picked. Tap a day and its workouts
 * appear underneath, each exercise with the sets that were done, with the full
 * workout one more tap away. An empty day that has gone can have a workout
 * logged against it, for the one somebody forgot to record.
 *
 * Only finished workouts with something ticked in them count as a day
 * trained, the same rule Progress uses: a workout opened and walked away from
 * is not a workout, and one still running is not finished.
 *
 * The month and the chosen day are in the address, so coming back from a
 * workout lands on the day it was opened from rather than jumping back to
 * today.
 */
export function CalendarScreen() {
  const now = useMemo(() => new Date(), []);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { write, busy, error: writeError } = useWrite();

  const state = useCatalogue(`calendar-${dateKey(now)}`, async (r) => {
    const [profile, summaries, open] = await Promise.all([
      r.profile.current(),
      r.history.sessionSummaries(null),
      r.sessions.active(),
    ]);

    return {
      weekStartsOn: (profile?.weekStartsOn ?? DEFAULT_WEEK_START) as WeekStart,
      unitSystem: profile?.unitSystem ?? ('metric' as const),
      bodyweightKg: profile?.bodyweightKg ?? null,
      summaries,
      firstAt: summaries.at(-1)?.startedAt ?? null,
      // Only one workout can be open, so a past one waits for a live one to
      // finish, and the other way round.
      openWorkout: open !== null,
    };
  });

  const data = state.data;
  const weekStartsOn = data?.weekStartsOn ?? DEFAULT_WEEK_START;
  const earliest = earliestMonth(data?.firstAt ?? null, now);
  const month = shownMonth(params.get('month'), params.get('day'), now, earliest);
  const shown = monthKey(month);

  // Keyed on the month's name rather than its Date, which is a new object on
  // every render.
  const weeks = useMemo(
    () => monthGrid(new Date(`${shown}-01T12:00:00`), now, weekStartsOn),
    [shown, now, weekStartsOn],
  );

  const inMonth = useMemo(() => {
    const summaries = data?.summaries ?? [];
    const start = new Date(`${shown}-01T00:00:00`);
    const span = { start, end: stepMonth(start, 1) };
    return {
      days: byDay(
        summaries.filter((entry) => entry.startedAt >= span.start && entry.startedAt < span.end),
      ),
      totals: totalsWithin(summaries, span),
    };
  }, [data, shown]);

  const selected = selectedDay(params.get('day'), weeks);
  const canGoBack = stepMonth(month, -1) >= startOfMonth(earliest);
  const canGoForward = month < startOfMonth(now);

  // Replaced rather than pushed, all of it: the back button leaves the
  // calendar instead of stepping back through every month and day looked at.
  const showMonth = (next: Date): void => {
    setParams({ month: monthKey(next) }, { replace: true });
  };
  const choose = (key: string): void => {
    setParams({ month: shown, day: key }, { replace: true });
  };

  /**
   * Log a workout on a day that has gone.
   *
   * Started at noon on that day: the date is what is known, and noon keeps it
   * on the right date whatever the time zone does to it on the way to the
   * server. It opens in the logger like any workout, with nothing live about
   * it — see the `past` source and ADR-0061. The bodyweight is today's, being
   * the best guess there is at what it was then.
   */
  async function logPast(day: CalendarDay): Promise<void> {
    const startedAt = new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate(), 12);
    const started = await write((r) =>
      r.sessions.start({ source: 'past', startedAt, bodyweightKg: data?.bodyweightKg ?? null }),
    );
    if (started !== null) void navigate('/workout');
  }

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-4 px-4 pt-safe-top pb-safe-bottom">
      <header className="flex items-baseline justify-between gap-4 pt-6 pb-2">
        <h1 className="text-2xl font-semibold text-primary">Calendar</h1>
        <HeaderLink to="/">Home</HeaderLink>
      </header>

      {(state.error ?? writeError) !== null && (
        <p role="alert" className="rounded-card bg-surface p-4 text-sm text-danger">
          {state.error ?? writeError}
        </p>
      )}

      <section
        aria-labelledby="calendar-month"
        className="rounded-card border border-subtle bg-surface px-2 pt-3 pb-3"
      >
        <div className="flex items-center gap-1">
          <MonthArrow
            label="Previous month"
            disabled={!canGoBack}
            onClick={() => {
              showMonth(stepMonth(month, -1));
            }}
          >
            <ChevronLeftIcon className="size-5" />
          </MonthArrow>
          <div className="min-w-0 flex-1 text-center">
            <h2 id="calendar-month" className="text-lg font-semibold text-primary">
              {monthTitle(month)}
            </h2>
            <p className="numeric text-xs text-muted">{monthSummary(inMonth.totals, month, now)}</p>
          </div>
          <MonthArrow
            label="Next month"
            disabled={!canGoForward}
            onClick={() => {
              showMonth(stepMonth(month, 1));
            }}
          >
            <ChevronRightIcon className="size-5" />
          </MonthArrow>
        </div>

        <div aria-hidden className="mt-3 grid grid-cols-7">
          {weekdayHeadings(weekStartsOn).map((name) => (
            <span key={name} className="text-center text-xs font-medium text-muted">
              {name}
            </span>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7">
          {weeks.flat().map((day) => (
            <DayCell
              key={day.key}
              day={day}
              workouts={inMonth.days.get(day.key)?.length ?? 0}
              selected={day.key === selected?.key}
              onChoose={() => {
                choose(day.key);
              }}
            />
          ))}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 px-2 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="size-3 rounded-full bg-accent" />
            Workout
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="size-3 rounded-full ring-2 ring-accent ring-inset" />
            Today
          </span>
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="numeric flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-surface"
            >
              2
            </span>
            Two workouts that day
          </span>
        </div>
      </section>

      {selected === undefined ? (
        <p className="px-1 text-sm text-muted">Tap a day to see what you did.</p>
      ) : (
        <DayWorkouts
          day={selected}
          workouts={inMonth.days.get(selected.key) ?? []}
          unitSystem={data?.unitSystem ?? 'metric'}
          loading={state.loading}
          openWorkout={data?.openWorkout ?? false}
          busy={busy}
          onLogPast={() => {
            void logPast(selected);
          }}
        />
      )}
    </main>
  );
}

function MonthArrow({
  label,
  disabled,
  onClick,
  children,
}: {
  readonly label: string;
  readonly disabled: boolean;
  readonly onClick: () => void;
  readonly children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-tap shrink-0 items-center justify-center rounded-full text-secondary select-none enabled:active:bg-elevated disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
    >
      {children}
    </button>
  );
}

/**
 * One day of the grid.
 *
 * Several things a day can be at once, each drawn a different way so they can
 * all show together: trained (the circle is filled), trained more than once
 * (a count on its shoulder), today (a ring round the circle), and the one
 * being looked at (a tile behind it). A day from the months either side is
 * left empty, and one that has not happened yet is faint and cannot be
 * pressed.
 *
 * 48px tall and a seventh of the card wide, which clears the tap target from
 * Brief §8 on any phone in portrait.
 */
function DayCell({
  day,
  workouts,
  selected,
  onChoose,
}: {
  readonly day: CalendarDay;
  readonly workouts: number;
  readonly selected: boolean;
  readonly onChoose: () => void;
}) {
  if (!day.inMonth) return <span aria-hidden className="h-12" />;

  const trained = workouts > 0;

  return (
    <button
      type="button"
      disabled={day.isFuture}
      aria-pressed={selected}
      aria-label={dayLabel(day, workouts)}
      onClick={onChoose}
      className={cx(
        'flex h-12 items-center justify-center rounded-control select-none',
        'transition-colors duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent',
        'disabled:cursor-default',
        selected ? 'bg-elevated' : 'enabled:active:bg-elevated',
      )}
    >
      <span
        className={cx(
          'numeric relative flex size-9 items-center justify-center rounded-full text-sm',
          trained
            ? 'bg-accent font-semibold text-on-accent'
            : day.isFuture
              ? 'text-muted/50'
              : 'text-secondary',
          // A ring sits outside a filled day and on the edge of an empty one,
          // so today reads as today whether or not it was trained.
          day.isToday &&
            (trained
              ? cx(
                  'ring-2 ring-accent ring-offset-2',
                  selected ? 'ring-offset-elevated' : 'ring-offset-surface',
                )
              : 'font-semibold text-primary ring-2 ring-accent ring-inset'),
        )}
      >
        {day.date.getDate()}
        {/* Two workouts in a day used to look exactly like one. */}
        {workouts > 1 && (
          <span
            aria-hidden
            className={cx(
              'absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full',
              'bg-primary text-[10px] leading-none font-bold text-surface ring-2',
              selected ? 'ring-elevated' : 'ring-surface',
            )}
          >
            {workouts}
          </span>
        )}
      </span>
    </button>
  );
}

interface WorkoutDetail {
  readonly sessionId: string;
  readonly blocks: readonly {
    readonly entryId: string;
    readonly name: string;
    readonly timed: boolean;
    readonly sets: readonly {
      readonly id: string;
      readonly warmup: boolean;
      readonly loadType: 'external' | 'bodyweight' | 'bodyweight_plus' | 'assisted';
      readonly weightKg: number;
      readonly reps: number;
    }[];
  }[];
}

/**
 * The workouts of the chosen day, each as the exercises and sets that were
 * done.
 *
 * Only what was ticked. A set written down and never done belongs on the full
 * record, which is one tap away; here the question is what the day's training
 * was.
 *
 * An empty day that has gone offers to log a workout against it. Not today —
 * a workout today is one to start, from Home — and not while another workout
 * is open, since only one can be.
 */
function DayWorkouts({
  day,
  workouts,
  unitSystem,
  loading,
  openWorkout,
  busy,
  onLogPast,
}: {
  readonly day: CalendarDay;
  readonly workouts: readonly SessionSummary[];
  readonly unitSystem: UnitSystem;
  readonly loading: boolean;
  readonly openWorkout: boolean;
  readonly busy: boolean;
  readonly onLogPast: () => void;
}) {
  const ids = workouts.map((workout) => workout.sessionId);

  const details = useCatalogue<readonly WorkoutDetail[]>(
    `calendar-day:${day.key}:${ids.join(',')}`,
    async (r) =>
      Promise.all(
        ids.map(async (sessionId) => {
          const entries = await r.sessions.exercisesFor(sessionId);
          const blocks = await Promise.all(
            entries.map(async (entry) => {
              const [exercise, sets] = await Promise.all([
                r.exercises.byId(entry.exerciseId),
                r.sessions.setsFor(entry.id),
              ]);
              return {
                entryId: entry.id,
                name: exercise?.name ?? 'Unknown exercise',
                timed: exercise?.isTimeBased ?? false,
                sets: sets
                  .filter((set) => set.isCompleted)
                  .map((set) => ({
                    id: set.id,
                    warmup: set.setType === 'warmup',
                    loadType: set.loadType,
                    weightKg: set.weightKg,
                    reps: set.reps,
                  })),
              };
            }),
          );
          return { sessionId, blocks: blocks.filter((block) => block.sets.length > 0) };
        }),
      ),
  );

  const show = (kg: number): string => {
    const display = toDisplayWeight(Math.abs(kg), unitSystem);
    return `${String(display.value)} ${display.unit}`;
  };

  return (
    <section aria-labelledby="calendar-day" className="flex flex-col gap-3">
      <h2 id="calendar-day" className="text-lg font-semibold text-primary">
        {day.isToday ? `Today · ${dayTitle(day.date)}` : dayTitle(day.date)}
      </h2>

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : workouts.length === 0 ? (
        <div className="rounded-card border border-subtle bg-surface p-4">
          <p className="text-sm text-secondary">
            {day.isToday ? 'Nothing logged today yet.' : 'Nothing logged on this day.'}
          </p>
          {!day.isToday && !day.isFuture && (
            <div className="mt-3">
              {openWorkout ? (
                <p className="text-sm text-muted">
                  Finish the workout you have open before logging one here.{' '}
                  <Link
                    to="/workout"
                    className="font-medium text-accent underline-offset-4 hover:underline"
                  >
                    Open it
                  </Link>
                </p>
              ) : (
                <>
                  <Button variant="secondary" disabled={busy} onClick={onLogPast}>
                    + Log a workout for this day
                  </Button>
                  <p className="mt-2 text-xs text-muted">
                    For a workout you did and did not record. It is logged on this day, with no
                    timer running.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        workouts.map((workout) => {
          const minutes = trainingMinutes([workout.firstSetAt, workout.lastSetAt]);
          const detail = details.data?.find((entry) => entry.sessionId === workout.sessionId);

          return (
            <article
              key={workout.sessionId}
              className="rise rounded-card border border-subtle bg-surface p-4"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="min-w-0 truncate text-base font-semibold text-primary">
                  {workout.name ?? 'Workout'}
                </h3>
                <span className="numeric shrink-0 text-xs text-muted">
                  {/* A workout logged afterwards has a day and no time of day;
                      its noon start is a placeholder, not a fact. */}
                  {workout.source === 'past'
                    ? 'Logged afterwards'
                    : workout.startedAt.toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                </span>
              </div>
              <p className="numeric mt-0.5 text-xs text-muted">
                {workout.setCount} {workout.setCount === 1 ? 'set' : 'sets'}
                {minutes !== null && ` · ${String(minutes)} min`}
              </p>

              {detail === undefined ? (
                <p className="mt-3 text-sm text-muted">Loading…</p>
              ) : (
                <ul className="mt-3 flex flex-col gap-3">
                  {detail.blocks.map((block) => (
                    <li key={block.entryId}>
                      <p className="text-sm font-medium text-primary">{block.name}</p>
                      <ul className="mt-1.5 flex flex-wrap gap-1.5">
                        {block.sets.map((set) => (
                          <li
                            key={set.id}
                            className={cx(
                              'numeric rounded-full border border-subtle bg-elevated px-2.5 py-1 text-xs',
                              set.warmup ? 'text-muted' : 'text-secondary',
                            )}
                          >
                            {set.warmup && 'Warm-up · '}
                            {describeMark(set, block.timed, show)}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}

              <Link
                to={`/progress/session/${workout.sessionId}`}
                className="mt-3 inline-flex min-h-tap items-center gap-1 text-sm font-medium text-accent"
              >
                Open the workout
                <ChevronRightIcon className="size-4" />
              </Link>
            </article>
          );
        })
      )}
    </section>
  );
}
