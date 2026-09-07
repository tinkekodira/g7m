import { describe, expect, it } from 'vitest';
import {
  STALE_SESSION_HOURS,
  formatElapsed,
  isRestOver,
  looksAbandoned,
  openSessionSummary,
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

describe('openSessionSummary', () => {
  const started = new Date('2026-09-08T18:00:00Z');

  function at(minutes: number): Date {
    return new Date(started.getTime() + minutes * 60_000);
  }

  function summarise(minutes: number, exerciseCount = 0, completedSets = 0) {
    return openSessionSummary({ startedAt: started, exerciseCount, completedSets }, at(minutes));
  }

  it('says how far in, what is in it, and how much is done', () => {
    const summary = summarise(23, 3, 7);
    expect(summary.headline).toBe('Continue your workout');
    expect(summary.detail).toBe('23 min in · 3 exercises · 7 sets done');
    expect(summary.stale).toBe(false);
  });

  it('does not say "0 min in"', () => {
    expect(summarise(0).detail).toBe('just started');
    expect(summarise(0.5).detail).toBe('just started');
  });

  it('does not announce an empty workout as "0 exercises"', () => {
    expect(summarise(5).detail).toBe('5 min in');
    expect(summarise(5, 2).detail).toBe('5 min in · 2 exercises');
  });

  it('counts one of a thing as one', () => {
    expect(summarise(1, 1, 1).detail).toBe('1 min in · 1 exercise · 1 set done');
  });

  it('switches to hours and minutes past the hour', () => {
    expect(summarise(72).detail).toBe('1 h 12 min in');
  });

  /**
   * A session left open overnight is the commonest way a six-hour workout gets
   * into the history. By then the useful action is closing it, so the card
   * stops reading as an invitation to carry on.
   */
  it('stops inviting you to carry on once it has been open for hours', () => {
    const summary = summarise(STALE_SESSION_HOURS * 60 + 30, 4, 12);
    expect(summary.stale).toBe(true);
    expect(summary.headline).toBe('You left a workout open');
    expect(summary.detail).toBe('open for 4 hours · 4 exercises · 12 sets done');
  });

  it('never comes back with an empty line', () => {
    for (const minutes of [0, 1, 59, 60, 239, 240, 1440]) {
      expect(summarise(minutes).detail, String(minutes)).not.toBe('');
    }
  });
});
