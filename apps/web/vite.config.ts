import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],

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
