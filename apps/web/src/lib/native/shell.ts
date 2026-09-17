/**
 * The native shell, where the app is an app rather than a page. ADR-0074.
 *
 * Everything here is the same web build running inside Capacitor, asking the
 * phone for the few things a browser cannot give it: a real haptic on iOS, a
 * status bar in the app's own colours, a splash screen that leaves when the
 * app is actually ready, and Android's back gesture.
 *
 * Three rules hold it together:
 *
 * - **Nothing is imported until it is needed.** Every plugin is a dynamic
 *   import behind a platform check, so a browser tab never downloads code
 *   for a phone it is not.
 * - **Nothing here is allowed to fail loudly.** A plugin missing from a build,
 *   an old WebView, a permission refused — none of that is worth a crash in a
 *   gym. Each call is wrapped, and the app carries on without it.
 * - **The decisions live next door** in `shell-rules.ts`, where they can be
 *   tested without a device.
 */
import { detectPlatform } from '../../platform.js';
import type { Haptic } from '../haptics.js';
import type { Theme } from '../theme.js';
import {
  backAction,
  nativeHaptic,
  statusBarBackground,
  statusBarStyle,
  type BackAction,
} from './shell-rules.js';

/**
 * The app's own URL scheme, registered in both native projects.
 *
 * `g7m://auth-callback` is where Google sends the browser at the end of a
 * sign-in; the system hands it to the app, which is how a native app gets a
 * session without the OAuth page ever being inside the app's own WebView —
 * which Google refuses to serve anyway.
 */
export const APP_SCHEME = 'g7m';
export const AUTH_CALLBACK_URL = `${APP_SCHEME}://auth-callback`;

export function nativePlatform(): 'ios' | 'android' | null {
  const { shell, platform } = detectPlatform();
  if (shell !== 'capacitor') return null;
  return platform === 'ios' || platform === 'android' ? platform : null;
}

export function isNative(): boolean {
  return nativePlatform() !== null;
}

/** Runs `attempt`, and treats any failure as "this device cannot do that". */
async function tryNative<T>(what: string, attempt: () => Promise<T>): Promise<T | null> {
  try {
    return await attempt();
  } catch (error: unknown) {
    // Logged, not shown. None of this is worth a message mid-workout.
    console.warn(`Native ${what} is unavailable`, error);
    return null;
  }
}

/**
 * A buzz through the phone's own haptics.
 *
 * Returns whether it happened, so the caller can fall back to
 * `navigator.vibrate` — which is the whole story on Android's browser and does
 * not exist at all on iOS.
 */
export async function nativeBuzz(kind: Haptic): Promise<boolean> {
  if (!isNative()) return false;
  const done = await tryNative('haptics', async () => {
    const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics');
    const wanted = nativeHaptic(kind);
    switch (wanted.call) {
      case 'impact':
        await Haptics.impact({ style: ImpactStyle[wanted.style] });
        return true;
      case 'notification':
        await Haptics.notification({ type: NotificationType[wanted.type] });
        return true;
      case 'vibrate':
        await Haptics.vibrate({ duration: wanted.durationMs });
        return true;
    }
  });
  return done === true;
}

/**
 * The status bar, in the theme the app is in.
 *
 * On iOS the WebView draws under it, so only the text colour is ours to set.
 * On Android the bar is its own strip and is painted to match the background,
 * so the app does not end in a black band at the top.
 */
export async function applyNativeChrome(theme: Theme): Promise<void> {
  const platform = nativePlatform();
  if (platform === null) return;
  await tryNative('status bar', async () => {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style[statusBarStyle(theme)] });
    if (platform === 'android') {
      await StatusBar.setBackgroundColor({ color: statusBarBackground(theme) });
    }
  });
}

/**
 * Take the splash screen away.
 *
 * Called once the app has something to show — a session restored, or the
 * sign-in screen — rather than on a timer. `launchAutoHide` is off in
 * `capacitor.config.ts` precisely so that this is the thing that decides.
 */
export async function hideSplash(): Promise<void> {
  if (!isNative()) return;
  await tryNative('splash screen', async () => {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide({ fadeOutDuration: 200 });
  });
}

/**
 * Android's back gesture, wired to the app's own idea of back.
 *
 * Returns a function that stops listening. iOS has no such button and this
 * does nothing there.
 */
export function listenForBackButton(act: (action: BackAction) => void): () => void {
  if (nativePlatform() !== 'android') return () => undefined;
  let remove: (() => void) | null = null;
  let stopped = false;

  void tryNative('back button', async () => {
    const { App } = await import('@capacitor/app');
    const handle = await App.addListener('backButton', ({ canGoBack }) => {
      act(backAction(globalThis.location.hash, canGoBack));
    });
    if (stopped) {
      await handle.remove();
      return true;
    }
    remove = () => {
      void handle.remove();
    };
    return true;
  });

  return () => {
    stopped = true;
    remove?.();
  };
}

/** Put the app in the background, as Android's own apps do at the top level. */
export async function minimizeApp(): Promise<void> {
  if (nativePlatform() !== 'android') return;
  await tryNative('minimize', async () => {
    const { App } = await import('@capacitor/app');
    await App.minimizeApp();
    return true;
  });
}

/** A URL the system handed the app: the end of a sign-in, or a shared link. */
export function listenForAppUrl(handle: (url: string) => void): () => void {
  if (!isNative()) return () => undefined;
  let remove: (() => void) | null = null;
  let stopped = false;

  void tryNative('app URL', async () => {
    const { App } = await import('@capacitor/app');
    const listener = await App.addListener('appUrlOpen', ({ url }) => {
      handle(url);
    });
    if (stopped) {
      await listener.remove();
      return true;
    }
    remove = () => {
      void listener.remove();
    };
    return true;
  });

  return () => {
    stopped = true;
    remove?.();
  };
}

/**
 * Open a page outside the app, in the system browser.
 *
 * Sign-in goes through here rather than through the app's own WebView:
 * Google refuses to serve its consent screen inside an embedded one
 * (`disallowed_useragent`), and it is the right answer anyway — the password
 * is typed into the browser, not into us.
 */
export async function openExternal(url: string): Promise<boolean> {
  if (!isNative()) return false;
  const opened = await tryNative('browser', async () => {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url, presentationStyle: 'popover' });
    return true;
  });
  return opened === true;
}

/** Close the in-app browser, once the sign-in that opened it has come back. */
export async function closeExternal(): Promise<void> {
  if (!isNative()) return;
  await tryNative('browser', async () => {
    const { Browser } = await import('@capacitor/browser');
    await Browser.close();
    return true;
  });
}
