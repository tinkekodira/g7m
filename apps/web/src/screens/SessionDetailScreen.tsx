import { useMemo } from 'react';
import { Link, useParams } from 'react-router';
import {
  describeWhen,
  toDisplayWeight,
  totalVolumeKg,
  trainingMinutes,
  type UnitSystem,
} from '@g7m/core';
import { HeaderLink } from '../components/HeaderLink.js';
import { formatWeightTotal } from '../components/chart-scale.js';
import { useCatalogue } from '../lib/db/use-catalogue.js';

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
  const now = useMemo(() => new Date(), []);

  const state = useCatalogue(`session:${sessionId}`, async (repositories) => {
    const session = await repositories.sessions.byId(sessionId);
    if (session === null) return null;

    const [profile, entries] = await Promise.all([
      repositories.profile.current(),
      repositories.sessions.exercisesFor(sessionId),
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

    return { session, profile, blocks };
  });

  const data = state.data;

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-4 px-4 pt-safe-top pb-safe-bottom">
      <header className="flex items-baseline justify-between gap-4 pt-6 pb-2">
        <h1 className="text-2xl font-semibold text-primary">
          {data?.session.name ??
            (data === null ? 'Workout' : describeWhen(data.session.startedAt, now))}
        </h1>
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
        <SessionBody
          startedAt={data.session.startedAt}
          bodyweightKg={data.session.bodyweightKg}
          unitSystem={data.profile?.unitSystem ?? 'metric'}
          blocks={data.blocks}
        />
      )}
    </main>
  );
}

interface Block {
  readonly entry: { readonly id: string; readonly exerciseId: string };
  readonly exercise: { readonly name: string; readonly slug: string } | null;
  readonly sets: readonly {
    readonly id: string;
    readonly setType: string;
    readonly loadType: string;
    readonly weightKg: number;
    readonly reps: number;
    readonly isCompleted: boolean;
    readonly completedAt: Date | null;
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
  const allSets = blocks.flatMap((block) =>
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

  return (
    <>
      <section className="rounded-card bg-surface p-4">
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Stat label="Date" value={startedAt.toLocaleDateString()} />
          {minutes !== null && <Stat label="Duration" value={`${String(minutes)} min`} />}
          <Stat label="Sets" value={String(volume.countedSets)} />
          <Stat label="Volume" value={formatWeightTotal(volume.volumeKg, unitSystem)} />
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
                to={`/progress/exercise/${block.entry.exerciseId}`}
                className="underline-offset-4 hover:underline"
              >
                {block.exercise.name}
              </Link>
            )}
          </h2>

          {block.sets.length === 0 ? (
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

function Stat({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="numeric text-base text-primary">{value}</p>
    </div>
  );
}
