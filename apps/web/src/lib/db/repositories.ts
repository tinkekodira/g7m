/**
 * The repositories, bound to this device's database and to who is signed in.
 *
 * Brief §0.5: no component touches the database directly. This is the one
 * place the app turns a PowerSync connection into the objects screens are
 * allowed to call, so a component that wants a row has exactly one door.
 *
 * PowerSync's database satisfies `QueryableDatabase` and `WritableDatabase`
 * structurally — the narrow interfaces in `@g7m/db` were chosen for that
 * reason, and it is why the same repository code runs against `node:sqlite` in
 * the tests.
 */
import {
  BodyMetricsRepository,
  EquipmentRepository,
  ExerciseRepository,
  HistoryRepository,
  MuscleRepository,
  ProfileRepository,
  SessionRepository,
} from '@g7m/db';
import type { AbstractPowerSyncDatabase } from '@powersync/web';
import { openDatabase } from '../powersync/database.js';

export interface Repositories {
  /** Reads of the catalogue. No identity needed — it is the same for everyone. */
  readonly exercises: ExerciseRepository;
  readonly muscles: MuscleRepository;
  readonly equipment: EquipmentRepository;
  /**
   * Writes, stamped with the signed-in user's id.
   *
   * Signed out, these exist but refuse to run: `resolveContext` throws on an
   * empty user id rather than writing a row with no owner, which RLS would
   * reject permanently and the queue would discard.
   */
  readonly profile: ProfileRepository;
  readonly sessions: SessionRepository;
  /** Reads over finished training. Scoped to the user like the writes are. */
  readonly history: HistoryRepository;
  /** Append-only body measurements. See ADR-0032. */
  readonly bodyMetrics: BodyMetricsRepository;
}

let opening: Promise<AbstractPowerSyncDatabase> | null = null;

/**
 * Open the database once, and build repositories for the current user.
 *
 * The open promise is cached rather than the repositories, for two reasons:
 * several screens mounting at once share one `openDatabase()` rather than
 * racing to open the same OPFS file, and a change of user produces new
 * repositories over the same connection rather than a stale identity baked in
 * at first call. A failure clears the cache — a first attempt made before
 * storage was ready should not poison every later one.
 */
export async function getRepositories(userId: string): Promise<Repositories> {
  opening ??= openDatabase().catch((error: unknown) => {
    opening = null;
    throw error;
  });
  const db = await opening;
  const context = { userId };

  return {
    exercises: new ExerciseRepository(db),
    muscles: new MuscleRepository(db),
    equipment: new EquipmentRepository(db),
    profile: new ProfileRepository(db, context),
    sessions: new SessionRepository(db, context),
    history: new HistoryRepository(db, context),
    bodyMetrics: new BodyMetricsRepository(db, context),
  };
}
