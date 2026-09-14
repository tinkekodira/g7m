import { describe, expect, it } from 'vitest';
import { drawsFlags, flagEmoji } from './flags.js';

describe('flagEmoji', () => {
  it('turns a country code into its flag', () => {
    expect(flagEmoji('HR')).toBe('🇭🇷');
    expect(flagEmoji('si')).toBe('🇸🇮');
    expect(flagEmoji(' gb ')).toBe('🇬🇧');
  });

  it('is two regional indicators, and nothing else', () => {
    expect([...(flagEmoji('DE') ?? '')].map((c) => c.codePointAt(0))).toEqual([0x1f1e9, 0x1f1ea]);
  });

  it('refuses what is not a two-letter code', () => {
    for (const bad of ['', 'H', 'HRV', '12', 'Ç1']) expect(flagEmoji(bad), bad).toBeNull();
  });
});

describe('drawsFlags', () => {
  it('sees a pair drawn as one flag', () => {
    expect(drawsFlags(32, 32)).toBe(true);
  });

  it('sees a pair drawn as two letters', () => {
    expect(drawsFlags(44, 22)).toBe(false);
  });

  it('assumes no flags when nothing was measured', () => {
    expect(drawsFlags(0, 0)).toBe(false);
  });
});
