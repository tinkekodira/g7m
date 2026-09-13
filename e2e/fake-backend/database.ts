/**
 * The real schema, in-process: every migration in `supabase/migrations`,
 * applied to PGlite exactly as the schema tests apply them (ADR-0022).
 *
 * PGlite is one connection, and "who is asking" is session state on it — the
 * role and the JWT claims RLS reads. So every use goes through one queue: a
 * request runs start to finish as its user before the next begins, and no
 * request can ever run as somebody else's identity.
 */
import type { PGlite } from '@electric-sql/pglite';
import { startHarness, type Harness } from '@g7m/db/testing/pglite';

export class Database {
  private queue: Promise<unknown> = Promise.resolve();

  private constructor(private readonly harness: Harness) {}

  static async start(): Promise<Database> {
    const harness = await startHarness();
    // Timestamps come out of Postgres as text in the session's zone. UTC is
    // what the real service reads through replication, so the fake says so.
    await harness.db.exec(`set time zone 'UTC'`);
    return new Database(harness);
  }

  /** Exclusive use of the connection, as the superuser — the replication view. */
  asService<T>(run: (db: PGlite) => Promise<T>): Promise<T> {
    return this.exclusive(() => run(this.harness.db));
  }

  /** As a signed-in user, with row level security enforced. */
  asUser<T>(userId: string, run: (db: PGlite) => Promise<T>): Promise<T> {
    return this.exclusive(() => this.harness.actAs(userId, () => run(this.harness.db)));
  }

  /** As the anonymous role: the publishable key and no session. */
  asAnon<T>(run: (db: PGlite) => Promise<T>): Promise<T> {
    return this.exclusive(async () => {
      await this.harness.db.exec(`set role anon`);
      try {
        return await run(this.harness.db);
      } finally {
        await this.harness.db.exec(`reset role`);
      }
    });
  }

  close(): Promise<void> {
    return this.harness.close();
  }

  private exclusive<T>(run: () => Promise<T>): Promise<T> {
    const next = this.queue.then(run);
    // A failure belongs to its caller, not to everybody queued behind it.
    this.queue = next.catch(() => undefined);
    return next;
  }
}
