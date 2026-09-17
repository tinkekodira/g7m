import { type Env, readEnv } from './env-check.js';

/**
 * Environment, validated at module load.
 *
 * Validating here turns a missing key into one clear message at startup
 * instead of a `Failed to construct URL` from deep inside the Supabase client
 * twenty seconds later.
 *
 * The rules live in `env-check.ts`, which is a pure function over a plain
 * object and therefore testable. This file is the one line that cannot be:
 * `import.meta.env` is replaced by Vite at build time and does not exist in a
 * Node test runner.
 */

export type { Env };

export const env: Env = readEnv(import.meta.env);
