/**
 * PostgREST, for the requests the app sends: the uploads PowerSync hands to
 * the connector (upsert by id, update by id, delete by id), the account
 * panel's reads, and RPC.
 *
 * Every request runs as the user its token names — `set role authenticated`
 * and the JWT claims, exactly as PostgREST does — so row level security is
 * what decides, here as in production. A write the real server would refuse
 * is refused, with the SQLSTATE the app's upload classification reads.
 *
 * Only the filters the app uses are understood (`col=eq.value`); anything else
 * is an error, so a new kind of query fails the test that first sends it
 * rather than being quietly misread.
 */
import type { PGlite } from '@electric-sql/pglite';
import type { Database } from './database.js';
import type { Reply } from './auth.js';

export type Schema = ReadonlyMap<string, ReadonlyMap<string, string>>;

export interface RestRequest {
  readonly method: string;
  /** The path after `/rest/v1/`. */
  readonly path: string;
  readonly query: URLSearchParams;
  readonly headers: Readonly<Record<string, string | string[] | undefined>>;
  readonly body: unknown;
  /** Who the token says is asking, or null for the publishable key alone. */
  readonly userId: string | null;
}

export interface RestReply extends Reply {
  readonly headers?: Record<string, string>;
}

const RESERVED = new Set(['select', 'on_conflict', 'columns', 'order', 'limit', 'offset']);
const IDENTIFIER = /^[a-z_][a-z0-9_]*$/;

export class RestService {
  constructor(
    private readonly db: Database,
    private readonly schema: Schema,
    /** Told after every successful write, so sync can serve it. */
    private readonly onWrite: (userId: string) => Promise<void>,
  ) {}

  async handle(request: RestRequest): Promise<RestReply> {
    try {
      const reply = await this.run(request);
      if (request.userId !== null && request.method !== 'GET' && request.method !== 'HEAD') {
        await this.onWrite(request.userId);
      }
      return reply;
    } catch (cause: unknown) {
      return postgresError(cause, request.userId !== null);
    }
  }

  private run(request: RestRequest): Promise<RestReply> {
    const as = <T>(fn: (pg: PGlite) => Promise<T>) =>
      request.userId === null ? this.db.asAnon(fn) : this.db.asUser(request.userId, fn);

    if (request.path.startsWith('rpc/')) {
      const name = request.path.slice('rpc/'.length);
      if (!IDENTIFIER.test(name)) return Promise.resolve(notFound(`No function ${name}`));
      const args = (request.body ?? {}) as Record<string, unknown>;
      const names = Object.keys(args).filter((key) => IDENTIFIER.test(key));
      const sql = `select public.${name}(${names.map((key, i) => `${key} => $${String(i + 1)}`).join(', ')}) as result`;
      return as(async (pg) => {
        const result = await pg.query<{ result: unknown }>(
          sql,
          names.map((key) => args[key]),
        );
        const value = result.rows[0]?.result;
        return value === null || value === undefined || value === ''
          ? { status: 204 }
          : { status: 200, body: value };
      });
    }

    const table = request.path;
    const columns = this.schema.get(table);
    if (!IDENTIFIER.test(table) || columns === undefined) {
      return Promise.resolve(notFound(`Could not find the table 'public.${table}'`));
    }

    switch (request.method) {
      case 'GET':
      case 'HEAD':
        return as((pg) => this.select(pg, table, request, this.filters(table, request.query, 0)));
      case 'POST':
        return as((pg) => this.insert(pg, table, request));
      case 'PATCH':
        return as(async (pg) => {
          const changes = request.body as Record<string, unknown>;
          const names = this.columnsOf(table, changes);
          // The body is $1, so the filters start at $2.
          const filters = this.filters(table, request.query, 1);
          await pg.query(
            `update public.${table} set ${names.map((c) => `${c} = r.${c}`).join(', ')}
               from json_populate_record(null::public.${table}, $1::json) r
              where ${filters.sql}`,
            [JSON.stringify(changes), ...filters.values],
          );
          return { status: 204 };
        });
      case 'DELETE':
        return as(async (pg) => {
          const filters = this.filters(table, request.query, 0);
          await pg.query(`delete from public.${table} where ${filters.sql}`, filters.values);
          return { status: 204 };
        });
      default:
        return Promise.resolve({ status: 405 });
    }
  }

  private async select(
    pg: PGlite,
    table: string,
    request: RestRequest,
    filters: { sql: string; values: unknown[] },
  ): Promise<RestReply> {
    const selected = request.query.get('select') ?? '*';
    const list =
      selected === '*'
        ? '*'
        : selected
            .split(',')
            .map((column) => this.column(table, column.trim()))
            .join(', ');
    const rows = (
      await pg.query<Record<string, unknown>>(
        `select ${list} from public.${table} where ${filters.sql}`,
        filters.values,
      )
    ).rows;

    const prefer = header(request, 'prefer');
    const headers: Record<string, string> = {};
    if (prefer.includes('count=exact')) {
      headers['Content-Range'] =
        rows.length === 0 ? `*/0` : `0-${String(rows.length - 1)}/${String(rows.length)}`;
    }
    if (request.method === 'HEAD') return { status: 200, headers };

    if (header(request, 'accept').includes('application/vnd.pgrst.object+json')) {
      if (rows.length !== 1) {
        return {
          status: 406,
          body: {
            code: 'PGRST116',
            message: 'JSON object requested, multiple (or no) rows returned',
            details: `The result contains ${String(rows.length)} rows`,
            hint: null,
          },
        };
      }
      return { status: 200, headers, body: rows[0] };
    }
    return { status: 200, headers, body: rows };
  }

  /**
   * An insert, or with `resolution=merge-duplicates` an upsert — the shape
   * PostgREST builds: the named columns, typed by `json_populate_recordset`,
   * and on conflict every one of them overwritten.
   */
  private async insert(pg: PGlite, table: string, request: RestRequest): Promise<RestReply> {
    const rows = (Array.isArray(request.body) ? request.body : [request.body]) as Record<
      string,
      unknown
    >[];
    const first = rows[0];
    if (first === undefined) return { status: 201 };
    const names = this.columnsOf(table, first);
    const conflict = request.query.get('on_conflict') ?? 'id';
    const upsert = header(request, 'prefer').includes('resolution=merge-duplicates');

    await pg.query(
      `insert into public.${table} (${names.join(', ')})
       select ${names.join(', ')} from json_populate_recordset(null::public.${table}, $1::json)` +
        (upsert
          ? ` on conflict (${this.column(table, conflict)}) do update set ` +
            names.map((c) => `${c} = excluded.${c}`).join(', ')
          : ''),
      [JSON.stringify(rows)],
    );
    return { status: 201 };
  }

  /**
   * The `col=eq.value` filters as a WHERE clause, numbered from `$offset+1`.
   * Qualified by table, because an update joins the table to its new values
   * and both have every column.
   */
  private filters(
    table: string,
    query: URLSearchParams,
    offset: number,
  ): { sql: string; values: unknown[] } {
    const clauses: string[] = [];
    const values: unknown[] = [];
    for (const [key, raw] of query) {
      if (RESERVED.has(key)) continue;
      const column = this.column(table, key);
      if (!raw.startsWith('eq.')) {
        throw new FakeLimit(`The fake PostgREST only understands eq filters, not ${key}=${raw}`);
      }
      values.push(raw.slice(3));
      clauses.push(`public.${table}.${column} = $${String(offset + values.length)}`);
    }
    return { sql: clauses.length === 0 ? 'true' : clauses.join(' and '), values };
  }

  private columnsOf(table: string, row: Record<string, unknown>): string[] {
    return Object.keys(row).map((key) => this.column(table, key));
  }

  private column(table: string, name: string): string {
    if (!IDENTIFIER.test(name) || this.schema.get(table)?.has(name) !== true) {
      throw new FakeLimit(`Could not find the '${name}' column of '${table}'`, 'PGRST204', 400);
    }
    return name;
  }
}

/** Something the fake does not do, said as PostgREST would say it. */
class FakeLimit extends Error {
  constructor(
    message: string,
    readonly code = 'PGRST100',
    readonly status = 400,
  ) {
    super(message);
  }
}

function header(request: RestRequest, name: string): string {
  const value = request.headers[name];
  return Array.isArray(value) ? value.join(',') : (value ?? '');
}

function notFound(message: string): RestReply {
  return { status: 404, body: { code: 'PGRST205', message, details: null, hint: null } };
}

/**
 * A Postgres error as PostgREST reports it: the SQLSTATE as `code`, and the
 * HTTP status PostgREST maps it to. The upload path classifies by both.
 */
function postgresError(cause: unknown, authenticated: boolean): RestReply {
  if (cause instanceof FakeLimit) {
    return {
      status: cause.status,
      body: { code: cause.code, message: cause.message, details: null, hint: null },
    };
  }
  const error = cause as { code?: string; message?: string; detail?: string; hint?: string };
  const code = error.code ?? 'XX000';
  const status =
    code === '42501'
      ? authenticated
        ? 403
        : 401
      : code === '23505' || code === '23503'
        ? 409
        : code === '42883' || code === '42P01'
          ? 404
          : code.startsWith('08') || code.startsWith('53') || code.startsWith('57')
            ? 503
            : 400;
  return {
    status,
    body: {
      code,
      message: error.message ?? String(cause),
      details: error.detail ?? null,
      hint: error.hint ?? null,
    },
  };
}
