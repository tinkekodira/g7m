import { describe, expect, it } from 'vitest';
import { appBaseUrl } from './app-url.js';

describe('appBaseUrl', () => {
  it('keeps the subpath, which location.origin would have dropped', () => {
    // The bug: origin gives https://tinkekodira.github.io, losing /g7m/, and
    // Supabase then silently falls back to site_url.
    expect(appBaseUrl('https://tinkekodira.github.io/g7m/')).toBe(
      'https://tinkekodira.github.io/g7m/',
    );
  });

  it('works at the root, as in local development', () => {
    expect(appBaseUrl('http://localhost:5173/')).toBe('http://localhost:5173/');
  });

  it('adds the trailing slash when the URL has none', () => {
    expect(appBaseUrl('https://tinkekodira.github.io/g7m')).toBe('https://tinkekodira.github.io/');
  });

  it('strips a filename back to its directory', () => {
    expect(appBaseUrl('https://tinkekodira.github.io/g7m/index.html')).toBe(
      'https://tinkekodira.github.io/g7m/',
    );
  });

  it('drops the OAuth code that Supabase appends on the way back', () => {
    expect(appBaseUrl('https://tinkekodira.github.io/g7m/?code=abc123')).toBe(
      'https://tinkekodira.github.io/g7m/',
    );
  });

  it('drops a hash fragment too', () => {
    expect(appBaseUrl('http://localhost:5173/#/workout/42')).toBe('http://localhost:5173/');
  });

  it('handles a custom scheme, which is what the native shells serve from', () => {
    expect(appBaseUrl('capacitor://localhost/index.html')).toBe('capacitor://localhost/');
  });
});
