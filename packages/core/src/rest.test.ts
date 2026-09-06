import { describe, expect, it } from 'vitest';
import {
  MAX_REST_SECONDS,
  MIN_REST_SECONDS,
  REST_SECONDS_COMPOUND,
  REST_SECONDS_ISOLATION,
  clampRest,
  formatRest,
  restSecondsFor,
} from './rest.js';

describe('restSecondsFor', () => {
  it('uses the exercise value when there is one', () => {
    expect(restSecondsFor({ exerciseSeconds: 240, profileSeconds: 60, mechanic: 'compound' })).toBe(
      240,
    );
  });

  /**
   * The precedence that is actually a decision: rest is a property of the
   * movement, and one number on a profile cannot tell a heavy squat from a
   * lateral raise. The profile fills in for exercises with no opinion.
   */
  it('falls back to the profile default when the exercise has none', () => {
    expect(
      restSecondsFor({ exerciseSeconds: null, profileSeconds: 60, mechanic: 'compound' }),
    ).toBe(60);
  });

  it('derives from the mechanic when nobody has an opinion', () => {
    expect(
      restSecondsFor({ exerciseSeconds: null, profileSeconds: null, mechanic: 'compound' }),
    ).toBe(REST_SECONDS_COMPOUND);
    expect(
      restSecondsFor({ exerciseSeconds: null, profileSeconds: null, mechanic: 'isolation' }),
    ).toBe(REST_SECONDS_ISOLATION);
  });

  it('rests longer after a compound than an isolation', () => {
    // Stated as a relationship rather than as two constants, so changing the
    // numbers cannot accidentally invert them.
    expect(REST_SECONDS_COMPOUND).toBeGreaterThan(REST_SECONDS_ISOLATION);
  });

  it('treats zero and negatives as no opinion rather than no rest', () => {
    expect(restSecondsFor({ exerciseSeconds: 0, profileSeconds: 90, mechanic: 'compound' })).toBe(
      90,
    );
    expect(
      restSecondsFor({ exerciseSeconds: -30, profileSeconds: null, mechanic: 'isolation' }),
    ).toBe(REST_SECONDS_ISOLATION);
  });

  it('clamps an absurd stored value instead of trusting it', () => {
    // Nothing enforces the range on the device: SQLite has no CHECK here.
    expect(
      restSecondsFor({ exerciseSeconds: 99_999, profileSeconds: null, mechanic: 'compound' }),
    ).toBe(MAX_REST_SECONDS);
    expect(restSecondsFor({ exerciseSeconds: 1, profileSeconds: null, mechanic: 'compound' })).toBe(
      MIN_REST_SECONDS,
    );
  });
});

describe('clampRest', () => {
  it('rounds to whole seconds', () => {
    expect(clampRest(90.4)).toBe(90);
    expect(clampRest(90.6)).toBe(91);
  });

  it('has an answer for nonsense', () => {
    expect(clampRest(Number.NaN)).toBe(REST_SECONDS_ISOLATION);
  });
});

describe('formatRest', () => {
  it('is minutes and seconds, readable at arm’s length', () => {
    expect(formatRest(120)).toBe('2:00');
    expect(formatRest(90)).toBe('1:30');
    expect(formatRest(5)).toBe('0:05');
  });

  it('pads the seconds, so the width does not jump every ten seconds', () => {
    expect(formatRest(65)).toBe('1:05');
    expect(formatRest(61)).toBe('1:01');
  });

  it('rounds up, so a timer never shows 0:00 with time left on it', () => {
    expect(formatRest(0.2)).toBe('0:01');
  });

  it('never shows a negative time when the timer overruns', () => {
    expect(formatRest(-5)).toBe('0:00');
  });
});
