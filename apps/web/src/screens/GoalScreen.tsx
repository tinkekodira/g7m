import { useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_DAYS_PER_WEEK,
  GOAL_DESCRIPTIONS,
  goalExpectation,
  GOAL_LABELS,
  MAX_DAYS_PER_WEEK,
  MIN_DAYS_PER_WEEK,
  TRAINING_GOALS,
  daysBetween,
  startOfDay,
  suggestGoal,
  weightTrend,
  type Sex,
  type TrainingGoal,
} from '@g7m/core';
import type { BodyMetric, Goal } from '@g7m/db';
import { Button, Stepper } from '@g7m/ui';
import { HeaderLink } from '../components/HeaderLink.js';
import { useCatalogue, useWrite } from '../lib/db/use-catalogue.js';

/**
 * What the lifter is training for.
 *
 * The second half of what ADR-0032 said the generator needs. The screen's one
 * job is to capture a decision, and it goes out of its way not to make that
 * decision on the user's behalf: the four goals are presented with what each
 * one does to the training and what is realistic to expect, and the suggestion
 * — when there is one at all — is drawn from what their weight has already
 * been doing rather than from any opinion about their body. ADR-0035.
 */

/** Long enough for a rate to mean something, matching the metrics screen. */
const TREND_WEEKS = 12;

export function GoalScreen() {
  const now = useMemo(() => new Date(), []);
  const from = useMemo(() => {
    const start = startOfDay(now);
    start.setDate(start.getDate() - TREND_WEEKS * 7);
    return start;
  }, [now]);

  const profile = useCatalogue('profile', (r) => r.profile.current());
  const goal = useCatalogue('goal-current', (r) => r.goals.current());
  const past = useCatalogue('goal-history', (r) => r.goals.history());
  const readings = useCatalogue(`goal-trend-${from.toISOString()}`, (r) =>
    r.bodyMetrics.between({ from }),
  );

  const { write, busy } = useWrite();

  const current = goal.data ?? null;
  const [days, setDays] = useState(DEFAULT_DAYS_PER_WEEK);

  // Seeded from the stored goal once it arrives, not on every render — the
  // stepper is a live control and resetting it under a thumb would be a bug.
  useEffect(() => {
    if (current !== null) setDays(current.daysPerWeek);
  }, [current]);

  const trend = weightTrend(
    (readings.data ?? [])
      .filter((entry): entry is BodyMetric & { weightKg: number } => entry.weightKg !== null)
      .map((entry) => ({ at: entry.recordedAt, weightKg: entry.weightKg })),
  );

  // Only before a goal exists. Once somebody has decided, an unprompted
  // suggestion is the app second-guessing them, and the honest version of that
  // conversation is the feedback loop reading their actual training.
  const suggestion =
    current === null
      ? suggestGoal({
          trend,
          experienceLevel: profile.data?.experienceLevel ?? null,
        })
      : null;

  async function choose(next: TrainingGoal): Promise<void> {
    if (current?.goal === next) return;
    await write((r) => r.goals.set({ goal: next, daysPerWeek: days }));
  }

  /**
   * Training frequency corrects the row in place rather than appending.
   *
   * Appending would be the consistent-looking thing and it would be wrong:
   * `started_at` means "when this goal began", and moving from four days to
   * five is a change to the schedule, not a new goal. Appending would reset
   * the clock and the feedback loop would report an eleven-week cut as new.
   */
  async function changeDays(next: number): Promise<void> {
    setDays(next);
    if (current === null) return;
    await write((r) => r.goals.correct(current.id, { daysPerWeek: next }));
  }

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-4 px-4 pt-safe-top pb-safe-bottom">
      <header className="flex items-start justify-between gap-3 pt-6 pb-2">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-primary">Your goal</h1>
          <p className="mt-1 text-sm text-secondary">
            What the training is for. You can change it whenever you like.
          </p>
        </div>
        <HeaderLink to="/you">You</HeaderLink>
      </header>

      {(profile.error ?? goal.error ?? readings.error) !== null && (
        <p role="alert" className="rounded-card bg-surface p-4 text-sm text-danger">
          {profile.error ?? goal.error ?? readings.error}
        </p>
      )}

      {current !== null && <CurrentGoal goal={current} now={now} />}

      {suggestion !== null && (
        <section className="rounded-card border border-accent/40 bg-surface p-4">
          <h2 className="text-sm font-semibold text-accent">Based on what you have been doing</h2>
          <p className="mt-1 text-base text-primary">{GOAL_LABELS[suggestion.goal]}</p>
          <p className="mt-1 text-sm text-secondary">{suggestion.because}</p>
        </section>
      )}

      <section className="rounded-card bg-surface p-4">
        <h2 className="mb-1 text-lg font-semibold text-primary">Days a week</h2>
        <p className="mb-3 text-sm text-muted">
          How often you can realistically train. Answer for a bad week, not a good one — the plan is
          built to fit this exactly.
        </p>
        <Stepper
          label="Training days per week"
          value={days}
          min={MIN_DAYS_PER_WEEK}
          max={MAX_DAYS_PER_WEEK}
          step={1}
          disabled={busy}
          onChange={(next) => {
            void changeDays(next);
          }}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-primary">
          {current === null ? 'Pick one' : 'Change it'}
        </h2>
        {TRAINING_GOALS.map((option) => (
          <GoalCard
            key={option}
            goal={option}
            selected={current?.goal === option}
            suggested={suggestion?.goal === option}
            busy={busy}
            sex={profile.data?.sex ?? null}
            onChoose={() => {
              void choose(option);
            }}
          />
        ))}
      </section>

      {past.data !== null && past.data.length > 1 && <PastGoals goals={past.data} />}

      <p className="py-6 text-xs text-muted">
        Educational content, not medical advice. Consult a professional before starting a program.
      </p>
    </main>
  );
}

function CurrentGoal({ goal, now }: { readonly goal: Goal; readonly now: Date }) {
  return (
    <section className="rounded-card bg-accent px-4 py-3 text-on-accent">
      <p className="text-xs uppercase opacity-80">Training for</p>
      <p className="text-xl font-semibold">{GOAL_LABELS[goal.goal]}</p>
      <p className="mt-1 text-sm opacity-90">
        {goal.daysPerWeek} {goal.daysPerWeek === 1 ? 'day' : 'days'} a week ·{' '}
        {describeRun(goal.startedAt, now)}
      </p>
    </section>
  );
}

function GoalCard({
  goal,
  selected,
  suggested,
  busy,
  sex,
  onChoose,
}: {
  readonly goal: TrainingGoal;
  readonly selected: boolean;
  readonly suggested: boolean;
  readonly busy: boolean;
  /** Changes the pace quoted for building muscle, and nothing else. */
  readonly sex: Sex | null;
  readonly onChoose: () => void;
}) {
  return (
    <article
      className={`rounded-card p-4 ${
        selected ? 'border border-accent bg-elevated' : 'border border-subtle bg-surface'
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-base font-semibold text-primary">{GOAL_LABELS[goal]}</h3>
        {suggested && !selected && <span className="text-xs text-accent">Suggested</span>}
      </div>

      <p className="mt-1 text-sm text-secondary">{GOAL_DESCRIPTIONS[goal]}</p>
      {/* The honest pace, before they start, so a slow week is not a failure. */}
      <p className="mt-2 text-sm text-muted">{goalExpectation(goal, sex)}</p>

      <div className="mt-3">
        <Button
          variant={selected ? 'secondary' : 'primary'}
          disabled={busy || selected}
          onClick={onChoose}
        >
          {selected ? 'Current goal' : `Train for this`}
        </Button>
      </div>
    </article>
  );
}

function PastGoals({ goals }: { readonly goals: readonly Goal[] }) {
  return (
    <section className="rounded-card bg-surface p-4">
      <h2 className="mb-3 text-lg font-semibold text-primary">Before this</h2>
      <ul className="flex flex-col">
        {goals.slice(1).map((goal, index) => (
          <li
            key={goal.id}
            className="flex items-baseline justify-between gap-3 border-b border-subtle py-2 last:border-b-0"
          >
            <span className="text-sm text-primary">{GOAL_LABELS[goal.goal]}</span>
            {/* How long it ran, not when it started. The list is newest first,
                so what replaced this one is the entry above it — and "eleven
                weeks" is the part worth knowing about a goal you abandoned. */}
            <span className="text-xs text-muted">
              {describeSpan(goal.startedAt, goals[index]?.startedAt)}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-muted">
        Kept because how long something ran is part of whether it worked.
      </p>
    </section>
  );
}

/** How long a goal was in force before the next one replaced it. */
function describeSpan(from: Date, until: Date | undefined): string {
  if (until === undefined) return '';
  const days = daysBetween(from, until);
  if (days < 14) return `${String(Math.max(days, 0))} days`;
  return `${String(Math.floor(days / 7))} weeks`;
}

/** "Started today", "3 weeks in" — the length of the run, not a date. */
function describeRun(startedAt: Date, now: Date): string {
  const days = daysBetween(startedAt, now);
  if (days <= 0) return 'started today';
  if (days === 1) return 'one day in';
  if (days < 14) return `${String(days)} days in`;
  return `${String(Math.floor(days / 7))} weeks in`;
}
