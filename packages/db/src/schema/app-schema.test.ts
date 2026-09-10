import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startHarness, type Harness } from '../testing/pglite-harness.js';
import { AppSchema, UNSYNCED_COLUMNS, UNSYNCED_TABLES } from './app-schema.js';

/**
 * Does the device's idea of the database still match the server's?
 *
 * The local SQLite schema is written by hand while the Postgres schema is
 * written in migrations, and nothing in either language knows the other exists.
 * Left alone, they drift: someone adds a column to Postgres, ships it, and the
 * field is simply blank on every phone until a user asks why. Nothing fails, no
 * error is logged, and the bug is invisible from the server side because the
 * server is fine.
 *
 * These tests close that gap by reading the real migrations — the same ones
 * that ran against the live project — into a real Postgres and comparing it,
 * column by column, with the schema the app ships. PGlite makes that cost about
 * two seconds and no Docker, so it runs on every pull request (ADR-0022).
 *
 * The check is deliberately two-directional. Matching the local schema to
 * Postgres catches typos. Matching Postgres to the local schema catches the
 * expensive case: a column that exists and is not synced because nobody
 * decided it should be.
 */

/**
 * What each Postgres type has to become in SQLite, which has three types.
 *
 * Keyed by `information_schema.columns.data_type`. `ARRAY` covers every
 * `text[]` in the schema; PowerSync serialises non-scalar Postgres values to
 * JSON text on the way down.
 */
const EXPECTED_LOCAL_TYPE: Readonly<Record<string, 'TEXT' | 'INTEGER' | 'REAL'>> = {
  uuid: 'TEXT',
  text: 'TEXT',
  'character varying': 'TEXT',
  'timestamp with time zone': 'TEXT',
  // A date is a date, not an instant. Held as `YYYY-MM-DD` text so it survives
  // the trip without a timezone moving it a day.
  date: 'TEXT',
  ARRAY: 'TEXT',
  json: 'TEXT',
  jsonb: 'TEXT',
  boolean: 'INTEGER',
  smallint: 'INTEGER',
  integer: 'INTEGER',
  bigint: 'INTEGER',
  numeric: 'REAL',
  real: 'REAL',
  'double precision': 'REAL',
};

interface PostgresColumn {
  readonly table_name: string;
  readonly column_name: string;
  readonly data_type: string;
  readonly is_nullable: 'YES' | 'NO';
}

let harness: Harness;
/** table name -> column name -> Postgres type. */
let postgres: Map<string, Map<string, PostgresColumn>>;

beforeAll(async () => {
  harness = await startHarness();
  const result = await harness.db.query<PostgresColumn>(`
    select c.table_name, c.column_name, c.data_type, c.is_nullable
    from information_schema.columns c
    join information_schema.tables t
      on t.table_schema = c.table_schema and t.table_name = c.table_name
    where c.table_schema = 'public' and t.table_type = 'BASE TABLE'
    order by c.table_name, c.ordinal_position
  `);

  postgres = new Map();
  for (const row of result.rows) {
    let columns = postgres.get(row.table_name);
    if (columns === undefined) {
      columns = new Map();
      postgres.set(row.table_name, columns);
    }
    columns.set(row.column_name, row);
  }
}, 60_000);

afterAll(async () => {
  await harness.close();
});

describe('the local schema against the real migrations', () => {
  it('found the Postgres tables to compare against', () => {
    // A guard on the guard: if the introspection query returned nothing, every
    // test below would pass vacuously and prove the opposite of what it claims.
    expect(postgres.size).toBeGreaterThanOrEqual(14);
  });

  it('syncs only tables that exist', () => {
    const missing = AppSchema.tables.map((t) => t.name).filter((name) => !postgres.has(name));
    expect(missing, 'local tables with no Postgres table behind them').toEqual([]);
  });

  it('syncs only columns that exist', () => {
    const missing: string[] = [];
    for (const table of AppSchema.tables) {
      const columns = postgres.get(table.name);
      if (columns === undefined) continue;
      for (const local of table.columns) {
        if (!columns.has(local.name)) missing.push(`${table.name}.${local.name}`);
      }
    }
    expect(missing, 'local columns with no Postgres column behind them').toEqual([]);
  });

  /**
   * The direction that catches the expensive mistake: a column added to
   * Postgres that never reaches the device. Failing here is not a nuisance —
   * it is the test doing its job, and the fix is either to sync the column or
   * to say in UNSYNCED_COLUMNS why it stays on the server.
   */
  it('accounts for every Postgres column, as synced or as deliberately not', () => {
    const unaccounted: string[] = [];
    for (const [tableName, columns] of postgres) {
      if (tableName in UNSYNCED_TABLES) continue;
      const table = AppSchema.tables.find((t) => t.name === tableName);
      if (table === undefined) continue; // reported by the table test below
      const synced = new Set(table.columns.map((c) => c.name));
      const excused = UNSYNCED_COLUMNS[tableName] ?? {};
      for (const name of columns.keys()) {
        // PowerSync creates `id` on every table itself; declaring it is an error.
        if (name === 'id') continue;
        if (synced.has(name)) continue;
        if (name in excused) continue;
        unaccounted.push(`${tableName}.${name}`);
      }
    }
    expect(
      unaccounted,
      'Postgres columns that are neither synced nor listed in UNSYNCED_COLUMNS with a reason',
    ).toEqual([]);
  });

  it('accounts for every Postgres table', () => {
    const known = new Set(AppSchema.tables.map((t) => t.name));
    const unaccounted = [...postgres.keys()].filter(
      (name) => !known.has(name) && !(name in UNSYNCED_TABLES),
    );
    expect(unaccounted, 'Postgres tables neither synced nor listed in UNSYNCED_TABLES').toEqual([]);
  });

  it('maps every column to a SQLite type that can hold it', () => {
    const wrong: string[] = [];
    for (const table of AppSchema.tables) {
      const columns = postgres.get(table.name);
      if (columns === undefined) continue;
      for (const local of table.columns) {
        const remote = columns.get(local.name);
        if (remote === undefined) continue;
        const expected = EXPECTED_LOCAL_TYPE[remote.data_type];
        if (expected === undefined) {
          wrong.push(
            `${table.name}.${local.name}: Postgres type ${remote.data_type} has no agreed ` +
              `SQLite equivalent — add one to EXPECTED_LOCAL_TYPE`,
          );
          continue;
        }
        // `local.type` is PowerSync's ColumnType enum and `expected` is our own
        // string union; they hold the same values but TypeScript will not
        // compare them directly.
        if (String(local.type) !== expected) {
          wrong.push(
            `${table.name}.${local.name}: ${remote.data_type} should be ${expected} locally, ` +
              `is ${String(local.type)}`,
          );
        }
      }
    }
    expect(wrong).toEqual([]);
  });

  /** A stale excuse is worse than none: it hides the column it names. */
  it('has no stale entries in UNSYNCED_COLUMNS', () => {
    const stale: string[] = [];
    for (const [tableName, columns] of Object.entries(UNSYNCED_COLUMNS)) {
      const remote = postgres.get(tableName);
      if (remote === undefined) {
        stale.push(`${tableName} (no such table)`);
        continue;
      }
      for (const name of Object.keys(columns)) {
        if (!remote.has(name)) stale.push(`${tableName}.${name} (no such column)`);
      }
    }
    expect(stale).toEqual([]);
  });

  it('gives a reason for every unsynced column', () => {
    const unexplained: string[] = [];
    for (const [tableName, columns] of Object.entries(UNSYNCED_COLUMNS)) {
      for (const [name, reason] of Object.entries(columns)) {
        if (reason.trim().length < 10) unexplained.push(`${tableName}.${name}`);
      }
    }
    expect(unexplained, 'entries whose reason says nothing').toEqual([]);
  });
});

describe('what PowerSync requires of the Postgres schema', () => {
  /**
   * PowerSync identifies every row by a single `id` column and has no concept
   * of a composite key. A synced table without one does not fail at sync time
   * with a clear error; it fails at schema-load time on the device, which is
   * to say for the user and not for us.
   */
  it('gives every synced table a single-column id primary key', () => {
    const problems: string[] = [];
    for (const table of AppSchema.tables) {
      const id = postgres.get(table.name)?.get('id');
      if (id === undefined) {
        problems.push(`${table.name} has no id column`);
        continue;
      }
      if (id.data_type !== 'uuid' && id.data_type !== 'text') {
        problems.push(`${table.name}.id is ${id.data_type}, which PowerSync stores as TEXT`);
      }
    }
    expect(problems).toEqual([]);
  });

  it('carries user_id on every user-owned table, so a row can pass RLS on the way back up', () => {
    // Reference tables are read-only and have no owner; everything else does.
    const referenceTables = new Set([
      'muscle_groups',
      'muscles',
      'equipment',
      'exercises',
      'exercise_equipment',
      'exercise_muscles',
    ]);
    const missing = AppSchema.tables
      .filter((t) => !referenceTables.has(t.name))
      .filter((t) => !t.columns.some((c) => c.name === 'user_id'))
      .map((t) => t.name);
    expect(
      missing,
      'user tables synced without user_id would be rejected by RLS on upload',
    ).toEqual([]);
  });

  it('syncs order_key wherever Postgres has one, or the list order is lost offline', () => {
    const missing: string[] = [];
    for (const table of AppSchema.tables) {
      if (postgres.get(table.name)?.has('order_key') !== true) continue;
      if (!table.columns.some((c) => c.name === 'order_key')) missing.push(table.name);
    }
    expect(missing).toEqual([]);
  });
});
