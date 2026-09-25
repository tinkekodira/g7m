import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  toDisplayWeight,
  totalVolumeKg,
  trainingMinutes,
  boutCalories,
  formatDuration,
  type Bout,
  type CardioKind,
  type UnitSystem,
  workoutTitle,
} from '@g7m/core';
import { boutSummary } from './bout-copy.js';
import { HeaderLink } from '../components/HeaderLink.js';
import { formatWeightTotal } from '../components/chart-scale.js';
import { TrashIcon } from '../components/icons.js';
import { Button, TextField } from '@g7m/ui';
import { useCatalogue, useWrite } from '../lib/db/use-catalogue.js';

/**
 * One workout, as it was logged.
 *
 * Read-only on purpose. Editing a finished session is a real feature and a
 * separate one — it needs to decide what happens to a personal record set by a
 * set that is later deleted, and that question deserves more than a pencil
 * icon added here because there was room for it.
 */
export function SessionDetailScreen() {
  const { sessionId = '' } = useParams();

  const state = useCatalogue(`session:${sessionId}`, async (repositories) => {
    const session = await repositories.sessions.byId(sessionId);
    if (session === null) return null;

    const [profile, entries, work] = await Promise.all([
      repositories.profile.current(),
      repositories.sessions.exercisesFor(sessionId),
      repositories.history.primaryWork(sessionId),
    ]);

    const blocks = await Promise.all(
      entries.map(async (entry) => {
        const [exercise, sets] = await Promise.all([
          repositories.exercises.byId(entry.exerciseId),
          repositories.sessions.setsFor(entry.id),
        ]);
        return { entry, exercise, sets };
      }),
    );

    const bouts = blocks
      .filter((block) => block.exercise?.cardioKind != null)
      .reduce((sum, block) => sum + block.sets.filter((set) => set.isCompleted).length, 0);
    // The same name the history list gave it, so the row and the page agree.
    const title = session.name ?? workoutTitle(work.get(sessionId) ?? [], bouts);

    return { session, profile, blocks, title };
  });

  const data = state.data;

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-4 px-4 pt-safe-top pb-safe-bottom">
      <header className="flex items-baseline justify-between gap-4 pt-6 pb-2">
        <h1 className="text-2xl font-semibold text-primary">{data?.title ?? 'Workout'}</h1>
        <HeaderLink to="/progress">Progress</HeaderLink>
      </header>

      {state.error !== null ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : state.loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : data === null ? (
        <p className="max-w-prose text-sm text-secondary">
          That workout is not on this device. It may not have synced yet, or it may have been
          discarded.
        </p>
      ) : (
        <>
          <SessionBody
            startedAt={data.session.startedAt}
            bodyweightKg={data.session.bodyweightKg}
            unitSystem={data.profile?.unitSystem ?? 'metric'}
            blocks={data.blocks}
          />
          <KeepAsRoutine
            sessionId={sessionId}
            suggestion={data.session.name ?? ''}
            /* Nothing to template from a session with nothing ticked in it. */
            enabled={data.blocks.some((block) =>
              block.sets.some((set) => set.isCompleted && set.setType !== 'warmup'),
            )}
          />
          <DeleteWorkout sessionId={sessionId} />
        </>
      )}
    </main>
  );
}

interface Block {
  readonly entry: { readonly id: string; readonly exerciseId: string };
  readonly exercise: {
    readonly name: string;
    readonly slug: string;
    readonly cardioKind: CardioKind | null;
  } | null;
  readonly sets: readonly {
    readonly id: string;
    readonly setType: string;
    readonly loadType: string;
    readonly weightKg: number;
    readonly reps: number;
    readonly isCompleted: boolean;
    readonly completedAt: Date | null;
    readonly bout: Bout;
  }[];
}

function SessionBody({
  startedAt,
  bodyweightKg,
  unitSystem,
  blocks,
}: {
  readonly startedAt: Date;
  readonly bodyweightKg: number | null;
  readonly unitSystem: UnitSystem;
  readonly blocks: readonly Block[];
}) {
  // Sets and volume are lifting numbers; a bout's zeros would only inflate
  // the count and add nothing to the weight.
  const allSets = blocks
    .filter((block) => block.exercise?.cardioKind == null)
    .flatMap((block) =>
      block.sets.map((set) => ({
        setType: set.setType as 'working',
        loadType: set.loadType as 'external',
        weightKg: set.weightKg,
        reps: set.reps,
        isCompleted: set.isCompleted,
      })),
    );
  const volume = totalVolumeKg(allSets, bodyweightKg);
  // From the first working set ticked to the last — the same clock the list on
  // the progress screen reads, so the two never disagree about one session.
  const minutes = trainingMinutes(
    blocks.flatMap((block) =>
      block.sets
        .filter((set) => set.isCompleted && set.setType !== 'warmup')
        .map((set) => set.completedAt),
    ),
  );
  const unit = unitSystem === 'imperial' ? 'lb' : 'kg';

  // What the cardio came to: time on the machines and calories, from the bouts
  // that were done. The lifting numbers above say nothing about a treadmill.
  const hasLifts = blocks.some((block) => block.exercise?.cardioKind == null);
  const cardio = blocks.flatMap((block) => {
    const kind = block.exercise?.cardioKind;
    if (kind == null) return [];
    return block.sets.filter((set) => set.isCompleted).map((set) => ({ kind, bout: set.bout }));
  });
  const cardioSeconds = cardio.reduce((sum, entry) => sum + (entry.bout.durationSeconds ?? 0), 0);
  const cardioKcal = cardio.reduce(
    (sum, entry) => sum + (boutCalories(entry.kind, entry.bout, bodyweightKg)?.kcal ?? 0),
    0,
  );

  return (
    <>
      <section className="rounded-card bg-surface p-4">
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Stat label="Date" value={startedAt.toLocaleDateString()} />
          {minutes !== null && <Stat label="Duration" value={`${String(minutes)} min`} />}
          {hasLifts && <Stat label="Sets" value={String(volume.countedSets)} />}
          {hasLifts && (
            <Stat label="Volume" value={formatWeightTotal(volume.volumeKg, unitSystem)} />
          )}
          {cardioSeconds > 0 && <Stat label="Cardio" value={formatDuration(cardioSeconds)} />}
          {cardioKcal > 0 && (
            <Stat label="Calories" value={`${cardioKcal.toLocaleString('en-GB')} kcal`} />
          )}
        </div>
        {volume.unknownSets > 0 && (
          <p className="mt-3 text-xs text-muted">
            {volume.unknownSets === 1 ? 'One set is' : `${String(volume.unknownSets)} sets are`} not
            counted — no bodyweight was recorded for this workout, so they cannot be measured.
          </p>
        )}
      </section>

      {blocks.map((block) => (
        <section key={block.entry.id} className="rounded-card bg-surface p-4">
          <h2 className="mb-3 text-lg font-semibold text-primary">
            {block.exercise === null ? (
              'Unknown exercise'
            ) : (
              <Link
                // A lift's trend chart, or a machine's page: a treadmill has
                // no weight to chart.
                to={
                  block.exercise.cardioKind === null
                    ? `/progress/exercise/${block.entry.exerciseId}`
                    : `/exercises/${block.exercise.slug}`
                }
                className="underline-offset-4 hover:underline"
              >
                {block.exercise.name}
              </Link>
            )}
          </h2>

          {block.exercise?.cardioKind != null ? (
            <BoutList
              kind={block.exercise.cardioKind}
              sets={block.sets}
              unitSystem={unitSystem}
              bodyweightKg={bodyweightKg}
            />
          ) : block.sets.length === 0 ? (
            <p className="text-sm text-muted">No sets logged.</p>
          ) : (
            <ul className="flex flex-col">
              {block.sets.map((set, index) => (
                <li
                  key={set.id}
                  className="flex items-baseline justify-between gap-3 border-b border-subtle py-2 last:border-b-0"
                >
                  <span className="text-sm text-secondary">
                    {set.setType === 'warmup' ? 'Warm-up' : `Set ${String(index + 1)}`}
                    {/* A set that was written down and never done is part of
                        the record of what happened, and hiding it would make
                        the list disagree with the totals above. */}
                    {!set.isCompleted && <span className="text-muted"> · skipped</span>}
                  </span>
                  <span className="numeric text-sm text-primary">
                    {set.loadType === 'bodyweight'
                      ? 'Bodyweight'
                      : `${String(toDisplayWeight(set.weightKg, unitSystem).value)} ${unit}`}
                    {' × '}
                    {set.reps}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </>
  );
}

/**
 * Turn a workout that already happened into a routine.
 *
 * The other half of the offer made when a workout is finished, for the session
 * somebody said "not this one" to and then trained twice more. Opens closed:
 * this screen is read to see what was done, and a name box on it by default
 * would be a form in the way of that.
 */
function KeepAsRoutine({
  sessionId,
  suggestion,
  enabled,
}: {
  readonly sessionId: string;
  readonly suggestion: string;
  readonly enabled: boolean;
}) {
  const navigate = useNavigate();
  const { write, busy, error } = useWrite();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(suggestion);

  if (!enabled) return null;

  return (
    <section className="rounded-card border border-subtle bg-surface p-4">
      {open ? (
        <>
          <h2 className="mb-3 text-base font-semibold text-primary">Name the routine</h2>
          <TextField
            label="Routine name"
            value={name}
            placeholder="Push Day"
            onChange={(event) => {
              setName(event.target.value);
            }}
          />
          <div className="mt-3 flex flex-wrap gap-3">
            <Button
              disabled={busy || name.trim() === ''}
              onClick={() => {
                void write((r) => r.routines.createFromSession({ sessionId, name })).then(
                  (saved) => {
                    if (saved !== null) void navigate('/routines');
                  },
                );
              }}
            >
              Save
            </Button>
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setOpen(false);
              }}
            >
              Cancel
            </Button>
          </div>
          {error !== null && (
            <p role="alert" className="mt-2 text-sm text-danger">
              {error}
            </p>
          )}
        </>
      ) : (
        <>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              setOpen(true);
            }}
          >
            Save as a routine
          </Button>
          <p className="mt-2 text-xs text-muted">
            Keeps the movements and rep ranges, so you can start this session again in one tap.
          </p>
        </>
      )}
    </section>
  );
}

/**
 * Delete this workout for good.
 *
 * At the bottom of the screen, after everything else, so it cannot be hit
 * reaching for something above it. Deletes the session and every exercise and
 * set logged under it (`SessionRepository.discard`, the same call the
 * in-progress workout screen uses to abandon a session) — nothing about that
 * call is specific to a session still in progress. Every number that could
 * mention this workout (Progress, the calendar, an exercise's estimated 1RM,
 * streaks, achievements) is computed fresh from the sessions on the device
 * rather than cached, so none of it needs separate cleanup — see DECISIONS.md.
 */
function DeleteWorkout({ sessionId }: { readonly sessionId: string }) {
  const navigate = useNavigate();
  const { write, busy, error } = useWrite();

  return (
    <div className="py-4">
      <Button
        variant="danger"
        disabled={busy}
        onClick={() => {
          if (!globalThis.confirm("Delete this workout? This can't be undone.")) return;
          void write((r) => r.sessions.discard(sessionId)).then((result) => {
            // Null means the write failed and its error is already set below —
            // leaving means the error message goes with it, unread.
            if (result !== null) void navigate(-1);
          });
        }}
      >
        <TrashIcon className="size-5" />
        Delete workout
      </Button>
      {error !== null && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** A machine's bouts, one line each, in the words its display would use. */
function BoutList({
  kind,
  sets,
  unitSystem,
  bodyweightKg,
}: {
  readonly kind: CardioKind;
  readonly sets: Block['sets'];
  readonly unitSystem: UnitSystem;
  readonly bodyweightKg: number | null;
}) {
  if (sets.length === 0) return <p className="text-sm text-muted">No bouts logged.</p>;
  return (
    <ul className="flex flex-col">
      {sets.map((set, index) => (
        <li
          key={set.id}
          className="flex items-baseline justify-between gap-3 border-b border-subtle py-2 last:border-b-0"
        >
          <span className="shrink-0 text-sm text-secondary">
            Bout {String(index + 1)}
            {!set.isCompleted && <span className="text-muted"> · skipped</span>}
          </span>
          <span className="numeric text-right text-sm text-primary">
            {boutSummary(kind, set.bout, unitSystem, bodyweightKg)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Stat({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="numeric text-base text-primary">{value}</p>
    </div>
  );
}
