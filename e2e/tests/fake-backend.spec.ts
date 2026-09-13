import { expect, test } from '@playwright/test';
import { readSyncRules } from '../fake-backend/sync-rules.js';
import { renderTimestamp } from '../fake-backend/sync.js';

/**
 * The fake's own promises, checked without a browser.
 *
 * The browser tests are only as good as the fake is faithful, and a fake that
 * quietly stopped reading the deployed rules — or spelt time differently from
 * the service — would pass them while testing something that is not
 * production.
 */

test('reads the timestamp format from the deployed sync rules', () => {
  expect(readSyncRules().timestamps).toEqual({ iso8601: true, subSecondDigits: 3 });
});

test('spells a timestamp the way the service does', () => {
  const iso = { iso8601: true, subSecondDigits: 3 };
  const legacy = { iso8601: false, subSecondDigits: 6 };

  // Cut, not rounded, and padded: always the three digits toISOString() writes.
  expect(renderTimestamp('2026-09-13 10:00:00.123456+00', iso)).toBe('2026-09-13T10:00:00.123Z');
  expect(renderTimestamp('2026-09-13 10:00:00.9999+00', iso)).toBe('2026-09-13T10:00:00.999Z');
  expect(renderTimestamp('2026-09-13 10:00:00.5+00', iso)).toBe('2026-09-13T10:00:00.500Z');
  expect(renderTimestamp('2026-09-13 10:00:00+00', iso)).toBe('2026-09-13T10:00:00.000Z');

  // The legacy default, which devices held before ADR-0068.
  expect(renderTimestamp('2026-09-13 10:00:00.12345+00', legacy)).toBe(
    '2026-09-13 10:00:00.12345Z',
  );
  expect(renderTimestamp('2026-09-13 10:00:00+00', legacy)).toBe('2026-09-13 10:00:00Z');
});

test('refuses a sync-rules option it does not implement', () => {
  expect(() => readSyncRules('config:\n  edition: 2\n\nbucket_definitions:\n')).toThrow(
    /does not implement the sync-rules option edition/,
  );
});
