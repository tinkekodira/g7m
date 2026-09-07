import { describe, expect, it, vi } from 'vitest';
import { HAPTIC_PATTERNS, fireHaptic, type Haptic } from './haptics.js';

const KINDS: readonly Haptic[] = ['tick', 'success', 'alert'];

describe('fireHaptic', () => {
  it('passes the pattern through to the device', () => {
    const vibrate = vi.fn(() => true);
    expect(fireHaptic(vibrate, 'tick')).toBe(true);
    expect(vibrate).toHaveBeenCalledWith(HAPTIC_PATTERNS.tick);
  });

  /**
   * iOS has no `navigator.vibrate` at all — not in Safari, not in WKWebView,
   * so not in the Capacitor build. Doing nothing is the correct behaviour
   * there, and it must be silent rather than thrown.
   */
  it('does nothing on a device without a vibrator', () => {
    expect(fireHaptic(undefined, 'alert')).toBe(false);
  });

  it('swallows a vibrator that throws', () => {
    // Some embedded WebViews declare it and throw on use. A failed buzz must
    // never take the logged set down with it.
    const vibrate = vi.fn(() => {
      throw new Error('no permission');
    });
    expect(fireHaptic(vibrate, 'tick')).toBe(false);
  });
});

describe('the patterns', () => {
  it('has one for every kind', () => {
    for (const kind of KINDS) {
      expect(HAPTIC_PATTERNS[kind].length, kind).toBeGreaterThan(0);
    }
  });

  /**
   * A vibration long enough to be described as a vibration reads as a phone
   * call. These are meant to be felt and not thought about.
   */
  it('keeps every pulse short enough not to read as a phone call', () => {
    for (const kind of KINDS) {
      for (const pulse of HAPTIC_PATTERNS[kind]) {
        expect(pulse, kind).toBeGreaterThan(0);
        expect(pulse, kind).toBeLessThanOrEqual(100);
      }
    }
  });

  it('keeps the whole thing under half a second', () => {
    for (const kind of KINDS) {
      const total = HAPTIC_PATTERNS[kind].reduce((sum, part) => sum + part, 0);
      expect(total, kind).toBeLessThan(500);
    }
  });

  /**
   * `tick` answers a finger already on the glass; `alert` has to carry through
   * a pocket. If they ever end up the same length, one of them is wrong.
   */
  it('makes the one nobody is looking at the loudest', () => {
    const total = (kind: Haptic): number =>
      HAPTIC_PATTERNS[kind].reduce((sum, part) => sum + part, 0);
    expect(total('alert')).toBeGreaterThan(total('success'));
    expect(total('success')).toBeGreaterThan(total('tick'));
  });
});
