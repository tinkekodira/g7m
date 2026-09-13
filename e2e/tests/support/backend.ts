/**
 * Talking to the fake backend from a test: making users, and looking in the
 * database to check what really arrived there.
 *
 * The second is the point of testing against a backend at all. A workout that
 * shows up on screen proves the local database has it; a row in Postgres,
 * owned by the right user, proves the upload, row level security and sync all
 * did their part.
 */
import { BACKEND_URL } from './urls.js';

export interface TestUser {
  readonly id: string;
  readonly email: string;
  readonly password: string;
}

let sequence = 0;

/** An address no two tests share, so every test starts with an account of its own. */
export function uniqueEmail(tag: string): string {
  sequence += 1;
  return `${tag}-${Date.now().toString(36)}-${String(sequence)}@example.test`;
}

export const PASSWORD = 'correct horse battery';

/** A user made on the server directly, optionally already past the welcome questions. */
export async function createUser(
  tag: string,
  options: { readonly onboarded?: boolean; readonly displayName?: string } = {},
): Promise<TestUser> {
  const email = uniqueEmail(tag);
  const response = await fetch(`${BACKEND_URL}/__e2e/users`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD, ...options }),
  });
  if (!response.ok) throw new Error(`Could not create ${email}: ${await response.text()}`);
  const { id } = (await response.json()) as { id: string };
  return { id, email, password: PASSWORD };
}

/** Run SQL on the server, as the superuser. For looking, not for arranging behind the app's back. */
export async function sql<T = Record<string, unknown>>(
  query: string,
  params: readonly unknown[] = [],
): Promise<T[]> {
  const response = await fetch(`${BACKEND_URL}/__e2e/sql`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ sql: query, params }),
  });
  if (!response.ok) throw new Error(`SQL failed: ${await response.text()}`);
  return (await response.json()) as T[];
}

/**
 * Poll the server until `check` passes. Uploads happen on the app's schedule,
 * not the test's, so "has it arrived" is a question asked until it is true.
 */
export async function eventually<T>(
  read: () => Promise<T>,
  check: (value: T) => boolean,
  timeoutMs = 15_000,
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  let last = await read();
  while (!check(last)) {
    if (Date.now() > deadline) {
      throw new Error(`Timed out waiting on the server; last saw ${JSON.stringify(last)}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
    last = await read();
  }
  return last;
}

/**
 * Take the backend away, or give it back. While it is away every request the
 * app makes fails the way it does with no signal: the connection drops.
 */
export async function outage(on: boolean): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/__e2e/outage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ on }),
  });
  if (!response.ok) throw new Error(`Could not ${on ? 'start' : 'end'} the outage`);
}
