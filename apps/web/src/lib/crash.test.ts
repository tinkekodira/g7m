import { describe, expect, it } from 'vitest';
import { crashCopy, crashKind, crashMessage, crashReport } from './crash.js';

describe('crashKind', () => {
  it.each([
    // Chromium, Firefox and WebKit, verbatim.
    'Failed to fetch dynamically imported module: https://x.github.io/g7m/assets/AnatomyViewer-3f9a.js',
    'error loading dynamically imported module: https://x.github.io/g7m/assets/AnatomyViewer-3f9a.js',
    'Importing a module script failed.',
    'Unable to preload CSS for /g7m/assets/index-9c1d.css',
  ])('reads a missing chunk as a stale build: %s', (message) => {
    expect(crashKind(new TypeError(message))).toBe('stale-build');
  });

  it('knows the webpack-style name too', () => {
    const error = new Error('Loading chunk 7 failed.');
    error.name = 'ChunkLoadError';
    expect(crashKind(error)).toBe('stale-build');
  });

  it('reads anything else as a bug', () => {
    expect(crashKind(new TypeError("Cannot read properties of undefined (reading 'id')"))).toBe(
      'bug',
    );
    expect(crashKind('something odd')).toBe('bug');
    expect(crashKind(null)).toBe('bug');
  });
});

describe('crashMessage', () => {
  it('uses the message, or the name when there is none', () => {
    expect(crashMessage(new RangeError('Invalid time value'))).toBe('Invalid time value');
    expect(crashMessage(new RangeError())).toBe('RangeError');
  });

  it('copes with things that are not errors', () => {
    expect(crashMessage('plain words')).toBe('plain words');
    expect(crashMessage({ code: 42 })).toBe('{"code":42}');
    expect(crashMessage(undefined)).toBe('undefined');
  });
});

describe('crashCopy', () => {
  it('tells a stale build to reload, and says nothing is lost', () => {
    const copy = crashCopy('stale-build', false);
    expect(copy.title).toBe('g7m has been updated');
    expect(copy.detail).toMatch(/Reload/);
    expect(copy.detail).toMatch(/Nothing you logged is lost/);
  });

  it('reassures someone mid-workout about the workout', () => {
    expect(crashCopy('bug', true).detail).toMatch(/Your workout is safe/);
    expect(crashCopy('bug', false).detail).not.toMatch(/workout is safe/);
  });
});

describe('crashReport', () => {
  const context = {
    at: new Date('2026-09-13T17:05:00.000Z'),
    url: 'https://example.github.io/g7m/#/progress/session/abc',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X)',
  };

  it('says what, where, when and on what, then the stack', () => {
    const error = new TypeError('x is undefined');
    error.stack = 'TypeError: x is undefined\n    at SessionDetail (SessionDetailScreen.tsx:40:12)';
    const report = crashReport(error, context);
    expect(report.split('\n').slice(0, 5)).toEqual([
      'g7m crash report',
      'What: x is undefined',
      'Where: /progress/session/abc',
      'When: 2026-09-13T17:05:00.000Z',
      'Device: Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X)',
    ]);
    expect(report).toContain('at SessionDetail');
  });

  it('gives the route and never the rest of the address', () => {
    const report = crashReport(new Error('boom'), {
      ...context,
      url: 'https://example.github.io/g7m/?code=secret-oauth-code#/',
    });
    expect(report).toContain('Where: /');
    expect(report).not.toContain('secret-oauth-code');
  });

  it('works for a page with no route yet', () => {
    expect(crashReport('boom', { ...context, url: 'https://example.github.io/g7m/' })).toContain(
      'Where: /',
    );
  });
});
