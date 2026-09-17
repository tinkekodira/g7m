import { describe, expect, it } from 'vitest';
import { checkEnv, describeProblems, readEnv } from './env-check.js';

/**
 * A configured environment, to vary one field at a time from.
 *
 * The key is deliberately a sentence rather than something key-shaped. Only
 * its length is checked, so a sentence says the rule more plainly -- and a
 * convincing fake in a public repository is a thing the secret scanner has to
 * flag, correctly, every time it runs.
 */
const good = {
  VITE_SUPABASE_URL: 'https://abcdefghijklm.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'a-key-goes-here-not-this',
  VITE_POWERSYNC_URL: 'https://abcdefghijklm.powersync.journeyapps.com',
  VITE_FEATURE_CLAUDE_GENERATOR: 'false',
};

describe('checkEnv', () => {
  it('accepts a configured environment', () => {
    const { env, problems } = checkEnv(good);
    expect(problems).toEqual([]);
    expect(env).toEqual({
      VITE_SUPABASE_URL: 'https://abcdefghijklm.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'a-key-goes-here-not-this',
      VITE_POWERSYNC_URL: 'https://abcdefghijklm.powersync.journeyapps.com',
      VITE_FEATURE_CLAUDE_GENERATOR: false,
    });
  });

  /**
   * Vite hands over the whole of `import.meta.env`, which carries booleans and
   * the mode string alongside the app's own variables.
   */
  it('ignores everything it was not asked about', () => {
    const { env } = checkEnv({ ...good, MODE: 'production', DEV: false, PROD: true });
    expect(env?.VITE_SUPABASE_URL).toBe('https://abcdefghijklm.supabase.co');
  });

  it('reads the feature flag as a boolean, and defaults it to off', () => {
    expect(checkEnv({ ...good, VITE_FEATURE_CLAUDE_GENERATOR: 'true' }).env).toMatchObject({
      VITE_FEATURE_CLAUDE_GENERATOR: true,
    });
    const { VITE_FEATURE_CLAUDE_GENERATOR: _omitted, ...without } = good;
    expect(checkEnv(without).env).toMatchObject({ VITE_FEATURE_CLAUDE_GENERATOR: false });
  });

  it('defaults the PowerSync URL to empty, since Phase 2 may not exist yet', () => {
    const { VITE_POWERSYNC_URL: _omitted, ...without } = good;
    expect(checkEnv(without).env).toMatchObject({ VITE_POWERSYNC_URL: '' });
  });

  /**
   * An unset variable reaches the app as `''` about as often as `undefined`,
   * depending on whether it came from a file, a shell or a CI secret that was
   * never populated. Neither is configured.
   */
  it('treats missing, empty and blank the same way', () => {
    for (const value of [undefined, '', '   ']) {
      const { env, problems } = checkEnv({ ...good, VITE_SUPABASE_URL: value });
      expect(env).toBeNull();
      expect(problems).toEqual([
        {
          key: 'VITE_SUPABASE_URL',
          message: 'must be the full https URL of your Supabase project',
        },
      ]);
    }
  });

  it('rejects a URL that is not one', () => {
    expect(checkEnv({ ...good, VITE_SUPABASE_URL: 'abcdefghijklm.supabase.co' }).env).toBeNull();
    // A PowerSync URL is optional, but a typo in one is a sync that never
    // connects and never says why.
    expect(checkEnv({ ...good, VITE_POWERSYNC_URL: 'wss//typo' }).env).toBeNull();
  });

  it('rejects a key too short to be one', () => {
    const { problems } = checkEnv({ ...good, VITE_SUPABASE_PUBLISHABLE_KEY: 'too-short' });
    expect(problems).toEqual([
      { key: 'VITE_SUPABASE_PUBLISHABLE_KEY', message: 'looks too short to be a real key' },
    ]);
  });

  it('rejects a flag that is neither true nor false', () => {
    const { problems } = checkEnv({ ...good, VITE_FEATURE_CLAUDE_GENERATOR: 'yes' });
    expect(problems).toHaveLength(1);
    expect(problems[0]?.key).toBe('VITE_FEATURE_CLAUDE_GENERATOR');
  });

  /**
   * Somebody who has just cloned the repo has none of it set. Reporting the
   * first missing line and stopping means finding out about the second one on
   * the next run, and the third on the run after that.
   */
  it('reports every problem at once', () => {
    const { problems } = checkEnv({});
    expect(problems.map((problem) => problem.key)).toEqual([
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_PUBLISHABLE_KEY',
    ]);
  });
});

describe('describeProblems', () => {
  it('names each variable, what is wrong, and what to do about it', () => {
    const message = describeProblems(checkEnv({}).problems);
    expect(message).toContain('Environment is not configured.');
    expect(message).toContain('· VITE_SUPABASE_URL: must be the full https URL');
    expect(message).toContain('· VITE_SUPABASE_PUBLISHABLE_KEY: looks too short');
    expect(message).toContain('Copy .env.example to .env.local');
  });
});

describe('readEnv', () => {
  it('returns the environment when it is configured', () => {
    expect(readEnv(good).VITE_SUPABASE_URL).toBe('https://abcdefghijklm.supabase.co');
  });

  it('throws the full report when it is not', () => {
    expect(() => readEnv({})).toThrow(/VITE_SUPABASE_PUBLISHABLE_KEY/);
  });
});
