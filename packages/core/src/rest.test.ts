import { describe, expect, it } from 'vitest';
import {
  MAX_REST_SECONDS,
  MIN_REST_SECONDS,
  REST_BASELINE_SECONDS,
  REST_SECONDS_COMPOUND,
  REST_SECONDS_ISOLATION,
  clampRest,
  formatRest,
  restSecondsFor,
} from './rest.js';

describe('restSecondsFor', () => {
  it('uses the exercise value as written when the lifter has no preference', () => {
    expect(
      restSecondsFor({ exerciseSeconds: 240, profileSeconds: null, mechanic: 'compound' }),
    ).toBe(240);
  });

  /**
   * The setting is a pace, not an override. Every seeded exercise carries an
   * explicit rest, so a profile value that merely lost the precedence fight
   * was a setting that could never do anything.
   */
  it('scales the exercise value by the lifter’s pace', () => {
    // Half the baseline: everything takes half as long.
    expect(restSecondsFor({ exerciseSeconds: 240, profileSeconds: 60, mechanic: 'compound' })).toBe(
      120,
    );
    // And half again on a shorter exercise, from the same setting.
    expect(restSecondsFor({ exerciseSeconds: 60, profileSeconds: 60, mechanic: 'isolation' })).toBe(
      30,
    );
    // Above the baseline it stretches rather than shrinks.
    expect(
      restSecondsFor({ exerciseSeconds: 120, profileSeconds: 180, mechanic: 'compound' }),
    ).toBe(180);
  });

  /**
   * The property that matters more than any single number: a compound keeps
   * its extra recovery at every pace. This is what an override would destroy.
   */
  it('keeps a compound resting longer than an isolation at any pace', () => {
    for (const profileSeconds of [30, 60, 120, 300, 900]) {
      const compound = restSecondsFor({
        exerciseSeconds: 180,
        profileSeconds,
        mechanic: 'compound',
      });
      const isolation = restSecondsFor({
        exerciseSeconds: 60,
        profileSeconds,
        mechanic: 'isolation',
      });
      expect(compound).toBeGreaterThan(isolation);
    }
  });

  /**
   * The column's own default, so an account that has never touched the setting
   * gets the catalogue exactly as written.
   */
  it('changes nothing at the baseline', () => {
    expect(
      restSecondsFor({
        exerciseSeconds: 180,
        profileSeconds: REST_BASELINE_SECONDS,
        mechanic: 'compound',
      }),
    ).toBe(180);
  });

  /**
   * Still the plain fallback where the exercise has no opinion — a custom
   * exercise, or a catalogue row added without one.
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
