/**
 * @g7m/db — the only place in the codebase that talks to a database.
 *
 * Brief §0.5: every database write goes through a repository layer. No
 * component touches the DB directly. That rule is what makes the offline story
 * testable and the sync story swappable.
 *
 * What is here now:
 *
 *   `schema/app-schema.ts`   the device's SQLite schema, and the record of
 *                            which Postgres columns are deliberately not on it
 *   `schema/sync-rules.ts`   renders powersync/sync-rules.yaml from that schema
 *   `testing/`               the PGlite harness that runs the real migrations
 *
 * Still to come in Phase 2: the PowerSync client and the repository
 * implementations, which need a live instance to be worth writing against.
 *
 * The Phase 1 note here said this package would hold a Drizzle schema. It does
 * not, and ADR-0028 records why — briefly, PowerSync needs its own schema
 * object either way, so Drizzle would have been a second definition of the same
 * thing behind a pre-1.0 driver.
 */
export {
  AppSchema,
  isReferenceTable,
  REFERENCE_TABLE_NAMES,
  UNSYNCED_COLUMNS,
  UNSYNCED_TABLES,
  type LocalDatabase,
  type ReferenceTableName,
} from './schema/app-schema.js';
export { renderSyncRules } from './schema/sync-rules.js';
