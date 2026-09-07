/**
 * What the lifter is training for.
 *
 * Append-only, like `body_metrics` and for the same reason: the feedback loop
 * has to answer "how has this been going", which is only answerable against a
 * start date. There is a `set` and no `update` — choosing a new goal writes a
 * new row, so the sequence of decisions stays readable and a change of mind
 * cannot silently rewrite the window that gets read.
 *
 * `correct` exists for the case that is genuinely a mistake, and takes an id
 * so it cannot be reached for when what was meant was a new decision.
 */
import {
  DEFAULT_DAYS_PER_WEEK,
  MAX_DAYS_PER_WEEK,
  MIN_DAYS_PER_WEEK,
  TRAINING_GOALS,
  type TrainingGoal,
} from '@g7m/core';
import {
  resolveContext,
  toTimestamp,
  type RepositoryContext,
  type SqlValue,
  type WritableDatabase,
} from './database.js';
import {
  readEnum,
  readNumber,
  readOptionalString,
  readRequiredDate,
  readString,
  type RawRow,
} from './rows.js';

export { TRAINING_GOALS };
export type { TrainingGoal };

export interface Goal {
  readonly id: string;
  readonly goal: TrainingGoal;
  readonly daysPerWeek: number;
  /** When this goal began, which may be earlier than when the row was written. */
  readonly startedAt: Date;
  readonly note: string | null;
}

export interface GoalInput {
  readonly goal: TrainingGoal;
  readonly daysPerWeek?: number;
  readonly note?: string | null;
  /** Defaults to now. Given when backdating a goal to when it actually began. */
  readonly startedAt?: Date;
}

function toGoal(row: RawRow): Goal {
  return {
    id: readString(row, 'id', ''),
    // `lose_fat` is the fallback only in the sense that `readEnum` needs one;
    // the column has a CHECK, so a row that hits it came from a newer schema.
    goal: readEnum(row, 'goal', TRAINING_GOALS, 'lose_fat'),
    daysPerWeek: readNumber(row, 'days_per_week', DEFAULT_DAYS_PER_WEEK),
    startedAt: readRequiredDate(row, 'started_at', new Date(0)),
    note: readOptionalString(row, 'note'),
  };
}

export class GoalRepository {
  constructor(
    private readonly db: WritableDatabase,
    private readonly context: RepositoryContext,
  ) {}

  /**
   * Choose a goal. Writes a new row rather than editing the current one.
   *
   * Throws on a goal the column would refuse. A row rejected on upload is
   * discarded permanently and stranded on the device, so a value that cannot
   * survive the CHECK is refused here, where somebody can be told.
   */
  async set(input: GoalInput): Promise<Goal> {
    const { userId, newId, now } = resolveContext(this.context);

    if (!TRAINING_GOALS.includes(input.goal)) {
      throw new Error(`Not a training goal: ${String(input.goal)}`);
    }

    const id = newId();
    const at = toTimestamp(now());
    const startedAt = input.startedAt ?? now();
    const daysPerWeek = clampDays(input.daysPerWeek ?? DEFAULT_DAYS_PER_WEEK);
    const note = input.note?.trim() ?? '';

    await this.db.execute(
      `INSERT INTO training_goals
         (id, user_id, goal, days_per_week, started_at, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        input.goal,
        daysPerWeek,
        toTimestamp(startedAt),
        note === '' ? null : note,
        at,
        at,
      ],
    );

    return { id, goal: input.goal, daysPerWeek, startedAt, note: note === '' ? null : note };
  }

  /** The goal in force, or null before one has ever been chosen. */
  async current(): Promise<Goal | null> {
    const { userId } = resolveContext(this.context);
    const row = await this.db.getOptional<RawRow>(
      `SELECT * FROM training_goals WHERE user_id = ?
        ORDER BY started_at DESC, id DESC LIMIT 1`,
      [userId],
    );
    return row === null ? null : toGoal(row);
  }

  /** Every decision, newest first. What lets the app say how long a cut ran. */
  async history(limit = 20): Promise<Goal[]> {
    const { userId } = resolveContext(this.context);
    const rows = await this.db.getAll<RawRow>(
      `SELECT * FROM training_goals WHERE user_id = ?
        ORDER BY started_at DESC, id DESC LIMIT ?`,
      [userId, Math.max(1, Math.trunc(limit))],
    );
    return rows.map(toGoal);
  }

  /**
   * Fix a decision that was recorded wrong.
   *
   * Separate from `set` and requires an id, for the same reason
   * `BodyMetricsRepository.correct` does: the append-only rule is about not
   * overwriting one decision with the next, never about being unable to fix a
   * mistyped training frequency a minute after entering it.
   */
  async correct(id: string, input: Partial<GoalInput>): Promise<void> {
    const { userId, now } = resolveContext(this.context);
    const assignments: string[] = [];
    const parameters: SqlValue[] = [];

    const set = (column: string, value: SqlValue): void => {
      assignments.push(`${column} = ?`);
      parameters.push(value);
    };

    if (input.goal !== undefined) {
      if (!TRAINING_GOALS.includes(input.goal)) {
        throw new Error(`Not a training goal: ${String(input.goal)}`);
      }
      set('goal', input.goal);
    }
    if (input.daysPerWeek !== undefined) set('days_per_week', clampDays(input.daysPerWeek));
    if (input.startedAt !== undefined) set('started_at', toTimestamp(input.startedAt));
    if (input.note !== undefined) {
      const note = input.note?.trim() ?? '';
      set('note', note === '' ? null : note);
    }

    if (assignments.length === 0) return;

    set('updated_at', toTimestamp(now()));
    parameters.push(id, userId);

    await this.db.execute(
      `UPDATE training_goals SET ${assignments.join(', ')} WHERE id = ? AND user_id = ?`,
      parameters,
    );
  }

  async remove(id: string): Promise<void> {
    const { userId } = resolveContext(this.context);
    await this.db.execute('DELETE FROM training_goals WHERE id = ? AND user_id = ?', [id, userId]);
  }
}

/**
 * `days_per_week` has a CHECK of 1 to 7 and no null.
 *
 * Clamped rather than refused: somebody who types 9 meant "as often as I can",
 * and seven is that. A rejection here would be a modal in the way of the one
 * decision this screen exists to capture.
 */
function clampDays(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_DAYS_PER_WEEK;
  return Math.min(MAX_DAYS_PER_WEEK, Math.max(MIN_DAYS_PER_WEEK, Math.round(value)));
}
