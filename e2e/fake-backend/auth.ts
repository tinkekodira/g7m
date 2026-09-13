/**
 * Supabase Auth (GoTrue), for the calls the app makes: sign up, sign in with
 * a password, refresh, sign out, and who am I.
 *
 * Users are rows in `auth.users` in the fake database, so signing up fires the
 * real profile trigger and deleting an account removes the row sign-in reads.
 * Email confirmation is off, as it is in the project (a sign-up returns a
 * session). Passwords live in memory: they are the one thing Postgres here
 * has no column for.
 */
import { randomUUID } from 'node:crypto';
import type { Database } from './database.js';
import { issueToken, TOKEN_LIFETIME_SECONDS, verifyToken } from './tokens.js';

export interface AuthUser {
  readonly id: string;
  readonly email: string;
  readonly createdAt: string;
  readonly metadata: Record<string, unknown>;
}

export interface Reply {
  readonly status: number;
  readonly body?: unknown;
}

export class AuthService {
  private readonly passwords = new Map<string, string>();
  /** refresh token → user id */
  private readonly refreshTokens = new Map<string, string>();

  constructor(private readonly db: Database) {}

  /** Create a user directly: the same row a sign-up makes, without the browser. */
  async createUser(
    email: string,
    password: string,
    metadata: Record<string, unknown> = {},
  ): Promise<AuthUser> {
    const result = await this.db.asService((pg) =>
      pg.query<{ id: string; created_at: Date }>(
        `insert into auth.users (email, raw_user_meta_data) values ($1, $2::jsonb)
         returning id, created_at`,
        [email.toLowerCase(), JSON.stringify(metadata)],
      ),
    );
    const row = result.rows[0];
    if (row === undefined) throw new Error(`Could not create ${email}`);
    this.passwords.set(row.id, password);
    return {
      id: row.id,
      email: email.toLowerCase(),
      createdAt: row.created_at.toISOString(),
      metadata,
    };
  }

  async signUp(body: Record<string, unknown>): Promise<Reply> {
    const email = text(body['email']).toLowerCase();
    const password = text(body['password']);
    if (password.length < 6) {
      return error(422, 'weak_password', 'Password should be at least 6 characters.');
    }
    if ((await this.findUser(email)) !== null) {
      return error(422, 'user_already_exists', 'User already registered');
    }
    const data = body['data'];
    const user = await this.createUser(
      email,
      password,
      typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {},
    );
    return { status: 200, body: this.session(user) };
  }

  async token(grantType: string | null, body: Record<string, unknown>): Promise<Reply> {
    if (grantType === 'password') {
      const user = await this.findUser(text(body['email']));
      if (user === null || this.passwords.get(user.id) !== text(body['password'])) {
        return error(400, 'invalid_credentials', 'Invalid login credentials');
      }
      return { status: 200, body: this.session(user) };
    }

    if (grantType === 'refresh_token') {
      const userId = this.refreshTokens.get(text(body['refresh_token']));
      const user = userId === undefined ? null : await this.findUserById(userId);
      if (user === null) return error(400, 'refresh_token_not_found', 'Invalid Refresh Token');
      return { status: 200, body: this.session(user) };
    }

    return error(400, 'unsupported_grant_type', `Unsupported grant type ${String(grantType)}`);
  }

  async user(token: string | null): Promise<Reply> {
    const claims = token === null ? null : verifyToken(token);
    const user = claims === null ? null : await this.findUserById(claims.sub);
    if (user === null) return error(401, 'bad_jwt', 'invalid JWT');
    return { status: 200, body: userJson(user) };
  }

  private session(user: AuthUser) {
    const refreshToken = randomUUID();
    this.refreshTokens.set(refreshToken, user.id);
    return {
      access_token: issueToken(user.id, user.email, randomUUID()),
      token_type: 'bearer',
      expires_in: TOKEN_LIFETIME_SECONDS,
      expires_at: Math.floor(Date.now() / 1000) + TOKEN_LIFETIME_SECONDS,
      refresh_token: refreshToken,
      user: userJson(user),
    };
  }

  private async findUser(email: string): Promise<AuthUser | null> {
    return this.lookup(`email = $1`, email.toLowerCase());
  }

  private async findUserById(id: string): Promise<AuthUser | null> {
    return this.lookup(`id = $1`, id);
  }

  private async lookup(where: string, value: string): Promise<AuthUser | null> {
    const result = await this.db.asService((pg) =>
      pg.query<{ id: string; email: string; created_at: Date; raw_user_meta_data: unknown }>(
        `select id, email, created_at, raw_user_meta_data from auth.users where ${where}`,
        [value],
      ),
    );
    const row = result.rows[0];
    if (row === undefined) return null;
    return {
      id: row.id,
      email: row.email,
      createdAt: row.created_at.toISOString(),
      metadata: (row.raw_user_meta_data ?? {}) as Record<string, unknown>,
    };
  }
}

function userJson(user: AuthUser) {
  return {
    id: user.id,
    aud: 'authenticated',
    role: 'authenticated',
    email: user.email,
    email_confirmed_at: user.createdAt,
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: user.metadata,
    identities: [],
    created_at: user.createdAt,
    updated_at: user.createdAt,
  };
}

/** GoTrue's error shape: supabase-js reads `code` and `msg`. */
function error(status: number, code: string, message: string): Reply {
  return { status, body: { code, error_code: code, msg: message, message } };
}

/** A field of a request body as a string; anything that is not one reads as empty. */
export function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}
