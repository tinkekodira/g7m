import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startHarness, type Harness } from '../testing/pglite-harness.js';
import { AppSchema, isReferenceTable } from './app-schema.js';

/**
 * The third place the table list has to be right.
 *
 * A row reaches a device only if all three agree: it is in the Postgres
 * publication (or replication never sees it), it is in the sync rules (or the
 * server never sends it), and it is in the client schema (or the device has
 * nowhere to put it). Two of those are generated from the third. This checks
 * the one that is not — the publication, which lives in SQL because creating it
 * needs privileges the client does not have.
 *
 * The failure this prevents is quiet in the worst way. A table missing from the
 * publication produces no error anywhere: the app builds, sync connects,
 * everything reports healthy, and that one table is simply always empty on
 * every device.
 */

let harness: Harness;
let published: Set<string>;

beforeAll(async () => {
  harness = await startHarness();
  const result = await harness.db.query<{ schemaname: string; tablename: string }>(
    `select schemaname, tablename
       from pg_publication_tables
      where pubname = 'powersync'`,
  );
  published = new Set(result.rows.map((row) => `${row.schemaname}.${row.tablename}`));
}, 60_000);

afterAll(async () => {
  await harness.close();
});

describe('the powersync publication', () => {
  it('exists', async () => {
    const result = await harness.db.query<{ pubname: string }>(
      `select pubname from pg_publication where pubname = 'powersync'`,
    );
    expect(result.rows).toHaveLength(1);
  });

  it('publishes every table the client syncs', () => {
    const missing = AppSchema.tables
      .map((table) => `public.${table.name}`)
      .filter((name) => !published.has(name));
    expect(
      missing,
      'synced tables missing from the publication would be silently empty on every device',
    ).toEqual([]);
  });

  it('publishes nothing the client does not sync', () => {
    const synced = new Set(AppSchema.tables.map((table) => `public.${table.name}`));
    const extra = [...published].filter((name) => !synced.has(name));
    expect(extra, 'tables streamed to PowerSync for no reason').toEqual([]);
  });

  /**
   * `FOR ALL TABLES` would sweep in whatever else the database happens to hold
   * and keep doing so as the schema grows. The point of naming tables is that
   * adding one is a decision.
   */
  it('is not a FOR ALL TABLES publication', async () => {
    const result = await harness.db.query<{ puballtables: boolean }>(
      `select puballtables from pg_publication where pubname = 'powersync'`,
    );
    expect(result.rows[0]?.puballtables).toBe(false);
  });

  it('never publishes the auth schema', () => {
    const auth = [...published].filter((name) => name.startsWith('auth.'));
    expect(auth, 'PowerSync learns the user from the JWT, never from auth.users').toEqual([]);
  });

  /**
   * Logical replication identifies a changed row by its replica identity.
   * Postgres defaults that to the primary key, which every table here has —
   * but a table with no primary key and no explicit replica identity silently
   * refuses UPDATE and DELETE once it is in a publication, and the first
   * anybody hears of it is a write failing in production.
   */
  it('can identify a row for update and delete on every published table', async () => {
    const result = await harness.db.query<{ relname: string; relreplident: string }>(
      `select c.relname, c.relreplident
         from pg_publication_tables pt
         join pg_class c on c.relname = pt.tablename
         join pg_namespace n on n.oid = c.relnamespace and n.nspname = pt.schemaname
        where pt.pubname = 'powersync'`,
    );
    const unusable = result.rows
      // 'd' = default (primary key), 'f' = full, 'i' = a chosen unique index.
      .filter((row) => !['d', 'f', 'i'].includes(row.relreplident))
      .map((row) => row.relname);
    expect(unusable).toEqual([]);

    // Default replica identity is only usable if a primary key actually exists.
    const noPrimaryKey = await harness.db.query<{ tablename: string }>(
      `select pt.tablename
         from pg_publication_tables pt
         join pg_class c on c.relname = pt.tablename
         join pg_namespace n on n.oid = c.relnamespace and n.nspname = pt.schemaname
        where pt.pubname = 'powersync'
          and c.relreplident = 'd'
          and not exists (
            select 1 from pg_index i where i.indrelid = c.oid and i.indisprimary
          )`,
    );
    expect(noPrimaryKey.rows.map((row) => row.tablename)).toEqual([]);
  });
});

describe('what the publication implies about the sync rules', () => {
  it('publishes the user tables that the sync rules filter by user', () => {
    // Both lists come from AppSchema, so this is really asserting that the
    // reference/user split survived the trip into SQL — that no user-owned
    // table was quietly left out of the publication while its sync rule stayed.
    const userTables = AppSchema.tables
      .map((table) => table.name)
      .filter((name) => !isReferenceTable(name));
    for (const name of userTables) {
      expect(published.has(`public.${name}`), `${name} is synced but not published`).toBe(true);
    }
  });
});
