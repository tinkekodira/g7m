import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase.js';
import { appBaseUrl } from '../lib/app-url.js';
import {
  INITIAL_AUTH_STATE,
  friendlyAuthError,
  nextAuthState,
  type AuthStatus,
} from './auth-state.js';

/**
 * Session state, and the four things a user can do about it.
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
  /** True while a sign-in, sign-up or sign-out request is in flight. */
  readonly busy: boolean;

  initialize: () => () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  ...INITIAL_AUTH_STATE,
  error: null,
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
    set({ busy: true, error: null });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    // On success the listener sets the session; setting it here too would race.
    set({ busy: false, error: error === null ? null : friendlyAuthError(error.message) });
  },

  signUp: async (email, password) => {
    set({ busy: true, error: null });
    const { error } = await supabase.auth.signUp({ email, password });
    set({ busy: false, error: error === null ? null : friendlyAuthError(error.message) });
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

  signOut: async () => {
    set({ busy: true, error: null });
    const { error } = await supabase.auth.signOut();
    set({ busy: false, error: error === null ? null : friendlyAuthError(error.message) });
  },

  clearError: () => {
    if (get().error !== null) set({ error: null });
  },
}));
