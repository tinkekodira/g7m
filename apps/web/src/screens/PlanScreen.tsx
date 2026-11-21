import { formatList, formatNumber, muscleGroupName, t } from '@g7m/i18n';
import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import {
  FOCUS_LABELS,
  GOAL_LABELS,
  formatRest,
  toDisplayWeight,
  workoutUnits,
  type LoadReason,
  type PlannedExercise,
  type UnitSystem,
} from '@g7m/core';
import { Button, SegmentedControl } from '@g7m/ui';
import { HeaderLink } from '../components/HeaderLink.js';
import { useWrite } from '../lib/db/use-catalogue.js';
import { startPlannedWorkout, useTodaysPlan } from '../lib/db/use-todays-plan.js';
import { SESSION_MINUTES } from '../lib/session-time-settings.js';
import { useSessionTimeStore } from '../lib/use-session-time.js';

/**
 * "Time today", as the segmented control's values. Strings, because that is
 * what a radio group carries; `none` is no limit.
 */
const TIME_OPTIONS = [
  ...SESSION_MINUTES.map((minutes) => ({ value: String(minutes), label: String(minutes) })),
  {
    value: 'none',
    get label() {
      return t().profile.plan.noLimit;
    },
  },
] as const;

/**
 * Today's session, generated.
 *
 * ADR-0037. The plan is adaptive rather than a fixed template per goal, so
 * everything on this screen is a decision the app made about this user this
 * week — and every one of them is shown with its reason. A plan somebody
 * cannot interrogate is a plan they cannot correct, and this one will need
 * correcting.
 *
 * Starting the workout writes the whole plan into the session as unticked
 * sets, which means the logger opens on a full workout rather than an empty
 * one. Nothing is locked: the logger can change every number, and does not
 * know or care that a generator wrote them.
 *
 * Built by `useTodaysPlan`, which Home's workout card reads too, so the card
 * and this screen can never describe two different sessions.
 */
export function PlanScreen() {
  const navigate = useNavigate();
  const now = useMemo(() => new Date(), []);
  const { profile, goal, noGoal, ready, plan, unitSystem, error, recommendationsEnabled } =
    useTodaysPlan(now);

  const { write, busy } = useWrite();
  const sessionMinutes = useSessionTimeStore((state) => state.minutes);
  const setSessionMinutes = useSessionTimeStore((state) => state.setMinutes);

  // Which alternative is showing for each slot. Empty means the generator's
  // own choice, which is the case for every slot until somebody taps.
  const [swaps, setSwaps] = useState<ReadonlyMap<string, number>>(new Map());

  /**
   * What is actually being prescribed, after any swaps.
   *
   * The generator's plan is never mutated — a swap is a view over it, so
   * tapping back and forth costs nothing and re-planning does not fight with
   * a choice somebody has already made.
   */
  const chosen = useMemo(
    () => (plan?.exercises ?? []).map((slot) => showing(slot, swaps.get(slot.exerciseId) ?? 0)),
    [plan, swaps],
  );

  async function start(): Promise<void> {
    if (plan === null || chosen.length === 0) return;

    const started = await write((r) =>
      startPlannedWorkout(r, {
        plan,
        exercises: chosen,
        bodyweightKg: profile?.bodyweightKg ?? null,
      }),
    );

    if (started !== null) void navigate('/workout');
  }

  /** One slot of the plan, with its swap, numbered by its place in the whole plan. */
  const row = (slot: PlannedExercise) => (
    <PlannedRow
      key={slot.exerciseId}
      index={(plan?.exercises ?? []).indexOf(slot)}
      slot={slot}
      choice={swaps.get(slot.exerciseId) ?? 0}
      unitSystem={unitSystem}
      onSwap={() => {
        setSwaps((previous) => {
          const next = new Map(previous);
          const options = 1 + slot.alternatives.length;
          next.set(slot.exerciseId, ((previous.get(slot.exerciseId) ?? 0) + 1) % options);
          return next;
        });
      }}
    />
  );

  if (profile !== null && !recommendationsEnabled) return <Navigate to="/" replace />;

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-4 px-4 pt-safe-top pb-safe-bottom">
      <header className="flex items-start justify-between gap-3 pt-6 pb-2">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-primary">{t().profile.plan.title}</h1>
          {goal !== null && (
            <p className="mt-1 text-sm text-secondary">
              {t().profile.plan.builtFor(GOAL_LABELS[goal.goal], goal.daysPerWeek)}
            </p>
          )}
        </div>
        <HeaderLink to="/">{t().common.home}</HeaderLink>
      </header>

      {error !== null && (
        <p role="alert" className="rounded-card bg-surface p-4 text-sm text-destructive">
          {error}
        </p>
      )}

      {noGoal ? (
        <NoGoal />
      ) : !ready || plan === null ? (
        <p className="rounded-card bg-surface p-4 text-sm text-muted">{t().profile.plan.working}</p>
      ) : chosen.length === 0 ? (
        <WeekDone rested={plan.restedGroups} />
      ) : (
        <>
          {/* How long there is today. The coach pairs exercises into
              supersets only when the plan will not fit it (ADR-0112). */}
          <section className="rounded-card bg-surface p-4">
            <p className="mb-2 text-sm font-medium text-primary">{t().profile.plan.timeToday}</p>
            <SegmentedControl
              label={t().profile.plan.timeLabel}
              options={TIME_OPTIONS}
              value={sessionMinutes === null ? 'none' : String(sessionMinutes)}
              onChange={(value) => {
                const minutes = SESSION_MINUTES.find((option) => String(option) === value);
                setSessionMinutes(minutes ?? null);
              }}
            />
          </section>

          <section className="rounded-card bg-accent px-4 py-3 text-on-accent">
            <p className="text-xs uppercase opacity-80">{FOCUS_LABELS[plan.focus]}</p>
            <p className="text-xl font-semibold">
              {chosen.length} exercises · {totalSets(chosen)} working sets
            </p>
            <p className="numeric mt-1 text-sm opacity-90">
              {plan.pairedForTime && sessionMinutes !== null
                ? t().profile.plan.paired(sessionMinutes, plan.estimatedMinutes)
                : t().profile.plan.about(plan.estimatedMinutes)}
            </p>
            {plan.trimmedForTime.length > 0 && (
              // Said, because a missing exercise with no reason reads as the
              // app forgetting it. Only after pairing could not make room.
              <p className="mt-1 text-sm opacity-90">
                {t().profile.plan.leftOut(listOf(plan.trimmedForTime))}
              </p>
            )}
            {plan.restedGroups.length > 0 && (
              // The adaptation, said out loud. Somebody who does not know why
              // their chest is missing today assumes the app forgot.
              <p className="mt-1 text-sm opacity-90">
                {t().profile.plan.resting(listOf(plan.restedGroups.map(groupName)))}
              </p>
            )}
          </section>

          <ol className="flex flex-col gap-3">
            {workoutUnits(plan.exercises, (slot) => slot.superset).map((unit) =>
              unit.kind === 'single' ? (
                row(unit.item)
              ) : (
                <li
                  key={unit.supersetId}
                  aria-label={t().profile.plan.superset}
                  className="flex flex-col gap-3 rounded-card border-l-4 border-subtle pl-2"
                >
                  <p className="px-2 text-xs font-semibold tracking-wide text-accent uppercase">
                    {t().profile.plan.supersetRest}
                  </p>
                  <ol className="flex flex-col gap-3">{unit.members.map(row)}</ol>
                </li>
              ),
            )}
          </ol>

          <Button
            size="lg"
            fullWidth
            disabled={busy}
            onClick={() => {
              void start();
            }}
          >
            {busy ? t().home.today.settingUp : t().profile.plan.start}
          </Button>

          <p className="text-sm text-muted">{t().profile.plan.startingPoint}</p>
        </>
      )}

      <p className="py-6 text-xs text-muted">{t().settings.disclaimer}</p>
    </main>
  );
}

/**
 * One slot in the session: the chosen exercise, and the next one behind it.
 *
 * The alternative sits underneath, faded and smaller, and tapping it brings it
 * forward while the current one falls back. It exists because the generator
 * will sometimes be wrong — a lift somebody's shoulder does not like, a machine
 * their gym does not have — and the difference between an app you can correct
 * and one you cannot is whether that costs a tap or a fight.
 *
 * Both cards are always rendered and only their transform and opacity change,
 * so the browser animates between them instead of tearing one out and putting
 * another in. `prefers-reduced-motion` turns the movement off and leaves the
 * swap instant, which is still a swap.
 */
function PlannedRow({
  index,
  slot,
  choice,
  unitSystem,
  onSwap,
}: {
  readonly index: number;
  readonly slot: PlannedExercise;
  /** 0 is the generator's own pick; 1 and 2 are the alternatives. */
  readonly choice: number;
  readonly unitSystem: UnitSystem;
  readonly onSwap: () => void;
}) {
  const options = [slot, ...slot.alternatives];
  const current = showing(slot, choice);
  const next = options[(choice + 1) % options.length];
  const swappable = options.length > 1 && next !== undefined;

  return (
    <li className="rounded-card border border-subtle bg-surface p-4">
      <Prescribed index={index} exercise={current} unitSystem={unitSystem} />

      {swappable && (
        <button
          type="button"
          onClick={onSwap}
          aria-label={t().profile.plan.swapTo(next.name)}
          className="mt-3 flex min-h-tap w-full items-center justify-between gap-3 rounded-control border border-subtle px-3 text-left opacity-55 transition-[opacity,transform] duration-200 ease-out select-none active:scale-[0.98] hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none"
        >
          <span className="min-w-0 truncate text-sm text-primary">{next.name}</span>
          <span className="numeric shrink-0 text-xs text-muted">
            {next.suggestedKg === null
              ? t().profile.plan.swap
              : `${formatNumber(toDisplayWeight(next.suggestedKg, unitSystem).value)} ${
                  toDisplayWeight(next.suggestedKg, unitSystem).unit
                }`}
          </span>
        </button>
      )}
    </li>
  );
}

/** The exercise as it will be logged, at full weight. */
function Prescribed({
  index,
  exercise,
  unitSystem,
}: {
  readonly index: number;
  readonly exercise: PlannedExercise;
  readonly unitSystem: UnitSystem;
}) {
  const load =
    exercise.suggestedKg === null ? null : toDisplayWeight(exercise.suggestedKg, unitSystem);

  return (
    <div className="transition-transform duration-200 ease-out motion-reduce:transition-none">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="min-w-0 text-base font-semibold text-primary">
          <span className="text-muted">{index + 1}. </span>
          {exercise.name}
        </h2>
        <span className="numeric shrink-0 text-sm text-secondary">
          {exercise.sets} × {exercise.repLow}–{exercise.repHigh}
        </span>
      </div>

      <p className="numeric mt-1 text-lg text-primary">
        {load === null ? t().profile.plan.findWeight : `${formatNumber(load.value)} ${load.unit}`}
      </p>

      <p className="mt-1 text-sm text-secondary">{describeReason(exercise.reason, unitSystem)}</p>
      <p className="mt-2 text-xs text-muted">
        {t().profile.plan.rest(groupName(exercise.groupSlug), formatRest(exercise.restSeconds))}
      </p>
    </div>
  );
}

/** The option currently in front for a slot. Index 0 is the generator's pick. */
function showing(slot: PlannedExercise, choice: number): PlannedExercise {
  if (choice === 0) return slot;
  return slot.alternatives[choice - 1] ?? slot;
}

function totalSets(exercises: readonly PlannedExercise[]): number {
  return exercises.reduce((total, entry) => total + entry.sets, 0);
}

/**
 * Why this weight.
 *
 * The whole reason `LoadReason` is a union rather than a string: the decision
 * is testable in core and the wording lives here, where changing it does not
 * break a test about programming.
 */
function describeReason(reason: LoadReason, unitSystem: UnitSystem): string {
  const show = (kg: number): string => {
    const display = toDisplayWeight(kg, unitSystem);
    return `${formatNumber(display.value)} ${display.unit}`;
  };

  switch (reason.kind) {
    case 'progress':
      return t().profile.plan.reasons.progress(show(reason.fromKg));
    case 'jump':
      // The one thing counting reps cannot tell you, so it is worth naming.
      return t().profile.plan.reasons.jump(show(reason.fromKg), reason.repsInReserve);
    case 'deload':
      return t().profile.plan.reasons.deload(reason.misses, show(reason.fromKg));
    case 'repeat':
      return t().profile.plan.reasons.repeat(reason.reps, show(reason.kg));
    case 'returning':
      return t().profile.plan.reasons.returning(reason.daysAway, show(reason.fromKg));
    case 'first_time':
      return t().profile.plan.reasons.firstTime;
  }
}

function NoGoal() {
  return (
    <section className="rounded-card bg-surface p-4">
      <h2 className="text-lg font-semibold text-primary">{t().profile.plan.noGoalTitle}</h2>
      <p className="mt-1 text-sm text-secondary">{t().profile.plan.noGoalBody}</p>
      <Link
        to="/goal"
        className="mt-3 inline-flex min-h-tap items-center rounded-control bg-accent px-4 text-base font-semibold text-on-accent"
      >
        {t().profile.plan.chooseGoal}
      </Link>
    </section>
  );
}

function WeekDone({ rested }: { readonly rested: readonly string[] }) {
  return (
    <section className="rounded-card bg-surface p-4">
      <h2 className="text-lg font-semibold text-primary">{t().profile.plan.weekDone}</h2>
      <p className="mt-1 text-sm text-secondary">
        {t().profile.plan.weekDoneBody(listOf(rested.map(groupName)))}
      </p>
      {/* Not a lock. Somebody who wants to train anyway is allowed to. */}
      <Link
        to="/workout"
        className="mt-3 inline-flex min-h-tap items-center rounded-control border border-subtle bg-elevated px-4 text-sm font-medium text-primary"
      >
        {t().profile.plan.trainAnyway}
      </Link>
    </section>
  );
}

function listOf(items: readonly string[]): string {
  return formatList(items);
}

/** A muscle group's name in the language speaking, from its slug. */
function groupName(slug: string): string {
  return muscleGroupName(slug) ?? slug;
}
