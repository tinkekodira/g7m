import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import {
  DEFAULT_WEEK_START,
  byDay,
  dateKey,
  monthGrid,
  startOfMonth,
  toDisplayWeight,
  trainingMinutes,
  type CalendarDay,
  type UnitSystem,
  type WeekStart,
} from '@g7m/core';
import type { SessionSummary } from '@g7m/db';
import { cx } from '@g7m/ui';
import { HeaderLink } from '../components/HeaderLink.js';
import { ChevronRightIcon } from '../components/icons.js';
import { useCatalogue } from '../lib/db/use-catalogue.js';
import { dayLabel, dayTitle, monthTitle, selectedDay, weekdayHeadings } from './calendar-view.js';
import { describeMark } from './review-copy.js';

/**
 * This month, with the days you trained on it.
 *
 * A trained day is filled in the accent, today has a ring round it, and a day
 * that has not happened yet is faint and cannot be picked. Tap a day and its
 * workouts appear underneath — each exercise with the sets that were done —
 * with the full workout one more tap away.
 *
 * Only finished workouts with something ticked in them count as a day
 * trained, the same rule Progress uses: a workout opened and walked away from
 * is not a workout, and one still running is not finished.
 *
 * The chosen day is in the address, so coming back from a workout lands on the
 * day it was opened from rather than jumping back to today.
 */
export function CalendarScreen() {
  const now = useMemo(() => new Date(), []);
  const [params, setParams] = useSearchParams();

  const state = useCatalogue(`calendar-${dateKey(now)}`, async (r) => {
    const [profile, summaries] = await Promise.all([
      r.profile.current(),
      r.history.sessionSummaries(null),
    ]);
    const first = startOfMonth(now);
    const next = new Date(first.getFullYear(), first.getMonth() + 1, 1);

    return {
      weekStartsOn: (profile?.weekStartsOn ?? DEFAULT_WEEK_START) as WeekStart,
      unitSystem: profile?.unitSystem ?? 'metric',
      days: byDay(summaries.filter((entry) => entry.startedAt >= first && entry.startedAt < next)),
    };
  });

  const weekStartsOn = state.data?.weekStartsOn ?? DEFAULT_WEEK_START;
  const weeks = useMemo(() => monthGrid(now, now, weekStartsOn), [now, weekStartsOn]);
  const selected = selectedDay(params.get('day'), weeks);
  const days = state.data?.days ?? new Map<string, SessionSummary[]>();

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-4 px-4 pt-safe-top pb-safe-bottom">
      <header className="flex items-baseline justify-between gap-4 pt-6 pb-2">
        <h1 className="text-2xl font-semibold text-primary">Calendar</h1>
        <HeaderLink to="/">Home</HeaderLink>
      </header>

      {state.error !== null && (
        <p role="alert" className="rounded-card bg-surface p-4 text-sm text-danger">
          {state.error}
        </p>
      )}

      <section
        aria-labelledby="calendar-month"
        className="rounded-card border border-subtle bg-surface px-2 pt-4 pb-3"
      >
        <h2 id="calendar-month" className="px-2 text-lg font-semibold text-primary">
          {monthTitle(now)}
        </h2>

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
              workouts={days.get(day.key)?.length ?? 0}
              selected={day.key === selected?.key}
              onChoose={() => {
                // Replaced rather than pushed: the back button leaves the
                // calendar, rather than stepping back through every day tapped.
                setParams({ day: day.key }, { replace: true });
              }}
            />
          ))}
        </div>

        <div className="mt-2 flex items-center gap-5 px-2 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="size-3 rounded-full bg-accent" />
            Workout
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="size-3 rounded-full ring-2 ring-accent ring-inset" />
            Today
          </span>
        </div>
      </section>

      {selected !== undefined && (
        <DayWorkouts
          day={selected}
          workouts={days.get(selected.key) ?? []}
          unitSystem={state.data?.unitSystem ?? 'metric'}
          loading={state.loading}
        />
      )}
    </main>
  );
}

/**
 * One day of the grid.
 *
 * Three things a day can be at once, each drawn a different way so they can
 * all show together: trained (the circle is filled), today (a ring round the
 * circle), and the one being looked at (a tile behind it). A day from the
 * months either side is left empty, and one that has not happened yet is faint
 * and cannot be pressed.
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
          'numeric flex size-9 items-center justify-center rounded-full text-sm',
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
 */
function DayWorkouts({
  day,
  workouts,
  unitSystem,
  loading,
}: {
  readonly day: CalendarDay;
  readonly workouts: readonly SessionSummary[];
  readonly unitSystem: UnitSystem;
  readonly loading: boolean;
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
        <p className="rounded-card border border-subtle bg-surface p-4 text-sm text-secondary">
          {day.isToday ? 'Nothing logged today yet.' : 'Nothing logged on this day.'}
        </p>
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
                  {workout.startedAt.toLocaleTimeString([], {
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
