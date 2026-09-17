import { describe, expect, it } from 'vitest';
import { colorTokens, lightColorTokens } from '@g7m/ui';
import {
  authCodeFrom,
  backAction,
  nativeHaptic,
  statusBarBackground,
  statusBarStyle,
} from './shell-rules.js';

describe('haptics on a phone', () => {
  it('taps for a set, congratulates a finish, and buzzes properly for rest', () => {
    expect(nativeHaptic('tick')).toEqual({ call: 'impact', style: 'Light' });
    expect(nativeHaptic('success')).toEqual({ call: 'notification', type: 'Success' });
    // Long enough to be felt through a pocket, which a single tap is not.
    expect(nativeHaptic('alert')).toEqual({ call: 'vibrate', durationMs: 400 });
  });
});

describe('the status bar', () => {
  /** `Dark` means dark text. The dark theme therefore asks for `Light`. */
  it('asks for the text colour the theme can be read against', () => {
    expect(statusBarStyle('dark')).toBe('Light');
    expect(statusBarStyle('light')).toBe('Dark');
  });

  it('paints itself the theme’s own background', () => {
    expect(statusBarBackground('dark')).toBe(colorTokens['bg-base']);
    expect(statusBarBackground('light')).toBe(lightColorTokens['bg-base']);
  });
});

describe('the Android back button', () => {
  it('goes back through the app’s own history', () => {
    expect(backAction('#/progress', true)).toBe('back');
    expect(backAction('#/exercises/barbell-bench-press', true)).toBe('back');
  });

  it('puts the app in the background at the top, rather than closing it', () => {
    expect(backAction('#/', false)).toBe('minimize');
    expect(backAction('', false)).toBe('minimize');
  });

  /** A back swipe mid-set must not be a way to lose the workout screen. */
  it('does nothing inside a workout', () => {
    expect(backAction('#/workout', true)).toBe('ignore');
    expect(backAction('#/workout?rest=1', false)).toBe('ignore');
  });
});

describe('the sign-in coming back', () => {
  it('takes the code off the app’s own URL', () => {
    expect(authCodeFrom('g7m://auth-callback?code=abc123', 'g7m')).toBe('abc123');
    expect(authCodeFrom('G7M://auth-callback?code=abc123', 'g7m')).toBe('abc123');
    // The implicit flow puts it in the fragment instead.
    expect(authCodeFrom('g7m://auth-callback#code=xyz', 'g7m')).toBe('xyz');
  });

  it('ignores anything that is not a sign-in coming back', () => {
    expect(authCodeFrom('https://example.test/?code=abc', 'g7m')).toBeNull();
    expect(authCodeFrom('g7m://auth-callback', 'g7m')).toBeNull();
    expect(authCodeFrom('g7m://auth-callback?error=access_denied', 'g7m')).toBeNull();
    expect(authCodeFrom('not a url at all', 'g7m')).toBeNull();
  });
});
