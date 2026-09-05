/**
 * The sync rules, rendered from the client schema.
 *
 * PowerSync's sync rules decide, on the server, which rows each device gets.
 * They live in the PowerSync dashboard — not in this repository, not in the
 * build, and not anywhere CI can see them. That makes them the one part of the
 * data path that can silently disagree with everything else: sync a column the
 * client does not know about and you waste bandwidth; fail to sync one it does
 * and the field is null on every device with nothing logged anywhere.
 *
 * So they are generated from `AppSchema` rather than written by hand. The
 * rendered result is committed at `powersync/sync-rules.yaml`, and
 * `sync-rules.test.ts` asserts the committed file still matches what this
 * produces — which turns "somebody changed the schema and forgot the
 * dashboard" from a silent runtime problem into a failed build.
 *
 *     pnpm sync-rules      regenerate the committed file
 *
 * The generated file is what gets pasted into the dashboard. See
 * `docs/powersync-setup.md`.
 *
 * ## The two buckets
 *
 * `catalogue` has no parameters, so every signed-in user gets all of it: the
 * exercises, the muscles, the equipment. A few hundred rows, and having it on
 * the device is what lets the picker and the 3D model work with no network.
 *
 * `user_data` is parameterised by the user id from the JWT, so a device only
 * ever receives rows it owns. This is a second, independent enforcement of the
 * same boundary RLS enforces on the Postgres side — PowerSync reads the
 * database through a replication slot, which bypasses RLS entirely, so the
 * bucket definition is not a convenience here. It is the access control.
 */
import { AppSchema, isReferenceTable } from './app-schema.js';

/**
 * `request.user_id()` reads the `sub` claim of the Supabase JWT.
 *
 * Older sync-rules dialects spell this `token_parameters.user_id`. If the
 * dashboard rejects the line below, that is the substitution to make.
 */
const USER_ID_PARAMETER = 'SELECT request.user_id() AS user_id';

/**
 * Columns are listed explicitly rather than with `SELECT *`.
 *
 * `SELECT *` would quietly start syncing any column added to Postgres later,
 * including ones the client has no schema for, and would also try to carry
 * `exercises.search_text` — a generated column, which logical replication does
 * not deliver before Postgres 18. Naming the columns keeps this file an exact
 * statement of the contract, and regenerating it is one command.
 */
function columnsFor(tableName: string): string[] {
  const table = AppSchema.tables.find((candidate) => candidate.name === tableName);
  if (table === undefined) throw new Error(`No table named ${tableName} in AppSchema`);
  // `id` is not declared in the client schema — PowerSync adds it to every
  // table itself — but it must be selected, because it is how a row is
  // identified on the wire.
  return ['id', ...table.columns.map((column) => column.name)];
}

function selectFor(tableName: string): string {
  const columns = columnsFor(tableName).join(', ');
  const from = `SELECT ${columns} FROM ${tableName}`;
  return isReferenceTable(tableName) ? from : `${from} WHERE user_id = bucket.user_id`;
}

/** Wrapped so a long column list stays readable in the dashboard editor. */
function wrap(statement: string, indent: string, width = 96): string[] {
  const words = statement.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    if (line.length > 0 && `${line} ${word}`.length + indent.length > width) {
      lines.push(line);
      line = word;
    } else {
      line = line.length > 0 ? `${line} ${word}` : word;
    }
  }
  if (line.length > 0) lines.push(line);
  return lines;
}

function dataEntry(tableName: string): string {
  const [first, ...rest] = wrap(selectFor(tableName), '      - ');
  const lines = [`      - >-`, `        ${first ?? ''}`];
  for (const line of rest) lines.push(`        ${line}`);
  return lines.join('\n');
}

/**
 * The complete `sync-rules.yaml`, ending in a newline.
 *
 * Deterministic: the same schema renders the same bytes, which is what lets a
 * test compare it against the committed file.
 */
export function renderSyncRules(): string {
  const referenceTables = AppSchema.tables.map((t) => t.name).filter(isReferenceTable);
  const userTables = AppSchema.tables.map((t) => t.name).filter((name) => !isReferenceTable(name));

  return `# PowerSync sync rules for g7m.
#
# GENERATED FILE - do not edit by hand.
# Run \`pnpm sync-rules\` after changing packages/db/src/schema/app-schema.ts.
#
# Paste the contents of this file into the PowerSync dashboard:
#   Manage instances -> (your instance) -> Sync rules -> Deploy.
# See docs/powersync-setup.md.
#
# Two buckets, and the difference matters:
#
#   catalogue  no parameters, so every signed-in user receives all of it. This
#              is the exercise and anatomy reference data. Read-only on the
#              device; Postgres has no write policy on these tables at all.
#
#   user_data  parameterised by the user id in the Supabase JWT, so a device
#              receives only rows it owns. This parameter is not an
#              optimisation, it is the access control: PowerSync follows the
#              write-ahead log, and logical decoding is not filtered by row
#              level security, so RLS is not what separates one user's training
#              history from another's. A mistake here publishes one to the
#              other.
#
#              (RLS does still apply to the one-off SELECT PowerSync makes when
#              it first snapshots a table, which is why the replication role
#              needs BYPASSRLS — without it the snapshot reads zero rows. See
#              docs/powersync-setup.md step 2.)

bucket_definitions:
  catalogue:
    data:
${referenceTables.map(dataEntry).join('\n')}

  user_data:
    parameters: ${USER_ID_PARAMETER}
    data:
${userTables.map(dataEntry).join('\n')}
`;
}
