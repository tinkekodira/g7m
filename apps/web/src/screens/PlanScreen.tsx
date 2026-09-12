import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  FOCUS_LABELS,
  GOAL_LABELS,
  formatRest,
  toDisplayWeight,
  type LoadReason,
  type PlannedExercise,
  type UnitSystem,
} from '@g7m/core';
import { Button } from '@g7m/ui';
import { HeaderLink } from '../components/HeaderLink.js';
import { useWrite } from '../lib/db/use-catalogue.js';
import { startPlannedWorkout, useTodaysPlan } from '../lib/db/use-todays-plan.js';

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
  const { profile, goal, noGoal, ready, plan, unitSystem, error } = useTodaysPlan(now);

  const { write, busy } = useWrite();

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

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-4 px-4 pt-safe-top pb-safe-bottom">
      <header className="flex items-start justify-between gap-3 pt-6 pb-2">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-primary">Today’s session</h1>
          {goal !== null && (
            <p className="mt-1 text-sm text-secondary">
              Built for {GOAL_LABELS[goal.goal].toLowerCase()}, {goal.daysPerWeek} days a week.
            </p>
          )}
        </div>
        <HeaderLink to="/">Home</HeaderLink>
      </header>

      {error !== null && (
        <p role="alert" className="rounded-card bg-surface p-4 text-sm text-danger">
          {error}
        </p>
      )}

      {noGoal ? (
        <NoGoal />
      ) : !ready || plan === null ? (
        <p className="rounded-card bg-surface p-4 text-sm text-muted">Working out your session…</p>
      ) : chosen.length === 0 ? (
        <WeekDone rested={plan.restedGroups} />
      ) : (
        <>
          <section className="rounded-card bg-accent px-4 py-3 text-on-accent">
            <p className="text-xs uppercase opacity-80">{FOCUS_LABELS[plan.focus]}</p>
            <p className="text-xl font-semibold">
              {chosen.length} exercises · {totalSets(chosen)} working sets
            </p>
            {plan.restedGroups.length > 0 && (
              // The adaptation, said out loud. Somebody who does not know why
              // their chest is missing today assumes the app forgot.
              <p className="mt-1 text-sm opacity-90">
                Suggest resting {listOf(plan.restedGroups)} — already covered in the last 7 days.
              </p>
            )}
          </section>

          <ol className="flex flex-col gap-3">
            {plan.exercises.map((slot, index) => (
              <PlannedRow
                key={slot.exerciseId}
                index={index}
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
            ))}
          </ol>

          <Button
            size="lg"
            fullWidth
            disabled={busy}
            onClick={() => {
              void start();
            }}
          >
            {busy ? 'Setting it up…' : 'Start this workout'}
          </Button>

          <p className="text-sm text-muted">
            Every number here is a starting point. Change anything you like once you are in — the
            logger does not know a generator wrote them.
          </p>
        </>
      )}

      <p className="py-6 text-xs text-muted">
        Educational content, not medical advice. Consult a professional before starting a program.
      </p>
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
          aria-label={`Swap to ${next.name}`}
          className="mt-3 flex min-h-tap w-full items-center justify-between gap-3 rounded-control border border-subtle px-3 text-left opacity-55 transition-[opacity,transform] duration-200 ease-out select-none active:scale-[0.98] hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none"
        >
          <span className="min-w-0 truncate text-sm text-primary">{next.name}</span>
          <span className="numeric shrink-0 text-xs text-muted">
            {next.suggestedKg === null
              ? 'swap'
              : `${String(toDisplayWeight(next.suggestedKg, unitSystem).value)} ${
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
        {load === null ? 'Find your weight' : `${String(load.value)} ${load.unit}`}
      </p>

      <p className="mt-1 text-sm text-secondary">{describeReason(exercise.reason, unitSystem)}</p>
      <p className="mt-2 text-xs text-muted">
        {exercise.groupSlug} · {formatRest(exercise.restSeconds)} rest
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
    return `${String(display.value)} ${display.unit}`;
  };

  switch (reason.kind) {
    case 'progress':
      return `You finished the range at ${show(reason.fromKg)} last time — go up.`;
    case 'jump':
      // The one thing counting reps cannot tell you, so it is worth naming.
      return `You finished the range at ${show(reason.fromKg)} with ${String(reason.repsInReserve)} reps left. That is a bigger step than usual.`;
    case 'deload':
      return `${String(reason.misses)} sessions short of the range at ${show(reason.fromKg)}. Back off, then run at it again.`;
    case 'repeat':
      return `You did ${String(reason.reps)} at ${show(reason.kg)} last time. Same weight, more reps.`;
    case 'returning':
      return `It has been ${String(reason.daysAway)} days. Starting under your ${show(reason.fromKg)} to build back into it.`;
    case 'first_time':
      return 'First time here — pick something you could do two or three more reps with.';
  }
}

function NoGoal() {
  return (
    <section className="rounded-card bg-surface p-4">
      <h2 className="text-lg font-semibold text-primary">Pick a goal first</h2>
      <p className="mt-1 text-sm text-secondary">
        The session is built from what you are training for and how many days a week you have. It
        takes about ten seconds.
      </p>
      <Link
        to="/goal"
        className="mt-3 inline-flex min-h-tap items-center rounded-control bg-accent px-4 text-base font-semibold text-on-accent"
      >
        Choose a goal
      </Link>
    </section>
  );
}

function WeekDone({ rested }: { readonly rested: readonly string[] }) {
  return (
    <section className="rounded-card bg-surface p-4">
      <h2 className="text-lg font-semibold text-primary">You have done the week</h2>
      <p className="mt-1 text-sm text-secondary">
        Everything this session would train has already had its sets: {listOf(rested)}. Another
        session now would cost more recovery than it buys.
      </p>
      {/* Not a lock. Somebody who wants to train anyway is allowed to. */}
      <Link
        to="/workout"
        className="mt-3 inline-flex min-h-tap items-center rounded-control border border-subtle bg-elevated px-4 text-sm font-medium text-primary"
      >
        Train anyway
      </Link>
    </section>
  );
}

function listOf(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1] ?? ''}`;
}
