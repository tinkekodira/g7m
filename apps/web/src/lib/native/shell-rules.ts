/**
 * What the native shell should do, as decisions that can be tested.
 *
 * The plugins themselves need a device; these do not. Anything here is a
 * question with a right answer — which haptic a buzz is on a phone, what the
 * back button means on this screen, what colour the status bar is in this
 * theme — and is kept out of `shell.ts`, where nothing can be run without
 * Android or iOS in the room. ADR-0074.
 */
import type { Haptic } from '../haptics.js';
import { colorTokens, lightColorTokens } from '@g7m/ui';
import type { Theme } from '../theme.js';

/**
 * A buzz, as the native APIs describe one.
 *
 * `impact` is a tap against the glass, `notification` is a pattern the system
 * owns, and `vibrate` is a plain motor buzz of a given length. The mapping
 * matters: iOS has no `navigator.vibrate` at all, so before this the phone
 * the app is mostly used on did nothing.
 */
export type NativeHaptic =
  | { readonly call: 'impact'; readonly style: 'Light' | 'Medium' | 'Heavy' }
  | { readonly call: 'notification'; readonly type: 'Success' | 'Warning' | 'Error' }
  | { readonly call: 'vibrate'; readonly durationMs: number };

export function nativeHaptic(kind: Haptic): NativeHaptic {
  switch (kind) {
    // A set ticked off, answering the finger already on the screen.
    case 'tick':
      return { call: 'impact', style: 'Light' };
    // A workout finished, or a badge earned: the system's own "that worked".
    case 'success':
      return { call: 'notification', type: 'Success' };
    // Rest is over and the phone is in a pocket. A single tap would not be
    // felt through a hoodie, so this one is a plain buzz with length to it.
    case 'alert':
      return { call: 'vibrate', durationMs: 400 };
  }
}

/**
 * The status bar's text colour, named as the plugin names it.
 *
 * Backwards from how it reads: `Dark` means dark *content* — black text, for
 * a light background. The app's dark theme therefore wants `Light`.
 */
export function statusBarStyle(theme: Theme): 'Light' | 'Dark' {
  return theme === 'dark' ? 'Light' : 'Dark';
}

/** What sits behind the status bar on Android, where it is not transparent. */
export function statusBarBackground(theme: Theme): string {
  return theme === 'dark' ? colorTokens['bg-base'] : lightColorTokens['bg-base'];
}

/**
 * What Android's back gesture means here.
 *
 * - **In a workout**, nothing. The workout is somewhere you are *in*, with a
 *   header link and Finish as the ways out; a back swipe mid-set that threw
 *   away the screen would be the same mistake the tab bar is hidden to avoid.
 * - **Anywhere with somewhere to go back to**, the browser's own history,
 *   which is what the back arrow in every other screen does.
 * - **At the top of the app**, put it in the background, as Android's own
 *   apps do. Not exit: killing the process would drop a queued upload.
 */
export type BackAction = 'ignore' | 'back' | 'minimize';

export function backAction(hash: string, canGoBack: boolean): BackAction {
  const route = hash.replace(/^#/, '').split('?')[0] ?? '/';
  if (route.startsWith('/workout')) return 'ignore';
  return canGoBack ? 'back' : 'minimize';
}

/**
 * Whether a URL the system handed the app is the end of a sign-in.
 *
 * Google sends the browser back to `g7m://auth-callback?code=…`, which the
 * system routes here. Anything else opening the app is not ours to act on.
 */
export function authCodeFrom(url: string, scheme: string): string | null {
  if (!url.toLowerCase().startsWith(`${scheme.toLowerCase()}://`)) return null;
  try {
    const parsed = new URL(url);
    // The code can arrive in the query or, for the implicit flow, the hash.
    const code =
      parsed.searchParams.get('code') ?? new URLSearchParams(parsed.hash.slice(1)).get('code');
    return code === null || code === '' ? null : code;
  } catch {
    return null;
  }
}
