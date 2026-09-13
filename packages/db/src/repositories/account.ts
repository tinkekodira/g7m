/**
 * Everything one person has put into the app, as a file they can take away.
 *
 * GDPR gives everybody a copy of their data in a form another program can
 * read (Article 20), and the brief's §14 asks for it. The copy comes from the
 * database on the device rather than from the server, for three reasons that
 * all point the same way: the device holds every row the server does for this
 * user (the sync rules send all of them, every column — `UNSYNCED_TABLES` is
 * empty and nothing in `UNSYNCED_COLUMNS` is a user table), it also holds
 * whatever has not been uploaded yet, and reading it needs no connection. See
 * ADR-0064.
 *
 * ## The file is meant to be read without the app
 *
 * So the raw rows are not quite enough. SQLite has no booleans and no JSON, so
 * a completed set reads `1` and a generated workout's metadata is a string of
 * escaped JSON; both are turned back into what Postgres holds. And every
 * workout refers to its exercises by id, which means nothing outside the app,
 * so the exercises and equipment the rows mention travel with it, by name.
 */
import { AppSchema, isReferenceTable } from '../schema/app-schema.js';
import {
  resolveContext,
  type QueryableDatabase,
  type RepositoryContext,
  type ResolvedContext,
  type SqlValue,
} from './database.js';
import { instant } from './instants.js';

/**
 * Every table holding rows that belong to one user, in the order somebody
 * reading the file would want: who they are, then what they did.
 *
 * Written out rather than derived, for the order — `account.test.ts` checks it
 * against the schema, so a new user table that is not added here fails there
 * instead of quietly being left out of everybody's export.
 */
export const USER_TABLE_NAMES = [
  'profiles',
  'body_metrics',
  'training_goals',
  'user_equipment',
  'workout_sessions',
  'session_exercises',
  'session_sets',
  'personal_records',
  'routines',
  'routine_exercises',
] as const;

export type UserTableName = (typeof USER_TABLE_NAMES)[number];

/** The tables the schema says are per-user. For the test that keeps the list above honest. */
export function schemaUserTables(): string[] {
  return AppSchema.tables.map((table) => table.name).filter((name) => !isReferenceTable(name));
}

/**
 * Columns whose Postgres type SQLite cannot hold, and what to turn them back into.
 *
 * Every other column in a user table is text or a number in both databases and
 * is copied as it is. `app-schema.test.ts` reads the real migrations and fails
 * if a boolean or JSON column appears in a user table without an entry here.
 */
export const EXPORT_COLUMN_TYPES: Readonly<
  Partial<Record<UserTableName, Readonly<Record<string, 'boolean' | 'json'>>>>
> = {
  workout_sessions: { generation_metadata: 'json' },
  session_sets: { is_completed: 'boolean' },
};

/** A value in the exported file: what SQLite holds, plus what it had to flatten. */
export type ExportValue =
  | string
  | number
  | boolean
  | null
  | readonly ExportValue[]
  | { readonly [key: string]: ExportValue };

export type ExportRow = Readonly<Record<string, ExportValue>>;

/** A catalogue entry the user's rows point at, so an id has a name. */
export interface ExportReference {
  readonly id: string;
  readonly slug: string | null;
  readonly name: string | null;
}

export interface ExportedData {
  readonly tables: Readonly<Record<UserTableName, readonly ExportRow[]>>;
  readonly exercises: readonly ExportReference[];
  readonly equipment: readonly ExportReference[];
}

/** Who the file belongs to, from the sign-in rather than the database. */
export interface ExportAccount {
  readonly id: string;
  readonly email: string | null;
  readonly createdAt: string | null;
  /** How they sign in — `email`, `google`. */
  readonly signInMethods: readonly string[];
}

/** What the device knew about sync when the file was made. */
export interface ExportDevice {
  /** Changes made here that the server does not have yet. They are in the file. */
  readonly pendingChanges: number;
  readonly lastSyncedAt: string | null;
}

/** The file. Versioned, so a later importer can tell what it is reading. */
export interface AccountExport {
  readonly format: 'g7m-export';
  readonly version: 1;
  readonly exportedAt: string;
  readonly account: ExportAccount;
  readonly device: ExportDevice;
  readonly data: ExportedData['tables'];
  readonly reference: {
    readonly exercises: readonly ExportReference[];
    readonly equipment: readonly ExportReference[];
  };
}

export class AccountRepository {
  private readonly ctx: ResolvedContext;

  constructor(
    private readonly db: QueryableDatabase,
    context: RepositoryContext,
  ) {
    this.ctx = resolveContext(context);
  }

  /**
   * Every row this user owns, table by table, oldest first.
   *
   * Filtered by owner even though the device should hold nobody else's rows —
   * a database handed between accounts is cleared (`owner.ts`), and this is
   * the file that must never carry a second person's training if one day it
   * is not.
   */
  async exportData(): Promise<ExportedData> {
    const tables = {} as Record<UserTableName, readonly ExportRow[]>;
    for (const table of USER_TABLE_NAMES) {
      const rows = await this.db.getAll<Record<string, SqlValue>>(
        `SELECT * FROM ${table} WHERE user_id = ? ORDER BY ${instant('created_at')}, id`,
        [this.ctx.userId],
      );
      tables[table] = rows.map((row) => decodeRow(table, row));
    }

    const exercises = await this.db.getAll<ExportReference>(
      `SELECT id, slug, name FROM exercises
        WHERE id IN (
          SELECT exercise_id FROM session_exercises WHERE user_id = ?
          UNION SELECT exercise_id FROM personal_records WHERE user_id = ?
          UNION SELECT exercise_id FROM routine_exercises WHERE user_id = ?
        )
        ORDER BY name, id`,
      [this.ctx.userId, this.ctx.userId, this.ctx.userId],
    );
    const equipment = await this.db.getAll<ExportReference>(
      `SELECT id, slug, name FROM equipment
        WHERE id IN (SELECT equipment_id FROM user_equipment WHERE user_id = ?)
        ORDER BY name, id`,
      [this.ctx.userId],
    );

    return { tables, exercises, equipment };
  }
}

/** Put the file together. Pure, so its shape is tested without a database. */
export function buildAccountExport(input: {
  readonly data: ExportedData;
  readonly account: ExportAccount;
  readonly device: ExportDevice;
  readonly exportedAt: Date;
}): AccountExport {
  return {
    format: 'g7m-export',
    version: 1,
    exportedAt: input.exportedAt.toISOString(),
    account: input.account,
    device: input.device,
    data: input.data.tables,
    reference: { exercises: input.data.exercises, equipment: input.data.equipment },
  };
}

function decodeRow(table: UserTableName, row: Record<string, SqlValue>): ExportRow {
  const types = EXPORT_COLUMN_TYPES[table];
  if (types === undefined) return row;

  const decoded: Record<string, ExportValue> = { ...row };
  for (const [column, type] of Object.entries(types)) {
    const value = row[column];
    if (value === undefined || value === null) continue;
    decoded[column] = type === 'boolean' ? value === 1 || value === '1' : parseJson(value);
  }
  return decoded;
}

/**
 * JSON text back into JSON, or left as text when it is not JSON.
 *
 * A malformed value is the database's problem, not a reason for somebody's
 * export to fail: the file carries it exactly as stored.
 */
function parseJson(value: string | number): ExportValue {
  if (typeof value === 'number') return value;
  try {
    return JSON.parse(value) as ExportValue;
  } catch {
    return value;
  }
}
