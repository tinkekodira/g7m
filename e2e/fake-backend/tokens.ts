/**
 * Access tokens, as Supabase issues them: HS256 JWTs.
 *
 * Signed for real rather than left unsigned, so the fake PowerSync endpoints
 * can verify who is calling the way the real service does, and a test that
 * forges a token fails the way production would.
 *
 * The key is a constant in a public repository and signs nothing but tokens
 * for a server that exists for the length of a test run.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

// Low-entropy on purpose, so the secret scanner does not mistake it for a real one.
const SIGNING_KEY = 'not-a-secret-not-a-secret-not-a-secret';

/** How long an access token lives. Supabase's default. */
export const TOKEN_LIFETIME_SECONDS = 3600;

export interface TokenClaims {
  readonly sub: string;
  readonly email: string;
  readonly role: 'authenticated';
  readonly aud: 'authenticated';
  readonly iat: number;
  readonly exp: number;
  readonly session_id: string;
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url');
}

function sign(payload: string): string {
  return createHmac('sha256', SIGNING_KEY).update(payload).digest('base64url');
}

export function issueToken(userId: string, email: string, sessionId: string): string {
  const now = Math.floor(Date.now() / 1000);
  const claims: TokenClaims = {
    sub: userId,
    email,
    role: 'authenticated',
    aud: 'authenticated',
    iat: now,
    exp: now + TOKEN_LIFETIME_SECONDS,
    session_id: sessionId,
  };
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(claims));
  return `${header}.${body}.${sign(`${header}.${body}`)}`;
}

/** The claims of a genuine, unexpired token, or null. */
export function verifyToken(token: string): TokenClaims | null {
  const [header, body, signature] = token.split('.');
  if (header === undefined || body === undefined || signature === undefined) return null;

  const expected = Buffer.from(sign(`${header}.${body}`));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  const claims = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as TokenClaims;
  if (claims.exp <= Math.floor(Date.now() / 1000)) return null;
  return claims;
}

/** The token from `Authorization: Bearer …` or PowerSync's `Authorization: Token …`. */
export function bearer(header: string | undefined): string | null {
  if (header === undefined) return null;
  const match = /^(?:Bearer|Token)\s+(.+)$/i.exec(header);
  return match?.[1] ?? null;
}
