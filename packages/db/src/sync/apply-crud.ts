/**
 * Turning a queued local change into a write against Postgres.
 *
 * PowerSync hands back three kinds of change, and the mapping is not quite the
 * obvious one:
 *
 *   PUT     an insert. Applied as an **upsert on `id`**, not an insert, so that
 *           re-sending a write whose acknowledgement was lost is harmless
 *           rather than a duplicate-key failure.
 *
 *   PATCH   an update, carrying only the columns that actually changed.
 *           Applied as a partial update, which is what makes concurrent edits
 *           merge per column: if one device changes the reps and another the
 *           weight, both survive. ADR-0017 promised only row-level
 *           last-write-wins here; sending just the changed columns is strictly
 *           better and costs nothing.
 *
 *   DELETE  a delete by id.
 *
 * Row level security does the rest. Every policy is `user_id = auth.uid()`, and
 * the composite foreign keys mean a child row cannot be attached to another
 * user's parent — so a write that should not happen is refused by Postgres
 * rather than prevented by care taken here.
 *
 * This module is deliberately free of any Supabase types. It decides *what* the
 * write is; the caller performs it. That keeps the decisions testable without a
 * network, a browser, or a signed-in user.
 */

export type CrudOperation = 'PUT' | 'PATCH' | 'DELETE';

/** The parts of a PowerSync `CrudEntry` this needs. */
export interface QueuedChange {
  readonly op: CrudOperation;
  readonly table: string;
  readonly id: string;
  readonly opData?: Record<string, unknown> | undefined;
}

export interface UpsertWrite {
  readonly kind: 'upsert';
  readonly table: string;
  readonly row: Record<string, unknown>;
}

export interface UpdateWrite {
  readonly kind: 'update';
  readonly table: string;
  readonly id: string;
  readonly changes: Record<string, unknown>;
}

export interface DeleteWrite {
  readonly kind: 'delete';
  readonly table: string;
  readonly id: string;
}

export type PlannedWrite = UpsertWrite | UpdateWrite | DeleteWrite;

/**
 * Columns Postgres owns, which must never be sent up from a device.
 *
 * `updated_at` is maintained by a trigger on every table. A phone with a clock
 * two seconds ahead — which is exactly what happened during Phase 2a — would
 * otherwise write a future timestamp and win every subsequent comparison
 * against rows that are genuinely newer.
 *
 * `search_text` is a generated column: Postgres rejects any write to it
 * outright, which would turn one stale row into a permanently jammed queue.
 */
const SERVER_OWNED_COLUMNS = new Set(['updated_at', 'search_text']);

function withoutServerOwnedColumns(data: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (SERVER_OWNED_COLUMNS.has(key)) continue;
    cleaned[key] = value;
  }
  return cleaned;
}

/**
 * What this change means as a write, or `null` if it means nothing.
 *
 * A PATCH whose only changed columns are server-owned is the null case: the
 * device has nothing to say, and sending an empty update would be a round trip
 * to achieve nothing. It is dropped here rather than at the call site so that
 * "nothing to do" and "failed" stay distinguishable.
 */
export function planWrite(change: QueuedChange): PlannedWrite | null {
  switch (change.op) {
    case 'DELETE':
      return { kind: 'delete', table: change.table, id: change.id };

    case 'PUT': {
      // The id lives on the entry, not in opData, and the row is useless
      // without it — an upsert has to know what it is conflicting with.
      const row = { ...withoutServerOwnedColumns(change.opData ?? {}), id: change.id };
      return { kind: 'upsert', table: change.table, row };
    }

    case 'PATCH': {
      const changes = withoutServerOwnedColumns(change.opData ?? {});
      if (Object.keys(changes).length === 0) return null;
      return { kind: 'update', table: change.table, id: change.id, changes };
    }
  }
}

/**
 * Whether a planned write is missing the one column RLS will judge it on.
 *
 * Every user table's policy is `user_id = auth.uid()`, both `using` and
 * `with check`. An insert that arrives without `user_id` is refused — and
 * refused permanently, so it is discarded and the row never leaves the device.
 *
 * Catching it here turns a silent data loss into an assertion the repository
 * layer can be tested against, which is the whole reason it is worth checking
 * something the database will check anyway.
 */
export function isMissingOwner(write: PlannedWrite, referenceTables: readonly string[]): boolean {
  if (write.kind !== 'upsert') return false;
  if (referenceTables.includes(write.table)) return false;
  const owner = write.row['user_id'];
  return owner === undefined || owner === null || owner === '';
}
