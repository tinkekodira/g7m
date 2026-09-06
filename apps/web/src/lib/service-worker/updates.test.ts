import { describe, expect, it } from 'vitest';
import { UPDATE_CHECK_INTERVAL_MS, isUpdateReady, shouldCheckForUpdate } from './updates.js';

describe('shouldCheckForUpdate', () => {
  it('checks the first time it is asked', () => {
    expect(shouldCheckForUpdate(null, 1_000)).toBe(true);
  });

  it('does not check again immediately', () => {
    expect(shouldCheckForUpdate(1_000, 1_500)).toBe(false);
  });

  it('checks once the interval has passed', () => {
    expect(shouldCheckForUpdate(1_000, 1_000 + UPDATE_CHECK_INTERVAL_MS)).toBe(true);
  });

  it('checks when the clock has gone backwards', () => {
    // Otherwise a device that corrects its clock forward, then back, stops
    // looking for updates until real time catches up with the bad reading.
    expect(shouldCheckForUpdate(9_000_000, 1_000)).toBe(true);
  });

  it('honours a caller-supplied interval', () => {
    expect(shouldCheckForUpdate(1_000, 1_500, 400)).toBe(true);
    expect(shouldCheckForUpdate(1_000, 1_500, 600)).toBe(false);
  });
});

describe('isUpdateReady', () => {
  it('is an update when a worker was already controlling the page', () => {
    expect(isUpdateReady('installed', true)).toBe(true);
  });

  it('is not an update on a first ever visit', () => {
    expect(isUpdateReady('installed', false)).toBe(false);
  });

  it('is not an update while the worker is still installing', () => {
    expect(isUpdateReady('installing', true)).toBe(false);
  });

  it('is not an update once the worker has taken over', () => {
    // By `activated` the page has already reloaded onto the new build, or is
    // about to. A prompt at that point offers a reload that changes nothing.
    expect(isUpdateReady('activated', true)).toBe(false);
    expect(isUpdateReady('redundant', true)).toBe(false);
  });
});
