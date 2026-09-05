import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

/**
 * The pure part of authentication: how a Supabase auth event plus a session
 * becomes the state the UI renders.
 *
 * Kept separate from the store because this is the bit with real decisions in
 * it, and a decision you can test without a browser is worth having on its own.
 */

export type AuthStatus =
  /** Before the first `getSession()` resolves. Render nothing yet. */
  | 'loading'
  /** A live session. The app is usable. */
  | 'signed-in'
  /** No session. Show the sign-in screen. */
  | 'signed-out';

export interface AuthState {
  readonly status: AuthStatus;
  readonly session: Session | null;
}

export const INITIAL_AUTH_STATE: AuthState = { status: 'loading', session: null };

/**
 * Map an `onAuthStateChange` event onto the next state.
 *
 * Two events need care and are the reason this is a function rather than
 * `setState(session ? 'signed-in' : 'signed-out')` inlined at the call site:
 *
 * `TOKEN_REFRESHED` fires on a timer for an already signed-in user. Supabase
 * has been known to deliver it with a null session on a transient network
 * failure; treating that as a sign-out would eject someone mid-workout because
 * their gym wifi dropped for a second. The refresh will retry. We hold.
 *
 * `INITIAL_SESSION` is the one event that legitimately carries null and means
 * signed out — it is the answer to "is anyone logged in", not a state change.
 */
export function nextAuthState(
  current: AuthState,
  event: AuthChangeEvent,
  session: Session | null,
): AuthState {
  switch (event) {
    case 'SIGNED_OUT':
      return { status: 'signed-out', session: null };

    case 'TOKEN_REFRESHED':
      if (session === null) return current;
      return { status: 'signed-in', session };

    case 'INITIAL_SESSION':
    case 'SIGNED_IN':
    case 'USER_UPDATED':
    case 'PASSWORD_RECOVERY':
    case 'MFA_CHALLENGE_VERIFIED':
      return session === null
        ? { status: 'signed-out', session: null }
        : { status: 'signed-in', session };

    default:
      return current;
  }
}

/**
 * Turn a Supabase auth error into something a person can act on.
 *
 * Supabase returns accurate but unhelpful strings. "Invalid login credentials"
 * is correct and tells the user nothing about what to do; it also deliberately
 * does not say whether the email exists, which is right and should stay that
 * way.
 */
export function friendlyAuthError(message: string): string {
  const normalised = message.toLowerCase();

  if (normalised.includes('invalid login credentials')) {
    return 'That email and password do not match. Check both and try again.';
  }
  if (normalised.includes('user already registered')) {
    return 'That email already has an account. Sign in instead.';
  }
  if (normalised.includes('password should be at least')) {
    return 'Passwords need at least 8 characters.';
  }
  if (normalised.includes('email rate limit') || normalised.includes('over_email_send_rate')) {
    return 'Too many attempts. Wait a minute and try again.';
  }
  if (normalised.includes('failed to fetch') || normalised.includes('network')) {
    return 'Cannot reach the server. Check your connection.';
  }
  return message;
}
