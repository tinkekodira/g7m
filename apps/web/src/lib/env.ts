import { z } from 'zod';

/**
 * Environment, validated at module load.
 *
 * Brief §3 asks for Zod at every boundary, and the environment is the first
 * boundary the app crosses. Validating here turns a missing key into one clear
 * message at startup instead of a `Failed to construct URL` from deep inside
 * the Supabase client twenty seconds later.
 *
 * Everything here is public by design — it is compiled into the bundle and
 * shipped to every device. Row Level Security is what protects the data.
 */

const schema = z.object({
  VITE_SUPABASE_URL: z.url({ error: 'must be the full https URL of your Supabase project' }),

  /**
   * Supabase is midway through renaming this. Either the `sb_publishable_…`
   * string or the legacy `anon` JWT works; both are safe to ship.
   */
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(20, { error: 'looks too short to be a real key' }),

  /** Phase 2. Empty until a PowerSync instance exists. */
  VITE_POWERSYNC_URL: z.union([z.url(), z.literal('')]).default(''),

  /** Phase 6, layer 2. Off until the Edge Function exists. */
  VITE_FEATURE_CLAUDE_GENERATOR: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
});

export type Env = z.infer<typeof schema>;

function readEnv(): Env {
  const result = schema.safeParse(import.meta.env);
  if (result.success) return result.data;

  // A pretty-printed list beats Zod's default dump when the reader is someone
  // who has just cloned the repo and does not yet know what any of this is.
  const problems = result.error.issues
    .map((issue) => `  · ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');

  throw new Error(
    `Environment is not configured.\n\n${problems}\n\n` +
      'Copy .env.example to .env.local and fill in the values from your ' +
      'Supabase dashboard (Project Settings > API Keys).',
  );
}

export const env: Env = readEnv();
