import { describe, expect, it } from 'vitest';
import {
  STALE_SESSION_HOURS,
  formatElapsed,
  isRestOver,
  looksAbandoned,
  restRemaining,
} from './workout-timer.js';

const START = new Date('2026-09-06T10:00:00.000Z');

function at(offsetSeconds: number): Date {
  return new Date(START.getTime() + offsetSeconds * 1000);
}

describe('restRemaining', () => {
  it('counts down from the duration', () => {
    expect(restRemaining(START, 180, at(0))).toBe(180);
    expect(restRemaining(START, 180, at(60))).toBe(120);
  });

  /**
   * The reason this is derived from timestamps rather than counted down by an
   * interval. A locked phone stops firing `setInterval`, and a decremented
   * counter comes back showing 1:40 left after four minutes of rest.
   */
  it('is correct after the phone was asleep the whole time', () => {
    expect(restRemaining(START, 180, at(600))).toBe(0);
  });

  it('never goes negative', () => {
    expect(restRemaining(START, 90, at(3600))).toBe(0);
  });

  it('gives the full duration if the clock stepped backwards', () => {
    // Otherwise a timezone change mid-rest shows more time remaining than the
    // rest was ever set for.
    expect(restRemaining(START, 180, at(-500))).toBe(180);
  });

  /**
   * Null and zero are different states: one hides the timer, the other shows
   * it finished.
   */
  it('is null when nothing is resting', () => {
    expect(restRemaining(null, 180, at(0))).toBeNull();
  });
});

describe('isRestOver', () => {
  it('is false while resting and true once done', () => {
    expect(isRestOver(90)).toBe(false);
    expect(isRestOver(0)).toBe(true);
  });

  it('is false when there is no rest running at all', () => {
    expect(isRestOver(null)).toBe(false);
  });
});

describe('formatElapsed', () => {
  it('is minutes and seconds for a normal workout', () => {
    expect(formatElapsed(START, at(0))).toBe('0:00');
    expect(formatElapsed(START, at(65))).toBe('1:05');
    expect(formatElapsed(START, at(41 * 60 + 20))).toBe('41:20');
  });

  /**
   * Two hours in, `127:04` makes the lifter do the division themselves.
   */
  it('switches to hours and minutes past the hour', () => {
    expect(formatElapsed(START, at(3600))).toBe('1:00');
    expect(formatElapsed(START, at(2 * 3600 + 7 * 60 + 4))).toBe('2:07');
  });

  it('does not show a negative time when the clock disagrees', () => {
    expect(formatElapsed(START, at(-120))).toBe('0:00');
  });
});

describe('looksAbandoned', () => {
  /**
   * The commonest way history gets a six-hour workout: the lifter finished,
   * walked out, and never tapped Finish.
   */
  it('is true for a session left open for hours', () => {
    expect(looksAbandoned(START, at(STALE_SESSION_HOURS * 3600))).toBe(true);
  });

  it('is false for a long but plausible workout', () => {
    expect(looksAbandoned(START, at(90 * 60))).toBe(false);
  });
});
