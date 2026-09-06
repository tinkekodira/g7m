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
  | 'signed-out'
  /**
   * Arrived through a password-reset link.
   *
   * A live session, but one that exists for exactly one purpose. Dropping this
   * person into the app would leave the password they could not remember still
   * on the account — and they would have no way back to this screen, because
   * the only route to it is another email.
   */
  | 'recovering';

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
 *
 * `PASSWORD_RECOVERY` is a session with a job to do, and recovery is sticky
 * once entered: Supabase may follow it with `SIGNED_IN` or a `TOKEN_REFRESHED`
 * on a timer, and either would otherwise sweep the user into the app with the
 * password they came here to change still on the account.
 */
export function nextAuthState(
  current: AuthState,
  event: AuthChangeEvent,
  session: Session | null,
): AuthState {
  // Only setting a password, or leaving, ends a recovery. Everything else that
  // arrives meanwhile refreshes the session and stays put.
  if (current.status === 'recovering' && event !== 'SIGNED_OUT' && event !== 'USER_UPDATED') {
    return session === null ? current : { status: 'recovering', session };
  }

  switch (event) {
    case 'SIGNED_OUT':
      return { status: 'signed-out', session: null };

    case 'TOKEN_REFRESHED':
      if (session === null) return current;
      return { status: 'signed-in', session };

    case 'PASSWORD_RECOVERY':
      return session === null
        ? { status: 'signed-out', session: null }
        : { status: 'recovering', session };

    case 'INITIAL_SESSION':
    case 'SIGNED_IN':
    case 'USER_UPDATED':
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
    // Supabase deliberately gives the same answer for a wrong password and an
    // email with no account, so that a stranger cannot use this form to find
    // out who has one. That is right and stays. But it means the app cannot
    // tell the user which mistake they made — so it names both, rather than
    // implying the password is the only possibility.
    return 'That email and password do not match. Check both — or create an account if you have not made one yet.';
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
  if (normalised.includes('new password should be different')) {
    return 'That is the password you already have. Choose a different one.';
  }
  if (
    normalised.includes('code verifier') ||
    normalised.includes('invalid flow state') ||
    normalised.includes('auth session missing')
  ) {
    /**
     * The PKCE trap, and the reason a reset link can look broken.
     *
     * The verifier is stored in the browser that asked for the reset, so
     * opening the emailed link anywhere else — a mail app's built-in browser,
     * a different phone — cannot complete the exchange. The user sees the
     * sign-in screen again and reasonably concludes the link did nothing.
     */
    return 'Open that link in the same browser you asked for the reset from, then try again.';
  }
  return message;
}
