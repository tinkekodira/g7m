import { useEffect } from 'react';
import { useThemeStore } from '../use-theme.js';
import { applyNativeChrome, hideSplash, listenForBackButton, minimizeApp } from './shell.js';

/**
 * The three things the shell has to be told, wired into the app's lifetime.
 * ADR-0074. In a browser every one of them is a no-op.
 *
 * - **The status bar** follows the theme, on every change, so switching to the
 *   light theme does not leave white text on a white bar.
 * - **The splash screen** goes when the app has something to show rather than
 *   on a timer. On a cold start that is the moment the session is known: a
 *   splash that leaves early shows a blank screen, and one that leaves late
 *   makes a fast start look slow.
 * - **Android's back gesture** does what back means on that screen.
 */
export function useNativeShell(ready: boolean): void {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    void applyNativeChrome(theme);
  }, [theme]);

  useEffect(() => {
    if (ready) void hideSplash();
  }, [ready]);

  useEffect(
    () =>
      listenForBackButton((action) => {
        // `history.back()` rather than the router's navigate: this is mounted
        // outside the router, because the back button exists on the sign-in
        // screen too, and a HashRouter's history *is* the browser's.
        if (action === 'back') globalThis.history.back();
        if (action === 'minimize') void minimizeApp();
      }),
    [],
  );
}
