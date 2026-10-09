/**
 * Saved workouts, to be trained again.
 *
 * The tables have been here since the first migration — `routines`,
 * `routine_exercises`, their policies, the composite foreign key and the
 * `routine_id` on `workout_sessions` — with nothing to fill them. This is the
 * repository that was missing in front of all of it.
 *
 * ## A routine holds movements and rep ranges, not weights
 *
 * `routine_exercises` has `target_sets`, `target_rep_low` and
 * `target_rep_high`, and no weight column. That is deliberate and it is the
 * whole difference between a routine and a snapshot: the weight for today
 * comes from what was lifted last time, through the same prefill the generator
 * uses. A routine that stored 80 kg would still be offering 80 kg a year later.
 *
 * ## Ordering is by key, never by index
 *
 * `order_key` is a fractional key (`@g7m/core`'s `order-key`), so moving one
 * exercise writes one row rather than renumbering the list. Two devices that
 * reorder the same routine offline both upload one changed row and neither
 * destroys the other's work.
 */
import {
  orderKeyBetween,
  orderKeysBetween,
  initialOrderKeys,
  sortByOrder,
  workoutUnits,
} from '@g7m/core';
import {
  resolveContext,
  toTimestamp,
  type QueryableDatabase,
  type RepositoryContext,
  type SqlValue,
  type WritableDatabase,
} from './database.js';
import { instant } from './instants.js';
import { readNumber, readOptionalString, readString, readDate, type RawRow } from './rows.js';

/** Mirrors the CHECK on `routine_exercises.target_sets`. */
export const MIN_TARGET_SETS = 1;
export const MAX_TARGET_SETS = 20;

export interface Routine {
  readonly id: string;
  readonly name: string;
  readonly notes: string | null;
  /** Null until it has been trained. Newest first in `list`. */
  readonly lastPerformedAt: Date | null;
  readonly exerciseCount: number;
}

export interface RoutineExercise {
  readonly id: string;
  readonly routineId: string;
  readonly exerciseId: string;
  readonly orderKey: string;
  readonly targetSets: number;
  readonly targetRepLow: number;
  readonly targetRepHigh: number;
  /** Shared by the movements planned as one superset. ADR-0112. */
  readonly supersetId: string | null;
}

/** A routine and the movements in it, in the order they are trained. */
export interface RoutineDetail {
  readonly routine: Routine;
  readonly exercises: readonly RoutineExercise[];
}

/** One movement, as a routine is built from a session or from scratch. */
export interface RoutineExerciseInput {
  readonly exerciseId: string;
  readonly targetSets?: number;
  readonly targetRepLow?: number;
  readonly targetRepHigh?: number;
  /**
   * Any key shared by movements to be planned as one superset — a session's
   * superset id, when a workout is saved as a routine. Never stored as given:
   * each group gets a new id, so a routine's superset and the workout's it was
   * copied from are not the same group.
   */
  readonly group?: string | null;
}

function toRoutine(row: RawRow, exerciseCount = 0): Routine {
  return {
    id: readString(row, 'id', ''),
    name: readString(row, 'name', ''),
    notes: readOptionalString(row, 'notes'),
    lastPerformedAt: readDate(row, 'last_performed_at'),
    exerciseCount: readNumber(row, 'exercise_count', exerciseCount),
  };
}

function toRoutineExercise(row: RawRow): RoutineExercise {
  return {
    id: readString(row, 'id', ''),
    routineId: readString(row, 'routine_id', ''),
    exerciseId: readString(row, 'exercise_id', ''),
    orderKey: readString(row, 'order_key', ''),
    targetSets: readNumber(row, 'target_sets', 3),
    targetRepLow: readNumber(row, 'target_rep_low', 8),
    targetRepHigh: readNumber(row, 'target_rep_high', 12),
    supersetId: readOptionalString(row, 'superset_id'),
  };
}

export class RoutineRepository {
  constructor(
    private readonly db: WritableDatabase & QueryableDatabase,
    private readonly context: RepositoryContext,
  ) {}

  /**
   * Every routine, most recently trained first, with a count of what is in it.
   *
   * Never trained ones come last rather than first: the list is opened to
   * start something, and the thing most likely to be started is the thing
   * started last. The count is joined here so a list of ten routines is one
   * query rather than eleven.
   */
  async list(): Promise<Routine[]> {
    const { userId } = resolveContext(this.context);
    const rows = await this.db.getAll<RawRow>(
      `SELECT r.*, COUNT(re.id) AS exercise_count
         FROM routines r
         LEFT JOIN routine_exercises re ON re.routine_id = r.id
        WHERE r.user_id = ?
        GROUP BY r.id
        ORDER BY r.last_performed_at IS NULL,
                 ${instant('r.last_performed_at')} DESC,
                 r.name ASC`,
      [userId],
    );
    return rows.map((row) => toRoutine(row));
  }

  /** One routine with its movements, or null when it is not on this device. */
  async byId(routineId: string): Promise<RoutineDetail | null> {
    const { userId } = resolveContext(this.context);
    const row = await this.db.getOptional<RawRow>(
      'SELECT * FROM routines WHERE id = ? AND user_id = ?',
      [routineId, userId],
    );
    if (row === null || row === undefined) return null;

    const exercises = await this.exercisesFor(routineId);
    return { routine: { ...toRoutine(row), exerciseCount: exercises.length }, exercises };
  }

  /** The movements in a routine, in training order. */
  async exercisesFor(routineId: string): Promise<RoutineExercise[]> {
    const { userId } = resolveContext(this.context);
    const rows = await this.db.getAll<RawRow>(
      `SELECT * FROM routine_exercises
        WHERE routine_id = ? AND user_id = ?
        ORDER BY order_key ASC`,
      [routineId, userId],
    );
    // Sorted again in memory: `order_key` is a fractional key and SQLite's
    // collation is byte order, which agrees for the keys this generates but is
    // not what defines the sequence.
    return sortByOrder(rows.map(toRoutineExercise));
  }

  /**
   * Save a routine.
   *
   * The name is required by the column — `check (length(trim(name)) > 0)` —
   * so an empty one is refused here rather than uploaded and discarded.
   */
  async create(input: {
    readonly name: string;
    readonly notes?: string | null;
    readonly exercises?: readonly RoutineExerciseInput[];
  }): Promise<Routine> {
    const { userId, newId, now } = resolveContext(this.context);

    const name = input.name.trim();
    if (name === '') throw new Error('A routine needs a name.');

    const id = newId();
    const at = toTimestamp(now());
    const notes = input.notes?.trim() ?? '';

    await this.db.execute(
      `INSERT INTO routines (id, user_id, name, notes, last_performed_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, NULL, ?, ?)`,
      [id, userId, name, notes === '' ? null : notes, at, at],
    );

    const exercises = input.exercises ?? [];
    const keys = initialOrderKeys(exercises.length);
    const groups = this.freshGroups(exercises);
    for (const [index, exercise] of exercises.entries()) {
      await this.insertExercise(
        id,
        exercise,
        keys[index] ?? orderKeyBetween(null, null),
        groups.get(exercise) ?? null,
      );
    }

    return {
      id,
      name,
      notes: notes === '' ? null : notes,
      lastPerformedAt: null,
      exerciseCount: exercises.length,
    };
  }

  /**
   * Save a finished workout as a routine.
   *
   * The movements come across in the order they were trained, and the target
   * sets are how many *working* sets were actually done — a warm-up is
   * preparation, not part of the shape of the session, and a routine that
   * asked for three warm-ups next time would be wrong. An exercise nobody
   * completed a set of is left out: it was opened and abandoned, not trained.
   */
  async createFromSession(input: {
    readonly sessionId: string;
    readonly name: string;
  }): Promise<Routine> {
    const { userId } = resolveContext(this.context);

    const rows = await this.db.getAll<RawRow>(
      `SELECT se.exercise_id AS exercise_id,
              se.order_key   AS order_key,
              se.superset_id AS superset_id,
              COUNT(ss.id)   AS working_sets,
              MIN(ss.reps)   AS rep_low,
              MAX(ss.reps)   AS rep_high
         FROM session_exercises se
         -- Top sets only: a drop is part of the set it came off, so three sets
         -- with a drop on the last is a routine of three, and the drop's
         -- twelve light reps are not the top of the rep range.
         JOIN session_sets ss
           ON ss.session_exercise_id = se.id
          AND ss.is_completed = 1
          AND ss.set_type NOT IN ('warmup', 'dropset')
        WHERE se.session_id = ? AND se.user_id = ?
        GROUP BY se.id
        ORDER BY se.order_key ASC`,
      [input.sessionId, userId],
    );

    const exercises = rows.map((row) => {
      const low = readNumber(row, 'rep_low', 8);
      const high = readNumber(row, 'rep_high', low);
      return {
        exerciseId: readString(row, 'exercise_id', ''),
        targetSets: readNumber(row, 'working_sets', 3),
        targetRepLow: low,
        targetRepHigh: high,
        // Kept, so a superset trained is a superset next time. An exercise
        // left out above can leave its partner alone; `create` reads that as
        // an ordinary movement.
        group: readOptionalString(row, 'superset_id'),
      };
    });

    return this.create({ name: input.name, exercises });
  }

  /** Rename. The column refuses an empty name, so this does too. */
  async rename(routineId: string, name: string): Promise<void> {
    const { userId, now } = resolveContext(this.context);
    const trimmed = name.trim();
    if (trimmed === '') throw new Error('A routine needs a name.');

    await this.db.execute(
      'UPDATE routines SET name = ?, updated_at = ? WHERE id = ? AND user_id = ?',
      [trimmed, toTimestamp(now()), routineId, userId],
    );
  }

  /**
   * Delete a routine and everything in it.
   *
   * The children go first and explicitly. Postgres would cascade, but the
   * local database is SQLite through PowerSync and does not enforce the
   * foreign key — so leaving them would strand rows that belong to a routine
   * that no longer exists, and upload them to a parent the server has dropped.
   *
   * Sessions that came from it are deliberately untouched. A workout that
   * happened is a fact, and `routine_id` on it is nullable for exactly this.
   */
  async remove(routineId: string): Promise<void> {
    const { userId, now } = resolveContext(this.context);
    await this.db.execute('DELETE FROM routine_exercises WHERE routine_id = ? AND user_id = ?', [
      routineId,
      userId,
    ]);
    await this.db.execute('DELETE FROM routines WHERE id = ? AND user_id = ?', [routineId, userId]);
    await this.db.execute(
      'UPDATE workout_sessions SET routine_id = NULL, source = ?, updated_at = ? WHERE routine_id = ? AND user_id = ?',
      ['manual', toTimestamp(now()), routineId, userId],
    );
  }

  /**
   * Add a movement to the end of a routine.
   *
   * The targets default to the exercise's own catalogue rep range rather than
   * to the column defaults, so a routine built from scratch starts with the
   * ranges the library already recommends for that lift.
   */
  async addExercise(
    routineId: string,
    exercise: RoutineExerciseInput,
  ): Promise<RoutineExercise | null> {
    const existing = await this.exercisesFor(routineId);
    const last = existing.at(-1)?.orderKey ?? null;
    return this.insertExercise(routineId, exercise, orderKeyBetween(last, null));
  }

  /**
   * Add movements to the end of a routine, in the order given — as a superset
   * when asked and there are at least two. The picker's "Superset" switch.
   */
  async addExercises(
    routineId: string,
    inputs: readonly RoutineExerciseInput[],
    options: { readonly superset?: boolean } = {},
  ): Promise<RoutineExercise[]> {
    if (inputs.length === 0) return [];
    const { newId } = resolveContext(this.context);
    const existing = await this.exercisesFor(routineId);
    const keys = orderKeysBetween(existing.at(-1)?.orderKey ?? null, null, inputs.length);
    const supersetId = options.superset === true && inputs.length >= 2 ? newId() : null;

    const written: RoutineExercise[] = [];
    for (const [index, input] of inputs.entries()) {
      const row = await this.insertExercise(routineId, input, keys[index] ?? 'a0', supersetId);
      if (row !== null) written.push(row);
    }
    return written;
  }

  /** Split a superset back into ordinary movements. */
  async ungroup(routineId: string, supersetId: string): Promise<void> {
    const { userId, now } = resolveContext(this.context);
    await this.db.execute(
      `UPDATE routine_exercises SET superset_id = NULL, updated_at = ?
        WHERE routine_id = ? AND superset_id = ? AND user_id = ?`,
      [toTimestamp(now()), routineId, supersetId, userId],
    );
  }

  /**
   * Write new order keys, all at once: a superset moved as a block, from
   * `planMove` in core. One transaction, so another device never sees half a
   * group moved past an exercise and the other half left behind it.
   */
  async reorder(
    writes: readonly { readonly id: string; readonly orderKey: string }[],
  ): Promise<void> {
    if (writes.length === 0) return;
    const { userId, now } = resolveContext(this.context);
    const at = toTimestamp(now());
    await this.db.writeTransaction(async (tx) => {
      for (const write of writes) {
        await tx.execute(
          'UPDATE routine_exercises SET order_key = ?, updated_at = ? WHERE id = ? AND user_id = ?',
          [write.orderKey, at, write.id, userId],
        );
      }
    });
  }

  /** Take a movement out. The sets already trained under it are untouched. */
  async removeExercise(routineExerciseId: string): Promise<void> {
    const { userId } = resolveContext(this.context);
    await this.db.execute('DELETE FROM routine_exercises WHERE id = ? AND user_id = ?', [
      routineExerciseId,
      userId,
    ]);
  }

  /**
   * Move a movement to sit between two others.
   *
   * One row changes, whichever direction it moved and however long the list
   * is. Nulls mean the ends: `move(id, null, first)` puts it at the top.
   */
  async move(
    routineExerciseId: string,
    beforeKey: string | null,
    afterKey: string | null,
  ): Promise<void> {
    const { userId, now } = resolveContext(this.context);
    await this.db.execute(
      'UPDATE routine_exercises SET order_key = ?, updated_at = ? WHERE id = ? AND user_id = ?',
      [orderKeyBetween(beforeKey, afterKey), toTimestamp(now()), routineExerciseId, userId],
    );
  }

  /** Remember that it was trained, which is what orders the list. */
  async markPerformed(routineId: string, at: Date): Promise<void> {
    const { userId, now } = resolveContext(this.context);
    await this.db.execute(
      'UPDATE routines SET last_performed_at = ?, updated_at = ? WHERE id = ? AND user_id = ?',
      [toTimestamp(at), toTimestamp(now()), routineId, userId],
    );
  }

  /**
   * A new superset id for each group of movements that will sit together,
   * keyed by the movement. Only a run of two or more next to each other is a
   * group, by the same rule the screens read them with.
   */
  private freshGroups(
    exercises: readonly RoutineExerciseInput[],
  ): Map<RoutineExerciseInput, string> {
    const { newId } = resolveContext(this.context);
    const groups = new Map<RoutineExerciseInput, string>();
    for (const unit of workoutUnits(exercises, (exercise) => exercise.group ?? null)) {
      if (unit.kind !== 'superset') continue;
      const id = newId();
      for (const member of unit.members) groups.set(member, id);
    }
    return groups;
  }

  private async insertExercise(
    routineId: string,
    exercise: RoutineExerciseInput,
    orderKey: string,
    supersetId: string | null = null,
  ): Promise<RoutineExercise | null> {
    const { userId, newId, now } = resolveContext(this.context);
    if (exercise.exerciseId === '') return null;

    const id = newId();
    const at = toTimestamp(now());
    const targetSets = clampSets(exercise.targetSets ?? 3);
    const { low, high } = clampReps(exercise.targetRepLow ?? 8, exercise.targetRepHigh ?? 12);

    const parameters: SqlValue[] = [
      id,
      userId,
      routineId,
      exercise.exerciseId,
      orderKey,
      targetSets,
      low,
      high,
      supersetId,
      at,
      at,
    ];

    await this.db.execute(
      `INSERT INTO routine_exercises
         (id, user_id, routine_id, exercise_id, order_key,
          target_sets, target_rep_low, target_rep_high, superset_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      parameters,
    );

    return {
      id,
      routineId,
      exerciseId: exercise.exerciseId,
      orderKey,
      targetSets,
      targetRepLow: low,
      targetRepHigh: high,
      supersetId,
    };
  }
}

/** Mirrors `check (target_sets between 1 and 20)`. */
function clampSets(value: number): number {
  if (!Number.isFinite(value)) return 3;
  return Math.min(MAX_TARGET_SETS, Math.max(MIN_TARGET_SETS, Math.round(value)));
}

/**
 * Mirrors both rep CHECKs: at least one, and the high end never below the low.
 *
 * A session of straight singles gives low === high, which is legal and means
 * what it says.
 */
function clampReps(lowInput: number, highInput: number): { low: number; high: number } {
  const low = Number.isFinite(lowInput) ? Math.max(1, Math.round(lowInput)) : 8;
  const high = Number.isFinite(highInput) ? Math.round(highInput) : low;
  return { low, high: Math.max(low, high) };
}
