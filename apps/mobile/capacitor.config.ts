import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

/**
 * Capacitor shell config. Brief §4.1: this app stays thin — native
 * configuration only. Application code lives in apps/web and is copied in.
 */
const config: CapacitorConfig = {
  appId: 'app.g7m.trainer',
  appName: 'g7m',

  /**
   * The web build output, not a source directory. `pnpm sync` builds apps/web
   * first and then copies dist/ into the native projects. What lands inside
   * ios/ and android/ is generated and gitignored (see .gitignore).
   */
  webDir: '../web/dist',

  ios: {
    // Match --bg-base so there is no white flash between splash and first paint.
    backgroundColor: '#1F1E1D',
    // The app owns its own scrolling; the WebView bouncing over it feels wrong.
    scrollEnabled: true,
    contentInset: 'never',
  },

  plugins: {
    /**
     * The splash stays until the app takes it away (`hideSplash`, ADR-0074).
     * A timed splash is either too short — a blank screen while the database
     * opens — or too long, which makes a fast start look slow.
     */
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#1F1E1D',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },

    /**
     * The WebView shrinks when the keyboard opens, so the set being typed
     * stays above it rather than under it. `native` is the smoothest of the
     * iOS modes; on Android the same is done with the full-screen flag.
     */
    Keyboard: {
      resize: KeyboardResize.Native,
      resizeOnFullScreen: true,
    },
  },

  android: {
    backgroundColor: '#1F1E1D',
    // Brief §3: Android 12+ only, so no legacy WebView workarounds needed.
    allowMixedContent: false,
    captureInput: true,
  },

  server: {
    androidScheme: 'https',
  },
};

export default config;
