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
 * - **With a dialog or sheet open**, close it, the way Escape does. Before,
 *   back went past it to the screen underneath — or, in a workout, did
 *   nothing at all with the dialog still up.
 * - **In a workout**, go Home and leave the workout running. It is still
 *   there, one tap away in the strip at the top of Home. Doing nothing made
 *   the gesture every other Android app answers feel broken; going back
 *   through history could land on the exercise picker the workout came from.
 * - **Anywhere with somewhere to go back to**, the browser's own history,
 *   which is what the back arrow in every other screen does.
 * - **At the top of the app**, put it in the background, as Android's own
 *   apps do. Not exit: killing the process would drop a queued upload.
 */
export type BackAction = 'dismiss' | 'home' | 'back' | 'minimize';

export function backAction(hash: string, canGoBack: boolean, layerOpen = false): BackAction {
  if (layerOpen) return 'dismiss';
  const route = hash.replace(/^#/, '').split('?')[0] ?? '/';
  if (route === '/workout' || route.startsWith('/workout/')) return 'home';
  return canGoBack ? 'back' : 'minimize';
}

/**
 * What the back gesture closes: an open dialog, or anything marked modal.
 *
 * Every one of them already closes on Escape — a native `<dialog>` through
 * its `cancel` event, the rest through a keydown handler — because that is
 * what a keyboard needs. Back sends the same, so there is no second list of
 * dialogs to keep in step with the first.
 */
export const LAYER_SELECTOR = 'dialog[open], [aria-modal="true"]';

/**
 * The top one, when more than one is open.
 *
 * A modal `<dialog>` is in the top layer, above everything in the page
 * however late it arrived, so the last of those wins; otherwise the last in
 * document order, which is the one drawn on top.
 */
export function topLayer<T extends { readonly topLayer: boolean }>(open: readonly T[]): T | null {
  return open.findLast((layer) => layer.topLayer) ?? open.at(-1) ?? null;
}

/**
 * Who keeps the screen awake during a workout.
 *
 * The Screen Wake Lock API is missing from every iOS WebView, whatever the
 * version, so on an iPhone the browser has nothing to offer and the phone
 * locks thirty seconds after it is set down on the bench. The native builds
 * ask the system instead. A browser that has the API uses it; anything with
 * neither lets the screen sleep, which is the old behaviour.
 */
export type WakeLockBackend = 'native' | 'web' | 'none';

export function wakeLockBackend(input: {
  readonly native: boolean;
  readonly hasWebApi: boolean;
}): WakeLockBackend {
  if (input.native) return 'native';
  return input.hasWebApi ? 'web' : 'none';
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
