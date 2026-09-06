/**
 * A real SQLite database for the repository tests.
 *
 * The same argument as the PGlite harness (ADR-0022), one layer down. A
 * repository's job is almost entirely SQL — filters, joins, ordering, the
 * lossy mapping between SQLite's three types and the domain — and a test
 * against a fake that records query strings proves the strings were built, not
 * that they are correct. Ordering by `order_key` is exactly the kind of thing
 * that looks right and is wrong.
 *
 * `node:sqlite` ships with Node, so this needs no dependency, no browser, and
 * no PowerSync. It is genuinely SQLite — the same engine wa-sqlite compiles to
 * WebAssembly on the device.
 *
 * ## What this is not
 *
 * It is not PowerSync. On the device, the tables the app queries are *views*
 * over a JSON-backed store, and writes go through a CRUD queue rather than
 * straight to disk. Those differences do not touch the SQL, which is what is
 * being tested here — but two consequences are worth knowing:
 *
 *   · There is no upload queue, so nothing here proves a write would sync.
 *     `upload-batch.test.ts` covers that half separately.
 *   · Tables are created without `STRICT`, deliberately. PowerSync's views do
 *     not enforce types either, so a stricter harness would fail on values the
 *     real database accepts, and pass on the illusion that types are checked.
 */
import { DatabaseSync } from 'node:sqlite';
import { AppSchema } from '../../schema/app-schema.js';
import type { SqlValue, TransactionalDatabase, WritableDatabase } from '../database.js';

/**
 * `CREATE TABLE` for one PowerSync table.
 *
 * Generated from `AppSchema` rather than written out, so the harness cannot
 * drift from the schema the app ships — which would make these tests pass
 * against a database that does not exist.
 *
 * `id` is added here because PowerSync adds it on the device: it is on every
 * table, it is `TEXT`, and it is the primary key. It is not declared in the
 * schema because declaring it there is an error.
 */
function createTableSql(
  name: string,
  // PowerSync types this as its own `ColumnType` enum whose values are the
  // SQLite type names, so it stringifies to exactly what CREATE TABLE wants.
  columns: readonly { name: string; type?: string | undefined }[],
): string {
  const definitions = [
    'id TEXT PRIMARY KEY',
    ...columns.map((column) => `${column.name} ${column.type ?? 'TEXT'}`),
  ];
  return `CREATE TABLE ${name} (${definitions.join(', ')})`;
}

export interface SqliteHarness extends WritableDatabase {
  /** Insert a row directly, bypassing the repositories. For arranging tests. */
  seed: (table: string, row: Record<string, SqlValue>) => Promise<void>;
  /** Every row in a table, ordered by id, for asserting on. */
  dump: <T>(table: string) => Promise<T[]>;
  close: () => void;
}

/**
 * Open an in-memory SQLite database with the app's schema applied.
 *
 * In-memory rather than a temporary file: these tests never check persistence
 * across a process — that was the Phase 0 spike's job, on a real device — and
 * an in-memory database makes each test independent for free.
 */
export function startSqliteHarness(): SqliteHarness {
  const db = new DatabaseSync(':memory:');
  // Off by default in SQLite, and PowerSync does not enable them on its views
  // either. Left off so the harness does not enforce constraints the device
  // will not, which would make a test pass that production fails.
  db.exec('PRAGMA foreign_keys = OFF');

  for (const table of AppSchema.tables) {
    db.exec(createTableSql(table.name, table.columns));
  }

  function run(sql: string, parameters: SqlValue[] = []): unknown {
    return db.prepare(sql).run(...parameters);
  }

  function all<T>(sql: string, parameters: SqlValue[] = []): T[] {
    return db.prepare(sql).all(...parameters) as T[];
  }

  const api: SqliteHarness = {
    getAll: <T>(sql: string, parameters: SqlValue[] = []) =>
      Promise.resolve(all<T>(sql, parameters)),

    getOptional: <T>(sql: string, parameters: SqlValue[] = []) => {
      const rows = all<T>(sql, parameters);
      return Promise.resolve(rows[0] ?? null);
    },

    get: <T>(sql: string, parameters: SqlValue[] = []) => {
      const rows = all<T>(sql, parameters);
      const row = rows[0];
      if (row === undefined) throw new Error(`No row returned for: ${sql}`);
      return Promise.resolve(row);
    },

    execute: (sql: string, parameters: SqlValue[] = []) => Promise.resolve(run(sql, parameters)),

    /**
     * Real BEGIN/COMMIT, and a real ROLLBACK when the callback throws.
     *
     * Worth being genuine rather than a passthrough: a repository that writes a
     * session and its exercises in one call has to leave nothing behind when
     * the second write fails, and only an actual rollback tests that.
     */
    writeTransaction: async <T>(fn: (tx: TransactionalDatabase) => Promise<T>): Promise<T> => {
      db.exec('BEGIN');
      try {
        const result = await fn(api);
        db.exec('COMMIT');
        return result;
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },

    seed: (table: string, row: Record<string, SqlValue>) => {
      const columns = Object.keys(row);
      const placeholders = columns.map(() => '?').join(', ');
      run(
        `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
        Object.values(row),
      );
      return Promise.resolve();
    },

    dump: <T>(table: string) => Promise.resolve(all<T>(`SELECT * FROM ${table} ORDER BY id`)),

    close: () => {
      db.close();
    },
  };

  return api;
}
