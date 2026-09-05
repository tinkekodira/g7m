import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

/**
 * The one Supabase client.
 *
 * The type is inferred rather than annotated: `createClient` carries five
 * generic parameters, and writing `SupabaseClient` by hand silently widens
 * them, which costs the typed schema Phase 2 will generate.
 *
 * Deliberately a module singleton: creating a second client gives you a second
 * auth state machine, two competing token refreshes, and a session that appears
 * to log itself out at random. If something needs the client, it imports this.
 */
export const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    /**
     * PKCE rather than the implicit flow. The OAuth redirect comes back to a
     * public client with no secret to prove itself with, so the code verifier
     * is what stops an intercepted redirect being exchanged by someone else.
     * It is also the only flow that behaves properly inside a WebView, which
     * matters from Phase 2 onward.
     */
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    /** Reads the `?code=` back off the URL after the Google round trip. */
    detectSessionInUrl: true,
  },
});
