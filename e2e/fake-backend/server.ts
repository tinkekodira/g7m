/**
 * The fake backend: Supabase Auth, PostgREST and a PowerSync service on one
 * port, over one in-process Postgres running the real migrations.
 *
 * The app under test is the production build, pointed here by its ordinary
 * environment variables — `VITE_SUPABASE_URL` and `VITE_POWERSYNC_URL` both
 * name this server — so nothing in the app knows it is being tested. The
 * routes do not overlap: `/auth/v1/…` and `/rest/v1/…` are Supabase's, and
 * `/sync/…` and `/write-checkpoint2.json` are PowerSync's.
 *
 * `/__e2e/…` is for the tests themselves: make a user without clicking
 * through sign-up, and look in the database to check what arrived. Nothing in
 * the app calls it.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { AuthService, text, type Reply } from './auth.js';
import { Database } from './database.js';
import { RestService, type Schema } from './rest.js';
import { SyncService } from './sync.js';
import { readSyncRules } from './sync-rules.js';
import { bearer, verifyToken } from './tokens.js';

export interface FakeBackend {
  readonly url: string;
  close(): Promise<void>;
}

/** What `POST /__e2e/users` accepts: a user, optionally past the welcome questions. */
export interface SeedUser {
  readonly email: string;
  readonly password: string;
  readonly displayName?: string;
  /** Answer the welcome questions, so the app opens on Home. */
  readonly onboarded?: boolean;
  readonly bodyweightKg?: number;
}

export async function startFakeBackend(port = 54321): Promise<FakeBackend> {
  const db = await Database.start();
  const rules = readSyncRules();
  const schema = await readSchema(db);
  const sync = await SyncService.start(db, rules);
  const auth = new AuthService(db);
  const rest = new RestService(db, schema, (userId) => sync.changed(userId));
  /** While true, the app's requests fail as if there were no network. */
  let outage = false;

  const server = createServer((request, response) => {
    void route(request, response).catch((cause: unknown) => {
      console.error('[fake backend]', request.method, request.url, cause);
      if (!response.headersSent) send(response, { status: 500, body: { message: String(cause) } });
    });
  });

  async function route(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const url = new URL(request.url ?? '/', 'http://fake');
    const origin = request.headers.origin;
    response.setHeader('Access-Control-Allow-Origin', origin ?? '*');
    response.setHeader('Vary', 'Origin');
    response.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Type');

    if (request.method === 'OPTIONS') {
      response.writeHead(204, {
        'Access-Control-Allow-Methods': 'GET, HEAD, POST, PATCH, PUT, DELETE, OPTIONS',
        // Echoed rather than `*`: a wildcard does not cover Authorization.
        'Access-Control-Allow-Headers': request.headers['access-control-request-headers'] ?? '*',
        'Access-Control-Max-Age': '600',
      });
      response.end();
      return;
    }

    // An outage looks, from the app, like no network: the connection just
    // drops. Only the tests' own routes still answer, so a test can end it.
    if (outage && !url.pathname.startsWith('/__e2e/')) {
      request.socket.destroy();
      return;
    }

    const body = await readBody(request);
    const token = bearer(request.headers.authorization);
    const claims = token === null ? null : verifyToken(token);
    const path = url.pathname;

    // --- Supabase Auth -----------------------------------------------------
    if (path === '/auth/v1/signup' && request.method === 'POST') {
      return send(response, await auth.signUp(asObject(body)));
    }
    if (path === '/auth/v1/token' && request.method === 'POST') {
      return send(response, await auth.token(url.searchParams.get('grant_type'), asObject(body)));
    }
    if (path === '/auth/v1/user' && request.method === 'GET') {
      return send(response, await auth.user(token));
    }
    if (path === '/auth/v1/logout') return send(response, { status: 204 });

    // --- PostgREST ---------------------------------------------------------
    if (path.startsWith('/rest/v1/')) {
      const reply = await rest.handle({
        method: request.method ?? 'GET',
        path: path.slice('/rest/v1/'.length),
        query: url.searchParams,
        headers: request.headers,
        body,
        userId: claims?.sub ?? null,
      });
      return send(response, reply, reply.headers);
    }

    // --- PowerSync ---------------------------------------------------------
    if (
      path === '/sync/stream' ||
      path === '/sync/checkpoint-request' ||
      path === '/write-checkpoint2.json'
    ) {
      if (claims === null) return send(response, { status: 401, body: { error: 'Unauthorized' } });
      if (path === '/sync/stream') {
        await sync.openStream(claims.sub, asObject(body), request, response);
        return;
      }
      if (path === '/sync/checkpoint-request') {
        const payload = asObject(body);
        const accepted = sync.checkpointRequest(
          claims.sub,
          text(payload['client_id']),
          Number(payload['checkpoint_request_id'] ?? 1),
        );
        return send(response, {
          status: 200,
          body: { data: { checkpoint_request_id: String(accepted) } },
        });
      }
      const accepted = sync.legacyWriteCheckpoint(
        claims.sub,
        url.searchParams.get('client_id') ?? '',
      );
      return send(response, {
        status: 200,
        body: { data: { write_checkpoint: String(accepted) } },
      });
    }

    // --- For the tests -----------------------------------------------------
    if (path === '/__e2e/users' && request.method === 'POST') {
      const seed = asObject(body) as unknown as SeedUser;
      const user = await auth.createUser(seed.email, seed.password, {
        ...(seed.displayName === undefined ? {} : { full_name: seed.displayName }),
      });
      if (seed.onboarded === true) {
        await db.asService((pg) =>
          pg.query(
            `update public.profiles
                set onboarded_at = now(), experience_level = 'intermediate',
                    bodyweight_kg = $2, sex = 'male', birth_date = '1995-06-15'
              where user_id = $1`,
            [user.id, seed.bodyweightKg ?? 80],
          ),
        );
      }
      return send(response, { status: 201, body: { id: user.id } });
    }
    if (path === '/__e2e/outage' && request.method === 'POST') {
      outage = asObject(body)['on'] === true;
      // Open sync streams go down with everything else.
      if (outage) sync.close();
      return send(response, { status: 204 });
    }
    if (path === '/__e2e/sql' && request.method === 'POST') {
      const { sql, params } = asObject(body) as { sql: string; params?: unknown[] };
      const result = await db.asService((pg) => pg.query(sql, params ?? []));
      return send(response, { status: 200, body: result.rows });
    }

    send(response, {
      status: 404,
      body: { message: `The fake backend has no ${request.method} ${path}` },
    });
  }

  await new Promise<void>((resolve) => server.listen(port, '127.0.0.1', resolve));
  const address = server.address() as AddressInfo;

  return {
    url: `http://127.0.0.1:${String(address.port)}`,
    close: async () => {
      sync.close();
      await new Promise<void>((resolve) => {
        server.close(() => {
          resolve();
        });
        server.closeAllConnections();
      });
      await db.close();
    },
  };
}

async function readSchema(db: Database): Promise<Schema> {
  const result = await db.asService((pg) =>
    pg.query<{ table_name: string; column_name: string; data_type: string }>(
      `select table_name, column_name, data_type from information_schema.columns
        where table_schema = 'public'`,
    ),
  );
  const schema = new Map<string, Map<string, string>>();
  for (const row of result.rows) {
    const table = schema.get(row.table_name) ?? new Map<string, string>();
    table.set(row.column_name, row.data_type);
    schema.set(row.table_name, table);
  }
  return schema;
}

async function readBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(chunk as Buffer);
  const text = Buffer.concat(chunks).toString('utf8');
  if (text === '') return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function send(response: ServerResponse, reply: Reply, headers: Record<string, string> = {}): void {
  const hasBody = reply.body !== undefined && reply.status !== 204;
  response.writeHead(reply.status, {
    ...headers,
    ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
  });
  response.end(hasBody ? JSON.stringify(reply.body) : undefined);
}
