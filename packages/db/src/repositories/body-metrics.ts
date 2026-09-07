/**
 * What the user is, over time.
 *
 * ADR-0032: append-only. There is a `record` and no `update`, and that absence
 * is the design — overwriting last Sunday's weight with this Sunday's is
 * exactly what makes the series unreconstructable, and an API that offers the
 * operation will eventually have it called.
 *
 * Correcting a genuine mistake is a different thing, and `correct` exists for
 * it: a typo entered a minute ago is not a measurement anybody wants in their
 * trend. It takes an id, so it cannot be reached for by accident when what was
 * meant was a new reading.
 */
import { ACTIVITY_LEVELS, type ActivityLevel } from '@g7m/core';
import type { HistoryWindow } from './history.js';
import {
  resolveContext,
  toTimestamp,
  type RepositoryContext,
  type SqlValue,
  type WritableDatabase,
} from './database.js';
import {
  readEnum,
  readOptionalNumber,
  readOptionalString,
  readRequiredDate,
  readString,
  type RawRow,
} from './rows.js';

/**
 * Re-exported from `@g7m/core`, where the plan generator can reach them.
 *
 * The list is domain logic before it is a column constraint — "lose fat"
 * implies a different week for a labourer than for somebody at a desk — so it
 * is defined there and validated here. Callers of `@g7m/db` see no difference.
 */
export { ACTIVITY_LEVELS };
export type { ActivityLevel };

export interface BodyMetric {
  readonly id: string;
  /** When it was measured, not when the row was written. */
  readonly recordedAt: Date;
  readonly weightKg: number | null;
  readonly heightCm: number | null;
  readonly activityLevel: ActivityLevel | null;
  readonly bodyFatPercent: number | null;
  readonly note: string | null;
}

/**
 * What the user is right now, assembled from however many rows it took.
 *
 * `weightAt` rides along because the weekly prompt needs to know how old the
 * weight is, and the alternative is every caller running a second query for
 * the row it just came from.
 */
export interface CurrentMetrics {
  readonly weightKg: number | null;
  readonly weightAt: Date | null;
  readonly heightCm: number | null;
  readonly activityLevel: ActivityLevel | null;
  readonly bodyFatPercent: number | null;
}

/** The measurement columns, as a closed set. See `latestWith`. */
type MetricColumn = 'weight_kg' | 'height_cm' | 'activity_level' | 'body_fat_percent';

/** A new measurement. Every field optional, but not all of them at once. */
export interface MetricInput {
  readonly weightKg?: number | null;
  readonly heightCm?: number | null;
  readonly activityLevel?: ActivityLevel | null;
  readonly bodyFatPercent?: number | null;
  readonly note?: string | null;
  /** Defaults to now. Given when entering a reading taken earlier. */
  readonly recordedAt?: Date;
}

function toMetric(row: RawRow): BodyMetric {
  return {
    id: readString(row, 'id', ''),
    recordedAt: readRequiredDate(row, 'recorded_at', new Date(0)),
    weightKg: readOptionalNumber(row, 'weight_kg'),
    heightCm: readOptionalNumber(row, 'height_cm'),
    activityLevel: readOptionalActivity(row),
    bodyFatPercent: readOptionalNumber(row, 'body_fat_percent'),
    note: readOptionalString(row, 'note'),
  };
}

/**
 * Null and a value are both meaningful; an unrecognised string is neither.
 *
 * `readEnum` would turn a level from a newer schema into `sedentary`, which
 * for this column is a wrong answer that feeds a calorie estimate rather than
 * a harmless default.
 */
function readOptionalActivity(row: RawRow): ActivityLevel | null {
  const raw = readOptionalString(row, 'activity_level');
  if (raw === null) return null;
  const value = readEnum(row, 'activity_level', ACTIVITY_LEVELS, 'sedentary');
  return value === 'sedentary' && raw !== 'sedentary' ? null : value;
}

export class BodyMetricsRepository {
  constructor(
    private readonly db: WritableDatabase,
    private readonly context: RepositoryContext,
  ) {}

  /**
   * Add a measurement.
   *
   * Throws when there is nothing in it. The Postgres CHECK refuses an empty
   * row, and a row refused on upload is discarded permanently and stranded on
   * the device — so it is refused here, where somebody can be told.
   */
  async record(input: MetricInput): Promise<BodyMetric> {
    const { userId, newId, now } = resolveContext(this.context);

    const weightKg = clampWeight(input.weightKg ?? null);
    const heightCm = clampHeight(input.heightCm ?? null);
    const activityLevel = clampActivity(input.activityLevel ?? null);
    const bodyFatPercent = clampBodyFat(input.bodyFatPercent ?? null);

    if (
      weightKg === null &&
      heightCm === null &&
      activityLevel === null &&
      bodyFatPercent === null
    ) {
      throw new Error('A body measurement needs at least one value.');
    }

    const id = newId();
    const at = toTimestamp(now());
    const recordedAt = toTimestamp(input.recordedAt ?? now());
    const note = input.note?.trim() ?? '';

    await this.db.execute(
      `INSERT INTO body_metrics
         (id, user_id, recorded_at, weight_kg, height_cm, activity_level,
          body_fat_percent, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        recordedAt,
        weightKg,
        heightCm,
        activityLevel,
        bodyFatPercent,
        note === '' ? null : note,
        at,
        at,
      ],
    );

    return {
      id,
      recordedAt: input.recordedAt ?? now(),
      weightKg,
      heightCm,
      activityLevel,
      bodyFatPercent,
      note: note === '' ? null : note,
    };
  }

  /**
   * Fix a measurement that was entered wrong.
   *
   * Deliberately separate from `record` and deliberately requires an id. The
   * append-only rule is about not overwriting last week's reading with this
   * week's; it was never about being unable to correct a typo.
   */
  async correct(id: string, input: MetricInput): Promise<void> {
    const { userId, now } = resolveContext(this.context);
    const assignments: string[] = [];
    const parameters: SqlValue[] = [];

    const set = (column: string, value: SqlValue): void => {
      assignments.push(`${column} = ?`);
      parameters.push(value);
    };

    if (input.weightKg !== undefined) set('weight_kg', clampWeight(input.weightKg));
    if (input.heightCm !== undefined) set('height_cm', clampHeight(input.heightCm));
    if (input.activityLevel !== undefined)
      set('activity_level', clampActivity(input.activityLevel));
    if (input.bodyFatPercent !== undefined) {
      set('body_fat_percent', clampBodyFat(input.bodyFatPercent));
    }
    if (input.note !== undefined) {
      const note = input.note?.trim() ?? '';
      set('note', note === '' ? null : note);
    }
    if (input.recordedAt !== undefined) set('recorded_at', toTimestamp(input.recordedAt));

    if (assignments.length === 0) return;

    set('updated_at', toTimestamp(now()));
    parameters.push(id, userId);

    await this.db.execute(
      `UPDATE body_metrics SET ${assignments.join(', ')} WHERE id = ? AND user_id = ?`,
      parameters,
    );
  }

  async remove(id: string): Promise<void> {
    const { userId } = resolveContext(this.context);
    await this.db.execute('DELETE FROM body_metrics WHERE id = ? AND user_id = ?', [id, userId]);
  }

  /**
   * The most recent measurement that carries a weight.
   *
   * Not simply the most recent row: a reading that recorded only a change of
   * activity level has no weight in it, and returning it would read as the
   * weight having been forgotten.
   */
  async latestWeight(): Promise<BodyMetric | null> {
    const { userId } = resolveContext(this.context);
    const row = await this.db.getOptional<RawRow>(
      `SELECT * FROM body_metrics
        WHERE user_id = ? AND weight_kg IS NOT NULL
        ORDER BY recorded_at DESC, id DESC
        LIMIT 1`,
      [userId],
    );
    return row === null ? null : toMetric(row);
  }

  /**
   * The single most recent reading, whatever it happens to contain.
   *
   * Not a merge of the latest value of each field. If height was recorded
   * once in March and weight every Sunday since, this returns Sunday's row
   * with a null height — which is the honest answer to "what was measured
   * most recently" and the wrong answer to "how tall are they". The coaching
   * loop will want the second one; it can ask for it when it exists.
   */
  async latest(): Promise<BodyMetric | null> {
    const { userId } = resolveContext(this.context);
    const row = await this.db.getOptional<RawRow>(
      `SELECT * FROM body_metrics WHERE user_id = ?
        ORDER BY recorded_at DESC, id DESC LIMIT 1`,
      [userId],
    );
    return row === null ? null : toMetric(row);
  }

  /**
   * The most recent value of each field, which is not the most recent row.
   *
   * `latest()` answers "what was measured last"; this answers "what are they
   * now", and the two differ the moment somebody records a weight without
   * re-entering their height. Height was measured once in March and has not
   * changed; reading it off Sunday's weigh-in row would report it as unknown.
   *
   * Each field is its own query rather than one pass over the table. The
   * table grows by a row a week forever, and four indexed lookups stay four
   * indexed lookups when it holds five years of Sundays.
   */
  async current(): Promise<CurrentMetrics> {
    const [weight, height, activity, bodyFat] = await Promise.all([
      this.latestWith('weight_kg'),
      this.latestWith('height_cm'),
      this.latestWith('activity_level'),
      this.latestWith('body_fat_percent'),
    ]);

    return {
      weightKg: weight?.weightKg ?? null,
      weightAt: weight?.recordedAt ?? null,
      heightCm: height?.heightCm ?? null,
      activityLevel: activity?.activityLevel ?? null,
      bodyFatPercent: bodyFat?.bodyFatPercent ?? null,
    };
  }

  /**
   * The newest row carrying a value in one column.
   *
   * The column is interpolated rather than bound because SQLite will not
   * parameterise an identifier. `MetricColumn` is a closed union of four
   * literals, so the only strings that can reach here are the four written
   * above — nothing user-supplied has a path into this string.
   */
  private async latestWith(column: MetricColumn): Promise<BodyMetric | null> {
    const { userId } = resolveContext(this.context);
    const row = await this.db.getOptional<RawRow>(
      `SELECT * FROM body_metrics
        WHERE user_id = ? AND ${column} IS NOT NULL
        ORDER BY recorded_at DESC, id DESC
        LIMIT 1`,
      [userId],
    );
    return row === null ? null : toMetric(row);
  }

  /** Measurements in a window, oldest first, for a trend. */
  async between(window: Pick<HistoryWindow, 'from' | 'to'> = {}): Promise<BodyMetric[]> {
    const { userId } = resolveContext(this.context);
    const conditions = ['user_id = ?'];
    const parameters: SqlValue[] = [userId];

    if (window.from !== undefined) {
      conditions.push('recorded_at >= ?');
      parameters.push(toTimestamp(window.from));
    }
    if (window.to !== undefined) {
      conditions.push('recorded_at < ?');
      parameters.push(toTimestamp(window.to));
    }

    const rows = await this.db.getAll<RawRow>(
      `SELECT * FROM body_metrics
        WHERE ${conditions.join(' AND ')}
        ORDER BY recorded_at ASC, id ASC`,
      parameters,
    );
    return rows.map(toMetric);
  }
}

/** `numeric(5,2)`, and a CHECK of 0 < kg < 1000. */
function clampWeight(value: number | null): number | null {
  if (value === null || !Number.isFinite(value) || value <= 0 || value >= 1000) return null;
  return Math.round(value * 100) / 100;
}

/** `numeric(5,1)`, and a CHECK of 50 < cm < 300. */
function clampHeight(value: number | null): number | null {
  if (value === null || !Number.isFinite(value) || value <= 50 || value >= 300) return null;
  return Math.round(value * 10) / 10;
}

function clampBodyFat(value: number | null): number | null {
  if (value === null || !Number.isFinite(value) || value <= 1 || value >= 70) return null;
  return Math.round(value * 10) / 10;
}

function clampActivity(value: ActivityLevel | null): ActivityLevel | null {
  return value !== null && ACTIVITY_LEVELS.includes(value) ? value : null;
}
