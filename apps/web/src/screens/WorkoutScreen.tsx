import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button, Stepper, TextField } from '@g7m/ui';
import {
  WEIGHT_FIELD_MEANING,
  formatRest,
  fromDisplayWeight,
  incrementKgFor,
  naturalLoadType,
  nextSetTemplate,
  previousSetAt,
  restSecondsFor,
  rirToRpe,
  toDisplayWeight,
  totalVolumeKg,
  type LoadType,
  type SetTemplate,
  type UnitSystem,
} from '@g7m/core';
import type { Exercise, Profile, SessionSet, WorkoutSession } from '@g7m/db';
import { useCatalogue, useWrite } from '../lib/db/use-catalogue.js';
import { HeaderLink } from '../components/HeaderLink.js';
import { formatElapsed, isRestOver, looksAbandoned, restRemaining } from './workout-timer.js';

/**
 * The logger.
 *
 * Brief §6 wants a set logged in under three seconds, one-handed, offline.
 * Everything here serves that: the numbers are prefilled before you arrive at
 * the row, the tick is the largest target on the screen, and every write is a
 * local SQLite statement with no network in the path.
 */

interface ExerciseBlock {
  readonly sessionExerciseId: string;
  readonly exercise: Exercise | null;
  readonly sets: readonly SessionSet[];
  readonly previous: readonly SetTemplate[];
  readonly loadType: LoadType;
  readonly restSeconds: number;
}

interface Workout {
  readonly session: WorkoutSession;
  readonly profile: Profile | null;
  readonly blocks: readonly ExerciseBlock[];
}

export function WorkoutScreen() {
  const navigate = useNavigate();
  const { write, busy, error: writeError } = useWrite();

  const [now, setNow] = useState(() => new Date());
  const [rest, setRest] = useState<{ startedAt: Date; seconds: number } | null>(null);

  const state = useCatalogue<Workout | null>('workout', async (repositories) => {
    const session = await repositories.sessions.active();
    if (session === null) return null;

    const [profile, entries] = await Promise.all([
      repositories.profile.current(),
      repositories.sessions.exercisesFor(session.id),
    ]);

    const blocks = await Promise.all(
      entries.map(async (entry): Promise<ExerciseBlock> => {
        const [exercise, sets, previous, equipment] = await Promise.all([
          repositories.exercises.byId(entry.exerciseId),
          repositories.sessions.setsFor(entry.id),
          repositories.sessions.lastPerformance(entry.exerciseId, session.id),
          repositories.exercises.equipmentFor(entry.exerciseId),
        ]);

        return {
          sessionExerciseId: entry.id,
          exercise,
          sets,
          previous,
          loadType: naturalLoadType(equipment.map((item) => item.category)),
          restSeconds: restSecondsFor({
            exerciseSeconds: exercise?.defaultRestSeconds ?? null,
            profileSeconds: profile?.restSecondsDefault ?? null,
            mechanic: exercise?.mechanic ?? 'compound',
          }),
        };
      }),
    );

    return { session, profile, blocks };
  });

  /**
   * One clock for the whole screen, ticking only while something needs it.
   *
   * Both timers read the difference between two dates rather than counting
   * down, so this interval exists purely to force a re-render — which means a
   * phone that slept through the last four minutes shows the right numbers the
   * instant it wakes, without any catching up.
   */
  const workout = state.data;
  const ticking = workout !== null;
  useEffect(() => {
    if (!ticking) return;
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [ticking]);

  const remaining = restRemaining(rest?.startedAt ?? null, rest?.seconds ?? 0, now);

  if (state.error !== null) {
    return (
      <Shell>
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      </Shell>
    );
  }

  if (state.loading) {
    return (
      <Shell>
        <p className="text-sm text-muted">Loading…</p>
      </Shell>
    );
  }

  if (workout === null) {
    return (
      <Shell>
        <StartWorkout
          busy={busy}
          onStart={() => {
            void (async () => {
              // The bodyweight is snapshotted at the start when it is known.
              // When it is not, the prompt below fills it in later and
              // backfills this session — see `setBodyweight`.
              const profile = await write((r) => r.profile.current());
              await write((r) => r.sessions.start({ bodyweightKg: profile?.bodyweightKg ?? null }));
            })();
          }}
        />
      </Shell>
    );
  }

  const { session, profile, blocks } = workout;
  const unitSystem: UnitSystem = profile?.unitSystem ?? 'metric';
  const allSets = blocks.flatMap((block) =>
    block.sets.map((set) => ({
      setType: set.setType,
      loadType: set.loadType,
      weightKg: set.weightKg,
      reps: set.reps,
      isCompleted: set.isCompleted,
    })),
  );
  const volume = totalVolumeKg(allSets, session.bodyweightKg);
  const needsBodyweight =
    session.bodyweightKg === null && blocks.some((block) => block.loadType !== 'external');

  return (
    <Shell>
      <header className="flex items-baseline justify-between gap-4 pt-6 pb-2">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Workout</h1>
          <p className="numeric mt-1 text-sm text-secondary">
            {formatElapsed(session.startedAt, now)} elapsed
            {volume.countedSets > 0 && ` · ${String(Math.round(volume.volumeKg))} kg lifted`}
          </p>
        </div>
        <HeaderLink to="/">Home</HeaderLink>
      </header>

      {writeError !== null && (
        <p role="alert" className="text-sm text-danger">
          {writeError}
        </p>
      )}

      {looksAbandoned(session.startedAt, now) && (
        <p className="rounded-card bg-surface p-4 text-sm text-secondary">
          This workout has been open for hours. If you finished a while ago, end it now — the
          elapsed time is stored with it.
        </p>
      )}

      {needsBodyweight && (
        <BodyweightPrompt
          unitSystem={unitSystem}
          busy={busy}
          onSave={(kg) => {
            void (async () => {
              /**
               * Three writes, and each one is a different question.
               *
               * `body_metrics` is the append-only series the coaching loop
               * reads — "is losing fat working" is a question about a trend
               * (ADR-0032). `profiles` is the current value, read at the start
               * of the next workout. The session is the snapshot that makes
               * the sets already logged in *this* one measurable.
               */
              await write((r) => r.bodyMetrics.record({ weightKg: kg }));
              await write((r) => r.profile.update({ bodyweightKg: kg }));
              await write((r) => r.sessions.setBodyweight(session.id, kg));
            })();
          }}
        />
      )}

      {volume.unknownSets > 0 && !needsBodyweight && (
        <p className="text-sm text-muted">
          {volume.unknownSets === 1 ? 'One set is' : `${String(volume.unknownSets)} sets are`} not
          counted in the total — they need a bodyweight to measure against.
        </p>
      )}

      {blocks.map((block) => (
        <ExerciseCard
          key={block.sessionExerciseId}
          block={block}
          unitSystem={unitSystem}
          busy={busy}
          onAddSet={() => {
            void write((r) =>
              r.sessions.addSet(
                block.sessionExerciseId,
                nextSetTemplate({
                  current: block.sets,
                  previous: block.previous,
                  repLow: block.exercise?.defaultRepLow ?? 8,
                  loadType: block.loadType,
                }),
              ),
            );
          }}
          onComplete={(setId, changes) => {
            void write((r) => r.sessions.completeSet(setId, changes));
            setRest({ startedAt: new Date(), seconds: block.restSeconds });
          }}
          onUncomplete={(setId) => {
            void write((r) => r.sessions.uncompleteSet(setId));
          }}
          onSave={(setId, changes) => {
            void write((r) => r.sessions.updateSet(setId, changes));
          }}
          onRemoveSet={(setId) => {
            void write((r) => r.sessions.removeSet(setId));
          }}
          onRateEffort={(setId, repsInReserve) => {
            void write((r) => r.sessions.updateSet(setId, { rpe: rirToRpe(repsInReserve) }));
          }}
          onRemove={() => {
            void write((r) => r.sessions.removeExercise(block.sessionExerciseId));
          }}
        />
      ))}

      <Link
        to="/exercises?add=1"
        className="flex min-h-tap items-center justify-center rounded-card border border-dashed border-strong text-sm text-secondary active:bg-surface"
      >
        + Add an exercise
      </Link>

      <div className="flex gap-3 py-4">
        <Button
          disabled={busy}
          onClick={() => {
            void write((r) => r.sessions.finish(session.id)).then(() => {
              void navigate('/');
            });
          }}
        >
          Finish workout
        </Button>
        <Button
          variant="ghost"
          disabled={busy}
          onClick={() => {
            // Confirmed, because it is the one destructive action on the
            // screen and it sits next to the one people mean to press.
            if (!globalThis.confirm('Discard this workout and everything logged in it?')) return;
            void write((r) => r.sessions.discard(session.id)).then(() => {
              void navigate('/');
            });
          }}
        >
          Discard
        </Button>
      </div>

      {remaining !== null && (
        <RestBar
          remaining={remaining}
          onSkip={() => {
            setRest(null);
          }}
          onAdd={() => {
            setRest((current) =>
              current === null ? null : { ...current, seconds: current.seconds + 30 },
            );
          }}
        />
      )}
    </Shell>
  );
}

function Shell({ children }: { readonly children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-4 px-4 pt-safe-top pb-32">
      {children}
    </main>
  );
}

function StartWorkout({ busy, onStart }: { readonly busy: boolean; readonly onStart: () => void }) {
  return (
    <>
      <header className="flex items-baseline justify-between gap-4 pt-6 pb-2">
        <h1 className="text-2xl font-semibold text-primary">Train</h1>
        <HeaderLink to="/">Home</HeaderLink>
      </header>
      <section className="rounded-card bg-surface p-4">
        <p className="mb-4 max-w-prose text-sm text-secondary">
          Nothing in progress. Start a workout and add exercises to it as you go — everything is
          saved on this phone the moment you tap, whether or not there is any signal.
        </p>
        <Button disabled={busy} onClick={onStart}>
          Start a workout
        </Button>
      </section>
    </>
  );
}

/**
 * Asked once, inline, at the moment it first matters.
 *
 * Not at sign-up, where it is one more field between somebody and the app, and
 * not in a settings screen they would have to know to visit. The first
 * bodyweight exercise is when the number becomes load-bearing, and it is
 * obvious in context why it is being asked for.
 */
function BodyweightPrompt({
  unitSystem,
  busy,
  onSave,
}: {
  readonly unitSystem: UnitSystem;
  readonly busy: boolean;
  readonly onSave: (kg: number) => void;
}) {
  const [entered, setEntered] = useState('');
  const unit = unitSystem === 'imperial' ? 'lb' : 'kg';
  const parsed = Number(entered.replace(',', '.'));
  const valid = Number.isFinite(parsed) && parsed > 0;

  return (
    <section className="rounded-card bg-surface p-4">
      <h2 className="mb-2 text-lg font-semibold text-primary">What do you weigh?</h2>
      <p className="mb-3 max-w-prose text-sm text-secondary">
        A pull-up is you moving your own bodyweight. Without this number those sets can be logged
        but not measured, so they would not count toward anything.
      </p>
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <TextField
            label={`Bodyweight (${unit})`}
            inputMode="decimal"
            value={entered}
            onChange={(event) => {
              setEntered(event.target.value);
            }}
          />
        </div>
        <Button
          disabled={busy || !valid}
          onClick={() => {
            onSave(fromDisplayWeight(parsed, unitSystem));
          }}
        >
          Save
        </Button>
      </div>
    </section>
  );
}

function ExerciseCard({
  block,
  unitSystem,
  busy,
  onAddSet,
  onComplete,
  onUncomplete,
  onSave,
  onRemoveSet,
  onRateEffort,
  onRemove,
}: {
  readonly block: ExerciseBlock;
  readonly unitSystem: UnitSystem;
  readonly busy: boolean;
  readonly onAddSet: () => void;
  readonly onComplete: (setId: string, changes: { weightKg: number; reps: number }) => void;
  readonly onUncomplete: (setId: string) => void;
  readonly onSave: (setId: string, changes: { weightKg: number; reps: number }) => void;
  readonly onRemoveSet: (setId: string) => void;
  readonly onRateEffort: (setId: string, repsInReserve: number) => void;
  readonly onRemove: () => void;
}) {
  const name = block.exercise?.name ?? 'Unknown exercise';
  const [skipped, setSkipped] = useState(false);

  // Asked once, at the end, about the last set only. Once per set would be
  // four questions for one exercise, which is three too many with a bar in
  // your hands — and it is the last set that decides whether to add weight.
  const awaiting = skipped ? null : unratedFinalSet(block.sets);

  return (
    <section className="rounded-card bg-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="min-w-0 text-lg font-semibold text-primary">{name}</h2>
        {/* Bordered rather than a grey underline. The old one was the same
            weight and colour as a caption, which on a screen whose other
            controls are all filled or outlined read as a label rather than as
            something to press — the same fault HeaderLink was built to fix. */}
        <button
          type="button"
          disabled={busy}
          onClick={onRemove}
          className="inline-flex min-h-tap shrink-0 items-center rounded-control border border-subtle bg-elevated px-3 text-sm font-medium text-secondary select-none active:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50"
        >
          Remove
        </button>
      </div>

      {block.sets.length === 0 ? (
        <p className="mb-3 text-sm text-muted">No sets yet.</p>
      ) : (
        <ul className="mb-3 flex flex-col gap-3">
          {block.sets.map((set, index) => (
            <li key={set.id}>
              <SetRow
                // Remounting on id keeps the draft state below honest: a new
                // set must not inherit the half-typed numbers of the last one.
                key={set.id}
                index={index}
                set={set}
                previous={previousSetAt(block.previous, index)}
                unitSystem={unitSystem}
                busy={busy}
                onComplete={(changes) => {
                  onComplete(set.id, changes);
                }}
                onUncomplete={() => {
                  onUncomplete(set.id);
                }}
                onSave={(changes) => {
                  onSave(set.id, changes);
                }}
                onRemove={() => {
                  onRemoveSet(set.id);
                }}
              />
            </li>
          ))}
        </ul>
      )}

      {awaiting !== null && (
        <EffortPrompt
          busy={busy}
          onAnswer={(repsInReserve) => {
            onRateEffort(awaiting.id, repsInReserve);
          }}
          onSkip={() => {
            setSkipped(true);
          }}
        />
      )}

      <Button variant="secondary" fullWidth disabled={busy} onClick={onAddSet}>
        Add set
      </Button>
    </section>
  );
}

/**
 * The set worth asking about, or null.
 *
 * Only once every set is ticked — asking mid-exercise interrupts the thing it
 * is measuring — and only if nobody has answered already.
 */
function unratedFinalSet(sets: readonly SessionSet[]): SessionSet | null {
  if (sets.length === 0 || !sets.every((entry) => entry.isCompleted)) return null;
  const last = sets[sets.length - 1];
  return last?.rpe === null ? last : null;
}

/**
 * How much was left at the end.
 *
 * Phrased as reps rather than as RPE because "how many more could you have
 * done" is a question somebody can answer honestly with a bar still in their
 * hands, while "rate that seven to ten" is a question they will learn to
 * answer with whatever number they think means "hard". It is stored as RPE,
 * which is the notation the rest of the world writes it in.
 *
 * Skippable, and skipping costs nothing: the generator falls back to counting
 * reps, which answers most of the question on its own. What this adds is the
 * one thing rep counts cannot — whether twelve reps were comfortable or a
 * fight — and that is worth exactly one tap, not one per set.
 */
function EffortPrompt({
  busy,
  onAnswer,
  onSkip,
}: {
  readonly busy: boolean;
  readonly onAnswer: (repsInReserve: number) => void;
  readonly onSkip: () => void;
}) {
  return (
    <div className="mb-3 rounded-control border border-subtle bg-elevated p-3">
      <p className="text-sm font-medium text-primary">
        On that last set — how many more could you have done?
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {EFFORT_ANSWERS.map((answer) => (
          <Button
            key={answer.label}
            variant="secondary"
            disabled={busy}
            onClick={() => {
              onAnswer(answer.repsInReserve);
            }}
          >
            {answer.label}
          </Button>
        ))}
        <button
          type="button"
          onClick={onSkip}
          className="min-h-tap px-2 text-sm text-muted underline-offset-4 hover:underline"
        >
          Skip
        </button>
      </div>
    </div>
  );
}

/**
 * Four answers, and the top one is open-ended.
 *
 * "Three or more" rather than an exact count past three: nobody knows whether
 * they had four left or six, and pretending otherwise would put false
 * precision into a progression decision.
 */
const EFFORT_ANSWERS = [
  { label: 'None', repsInReserve: 0 },
  { label: '1', repsInReserve: 1 },
  { label: '2', repsInReserve: 2 },
  { label: '3+', repsInReserve: 3 },
] as const;

/**
 * One set.
 *
 * The numbers are held locally and written on the tick rather than on every
 * keystroke. A write per keystroke would be correct and cheap — it is SQLite,
 * not a request — but each one re-reads the workout, and the row would be
 * fighting the field for the value while somebody was still typing in it.
 */
function SetRow({
  index,
  set,
  previous,
  unitSystem,
  busy,
  onComplete,
  onUncomplete,
  onSave,
  onRemove,
}: {
  readonly index: number;
  readonly set: SessionSet;
  readonly previous: SetTemplate | null;
  readonly unitSystem: UnitSystem;
  readonly busy: boolean;
  readonly onComplete: (changes: { weightKg: number; reps: number }) => void;
  readonly onUncomplete: () => void;
  readonly onSave: (changes: { weightKg: number; reps: number }) => void;
  readonly onRemove: () => void;
}) {
  const [weight, setWeight] = useState(() => toDisplayWeight(set.weightKg, unitSystem).value);
  const [reps, setReps] = useState(set.reps);

  const weightLabel = WEIGHT_FIELD_MEANING[set.loadType];
  const stepDisplay = toDisplayWeight(incrementKgFor(unitSystem), unitSystem).value;
  const changes = { weightKg: fromDisplayWeight(weight, unitSystem), reps };

  return (
    <div className={set.isCompleted ? 'opacity-60' : undefined}>
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="text-xs font-medium text-muted">
          {set.setType === 'warmup' ? 'Warm-up' : `Set ${String(index + 1)}`}
        </span>
        {/* What you did last time, beside the row it belongs to. The whole
            reason the positional match in `previousSetAt` exists. */}
        <span className="numeric text-xs text-muted">
          {previous === null
            ? 'First time'
            : `Last: ${String(toDisplayWeight(previous.weightKg, unitSystem).value)} × ${String(previous.reps)}`}
        </span>
      </div>

      {/*
        Two steppers and a tick, and on a phone they do not fit in a row.

        Each stepper is two 48px buttons plus a field it has to be possible to
        read a three-digit weight in; side by side with the tick that is about
        330px of content in 326px of screen, and the reps stepper went off the
        right-hand edge entirely. So they stack until there is room, and the
        tick becomes a full-height column beside them — which is a better
        target anyway, being the one thing pressed with a bar in the other hand.

        `min-w-0` on every flex child is what stops a stepper refusing to
        shrink: a flex item defaults to `min-width: auto`, so without it the
        row grows past its container instead of the contents narrowing.
      */}
      <div className="flex items-stretch gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-end">
          {weightLabel !== null && (
            <div className="min-w-0 flex-1">
              <Stepper
                label={weightLabel}
                suffix={unitSystem === 'imperial' ? 'lb' : 'kg'}
                value={weight}
                step={stepDisplay}
                decimals={1}
                disabled={busy}
                onChange={setWeight}
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <Stepper
              label="Reps"
              value={reps}
              step={1}
              min={0}
              disabled={busy}
              onChange={setReps}
            />
          </div>
        </div>

        <button
          type="button"
          aria-label={
            set.isCompleted ? `Undo set ${String(index + 1)}` : `Complete set ${String(index + 1)}`
          }
          aria-pressed={set.isCompleted}
          disabled={busy}
          onClick={() => {
            if (set.isCompleted) {
              onUncomplete();
              return;
            }
            onComplete(changes);
          }}
          className={
            set.isCompleted
              ? 'flex w-tap shrink-0 items-center justify-center self-stretch rounded-control bg-accent text-2xl text-on-accent'
              : 'flex w-tap shrink-0 items-center justify-center self-stretch rounded-control border border-strong text-2xl text-secondary active:bg-elevated'
          }
        >
          ✓
        </button>
      </div>

      <div className="mt-1 flex justify-end gap-4">
        {!set.isCompleted && (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              onSave(changes);
            }}
            className="text-xs text-muted underline-offset-4 hover:underline"
          >
            Save without ticking
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={onRemove}
          className="text-xs text-muted underline-offset-4 hover:underline"
        >
          Delete set
        </button>
      </div>
    </div>
  );
}

/**
 * The rest timer, pinned above the home indicator.
 *
 * Fixed rather than in the flow because it has to be readable while the list
 * is scrolled to wherever the next exercise is, and because looking for it is
 * the opposite of what a rest timer is for.
 */
function RestBar({
  remaining,
  onSkip,
  onAdd,
}: {
  readonly remaining: number;
  readonly onSkip: () => void;
  readonly onAdd: () => void;
}) {
  const done = isRestOver(remaining);
  return (
    <div className="pb-safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-subtle bg-elevated">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-3">
        <div>
          <p className="text-xs text-muted">{done ? 'Rest over' : 'Resting'}</p>
          <p className={`numeric text-2xl ${done ? 'text-accent' : 'text-primary'}`}>
            {formatRest(remaining)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onAdd}>
            +30s
          </Button>
          <Button variant="secondary" onClick={onSkip}>
            {done ? 'Dismiss' : 'Skip'}
          </Button>
        </div>
      </div>
    </div>
  );
}
