import { describe, expect, it } from 'vitest';
import type { Session } from '@supabase/supabase-js';
import {
  INITIAL_AUTH_STATE,
  friendlyAuthError,
  nextAuthState,
  type AuthState,
} from './auth-state.js';

const session = { access_token: 'a', user: { id: 'u1' } } as unknown as Session;

const SIGNED_IN: AuthState = { status: 'signed-in', session };
const SIGNED_OUT: AuthState = { status: 'signed-out', session: null };

describe('nextAuthState', () => {
  it('starts in loading, so the app renders neither screen prematurely', () => {
    expect(INITIAL_AUTH_STATE).toEqual({ status: 'loading', session: null });
  });

  it('signs in on SIGNED_IN with a session', () => {
    expect(nextAuthState(INITIAL_AUTH_STATE, 'SIGNED_IN', session)).toEqual(SIGNED_IN);
  });

  it('resolves the initial check to signed-out when there is no session', () => {
    expect(nextAuthState(INITIAL_AUTH_STATE, 'INITIAL_SESSION', null)).toEqual(SIGNED_OUT);
  });

  it('resolves the initial check to signed-in when a session was restored', () => {
    expect(nextAuthState(INITIAL_AUTH_STATE, 'INITIAL_SESSION', session)).toEqual(SIGNED_IN);
  });

  it('signs out on SIGNED_OUT and drops the session', () => {
    expect(nextAuthState(SIGNED_IN, 'SIGNED_OUT', session)).toEqual(SIGNED_OUT);
  });

  /**
   * The case this function exists for. A token refresh that comes back empty is
   * a transient network failure, not a sign-out — treating it as one would
   * eject someone mid-workout because the gym wifi dropped for a second.
   */
  it('holds the session when a token refresh returns nothing', () => {
    expect(nextAuthState(SIGNED_IN, 'TOKEN_REFRESHED', null)).toEqual(SIGNED_IN);
  });

  it('adopts the new session when a token refresh succeeds', () => {
    const refreshed = { ...session, access_token: 'b' } as Session;
    expect(nextAuthState(SIGNED_IN, 'TOKEN_REFRESHED', refreshed)).toEqual({
      status: 'signed-in',
      session: refreshed,
    });
  });

  it('does not resurrect a signed-out session from a stray refresh', () => {
    expect(nextAuthState(SIGNED_OUT, 'TOKEN_REFRESHED', null)).toEqual(SIGNED_OUT);
  });

  it('keeps the user signed in when their profile is updated', () => {
    expect(nextAuthState(SIGNED_IN, 'USER_UPDATED', session)).toEqual(SIGNED_IN);
  });

  it('ignores events it does not model rather than guessing', () => {
    const unknown = 'SOMETHING_NEW' as Parameters<typeof nextAuthState>[1];
    expect(nextAuthState(SIGNED_IN, unknown, null)).toEqual(SIGNED_IN);
  });
});

describe('friendlyAuthError', () => {
  it('turns the credentials error into something actionable', () => {
    expect(friendlyAuthError('Invalid login credentials')).toBe(
      'That email and password do not match. Check both — or create an account if you have not made one yet.',
    );
  });

  it('does not leak whether an email is registered', () => {
    // Supabase deliberately returns the same message for a wrong password and a
    // nonexistent account. Our rewrite must not undo that.
    const rewritten = friendlyAuthError('Invalid login credentials');
    expect(rewritten.toLowerCase()).not.toContain('no account');
    expect(rewritten.toLowerCase()).not.toContain('not found');
  });

  it('points an existing user at the sign-in form', () => {
    expect(friendlyAuthError('User already registered')).toContain('Sign in instead');
  });

  it('states the real password minimum, which is 8 not Supabase’s default 6', () => {
    expect(friendlyAuthError('Password should be at least 8 characters')).toContain('8 characters');
  });

  it('explains a rate limit as a wait rather than a failure', () => {
    expect(friendlyAuthError('email rate limit exceeded')).toContain('Wait a minute');
  });

  it('names the offline case, which matters in a basement', () => {
    expect(friendlyAuthError('Failed to fetch')).toContain('connection');
  });

  it('passes through anything it does not recognise, rather than swallowing it', () => {
    expect(friendlyAuthError('Something we have never seen')).toBe('Something we have never seen');
  });

  it('is case insensitive, because the wording varies by endpoint', () => {
    expect(friendlyAuthError('INVALID LOGIN CREDENTIALS')).toContain('do not match');
  });
});

describe('password recovery', () => {
  const recovering: AuthState = { status: 'recovering', session: session };

  /**
   * A recovery link produces a real session. Treating it as an ordinary
   * sign-in drops the user into the app with the password they could not
   * remember still on the account — and no way back, because the only route
   * to this state is another email.
   */
  it('is its own state, not a sign-in', () => {
    expect(nextAuthState(SIGNED_OUT, 'PASSWORD_RECOVERY', session)).toEqual({
      status: 'recovering',
      session: session,
    });
  });

  it('is a sign-out when the link produced no session', () => {
    // What an expired link, or one opened in the wrong browser, looks like.
    expect(nextAuthState(SIGNED_OUT, 'PASSWORD_RECOVERY', null)).toEqual({
      status: 'signed-out',
      session: null,
    });
  });

  /**
   * Supabase follows a recovery with SIGNED_IN in some flows, and fires
   * TOKEN_REFRESHED on a timer regardless. Either would otherwise sweep the
   * user into the app mid-reset.
   */
  it('is not ended by a SIGNED_IN or a token refresh', () => {
    expect(nextAuthState(recovering, 'SIGNED_IN', session).status).toBe('recovering');
    expect(nextAuthState(recovering, 'TOKEN_REFRESHED', session).status).toBe('recovering');
    expect(nextAuthState(recovering, 'INITIAL_SESSION', session).status).toBe('recovering');
  });

  it('keeps the newest session while it holds', () => {
    const refreshed = { ...session, access_token: 'newer' };
    expect(nextAuthState(recovering, 'TOKEN_REFRESHED', refreshed).session).toEqual(refreshed);
  });

  it('ends when the password is set', () => {
    // USER_UPDATED is what `updateUser({ password })` produces.
    expect(nextAuthState(recovering, 'USER_UPDATED', session)).toEqual({
      status: 'signed-in',
      session: session,
    });
  });

  it('ends on sign-out', () => {
    expect(nextAuthState(recovering, 'SIGNED_OUT', null)).toEqual({
      status: 'signed-out',
      session: null,
    });
  });

  it('does not fall out of recovery on a null session', () => {
    // A transient refresh failure mid-reset must not become a sign-out; the
    // same argument as TOKEN_REFRESHED for an ordinary session.
    expect(nextAuthState(recovering, 'TOKEN_REFRESHED', null)).toEqual(recovering);
  });
});

describe('friendlyAuthError, on getting back in', () => {
  it('names creating an account as a possibility, without confirming one exists', () => {
    const message = friendlyAuthError('Invalid login credentials');
    expect(message).toContain('create an account');
    // Supabase gives the same answer for a wrong password and an unknown
    // email on purpose, so this form cannot become a way to find out who has
    // an account. The wording must not undo that.
    expect(message).not.toMatch(/no account|not registered|does not exist/i);
  });

  /**
   * The trap that makes a reset link look broken: the PKCE verifier lives in
   * the browser that asked for the reset, so opening the email in a mail app's
   * built-in browser cannot complete the exchange.
   */
  it('explains a PKCE exchange that cannot complete', () => {
    for (const raw of [
      'invalid request: both auth code and code verifier should be non-empty',
      'Invalid flow state, no valid flow state found',
      'Auth session missing!',
    ]) {
      expect(friendlyAuthError(raw), raw).toContain('same browser');
    }
  });

  it('says when the new password is the old one', () => {
    expect(friendlyAuthError('New password should be different from the old password.')).toContain(
      'different',
    );
  });
});
