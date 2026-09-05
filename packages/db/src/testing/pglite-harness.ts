import { readFileSync, readdirSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';

/**
 * Runs the real Supabase migrations against a real Postgres, in-process.
 *
 * PGlite is Postgres compiled to WebAssembly, so this needs no Docker, no
 * `supabase start`, and no network — which is what lets the schema be verified
 * on every pull request in a couple of seconds. See DECISIONS.md ADR-0022.
 *
 * What it is not: Supabase. There is no GoTrue, no PostgREST, no Realtime. The
 * pieces the schema actually depends on are stubbed below, faithfully enough
 * that RLS policies can be exercised as a real signed-in user.
 */

const MIGRATIONS_DIR = new URL('../../../../supabase/migrations/', import.meta.url);

/**
 * The parts of a Supabase project the migrations reference.
 *
 * `auth.uid()` is reproduced the way Supabase implements it — reading the `sub`
 * claim out of the `request.jwt.claims` GUC — so `actAs()` below can switch
 * users exactly as a real request does.
 */
const SUPABASE_STUBS = `
  create role anon nologin noinherit;
  create role authenticated nologin noinherit;
  create role service_role nologin noinherit bypassrls;

  create schema if not exists auth;

  create table auth.users (
    id                   uuid primary key default gen_random_uuid(),
    email                text unique,
    raw_user_meta_data   jsonb not null default '{}'::jsonb,
    created_at           timestamptz not null default now()
  );

  create or replace function auth.uid()
  returns uuid
  language sql
  stable
  as $stub$
    select nullif(
      current_setting('request.jwt.claims', true)::jsonb ->> 'sub',
      ''
    )::uuid;
  $stub$;

  create or replace function auth.role()
  returns text
  language sql
  stable
  as $stub$
    select coalesce(
      current_setting('request.jwt.claims', true)::jsonb ->> 'role',
      'anon'
    );
  $stub$;

  grant usage on schema auth to anon, authenticated, service_role;
  grant usage on schema public to anon, authenticated, service_role;
`;

/** Migration filenames in the order Supabase would apply them. */
export function migrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith('.sql'))
    .sort();
}

export interface Harness {
  readonly db: PGlite;
  /**
   * Run `fn` as a signed-in user, with RLS enforced exactly as it would be for
   * a real request. Restores the previous role afterwards even if `fn` throws.
   */
  actAs<T>(userId: string, fn: () => Promise<T>): Promise<T>;
  /** Create an auth.users row, which also fires the profile-creation trigger. */
  createUser(email: string, meta?: Record<string, unknown>): Promise<string>;
  close(): Promise<void>;
}

export async function startHarness(): Promise<Harness> {
  const db = await PGlite.create({ extensions: { pg_trgm } });

  await db.exec(SUPABASE_STUBS);

  for (const file of migrationFiles()) {
    const sql = readFileSync(new URL(file, MIGRATIONS_DIR), 'utf8');
    try {
      await db.exec(sql);
    } catch (cause: unknown) {
      const message = cause instanceof Error ? cause.message : String(cause);
      throw new Error(`Migration ${file} failed: ${message}`, { cause });
    }
  }

  // Grants Supabase applies to every table by default. RLS still gates rows;
  // without the grant, policies never even get consulted.
  await db.exec(`
    grant select, insert, update, delete on all tables in schema public to authenticated;
    grant select on all tables in schema public to anon;
  `);

  return {
    db,

    async actAs<T>(userId: string, fn: () => Promise<T>): Promise<T> {
      // Session scope, not `SET LOCAL` / `is_local = true`. PGlite runs each
      // exec in its own implicit transaction, so a LOCAL setting is reverted
      // before the next statement and every query would quietly run as the
      // superuser — which bypasses RLS and makes these tests assert nothing.
      await db.exec(`
        set role authenticated;
        select set_config(
          'request.jwt.claims',
          '{"sub":"${userId}","role":"authenticated"}',
          false
        );
      `);
      try {
        return await fn();
      } finally {
        await db.exec(`reset role; select set_config('request.jwt.claims', '', false);`);
      }
    },

    async createUser(email: string, meta: Record<string, unknown> = {}): Promise<string> {
      const result = await db.query<{ id: string }>(
        `insert into auth.users (email, raw_user_meta_data) values ($1, $2::jsonb) returning id`,
        [email, JSON.stringify(meta)],
      );
      const id = result.rows[0]?.id;
      if (id === undefined) throw new Error(`Failed to create user ${email}`);
      return id;
    },

    async close(): Promise<void> {
      await db.close();
    },
  };
}
