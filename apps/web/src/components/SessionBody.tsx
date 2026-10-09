import { Link } from 'react-router';
import {
  boutCalories,
  countSets,
  formatDuration,
  toDisplayWeight,
  totalVolumeKg,
  trainingMinutes,
  workoutUnits,
  type Bout,
  type CardioKind,
  type UnitSystem,
} from '@g7m/core';
import { boutSummary } from '../screens/bout-copy.js';
import { isDropRow, numberSets, rowTitle } from '../screens/set-numbers.js';
import { formatWeightTotal } from './chart-scale.js';

/**
 * One finished workout, set by set: the stats across the top, then every
 * exercise with every set, and a machine's bouts in its own words.
 *
 * Yours on a workout's own page (`SessionDetailScreen`), and a friend's on
 * theirs (`FriendSessionScreen`) — the same rows, so a set reads the same
 * whoever lifted it.
 */
export interface SessionExercise {
  readonly name: string;
  readonly slug: string;
  readonly cardioKind: CardioKind | null;
}

export interface SessionBlock {
  readonly entry: {
    readonly id: string;
    readonly exerciseId: string;
    /** Shared by the exercises done as one superset (ADR-0112). */
    readonly supersetId?: string | null;
  };
  readonly exercise: SessionExercise | null;
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

/** A lift's trend chart, or a machine's page: a treadmill has no weight to chart. */
function trendOrPage(exerciseId: string, exercise: SessionExercise): string {
  return exercise.cardioKind === null
    ? `/progress/exercise/${exerciseId}`
    : `/exercises/${exercise.slug}`;
}

export function SessionBody({
  startedAt,
  bodyweightKg,
  unitSystem,
  blocks,
  linkTo = trendOrPage,
  explainUnmeasured = true,
}: {
  readonly startedAt: Date;
  readonly bodyweightKg: number | null;
  readonly unitSystem: UnitSystem;
  readonly blocks: readonly SessionBlock[];
  /** Where an exercise's name leads. */
  readonly linkTo?: (exerciseId: string, exercise: SessionExercise) => string;
  /**
   * Whether to say why bodyweight sets are missing from the volume. Yours,
   * yes — you can fix it. A friend's, no: their bodyweight is not yours to
   * see, so it is never sent, and the note would blame a missing weigh-in.
   */
  readonly explainUnmeasured?: boolean;
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
          {/* Drops folded into their sets: a set with two drops is one set,
              as it is on the leaderboard (ADR-0112). */}
          {hasLifts && <Stat label="Sets" value={String(countSets(allSets))} />}
          {hasLifts && (
            <Stat label="Volume" value={formatWeightTotal(volume.volumeKg, unitSystem)} />
          )}
          {cardioSeconds > 0 && <Stat label="Cardio" value={formatDuration(cardioSeconds)} />}
          {cardioKcal > 0 && (
            <Stat label="Calories" value={`${cardioKcal.toLocaleString('en-GB')} kcal`} />
          )}
        </div>
        {explainUnmeasured && volume.unknownSets > 0 && (
          <p className="mt-3 text-xs text-muted">
            {volume.unknownSets === 1 ? 'One set is' : `${String(volume.unknownSets)} sets are`} not
            counted — no bodyweight was recorded for this workout, so they cannot be measured.
          </p>
        )}
      </section>

      {workoutUnits(blocks, (block) => block.entry.supersetId ?? null).map((unit) =>
        unit.kind === 'single' ? (
          <ExerciseSection
            key={unit.item.entry.id}
            block={unit.item}
            unitSystem={unitSystem}
            bodyweightKg={bodyweightKg}
            linkTo={linkTo}
          />
        ) : (
          // One frame, so a superset reads as the one thing it was.
          <section
            key={unit.supersetId}
            aria-label="Superset"
            className="flex flex-col gap-3 rounded-card border-l-4 border-accent pl-2"
          >
            <p className="px-2 text-xs font-semibold tracking-wide text-accent uppercase">
              Superset
            </p>
            {unit.members.map((block) => (
              <ExerciseSection
                key={block.entry.id}
                block={block}
                unitSystem={unitSystem}
                bodyweightKg={bodyweightKg}
                linkTo={linkTo}
              />
            ))}
          </section>
        ),
      )}
    </>
  );
}

/** One exercise of a finished workout, with every set of it. */
function ExerciseSection({
  block,
  unitSystem,
  bodyweightKg,
  linkTo,
}: {
  readonly block: SessionBlock;
  readonly unitSystem: UnitSystem;
  readonly bodyweightKg: number | null;
  readonly linkTo: (exerciseId: string, exercise: SessionExercise) => string;
}) {
  const unit = unitSystem === 'imperial' ? 'lb' : 'kg';
  return (
    <section className="rounded-card bg-surface p-4">
      <h2 className="mb-3 text-lg font-semibold text-primary">
        {block.exercise === null ? (
          'Unknown exercise'
        ) : (
          <Link
            to={linkTo(block.entry.exerciseId, block.exercise)}
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
          {/* Numbered the way the logger numbers them, warm-ups apart, so
                  the set called "Set 1" mid-workout is not "Set 3" here. */}
          {/* A drop is indented under the set it came off: it is part of
                  that set, not one of its own (ADR-0112). */}
          {numberSets(block.sets).map((entry) => {
            const { set } = entry;
            return (
              <li
                key={set.id}
                className={`flex items-baseline justify-between gap-3 border-b border-subtle py-2 last:border-b-0 ${
                  isDropRow(entry) ? 'ml-4 border-l-2 border-l-accent/40 pl-3' : ''
                }`}
              >
                <span className="text-sm text-secondary">
                  {rowTitle(entry)}
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
            );
          })}
        </ul>
      )}
    </section>
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
  readonly sets: SessionBlock['sets'];
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
