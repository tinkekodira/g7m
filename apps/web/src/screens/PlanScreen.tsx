import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  DEFAULT_WEEK_START,
  FOCUS_LABELS,
  GOAL_LABELS,
  formatRest,
  nextFocus,
  planSession,
  prescriptionFor,
  splitFor,
  startOfWeek,
  toDisplayWeight,
  type LoadReason,
  type PlannedExercise,
  type PlannedSession,
  type UnitSystem,
  type WeekStart,
} from '@g7m/core';
import { Button } from '@g7m/ui';
import { HeaderLink } from '../components/HeaderLink.js';
import { useCatalogue, useWrite } from '../lib/db/use-catalogue.js';

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
 */
export function PlanScreen() {
  const navigate = useNavigate();
  const now = useMemo(() => new Date(), []);

  const profile = useCatalogue('profile', (r) => r.profile.current());
  const goal = useCatalogue('goal-current', (r) => r.goals.current());

  const weekStartsOn = (profile.data?.weekStartsOn ?? DEFAULT_WEEK_START) as WeekStart;
  const weekStart = useMemo(() => startOfWeek(now, weekStartsOn), [now, weekStartsOn]);
  const weekKey = weekStart.toISOString();

  const catalogue = useCatalogue('plan-candidates', (r) => r.planner.candidates());
  const performances = useCatalogue('plan-performances', (r) => r.planner.lastPerformances());
  const weekSets = useCatalogue(`plan-week-${weekKey}`, (r) =>
    r.planner.setsByGroupSince(weekStart),
  );
  const sessionsThisWeek = useCatalogue(`plan-sessions-${weekKey}`, (r) =>
    r.planner.sessionCountSince(weekStart),
  );

  const { write, busy } = useWrite();

  const unitSystem: UnitSystem = profile.data?.unitSystem ?? 'metric';
  const ready =
    goal.data !== null &&
    catalogue.data !== null &&
    performances.data !== null &&
    weekSets.data !== null &&
    sessionsThisWeek.data !== null;

  const plan = useMemo<PlannedSession | null>(() => {
    if (
      goal.data === null ||
      catalogue.data === null ||
      performances.data === null ||
      weekSets.data === null ||
      sessionsThisWeek.data === null
    ) {
      return null;
    }

    const experience = profile.data?.experienceLevel ?? null;
    const prescription = prescriptionFor(goal.data.goal, experience);
    const split = splitFor(goal.data.daysPerWeek, experience);

    return planSession({
      focus: nextFocus(split, sessionsThisWeek.data),
      prescription,
      catalogue: catalogue.data,
      history: performances.data,
      setsThisWeekByGroup: weekSets.data,
      now,
    });
  }, [
    goal.data,
    catalogue.data,
    performances.data,
    weekSets.data,
    sessionsThisWeek.data,
    profile.data,
    now,
  ]);

  async function start(): Promise<void> {
    if (plan === null || plan.exercises.length === 0) return;

    const started = await write(async (r) => {
      const session = await r.sessions.start({
        source: 'generated',
        name: FOCUS_LABELS[plan.focus],
        bodyweightKg: profile.data?.bodyweightKg ?? null,
      });

      for (const exercise of plan.exercises) {
        const slot = await r.sessions.addExercise(session.id, exercise.exerciseId);
        // The sets go in unticked. The logger opens on a full workout, every
        // number of which it is free to change — it does not know a generator
        // wrote them, and nothing here is locked.
        for (let index = 0; index < exercise.sets; index++) {
          await r.sessions.addSet(slot.id, {
            weightKg: exercise.suggestedKg ?? 0,
            reps: exercise.repLow,
            loadType: exercise.loadType,
            setType: 'working',
          });
        }
      }
      return session;
    });

    if (started !== null) void navigate('/workout');
  }

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-4 px-4 pt-safe-top pb-safe-bottom">
      <header className="flex items-start justify-between gap-3 pt-6 pb-2">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-primary">Today’s session</h1>
          {goal.data !== null && (
            <p className="mt-1 text-sm text-secondary">
              Built for {GOAL_LABELS[goal.data.goal].toLowerCase()}, {goal.data.daysPerWeek} days a
              week.
            </p>
          )}
        </div>
        <HeaderLink to="/">Home</HeaderLink>
      </header>

      {(profile.error ?? goal.error ?? catalogue.error) !== null && (
        <p role="alert" className="rounded-card bg-surface p-4 text-sm text-danger">
          {profile.error ?? goal.error ?? catalogue.error}
        </p>
      )}

      {goal.data === null && !goal.loading ? (
        <NoGoal />
      ) : !ready || plan === null ? (
        <p className="rounded-card bg-surface p-4 text-sm text-muted">Working out your session…</p>
      ) : plan.exercises.length === 0 ? (
        <WeekDone rested={plan.restedGroups} />
      ) : (
        <>
          <section className="rounded-card bg-accent px-4 py-3 text-on-accent">
            <p className="text-xs uppercase opacity-80">{FOCUS_LABELS[plan.focus]}</p>
            <p className="text-xl font-semibold">
              {plan.exercises.length} exercises · {plan.totalSets} working sets
            </p>
            {plan.restedGroups.length > 0 && (
              // The adaptation, said out loud. Somebody who does not know why
              // their chest is missing today assumes the app forgot.
              <p className="mt-1 text-sm opacity-90">
                Resting {listOf(plan.restedGroups)} — already done for the week.
              </p>
            )}
          </section>

          <ol className="flex flex-col gap-3">
            {plan.exercises.map((exercise, index) => (
              <PlannedRow
                key={exercise.exerciseId}
                index={index}
                exercise={exercise}
                unitSystem={unitSystem}
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

function PlannedRow({
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
    <li className="rounded-card border border-subtle bg-surface p-4">
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
    </li>
  );
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
