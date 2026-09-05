import { describe, expect, it } from 'vitest';
import {
  classifyUploadError,
  isAlreadyApplied,
  isPermissionDenied,
  type UploadError,
} from './upload-outcome.js';

/**
 * Both wrong answers here are expensive, and they are expensive in different
 * ways — so the tests are grouped by which mistake they are guarding against
 * rather than by which function they call.
 */

describe('failures that must be retried, or a logged set is lost', () => {
  const retryable: [string, UploadError][] = [
    ['a dropped connection', { message: 'Failed to fetch' }],
    ['a browser network error', { message: 'NetworkError when attempting to fetch resource' }],
    ['a React Native fetch failure', { message: 'Network request failed' }],
    ['a timeout', { message: 'The request timed out' }],
    ['a reset socket', { message: 'ECONNRESET' }],
    ['a gateway error', { status: 502, message: 'Bad Gateway' }],
    ['an unavailable service', { status: 503 }],
    ['a gateway timeout', { status: 504 }],
    ['rate limiting', { status: 429, message: 'Too Many Requests' }],
    ['a request timeout status', { status: 408 }],
    ['an expired JWT', { code: 'PGRST301', message: 'JWT expired' }],
    ['the database being unreachable', { code: 'PGRST000' }],
  ];

  for (const [description, error] of retryable) {
    it(`retries ${description}`, () => {
      expect(classifyUploadError(error)).toBe('retry');
    });
  }

  /**
   * A 401 is ambiguous — an expired token or a revoked session — and the
   * Supabase client refreshes before the next attempt, so one more try is free
   * and sometimes fixes it. Discarding here would throw away a write because a
   * token aged out mid-queue.
   */
  it('retries an unauthorised response rather than discarding the write', () => {
    expect(classifyUploadError({ status: 401 })).toBe('retry');
  });

  /**
   * The default, and the one that matters most. An error nobody anticipated is
   * far more likely to be a network than a permanently broken row, and the two
   * mistakes are not symmetric: a stalled queue is visible and recoverable, a
   * discarded set is neither.
   */
  it('retries anything it does not recognise', () => {
    expect(classifyUploadError({})).toBe('retry');
    expect(classifyUploadError({ message: 'something nobody has seen before' })).toBe('retry');
    expect(classifyUploadError({ code: 'WHAT' })).toBe('retry');
  });
});

describe('failures that must be discarded, or the whole queue jams behind them', () => {
  const permanent: [string, UploadError][] = [
    ['a check constraint', { code: '23514', message: 'violates check constraint' }],
    ['a not-null violation', { code: '23502' }],
    ['a foreign key violation', { code: '23503' }],
    ['a unique violation', { code: '23505' }],
    ['a numeric overflow', { code: '22003', message: 'numeric field overflow' }],
    ['an invalid timestamp', { code: '22007' }],
    ['row level security refusing the write', { code: '42501' }],
    ['an undefined column', { code: '42703' }],
    ['a bad request', { status: 400, message: 'invalid input syntax' }],
    ['a not-found table', { status: 404 }],
    ['an unprocessable entity', { status: 422 }],
  ];

  for (const [description, error] of permanent) {
    it(`discards ${description}`, () => {
      expect(classifyUploadError(error)).toBe('discard');
    });
  }

  /**
   * The failure mode this whole module exists for. A row that violates a
   * constraint violates it identically on every attempt; leaving it queued
   * blocks every write made after it, and the app reports nothing wrong while
   * sync quietly stops forever.
   */
  it('never retries a constraint violation, however it is surfaced', () => {
    expect(classifyUploadError({ code: '23514' })).toBe('discard');
    expect(classifyUploadError({ code: '23514', status: 400 })).toBe('discard');
  });
});

describe('the code is trusted over the message', () => {
  /**
   * PostgREST puts the offending row in `details`, and a check constraint on a
   * table called `session_sets` produces messages containing all sorts of
   * words. Reading the SQLSTATE first means none of that matters.
   */
  it('discards a constraint violation even when the message sounds like a network error', () => {
    expect(
      classifyUploadError({
        code: '23514',
        message: 'timeout value violates check constraint session_sets_timeout_check',
      }),
    ).toBe('discard');
  });

  it('retries an expired JWT even though 301 looks like a redirect', () => {
    expect(classifyUploadError({ code: 'PGRST301', status: 401 })).toBe('retry');
  });

  it('ignores a code that is not a SQLSTATE', () => {
    // Five characters, but not a class this module knows. Falls through to the
    // safe default rather than matching '23' by accident.
    expect(classifyUploadError({ code: 'ABCDE' })).toBe('retry');
  });

  it('is not fooled by a lowercase code', () => {
    expect(classifyUploadError({ code: 'pgrst301' })).toBe('retry');
  });
});

describe('isAlreadyApplied', () => {
  /**
   * The benign permanent failure: the first attempt succeeded and its
   * acknowledgement was lost, so the retry collides with the row it just wrote.
   * Nothing is lost, so nothing should be reported to the user.
   */
  it('recognises a duplicate key as a write that already landed', () => {
    expect(isAlreadyApplied({ code: '23505' })).toBe(true);
    expect(isAlreadyApplied({ message: 'duplicate key value violates unique constraint' })).toBe(
      true,
    );
  });

  it('does not mistake other constraint violations for it', () => {
    expect(isAlreadyApplied({ code: '23514' })).toBe(false);
    expect(isAlreadyApplied({ code: '23503' })).toBe(false);
    expect(isAlreadyApplied({})).toBe(false);
  });

  it('agrees with the classifier that it is permanent', () => {
    expect(classifyUploadError({ code: '23505' })).toBe('discard');
  });
});

describe('isPermissionDenied', () => {
  /**
   * Separated from other permanent failures because the cause is specific and
   * fixable: almost always a row inserted without `user_id`, which the RLS
   * `with check` then refuses. Worth saying so rather than filing it under
   * "bad row".
   */
  it('recognises the ways a policy refuses a write', () => {
    expect(isPermissionDenied({ code: '42501' })).toBe(true);
    expect(isPermissionDenied({ message: 'new row violates row-level security policy' })).toBe(
      true,
    );
    expect(isPermissionDenied({ message: 'permission denied for table session_sets' })).toBe(true);
    expect(isPermissionDenied({ status: 403 })).toBe(true);
    expect(isPermissionDenied({ status: 401 })).toBe(true);
  });

  it('does not claim every failure is a permission problem', () => {
    expect(isPermissionDenied({ code: '23514' })).toBe(false);
    expect(isPermissionDenied({ message: 'Failed to fetch' })).toBe(false);
    expect(isPermissionDenied({})).toBe(false);
  });

  /**
   * 401 is the one case where the two disagree, and deliberately: it reads as a
   * permission problem but is worth one retry, because an expired token is the
   * commonest cause and refreshing fixes it.
   */
  it('flags a 401 as a permission problem while still retrying it', () => {
    expect(isPermissionDenied({ status: 401 })).toBe(true);
    expect(classifyUploadError({ status: 401 })).toBe('retry');
  });
});
