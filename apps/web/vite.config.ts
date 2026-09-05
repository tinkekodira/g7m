import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],

  /**
   * Relative asset URLs, so one build artefact works wherever it is served
   * from: the root in development, a `/g7m/` subpath on GitHub Pages, and the
   * custom origins Capacitor and Tauri serve from. The alternative — passing
   * `--base` per deployment — means the build differs by target, which is a
   * class of bug nobody enjoys diagnosing from a blank white screen.
   */
  base: './',

  server: {
    port: 5173,
    strictPort: true,
    // Capacitor live-reload and Tauri dev both need a host binding that is not
    // 127.0.0.1 to reach the dev server from a device or a native window.
    host: true,
  },

  build: {
    outDir: 'dist',
    // Native WebViews we target: iOS 17 (Safari 17), Android 12 (Chrome ~96+),
    // WebView2 (evergreen Chromium), macOS WKWebView. es2022 is safe across all
    // four and avoids shipping transpiled async/await to modern engines.
    target: 'es2022',
    sourcemap: true,
  },
});
