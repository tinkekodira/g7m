/**
 * Telling the lifter something without them looking.
 *
 * The rest timer already knows when rest is over. Until now it said so on a
 * screen that was face-down on a bench, which is the one place the information
 * was no use. A buzz reaches a phone in a pocket.
 *
 * ## No setting for this
 *
 * Both platforms already have one. Android routes `navigator.vibrate` through
 * the system haptics setting and iOS does the same for its native equivalent,
 * so a phone with haptics off stays silent without the app knowing anything
 * about it. Adding a switch in Settings would mean a profile column, a
 * migration and a second source of truth that can disagree with the first.
 *
 * ## iOS, where the web has nothing to offer
 *
 * `navigator.vibrate` does not exist on iOS — not in Safari, not in WKWebView.
 * The native build asks the phone directly instead, through
 * `@capacitor/haptics`, which is also a better buzz than the motor: a light
 * tap for a ticked set, the system's own "that worked" for a finished
 * workout. See `lib/native/shell.ts` and ADR-0074. A browser still gets
 * `navigator.vibrate`, and anything with neither stays silent.
 */

import { isNative, nativeBuzz } from './native/shell.js';

export type Haptic = 'tick' | 'success' | 'alert';

/**
 * Patterns, in milliseconds, alternating buzz and pause.
 *
 * Short. A vibration long enough to be described as a vibration reads as a
 * phone call; these are meant to be felt and not thought about. `alert` is the
 * only one with any length to it, because it has to carry through a pocket and
 * a hoodie rather than through a fingertip already touching the glass.
 */
export const HAPTIC_PATTERNS: Record<Haptic, readonly number[]> = {
  /** A set ticked off. Answers the finger that is already on the screen. */
  tick: [12],
  /** Something worth a moment: a workout finished. */
  success: [18, 55, 30],
  /** Rest is over, and nobody is looking at the phone. */
  alert: [45, 90, 45, 90, 70],
};

export type Vibrator = (pattern: number | readonly number[]) => boolean;

/**
 * The whole of the logic, with the platform passed in.
 *
 * Returns whether anything actually happened, which is only useful to the
 * test — every caller wants "buzz if you can, otherwise carry on".
 */
export function fireHaptic(vibrate: Vibrator | undefined, kind: Haptic): boolean {
  if (typeof vibrate !== 'function') return false;
  try {
    return vibrate(HAPTIC_PATTERNS[kind]);
  } catch {
    // Some embedded WebViews declare it and throw on use, and a failed buzz
    // must never take a logged set down with it.
    return false;
  }
}

/**
 * Buzz, if this device can. Safe to call anywhere, including on iOS.
 *
 * The native haptics are asked first and answer asynchronously; the web
 * fallback is only used when there is no native shell, so the two can never
 * both fire for one buzz.
 */
export function buzz(kind: Haptic): void {
  if (isNative()) {
    void nativeBuzz(kind);
    return;
  }
  if (typeof navigator === 'undefined') return;
  // `lib.dom` says this is always there. iOS says otherwise, and reading it
  // off the prototype through `bind` would be the crash rather than the
  // graceful no-op this is supposed to be.
  const vibrate = (navigator as unknown as { vibrate?: Vibrator }).vibrate;
  fireHaptic(typeof vibrate === 'function' ? vibrate.bind(navigator) : undefined, kind);
}
