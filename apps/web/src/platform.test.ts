import { afterEach, describe, expect, it } from 'vitest';
import { detectPlatform, platformLabel } from './platform.js';

const g = globalThis as Record<string, unknown>;

afterEach(() => {
  delete g['Capacitor'];
  delete g['__TAURI_INTERNALS__'];
  delete g['__TAURI__'];
  delete g['navigator'];
  delete g['matchMedia'];
});

describe('detectPlatform', () => {
  it('reports a plain browser when no shell global is present', () => {
    const info = detectPlatform();
    expect(info.shell).toBe('browser');
    expect(info.platform).toBe('web');
  });

  it('reads the platform out of the Capacitor global', () => {
    g['Capacitor'] = { getPlatform: () => 'ios' };
    expect(detectPlatform()).toMatchObject({ shell: 'capacitor', platform: 'ios' });

    g['Capacitor'] = { getPlatform: () => 'android' };
    expect(detectPlatform()).toMatchObject({ shell: 'capacitor', platform: 'android' });
  });

  it('ignores a Capacitor global reporting "web" — that is the browser shell', () => {
    g['Capacitor'] = { getPlatform: () => 'web' };
    expect(detectPlatform().shell).toBe('browser');
  });

  it('survives a malformed Capacitor global rather than throwing', () => {
    g['Capacitor'] = { getPlatform: 'not a function' };
    expect(detectPlatform().shell).toBe('browser');
    g['Capacitor'] = null;
    expect(detectPlatform().shell).toBe('browser');
    g['Capacitor'] = { getPlatform: () => 42 };
    expect(detectPlatform().shell).toBe('browser');
  });

  it('distinguishes Tauri on Windows from Tauri on macOS', () => {
    g['__TAURI_INTERNALS__'] = {};
    g['navigator'] = { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' };
    expect(detectPlatform()).toMatchObject({ shell: 'tauri', platform: 'windows' });

    g['navigator'] = { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' };
    expect(detectPlatform()).toMatchObject({ shell: 'tauri', platform: 'macos' });
  });

  it('recognises the legacy __TAURI__ global too', () => {
    g['__TAURI__'] = {};
    g['navigator'] = { userAgent: 'Mozilla/5.0 (Windows NT 10.0)' };
    expect(detectPlatform().shell).toBe('tauri');
  });

  it('defaults to hover-capable and motion-allowed when matchMedia is unavailable', () => {
    const info = detectPlatform();
    expect(info.hasFinePointer).toBe(true);
    expect(info.prefersReducedMotion).toBe(false);
  });

  it('honours the media queries when matchMedia exists', () => {
    g['matchMedia'] = (query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
    });
    const info = detectPlatform();
    expect(info.hasFinePointer).toBe(false);
    expect(info.prefersReducedMotion).toBe(true);
  });
});

describe('platformLabel', () => {
  it('gives a human label for every platform', () => {
    expect(platformLabel('ios')).toBe('iOS');
    expect(platformLabel('macos')).toBe('macOS');
    expect(platformLabel('windows')).toBe('Windows');
    expect(platformLabel('android')).toBe('Android');
    expect(platformLabel('web')).toBe('Web browser');
  });
});
