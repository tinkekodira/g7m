/**
 * Undoing what SQLite did to the data on the way in.
 *
 * Postgres has hundreds of types and SQLite has three, so the local copy of
 * every row is lossy in specific, knowable ways. This is where those are
 * reversed — one place, tested, rather than a `Boolean(row.is_active)` at each
 * of forty call sites where one of them will eventually be `row.is_active ===
 * 'true'` and wrong for a year.
 *
 * | Postgres      | SQLite       | Read back as        |
 * | ------------- | ------------ | ------------------- |
 * | `boolean`     | INTEGER 0/1  | boolean             |
 * | `timestamptz` | TEXT (ISO)   | Date                |
 * | `text[]`      | TEXT (JSON)  | readonly string[]   |
 * | `jsonb`       | TEXT (JSON)  | unknown             |
 * | `numeric`     | REAL         | number              |
 *
 * Every field arrives possibly null, and that is not a nullability bug to be
 * tidied away with `!`. SQLite enforces none of Postgres' NOT NULLs, PowerSync
 * builds its tables as views over a JSON store, and a row can arrive mid-sync
 * or from a schema version newer than this build. So each reader takes a
 * fallback and the caller decides what a missing value means.
 */

/** The shape every row arrives in: names to values, all possibly null. */
export type RawRow = Record<string, unknown>;

export function readString(row: RawRow, column: string, fallback: string): string {
  const value = row[column];
  return typeof value === 'string' ? value : fallback;
}

export function readOptionalString(row: RawRow, column: string): string | null {
  const value = row[column];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export function readNumber(row: RawRow, column: string, fallback: number): number {
  const value = row[column];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  // SQLite is dynamically typed and PowerSync's views do no conversion, so a
  // numeric value can arrive as text — from an older schema, or from a JSON
  // round trip. Parsing it beats reporting a weight of zero.
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function readOptionalNumber(row: RawRow, column: string): number | null {
  const value = row[column];
  if (value === null || value === undefined) return null;
  const parsed = readNumber(row, column, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * SQLite has no boolean. Postgres booleans arrive as 0 or 1.
 *
 * Anything else is treated as the fallback rather than as truthy: `Boolean('0')`
 * is `true`, which would invert every flag that ever round-tripped through
 * text — including `is_completed`, where the wrong answer means a set the
 * lifter did not do appears in their history.
 */
export function readBoolean(row: RawRow, column: string, fallback = false): boolean {
  const value = row[column];
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'boolean') return value;
  if (value === '1' || value === 'true') return true;
  if (value === '0' || value === 'false') return false;
  return fallback;
}

/**
 * An ISO 8601 string back into a Date.
 *
 * Returns null rather than an Invalid Date for anything unparseable. An
 * Invalid Date propagates silently — it formats as "Invalid Date", compares
 * false against everything, and turns arithmetic into NaN — so it is worth
 * refusing to produce one.
 */
export function readDate(row: RawRow, column: string): Date | null {
  const value = row[column];
  if (typeof value !== 'string' || value === '') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function readRequiredDate(row: RawRow, column: string, fallback: Date): Date {
  return readDate(row, column) ?? fallback;
}

/**
 * A Postgres `text[]`, which PowerSync serialises to JSON.
 *
 * Returns an empty array for anything that is not a JSON array of strings.
 * These back the exercise cues — the offline answer to "how do I do this
 * lift" — so a malformed value should cost the cues, not the screen.
 */
export function readStringArray(row: RawRow, column: string): readonly string[] {
  const value = row[column];
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  if (typeof value !== 'string' || value === '') return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

/** A `jsonb` column, as whatever it holds. Null when absent or malformed. */
export function readJson(row: RawRow, column: string): unknown {
  const value = row[column];
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return value;
  if (value === '') return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/**
 * One of a fixed set of values, or the fallback.
 *
 * Postgres enforces these with check constraints; SQLite enforces nothing. A
 * `set_type` of `'wramup'` from a future schema version should render as a
 * working set rather than break the screen, and the fallback is where that is
 * decided rather than left to whatever the UI does with an unexpected string.
 */
export function readEnum<T extends string>(
  row: RawRow,
  column: string,
  allowed: readonly T[],
  fallback: T,
): T {
  const value = row[column];
  if (typeof value !== 'string') return fallback;
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

/** A boolean going the other way: SQLite stores 1 or 0, never true or false. */
export function writeBoolean(value: boolean): number {
  return value ? 1 : 0;
}

/** An array going the other way, as the JSON PowerSync expects. */
export function writeStringArray(value: readonly string[]): string {
  return JSON.stringify(value);
}
