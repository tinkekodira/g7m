import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Button, Stepper, TextField } from '@g7m/ui';
import {
  WEIGHT_FIELD_MEANING,
  bestsFrom,
  canAddWeight,
  dateKey,
  describePreviousSet,
  formatRest,
  fromDisplayWeight,
  naturalLoadType,
  nextSetTemplate,
  previousSetAt,
  restSecondsFor,
  recordsInSession,
  rirToRpe,
  toDisplayWeight,
  totalVolumeKg,
  warmupSets,
  weightAdvice,
  weightStepKg,
  type ExerciseBests,
  type LoadType,
  type SetRecord,
  type SetTemplate,
  type UnitSystem,
} from '@g7m/core';
import type { Exercise, Profile, SessionExercise, SessionSet, WorkoutSession } from '@g7m/db';
import { useCatalogue, useWrite } from '../lib/db/use-catalogue.js';
import { useWakeLock } from '../lib/use-wake-lock.js';
import { buzz } from '../lib/haptics.js';
import { readSnoozedAt, writeSnoozedAt } from '../lib/workout-notice.js';
import { HeaderLink } from '../components/HeaderLink.js';
import { ArrowUpIcon } from '../components/icons.js';
import { UndoToast } from '../components/UndoToast.js';
import { formatWeightExact } from '../components/chart-scale.js';
import { PlateLine } from '../components/PlateLine.js';
import { CardioCard } from '../components/CardioCard.js';
import { describeRecord, type RecordLine } from './record-copy.js';
import {
  formatElapsed,
  idleLimitMinutes,
  idleMinutes,
  isRestOver,
  lastActivityAt,
  restRemaining,
  shouldAskStillTraining,
} from './workout-timer.js';
import { addedExerciseId, exerciseAnchor, exerciseToReveal } from './added-exercise.js';
import { dayTitle } from './calendar-view.js';

/**
 * The logger.
 *
 * Brief §6 wants a set logged in under three seconds, one-handed, offline.
 * Everything here serves that: the numbers are prefilled before you arrive at
 * the row, the tick is the largest target on the screen, and every write is a
 * local SQLite statement with no network in the path.
 */

interface ExerciseBlock {
  /** The whole row, not just its id: restoring one needs its order key. */
  readonly entry: SessionExercise;
  readonly exercise: Exercise | null;
  readonly sets: readonly SessionSet[];
  readonly previous: readonly SetTemplate[];
  readonly loadType: LoadType;
  /**
   * Loaded with dumbbells, so the weight field steps by the rack rather than
   * by plates: 14 kg goes to 16, and 12.5 kg to 15. See `weightStepKg`.
   */
  readonly dumbbell: boolean;
  readonly restSeconds: number;
  /** From finished sessions only, so today cannot be its own baseline. */
  readonly bests: ExerciseBests;
  /**
   * Done on a standard barbell, so the set rows can say which plates to load.
   * The Olympic bar only: EZ and trap bars vary too much between gyms to
   * assume what they weigh.
   */
  readonly barbell: boolean;
}

interface Workout {
  readonly session: WorkoutSession;
  readonly profile: Profile | null;
  readonly blocks: readonly ExerciseBlock[];
}

/**
 * What a set row hands back when it is ticked or saved.
 *
 * The load type travels with the numbers because it changes what the weight
 * *means*: 20 on a dip with `bodyweight_plus` is twenty kilograms on a belt,
 * and the same 20 saved as `bodyweight` would be thrown away.
 */
interface SetEdit {
  readonly weightKg: number;
  readonly reps: number;
  readonly loadType: LoadType;
}

export function WorkoutScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { write, busy, error: writeError } = useWrite();

  const [now, setNow] = useState(() => new Date());

  /**
   * When "still training?" was last answered — or last made unnecessary.
   *
   * Coming back from adding an exercise counts: it is about the clearest proof
   * there is that somebody is still here, and it arrives through a remount, so
   * this is the moment to record it.
   */
  const [snoozedAt, setSnoozedAt] = useState<Date | null>(() =>
    addedExerciseId(location.state) !== null ? new Date() : null,
  );
  const [rest, setRest] = useState<{ startedAt: Date; seconds: number } | null>(null);
  /**
   * Set once the workout is finished and is worth keeping as a routine.
   *
   * Carries the session's id, its suggested name and where to go on skipping,
   * rather than reading them when it renders: `sessions.active()` returns null
   * the moment a workout is finished, so by the time this is on screen there
   * is no open workout left to ask.
   */
  const [offerRoutine, setOfferRoutine] = useState<{
    readonly sessionId: string;
    readonly suggestion: string;
    readonly afterwards: string;
  } | null>(null);
  const [undo, setUndo] = useState<Undoable | null>(null);
  // Only ever increments, so removing the same thing twice still restarts the
  // toast's clock rather than reading as one event.
  const undoToken = useRef(0);
  const forgetUndo = useCallback(() => {
    setUndo(null);
  }, []);

  const state = useCatalogue<Workout | null>('workout', async (repositories) => {
    const session = await repositories.sessions.active();
    if (session === null) return null;

    const [profile, entries] = await Promise.all([
      repositories.profile.current(),
      repositories.sessions.exercisesFor(session.id),
    ]);

    const blocks = await Promise.all(
      entries.map(async (entry): Promise<ExerciseBlock> => {
        const [exercise, sets, previous, equipment, history] = await Promise.all([
          repositories.exercises.byId(entry.exerciseId),
          repositories.sessions.setsFor(entry.id),
          repositories.sessions.lastPerformance(entry.exerciseId, session.id),
          repositories.exercises.equipmentFor(entry.exerciseId),
          // All time, not the twelve weeks the Progress screen charts. "Best in
          // three months" and "best ever" are different claims, and only one of
          // them is worth a badge.
          repositories.history.completedSets({ exerciseId: entry.exerciseId }),
        ]);

        return {
          entry,
          exercise,
          sets,
          previous,
          bests: bestsFrom(history),
          loadType: naturalLoadType(equipment.map((item) => item.category)),
          barbell: equipment.some((item) => item.slug === 'barbell'),
          dumbbell: equipment.some((item) => item.slug === 'dumbbell'),
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

  /**
   * A workout logged after it happened, from the calendar.
   *
   * Nothing about it is live, so nothing live runs: no elapsed clock, no rest
   * timer after a tick, no "still training?" — which would otherwise ask the
   * moment it opened, the workout having started days ago — and no reason to
   * hold the screen awake. Its sets are stamped on its own day by the
   * repository. See ADR-0061.
   */
  const past = workout?.session.source === 'past';
  useEffect(() => {
    if (!ticking) return;
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [ticking]);

  /**
   * The screen stays on for as long as a workout is open.
   *
   * A phone put down on a bench locks in thirty seconds, and the next set is
   * logged with a passcode and chalky hands. It also keeps the clock above
   * honest: a suspended tab stops firing intervals, so a sleeping phone is
   * also a phone that has not noticed rest is over.
   */
  /**
   * Still training?
   *
   * Asked after thirty minutes without a ticked set — idle time, never time
   * since starting, which would interrupt nearly every real workout. It
   * replaces a notice that appeared four hours after *starting*: that one could
   * show mid-session on a long day, offered no button to act on, and ended by
   * saying the elapsed time is stored with the workout, which stopped being true
   * when durations began to be read from the sets.
   */
  const lastActivity =
    workout === null
      ? null
      : lastActivityAt(
          workout.session.startedAt,
          workout.blocks.flatMap((block) =>
            block.sets.filter((set) => set.isCompleted).map((set) => set.completedAt),
          ),
        );
  /**
   * The answer, whether it was given on this screen or before a reload.
   *
   * Without the stored half, closing the app and coming back asked again
   * immediately — and the watcher outside this screen would have gone on to
   * close the workout as if nothing had been answered.
   */
  const answeredAt =
    workout === null
      ? snoozedAt
      : laterOf(snoozedAt, readSnoozedAt(workout.session.id, globalThis.localStorage));
  const askStillTraining =
    !past &&
    lastActivity !== null &&
    shouldAskStillTraining({
      lastActivityAt: lastActivity,
      snoozedAt: answeredAt,
      now,
      // A treadmill bout can be an hour without a tick; that is not idling.
      limitMinutes: idleLimitMinutes(
        (workout?.blocks ?? []).some((block) => block.exercise?.cardioKind != null)
          ? 'cardio'
          : 'strength',
      ),
    });

  // Once it looks like the training has stopped, keeping the screen awake is
  // just a phone on a bench burning its battery until somebody comes back.
  useWakeLock(ticking && !past && !askStillTraining);

  /**
   * Bring a newly added exercise into view.
   *
   * The library hands back the entry it created. This waits until that entry is
   * actually drawn — the workout is read asynchronously, and scrolling to an
   * element that does not exist yet does nothing and never gets another go —
   * then scrolls once and clears the state, so neither a re-render nor a
   * reload does it again.
   */
  const entryIds = useMemo(() => workout?.blocks.map((block) => block.entry.id) ?? [], [workout]);
  const reveal = exerciseToReveal(location.state, entryIds);
  useEffect(() => {
    if (reveal === null) return;
    const reduced = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    document
      .getElementById(exerciseAnchor(reveal))
      ?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    void navigate('.', { replace: true, state: null });
  }, [reveal, navigate]);

  const remaining = restRemaining(rest?.startedAt ?? null, rest?.seconds ?? 0, now);

  /**
   * Rest is over, said to a phone that is face-down on a bench.
   *
   * The bar has always shown it, and showing it was no use: the moment the
   * timer matters is the one where nobody is looking at the screen.
   */
  const restOver = remaining !== null && isRestOver(remaining);
  useEffect(() => {
    if (restOver) buzz('alert');
  }, [restOver]);

  /**
   * Personal records, worked out rather than watched for.
   *
   * Nothing here listens for a record "happening". Given the history and what
   * has been logged so far, `recordsInSession` says which of today's sets *are*
   * records — the same answer on every render, unchanged by closing the app and
   * coming back, and incapable of firing twice or missing one.
   */
  const marks = useMemo(() => markRecords(workout), [workout]);

  /**
   * The moment, which is a window rather than an event.
   *
   * `now` already ticks every second, so a record shows up and leaves on its
   * own with no timer to cancel and nothing to reset. Reopening the app inside
   * those few seconds shows it again, which is right: it only just happened.
   */
  const latest = marks.latest;
  const fresh =
    latest !== null && now.getTime() - latest.at.getTime() < CELEBRATION_SECONDS * 1000
      ? latest
      : null;

  const celebrated = useRef(new Set<string>());
  useEffect(() => {
    if (fresh === null) return;
    // The window reopens on every reload and the loader can blink through a
    // null; without this the same lift would be congratulated twice.
    const key = `${fresh.record.setId}:${fresh.record.kind}`;
    if (celebrated.current.has(key)) return;
    celebrated.current.add(key);
    buzz('success');
  }, [fresh]);

  /**
   * The offer is checked before every other branch, and has to be.
   *
   * Finishing the workout is exactly what makes `active()` return null, so the
   * "nothing in progress" branch would swallow this screen the instant it was
   * earned — and the re-read that discovers it flips `loading` on the way,
   * which unmounted this component mid-typing and threw away the name. It
   * carries everything it needs, so it depends on no read at all.
   *
   * The training is saved either way. All that is left is whether to keep its
   * shape.
   */
  if (offerRoutine !== null) {
    const offer = offerRoutine;
    return (
      <Shell>
        <SaveAsRoutine
          suggestion={offer.suggestion}
          busy={busy}
          onSave={(name) => {
            void write((r) =>
              r.routines.createFromSession({ sessionId: offer.sessionId, name }),
            ).then((saved) => {
              if (saved !== null) void navigate('/routines');
            });
          }}
          onSkip={() => {
            void navigate(offer.afterwards);
          }}
        />
      </Shell>
    );
  }

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

  /**
   * Where to go once the workout is finished or thrown away: home after a live
   * one, and back to its day on the calendar after one logged afterwards,
   * which is where it was started from and where it now shows.
   */
  const afterwards = past ? `/calendar?day=${dateKey(session.startedAt)}` : '/';

  /**
   * One way to finish, whether from the button or from "still training?".
   *
   * A workout worth keeping is offered as a routine before the screen goes,
   * because this is the only moment somebody has the whole session in mind.
   * Nothing worth keeping — a past log, an empty session, or one already
   * started from a routine — goes straight out as it always did.
   */
  const finishWorkout = (): void => {
    buzz('success');
    void write((r) => r.sessions.finish(session.id)).then(() => {
      if (worthSaving) {
        setOfferRoutine({ sessionId: session.id, suggestion: session.name ?? '', afterwards });
      } else void navigate(afterwards);
    });
  };
  /**
   * Whether finishing this one is worth offering to keep.
   *
   * Something was actually done, it is a live session rather than a log of one,
   * and it did not come from a routine already — saving a routine's own output
   * back as a second routine is how somebody ends up with four copies of Push
   * Day.
   */
  const worthSaving =
    !past &&
    session.routineId === null &&
    blocks.some((block) => block.sets.some((set) => set.isCompleted && set.setType !== 'warmup'));

  const unitSystem: UnitSystem = profile?.unitSystem ?? 'metric';
  // Lifts only: a bout's weight and reps are zero by design, and counting it
  // as a set would put "0 kg lifted" at the top of a treadmill session.
  const allSets = liftBlocks(blocks).flatMap((block) =>
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
          <h1 className="text-2xl font-semibold text-primary">
            {past ? 'Past workout' : 'Workout'}
          </h1>
          <p className="numeric mt-1 text-sm text-secondary">
            {past
              ? dayTitle(session.startedAt)
              : `${formatElapsed(session.startedAt, now)} elapsed`}
            {volume.countedSets > 0 &&
              ` · ${formatWeightExact(volume.volumeKg, unitSystem)} lifted`}
          </p>
        </div>
        {past ? (
          <HeaderLink to={afterwards}>Calendar</HeaderLink>
        ) : (
          <HeaderLink to="/">Home</HeaderLink>
        )}
      </header>

      {writeError !== null && (
        <p role="alert" className="text-sm text-danger">
          {writeError}
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

      {blocks.map((block) =>
        block.exercise?.cardioKind != null ? (
          <CardioCard
            key={block.entry.id}
            name={block.exercise.name}
            kind={block.exercise.cardioKind}
            sets={block.sets}
            anchorId={exerciseAnchor(block.entry.id)}
            unitSystem={unitSystem}
            bodyweightKg={session.bodyweightKg ?? profile?.bodyweightKg ?? null}
            past={past}
            busy={busy}
            onAddBout={() => {
              // The next interval usually repeats the last one's settings, so
              // they carry over; its calories are its own.
              const last = block.sets.at(-1)?.bout;
              void write((r) =>
                r.sessions.addSet(block.entry.id, {
                  weightKg: 0,
                  reps: 0,
                  loadType: 'external',
                  setType: 'working',
                  bout: last === undefined ? {} : { ...last, caloriesKcal: null },
                }),
              );
            }}
            onSave={(setId, bout) => {
              void write((r) => r.sessions.updateSet(setId, { bout }));
            }}
            onComplete={(setId, bout) => {
              void write((r) => r.sessions.completeSet(setId, { bout }));
              buzz('tick');
            }}
            onUncomplete={(setId) => {
              void write((r) => r.sessions.uncompleteSet(setId));
            }}
            onRemoveBout={(setId) => {
              void (async () => {
                const removed = await write((r) => r.sessions.removeSet(setId));
                if (removed === null) return;
                setUndo({
                  token: ++undoToken.current,
                  message: 'Bout removed.',
                  restore: () => {
                    void write((r) => r.sessions.restoreSet(removed));
                  },
                });
              })();
            }}
            onRemove={() => {
              void (async () => {
                const removed = await write((r) => r.sessions.removeExercise(block.entry.id));
                if (removed === null) return;
                setUndo({
                  token: ++undoToken.current,
                  message: removedMessage(block.exercise?.name ?? 'Exercise', removed.sets.length),
                  restore: () => {
                    void write((r) => r.sessions.restoreExercise(removed));
                  },
                });
              })();
            }}
          />
        ) : (
          <ExerciseCard
            key={block.entry.id}
            block={block}
            records={marks.bySet}
            unitSystem={unitSystem}
            busy={busy}
            onAddSet={() => {
              void write((r) =>
                r.sessions.addSet(
                  block.entry.id,
                  nextSetTemplate({
                    current: block.sets,
                    previous: block.previous,
                    repLow: block.exercise?.defaultRepLow ?? 8,
                    loadType: block.loadType,
                  }),
                ),
              );
            }}
            onWarmUp={(sets) => {
              void write((r) => r.sessions.prependSets(block.entry.id, sets));
            }}
            onComplete={(setId, changes) => {
              void write((r) => r.sessions.completeSet(setId, changes));
              // Answers the finger already on the glass, so the tick does not
              // have to be watched to be believed.
              buzz('tick');
              // Nothing to rest between when the sets happened days ago.
              if (!past) setRest({ startedAt: new Date(), seconds: block.restSeconds });
            }}
            onUncomplete={(setId) => {
              void write((r) => r.sessions.uncompleteSet(setId));
            }}
            onSave={(setId, changes) => {
              void write((r) => r.sessions.updateSet(setId, changes));
            }}
            onRemoveSet={(setId) => {
              void (async () => {
                const removed = await write((r) => r.sessions.removeSet(setId));
                if (removed === null) return;
                setUndo({
                  token: ++undoToken.current,
                  message: 'Set removed.',
                  restore: () => {
                    void write((r) => r.sessions.restoreSet(removed));
                  },
                });
              })();
            }}
            onRateEffort={(setId, repsInReserve) => {
              void write((r) => r.sessions.updateSet(setId, { rpe: rirToRpe(repsInReserve) }));
            }}
            onRemove={() => {
              void (async () => {
                const removed = await write((r) => r.sessions.removeExercise(block.entry.id));
                if (removed === null) return;
                setUndo({
                  token: ++undoToken.current,
                  // The count is the part worth a second look: an exercise takes
                  // every set logged under it with it.
                  message: removedMessage(block.exercise?.name ?? 'Exercise', removed.sets.length),
                  restore: () => {
                    void write((r) => r.sessions.restoreExercise(removed));
                  },
                });
              })();
            }}
          />
        ),
      )}

      <Link
        to="/exercises?add=1"
        className="flex min-h-tap items-center justify-center rounded-card border border-dashed border-strong text-sm text-secondary active:bg-surface"
      >
        + Add an exercise
      </Link>

      <div className="flex gap-3 py-4">
        <Button disabled={busy} onClick={finishWorkout}>
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
              void navigate(afterwards);
            });
          }}
        >
          Discard
        </Button>
      </div>

      {/*
        One stack, pinned above the home indicator, because both of these are
        out of the flow and either can be on screen while the other is. Two
        independently fixed bars sit on top of each other, and the one that
        loses is the undo.
      */}
      {(fresh !== null || undo !== null || remaining !== null || askStillTraining) && (
        <div className="pb-safe-bottom fixed inset-x-0 bottom-0 z-40 flex flex-col">
          {fresh !== null && (
            <RecordBar line={describeRecord(fresh.record, fresh.exerciseName, unitSystem)} />
          )}
          {undo !== null && (
            <UndoToast
              token={undo.token}
              message={undo.message}
              onUndo={() => {
                undo.restore();
                setUndo(null);
              }}
              onExpire={forgetUndo}
            />
          )}
          {askStillTraining && lastActivity !== null && (
            <StillTrainingBar
              minutes={idleMinutes(lastActivity, now)}
              busy={busy}
              onFinish={finishWorkout}
              onKeepGoing={() => {
                const at = new Date();
                setSnoozedAt(at);
                // Written down as well as held in state: the watcher that
                // closes abandoned workouts runs outside this screen and has
                // no other way to know the question was answered (ADR-0077).
                if (workout !== null) writeSnoozedAt(workout.session.id, at);
              }}
            />
          )}
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
        </div>
      )}
    </Shell>
  );
}

/** A deletion that has already happened, and the way back from it. */
interface Undoable {
  readonly token: number;
  readonly message: string;
  readonly restore: () => void;
}

function removedMessage(name: string, sets: number): string {
  if (sets === 0) return `${name} removed.`;
  return `${name} removed, with ${String(sets)} ${sets === 1 ? 'set' : 'sets'}.`;
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
 * "Keep this as a routine?", asked once, after the workout is already saved.
 *
 * After rather than before, and on its own screen rather than in a dialog over
 * the log: the training is recorded whatever happens here, and the question is
 * about next week rather than about this session. Skipping is a button of
 * equal weight, not a cross in a corner — most workouts are not worth keeping
 * and saying so should not feel like a refusal.
 */
function SaveAsRoutine({
  suggestion,
  busy,
  onSave,
  onSkip,
}: {
  readonly suggestion: string;
  readonly busy: boolean;
  readonly onSave: (name: string) => void;
  readonly onSkip: () => void;
}) {
  const [name, setName] = useState(suggestion);

  return (
    <>
      <header className="pt-8 pb-2">
        <h1 className="text-2xl font-semibold text-primary">Workout saved</h1>
        <p className="mt-1 max-w-prose text-sm text-secondary">
          Keep its shape as a routine and you can start the same session again in one tap. The
          movements and rep ranges are saved; the weights always come from what you last lifted.
        </p>
      </header>

      <section className="rounded-card border border-subtle bg-surface p-4">
        <TextField
          label="Routine name"
          value={name}
          placeholder="Push Day"
          onChange={(event) => {
            setName(event.target.value);
          }}
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            disabled={busy || name.trim() === ''}
            onClick={() => {
              onSave(name);
            }}
          >
            Save as a routine
          </Button>
          <Button variant="ghost" disabled={busy} onClick={onSkip}>
            Not this one
          </Button>
        </div>
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
  records,
  unitSystem,
  busy,
  onAddSet,
  onWarmUp,
  onComplete,
  onUncomplete,
  onSave,
  onRemoveSet,
  onRateEffort,
  onRemove,
}: {
  readonly block: ExerciseBlock;
  readonly records: ReadonlyMap<string, SetRecord>;
  readonly unitSystem: UnitSystem;
  readonly busy: boolean;
  readonly onAddSet: () => void;
  readonly onWarmUp: (sets: readonly SetTemplate[]) => void;
  readonly onComplete: (setId: string, changes: SetEdit) => void;
  readonly onUncomplete: (setId: string) => void;
  readonly onSave: (setId: string, changes: SetEdit) => void;
  readonly onRemoveSet: (setId: string) => void;
  readonly onRateEffort: (setId: string, repsInReserve: number) => void;
  readonly onRemove: () => void;
}) {
  const name = block.exercise?.name ?? 'Unknown exercise';
  const [skipped, setSkipped] = useState(false);

  /**
   * The ramp up to today's working weight.
   *
   * Read off the first working set — but off what is *in the field*, not off
   * what has been written. A set is only saved on the tick, so a lifter who
   * adds an exercise, types 100 and looks for the warm-up button would
   * otherwise be offered a ramp up to zero, which is no ramp at all. That is
   * the common case, not an edge one: the stored weight is only right when the
   * plan or a routine put it there.
   *
   * Offered only when there is a ladder worth climbing and no warm-up already
   * logged: two taps should not produce ten warm-up sets, and a lifter who
   * wants a different ramp can delete these and add their own.
   */
  const firstWorking = block.sets.find((set) => set.setType !== 'warmup');
  const hasWarmup = block.sets.some((set) => set.setType === 'warmup');
  const [draftKg, setDraftKg] = useState<number | null>(null);
  const workingKg = draftKg ?? firstWorking?.weightKg ?? 0;
  const ramp = useMemo(
    () =>
      firstWorking === undefined
        ? []
        : warmupSets({
            workingKg,
            loadType: firstWorking.loadType,
            barbell: block.barbell,
            dumbbell: block.dumbbell,
            unitSystem,
          }),
    [firstWorking, workingKg, block.barbell, block.dumbbell, unitSystem],
  );
  const offersWarmup = !hasWarmup && ramp.length > 0;

  // Asked once, at the end, about the last set only. Once per set would be
  // four questions for one exercise, which is three too many with a bar in
  // your hands — and it is the last set that decides whether to add weight.
  const awaiting = skipped ? null : unratedFinalSet(block.sets);

  /**
   * "That was too easy": the top of the rep range, on the last set, once the
   * exercise is done (ADR-0076). Shown here rather than as a toast because it
   * is about this exercise, and it is read on the way to the next one.
   */
  const lastWorking = [...block.sets].reverse().find((set) => set.setType !== 'warmup');
  const advice = weightAdvice({
    sets: block.sets,
    repHigh: block.exercise?.defaultRepHigh ?? null,
    stepKg: weightStepKg({
      dumbbell: block.dumbbell,
      currentKg: lastWorking?.weightKg ?? 0,
      unitSystem,
    }),
  });

  return (
    // Found by id to be scrolled to once it has just been added; the margin
    // stops it landing flush against the top edge of the screen.
    <section
      id={exerciseAnchor(block.entry.id)}
      className="scroll-mt-4 rounded-card bg-surface p-4"
    >
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
          {numberSets(block.sets).map(({ set, number, isFirstWorking }) => (
            <li key={set.id}>
              <SetRow
                // Remounting on id keeps the draft state below honest: a new
                // set must not inherit the half-typed numbers of the last one.
                key={set.id}
                number={number}
                {...(isFirstWorking ? { onDraftWeight: setDraftKg } : {})}
                set={set}
                record={records.get(set.id) ?? null}
                exerciseName={name}
                // Counted among working sets, so a ramp in front does not slide
                // every "Last:" hint down by the number of warm-ups. A warm-up
                // has no last time worth quoting.
                previous={
                  set.setType === 'warmup' ? null : previousSetAt(block.previous, number - 1)
                }
                barbell={block.barbell}
                dumbbell={block.dumbbell}
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

      {advice !== null && (
        <p className="advice mb-3 flex items-center gap-2 rounded-control border border-accent/50 bg-accent-subtle px-3 py-2 text-sm font-semibold text-accent">
          <ArrowUpIcon aria-hidden className="size-5 shrink-0" />
          <span className="numeric">
            {String(advice.reps)} reps at {showWeight(advice.weightKg, unitSystem)} — try{' '}
            {showWeight(advice.nextKg, unitSystem)} next time
          </span>
        </p>
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

      <div className="flex gap-2">
        {/* `shrink-0` and no wrapping: in a flex row beside a full-width
            sibling this was allowed to narrow below its own text and broke
            across two lines as "Warm-" / "up". */}
        {offersWarmup && (
          <Button
            variant="secondary"
            disabled={busy}
            className="shrink-0 whitespace-nowrap"
            onClick={() => {
              onWarmUp(ramp);
            }}
          >
            Warm-up
          </Button>
        )}
        <Button variant="secondary" fullWidth disabled={busy} onClick={onAddSet}>
          Add set
        </Button>
      </div>

      {/* What the button is about to do, before it is pressed — a ramp that
          appears as five new rows with no warning reads as a mistake. The
          whole ladder was spelled out here and ran to three lines; the count
          and where it climbs to is the part worth reading. */}
      {offersWarmup && (
        <p className="numeric mt-2 text-xs text-muted">
          Adds {ramp.length} {ramp.length === 1 ? 'set' : 'sets'} from{' '}
          {showWeight(ramp[0]?.weightKg ?? 0, unitSystem)} up to{' '}
          {showWeight(ramp[ramp.length - 1]?.weightKg ?? 0, unitSystem)}
        </p>
      )}
    </section>
  );
}

/**
 * Which number each set wears, counting warm-ups and working sets separately.
 *
 * A ramp put in front of a working set must not renumber it: adding four
 * warm-ups to an exercise turned "Set 1" into "Set 5", which is the app
 * disagreeing with every training program ever written. Warm-ups get their own
 * count, and the tick's accessible name follows the same rule — "Complete
 * warm-up 2" and "Complete set 1" are different things to be told.
 *
 * `isFirstWorking` marks the row whose weight the warm-up button ramps to.
 */
function numberSets(
  sets: readonly SessionSet[],
): { set: SessionSet; number: number; isFirstWorking: boolean }[] {
  let warmups = 0;
  let working = 0;
  let seenWorking = false;

  return sets.map((set) => {
    if (set.setType === 'warmup') {
      warmups += 1;
      return { set, number: warmups, isFirstWorking: false };
    }
    working += 1;
    const first = !seenWorking;
    seenWorking = true;
    return { set, number: working, isFirstWorking: first };
  });
}

/** Whichever of two moments is later, either of which may be missing. */
function laterOf(a: Date | null, b: Date | null): Date | null {
  if (a === null) return b;
  if (b === null) return a;
  return a > b ? a : b;
}

/** `16 kg`, `35 lb`: a weight with its unit, for a sentence rather than a field. */
function showWeight(kg: number, unitSystem: UnitSystem): string {
  return `${String(toDisplayWeight(kg, unitSystem).value)} ${unitSystem === 'imperial' ? 'lb' : 'kg'}`;
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
  number,
  set,
  record,
  exerciseName,
  previous,
  barbell,
  dumbbell,
  unitSystem,
  busy,
  onDraftWeight,
  onComplete,
  onUncomplete,
  onSave,
  onRemove,
}: {
  /** Its place among sets of its own kind — warm-ups counted apart. */
  readonly number: number;
  /**
   * Told what is in the weight field, for the one row the warm-up ramp reads.
   * A set is only written on the tick, so the card cannot see a typed weight
   * any other way.
   */
  readonly onDraftWeight?: (kg: number) => void;
  readonly set: SessionSet;
  readonly record: SetRecord | null;
  readonly exerciseName: string;
  readonly previous: SetTemplate | null;
  readonly barbell: boolean;
  readonly dumbbell: boolean;
  readonly unitSystem: UnitSystem;
  readonly busy: boolean;
  readonly onComplete: (changes: SetEdit) => void;
  readonly onUncomplete: () => void;
  readonly onSave: (changes: SetEdit) => void;
  readonly onRemove: () => void;
}) {
  const [weight, setWeight] = useState(() => toDisplayWeight(set.weightKg, unitSystem).value);
  const [reps, setReps] = useState(set.reps);

  /**
   * Plain bodyweight or weighted, held here and written on the tick like the
   * numbers are.
   *
   * A dip is logged as `bodyweight` because the dip station is bodyweight
   * equipment, and `bodyweight` has no weight field — so a weighted dip could
   * only ever be recorded as reps, though `bodyweight_plus` has been in the
   * schema, the volume maths and the records since the start. This is the
   * switch that was missing. Prefill already carries the choice forward, to the
   * next set and to next week.
   */
  const [loadType, setLoadType] = useState<LoadType>(set.loadType);

  // Reported after the render rather than during it: telling a parent to set
  // state while it is rendering this child is the classic React loop.
  useEffect(() => {
    onDraftWeight?.(loadType === 'bodyweight' ? 0 : fromDisplayWeight(weight, unitSystem));
  }, [onDraftWeight, weight, loadType, unitSystem]);

  const weightLabel = WEIGHT_FIELD_MEANING[loadType];
  // Read off the weight in the field, so the ladder follows what is in it: a
  // dumbbell at 12.5 steps by 2.5, one at 14 by 2.
  const stepDisplay = toDisplayWeight(
    weightStepKg({ dumbbell, currentKg: fromDisplayWeight(weight, unitSystem), unitSystem }),
    unitSystem,
  ).value;
  const changes: SetEdit = {
    // Plain bodyweight carries no weight. A stale number left in the field from
    // before "bodyweight only" was chosen must not be saved as added load.
    weightKg: loadType === 'bodyweight' ? 0 : fromDisplayWeight(weight, unitSystem),
    reps,
    loadType,
  };

  const line = record === null ? null : describeRecord(record, exerciseName, unitSystem);
  const title = set.setType === 'warmup' ? `Warm-up ${String(number)}` : `Set ${String(number)}`;
  const tickLabel = `${set.isCompleted ? 'Undo' : 'Complete'} ${
    set.setType === 'warmup' ? 'warm-up' : 'set'
  } ${String(number)}`;
  /** A row that is a number to read rather than a number to type. */
  const compact = set.isCompleted || set.setType === 'warmup';

  return (
    <div>
      {/* Outside the dimming below, deliberately: a completed row fades, and
          the one thing on it that must not is the reason it was worth doing. */}
      {line !== null && (
        <p className="mb-1 flex items-center gap-2">
          <span
            aria-hidden
            className="rounded-control bg-accent px-1.5 text-xs font-bold text-on-accent"
          >
            {line.badge}
          </span>
          <span className="text-xs font-semibold text-accent">{line.short}</span>
          <span className="sr-only">
            {line.headline}. {line.detail}
          </span>
        </p>
      )}

      {compact ? (
        /*
          Two kinds of row that are a number to read rather than a number to
          type, and both collapse to one line.

          **A done set is a record, not a control.** It used to keep its
          steppers, dimmed and disabled — the worst of both: a control that
          still looks like one, does nothing when pressed, and spends four rows
          of a phone screen saying one fact. Untick to change it, which is also
          how a logged set is deleted: the row opens back up and Delete is
          there.

          **A warm-up is a prescription to follow.** The ramp was worked out;
          nobody retypes it, they load the bar and tick. Five generated rows as
          full editors was the single worst thing on this screen. It keeps its
          plate line, which is the part that is actually read at the rack, and
          a Delete, since it cannot be opened up to find one.

          Between them, the card now shrinks as the session goes rather than
          growing.
        */
        <div className="rounded-control bg-elevated/60 px-3 py-2">
          <div className="flex items-center gap-3">
            <span className="w-16 shrink-0 text-xs font-medium text-muted">{title}</span>
            <span className="numeric min-w-0 flex-1 truncate text-base font-medium text-primary">
              {describePreviousSet(set, (kg) => showWeight(kg, unitSystem))}
            </span>
            {set.setType === 'warmup' && !set.isCompleted && (
              <button
                type="button"
                aria-label={`Delete ${title.toLowerCase()}`}
                disabled={busy}
                onClick={onRemove}
                className="min-h-tap shrink-0 px-1 text-xs text-muted underline-offset-4 hover:underline"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              aria-label={tickLabel}
              aria-pressed={set.isCompleted}
              disabled={busy}
              onClick={() => {
                if (set.isCompleted) onUncomplete();
                else onComplete(changes);
              }}
              className={
                set.isCompleted
                  ? 'flex size-tap shrink-0 items-center justify-center rounded-control bg-accent text-xl text-on-accent'
                  : 'flex size-tap shrink-0 items-center justify-center rounded-control border border-strong text-xl text-secondary active:bg-elevated'
              }
            >
              ✓
            </button>
          </div>
          {/* What to put on the bar, for the rung still to be lifted. Inside
              the row rather than under it: floated between two tiles it read
              as a caption for the next one. */}
          {!set.isCompleted && barbell && loadType === 'external' && (
            <div className="-mt-1 pl-16">
              <PlateLine weight={weight} unitSystem={unitSystem} />
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3">
            <span className="text-xs font-medium text-muted">{title}</span>
            {/* What you did last time, beside the row it belongs to. The whole
            reason the positional match in `previousSetAt` exists. */}
            <span className="numeric text-xs text-muted">
              {previous === null
                ? 'First time'
                : `Last: ${describePreviousSet(previous, (kg) =>
                    String(toDisplayWeight(kg, unitSystem).value),
                  )}`}
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
              aria-label={tickLabel}
              aria-pressed={false}
              disabled={busy}
              onClick={() => {
                onComplete(changes);
              }}
              className="flex w-tap shrink-0 items-center justify-center self-stretch rounded-control border border-strong text-2xl text-secondary active:bg-elevated"
            >
              ✓
            </button>
          </div>

          {/* The plates, for the set still to be lifted. A ticked set has been
            loaded already, and its row has collapsed anyway. */}
          {barbell && loadType === 'external' && (
            <PlateLine weight={weight} unitSystem={unitSystem} />
          )}

          <div className="mt-1 flex flex-wrap items-center gap-x-4">
            {/* On its own side of the row: it changes what is being logged,
              where the two on the right save it or throw it away. */}
            {canAddWeight(loadType) && (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  if (loadType === 'bodyweight') {
                    setLoadType('bodyweight_plus');
                    return;
                  }
                  setLoadType('bodyweight');
                  setWeight(0);
                }}
                className="text-xs font-medium text-secondary underline-offset-4 hover:underline"
              >
                {loadType === 'bodyweight' ? '+ Add weight' : 'Bodyweight only'}
              </button>
            )}
            <span className="flex-1" />
            {/* Both clear the tap target now. They were the smallest things on
              the screen and one of them destroys a set. */}
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                onSave(changes);
              }}
              className="min-h-tap text-xs text-muted underline-offset-4 hover:underline"
            >
              Save
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onRemove}
              className="min-h-tap text-xs text-muted underline-offset-4 hover:underline"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * The record bar.
 *
 * The other half of a personal record: the badge on the row is the fact, and
 * this is the moment. It arrives in the same corner as the rest timer, which is
 * where the eye already goes after a set, and leaves on its own a few seconds
 * later — a PR that has to be dismissed is homework.
 *
 * Understated on purpose. Two numbers and no adjectives; a record that has to
 * be described as huge is not one.
 */
function RecordBar({ line }: { readonly line: RecordLine }) {
  return (
    <div role="status" aria-live="polite" className="rise bg-accent text-on-accent">
      <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
        <span
          aria-hidden
          className="shrink-0 rounded-control border border-current px-2 py-0.5 text-xs font-bold"
        >
          {line.badge}
        </span>
        <span className="min-w-0">
          <span className="block text-base font-semibold">{line.headline}</span>
          <span className="numeric block text-sm opacity-80">{line.detail}</span>
        </span>
      </div>
    </div>
  );
}

/**
 * The rest timer.
 *
 * Out of the flow because it has to be readable while the list is scrolled to
 * wherever the next exercise is, and because looking for it is the opposite of
 * what a rest timer is for. The pinning belongs to the stack above, so that the
 * undo toast can share the same corner of the screen.
 */
/**
 * "Still training?", pinned where the rest timer lives.
 *
 * In the stack rather than at the top of the list, because the moment it
 * matters is coming back to a phone scrolled to wherever the last exercise was,
 * and a question at the top of a long page is one nobody sees.
 */
function StillTrainingBar({
  minutes,
  busy,
  onFinish,
  onKeepGoing,
}: {
  readonly minutes: number;
  readonly busy: boolean;
  readonly onFinish: () => void;
  readonly onKeepGoing: () => void;
}) {
  return (
    <div role="status" className="border-t border-subtle bg-elevated">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary">Still training?</p>
          <p className="text-xs text-muted">
            Nothing ticked for {String(minutes)} {minutes === 1 ? 'minute' : 'minutes'}.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="ghost" disabled={busy} onClick={onKeepGoing}>
            Keep going
          </Button>
          <Button variant="secondary" disabled={busy} onClick={onFinish}>
            Finish
          </Button>
        </div>
      </div>
    </div>
  );
}

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
    <div className="border-t border-subtle bg-elevated">
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

/** How long a record stays on screen after the set that set it. */
const CELEBRATION_SECONDS = 12;

interface LatestRecord {
  readonly record: SetRecord;
  readonly exerciseName: string;
  readonly at: Date;
}

/**
 * Every record in the session, and the most recent one.
 *
 * Walked per exercise, because a record is beaten against that exercise's own
 * history and nothing else. The map is what hangs a badge on the right row; the
 * latest is what decides whether anything is worth announcing.
 */
/**
 * The blocks that are lifts. Cardio is left out of everything measured in
 * weight and reps — volume, records — explicitly rather than by its zeros,
 * so no rule about zero can ever turn a first bout into a "record".
 */
function liftBlocks(blocks: readonly ExerciseBlock[]): ExerciseBlock[] {
  return blocks.filter((block) => block.exercise?.cardioKind == null);
}

function markRecords(workout: Workout | null): {
  bySet: ReadonlyMap<string, SetRecord>;
  latest: LatestRecord | null;
} {
  const bySet = new Map<string, SetRecord>();
  let latest: LatestRecord | null = null;
  if (workout === null) return { bySet, latest };

  for (const block of liftBlocks(workout.blocks)) {
    const records = recordsInSession({
      sets: block.sets,
      // The session's snapshot, so a pull-up logged at 80 kg is still measured
      // against 80 kg however the scale reads today.
      bodyweightKg: workout.session.bodyweightKg,
      bests: block.bests,
    });

    for (const record of records) {
      bySet.set(record.setId, record);
      const at = block.sets.find((set) => set.id === record.setId)?.completedAt ?? null;
      if (at === null) continue;
      if (latest === null || at.getTime() > latest.at.getTime()) {
        latest = { record, exerciseName: block.exercise?.name ?? 'that lift', at };
      }
    }
  }

  return { bySet, latest };
}
