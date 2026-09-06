/**
 * What a repository needs from a database, and nothing more.
 *
 * PowerSync's `AbstractPowerSyncDatabase` has a large surface — sync status,
 * listeners, CRUD batches, watched queries. A repository needs five methods of
 * it, and depending on the whole thing would mean the repositories could only
 * ever run inside a browser with a live sync connection.
 *
 * Narrowing it to this interface costs nothing (PowerSync's database satisfies
 * it structurally, with no adapter) and buys the thing that matters: the
 * repositories can be tested against a real SQLite database in Node, running
 * the real SQL. See `testing/sqlite-harness.ts`.
 */

/** A value SQLite can store. */
export type SqlValue = string | number | null;

export interface QueryableDatabase {
  /** Every matching row. */
  getAll: <T>(sql: string, parameters?: SqlValue[]) => Promise<T[]>;
  /** The one matching row, or null. */
  getOptional: <T>(sql: string, parameters?: SqlValue[]) => Promise<T | null>;
  /** The one matching row. Throws when there is none. */
  get: <T>(sql: string, parameters?: SqlValue[]) => Promise<T>;
}

/**
 * Reads and writes, but no transaction of its own.
 *
 * This is what a transaction callback is handed. Deliberately narrower than
 * `WritableDatabase`: SQLite has no nested transactions, so a type that
 * offered one would be describing something the database cannot do — and it
 * is also the shape PowerSync's own `Transaction` has, which is why its
 * database satisfies the interface below structurally, with no adapter.
 */
export interface TransactionalDatabase extends QueryableDatabase {
  execute: (sql: string, parameters?: SqlValue[]) => Promise<unknown>;
}

export interface WritableDatabase extends TransactionalDatabase {
  /**
   * Run several statements as one unit.
   *
   * Matters more here than in a server database. A session and its first
   * exercise are two rows that are meaningless apart, and PowerSync assigns
   * everything written inside one transaction the same `transactionId` — so
   * they travel together in the upload queue rather than arriving split across
   * two batches with a network failure in between.
   */
  writeTransaction: <T>(fn: (tx: TransactionalDatabase) => Promise<T>) => Promise<T>;
}

/**
 * The identity a repository writes rows on behalf of.
 *
 * Passed explicitly rather than read from an auth store, because a repository
 * that reaches for global state cannot be tested without one — and because the
 * one thing that must never be wrong here is whose data this is.
 */
export interface RepositoryContext {
  /** The signed-in user's id. Stamped onto every row this writes. */
  readonly userId: string;
  /** Injectable so tests are deterministic. */
  readonly newId?: () => string;
  /** Injectable for the same reason. */
  readonly now?: () => Date;
}

/**
 * A v4 UUID.
 *
 * `crypto.randomUUID` is available in every engine this app targets — Safari
 * 15.4+, Chrome 92+, Node 19+ — and in a secure context, which a Home Screen
 * web app always is.
 *
 * Ids are minted on the device, never by the database. They have to be: a set
 * logged in a basement needs an id before anything reaches Postgres, and the
 * whole upload path depends on that id being stable so a re-sent write is an
 * upsert rather than a duplicate.
 */
export function newId(): string {
  return globalThis.crypto.randomUUID();
}

/** Resolved context, with the defaults filled in. */
export interface ResolvedContext {
  readonly userId: string;
  readonly newId: () => string;
  readonly now: () => Date;
}

export function resolveContext(context: RepositoryContext): ResolvedContext {
  if (context.userId === '') {
    // Better here than at the sync boundary. A row written with no owner is
    // refused by row level security, permanently, which means it is discarded
    // and the row is stranded on the device with nothing explaining why.
    throw new Error('A repository needs a signed-in user id to write rows.');
  }
  return {
    userId: context.userId,
    newId: context.newId ?? newId,
    now: context.now ?? (() => new Date()),
  };
}

/**
 * Timestamps go into SQLite as ISO 8601 in UTC.
 *
 * Not local time, and not epoch milliseconds. Postgres holds `timestamptz` and
 * hands PowerSync an ISO string; anything the device writes has to sort and
 * compare identically against those, and only UTC ISO does. It is also the one
 * format that stays correct when a lifter travels.
 */
export function toTimestamp(value: Date): string {
  return value.toISOString();
}
