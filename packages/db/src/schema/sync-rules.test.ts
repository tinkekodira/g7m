import { describe, expect, it } from 'vitest';
import { AppSchema, isReferenceTable, REFERENCE_TABLE_NAMES } from './app-schema.js';
import { renderSyncRules } from './sync-rules.js';

/**
 * The sync rules live in the PowerSync dashboard, where nothing in this
 * repository can see them. These tests cover the half that can be checked: that
 * the file we tell someone to paste there is a faithful rendering of the schema
 * the app ships, and that it says what it needs to say about who gets which
 * rows.
 *
 * What they cannot check is whether the dashboard actually holds this version.
 * That gap is closed by hand, in docs/powersync-setup.md, and by the fact that
 * a stale bucket definition shows up immediately as missing data rather than as
 * wrong data.
 */

describe('the committed sync rules', () => {
  /**
   * The committed file is a rendering of the schema, not a document somebody
   * maintains. Regenerate it with `pnpm sync-rules` and redeploy it in the
   * dashboard — this failing means the two have parted company.
   */
  it('matches what the current schema renders', async () => {
    await expect(renderSyncRules()).toMatchFileSnapshot('../../../../powersync/sync-rules.yaml');
  });
});

/**
 * The rules with the comment lines removed, folded onto one line.
 *
 * Comments have to go before anything greps for SQL. The file's header explains
 * what the buckets do, in prose that naturally contains words like SELECT and
 * table — and a regex looking for `SELECT … FROM muscle_groups` will happily
 * anchor on a sentence and capture half the document. That is not hypothetical:
 * adding one sentence about RLS to the header broke these tests, which is a
 * test reading its own preamble rather than the rules.
 */
function statements(yaml: string): string {
  return yaml
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => !line.startsWith('#'))
    .join(' ');
}

describe('what the rules must say', () => {
  const yaml = renderSyncRules();
  const flattened = statements(yaml);

  it('defines exactly the two buckets', () => {
    expect(yaml).toContain('bucket_definitions:');
    expect(yaml).toContain('  catalogue:');
    expect(yaml).toContain('  user_data:');
  });

  it('parameterises user data by the id in the JWT', () => {
    expect(yaml).toContain('parameters: SELECT request.user_id() AS user_id');
  });

  /**
   * The one that would be a data breach rather than a bug.
   *
   * PowerSync follows the write-ahead log, and logical decoding is not filtered
   * by row level security. If a user-owned table were listed in the
   * unparameterised `catalogue` bucket, every device would receive every user's
   * rows and Postgres would never object.
   */
  it('filters every user-owned table by the bucket user', () => {
    const userTables = AppSchema.tables
      .map((table) => table.name)
      .filter((name) => !isReferenceTable(name));

    expect(userTables.length).toBeGreaterThan(0);
    for (const table of userTables) {
      const statement = new RegExp(`SELECT [^;]*? FROM ${table}\\b[^-]*`).exec(flattened);
      expect(statement, `no SELECT found for ${table}`).not.toBeNull();
      expect(statement?.[0], `${table} is synced without a user filter`).toContain(
        'WHERE user_id = bucket.user_id',
      );
    }
  });

  it('puts no user-owned table in the shared catalogue bucket', () => {
    const catalogue = flattened.slice(
      flattened.indexOf('catalogue:'),
      flattened.indexOf('user_data:'),
    );
    for (const table of AppSchema.tables) {
      if (isReferenceTable(table.name)) continue;
      expect(catalogue, `${table.name} appears in the shared bucket`).not.toContain(
        ` FROM ${table.name}`,
      );
    }
  });

  it('syncs every reference table to everyone, unfiltered', () => {
    const catalogue = flattened.slice(
      flattened.indexOf('catalogue:'),
      flattened.indexOf('user_data:'),
    );
    for (const name of REFERENCE_TABLE_NAMES) {
      expect(catalogue, `${name} is missing from the catalogue bucket`).toContain(` FROM ${name}`);
    }
    expect(catalogue).not.toContain('bucket.user_id');
  });

  /**
   * Every column the client declares must be selected, or the field is null on
   * the device with nothing logged anywhere to say why.
   */
  it('selects every column the client schema declares, plus id', () => {
    for (const table of AppSchema.tables) {
      const statement = new RegExp(`SELECT ([^;]*?) FROM ${table.name}\\b`).exec(flattened);
      expect(statement, `no SELECT for ${table.name}`).not.toBeNull();
      const selected = new Set((statement?.[1] ?? '').split(',').map((column) => column.trim()));
      expect(selected.has('id'), `${table.name} does not select id`).toBe(true);
      for (const column of table.columns) {
        expect(selected.has(column.name), `${table.name}.${column.name} is not synced`).toBe(true);
      }
    }
  });

  /**
   * `SELECT *` would start syncing anything added to Postgres later, including
   * `exercises.search_text` — a generated column that logical replication does
   * not deliver before Postgres 18, and which the client rebuilds locally.
   */
  it('never uses SELECT *', () => {
    expect(flattened).not.toContain('SELECT *');
  });

  it('does not sync the generated search column', () => {
    expect(flattened).not.toContain('search_text');
  });

  it('renders the same bytes every time, so the snapshot is stable', () => {
    expect(renderSyncRules()).toBe(yaml);
  });
});
