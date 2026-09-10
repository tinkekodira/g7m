import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase.js';
import { appBaseUrl } from '../lib/app-url.js';
import { handOverDevice } from '../lib/powersync/database.js';
import {
  INITIAL_AUTH_STATE,
  friendlyAuthError,
  nextAuthState,
  type AuthStatus,
} from './auth-state.js';

/**
 * Session state, and the things a user can do about it.
 *
 * Zustand holds UI state only (Brief §3). The session is the one piece of
 * server state that genuinely belongs here rather than in the database layer,
 * because every route guard and every query needs it synchronously.
 */

interface AuthStore {
  readonly status: AuthStatus;
  readonly session: Session | null;
  /** Non-null only after a failed attempt. Cleared when the user tries again. */
  readonly error: string | null;
  /**
   * Something that went right and needs saying.
   *
   * Sign-up with email confirmation on, and a reset email being sent, both
   * succeed while leaving the screen looking exactly as it did — which reads
   * as nothing having happened, and gets the button pressed again.
   */
  readonly notice: string | null;
  /** True while a request is in flight. */
  readonly busy: boolean;

  initialize: () => () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, country?: string | null) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Send a reset email. Says nothing about whether the address has an account. */
  requestPasswordReset: (email: string) => Promise<void>;
  /** Set a new password for the session a recovery link opened. */
  setPassword: (password: string) => Promise<void>;
  /** Leave recovery without changing anything. */
  dismissRecovery: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  ...INITIAL_AUTH_STATE,
  error: null,
  notice: null,
  busy: false,

  /**
   * Subscribe to Supabase's auth state. Returns an unsubscribe function, so the
   * caller owns the lifetime — under React StrictMode the effect runs twice in
   * development, and a leaked listener means every event handled twice.
   *
   * `onAuthStateChange` fires INITIAL_SESSION immediately with the restored
   * session, so there is no separate getSession() call to race against it.
   */
  initialize: () => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      set((state) =>
        nextAuthState({ status: state.status, session: state.session }, event, session),
      );
    });
    return () => {
      data.subscription.unsubscribe();
    };
  },

  signIn: async (email, password) => {
    set({ busy: true, error: null, notice: null });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    // On success the listener sets the session; setting it here too would race.
    set({ busy: false, error: error === null ? null : friendlyAuthError(error.message) });
  },

  signUp: async (email, password, country) => {
    set({ busy: true, error: null, notice: null });
    // The country travels as metadata rather than being written afterwards:
    // the profile row is created by a trigger on the server, and a client
    // UPDATE issued before it syncs down updates nothing and reports success.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      ...(country === null || country === undefined || country === ''
        ? {}
        : { options: { data: { country } } }),
    });
    if (error !== null) {
      set({ busy: false, error: friendlyAuthError(error.message) });
      return;
    }
    /**
     * With email confirmation switched on, a successful sign-up returns a user
     * and no session — nothing changes on screen, and the natural reading is
     * that the button did not work. Say so instead.
     */
    const needsConfirmation = data.session === null && data.user !== null;
    set({
      busy: false,
      error: null,
      notice: needsConfirmation
        ? 'Account created. Check your email for a confirmation link, then sign in.'
        : null,
    });
  },

  signInWithGoogle: async () => {
    set({ busy: true, error: null });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        /**
         * Where Google sends the browser back to. NOT `location.origin` —
         * that drops the `/g7m/` subpath the app is served from on Pages.
         *
         * This must also appear in the Supabase redirect allow-list
         * (supabase/config.toml, `additional_redirect_urls`). Supabase does not
         * error on an unlisted value; it silently substitutes `site_url`, which
         * once sent an iPhone to a dev server it could never reach.
         */
        redirectTo: appBaseUrl(),
        queryParams: {
          // Ask for a refresh token every time rather than only on first
          // consent, so re-authenticating after a revoke actually works.
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    // A successful call navigates away, so `busy` is only cleared on failure.
    if (error !== null) set({ busy: false, error: friendlyAuthError(error.message) });
  },

  /**
   * End the session, and hand the device over first.
   *
   * The order matters. PowerSync keeps one local database and one write queue
   * for whoever is signed in, so anything still queued here would be uploaded
   * with the *next* account's token — refused by row level security, correctly,
   * and then thrown away as permanently unsendable. Draining before the session
   * ends is what stops a set logged on one account being destroyed by somebody
   * signing in on another.
   *
   * A queue that will not drain leaves the device untouched and says so. Unsent
   * work still on a device can be recovered by signing back in with a
   * connection; unsent work that has been deleted cannot.
   */
  signOut: async () => {
    set({ busy: true, error: null, notice: null });

    // Never allowed to block the sign-out itself: somebody handing a phone over
    // needs the session gone whatever the database is doing. Failing here
    // leaves the device as it is, which is the safe direction.
    const handover = await handOverDevice().catch((cause: unknown) => {
      console.error('Could not hand the device over cleanly.', cause);
      return { state: 'kept', pending: 0 } as const;
    });

    const { error } = await supabase.auth.signOut();

    const unsent =
      handover.state === 'kept' && handover.pending > 0
        ? `${String(handover.pending)} changes had not reached the server, so nothing on this device was cleared. Sign back in with a connection to save them.`
        : null;

    set({
      busy: false,
      error: error === null ? null : friendlyAuthError(error.message),
      notice: unsent,
    });
  },

  /**
   * Ask for a reset email.
   *
   * `redirectTo` is the app's own URL for the same reason the OAuth redirect
   * is (see above): `location.origin` drops the `/g7m/` subpath, and Supabase
   * silently substitutes `site_url` for anything not on the allow-list rather
   * than erroring.
   */
  requestPasswordReset: async (email) => {
    set({ busy: true, error: null, notice: null });
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: appBaseUrl(),
    });
    if (error !== null) {
      set({ busy: false, error: friendlyAuthError(error.message) });
      return;
    }
    /**
     * The same message whether or not that address has an account.
     *
     * Supabase does not say, on purpose — otherwise this form is a way for a
     * stranger to find out who has one. The wording has to hold that line
     * without sounding evasive.
     */
    set({
      busy: false,
      notice: 'If that email has an account, a reset link is on its way. It expires in an hour.',
    });
  },

  setPassword: async (password) => {
    set({ busy: true, error: null, notice: null });
    const { error } = await supabase.auth.updateUser({ password });
    if (error !== null) {
      set({ busy: false, error: friendlyAuthError(error.message) });
      return;
    }
    // USER_UPDATED follows and ends the recovery; the listener handles it.
    set({ busy: false, error: null, notice: null });
  },

  dismissRecovery: () => {
    const { session } = get();
    if (session === null) return;
    set({ status: 'signed-in', error: null, notice: null });
  },

  clearError: () => {
    if (get().error !== null || get().notice !== null) set({ error: null, notice: null });
  },
}));
