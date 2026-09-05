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
      'That email and password do not match. Check both and try again.',
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
