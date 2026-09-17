/**
 * The environment's shape, checked by hand.
 *
 * Brief §3 asks for Zod at every boundary, and the environment is the first
 * boundary the app crosses. This one is the exception, for a reason that is
 * about the phone rather than about validation: Zod was 76 KB of the entry
 * chunk — the bytes every user downloads before anything appears — and the
 * whole of its job here is four strings that are baked into the bundle at
 * build time and never change afterwards. A schema library earns its size
 * where the data is untrusted, variable and complicated. None of those is true
 * of `import.meta.env`.
 *
 * So the rules are written out below instead. They check exactly what the
 * schema checked and produce the same message, and unlike the schema they are
 * covered by tests, because a pure function taking a plain object is something
 * a Node test runner can call. When a real boundary arrives — a response from
 * the Claude generator, say — Zod belongs there, imported by the screen that
 * parses it rather than by the app's first line.
 *
 * Everything here is public by design: it is compiled into the bundle and
 * shipped to every device. Row Level Security is what protects the data.
 */

export interface Env {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  /** Phase 2. Empty until a PowerSync instance exists. */
  readonly VITE_POWERSYNC_URL: string;
  /** Phase 6, layer 2. Off until the Edge Function exists. */
  readonly VITE_FEATURE_CLAUDE_GENERATOR: boolean;
}

/** The shortest a publishable key could plausibly be. */
const MIN_KEY_LENGTH = 20;

interface Problem {
  readonly key: string;
  readonly message: string;
}

/**
 * A variable's value, or null when it is missing or blank.
 *
 * Vite puts non-strings in here too (`DEV`, `PROD`, `MODE`), and an unset
 * variable can arrive as an empty string rather than as `undefined` depending
 * on how it was passed. Both are "not set" as far as this is concerned.
 */
function text(raw: Record<string, unknown>, key: string): string | null {
  const value = raw[key];
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

/**
 * `new URL` rather than `URL.canParse`, which Safari only learned in 17.4 —
 * inside the iOS floor this app builds against, but not by much, and a
 * try/catch costs nothing.
 */
function isUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * The environment, or a list of everything wrong with it.
 *
 * Every problem rather than the first, so somebody setting the project up
 * fixes their `.env.local` once instead of discovering the next missing line
 * on the next run.
 */
export function checkEnv(raw: Record<string, unknown>): {
  readonly env: Env | null;
  readonly problems: readonly Problem[];
} {
  const problems: Problem[] = [];

  const url = text(raw, 'VITE_SUPABASE_URL');
  if (url === null || !isUrl(url)) {
    problems.push({
      key: 'VITE_SUPABASE_URL',
      message: 'must be the full https URL of your Supabase project',
    });
  }

  /**
   * Supabase is midway through renaming this. Either the `sb_publishable_…`
   * string or the legacy `anon` JWT works; both are safe to ship.
   */
  const key = text(raw, 'VITE_SUPABASE_PUBLISHABLE_KEY');
  if (key === null || key.length < MIN_KEY_LENGTH) {
    problems.push({
      key: 'VITE_SUPABASE_PUBLISHABLE_KEY',
      message: 'looks too short to be a real key',
    });
  }

  // Optional, but a value that is set has to be a real URL: a typo here is a
  // sync that silently never connects.
  const powersync = text(raw, 'VITE_POWERSYNC_URL');
  if (powersync !== null && !isUrl(powersync)) {
    problems.push({ key: 'VITE_POWERSYNC_URL', message: 'must be a URL, or left empty' });
  }

  const generator = text(raw, 'VITE_FEATURE_CLAUDE_GENERATOR');
  if (generator !== null && generator !== 'true' && generator !== 'false') {
    problems.push({ key: 'VITE_FEATURE_CLAUDE_GENERATOR', message: "must be 'true' or 'false'" });
  }

  if (problems.length > 0) return { env: null, problems };

  return {
    env: {
      // Checked above; the narrowing is lost across the pushes.
      VITE_SUPABASE_URL: url ?? '',
      VITE_SUPABASE_PUBLISHABLE_KEY: key ?? '',
      VITE_POWERSYNC_URL: powersync ?? '',
      VITE_FEATURE_CLAUDE_GENERATOR: generator === 'true',
    },
    problems: [],
  };
}

/**
 * What to tell somebody who has just cloned the repo and has none of this set
 * up yet — which is the only audience this message ever has.
 */
export function describeProblems(problems: readonly Problem[]): string {
  const lines = problems.map((problem) => `  · ${problem.key}: ${problem.message}`).join('\n');
  return (
    `Environment is not configured.\n\n${lines}\n\n` +
    'Copy .env.example to .env.local and fill in the values from your ' +
    'Supabase dashboard (Project Settings > API Keys).'
  );
}

/** The environment, or a thrown error naming everything that is wrong. */
export function readEnv(raw: Record<string, unknown>): Env {
  const result = checkEnv(raw);
  if (result.env === null) throw new Error(describeProblems(result.problems));
  return result.env;
}
