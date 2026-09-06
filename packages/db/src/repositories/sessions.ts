/**
 * Workouts: starting one, filling it with exercises, logging sets into it.
 *
 * The first repository in this codebase that writes, and the rules are
 * different from reading because of where a mistake surfaces. SQLite enforces
 * none of the CHECK constraints Postgres does, so a malformed row is accepted
 * happily on the device and rejected **on upload, permanently** — the queue
 * classifies a 23xxx as a discard (`upload-outcome.ts`), which means the row is
 * dropped server-side and left sitting on the phone with nothing to explain it.
 *
 * There are five such constraints on these three tables, and every one of them
 * is enforced here as well:
 *
 *   · `is_completed = (completed_at is not null)` — the pair must move together
 *   · `load_type <> 'bodyweight' or weight_kg = 0`
 *   · `(source = 'routine') = (routine_id is not null)`
 *   · `ended_at is null or ended_at >= started_at`
 *   · `length(order_key) > 0`
 *
 * Everything multi-row runs in a transaction, and not only for atomicity:
 * PowerSync stamps everything written inside one transaction with the same
 * `transactionId`, so a session and its first exercise travel up together
 * rather than arriving split either side of a lost connection.
 */
import {
  initialOrderKeys,
  orderKeyBetween,
  type LoadType,
  type SetTemplate,
  type SetType,
} from '@g7m/core';
import {
  resolveContext,
  toTimestamp,
  type RepositoryContext,
  type WritableDatabase,
} from './database.js';
import {
  readBoolean,
  readDate,
  readEnum,
  readNumber,
  readOptionalNumber,
  readOptionalString,
  readRequiredDate,
  readString,
  writeBoolean,
  type RawRow,
} from './rows.js';

export const SESSION_SOURCES = ['manual', 'generated', 'routine'] as const;
export type SessionSource = (typeof SESSION_SOURCES)[number];

const SET_TYPE_VALUES = ['warmup', 'working', 'dropset', 'failure', 'amrap'] as const;
const LOAD_TYPE_VALUES = ['external', 'bodyweight', 'bodyweight_plus', 'assisted'] as const;

export interface WorkoutSession {
  readonly id: string;
  readonly userId: string;
  readonly name: string | null;
  readonly startedAt: Date;
  /** Null while the workout is in progress. */
  readonly endedAt: Date | null;
  readonly notes: string | null;
  readonly source: SessionSource;
  readonly routineId: string | null;
  /** Snapshot, so a pull-up logged at 80 kg stays an 80 kg pull-up. */
  readonly bodyweightKg: number | null;
}

export interface SessionExercise {
  readonly id: string;
  readonly sessionId: string;
  readonly exerciseId: string;
  readonly orderKey: string;
  readonly notes: string | null;
}

export interface SessionSet {
  readonly id: string;
  readonly sessionExerciseId: string;
  readonly orderKey: string;
  readonly setType: SetType;
  readonly loadType: LoadType;
  readonly weightKg: number;
  readonly reps: number;
  readonly rpe: number | null;
  readonly isCompleted: boolean;
  readonly completedAt: Date | null;
}

export interface StartSessionInput {
  readonly name?: string | null;
  readonly source?: SessionSource;
  readonly routineId?: string | null;
  /** From the profile, at the moment the workout begins. */
  readonly bodyweightKg?: number | null;
}

/** What a caller may change about a logged set. Omitted means unchanged. */
export interface SetChanges {
  readonly setType?: SetType;
  readonly loadType?: LoadType;
  readonly weightKg?: number;
  readonly reps?: number;
  readonly rpe?: number | null;
}

function toSession(row: RawRow): WorkoutSession {
  return {
    id: readString(row, 'id', ''),
    userId: readString(row, 'user_id', ''),
    name: readOptionalString(row, 'name'),
    // A session with no start is not a session. The epoch is a visibly wrong
    // date rather than an invalid one, which is easier to notice and to fix.
    startedAt: readRequiredDate(row, 'started_at', new Date(0)),
    endedAt: readDate(row, 'ended_at'),
    notes: readOptionalString(row, 'notes'),
    source: readEnum(row, 'source', SESSION_SOURCES, 'manual'),
    routineId: readOptionalString(row, 'routine_id'),
    bodyweightKg: readOptionalNumber(row, 'bodyweight_kg'),
  };
}

function toSessionExercise(row: RawRow): SessionExercise {
  return {
    id: readString(row, 'id', ''),
    sessionId: readString(row, 'session_id', ''),
    exerciseId: readString(row, 'exercise_id', ''),
    orderKey: readString(row, 'order_key', ''),
    notes: readOptionalString(row, 'notes'),
  };
}

function toSessionSet(row: RawRow): SessionSet {
  return {
    id: readString(row, 'id', ''),
    sessionExerciseId: readString(row, 'session_exercise_id', ''),
    orderKey: readString(row, 'order_key', ''),
    setType: readEnum(row, 'set_type', SET_TYPE_VALUES, 'working'),
    // The default is the dangerous one to get wrong: a row that lost its load
    // type should read as an external lift, because guessing `bodyweight`
    // would silently credit the lifter's whole mass to a dumbbell curl.
    loadType: readEnum(row, 'load_type', LOAD_TYPE_VALUES, 'external'),
    weightKg: readNumber(row, 'weight_kg', 0),
    reps: readNumber(row, 'reps', 0),
    rpe: readOptionalNumber(row, 'rpe'),
    isCompleted: readBoolean(row, 'is_completed'),
    completedAt: readDate(row, 'completed_at'),
  };
}

export class SessionRepository {
  constructor(
    private readonly db: WritableDatabase,
    private readonly context: RepositoryContext,
  ) {}

  /**
   * The workout in progress, if there is one.
   *
   * "In progress" is `ended_at is null`. Ordered by start descending and
   * limited to one because nothing stops two unfinished sessions existing —
   * an app killed mid-workout on one device and reopened on another produces
   * exactly that, and the newest is the one the lifter is standing in.
   */
  async active(): Promise<WorkoutSession | null> {
    const { userId } = resolveContext(this.context);
    const row = await this.db.getOptional<RawRow>(
      `SELECT * FROM workout_sessions
        WHERE user_id = ? AND ended_at IS NULL
        ORDER BY started_at DESC, id DESC
        LIMIT 1`,
      [userId],
    );
    return row === null ? null : toSession(row);
  }

  async byId(id: string): Promise<WorkoutSession | null> {
    const { userId } = resolveContext(this.context);
    const row = await this.db.getOptional<RawRow>(
      'SELECT * FROM workout_sessions WHERE id = ? AND user_id = ?',
      [id, userId],
    );
    return row === null ? null : toSession(row);
  }

  /** Finished workouts, newest first. The history screen's list. */
  async recent(limit = 30): Promise<WorkoutSession[]> {
    const { userId } = resolveContext(this.context);
    const rows = await this.db.getAll<RawRow>(
      `SELECT * FROM workout_sessions
        WHERE user_id = ? AND ended_at IS NOT NULL
        ORDER BY started_at DESC, id DESC
        LIMIT ?`,
      [userId, Math.max(1, Math.trunc(limit))],
    );
    return rows.map(toSession);
  }

  /**
   * Begin a workout.
   *
   * `bodyweightKg` is snapshotted rather than referenced. A pull-up logged at
   * 80 kg is still an 80 kg pull-up after the lifter drops to 75, and deriving
   * it from the profile later would rewrite every past total each time somebody
   * weighed themselves.
   */
  async start(input: StartSessionInput = {}): Promise<WorkoutSession> {
    const { userId, newId, now } = resolveContext(this.context);
    const id = newId();
    const at = toTimestamp(now());

    // `(source = 'routine') = (routine_id is not null)` is a CHECK. A session
    // claiming to come from a routine it cannot name, or naming one while
    // calling itself manual, is refused on upload and lost.
    const routineId = input.routineId ?? null;
    const source: SessionSource = input.source ?? (routineId === null ? 'manual' : 'routine');
    if ((source === 'routine') !== (routineId !== null)) {
      throw new Error(
        `A session with source "${source}" ${routineId === null ? 'needs' : 'must not have'} a routine id.`,
      );
    }

    await this.db.execute(
      `INSERT INTO workout_sessions
         (id, user_id, name, started_at, ended_at, notes, source, routine_id,
          generation_metadata, bodyweight_kg, created_at, updated_at)
       VALUES (?, ?, ?, ?, NULL, NULL, ?, ?, NULL, ?, ?, ?)`,
      [
        id,
        userId,
        emptyToNull(input.name ?? null),
        at,
        source,
        routineId,
        positiveOrNull(input.bodyweightKg ?? null),
        at,
        at,
      ],
    );

    const started = await this.byId(id);
    if (started === null) throw new Error('The session was written but could not be read back.');
    return started;
  }

  /**
   * End a workout.
   *
   * Clamped to at or after the start, because `ended_at >= started_at` is a
   * CHECK and a device clock that stepped backwards mid-session would
   * otherwise produce a row the server refuses for ever.
   */
  async finish(sessionId: string): Promise<void> {
    const { userId, now } = resolveContext(this.context);
    const session = await this.byId(sessionId);
    if (session === null) throw new Error(`No session ${sessionId} on this device.`);
    if (session.endedAt !== null) return;

    const endedAt = new Date(Math.max(now().getTime(), session.startedAt.getTime()));
    const at = toTimestamp(endedAt);
    await this.db.execute(
      'UPDATE workout_sessions SET ended_at = ?, updated_at = ? WHERE id = ? AND user_id = ?',
      [at, toTimestamp(now()), sessionId, userId],
    );
  }

  /**
   * Record what the lifter weighs, for this workout.
   *
   * Needed mid-session as well as at the start: the app only asks once a
   * bodyweight exercise is actually logged, so the snapshot is often written
   * after the workout has begun. Every set in it is then measurable, including
   * the ones already done.
   */
  async setBodyweight(sessionId: string, bodyweightKg: number | null): Promise<void> {
    const { userId, now } = resolveContext(this.context);
    await this.db.execute(
      'UPDATE workout_sessions SET bodyweight_kg = ?, updated_at = ? WHERE id = ? AND user_id = ?',
      [positiveOrNull(bodyweightKg), toTimestamp(now()), sessionId, userId],
    );
  }

  /** Abandon a workout and everything in it. */
  async discard(sessionId: string): Promise<void> {
    const { userId } = resolveContext(this.context);
    // Explicit rather than relying on the cascade: the foreign keys exist in
    // Postgres, and SQLite has `PRAGMA foreign_keys` off, so the children would
    // be orphaned locally and only vanish after a full re-sync.
    await this.db.writeTransaction(async (tx) => {
      await tx.execute(
        `DELETE FROM session_sets
          WHERE user_id = ?
            AND session_exercise_id IN (SELECT id FROM session_exercises WHERE session_id = ?)`,
        [userId, sessionId],
      );
      await tx.execute('DELETE FROM session_exercises WHERE session_id = ? AND user_id = ?', [
        sessionId,
        userId,
      ]);
      await tx.execute('DELETE FROM workout_sessions WHERE id = ? AND user_id = ?', [
        sessionId,
        userId,
      ]);
    });
  }

  async exercisesFor(sessionId: string): Promise<SessionExercise[]> {
    const { userId } = resolveContext(this.context);
    const rows = await this.db.getAll<RawRow>(
      `SELECT * FROM session_exercises
        WHERE session_id = ? AND user_id = ?
        ORDER BY order_key ASC, id ASC`,
      [sessionId, userId],
    );
    return rows.map(toSessionExercise);
  }

  /** Add an exercise to the end of a workout. */
  async addExercise(sessionId: string, exerciseId: string): Promise<SessionExercise> {
    const { userId, newId, now } = resolveContext(this.context);
    const existing = await this.exercisesFor(sessionId);
    const last = existing.at(-1);
    const orderKey =
      last === undefined ? (initialOrderKeys(1)[0] ?? 'a0') : orderKeyBetween(last.orderKey, null);

    const id = newId();
    const at = toTimestamp(now());
    await this.db.execute(
      `INSERT INTO session_exercises
         (id, user_id, session_id, exercise_id, order_key, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NULL, ?, ?)`,
      [id, userId, sessionId, exerciseId, orderKey, at, at],
    );

    return { id, sessionId, exerciseId, orderKey, notes: null };
  }

  /** Remove an exercise and every set logged under it. */
  async removeExercise(sessionExerciseId: string): Promise<void> {
    const { userId } = resolveContext(this.context);
    await this.db.writeTransaction(async (tx) => {
      await tx.execute('DELETE FROM session_sets WHERE session_exercise_id = ? AND user_id = ?', [
        sessionExerciseId,
        userId,
      ]);
      await tx.execute('DELETE FROM session_exercises WHERE id = ? AND user_id = ?', [
        sessionExerciseId,
        userId,
      ]);
    });
  }

  async setsFor(sessionExerciseId: string): Promise<SessionSet[]> {
    const { userId } = resolveContext(this.context);
    const rows = await this.db.getAll<RawRow>(
      `SELECT * FROM session_sets
        WHERE session_exercise_id = ? AND user_id = ?
        ORDER BY order_key ASC, id ASC`,
      [sessionExerciseId, userId],
    );
    return rows.map(toSessionSet);
  }

  /**
   * Add a set, not yet done.
   *
   * The row exists before the lifter performs it — that is what makes the
   * logger a checklist rather than a form — so it is written with
   * `is_completed = 0` and no `completed_at`, which is the only combination
   * the paired CHECK allows for an unfinished set.
   */
  async addSet(sessionExerciseId: string, template: SetTemplate): Promise<SessionSet> {
    const { userId, newId, now } = resolveContext(this.context);
    const existing = await this.setsFor(sessionExerciseId);
    const last = existing.at(-1);
    const orderKey =
      last === undefined ? (initialOrderKeys(1)[0] ?? 'a0') : orderKeyBetween(last.orderKey, null);

    const id = newId();
    const at = toTimestamp(now());
    const weightKg = weightFor(template.loadType, template.weightKg);

    await this.db.execute(
      `INSERT INTO session_sets
         (id, user_id, session_exercise_id, order_key, set_type, load_type,
          weight_kg, reps, rpe, is_completed, completed_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, 0, NULL, ?, ?)`,
      [
        id,
        userId,
        sessionExerciseId,
        orderKey,
        template.setType,
        template.loadType,
        weightKg,
        Math.max(0, Math.trunc(template.reps)),
        at,
        at,
      ],
    );

    return {
      id,
      sessionExerciseId,
      orderKey,
      setType: template.setType,
      loadType: template.loadType,
      weightKg,
      reps: Math.max(0, Math.trunc(template.reps)),
      rpe: null,
      isCompleted: false,
      completedAt: null,
    };
  }

  /**
   * Change a set's numbers.
   *
   * Changing the load type to `bodyweight` zeroes the weight in the same
   * statement. `load_type <> 'bodyweight' or weight_kg = 0` is a CHECK, and
   * leaving 60 kg behind on a switch to press-ups would double-count against
   * the session's bodyweight snapshot — and then be refused on upload anyway.
   */
  async updateSet(setId: string, changes: SetChanges): Promise<void> {
    const { userId, now } = resolveContext(this.context);
    const current = await this.setById(setId);
    if (current === null) throw new Error(`No set ${setId} on this device.`);

    const loadType = changes.loadType ?? current.loadType;
    const weightKg = weightFor(loadType, changes.weightKg ?? current.weightKg);

    await this.db.execute(
      `UPDATE session_sets
          SET set_type = ?, load_type = ?, weight_kg = ?, reps = ?, rpe = ?, updated_at = ?
        WHERE id = ? AND user_id = ?`,
      [
        changes.setType ?? current.setType,
        loadType,
        weightKg,
        Math.max(0, Math.trunc(changes.reps ?? current.reps)),
        changes.rpe === undefined ? current.rpe : clampRpe(changes.rpe),
        toTimestamp(now()),
        setId,
        userId,
      ],
    );
  }

  /**
   * Mark a set done. The one write the whole app is timed on.
   *
   * `is_completed` and `completed_at` are written together, always. They are a
   * CHECK — `is_completed = (completed_at is not null)` — so setting one
   * without the other produces a row rejected on upload, which for the logger
   * means the set the lifter just did never reaches the server.
   */
  async completeSet(setId: string, changes: SetChanges = {}): Promise<void> {
    const { userId, now } = resolveContext(this.context);
    if (Object.keys(changes).length > 0) await this.updateSet(setId, changes);

    const at = toTimestamp(now());
    await this.db.execute(
      `UPDATE session_sets
          SET is_completed = ?, completed_at = ?, updated_at = ?
        WHERE id = ? AND user_id = ?`,
      [writeBoolean(true), at, at, setId, userId],
    );
  }

  /** Undo a completion — a mis-tap, which happens with a bar in one hand. */
  async uncompleteSet(setId: string): Promise<void> {
    const { userId, now } = resolveContext(this.context);
    await this.db.execute(
      `UPDATE session_sets
          SET is_completed = ?, completed_at = NULL, updated_at = ?
        WHERE id = ? AND user_id = ?`,
      [writeBoolean(false), toTimestamp(now()), setId, userId],
    );
  }

  async removeSet(setId: string): Promise<void> {
    const { userId } = resolveContext(this.context);
    await this.db.execute('DELETE FROM session_sets WHERE id = ? AND user_id = ?', [setId, userId]);
  }

  async setById(setId: string): Promise<SessionSet | null> {
    const { userId } = resolveContext(this.context);
    const row = await this.db.getOptional<RawRow>(
      'SELECT * FROM session_sets WHERE id = ? AND user_id = ?',
      [setId, userId],
    );
    return row === null ? null : toSessionSet(row);
  }

  /**
   * The sets from the last time this exercise was trained.
   *
   * The query `prefill.ts` is built on, and the one that runs every time an
   * exercise is opened — hence the `history` index on
   * `(exercise_id, created_at)` in the local schema.
   *
   * `excludeSessionId` is the session in progress. Without it, opening an
   * exercise you are part-way through returns today's own sets as "last time"
   * and the prefill compares the lifter to themselves ten seconds ago.
   */
  async lastPerformance(
    exerciseId: string,
    excludeSessionId: string | null = null,
  ): Promise<SetTemplate[]> {
    const { userId } = resolveContext(this.context);

    const previous = await this.db.getOptional<RawRow>(
      `SELECT se.id AS session_exercise_id
         FROM session_exercises se
         JOIN workout_sessions ws ON ws.id = se.session_id
        WHERE se.exercise_id = ?
          AND se.user_id = ?
          AND (? IS NULL OR se.session_id <> ?)
          AND EXISTS (
            SELECT 1 FROM session_sets ss
             WHERE ss.session_exercise_id = se.id AND ss.is_completed = 1
          )
        ORDER BY ws.started_at DESC, ws.id DESC
        LIMIT 1`,
      [exerciseId, userId, excludeSessionId, excludeSessionId],
    );
    if (previous === null) return [];

    const sets = await this.setsFor(readString(previous, 'session_exercise_id', ''));
    // Only what was actually done. A planned set the lifter skipped is not a
    // thing to prefill this week's session from.
    return sets
      .filter((set) => set.isCompleted)
      .map((set) => ({
        weightKg: set.weightKg,
        reps: set.reps,
        loadType: set.loadType,
        setType: set.setType,
      }));
  }
}

/** A pure bodyweight set carries no external load, by definition and by CHECK. */
function weightFor(loadType: LoadType, weightKg: number): number {
  if (loadType === 'bodyweight') return 0;
  if (!Number.isFinite(weightKg) || weightKg < 0) return 0;
  return Math.round(weightKg * 100) / 100;
}

/** `rpe between 1 and 10` is a CHECK. Out of range means "not recorded". */
function clampRpe(rpe: number | null): number | null {
  if (rpe === null || !Number.isFinite(rpe)) return null;
  if (rpe < 1 || rpe > 10) return null;
  return Math.round(rpe * 10) / 10;
}

function emptyToNull(value: string | null): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed === '' ? null : trimmed;
}

function positiveOrNull(value: number | null): number | null {
  if (value === null || !Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100) / 100;
}
