/**
 * A PowerSync service, as far as one device can tell.
 *
 * The real service follows Postgres' write-ahead log and serves what the sync
 * rules select from it. This one re-runs the sync rules' queries whenever a
 * user's data may have changed, diffs the result against what it last served,
 * and appends the difference to an operation log per bucket. That log is what
 * a device downloads, in the same lines the service sends — `checkpoint`,
 * `data`, `checkpoint_complete` — over the same newline-delimited JSON stream
 * the SDK negotiates (`application/x-ndjson`).
 *
 * What is faithful, because the app's behaviour depends on it:
 *
 *   · Buckets and columns come from `powersync/sync-rules.yaml` itself.
 *   · Values are rendered as the service renders them under these rules'
 *     `config` — timestamps included, in either spelling (`renderTimestamp`),
 *     so the device holds what a phone would.
 *   · Checksums add up, so the client's own validation runs and passes.
 *   · Write checkpoints, in the `requests` mode the SDK uses by default: an
 *     upload is not reflected on the device until a checkpoint carries an id
 *     at least as high as the one the device asked for after uploading.
 *
 * What is not: compaction, priorities other than the default, sync streams,
 * and anything about scale. See e2e/README.md.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Database } from './database.js';
import type { BucketQuery, SyncRules, TimestampFormat } from './sync-rules.js';

type OpType = 'PUT' | 'REMOVE';

interface Op {
  readonly opId: number;
  readonly op: OpType;
  readonly objectType: string;
  readonly objectId: string;
  readonly data?: string;
}

/**
 * One bucket's history. Every op counts 1 towards the checksum, which the
 * client sums over everything it has received — superseded ops included —
 * so the total is simply how many ops there have ever been.
 */
class Bucket {
  readonly ops: Op[] = [];
  /** `table/id` → the row as last served, so a change can be told from none. */
  readonly rows = new Map<string, { table: string; id: string; data: string }>();

  constructor(readonly name: string) {}

  get checksum(): number {
    return this.ops.length >>> 0;
  }
}

interface LiveStream {
  readonly userId: string;
  readonly clientId: string;
  readonly response: ServerResponse;
  /** The last op id this stream has been sent, per bucket. */
  readonly sent: Map<string, number>;
  keepAlive: NodeJS.Timeout;
}

/** The body of `POST /sync/stream`, as far as the fake reads it. */
interface StreamRequest {
  readonly client_id?: string;
  readonly buckets?: readonly { readonly name: string; readonly after: string }[];
}

type ColumnTypes = ReadonlyMap<string, ReadonlyMap<string, string>>;

export class SyncService {
  private nextOpId = 1;
  private readonly buckets = new Map<string, Bucket>();
  private readonly streams = new Set<LiveStream>();
  /** `user/client` → the highest checkpoint request id accepted. */
  private readonly accepted = new Map<string, number>();

  private constructor(
    private readonly db: Database,
    private readonly rules: SyncRules,
    private readonly types: ColumnTypes,
  ) {}

  static async start(db: Database, rules: SyncRules): Promise<SyncService> {
    const rows = await db.asService((pg) =>
      pg.query<{ table_name: string; column_name: string; data_type: string }>(
        `select table_name, column_name, data_type from information_schema.columns
          where table_schema = 'public'`,
      ),
    );
    const types = new Map<string, Map<string, string>>();
    for (const row of rows.rows) {
      const table = types.get(row.table_name) ?? new Map<string, string>();
      table.set(row.column_name, row.data_type);
      types.set(row.table_name, table);
    }

    const service = new SyncService(db, rules, types);
    for (const [name, queries] of rules.global) {
      await service.refresh(globalBucketName(name), queries, null);
    }
    return service;
  }

  /**
   * Something this user owns may have changed: re-read their buckets and push
   * any difference to every device they have connected.
   */
  async changed(userId: string): Promise<void> {
    await this.refreshUser(userId);
    for (const stream of this.streams) {
      if (stream.userId === userId) this.sendCheckpoint(stream);
    }
  }

  /** `POST /sync/stream`: the long-lived download a device keeps open. */
  async openStream(
    userId: string,
    request: StreamRequest,
    http: IncomingMessage,
    response: ServerResponse,
  ): Promise<void> {
    await this.refreshUser(userId);

    response.writeHead(200, { 'Content-Type': 'application/x-ndjson' });
    const sent = new Map<string, number>();
    for (const bucket of request.buckets ?? []) sent.set(bucket.name, Number(bucket.after));

    const stream: LiveStream = {
      userId,
      clientId: request.client_id ?? '',
      response,
      sent,
      keepAlive: setInterval(() => {
        write(stream, { token_expires_in: 3600 });
      }, 10_000),
    };
    this.streams.add(stream);
    http.on('close', () => {
      clearInterval(stream.keepAlive);
      this.streams.delete(stream);
    });

    this.sendCheckpoint(stream);
  }

  /**
   * `POST /sync/checkpoint-request`: a device asking to be told when the
   * service has everything it just uploaded. The service keeps the highest id
   * it has been given per device and answers with it; the next checkpoint to
   * that device carries it as `write_checkpoint`, which is what lets the
   * device apply downloaded data over its own local writes again.
   */
  checkpointRequest(userId: string, clientId: string, requested: number): number {
    const key = `${userId}/${clientId}`;
    const accepted = Math.max(this.accepted.get(key) ?? 0, requested);
    this.accepted.set(key, accepted);
    // After answering, not before: the SDK stores the answer and only then
    // expects a checkpoint that honours it.
    setTimeout(() => {
      void this.changed(userId);
    }, 0);
    return accepted;
  }

  /** `GET /write-checkpoint2.json`: the same, in the SDK's legacy mode. */
  legacyWriteCheckpoint(userId: string, clientId: string): number {
    const key = `${userId}/${clientId}`;
    return this.checkpointRequest(userId, clientId, (this.accepted.get(key) ?? 0) + 1);
  }

  close(): void {
    for (const stream of this.streams) {
      clearInterval(stream.keepAlive);
      stream.response.end();
    }
    this.streams.clear();
  }

  private async refreshUser(userId: string): Promise<void> {
    for (const [name, queries] of this.rules.perUser) {
      await this.refresh(userBucketName(name, userId), queries, userId);
    }
  }

  /** Re-run a bucket's queries and log what changed since the last run. */
  private async refresh(
    name: string,
    queries: readonly BucketQuery[],
    userId: string | null,
  ): Promise<void> {
    const bucket = this.buckets.get(name) ?? new Bucket(name);
    this.buckets.set(name, bucket);

    const now = new Map<string, { table: string; id: string; data: string }>();
    await this.db.asService(async (pg) => {
      for (const query of queries) {
        const sql =
          `select ${query.columns.map((column) => this.selectAs(query.table, column)).join(', ')}` +
          ` from public.${query.table}` +
          (query.perUser ? ' where user_id = $1' : '');
        const result = await pg.query<Record<string, unknown>>(sql, query.perUser ? [userId] : []);
        for (const row of result.rows) {
          const id = String(row['id']);
          const values: Record<string, unknown> = {};
          for (const column of query.columns) {
            if (column !== 'id') values[column] = this.render(query.table, column, row[column]);
          }
          now.set(`${query.table}/${id}`, { table: query.table, id, data: JSON.stringify(values) });
        }
      }
    });

    for (const [key, row] of now) {
      if (bucket.rows.get(key)?.data === row.data) continue;
      bucket.ops.push({
        opId: this.nextOpId++,
        op: 'PUT',
        objectType: row.table,
        objectId: row.id,
        data: row.data,
      });
      bucket.rows.set(key, row);
    }
    for (const [key, row] of bucket.rows) {
      if (now.has(key)) continue;
      bucket.ops.push({
        opId: this.nextOpId++,
        op: 'REMOVE',
        objectType: row.table,
        objectId: row.id,
      });
      bucket.rows.delete(key);
    }
  }

  /**
   * Postgres to a sync value, in SQL where Postgres' own text is the answer.
   *
   * Timestamps are Postgres' text in UTC — `2026-09-13 10:00:00.123+00` —
   * which becomes the service's legacy rendering below. Arrays become JSON
   * text, booleans 1 or 0, as SQLite has neither.
   */
  private selectAs(table: string, column: string): string {
    const type = this.types.get(table)?.get(column);
    if (type === undefined) {
      throw new Error(`The sync rules select ${table}.${column}, which is not in the schema.`);
    }
    if (type === 'ARRAY') return `to_json(${column})::text as ${column}`;
    if (type === 'boolean') return `${column}::int as ${column}`;
    if (type === 'uuid' || type === 'text' || type === 'character varying') return column;
    return `${column}::text as ${column}`;
  }

  private render(table: string, column: string, value: unknown): unknown {
    if (value === null || value === undefined) return null;
    const type = this.types.get(table)?.get(column);
    switch (type) {
      case 'timestamp with time zone':
        return typeof value === 'string' ? renderTimestamp(value, this.rules.timestamps) : value;
      case 'integer':
      case 'smallint':
      case 'bigint':
      case 'real':
      case 'double precision':
        return Number(value);
      default:
        // uuid, text, date, numeric (as text, like the service), JSON as text.
        return value;
    }
  }

  private bucketsFor(userId: string): Bucket[] {
    const names = [
      ...[...this.rules.global.keys()].map(globalBucketName),
      ...[...this.rules.perUser.keys()].map((name) => userBucketName(name, userId)),
    ];
    return names.flatMap((name) => {
      const bucket = this.buckets.get(name);
      return bucket === undefined ? [] : [bucket];
    });
  }

  /** A full checkpoint, everything the stream has not had yet, and the line that closes it. */
  private sendCheckpoint(stream: LiveStream): void {
    const buckets = this.bucketsFor(stream.userId);
    const lastOpId = Math.max(0, ...buckets.map((bucket) => bucket.ops.at(-1)?.opId ?? 0));
    const accepted = this.accepted.get(`${stream.userId}/${stream.clientId}`);

    write(stream, {
      checkpoint: {
        last_op_id: String(lastOpId),
        write_checkpoint: accepted === undefined ? null : String(accepted),
        buckets: buckets.map((bucket) => ({
          bucket: bucket.name,
          checksum: bucket.checksum,
          count: bucket.ops.length,
          priority: 3,
        })),
      },
    });

    for (const bucket of buckets) {
      const after = stream.sent.get(bucket.name) ?? 0;
      const pending = bucket.ops.filter((op) => op.opId > after);
      for (let start = 0; start < pending.length; start += 500) {
        const chunk = pending.slice(start, start + 500);
        write(stream, {
          data: {
            bucket: bucket.name,
            after: String(chunk[0] === undefined ? after : chunk[0].opId - 1),
            next_after: String(chunk.at(-1)?.opId ?? after),
            has_more: start + 500 < pending.length,
            data: chunk.map((op) => ({
              op_id: String(op.opId),
              op: op.op,
              object_type: op.objectType,
              object_id: op.objectId,
              checksum: 1,
              ...(op.data === undefined ? {} : { data: op.data }),
            })),
          },
        });
      }
      stream.sent.set(bucket.name, bucket.ops.at(-1)?.opId ?? after);
    }

    write(stream, { checkpoint_complete: { last_op_id: String(lastOpId) } });
  }
}

/**
 * A `timestamptz` as the service writes it, from Postgres' text in UTC
 * (`2026-09-13 10:00:00.12345+00`).
 *
 * Legacy: Postgres' own text with a `Z` — a space, and a fraction only when
 * there is one. ISO 8601: a `T`, and the fraction cut (not rounded) or padded
 * to the configured digits, which is what the service's `renderSubseconds`
 * does.
 */
export function renderTimestamp(postgres: string, format: TimestampFormat): string {
  const match = /^(\d{4,}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})(?:\.(\d+))?\+00$/.exec(postgres);
  if (match === null) return postgres;
  const [, date = '', time = '', fraction = ''] = match;
  if (!format.iso8601) return `${date} ${time}${fraction === '' ? '' : `.${fraction}`}Z`;
  const digits = format.subSecondDigits;
  const sub = fraction.slice(0, digits).padEnd(digits, '0');
  return `${date}T${time}${digits === 0 ? '' : `.${sub}`}Z`;
}

/** `catalogue[]`: a bucket with no parameters, as the service names it. */
function globalBucketName(name: string): string {
  return `${name}[]`;
}

/** `user_data["<id>"]`, as the service names a parameterised bucket. */
function userBucketName(name: string, userId: string): string {
  return `${name}[${JSON.stringify(userId)}]`;
}

function write(stream: LiveStream, line: unknown): void {
  if (!stream.response.writableEnded) stream.response.write(`${JSON.stringify(line)}\n`);
}
